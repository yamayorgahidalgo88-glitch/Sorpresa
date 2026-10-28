/**
 * Capturas deterministas de la escena de referencia 3D (modo ?captura=1).
 * Uso: npx vite build && node scripts/captura_referencia.mjs [carpeta=../docs/capturas] [calidad=alto]
 * Avanza el tiempo con pasos fijos y fotografía instantes concretos del guion.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const OUT = process.argv[2] ?? '../docs/capturas';
const QUALITY = process.argv[3] ?? 'alto';
mkdirSync(OUT, { recursive: true });
const PORT = 4191;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
await sleep(2500);
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 540, height: 1066 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
// Se ignoran los avisos de rendimiento del controlador por software al leer píxeles para la captura.
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && !m.text().includes('GL Driver Message') && errors.push(`${m.type()}: ${m.text()}`));
await page.goto(`http://127.0.0.1:${PORT}/referencia.html?captura=1&calidad=${QUALITY}`);
await page.waitForFunction(() => window.__ref?.ready, null, { timeout: 60000 });

const shots = [
  // [segundos totales, cámara, nombre]
  [0.55, 'juego', 'ref_1_aparicion'],
  [3.2, 'juego', 'ref_2_cruce_puente'],
  [3.2, 'detalle', 'ref_2_cruce_puente_detalle'],
  [3.2, 'personaje', 'ref_2_cruce_puente_personaje'],
];
let t = 0;
const at = async (time) => {
  if (time > t) {
    await page.evaluate((s) => window.__ref.advance(s, 30), time - t);
    t = time;
  }
};
for (const [time, cam, name] of shots) {
  await at(time);
  await page.evaluate((c) => window.__ref.setCamera(c), cam);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 88 });
  console.log('captura', name, 't=', time);
}
// Secuencia del ataque capturada por ESTADO (no por tiempo): carga, lanzamiento, vuelo e impacto.
const until = (fn, max = 600) =>
  page.evaluate(
    ([code, maxFrames]) => {
      const r = window.__ref;
      const test = new Function('r', 'return ' + code);
      for (let i = 0; i < maxFrames; i++) {
        if (test(r)) return i;
        r.advance(1 / 60, 60);
      }
      return -1;
    },
    [fn, max],
  );
const shot = async (name, cam) => {
  await page.evaluate((c) => window.__ref.setCamera(c), cam);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 88 });
  console.log('captura', name);
};
console.log('carga tras', await until('r.debug().units.some((u) => u.charge >= 0.6)'), 'fotogramas');
await shot('ref_3_carga', 'personaje');
console.log('lanzamiento tras', await until('r.debug().units.some((u) => u.release > 0.8)'));
await shot('ref_4_lanzamiento', 'detalle');
await page.evaluate(() => window.__ref.advance(5 / 60, 60));
await shot('ref_5_vuelo', 'detalle');
console.log('impacto tras', await until('!r.debug().projectiles.some((p) => p.beam)'));
await shot('ref_6_impacto', 'detalle');
await shot('ref_6_impacto_juego', 'juego');
await page.evaluate(() => window.__ref.advance(0.15, 60));
await shot('ref_7_reaccion', 'detalle');
await page.evaluate(() => window.__ref.setCamera('juego'));
await page.screenshot({ path: `${OUT}/ref_8_combate_juego.jpg`, type: 'jpeg', quality: 88 });
// Derrota de Pikachu
const died = await page.evaluate(() => {
  const r = window.__ref;
  for (let i = 0; i < 600; i++) {
    if (!r.battle.world.units.some((u) => u.cardId === 'pikachu')) return i;
    r.advance(1 / 30, 30);
  }
  return -1;
});
await page.evaluate(() => window.__ref.advance(0.3, 60));
await page.evaluate(() => window.__ref.setCamera('detalle'));
await page.screenshot({ path: `${OUT}/ref_9_derrota.jpg`, type: 'jpeg', quality: 88 });
console.log('derrota tras', died, 'fotogramas');
console.log('estadísticas', JSON.stringify(await page.evaluate(() => window.__ref.stats())));
console.log(errors.length ? 'ERRORES:\n' + errors.join('\n') : 'sin errores de consola');
await browser.close();
server.kill();
