// Standard Web Push helpers -- not called from any UI yet. Wiring this up
// later means: ask for Notification permission, call subscribeToPush() with
// a VAPID public key, then savePushSubscription() to persist it against the
// caller's group_members row. See src/sw.ts for the matching 'push' /
// 'notificationclick' listeners and 0001_init.sql for the push_subscriptions
// table this writes to.

import { supabase } from './supabaseClient'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  const registration = await navigator.serviceWorker.ready
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
  const { error } = await supabase.from('push_subscriptions').insert({
    member_id: memberId,
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh,
    auth: json.keys!.auth,
  })
  if (error) throw error
}
