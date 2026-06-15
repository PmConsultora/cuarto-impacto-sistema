// Service Worker mínimo para PWA del Cuarto Impacto
// Hace que la app sea "instalable" y funcione básicamente offline para el shell.

const CACHE_NAME = 'cuarto-impacto-v1';
const SHELL_URLS = [
  '/',
  '/panel.html',
  '/css/styles.css',
  '/js/api.js',
  '/js/panel.js',
  '/img/logo.svg',
  '/img/logo-white.svg',
  '/manifest.json',
];

// Install: precargar el shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate: limpiar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para API, cache-first para assets del shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API: siempre red (no cachear datos)
  if (url.pathname.startsWith('/api/')) {
    return; // dejar que el navegador maneje normal
  }

  // Assets estáticos: cache-first con fallback a red
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        // Cachear opportunísticamente solo respuestas OK del mismo origen
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
    })
  );
});
