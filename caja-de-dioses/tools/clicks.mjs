// Prueba con clics reales del ratón sobre el lienzo. Uso: node tools/clicks.mjs "<código previo>"
import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 820 } });
page.on('pageerror', e => console.log('ERR', e.stack));
await page.goto('file://' + path.join(root, 'index.html?directo'));
await page.waitForTimeout(600);
// devuelve coordenadas de pantalla de las capitales de dos reinos
const pts = await page.evaluate(() => {
  newWorld(192, 112, 'cont', 'few', 'civ'); for (let i = 0; i < YEAR * 15; i++) tick();
  document.getElementById('side').classList.add('closed');
  const ks = kingdoms.filter(k => k.alive); cam.z = 4; centerCam(); render();
  const r = view.getBoundingClientRect();
  const sc = k => { const c = cities[k.capital]; return [r.left + (c.x + .5 - cam.x) * cam.z, r.top + (c.y + .5 - cam.y) * cam.z]; };
  curTab = 'fronteras'; renderTabs(); renderTools();
  selectTool(TOOLS.find(t => t.id === 'discord'));
  return { a: sc(ks[0]), b: sc(ks[1]), names: [ks[0].name, ks[1].name], before: opinion(ks[0], ks[1]).v };
});
await page.mouse.click(pts.a[0], pts.a[1]); await page.waitForTimeout(150);
const t1 = await page.evaluate(() => document.getElementById('toast').textContent);
await page.mouse.click(pts.b[0], pts.b[1]); await page.waitForTimeout(150);
const res = await page.evaluate(() => { const ks = kingdoms.filter(k => k.alive); return { toast: document.getElementById('toast').textContent, after: opinion(ks[0], ks[1]).v, log: logs[0].m, warPick: warPick && warPick.name }; });
console.log(JSON.stringify({ pts, t1, res }, null, 1));
await browser.close();
