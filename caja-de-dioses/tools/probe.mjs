import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await pw.chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', e.stack || e.message));
await page.goto('file://' + path.join(root, 'index.html'));
await page.waitForTimeout(400);
const code = process.argv[2];
console.log(await page.evaluate(code));
await browser.close();
