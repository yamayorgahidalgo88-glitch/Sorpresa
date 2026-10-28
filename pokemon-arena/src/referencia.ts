import '@fontsource/lilita-one';
import '@fontsource/nunito/700.css';
import * as THREE from 'three';
import { Battle } from './sim/battle';
import { DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK } from './sim/data/cards';
import { Arena3D } from './render3d/arena3d';
import { BattleView3D } from './render3d/battleView3d';
import { Engine } from './render3d/engine';
import { Effects } from './render3d/fx/effects';

/**
 * Escena de referencia (hitos B–E): arena completa, torres, Pikachu y su ataque, todo movido
 * por la SIMULACIÓN REAL del juego (mismas reglas, mismos eventos).
 *
 * Guion de demostración: Pikachu aparece junto al puente izquierdo, cruza el río, la torre
 * rival le dispara y él responde con Impactrueno hasta caer; después reaparece.
 * Modo captura (?captura=1): sin bucle automático; window.__ref.advance(s) avanza tiempo fijo.
 */

const params = new URLSearchParams(location.search);
const captureMode = params.get('captura') === '1';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const view = document.getElementById('view') as HTMLDivElement;
const engine = new Engine(canvas); // calidad: ?calidad=alto|medio|bajo o automática
engine.hudFraction = 0.155;
const arena = new Arena3D();
engine.scene.add(arena.group);
const fx = new Effects(engine.scene, 4242);

let battle!: Battle;
let view3d!: BattleView3D;
let pikachuId: number | null = null;
let respawnAt = 0.4;
const enemyTowerId = () => battle.world.towers.find((t) => t.team === 1 && t.role === 'guardia_izq')!.id;

function newBattle(): void {
  battle = new Battle({ seed: 7, decks: [DEFAULT_PLAYER_DECK, DEFAULT_RIVAL_DECK] });
  // La base rival despierta para que el escenario muestre todas las torres activas.
  view3d = new BattleView3D(battle, engine.scene, fx);
}
newBattle();

// ------------------------------------------------------------------ cámaras

type CamName = 'juego' | 'detalle' | 'personaje';
let camName: CamName = (params.get('camara') as CamName) ?? 'juego';
const gamePose = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 28 };
// Pantalla vertical: el campo de visión horizontal es estrecho, así que las cámaras de detalle
// alinean al personaje y su objetivo con la dirección de la vista.
// Detalle: por detrás y por encima de Pikachu, con la torre rival al fondo.
const detailPose = { pos: new THREE.Vector3(8.6, 7.6, 18.8), target: new THREE.Vector3(3.4, 1.7, 9.4), fov: 36 };
// Personaje: sigue a Pikachu y lo muestra de frente (cámara entre él y la torre).
const charPose = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 38 };
function poseFor(n: CamName) {
  if (n === 'juego') return gamePose;
  if (n === 'detalle') return detailPose;
  const p = pikachuId !== null ? view3d.unitPosition(pikachuId) : null;
  if (p) {
    charPose.target.set(p.x, 0.75, p.z);
    charPose.pos.set(p.x + 1.3, 2.1, p.z - 4.2);
  }
  return charPose;
}
const camPos = new THREE.Vector3();
const camTarget = new THREE.Vector3();

function resize(): void {
  const r = view.getBoundingClientRect();
  engine.resize(Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height)));
  gamePose.pos.copy(engine.camera.position);
  const dir = new THREE.Vector3();
  engine.camera.getWorldDirection(dir);
  gamePose.target.copy(engine.camera.position).addScaledVector(dir, engine.camera.position.y / -dir.y);
  const ph = r.height * engine.renderer.getPixelRatio();
  fx.additive.setViewport(ph, engine.camera.fov);
  fx.soft.setViewport(ph, engine.camera.fov);
  const pose = poseFor(camName);
  camPos.copy(pose.pos);
  camTarget.copy(pose.target);
}
addEventListener('resize', resize);
resize();

function camFovSnap(fov: number): void {
  engine.camera.fov = fov;
}

