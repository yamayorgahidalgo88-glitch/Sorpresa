/**
 * Medición de rendimiento de la batalla 3D (hito H).
 * - Compila (si se pasa --build), sirve con `vite preview` y abre la batalla en un móvil emulado
 *   (Pixel 5, calidad «medio» como en un móvil real) y en escritorio (calidad «alto»).
 * - Llena el campo con una escena exigente (≈40 Pokémon de los dos bandos, enjambres incluidos)
 *   y mide: llamadas de dibujo, triángulos, mallas por categoría y tiempo de CPU por fotograma
 *   (actualización de la vista + envío a la GPU), sin contar el rasterizado de la GPU.
 * La GPU es software (SwiftShader), así que los milisegundos solo sirven para comparar
 * versiones entre sí, no para predecir los FPS de un móvil real.
 * Uso: node scripts/rendimiento.mjs [--build]
 */
import { spawn } from 'node:child_process';
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
const PORT = 4181;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} => ${code}`))));
  });
}

if (process.argv.includes('--build')) await run('npx', ['vite', 'build']);
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
await sleep(2500);

const DECK = ['onix', 'pikachu', 'charmander', 'squirtle', 'bulbasaur', 'machop', 'pidgey', 'rayo'];
const ARMY = ['onix', 'snorlax', 'charmander', 'squirtle', 'bulbasaur', 'machop', 'pidgey', 'geodude', 'rattata', 'zubat', 'gastly', 'abra', 'dratini', 'magnemite', 'jigglypuff', 'pikachu'];

async function measure(name, ctxOpts, calidad) {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${PORT}/?seed=777&calidad=${calidad}`);
  await page.waitForFunction(() => window.__game?.scene?.isActive('menu'), null, { timeout: 60000 });
  await page.evaluate((d) => window.__game.scene.getScene('menu').scene.start('battle', { difficulty: 'normal', deck: d }), DECK);
  await page.waitForFunction(() => window.__arena?.scene?.layer3d, null, { timeout: 60000 });
  const out = await page.evaluate(async (army) => {
    const { scene, battle } = window.__arena;
    const layer = scene.layer3d;
    // Pausa la simulación para medir siempre la misma escena.
    scene.scene.pause();
    army.forEach((id, i) => {
      const x = 2.5 + (i % 8) * 1.8;
      for (const [team, y] of [[0, 24 + Math.floor(i / 8) * 3], [1, 6 + Math.floor(i / 8) * 3]]) {
        const pos = { x, y };
        const unitIds = battle.spawnUnchecked(team, id, pos, { ready: true });
        layer.handleEvents([{ type: 'despliegue', team, cardId: id, pos, unitIds }]);
      }
    });
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 10; i++) {
      layer.render(0.5, 1 / 60);
      await frame();
    }
    layer.render(0.5, 1 / 60);
    const info = layer.engine.renderer.info;
    // Llamadas de dibujo por categoría: se mide el total ocultando cada parte
    const total = info.render.calls;
    const callsWithout = (objs) => {
      const prev = objs.map((o) => o.visible);
      objs.forEach((o) => (o.visible = false));
      layer.engine.render();
      const c = info.render.calls;
      objs.forEach((o, i) => (o.visible = prev[i]));
      return total - c;
    };
    const view = layer.view;
    const unitRoots = [...view.units.values()].map((u) => u.root);
    const towerRoots = [...view.towers.values()].map((t) => t.model?.root ?? t.root).filter(Boolean);
    const byGroup = {
      escenario: callsWithout([layer.arena.group]),
      pokemon: callsWithout(unitRoots),
      torres: callsWithout(towerRoots),
      porPokemon: Math.round((callsWithout(unitRoots) / unitRoots.length) * 10) / 10,
    };
    layer.engine.render();
    // Tiempo de CPU: vista + render (sin esperar a la GPU)
    const t0 = performance.now();
    const N = 30;
    for (let i = 0; i < N; i++) layer.render(0.5, 1 / 60);
    const gl = layer.engine.renderer.getContext();
    gl.finish();
    const cpu = (performance.now() - t0) / N;
    return {
      unidades: battle.world.units.length,
      llamadas: info.render.calls,
      triangulos: info.render.triangles,
      geometrias: info.memory.geometries,
      texturas: info.memory.textures,
      programas: info.programs?.length,
      msPorFotograma: Math.round(cpu * 10) / 10,
      mallas: byGroup,
    };
  }, ARMY);
  await page.screenshot({ path: `test-results/rendimiento-${name}.png` });
  await browser.close();
  return { ...out, errores: errors.length };
}

try {
  const movil = await measure('movil', { ...devices['Pixel 5'] }, 'medio');
  console.log('Móvil (Pixel 5, calidad media):', JSON.stringify(movil, null, 1));
  const esc = await measure('escritorio', { viewport: { width: 1280, height: 800 } }, 'alto');
  console.log('Escritorio (calidad alta):', JSON.stringify(esc, null, 1));
} finally {
  server.kill();
}
