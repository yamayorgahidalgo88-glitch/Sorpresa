// Genera preview/anime-list.html: la app en un solo fichero, sin servidor (API emulada en el navegador).
// Uso: node scripts/build-preview.mjs <carpeta-con-posters-webp>
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATE_PEOPLE, TEMPLATE_ROWS } from '../server/template-my.js';
import { AVATARS } from '../server/avatars.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(file).toString('base64')}`;

const posterDir = process.argv[2];
const POSTERS = {};
if (posterDir && existsSync(posterDir)) {
  for (const f of readdirSync(posterDir)) if (f.endsWith('.webp')) POSTERS[f.replace('.webp', '')] = dataUri(path.join(posterDir, f), 'image/webp');
}

const catalog = JSON.parse(read('data/catalog.json'));
catalog.items = catalog.items.map(({ poster, ...it }) => it);
const logo = dataUri(path.join(ROOT, 'public/img/logo-256.png'), 'image/png');
const charDir = path.join(ROOT, 'public/img/characters');
const CHAR_IMGS = Object.fromEntries(readdirSync(charDir).filter((f) => f.endsWith('.jpg'))
  .map((f) => [f.replace('.jpg', ''), dataUri(path.join(charDir, f), 'image/jpeg')]));
const avDir = path.join(ROOT, 'public/img/avatars');
const AV_IMGS = Object.fromEntries(readdirSync(avDir).filter((f) => f.endsWith('.jpg'))
  .map((f) => [f.replace('.jpg', ''), dataUri(path.join(avDir, f), 'image/jpeg')]));
const icon = dataUri(path.join(ROOT, 'public/img/icon-64.png'), 'image/png');

const html = read('public/index.html');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script src="/app.js"'));
const css = read('public/app.css') + `
/* Vista previa: el fondo de la página lo pinta el body y el mosaico va encima */
body { background: var(--bg); }
#backdrop { z-index: 0; }
#app { position: relative; z-index: 1; }
.preview-note { display: block; margin-top: 6px; color: var(--orange-2); font-size: 12px; font-weight: 700; }`;
const app = read('public/app.js')
  .replaceAll('/img/logo-256.png', logo)
  .replace('const charImg = (key) => `/img/characters/${key}.jpg`;', `const CHAR_IMGS = ${JSON.stringify(CHAR_IMGS)};\nconst charImg = (key) => CHAR_IMGS[key] || '';`)
  .replace('const avatarImg = (key) => `/img/avatars/${key}.jpg`;', `const AV_IMGS = ${JSON.stringify(AV_IMGS)};\nconst avatarImg = (key) => AV_IMGS[key] || '';`)
  .replace("if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});", '')
  .replace('Lo que vemos, lo que nos queda y nuestras notas</p>',
    'Lo que vemos, lo que nos queda y nuestras notas<span class="preview-note">${window.__previewStorage === false ? "⚠️ Este navegador no deja guardar datos: las cuentas se borrarán al cerrar. Ábrelo en Safari o Chrome." : "Vista previa · las cuentas y tablas se guardan solo en este móvil"}</span></p>');

const out = `<title>anYMe</title>
<meta name="theme-color" content="#0d0d14">
<link rel="icon" href="${icon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>${css}</style>
${body}
<script>
const CATALOG = ${JSON.stringify(catalog)};
const POSTERS = ${JSON.stringify(POSTERS)};
const TEMPLATE = ${JSON.stringify({ people: TEMPLATE_PEOPLE, rows: TEMPLATE_ROWS })};
const AVATARS = ${JSON.stringify(AVATARS)};
${read('preview/mock-api.js')}
</script>
<script type="module">${app}</script>
`;
writeFileSync(path.join(ROOT, 'preview/anime-list.html'), out);
console.log(`preview/anime-list.html · ${(out.length / 1024).toFixed(0)} KB · ${Object.keys(POSTERS).length} pósters`);
