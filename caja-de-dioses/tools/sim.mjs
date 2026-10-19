// Simula muchos años sin pantalla y saca estadísticas de equilibrio.
// Uso: node tools/sim.mjs [años] [semilla-de-pueblos]
import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const years = +(process.argv[2] || 60);
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message + '\n' + e.stack));
await page.goto('file://' + path.join(root, 'index.html'));
await page.waitForTimeout(500);
const res = await page.evaluate((years) => {
  newWorld(192, 112, 'cont', 'few', 'civ');
  const rows = [];
  const t0 = performance.now();
  for (let y = 1; y <= years; y++) {
    for (let i = 0; i < YEAR; i++) tick();
    if (y % 5 === 0) {
      const civ = units.filter(u => u.def.civ);
      const profs = {}; for (const u of civ) profs[u.prof || '-'] = (profs[u.prof || '-'] || 0) + 1;
      const tasks = {}; for (const u of civ) { const k = u.task ? u.task.k : (u.target ? 'fight' : '-'); tasks[k] = (tasks[k] || 0) + 1; }
      const avg = f => civ.length ? Math.round(civ.reduce((s, u) => s + f(u), 0) / civ.length) : 0;
      rows.push({ y, pop: civ.length, k: kingdoms.filter(k => k.alive).length, c: cities.filter(c => c && c.alive).length, food: avg(u => u.food), en: avg(u => u.energy), mood: avg(u => u.mood), couples: civ.filter(u => u.partner).length / 2 | 0,
        cfood: Math.round(cities.filter(c => c && c.alive).reduce((s, c) => s + c.food, 0)), eras: kingdoms.filter(k => k.alive).map(k => k.era).join(''), profs: JSON.stringify(profs), tasks: JSON.stringify(tasks), ms: +((performance.now() - t0) / (y * YEAR)).toFixed(3) });
    }
  }
  const starving = logs.filter(l => /hambre/.test(l.m)).length;
  return { deaths: DEATHS, rows, last: logs.slice(0, 12).map(l => 'Año ' + l.y + ': ' + l.m) };
}, years);
for (const r of res.rows) console.log(`y${r.y} pop=${r.pop} reinos=${r.k} ciud=${r.c} comida(u)=${r.food} energ=${r.en} animo=${r.mood} parejas=${r.couples} almacen=${r.cfood} eras=${r.eras} ms/tick=${r.ms}\n   oficios ${r.profs}\n   tareas ${r.tasks}`);
console.log('muertes', JSON.stringify(res.deaths));
console.log(res.last.join('\n'));
await browser.close();
if (errors.length) { console.error('ERRORES:\n' + errors.slice(0, 5).join('\n')); process.exit(1); }
