// Sends a Web Push notification to every other member of a group when one
// of them adds an expense. Invoked directly by the client (fire-and-forget,
// see createExpense() in src/lib/expenses.ts) right after create_expense()
// succeeds -- there's no database webhook/trigger involved, so a failure
// here never blocks or rolls back the expense itself.
//
// Deploy: `supabase functions deploy notify-expense`
// Secrets it needs (see supabase/functions/notify-expense/README.md):
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are injected
// automatically by the Supabase platform -- nothing to set for those.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')
const SITE_URL = Deno.env.get('SITE_URL') ?? ''

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

type NotifyBody = { expenseId: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return new Response(JSON.stringify({ error: 'push not configured' }), {
      status: 501,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { expenseId } = (await req.json()) as NotifyBody
    if (!expenseId) throw new Error('expenseId is required')

    const authHeader = req.headers.get('Authorization') ?? ''

    // Caller-scoped client: identifies who's asking, under RLS, so an
    // arbitrary caller can't make this function spam a group they aren't
    // in -- it can only ever see the expense/group/actor if the caller's
    // own membership already grants it.
    const callerClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await callerClient.auth.getUser()
    if (!user) throw new Error('not authenticated')

    const { data: expense, error: expenseError } = await callerClient
      .from('expenses')
      .select('id, group_id, description, amount, paid_by')
      .eq('id', expenseId)
      .single()
    if (expenseError || !expense) throw new Error('expense not found or not visible to caller')

    // Service-role client from here on: fetching every member's push
    // subscription is inherently a cross-member read that RLS (rightly)
    // doesn't allow a regular member to do directly.
    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const [{ data: group }, { data: members }, { data: actorMember }] = await Promise.all([
      adminClient.from('groups').select('id, name, currency').eq('id', expense.group_id).single(),
      adminClient.from('group_members').select('id, display_name, user_id').eq('group_id', expense.group_id),
      adminClient.from('group_members').select('id, display_name').eq('id', expense.paid_by).single(),
    ])
    if (!group || !members) throw new Error('group not found')

    const payerName = actorMember?.display_name ?? '?'
    const title = group.name
    const body = `${payerName} added "${expense.description}" (${expense.amount} ${group.currency})`
    const url = `${SITE_URL}/g/${expense.group_id}/expenses/${expense.id}`

    // Don't notify the person who just created the expense.
    const recipientIds = members.filter((m) => m.user_id !== user.id).map((m) => m.id)
    if (recipientIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: subscriptions } = await adminClient
      .from('push_subscriptions')
      .select('id, member_id, endpoint, p256dh, auth')
      .in('member_id', recipientIds)

    let sent = 0
    const staleIds: string[] = []

    await Promise.all(
      (subscriptions ?? []).map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title, body, url }),
          )
          sent++
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) staleIds.push(sub.id)
        }
      }),
    )

    if (staleIds.length > 0) {
      await adminClient.from('push_subscriptions').delete().in('id', staleIds)
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
