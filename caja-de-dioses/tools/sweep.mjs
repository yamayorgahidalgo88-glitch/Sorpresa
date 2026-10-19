// Barrido: todos los tipos de mapa, todas las herramientas y un siglo de simulación.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
const errors = [];
page.on('pageerror', e => errors.push(e.stack || e.message));
await page.goto('file://' + path.join(root, 'index.html?directo'));
await page.waitForTimeout(600);
for (const type of ['cont', 'pang', 'arch', 'flat', 'empty']) {
  const r = await page.evaluate((type) => {
    const errs = [];
    try {
      newWorld(192, 112, type, 'few', type === 'empty' ? 'none' : 'civ');
      if (type === 'empty') { const t = TOOLS.find(t => t.id === 't_' + T.GRASS); brush = 12; for (let k = 0; k < 6; k++) applyTool(t, 60 + k * 14, 56, true); brush = 3; foundVillage('human', 70, 56); foundVillage('orc', 120, 56); }
      for (let i = 0; i < YEAR * 20; i++) tick();
      // todas las herramientas en el centro de la ciudad más grande
      const c = cities.filter(c => c && c.alive).sort((a, b) => b.pop - a.pop)[0];
      const x = c ? c.x + .5 : W / 2, y = c ? c.y + .5 : H / 2;
      for (const t of TOOLS) {
        if (t.kind === 'act') continue;
        try { warPick = null; applyTool(t, x + (Math.random() - .5) * 20, y + (Math.random() - .5) * 20, true); for (let i = 0; i < 5; i++) tick(); } catch (e) { errs.push(t.id + ': ' + e.message); }
      }
      for (const t of TOOLS.filter(t => t.kind === 'act' && !['clear'].includes(t.act))) { try { globalAct(t.act); for (let i = 0; i < 5; i++) tick(); } catch (e) { errs.push(t.act + ': ' + e.message); } }
      for (let i = 0; i < YEAR * 80; i++) tick();
      render(); renderSide(); renderStats();
      for (const p of ['log', 'kingdoms', 'ins']) { sidePane = p; renderSide(); }
      const k = kingdoms.find(k => k.alive); if (k) { selectedKingdom = k; sidePane = 'kingdoms'; renderSide(); }
      const u = units.find(u => u.def.civ); if (u) select(u);
      const cc = cities.find(c => c && c.alive); if (cc) { selected = null; selectedCity = cc; sidePane = 'ins'; renderSide(); }
    } catch (e) { errs.push('fatal: ' + e.stack); }
    return { type, year: year(), units: units.length, kingdoms: kingdoms.filter(k => k.alive).length, errs };
  }, type);
  console.log(JSON.stringify(r));
}
await browser.close();
if (errors.length) { console.error('ERRORES DE PÁGINA:\n' + errors.slice(0, 5).join('\n')); process.exit(1); }
