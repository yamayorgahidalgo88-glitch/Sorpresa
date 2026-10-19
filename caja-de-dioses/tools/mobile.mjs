// Capturas en tamaño de móvil (horizontal y vertical).
import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tools', 'shots');
const browser = await pw.chromium.launch();
for (const [name, w, h] of [['movil-h', 844, 390], ['movil-v', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.join(root, 'index.html'));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, name + '-bienvenida.png') });
  await page.evaluate(() => { document.getElementById('wPlay').click(); const r = document.getElementById('rotSkip'); if (r) r.click(); for (let i = 0; i < YEAR * 10; i++) tick(); render(); renderSide(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, name + '.png') });
  console.log(name, errs.length ? errs : 'ok');
  await page.close();
}
await browser.close();
