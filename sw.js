/* Lexicon service worker — offline shell + Android share target */
const VERSION = 'lexicon-v2';
const SHELL   = 'shell-' + VERSION;
const RUNTIME = 'runtime-' + VERSION;
const SHARED  = 'shared-media';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => ![SHELL, RUNTIME, SHARED].includes(k))
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function runtimeCacheable(url) {
  return (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'   ||
    url.hostname === 'cdn.jsdelivr.net'    ||
    url.hostname === 'unpkg.com' ||
    url.hostname === 'tessdata.projectnaptha.com'
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Android share sheet delivers an image here (POST multipart)
  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith((async () => {
      try {
        const form = await req.formData();
        const file = form.get('image');
        if (file && file.size) {
          const cache = await caches.open(SHARED);
          await cache.put('shared-image', new Response(file, {
            headers: { 'Content-Type': file.type || 'image/png' }
          }));
        }
      } catch (_) { /* fall through to the app either way */ }
      const dest = new URL('./?shared=1', self.location.href).href;
      return Response.redirect(dest, 303);
    })());
    return;
  }

  if (req.method !== 'GET') return;

  // 2. Page loads: serve the cached app, reach for the network only if needed
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((r) => r || fetch(req).catch(() => caches.match('./index.html')))
    );
    return;
  }

  // 3. Our own files: cache first
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(req).then((r) => r || fetch(req)));
    return;
  }

  // 4. Fonts + OCR engine: serve cached copy, refresh in the background
  if (runtimeCacheable(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      const network = fetch(req).then((resp) => {
        if (resp && (resp.ok || resp.type === 'opaque')) cache.put(req, resp.clone());
        return resp;
      }).catch(() => cached);
      return cached || network;
    })());
    return;
  }

  // 5. Everything else (dictionary lookups): straight to the network
});
