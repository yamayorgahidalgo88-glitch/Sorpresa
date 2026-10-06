// Generado por tools/build_pwa.py — no editar a mano
const VERSION = 'ce-0e9902cb23';
const CORE = ['./', 'index.html', 'build.js', 'data.js', 'game.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];
const ASSETS = ['assets/crests.webp', 'assets/faces-0.webp', 'assets/faces-1.webp', 'assets/faces-10.webp', 'assets/faces-11.webp', 'assets/faces-12.webp', 'assets/faces-13.webp', 'assets/faces-14.webp', 'assets/faces-15.webp', 'assets/faces-16.webp', 'assets/faces-17.webp', 'assets/faces-18.webp', 'assets/faces-19.webp', 'assets/faces-2.webp', 'assets/faces-20.webp', 'assets/faces-21.webp', 'assets/faces-22.webp', 'assets/faces-23.webp', 'assets/faces-24.webp', 'assets/faces-25.webp', 'assets/faces-26.webp', 'assets/faces-27.webp', 'assets/faces-28.webp', 'assets/faces-29.webp', 'assets/faces-3.webp', 'assets/faces-30.webp', 'assets/faces-31.webp', 'assets/faces-32.webp', 'assets/faces-33.webp', 'assets/faces-34.webp', 'assets/faces-35.webp', 'assets/faces-36.webp', 'assets/faces-37.webp', 'assets/faces-38.webp', 'assets/faces-39.webp', 'assets/faces-4.webp', 'assets/faces-40.webp', 'assets/faces-41.webp', 'assets/faces-5.webp', 'assets/faces-6.webp', 'assets/faces-7.webp', 'assets/faces-8.webp', 'assets/faces-9.webp', 'assets/flags.webp'];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE);
    // las imágenes se guardan una a una: si alguna falla, el resto sigue y se reintentará al usarla
    await Promise.all(ASSETS.map(a => c.add(a).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION && k.startsWith('ce-')) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // tipografías de Google: las gestiona el navegador
  const isImg = /\.(webp|png|jpg|jpeg|svg|ico)$/.test(url.pathname);
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    if (isImg) {   // imágenes: primero la copia guardada (rápido y sin conexión)
      const hit = await c.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
    }
    try {          // página, código y datos: primero la red, para que las actualizaciones lleguen siempre
      const r = await fetch(e.request, isImg ? undefined : { cache: 'no-cache' });
      if (r.ok) c.put(e.request, r.clone());
      return r;
    } catch (err) {
      const hit = await c.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      if (e.request.mode === 'navigate') return (await c.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
