const CACHE = 'bahasa-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// Show notification triggered from the page
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'SHOW_NOTIFICATION') return
  const { title, body } = e.data
  self.registration.showNotification(title, {
    body,
    icon: 'img/logo.png',
    badge: 'img/logo.png',
    tag: 'bahasa-review',
    renotify: true,
    vibrate: [200, 100, 200],
  })
})

// Click notification → focus or open the app
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const app = list.find(c => c.url.includes('bahasabelajar') || c.url.includes('localhost') || c.url.includes('127.0.0.1'))
      if (app) return app.focus()
      return self.clients.openWindow(self.registration.scope)
    })
  )
})
