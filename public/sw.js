// Minimal offline-first service worker: precache the app shell and serve cached
// assets when the network is unavailable. For richer runtime caching you can
// swap this for @ducanh2912/next-pwa (see README), but this keeps the build
// dependency-free and fully under our control.
const CACHE = 'sea-trip-v2';
const APP_SHELL = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Never cache Supabase API / auth traffic — it must always hit the network.
  if (request.method !== 'GET' || request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// --- Web push -----------------------------------------------------------
// Payload shape (JSON): { title, body, tag, url }. The tag makes a newer
// batch digest replace the previous one instead of stacking.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* malformed payload — show a generic notification */
  }
  const title = data.title || 'Trip update';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag: data.tag || 'trip',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
    })
  );
});

// Clicking a notification focuses an open app window if there is one,
// otherwise opens a new one at the deep-link URL.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if ('focus' in client) {
            if (client.url !== new URL(url, self.location.origin).href && 'navigate' in client) {
              client.navigate(url);
            }
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
