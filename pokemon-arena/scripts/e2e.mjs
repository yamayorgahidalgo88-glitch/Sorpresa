/**
 * Prueba de extremo a extremo en un navegador real (Chromium + Playwright).
 * - Compila el juego, lo sirve con `vite preview` y lo abre en escritorio (ratón) y móvil (táctil).
 * - Comprueba: menú, inicio de batalla, despliegue con toque-toque y con arrastre,
 *   pantalla de resultados, revancha, y que no haya errores en consola.
 * Uso: npm run test:e2e   (las capturas quedan en test-results/)
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}
const { chromium, devices } = playwright;

const PORT = 4179;
const URL = `http://127.0.0.1:${PORT}/?seed=4242`;
const OUT = 'test-results';
mkdirSync(OUT, { recursive: true });

const GAME_W = 720;
const FIELD_X = 36;
const FIELD_Y = 64;
const TILE = 36;
const slotCenter = (i) => ({ x: 112 + i * 144 + 68, y: 1216 + 10 + 71 });
const tileCenter = (tx, ty) => ({ x: FIELD_X + tx * TILE, y: FIELD_Y + ty * TILE });

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} => ${code}`))));
  });
}

async function toPage(page, p) {
  const r = await page.evaluate(() => {
    const c = document.querySelector('#game canvas').getBoundingClientRect();
    return { left: c.left, top: c.top, width: c.width };
  });
  const s = r.width / GAME_W;
  return { x: r.left + p.x * s, y: r.top + p.y * s };
}

const failures = [];
function check(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.log(`  ✗ ${msg}`);
    failures.push(msg);
  }
}

async function waitEnergy(page, cost) {
  await page.waitForFunction((c) => window.__arena.battle.energyPoints(0) >= c, cost, { timeout: 20000 });
}

async function handCost(page, slot) {
  return page.evaluate((s) => {
    const b = window.__arena.battle;
    const id = b.hand(0)[s];
    return { id, cost: { onix: 5, snorlax: 6, pikachu: 3, charmeleon: 4, squirtle: 3, bulbasaur: 4, machop: 3, pidgeotto: 3, geodude: 2, jigglypuff: 3, charizard: 5, rayo: 3, ventisca: 4 }[id] };
  }, slot);
}

async function scenario(browser, label, contextOpts, mode) {
  console.log(`\n▶ ${label}`);
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(URL);
  await page.waitForFunction(() => window.__game?.scene?.isActive('menu'), null, { timeout: 15000 });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/${label}-1-menu.png` });

  const tap = async (p) => {
    const q = await toPage(page, p);
    if (mode === 'touch') await page.touchscreen.tap(q.x, q.y);
    else await page.mouse.click(q.x, q.y);
  };

  await tap({ x: GAME_W / 2, y: 560 });
  await page.waitForFunction(() => window.__arena?.battle && window.__game.scene.isActive('battle'), null, { timeout: 10000 });
  check((await page.evaluate(() => window.__arena.seed)) === 4242, 'la semilla de la URL se aplica a la batalla');

  // 1) Toque en carta + toque en campo
  const c0 = await handCost(page, 0);
  await waitEnergy(page, c0.cost);
  await tap(slotCenter(0));
  await sleep(150);
  const target0 = c0.id === 'rayo' || c0.id === 'ventisca' ? tileCenter(3.5, 7) : tileCenter(3.5, 22);
  await tap(target0);
  await sleep(200);
  const played1 = await page.evaluate(() => window.__arena.battle.player(0).cardsPlayed);
  check(played1 === 1, `toque-toque despliega la carta (${c0.id})`);

  // 2) Toque fuera de zona: debe rechazarse
  const c1 = await handCost(page, 1);
  if (c1.id !== 'rayo' && c1.id !== 'ventisca') {
    await waitEnergy(page, c1.cost);
    await tap(slotCenter(1));
    await sleep(120);
    await tap(tileCenter(9, 8)); // campo rival
    await sleep(200);
    const still = await page.evaluate(() => window.__arena.battle.player(0).cardsPlayed);
    check(still === 1, 'el despliegue en campo rival se rechaza');
    await tap(slotCenter(1)); // deseleccionar
    await sleep(120);
  }

  // 3) Arrastrar y soltar
  const c2 = await handCost(page, 2);
  await waitEnergy(page, c2.cost);
  const from = await toPage(page, slotCenter(2));
  const to = await toPage(page, c2.id === 'rayo' || c2.id === 'ventisca' ? tileCenter(14.5, 7) : tileCenter(14.5, 21));
  if (mode === 'touch') {
    const cdp = await context.newCDPSession(page);
    const touch = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p.x, y: p.y }] });
    await touch('touchStart', from);
    for (let i = 1; i <= 8; i++) {
      await touch('touchMove', { x: from.x + ((to.x - from.x) * i) / 8, y: from.y + ((to.y - from.y) * i) / 8 });
      await sleep(16);
    }
    await touch('touchEnd', to);
  } else {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 10 });
    await page.mouse.up();
  }
  await sleep(250);
  const played2 = await page.evaluate(() => window.__arena.battle.player(0).cardsPlayed);
  check(played2 === 2, `arrastrar y soltar despliega la carta (${c2.id})`);

  // Dejar que la batalla avance y capturar
  await sleep(6000);
  await page.screenshot({ path: `${OUT}/${label}-2-batalla.png` });
  const st = await page.evaluate(() => {
    const b = window.__arena.battle;
    return { tick: b.tick, units: b.world.units.length, rival: b.player(1).cardsPlayed, over: b.isOver };
  });
  check(st.tick > 100, `la simulación avanza en el navegador (paso ${st.tick})`);
  check(st.rival > 0, `la IA rival juega cartas (${st.rival})`);

  // 4) Forzar el final para validar resultados y revancha
  await page.evaluate(() => {
    const b = window.__arena.battle;
    b.world.towers.find((t) => t.team === 1 && t.role === 'base').hp = 0;
  });
  await page.waitForFunction(() => window.__game.scene.isActive('result'), null, { timeout: 8000 });
  await sleep(700);
  await page.screenshot({ path: `${OUT}/${label}-3-resultado.png` });
  const res = await page.evaluate(() => window.__arenaResult);
  check(res?.winner === 0 && res?.reason === 'base_destruida', 'la pantalla de resultados muestra la victoria');

  await tap({ x: GAME_W / 2, y: 870 }); // Revancha
  await page.waitForFunction(() => window.__game.scene.isActive('battle') && window.__arena.battle.tick < 40 && !window.__game.scene.isActive('result'), null, { timeout: 8000 });
  check(true, 'revancha inicia una batalla nueva');

  // Constructor de mazo y colección accesibles desde el menú
  await page.evaluate(() => window.__game.scene.getScenes(true).forEach((s) => s.scene.stop()) || window.__game.scene.start('menu'));
  await page.waitForFunction(() => window.__game.scene.isActive('menu'));
  await sleep(300);
  await tap({ x: GAME_W / 2 - 112, y: 780 });
  await page.waitForFunction(() => window.__game.scene.isActive('deck'), null, { timeout: 5000 });
  await sleep(300);
  await page.screenshot({ path: `${OUT}/${label}-4-mazo.png` });
  check(true, 'el constructor de mazo se abre');
  await tap({ x: GAME_W / 2, y: 1420 - 75 });
  await page.waitForFunction(() => window.__game.scene.isActive('menu'));
  await sleep(300);
  await tap({ x: GAME_W / 2 + 112, y: 780 });
  await page.waitForFunction(() => window.__game.scene.isActive('collection'), null, { timeout: 5000 });
  await sleep(300);
  await page.screenshot({ path: `${OUT}/${label}-5-coleccion.png` });
  check(true, 'la colección se abre');

  check(errors.length === 0, `sin errores en consola${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await context.close();
}

let server;
try {
  await run('npx', ['vite', 'build', '--logLevel', 'warn']);
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/`);
      if (r.ok) break;
    } catch {
      /* aún arrancando */
    }
    await sleep(200);
  }
  const browser = await chromium.launch();
  await scenario(browser, 'escritorio', { viewport: { width: 1280, height: 800 } }, 'mouse');
  await scenario(browser, 'movil', { ...devices['Pixel 5'] }, 'touch');
  await browser.close();
} finally {
  server?.kill();
}

if (failures.length) {
  console.log(`\n${failures.length} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log('\nE2E correcto.');
