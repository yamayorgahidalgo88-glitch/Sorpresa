// Private page with everything she has answered. Has its own password (only for him).
import {list, get, del} from '@vercel/blob';
import {sha256, cookies, readBody} from './_comun.js';

const PASS = '06b34f05d07803174682f7749b22bb18fa6a077386176e7b4853c95cbb67c466';          // sha256 of the password
const OK = 'e5a28de167e5e27d5c71c5000f63f2704daf611ed02d1b81046a552477fdef4c';            // cookie value once logged in

const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const fmtDia = d => new Date(d + 'T12:00').toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid'});
const fmtFecha = iso => new Date(iso).toLocaleString('es-ES', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid'});
const TIPOS = {calendario: '📅 Ha elegido días', desliza: '🍳 Ha deslizado tarjetas', elige: '🃏 Ha elegido tarjetas', juego: '🎮 Ha ganado el juego',
  clave: '🔐 Ha abierto con contraseña', canje: '🎟️ Ha canjeado el ticket'};

function detalle(r) {
  const d = r.datos || {};
  if (r.tipo === 'calendario') return (d.dias || []).map(fmtDia).map(esc).join('<br>');
  if (r.tipo === 'desliza') return `<b>Sí:</b> ${esc((d.likes || []).join(', ') || '—')}<br><b>No:</b> ${esc((d.nopes || []).join(', ') || '—')}`;
  if (r.tipo === 'elige') return (d.picks || []).map((p, i) => `${i + 1}. ${esc(p)}`).join('<br>');
  return '';
}

function page(body, status = 200) {
  return [status, `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Respuestas 💚</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Great+Vibes&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Fredoka,system-ui,sans-serif;color:#1f4d33;background:#f6efe3;padding:20px 14px 40px}
h1{margin:0;text-align:center;font-size:28px}.s{display:block;text-align:center;font-family:"Great Vibes",cursive;font-size:36px;color:#9b1c1c}
.wrap{max-width:760px;margin:0 auto}.sub{text-align:center;opacity:.7;margin:4px 0 18px}
form.login{max-width:340px;margin:40px auto;text-align:center;padding:26px 20px;border-radius:20px;background:#fff8e6;box-shadow:0 0 0 3px #e2b54a,0 10px 30px rgba(0,0,0,.15)}
input{width:100%;font:600 17px Fredoka,sans-serif;text-align:center;padding:12px;border-radius:12px;border:2px solid #e2b54a;background:#fff;outline:none;margin:10px 0}
button{border:0;cursor:pointer;font:700 15px Fredoka,sans-serif;color:#fff;padding:11px 26px;border-radius:999px;background:linear-gradient(#3fd04a,#0f8a1c 55%,#0a6b14);box-shadow:0 0 0 3px #e9b93a}
.err{color:#c4161c;font-weight:600}
.card{background:#fff;border-radius:16px;padding:14px 16px;margin:0 0 12px;box-shadow:0 2px 10px rgba(0,0,0,.08);border-left:6px solid #1f6b2e}
.top{display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap}
.c{font-weight:700;font-size:18px}.f{font-size:13px;opacity:.65}.t{margin:6px 0 4px;font-weight:600;color:#9b1c1c}.d{line-height:1.5}
.del{background:none;box-shadow:none;color:#c4161c;padding:0;font-size:12px;text-decoration:underline;margin-top:8px}
.empty{text-align:center;padding:40px 10px;opacity:.7}
.bar{display:flex;justify-content:center;gap:10px;margin-bottom:16px}.bar a{color:#1f6b2e;font-weight:600}
</style></head><body><div class="wrap"><span class="s">Sus respuestas</span><h1>💚 CALENDARIO 💚</h1>${body}</div></body></html>`];
}

export default async function handler(req, res) {
  const send = ([status, html]) => res.status(status).setHeader('content-type', 'text/html; charset=utf-8').setHeader('cache-control', 'no-store').send(html);
  const logged = cookies(req).resp === OK;

  if (req.method === 'POST') {
    const b = await readBody(req).catch(() => ({}));
    if (!logged) {
      if (sha256(String(b.clave || '')) !== PASS)
        return send(page(`<form class="login" method="post"><p>Contraseña de respuestas</p><input type="password" name="clave" autofocus><button>VER</button><p class="err">Contraseña incorrecta</p></form>`, 401));
      res.setHeader('set-cookie', `resp=${OK}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
      return res.status(303).setHeader('location', '/respuestas').end();
    }
    if (b.borrar && String(b.borrar).startsWith('respuestas/')) await del(String(b.borrar));
    return res.status(303).setHeader('location', '/respuestas').end();
  }
  if (!logged) return send(page(`<form class="login" method="post"><p>Contraseña de respuestas</p><input type="password" name="clave" autofocus autocomplete="current-password"><button>VER</button></form>`, 401));

  // read everything
  let blobs = [], cursor;
  do { const r = await list({prefix: 'respuestas/', cursor, limit: 1000}); blobs.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
  const recs = (await Promise.all(blobs.map(async b => {
    try { const g = await get(b.pathname, {access: 'private', useCache: false}); if (!g) return null;
      const txt = await new Response(g.stream).text(); return {...JSON.parse(txt), path: b.pathname}; } catch { return null; }
  }))).filter(Boolean).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const body = recs.length ? recs.map(r => `<div class="card"><div class="top"><span class="c">Casita ${r.casita} · ${esc(r.titulo)}</span><span class="f">${esc(fmtFecha(r.fecha))}</span></div>
    <div class="t">${esc(TIPOS[r.tipo] || r.tipo)}</div><div class="d">${detalle(r)}</div>
    <form method="post" onsubmit="return confirm('¿Borrar esta respuesta?')"><input type="hidden" name="borrar" value="${esc(r.path)}"><button class="del">borrar</button></form></div>`).join('')
    : '<div class="empty">Todavía no ha respondido nada 🎄</div>';
  return send(page(`<p class="sub">${recs.length} respuesta${recs.length === 1 ? '' : 's'} · <a href="/respuestas">actualizar</a></p>${body}`));
}