function updateCamera(dt: number): void {
  const pose = poseFor(camName);
  const k = 1 - Math.pow(0.02, dt);
  camPos.lerp(pose.pos, k);
  camTarget.lerp(pose.target, k);
  engine.camera.position.copy(camPos);
  engine.camera.lookAt(camTarget);
  engine.camera.fov += (pose.fov - engine.camera.fov) * (dt === 0 ? 1 : k);
  engine.camera.updateProjectionMatrix();
  engine.fitFog(camPos.distanceTo(camTarget));
  arena.update(renderTime, engine.scene.fog as THREE.Fog);
}

// ------------------------------------------------------------------ guion

let simTime = 0;
let renderTime = 0;
let acc = 0;
const STEP = 1 / battle.rules.tickRate;

function script(): void {
  const alive = pikachuId !== null && battle.world.units.some((u) => u.id === pikachuId);
  if (!alive && pikachuId !== null) {
    pikachuId = null;
    respawnAt = simTime + 1.8;
  }
  if (pikachuId === null && simTime >= respawnAt) {
    const tower = battle.world.entities.get(enemyTowerId());
    if (tower && tower.kind === 'tower' && tower.hp < tower.maxHp * 0.45) tower.hp = tower.maxHp; // demo en bucle
    [pikachuId] = battle.spawnUnchecked(0, 'pikachu', { x: 3.5, y: 18.6 });
    // spawnUnchecked no emite evento: se emite el de despliegue para la vista.
    view3d.handleEvents([{ type: 'despliegue', team: 0, cardId: 'pikachu', pos: { x: 3.5, y: 18.6 }, unitIds: [pikachuId] }]);
    respawnAt = Infinity;
  }
}

function advance(dt: number): void {
  acc += dt;
  while (acc >= STEP) {
    script();
    view3d.beforeStep();
    view3d.handleEvents(battle.step());
    acc -= STEP;
    simTime += STEP;
  }
}

function frame(dt: number): void {
  advance(dt);
  renderTime += dt;
  view3d.update(acc / STEP, renderTime, dt);
  fx.update(dt, engine.camera);
  updateCamera(dt);
  engine.render();
}

// ------------------------------------------------------------------ interfaz

let speed = 1;
let paused = false;
const camBtn = document.getElementById('cam')!;
const slowBtn = document.getElementById('slow')!;
const pauseBtn = document.getElementById('pause')!;
const setCam = (n: CamName) => {
  camName = n;
  camBtn.textContent = `Cámara: ${n}`;
};
setCam(camName);
camBtn.addEventListener('click', () => setCam(camName === 'juego' ? 'detalle' : camName === 'detalle' ? 'personaje' : 'juego'));
slowBtn.addEventListener('click', () => {
  speed = speed === 1 ? 0.25 : 1;
  slowBtn.textContent = `Velocidad: ${speed === 1 ? '1x' : '0,25x'}`;
});
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Seguir' : 'Pausa';
});

const fpsEl = document.getElementById('fps')!;
let fpsFrames = 0;
let fpsTime = 0;

await document.fonts.load('72px "Lilita One"').catch(() => undefined);

if (!captureMode) {
  let last = performance.now();
  const loop = (now: number) => {
    const real = Math.min(0.25, (now - last) / 1000); // tope anti-espiral, como en la batalla
    last = now;
    if (!paused) frame(real * speed);
    else engine.render();
    fpsFrames++;
    fpsTime += real;
    if (fpsTime > 0.5) {
      fpsEl.textContent = `${Math.round(fpsFrames / fpsTime)} fps · ${engine.quality}`;
      fpsFrames = 0;
      fpsTime = 0;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
} else {
  frame(0);
}

// Gancho para pruebas y capturas deterministas
(window as unknown as { __ref: unknown }).__ref = {
  get battle() {
    return battle;
  },
  engine,
  advance(seconds: number, fps = 30) {
    const dt = 1 / fps;
    for (let t = 0; t < seconds - 1e-9; t += dt) frame(dt);
    engine.render();
  },
  setCamera(n: CamName) {
    setCam(n);
    const pose = poseFor(n);
    camPos.copy(pose.pos);
    camTarget.copy(pose.target);
    camFovSnap(pose.fov);
    updateCamera(0);
    engine.render();
  },
  stats() {
    const info = engine.renderer.info;
    return { calls: info.render.calls, triangles: info.render.triangles, geometries: info.memory.geometries, textures: info.memory.textures, effects: fx.count, tick: battle.tick };
  },
  debug: () => view3d.debugState(),
  ready: true,
};
