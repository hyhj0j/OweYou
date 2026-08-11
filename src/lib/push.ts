// Standard Web Push helpers. Wired up from Settings: enablePushForMember()
// asks for Notification permission, subscribes via PushManager using
// VITE_VAPID_PUBLIC_KEY, and persists the subscription against the caller's
// group_members row (push_subscriptions.member_id) so notify-expense
// (supabase/functions/notify-expense) knows where to send a push when
// someone in that group adds an expense. See src/sw.ts for the matching
// 'push' / 'notificationclick' listeners.

import { supabase } from './supabaseClient'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  if (existing) return existing
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  })
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  await subscription?.unsubscribe()
}

export async function savePushSubscription(memberId: string, subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { member_id: memberId, endpoint: json.endpoint!, p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      { onConflict: 'member_id,endpoint' },
    )
  if (error) throw error
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

/** Whether this browser's current push subscription (if any) is saved
 *  against `memberId` -- i.e. whether notifications are on for that
 *  member's group in this browser. */
export async function isPushEnabledForMember(memberId: string): Promise<boolean> {
  const subscription = await getCurrentPushSubscription()
  if (!subscription) return false
  const endpoint = subscription.toJSON().endpoint!
  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('endpoint', endpoint)
  if (error) throw error
  return !!count
}

/** Asks for notification permission, subscribes this browser, and saves the
 *  subscription for `memberId` (the caller's group_members row in the
 *  group being enabled). Throws if permission is denied or push isn't
 *  supported -- callers should catch and show that as an error state. */
export async function enablePushForMember(memberId: string, vapidPublicKey: string): Promise<void> {
  if (!isPushSupported()) throw new Error('push not supported')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permission denied')
  const subscription = await subscribeToPush(vapidPublicKey)
  if (!subscription) throw new Error('subscription failed')
  await savePushSubscription(memberId, subscription)
}

/** Removes this browser's saved subscription for `memberId`. The same
 *  browser subscription may still be saved against other groups' member
 *  rows (Settings' toggle is per-group), so the browser itself is only
 *  unsubscribed once no row anywhere still references it. */
export async function disablePushForMember(memberId: string): Promise<void> {
  const subscription = await getCurrentPushSubscription()
  if (!subscription) return
  const endpoint = subscription.toJSON().endpoint!

  const { error: deleteError } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('member_id', memberId)
    .eq('endpoint', endpoint)
  if (deleteError) throw deleteError

  const { count, error: countError } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('endpoint', endpoint)
  if (countError) throw countError
  if (!count) await unsubscribeFromPush()
}
