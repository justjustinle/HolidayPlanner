// Offline-capable service worker for the Planr PWA.
//
// Caching rules (important after deploys):
// - Navigations / HTML → network-first. A stale document referencing purged
//   `/_next/static/chunks/*` hashes is the usual cause of
//   "Application error: a client-side exception has occurred" in installed PWAs.
// - Hashed `/_next/static/*` → cache-first (immutable content hashes).
// - Everything else → network-first with cache fallback for offline.
// - Never cache opaque failures, non-OK responses, or `/api/*`.
const CACHE = 'sea-trip-v3';
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
      .then(() => self.clients.claim())
  );
});

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept')?.includes('text/html'))
  );
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/');
}

function shouldBypass(request, url) {
  if (request.method !== 'GET') return true;
  if (url.pathname.startsWith('/api/')) return true;
  if (url.hostname.includes('supabase.co')) return true;
  return false;
}

async function putOk(cache, request, response) {
  if (!response || !response.ok) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    /* ignore quota / opaque failures */
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    await putOk(cache, request, fresh);
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Last resort for navigations: any cached app shell.
    if (isNavigationRequest(request)) {
      const shell = await cache.match('/');
      if (shell) return shell;
    }
    throw new Error('network unavailable');
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  await putOk(cache, request, fresh);
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (shouldBypass(request, url)) return;
  // Only handle same-origin app traffic. Third-party fonts/CDNs stay on network.
  if (url.origin !== self.location.origin) return;

  if (isNavigationRequest(request) || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
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
