/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

self.skipWaiting()
clientsClaim()

// App shell only -- Supabase requests are never routed through this SW, so
// data always comes straight from the network.
precacheAndRoute(self.__WB_MANIFEST)

// ---------------------------------------------------------------------------
// Web Push. src/lib/push.ts subscribes via PushManager and saves the
// subscription to push_subscriptions; supabase/functions/notify-expense
// sends the actual push when someone adds an expense. These listeners show
// it and route a tap to the expense.
// ---------------------------------------------------------------------------

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return
  const payload = event.data.json() as { title?: string; body?: string; url?: string }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'oh-we you!', {
      body: payload.body,
      data: { url: payload.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/'
  event.waitUntil(self.clients.openWindow(url))
})

// Fires when the push subscription is invalidated by the browser/OS and needs
// to be re-created. Re-subscribing and persisting the new endpoint to the
// `push_subscriptions` table (see supabase/migrations/0001_init.sql) is left
// for whenever Web Push is actually wired up.
self.addEventListener('pushsubscriptionchange', () => {})
