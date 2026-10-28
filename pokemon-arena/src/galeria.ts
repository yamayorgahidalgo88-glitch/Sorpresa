import * as THREE from 'three';
import { CARDS } from './sim/data/cards';
import { createRig } from './render3d/creatures/registry';
import type { CreatureRig, PoseInput } from './render3d/creatures/rig';
import { Engine } from './render3d/engine';
import { UNIT_SCALE } from './render3d/battleView3d';

/**
 * Galería de modelos (herramienta de revisión, hito F): todos los Pokémon del catálogo en
 * fila, con la misma luz y escala que en batalla. ?pose= fija la animación; ?captura=1
 * congela el tiempo para capturas deterministas (window.__galeria.advance).
 */
const params = new URLSearchParams(location.search);
const style = params.get('estilo') === 'suave' ? 'suave' : 'voxel';
const poseName = params.get('pose') ?? 'reposo';
const canvas = document.getElementById('c') as HTMLCanvasElement;
const engine = new Engine(canvas, 'alto');

const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshStandardMaterial({ color: 0x76c84a, roughness: 0.9 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
engine.scene.add(ground);

const ids = Object.values(CARDS).filter((c) => c.kind === 'pokemon').map((c) => c.id);
const rigs: { id: string; rig: CreatureRig }[] = [];
const cols = 7;
ids.forEach((id, i) => {
  const rig = createRig(id, style);
  const row = Math.floor(i / cols);
  const col = i % cols;
  rig.root.position.set((col - (cols - 1) / 2) * 3.4 + (row % 2) * 1.2, 0, row * -4.4);
  rig.root.scale.setScalar(UNIT_SCALE);
  rig.root.rotation.y = -0.35;
  engine.scene.add(rig.root);
  rigs.push({ id, rig });
});

engine.sun.position.set(-8, 20, 14);
engine.sun.target.position.set(0, 0, -2);

/** ?foco=<id>: primer plano frontal de un solo Pokémon (se ocultan los demás). */
const focus = rigs.find((r) => r.id === params.get('foco'));
if (focus) {
  for (const r of rigs) r.rig.root.visible = r === focus;
  focus.rig.root.position.set(0, 0, 0);
  focus.rig.root.rotation.y = -0.45;
}

function resize(): void {
  engine.resize(innerWidth, innerHeight);
  engine.camera.fov = 30;
  if (focus) {
    const h = focus.rig.height * UNIT_SCALE;
    engine.camera.position.set(0, h * 0.95, h * 2.6 + 1.5);
    engine.camera.lookAt(0, h * 0.5, 0);
  } else {
    engine.camera.position.set(0, 22, 18);
    engine.camera.lookAt(0, 1.2, -8.5);
  }
  engine.camera.updateProjectionMatrix();
  engine.fitFog(60);
}
addEventListener('resize', resize);
resize();

let time = 0;
function frame(dt: number): void {
  time += dt;
  const cyc = (time % 1.2) / 1.2;
  const pose: PoseInput = {
    time,
    dt,
    run: poseName === 'carrera' ? 1 : 0,
    charge: poseName === 'carga' ? 1 : poseName === 'ciclo' ? Math.min(1, cyc * 2) * (cyc < 0.5 ? 1 : 0) : 0,
    release: poseName === 'golpe' ? 1 : poseName === 'ciclo' && cyc >= 0.5 ? 1 - (cyc - 0.5) * 2 : 0,
    hurt: 0,
    stunned: false,
  };
  for (const { rig } of rigs) rig.pose(pose);
  engine.render();
}

if (params.get('captura') === '1') {
  document.getElementById('info')!.style.display = 'none';
  frame(0.5);
}
else {
  let last = performance.now();
  const loop = (now: number) => {
    frame(Math.min(0.1, (now - last) / 1000));
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

(window as unknown as { __galeria: unknown }).__galeria = {
  ready: true,
  advance: (s: number) => frame(s),
  ids,
};
