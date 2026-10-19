// Prueba de humo: carga el juego en Chromium, crea un mundo con pueblos,
// simula años y guarda capturas. Falla si hay errores en la consola.
// Uso: node tools/test.mjs [años] [carpeta-capturas]
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const years = +(process.argv[2] || 20);
const out = process.argv[3] || path.join(root, 'tools', 'shots');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1400, height: 820 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '')));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('file://' + path.join(root, 'index.html'));
await page.waitForTimeout(800);

const info = await page.evaluate(async (years) => {
  const t0 = performance.now();
  newWorld(192, 112, 'cont', 'few', 'civ');
  const gen = performance.now() - t0;
  setSpeed(0);
  const t1 = performance.now();
  const target = years * YEAR;
  for (let i = 0; i < target; i++) tick();
  const sim = performance.now() - t1;
  const t2 = performance.now();
  for (let i = 0; i < 20; i++) render();
  const rend = (performance.now() - t2) / 20;
  renderStats(); renderSide();
  return {
    gen: gen | 0, simMsPerTick: +(sim / target).toFixed(3), renderMs: +rend.toFixed(2),
    units: units.length, kingdoms: kingdoms.filter(k => k.alive).length, cities: cities.filter(c => c && c.alive).length,
    log: logs.slice(0, 8).map(l => l.m),
  };
}, years);
console.log(JSON.stringify(info, null, 1));

await page.screenshot({ path: path.join(out, 'overview.png') });
await page.evaluate(() => { const c = cities.find(c => c && c.alive); if (c) { cam.z = 10; cam.x = c.x - VW / cam.z / 2; cam.y = c.y - VH / cam.z / 2; } render(); });
await page.screenshot({ path: path.join(out, 'city.png') });
await page.evaluate(() => { const c = cities.find(c => c && c.alive); if (c) { cam.z = 26; cam.x = c.x - VW / cam.z / 2; cam.y = c.y - VH / cam.z / 2; } render(); });
await page.screenshot({ path: path.join(out, 'close.png') });
await page.evaluate(() => { const u = units.find(u => u.def.civ && u.partner && u.dec && u.age > 16) || units.find(u => u.def.civ); if (u) { select(u); cam.z = 22; cam.x = u.x - VW / cam.z / 2; cam.y = u.y - VH / cam.z / 2; } render(); renderSide(); });
await page.screenshot({ path: path.join(out, 'inspector.png') });
await page.evaluate(() => { const k = kingdoms.filter(k => k.alive).sort((a, b) => b.pop - a.pop)[0]; if (k) showKingdom(k); });
await page.screenshot({ path: path.join(out, 'kingdom.png') });

await browser.close();
if (errors.length) { console.error('ERRORES:\n' + errors.join('\n')); process.exit(1); }
console.log('OK sin errores');
