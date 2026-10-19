// Captura de una ciudad madura a varios zooms. Uso: node tools/look.mjs [años]
import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tools', 'shots');
const years = +(process.argv[2] || 70);
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 820 } });
await page.goto('file://' + path.join(root, 'index.html?directo'));
await page.waitForTimeout(800);
await page.evaluate((years) => { newWorld(192, 112, 'cont', 'few', 'civ'); for (let i = 0; i < YEAR * years; i++) tick(); document.getElementById('side').classList.add('closed'); }, years);
for (const z of [6, 11, 20]) {
  await page.evaluate((z) => { const c = cities.filter(c => c && c.alive).sort((a, b) => b.pop - a.pop)[0]; cam.z = z; cam.x = c.x - VW / cam.z / 2; cam.y = c.y - VH / cam.z / 2; tickN = Math.floor(tickN / YEAR) * YEAR + 20; for (let i = 0; i < 40; i++) render(); }, z);
  await page.screenshot({ path: path.join(out, `look-z${z}.png`) });
}
await page.evaluate(() => { tickN = Math.floor(tickN / YEAR) * YEAR + 60; for (let i = 0; i < 40; i++) render(); });
await page.screenshot({ path: path.join(out, 'look-night.png') });
await browser.close();
