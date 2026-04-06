const CACHE_NAME = 'obsidian-lens-v1'
const OFFLINE_URLS = ['/', '/nutrition', '/history', '/settings']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
        }
        return res
      })
      .catch(() => caches.match(event.request))
  )
})

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Obsidian Lens'
  const options = {
    body: data.body || 'Time to check in!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'obsidian-default',
    renotify: true,
    data: { url: data.url || '/' },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(url); return }
      return clients.openWindow(url)
    })
  )
})

// Background sync for scheduled reminders
const WATER_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
const WATER_START_HOUR = 7
const WATER_END_HOUR = 22

function shouldNotifyWater() {
  const h = new Date().getHours()
  return h >= WATER_START_HOUR && h < WATER_END_HOUR
}

self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_WATER') {
    scheduleWaterReminders()
  }
})

function scheduleWaterReminders() {
  setInterval(() => {
    if (shouldNotifyWater()) {
      self.registration.showNotification('Obsidian Lens 💧', {
        body: "Time to drink water! Stay on track with your hydration goal.",
        icon: '/icon-192.png',
        tag: 'water-reminder',
        renotify: true,
        vibrate: [100],
        data: { url: '/' },
      })
    }
  }, WATER_INTERVAL_MS)
}
