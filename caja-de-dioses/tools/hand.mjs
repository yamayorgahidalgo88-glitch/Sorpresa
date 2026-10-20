import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tools', 'shots');
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 820 } });
const errs = []; page.on('pageerror', e => errs.push(e.stack));
await page.goto('file://' + path.join(root, 'index.html?directo'));
await page.waitForTimeout(600);
const s0 = await page.evaluate(() => {
  newWorld(192, 112, 'cont', 'many', 'civ'); for (let i = 0; i < YEAR * 40; i++) tick();
  selectTool(TOOLS.find(t => t.id === 'm_hierro')); setHand(true);
  const c = cities.filter(c => c && c.alive && c.blist && c.blist.length).sort((a, b) => b.blist.length - a.blist.length)[0] || cities.find(c => c && c.alive);
  cam.z = 14; cam.x = c.x - VW / cam.z / 2; cam.y = c.y - VH / cam.z / 2; render();
  let ores = 0; for (let i = 0; i < N; i++) if (ore[i]) ores++;
  const b = (c.blist || [])[0], r = view.getBoundingClientRect();
  const pt = b ? [r.left + (b.i % W + .5 - cam.x) * cam.z, r.top + (((b.i / W) | 0) + .5 - cam.y) * cam.z] : null;
  return { ores, cam: [cam.x, cam.y], pt, bname: b ? BLD_NAME[b.b] : null, boats: units.filter(u => u.def.boat).length };
});
// arrastrar con la mano: debe moverse la cámara y no ponerse mineral
await page.mouse.move(700, 400); await page.mouse.down(); await page.mouse.move(600, 350, { steps: 6 }); await page.mouse.up();
const s1 = await page.evaluate(() => { let ores = 0; for (let i = 0; i < N; i++) if (ore[i]) ores++; return { ores, cam: [cam.x, cam.y] }; });
// tocar un edificio: debe abrirse su ficha
let panel = null;
if (s0.pt) {
  await page.evaluate(() => { cam.x += 0; });
  const pt = await page.evaluate(() => { const c = cities.filter(c => c && c.alive && c.blist && c.blist.length).sort((a, b) => b.blist.length - a.blist.length)[0]; const b = c.blist[0], r = view.getBoundingClientRect(); return [r.left + (b.i % W + .5 - cam.x) * cam.z, r.top + (((b.i / W) | 0) + .5 - cam.y) * cam.z]; });
  await page.mouse.click(pt[0], pt[1]); await page.waitForTimeout(200);
  panel = await page.evaluate(() => document.querySelector('#sideBody h3')?.textContent);
  await page.screenshot({ path: path.join(out, 'hand-building.png') });
}
// ficha de ciudad y de barco
const extra = await page.evaluate(() => {
  const c = cities.filter(c => c && c.alive).sort((a, b) => b.pop - a.pop)[0]; selectCity(c); renderSide();
  const city = document.querySelector('#sideBody .chips')?.textContent;
  const b = units.find(u => u.def.boat); let boat = null; if (b) { select(b); renderSide(); boat = document.querySelector('#sideBody h3').textContent + ' / ' + document.querySelector('#sideBody .next')?.textContent; }
  return { city, boat };
});
await page.screenshot({ path: path.join(out, 'hand-city.png') });
console.log(JSON.stringify({ before: s0, after: s1, panel, extra, errs }, null, 1));
await browser.close();
