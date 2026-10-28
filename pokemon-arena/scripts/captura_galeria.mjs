/**
 * Capturas de la galería de modelos (hito F).
 * Uso: npx vite build && node scripts/captura_galeria.mjs [carpeta=../docs/capturas]
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const OUT = process.argv[2] ?? '../docs/capturas';
mkdirSync(OUT, { recursive: true });
const PORT = Number(process.env.PORT ?? 4193);
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
await sleep(2500);
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'] });
const errors = [];
try {
  for (const [pose, extra] of [['reposo', ''], ['carrera', ''], ['golpe', ''], ['reposo', '&estilo=suave']]) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 760 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`http://127.0.0.1:${PORT}/galeria.html?captura=1&pose=${pose}${extra}`);
    await page.waitForFunction(() => window.__galeria?.ready, null, { timeout: 60000 });
    const name = `galeria_${pose}${extra ? '_suave' : ''}`;
    await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 88 });
    console.log('captura', name);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
if (errors.length) {
  console.error('Errores:', errors);
  process.exit(1);
}
