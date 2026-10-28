import * as THREE from 'three';
import type { Battle } from '../sim/battle';
import type { SimEvent, Team } from '../sim/core/state';
import type { Vec } from '../sim/core/vec';
import { ARENA, snapToTile } from '../sim/data/arena';
import { getCard } from '../sim/data/cards';
import { ELEMENT_COLORS } from '../sim/data/elements';
import { Arena3D } from './arena3d';
import { BattleView3D, UNIT_SCALE } from './battleView3d';
import type { CreatureRig } from './creatures/rig';
import { createRig } from './creatures/registry';
import { Engine } from './engine';
import { Effects } from './fx/effects';

/** ¿Puede este navegador dibujar la capa 3D? (WebGL disponible y no desactivado por URL). */
export function canUse3D(): boolean {
  try {
    if (new URLSearchParams(location.search).get('vista') === '2d') return false;
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

export interface LayerFrame {
  /** Fracción de la pantalla del juego ocupada por la barra superior y por el HUD inferior. */
  topFraction: number;
  hudFraction: number;
}

/**
 * Capa 3D de la batalla jugable: un lienzo WebGL detrás del lienzo de Phaser (que queda
 * transparente sobre el campo y dibuja solo el HUD). Lee la simulación sin modificarla.
 *
 * - Sigue el tamaño y la posición del lienzo de Phaser (que se escala para encajar).
 * - Convierte coordenadas de pantalla del juego en casillas con un rayo contra el suelo,
 *   así tocar el campo en perspectiva despliega exactamente donde se ve.
 * - Dibuja el fantasma de despliegue (modelo translúcido, alcance) y las zonas prohibidas.
 */
export class Battle3DLayer {
  readonly canvas = document.createElement('canvas');
  readonly engine: Engine;
  readonly arena = new Arena3D();
  readonly fx: Effects;
  readonly view: BattleView3D;
  private readonly raycaster = new THREE.Raycaster();
  private readonly ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private rectKey = '';
  private time = 0;
  // Fantasma de despliegue
  private readonly ghost = new THREE.Group();
  private readonly ghostDisc: THREE.Mesh;
  private readonly ghostRange: THREE.Mesh;
  private ghostRigs: CreatureRig[] = [];
  private ghostCard = '';
  // Zonas donde no se puede desplegar
  private readonly zones: THREE.Mesh;
  private readonly zoneData = new Uint8Array(ARENA.width * ARENA.height * 4);
  private readonly zoneTex: THREE.DataTexture;
  private zoneKey = '';

  constructor(
    private readonly battle: Battle,
    private readonly phaserCanvas: HTMLCanvasElement,
    frame: LayerFrame,
  ) {
    const host = phaserCanvas.parentElement!;
    this.canvas.className = 'arena3d';
    Object.assign(this.canvas.style, { position: 'absolute', zIndex: '0', pointerEvents: 'none', display: 'block' });
    host.insertBefore(this.canvas, phaserCanvas);
    phaserCanvas.style.position = 'relative';
    phaserCanvas.style.zIndex = '1';

    this.engine = new Engine(this.canvas);
    this.engine.topFraction = frame.topFraction;
    this.engine.hudFraction = frame.hudFraction;
    this.engine.scene.add(this.arena.group);
    this.fx = new Effects(this.engine.scene, battle.seed ^ 0x5eed);
    this.view = new BattleView3D(battle, this.engine.scene, this.fx, 'voxel');

    // Fantasma: disco de colocación y aro de alcance
    this.ghostDisc = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.4, depthWrite: false }));
    this.ghostDisc.rotation.x = -Math.PI / 2;
    this.ghostDisc.position.y = 0.06;
    this.ghostDisc.renderOrder = 20;
    this.ghostRange = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
    this.ghostRange.rotation.x = -Math.PI / 2;
    this.ghostRange.position.y = 0.07;
    this.ghostRange.renderOrder = 21;
    this.ghost.add(this.ghostDisc, this.ghostRange);
    this.ghost.visible = false;
    this.engine.scene.add(this.ghost);

    this.zoneTex = new THREE.DataTexture(this.zoneData, ARENA.width, ARENA.height);
    this.zoneTex.magFilter = THREE.NearestFilter;
    this.zoneTex.minFilter = THREE.NearestFilter;
    this.zones = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.width, ARENA.height), new THREE.MeshBasicMaterial({ map: this.zoneTex, transparent: true, depthWrite: false }));
    this.zones.rotation.x = -Math.PI / 2;
    this.zones.position.set(ARENA.width / 2, 0.05, ARENA.height / 2);
    this.zones.renderOrder = 10;
    this.zones.visible = false;
    this.engine.scene.add(this.zones);
    this.syncSize();
  }

  /** Ajusta el lienzo 3D al rectángulo del lienzo de Phaser (cambia al girar o redimensionar). */
  private syncSize(): void {
    const r = this.phaserCanvas.getBoundingClientRect();
    const host = this.phaserCanvas.parentElement!.getBoundingClientRect();
    const key = `${r.left - host.left}|${r.top - host.top}|${r.width}|${r.height}`;
    if (key === this.rectKey || r.width < 1 || r.height < 1) return;
    this.rectKey = key;
    Object.assign(this.canvas.style, { left: `${r.left - host.left}px`, top: `${r.top - host.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    this.engine.resize(Math.round(r.width), Math.round(r.height));
    const ph = r.height * this.engine.renderer.getPixelRatio();
    this.fx.additive.setViewport(ph, this.engine.camera.fov);
    this.fx.soft.setViewport(ph, this.engine.camera.fov);
  }

  beforeStep(): void {
    this.view.beforeStep();
  }

  handleEvents(events: SimEvent[]): void {
    this.view.handleEvents(events);
  }

  /** Dibuja un fotograma. `alpha` = interpolación entre pasos de simulación. */
  render(alpha: number, dt: number): void {
    this.syncSize();
    this.time += dt;
    this.view.update(alpha, this.time, dt);
    for (const r of this.ghostRigs) r.pose({ time: this.time, dt, run: 0, charge: 0, release: 0, hurt: 0, stunned: false });
    this.fx.update(dt, this.engine.camera);
    this.arena.update(this.time, this.engine.scene.fog as THREE.Fog);
    this.engine.render();
  }

  /** Casilla bajo un punto de la pantalla del juego (coordenadas normalizadas 0..1). */
  pick(nx: number, ny: number): Vec | null {
    this.raycaster.setFromCamera(new THREE.Vector2(nx * 2 - 1, 1 - ny * 2), this.engine.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.ground, hit)) return null;
    return { x: hit.x, y: hit.z };
  }

  /** Punto de la pantalla del juego (0..1) donde se ve una casilla. */
  project(tile: Vec, height = 0): Vec {
    const p = new THREE.Vector3(tile.x, height, tile.y).project(this.engine.camera);
    return { x: (p.x + 1) / 2, y: (1 - p.y) / 2 };
  }

  /** Muestra el fantasma de despliegue (o lo oculta con `null`). */
  setGhost(cardId: string | null, tile: Vec | null, valid: boolean): void {
    if (!cardId || !tile) {
      this.ghost.visible = false;
      return;
    }
    const card = getCard(cardId);
    const at = snapToTile(tile);
    this.ghost.visible = true;
    this.ghost.position.set(at.x, 0, at.y);
    const color = valid ? 0x5cf08a : 0xff4a3a;
    (this.ghostDisc.material as THREE.MeshBasicMaterial).color.setHex(card.kind === 'hechizo' ? ELEMENT_COLORS[card.types[0]] : color);
    (this.ghostDisc.material as THREE.MeshBasicMaterial).opacity = card.kind === 'hechizo' ? (valid ? 0.35 : 0.15) : 0.45;
    if (card.kind === 'hechizo') {
      this.ghostDisc.scale.setScalar(card.radius);
      this.ghostRange.scale.setScalar(card.radius);
      (this.ghostRange.material as THREE.MeshBasicMaterial).color.setHex(color);
    } else {
      this.ghostDisc.scale.setScalar(card.radius + 0.12);
      this.ghostRange.scale.setScalar(card.range + card.radius);
      (this.ghostRange.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
    }
    if (this.ghostCard !== cardId) this.buildGhostRigs(cardId);
    for (const r of this.ghostRigs) r.setOpacity(valid ? 0.6 : 0.3);
  }

  private buildGhostRigs(cardId: string): void {
    for (const r of this.ghostRigs) {
      this.ghost.remove(r.root);
      r.dispose();
    }
    this.ghostRigs = [];
    this.ghostCard = cardId;
    const card = getCard(cardId);
    if (card.kind !== 'pokemon') return;
    for (let i = 0; i < card.count; i++) {
      const rig = createRig(cardId, 'voxel');
      const a = (i / card.count) * Math.PI * 2;
      const off = card.count > 1 ? card.radius * 1.1 : 0;
      rig.root.position.set(Math.cos(a) * off, card.locomotion === 'aire' ? 1.1 : 0, Math.sin(a) * off);
      rig.root.scale.setScalar(UNIT_SCALE);
      rig.root.rotation.y = Math.PI;
      rig.root.traverse((o) => (o.castShadow = false));
      this.ghost.add(rig.root);
      this.ghostRigs.push(rig);
    }
  }

  /** Sombrea las casillas donde no se puede desplegar `cardId` (null = ocultar). */
  showZones(team: Team, cardId: string | null): void {
    const towersKey = this.battle.world.towers.map((t) => (t.destroyed ? 1 : 0)).join('');
    const key = cardId === null ? '' : `${getCard(cardId).kind}|${towersKey}`;
    if (key === this.zoneKey) return;
    this.zoneKey = key;
    this.zones.visible = key !== '';
    if (!cardId) return;
    for (let ty = 0; ty < ARENA.height; ty++) {
      for (let tx = 0; tx < ARENA.width; tx++) {
        // La textura empieza abajo: la fila 0 de datos es la fila inferior del plano.
        const i = ((ARENA.height - 1 - ty) * ARENA.width + tx) * 4;
        const blocked = !this.battle.isDeployZone(team, cardId, { x: tx + 0.5, y: ty + 0.5 });
        this.zoneData.set(blocked ? [255, 60, 50, 80] : [255, 255, 255, 0], i);
      }
    }
    this.zoneTex.needsUpdate = true;
  }

  dispose(): void {
    this.engine.renderer.dispose();
    this.engine.renderer.forceContextLoss();
    this.canvas.remove();
  }
}
