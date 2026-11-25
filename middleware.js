// Password gate for the whole site (runs on Vercel before any file is served).
// Only hashes are stored here, never the password itself.
const PASS_SHA256 = '970f693fbf0c107a0e82a93b0c8c8ed1b644467ebb702b98bedfe09f233afece';
const COOKIE = 'pase';
const COOKIE_VALUE = '392f9be867536199776427dc037f7df99d1e844fc8204a2bc3adb85fcb570cbf';

export const config = { matcher: '/:path*' };

const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
  .map(b => b.toString(16).padStart(2, '0')).join('');
const cont = () => new Response(null, { headers: { 'x-middleware-next': '1' } });   // let the request through

export default async function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname.includes('pruebas')) return cont();          // the test copy has no password
  if (url.pathname === '/respuestas' || url.pathname === '/api/respuestas') return cont();   // has its own password
  const cookies = Object.fromEntries((request.headers.get('cookie') || '').split(/;\s*/).filter(Boolean)
    .map(c => { const i = c.indexOf('='); return [c.slice(0, i), c.slice(i + 1)]; }));

  if (url.pathname === '/entrar' && request.method === 'POST') {
    const form = await request.formData();
    const clave = String(form.get('clave') || '');
    if (await sha256(clave) === PASS_SHA256) {
      return new Response(null, { status: 303, headers: {
        location: '/',
        'set-cookie': `${COOKIE}=${COOKIE_VALUE}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
      } });
    }
    return page(true);
  }
  // the contents of the houses can only be loaded by the page itself, not opened by typing the address
  if (/^\/(tickets|contenido)\.js$/.test(url.pathname) && request.headers.get('sec-fetch-dest') === 'document')
    return new Response('🎄 Aquí no hay nada que ver… ¡paciencia! 💚', {status: 403, headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store'}});
  if (cookies[COOKIE] === COOKIE_VALUE) return cont();
  return page(false);
}

function page(error) {
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex">
<title>Feliz Navidad mi vida 💚</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Great+Vibes&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{display:grid;place-items:center;padding:20px;font-family:Fredoka,system-ui,sans-serif;color:#fff3d6;
  background:radial-gradient(ellipse at 50% 30%,#0e6a2a,#03420f 60%,#022a0a)}
form{width:min(100%,360px);text-align:center;padding:30px 22px 26px;border-radius:22px;background:rgba(0,0,0,.22);
  box-shadow:0 0 0 3px #e2b54a,0 0 0 6px #7a4f08,0 0 30px rgba(255,200,60,.35),0 20px 50px rgba(0,0,0,.5)}
.s{font-family:"Great Vibes",cursive;font-size:44px;line-height:1;display:block}
h1{margin:0 0 6px;font-size:30px;letter-spacing:2px}
p{margin:0 0 20px;opacity:.85}
input{width:100%;font:600 18px Fredoka,sans-serif;text-align:center;padding:13px;border-radius:12px;border:2px solid #e2b54a;background:#fff8e6;color:#3a2410;outline:none}
input:focus{box-shadow:0 0 0 4px rgba(226,181,74,.45)}
button{margin-top:16px;border:0;cursor:pointer;font:700 17px Fredoka,sans-serif;letter-spacing:1px;color:#fff;padding:13px 34px;border-radius:999px;
  background:linear-gradient(#3fd04a,#0f8a1c 55%,#0a6b14);box-shadow:0 0 0 3px #e9b93a,0 0 0 5px #7a4f08,0 0 16px rgba(255,190,40,.55),inset 0 2px 0 rgba(255,255,255,.45);
  text-shadow:0 1px 2px rgba(0,0,0,.45)}
.err{color:#ffb3b3;margin:12px 0 0;font-weight:600}
</style></head><body>
<form method="post" action="/entrar">
  <span class="s">Feliz Navidad</span><h1>MI VIDA 💚</h1>
  <p>Escribe la contraseña para entrar</p>
  <input name="clave" type="password" autocomplete="current-password" placeholder="Contraseña" required autofocus>
  <button type="submit">ENTRAR</button>
  ${error ? '<div class="err">Contraseña incorrecta, prueba otra vez 🎄</div>' : ''}
</form></body></html>`, { status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
