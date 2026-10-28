/**
 * Captura "antes": batalla 2D original con Pikachu atacando la torre guardiana rival izquierda.
 * Uso: npx vite build && node scripts/captura_antes.mjs
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const server = spawn('npx', ['vite', 'preview', '--port', '4190', '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
await sleep(2500);
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 1066 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4190/?seed=7');
await page.waitForFunction(() => window.__game?.scene?.isActive('menu'));
await page.evaluate(() => window.__game.scene.start('battle', { difficulty: 'facil', deck: ['onix','pikachu','charmeleon','squirtle','bulbasaur','machop','pidgeotto','rayo'], seed: 7 }));
await page.waitForFunction(() => window.__arena?.battle);
await page.evaluate(() => { const b = window.__arena.battle; b.spawnUnchecked(0, 'pikachu', { x: 3.5, y: 10.5 }, { ready: true }); });
await sleep(4000);
await page.screenshot({ path: '../docs/capturas/antes_batalla_2d.jpg', type: 'jpeg', quality: 88 });
await browser.close();
server.kill();
console.log('ok');
