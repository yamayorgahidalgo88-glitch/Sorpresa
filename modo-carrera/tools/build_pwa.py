"""Genera sw.js (service worker) con la lista de archivos y una versión basada en su contenido.
Uso: python3 tools/build_pwa.py   (desde la carpeta modo-carrera, tras regenerar datos o código)"""
import hashlib, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
core = ['./', 'index.html', 'build.js', 'data.js', 'game.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
        'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png']
assets = sorted('assets/' + f for f in os.listdir(os.path.join(root, 'assets')) if f.endswith('.webp'))
h = hashlib.sha1()
for f in [c for c in core[1:] if c != 'build.js'] + assets:
    h.update(f.encode()); h.update(open(os.path.join(root, f), 'rb').read())
ver = h.hexdigest()[:10]
import datetime
label = datetime.datetime.utcnow().strftime('%d/%m %H:%M') + ' · ' + ver[:5]
open(os.path.join(root, 'build.js'), 'w').write(f"window.BUILD='{label}';\n")
h.update(open(os.path.join(root, 'build.js'), 'rb').read()); ver = h.hexdigest()[:10]
js = f"""// Generado por tools/build_pwa.py — no editar a mano
const VERSION = 'ce-{ver}';
const CORE = {core!r};
const ASSETS = {assets!r};
self.addEventListener('install', e => {{
  e.waitUntil((async () => {{
    const c = await caches.open(VERSION);
    await c.addAll(CORE);
    // las imágenes se guardan una a una: si alguna falla, el resto sigue y se reintentará al usarla
    await Promise.all(ASSETS.map(a => c.add(a).catch(() => {{}})));
    self.skipWaiting();
  }})());
}});
self.addEventListener('activate', e => {{
  e.waitUntil((async () => {{
    for (const k of await caches.keys()) if (k !== VERSION && k.startsWith('ce-')) await caches.delete(k);
    await self.clients.claim();
  }})());
}});
self.addEventListener('fetch', e => {{
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // tipografías de Google: las gestiona el navegador
  const isImg = /\\.(webp|png|jpg|jpeg|svg|ico)$/.test(url.pathname);
  e.respondWith((async () => {{
    const c = await caches.open(VERSION);
    if (isImg) {{   // imágenes: primero la copia guardada (rápido y sin conexión)
      const hit = await c.match(e.request, {{ ignoreSearch: true }});
      if (hit) return hit;
    }}
    try {{          // página, código y datos: primero la red, para que las actualizaciones lleguen siempre
      const r = await fetch(e.request, isImg ? undefined : {{ cache: 'no-cache' }});
      if (r.ok) c.put(e.request, r.clone());
      return r;
    }} catch (err) {{
      const hit = await c.match(e.request, {{ ignoreSearch: true }});
      if (hit) return hit;
      if (e.request.mode === 'navigate') return (await c.match('index.html')) || Response.error();
      return Response.error();
    }}
  }})());
}});
"""
open(os.path.join(root, 'sw.js'), 'w').write(js)
print('sw.js', ver, len(core) + len(assets), 'archivos')
