// Perfil de CPU de la simulación: qué funciones consumen más tiempo propio.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + path.join(root, 'index.html'));
await page.waitForTimeout(400);
await page.evaluate(() => { newWorld(192, 112, 'cont', 'many', 'civ'); for (let i = 0; i < YEAR * 55; i++) tick(); });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
await cdp.send('Profiler.start');
const what = process.argv[2] || 'tick';
await page.evaluate((what) => { if (what === 'tick') { for (let i = 0; i < YEAR; i++) tick(); } else { for (let i = 0; i < 40; i++) render(); } }, what);
const { profile } = await cdp.send('Profiler.stop');
const self = new Map(); const byId = new Map(profile.nodes.map(n => [n.id, n]));
const dt = profile.timeDeltas; let total = 0;
profile.samples.forEach((id, i) => { const n = byId.get(id); const k = n.callFrame.functionName + ' ' + path.basename(n.callFrame.url) + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); total += dt[i] || 0; });
console.log('units', await page.evaluate(() => units.length), 'total ms', (total / 1000).toFixed(0));
[...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log((v / 1000).toFixed(1).padStart(8), (v / total * 100).toFixed(1).padStart(5) + '%', k));
await browser.close();
