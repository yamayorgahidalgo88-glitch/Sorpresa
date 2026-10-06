// Offline cache for the installable (home screen) version. Not used on CrazyGames.
const CACHE = 'spike-duel-v4';
const ASSETS = ['./', 'style.css', 'sdk.js', 'game.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// network first so updates arrive, but never wait long: on a slow or missing connection the
// saved copy is used after 2.5 s (the game itself is fully offline once loaded)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const fromNet = fetch(e.request.url, { cache: 'no-cache' }).then(res => {
    // only keep good copies (never an error page or a page with the wrong type)
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 2500));
  e.respondWith(Promise.race([fromNet, timeout]).catch(() => caches.match(e.request).then(hit => hit || fromNet)));
});
