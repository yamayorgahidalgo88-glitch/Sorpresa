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
const BASE = `http://127.0.0.1:${PORT}/?seed=4242`;
const OUT = 'test-results';
mkdirSync(OUT, { recursive: true });

const GAME_W = 720;
const FIELD_X = 36;
const FIELD_Y = 64;
const TILE = 36;
const slotCenter = (i) => ({ x: 112 + i * 144 + 68, y: 1216 + 10 + 71 });
const GAME_H = 1420;
/** Punto de pantalla (coordenadas del juego) donde se ve una casilla: en 3D se proyecta con la cámara. */
const tileCenter = (page, tx, ty) =>
  page.evaluate(
    ([x, y, fx, fy, t, w, h]) => {
      const layer = window.__arena.scene.layer3d;
      if (!layer) return { x: fx + x * t, y: fy + y * t };
      const p = layer.project({ x, y });
      return { x: p.x * w, y: p.y * h };
    },
    [tx, ty, FIELD_X, FIELD_Y, TILE, GAME_W, GAME_H],
  );

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} => ${code}`))));
  });
}

async function toPage(page, p) {
  const r = await page.evaluate(() => {
    const c = document.querySelector('#game canvas:not(.arena3d)').getBoundingClientRect();
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
  await page.waitForFunction((c) => window.__arena.battle.energyPoints(0) >= c, cost, { timeout: 60000 });
}

async function handCost(page, slot) {
  return page.evaluate((s) => {
    const b = window.__arena.battle;
    const id = b.hand(0)[s];
    return { id, cost: window.__cards[id].cost, spell: window.__cards[id].kind === 'hechizo' };
  }, slot);
}

async function scenario(browser, label, contextOpts, mode, query = '') {
  console.log(`\n▶ ${label}`);
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(BASE + query);
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
  const is3d = await page.evaluate(() => !!window.__arena.scene.layer3d);
  check(is3d === !query.includes('vista=2d'), is3d ? 'la batalla se dibuja con la capa 3D' : 'la batalla usa la vista 2D de respaldo');

  // 1) Toque en carta + toque en campo
  const c0 = await handCost(page, 0);
  await waitEnergy(page, c0.cost);
  await tap(slotCenter(0));
  await sleep(150);
  const target0 = c0.spell ? await tileCenter(page, 3.5, 7) : await tileCenter(page, 3.5, 22);
  await tap(target0);
  await sleep(200);
  const played1 = await page.evaluate(() => window.__arena.battle.player(0).cardsPlayed);
  check(played1 === 1, `toque-toque despliega la carta (${c0.id})`);

  // 2) Toque fuera de zona: debe rechazarse
  const c1 = await handCost(page, 1);
  if (!c1.spell) {
    await waitEnergy(page, c1.cost);
    await tap(slotCenter(1));
    await sleep(120);
    await tap(await tileCenter(page, 9, 8)); // campo rival
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
  const to = await toPage(page, c2.spell ? await tileCenter(page, 14.5, 7) : await tileCenter(page, 14.5, 21));
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
  if (is3d) {
    const r3 = await page.evaluate(() => {
      const l = window.__arena.scene.layer3d;
      const c = l.canvas.getBoundingClientRect();
      const h = document.querySelector('#game canvas:not(.arena3d)').getBoundingClientRect();
      return { calls: l.engine.renderer.info.render.calls, aligned: Math.abs(c.left - h.left) < 1 && Math.abs(c.top - h.top) < 1 && Math.abs(c.width - h.width) < 1 };
    });
    check(r3.calls > 20, `la escena 3D se dibuja (${r3.calls} llamadas de dibujo)`);
    check(r3.aligned, 'el lienzo 3D está alineado con el del HUD');
  }

  // 4) Forzar el final para validar resultados y revancha
  await page.evaluate(() => {
    const b = window.__arena.battle;
    b.world.towers.find((t) => t.team === 1 && t.role === 'base').hp = 0;
  });
  await page.waitForFunction(() => window.__game.scene.isActive('result'), null, { timeout: 45000 });
  await sleep(700);
  await page.screenshot({ path: `${OUT}/${label}-3-resultado.png` });
  const res = await page.evaluate(() => window.__arenaResult);
  check(res?.winner === 0 && res?.reason === 'base_destruida', 'la pantalla de resultados muestra la victoria');
  check(res?.progress?.delta === 30 && res.coins === 30 + 3 * 5 && res.road.some((r) => r.trophies === 20), 'la victoria da 30 trofeos, 45 monedas y el premio de 20 trofeos');
  const saved = await page.evaluate(() => ({
    stats: JSON.parse(localStorage.getItem('pokemon-arena:estadisticas') || '{}'),
    profile: JSON.parse(localStorage.getItem('pokemon-arena:perfil') || '{}'),
  }));
  check(saved.stats.trophies === 30 && saved.stats.wins === 1 && saved.profile.coins === 100 + 45 + 100, 'trofeos, historial y monedas se guardan en el navegador');

  // Repetición: reproduce la partida con su semilla y sus órdenes, sin poder jugar
  await tap({ x: GAME_W / 2 + 140, y: 935 });
  await page.waitForFunction(() => window.__game.scene.isActive('battle') && !!window.__arena?.scene?.data_?.replay && window.__arena.battle.tick > 60, null, { timeout: 45000 });
  const rep = await page.evaluate(() => ({ log: window.__arena.scene.data_.replay.log.length, played: window.__arena.battle.player(0).cardsPlayed + window.__arena.battle.player(1).cardsPlayed }));
  check(rep.log > 0, `la repetición se abre con las órdenes registradas (${rep.log})`);
  await page.screenshot({ path: `${OUT}/${label}-3b-repeticion.png` });
  const statsBefore = await page.evaluate(() => localStorage.getItem('pokemon-arena:estadisticas'));
  await page.evaluate(() => window.__game.scene.getScene('battle').scene.start('menu'));
  await page.waitForFunction(() => window.__game.scene.isActive('menu'));
  const statsAfter = await page.evaluate(() => localStorage.getItem('pokemon-arena:estadisticas'));
  check(statsBefore === statsAfter, 'la repetición no cuenta para el historial');
  await page.evaluate((d) => window.__game.scene.getScene('menu').scene.start('battle', { difficulty: 'normal', deck: d }), ['onix', 'pikachu', 'charmander', 'squirtle', 'bulbasaur', 'machop', 'pidgey', 'rayo']);
  check(true, 'revancha: nueva batalla tras la repetición');
  await page.waitForFunction(() => window.__game.scene.isActive('battle') && !window.__arena.scene.data_.replay && window.__arena.battle.tick < 60 && !window.__game.scene.isActive('result'), null, { timeout: 45000 });
  check(true, 'se inicia una batalla nueva');

  // Constructor de mazo y colección accesibles desde el menú
  await page.evaluate(() => window.__game.scene.getScenes(true).forEach((s) => s.scene.stop()) || window.__game.scene.start('menu'));
  await page.waitForFunction(() => window.__game.scene.isActive('menu'));
  await sleep(300);
  await tap({ x: GAME_W / 2 - 112, y: 846 });
  await page.waitForFunction(() => window.__game.scene.isActive('deck'), null, { timeout: 5000 });
  await sleep(300);
  await page.screenshot({ path: `${OUT}/${label}-4-mazo.png` });
  check(true, 'el constructor de mazo se abre');
  // Mazo estilo Clash: tocar Geodude (colección) → «Usar» → tocar Onix (mazo) los intercambia.
  await tap({ x: 47 + 73, y: 544 + 75 });
  await page.waitForFunction(() => !!window.__game.scene.getScene('deck').detail, null, { timeout: 5000 });
  await sleep(400);
  await page.screenshot({ path: `${OUT}/${label}-4b-ficha.png` });
  check(true, 'tocar una carta abre su ficha');
  const useBtn = await page.evaluate(() => {
    const b = window.__game.scene.getScene('deck').detail.root.list.find((o) => o.getData?.('label') === 'Usar');
    return b ? { x: b.x, y: b.y } : null;
  });
  check(!!useBtn, 'la ficha de una carta fuera del mazo ofrece «Usar»');
  if (useBtn) await tap(useBtn);
  await sleep(300);
  await tap({ x: 47 + 73, y: 90 + 75 });
  await sleep(300);
  const deckState = await page.evaluate(() => ({ deck: window.__game.scene.getScene('deck').deck, saved: JSON.parse(localStorage.getItem('pokemon-arena:ajustes') || '{}').deck }));
  check(deckState.deck[0] === 'geodude' && !deckState.deck.includes('onix') && deckState.saved?.[0] === 'geodude', 'cambiar una carta del mazo funciona y se guarda');
  await page.screenshot({ path: `${OUT}/${label}-4c-mazo-cambiado.png` });

  // Tienda: comprar y abrir una Pokéball
  await tap({ x: GAME_W / 2, y: 1420 - 70 });
  await page.waitForFunction(() => window.__game.scene.isActive('menu'));
  await sleep(300);
  await tap({ x: GAME_W / 2 + 112, y: 846 });
  await page.waitForFunction(() => window.__game.scene.isActive('tienda'), null, { timeout: 5000 });
  await sleep(300);
  await page.screenshot({ path: `${OUT}/${label}-5-tienda.png` });
  await tap({ x: 470, y: 130 + 205 });
  await page.waitForFunction(() => window.__game.scene.isActive('abrir') && window.__opening && !window.__opening.busy, null, { timeout: 30000 });
  await sleep(400);
  await page.screenshot({ path: `${OUT}/${label}-6-pokeball.png` });
  const copies0 = await page.evaluate(() => window.__opening.data_.drops.reduce((s, d) => s + d.copies, 0));
  for (let i = 0; i < 4; i++) {
    await tap({ x: GAME_W / 2, y: 700 });
    await sleep(250);
  }
  await page.screenshot({ path: `${OUT}/${label}-7-resumen.png` });
  const prof = await page.evaluate(() => JSON.parse(localStorage.getItem('pokemon-arena:perfil') || '{}'));
  check(prof.coins < 245 && copies0 >= 2, `comprar una Pokéball descuenta monedas y da cartas (${copies0} copias)`);

  // Modos: desafío (racha con premios) e igualado (fase máxima)
  await page.evaluate(() => window.__game.scene.getScenes(true).forEach((s) => s.scene.stop()) || window.__game.scene.start('menu'));
  await page.waitForFunction(() => window.__game.scene.isActive('menu'));
  await sleep(300);
  await tap({ x: GAME_W / 2 - 112, y: 666 });
  await page.waitForFunction(() => window.__game.scene.isActive('desafio'), null, { timeout: 8000 });
  await sleep(300);
  await page.screenshot({ path: `${OUT}/${label}-8-desafio.png` });
  await tap({ x: GAME_W / 2, y: 900 });
  await page.waitForFunction(() => window.__game.scene.isActive('battle') && window.__arena?.scene?.data_?.mode === 'desafio', null, { timeout: 30000 });
  await page.evaluate(() => {
    window.__arena.battle.world.towers.find((t) => t.team === 1 && t.role === 'base').hp = 0;
  });
  await page.waitForFunction(() => window.__game.scene.isActive('result'), null, { timeout: 45000 });
  await sleep(500);
  const ch = await page.evaluate(() => ({ r: window.__arenaResult, p: JSON.parse(localStorage.getItem('pokemon-arena:perfil') || '{}') }));
  check(ch.r?.mode === 'desafio' && ch.p.challenge?.wins === 1 && ch.r.challenge?.coins > 0, 'el desafío cuenta la victoria y da monedas');
  await page.screenshot({ path: `${OUT}/${label}-9-desafio-resultado.png` });
  await page.evaluate(() => window.__game.scene.getScenes(true).forEach((s) => s.scene.stop()) || window.__game.scene.start('menu'));
  await page.waitForFunction(() => window.__game.scene.isActive('menu'));
  await sleep(300);
  await tap({ x: GAME_W / 2 + 112, y: 666 });
  await page.waitForFunction(() => window.__game.scene.isActive('battle') && window.__arena?.scene?.data_?.mode === 'igualado', null, { timeout: 30000 });
  const eq = await page.evaluate(() => {
    const b = window.__arena.battle;
    const all = [0, 1].flatMap((t) => b.player(t).deck.hand.concat(b.player(t).deck.queue)).map((id) => window.__cards[id]);
    return all.every((c) => c.stage === Math.max(...Object.values(window.__cards).filter((x) => x.line === c.line).map((x) => x.stage)));
  });
  check(eq, 'en el modo igualado todas las cartas están en su fase máxima');

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
  // WebGL por software (SwiftShader) para poder dibujar la capa 3D sin GPU.
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'] });
  await scenario(browser, 'escritorio', { viewport: { width: 1280, height: 800 } }, 'mouse');
  await scenario(browser, 'movil', { ...devices['Pixel 5'] }, 'touch');
  await scenario(browser, 'escritorio-2d', { viewport: { width: 1280, height: 800 } }, 'mouse', '&vista=2d');
  await browser.close();
} finally {
  server?.kill();
}

if (failures.length) {
  console.log(`\n${failures.length} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log('\nE2E correcto.');
