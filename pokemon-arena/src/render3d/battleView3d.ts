import * as THREE from 'three';
import type { Battle } from '../sim/battle';
import type { Projectile, SimEvent, TowerEntity, UnitEntity } from '../sim/core/state';
import type { Vec } from '../sim/core/vec';
import { getCard } from '../sim/data/cards';
import type { PokemonCard } from '../sim/data/cards';
import { ELEMENT_COLORS } from '../sim/data/elements';
import type { CreatureRig, PoseInput } from './creatures/rig';
import { createRig } from './creatures/registry';
import type { CreatureStyle } from './creatures/registry';
import type { Effects } from './fx/effects';
import { ProjectileVisual, familyFor } from './fx/effects';
import { PAL } from './palette';
import { softDiscTexture } from './textures';
import { TowerRuins } from './ruins';
import { TowerModel } from './towerModel';

const FLY = 1.1;
/**
 * Escala visual de los personajes respecto a su radio de colisión: se agrandan para que se
 * lean bien en la cámara de juego (decisión de dirección artística; no cambia las reglas).
 */
export const UNIT_SCALE = 1.6;
/** Pasos de simulación antes del golpe durante los que se anima la carga (0,3 s). */
const CHARGE_TICKS = 6;

const toWorld = (p: Vec, y = 0) => new THREE.Vector3(p.x, y, p.y);

/**
 * Barra de vida en el mundo: un único sprite (siempre de cara a la cámara) cuya textura se
 * redibuja solo cuando cambia la salud. Marco oscuro redondeado, relleno con brillo y, en
 * las torres, el número de PS encima.
 */
class HpBar {
  readonly sprite: THREE.Sprite;
  private readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly tex: THREE.CanvasTexture;
  private key = '';
  constructor(width: number, private readonly withText: boolean) {
    this.canvas.width = 160;
    this.canvas.height = withText ? 72 : 28;
    this.ctx = this.canvas.getContext('2d')!;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, depthTest: false, transparent: true }));
    this.sprite.scale.set(width, (width * this.canvas.height) / this.canvas.width, 1);
    this.sprite.center.set(0.5, 0);
    this.sprite.renderOrder = 50;
  }
  get group(): THREE.Sprite {
    return this.sprite;
  }
  set(frac: number, hp: number, color: number): void {
    const key = `${Math.round(frac * 200)}|${hp}|${color}`;
    if (key === this.key) return;
    this.key = key;
    const { ctx, canvas } = this;
    const w = canvas.width;
    const barH = 22;
    const y = canvas.height - barH - 3;
    ctx.clearRect(0, 0, w, canvas.height);
    ctx.fillStyle = '#1d1410';
    ctx.beginPath();
    ctx.roundRect(2, y, w - 4, barH, 9);
    ctx.fill();
    const fill = frac > 0.3 ? color : 0xff3b30;
    const css = '#' + fill.toString(16).padStart(6, '0');
    const fw = Math.max(0, (w - 12) * frac);
    if (fw > 0) {
      ctx.fillStyle = css;
      ctx.beginPath();
      ctx.roundRect(6, y + 4, fw, barH - 8, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(9, y + 6, Math.max(0, fw - 6), 4);
    }
    if (this.withText) {
      ctx.font = '40px "Lilita One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.lineWidth = 9;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1d1410';
      ctx.strokeText(String(hp), w / 2, y - 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(hp), w / 2, y - 6);
    }
    this.tex.needsUpdate = true;
  }
}

class UnitView3D {
  readonly root = new THREE.Group();
  readonly rig: CreatureRig;
  readonly hp: HpBar;
  private readonly shadow: THREE.Mesh;
  private readonly deployRing: THREE.Mesh;
  private yaw = 0;
  run = 0;
  charge = 0;
  release = 0;
  hurt = 0;
  flash = 0;
  spawnAge = 0;
  deathAge = -1;
  readonly flyer: boolean;

  constructor(readonly id: number, readonly team: 0 | 1, readonly cardId: string, scene: THREE.Scene, shadowTex: THREE.Texture, style: CreatureStyle) {
    const card = getCard(cardId) as PokemonCard;
    this.flyer = card.locomotion === 'aire';
    this.rig = createRig(cardId, style);
    this.root.add(this.rig.root);
    this.yaw = team === 0 ? Math.PI : 0;
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTex, color: 0x000000, transparent: true, opacity: this.flyer ? 0.28 : 0.5, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
    const s = card.radius * 2.6 * UNIT_SCALE;
    this.shadow.scale.set(s, s, 1);
    this.shadow.renderOrder = 2;
    this.root.add(this.shadow);
    // Aro del equipo bajo los pies (lectura de bando) que además muestra el despliegue.
    this.deployRing = new THREE.Mesh(
      new THREE.RingGeometry(card.radius * 1.05, card.radius * 1.3, 40),
      new THREE.MeshBasicMaterial({ color: PAL.team[team], transparent: true, opacity: 0.85, depthWrite: false }),
    );
    this.deployRing.rotation.x = -Math.PI / 2;
    this.deployRing.position.y = 0.03;
    this.deployRing.renderOrder = 3;
    this.root.add(this.deployRing);
    this.hp = new HpBar(Math.max(0.95, card.radius * 2.2), false);
    this.root.add(this.hp.group);
    scene.add(this.root);
  }

  faceTowards(dx: number, dz: number, dt: number): void {
    if (Math.abs(dx) + Math.abs(dz) < 1e-4) return;
    const target = Math.atan2(dx, dz);
    let d = target - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += d * Math.min(1, dt * 12);
  }

  update(u: UnitEntity | null, pos: THREE.Vector3, time: number, dt: number, tick: number): void {
    this.root.position.copy(pos);
    this.rig.root.rotation.y = this.yaw;
    const baseY = this.flyer ? FLY + Math.sin(time * 3 + this.id) * 0.08 : 0;

    // Aparición: cae desde arriba con estiramiento y aterriza aplastándose.
    this.spawnAge += dt;
    const drop = Math.min(1, this.spawnAge / 0.32);
    const fall = (1 - drop * drop) * 2.4;
    const land = this.spawnAge > 0.32 ? Math.max(0, 1 - (this.spawnAge - 0.32) / 0.22) : 0;
    this.rig.root.position.y = baseY + fall;
    const stretch = drop < 1 ? 1.15 : 1 - land * 0.25;
    this.rig.root.scale.set((2 - stretch) * UNIT_SCALE, stretch * UNIT_SCALE, (2 - stretch) * UNIT_SCALE);

    this.release = Math.max(0, this.release - dt * 4.5);
    this.hurt = Math.max(0, this.hurt - dt * 5);
    this.flash = Math.max(0, this.flash - dt * 7);
    if (this.deathAge >= 0) return this.updateDeath(dt);

    const pose: PoseInput = {
      time: time + this.id * 0.37,
      dt,
      run: this.run,
      charge: this.charge,
      release: this.release,
      hurt: this.hurt,
      stunned: !!u && tick < u.status.stunUntil,
    };
    this.rig.pose(pose);
    // Destello de daño cálido y breve (no blanquea al personaje); brillo eléctrico al cargar.
    this.rig.setFlash(Math.max(this.flash * 0.6, this.charge * 0.18), this.flash * 0.6 > this.charge * 0.18 ? 0xffb0a0 : 0xfff1a0);

    if (u) {
      const deploying = u.deployTicks > 0;
      this.deployRing.scale.setScalar(deploying ? 1 + u.deployTicks / 40 : 1);
      (this.deployRing.material as THREE.MeshBasicMaterial).opacity = deploying ? 0.95 : 0.55;
      this.hp.set(u.hp / u.maxHp, u.hp, PAL.team[this.team]);
      this.hp.group.position.y = baseY + this.rig.height * UNIT_SCALE + 0.2;
      this.hp.group.visible = u.hp < u.maxHp;
    }
  }

  private updateDeath(dt: number): void {
    this.deathAge += dt;
    const t = Math.min(1, this.deathAge / 0.75);
    this.rig.root.position.y += Math.sin(t * Math.PI) * 0.6;
    this.rig.root.rotation.y = this.yaw + t * 7;
    const s = (1 - t * 0.85) * UNIT_SCALE;
    this.rig.root.scale.set(s, s, s);
    this.rig.setOpacity(1 - t);
    this.rig.setFlash(1 - t);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t);
    (this.deployRing.material as THREE.MeshBasicMaterial).opacity = 0;
    this.hp.group.visible = false;
  }

  get dead(): boolean {
    return this.deathAge >= 0.75;
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.root);
    this.rig.dispose();
  }
}

class TowerView3D {
  readonly model: TowerModel;
  readonly hp: HpBar;
  private collapse = -1;
  private ruins: TowerRuins | null = null;
  private smokeT = 0;
  constructor(readonly t: TowerEntity, private readonly scene: THREE.Scene) {
    this.model = new TowerModel(t.team, t.role === 'base' ? 'base' : 'guardia');
    this.model.root.position.copy(toWorld(t.pos));
    this.hp = new HpBar(t.role === 'base' ? 2.5 : 2.1, true);
    this.hp.group.position.set(t.pos.x, this.model.topY - 0.25, t.pos.y);
    scene.add(this.model.root, this.hp.group);
  }
  update(time: number, dt: number, fx: Effects): void {
    const t = this.t;
    this.model.update(time, dt, t.active && !t.destroyed);
    this.hp.set(t.hp / t.maxHp, t.hp, PAL.team[t.team]);
    this.hp.group.visible = !t.destroyed;
    if (t.destroyed) {
      if (this.collapse < 0) {
        this.collapse = 0;
        const p = toWorld(t.pos, 1.5);
        fx.impact(p, familyFor(null, t.team), 2.2);
        fx.defeatPoof(p, PAL.team[t.team]);
      }
      // Derrumbe: la torre se hunde inclinándose entre polvo y emergen las ruinas.
      if (!this.ruins) {
        this.ruins = new TowerRuins(t.team, t.role === 'base' ? 'base' : 'guardia', 1000 + t.id * 17);
        this.ruins.root.position.copy(toWorld(t.pos));
        this.scene.add(this.ruins.root);
      }
      const before = this.collapse;
      this.collapse = Math.min(1, this.collapse + dt * 0.8);
      const k = this.collapse;
      this.model.root.position.y = -k * k * 6;
      this.model.root.rotation.z = k * 0.35;
      this.model.root.visible = k < 1;
      this.ruins.setRise(THREE.MathUtils.clamp((k - 0.15) / 0.7, 0, 1));
      // Polvo durante el derrumbe y humo que sigue saliendo de las ruinas.
      const base = toWorld(t.pos, 0.3);
      if (before < 0.6) {
        for (let i = 0; i < 3; i++) {
          const a = fx.rand(0, Math.PI * 2);
          fx.soft.emit({
            pos: base.clone().add(new THREE.Vector3(Math.cos(a) * 1.3, fx.rand(0, 0.8), Math.sin(a) * 1.3)),
            vel: new THREE.Vector3(Math.cos(a) * fx.rand(0.5, 1.6), fx.rand(0.3, 1.2), Math.sin(a) * fx.rand(0.5, 1.6)),
            color: new THREE.Color(0xd9cdb6),
            size: fx.rand(0.7, 1.2),
            life: fx.rand(0.7, 1.2),
            drag: 0.85,
            grow: 1.8,
          });
        }
      }
      this.smokeT -= dt;
      if (this.smokeT <= 0) {
        this.smokeT = 0.35;
        fx.soft.emit({
          pos: base.clone().add(new THREE.Vector3(fx.rand(-0.4, 0.4), this.ruins.smokeY, fx.rand(-0.4, 0.4))),
          vel: new THREE.Vector3(fx.rand(-0.1, 0.1) + 0.2, fx.rand(0.6, 0.9), fx.rand(-0.1, 0.1)),
          color: new THREE.Color(0x6b655f),
          size: fx.rand(0.45, 0.7),
          life: fx.rand(1.6, 2.4),
          drag: 0.95,
          grow: 2.4,
        });
      }
    }
  }
}

/**
 * Vista 3D de una batalla: lee el estado de la simulación (solo lectura) y sus eventos.
 * Las reglas no cambian; esta capa solo dibuja.
 */
export class BattleView3D {
  private readonly units = new Map<number, UnitView3D>();
  private readonly towers = new Map<number, TowerView3D>();
  private readonly projectiles = new Map<number, { vis: ProjectileVisual; start: THREE.Vector3; dist0: number; startY: number; endY: number; last: THREE.Vector3; element: string | null; team: 0 | 1 }>();
  private prev = new Map<number, Vec>();
  private readonly shadowTex = softDiscTexture('rgba(0,0,0,1)', 'rgba(0,0,0,0)');
  private readonly tmp = new THREE.Vector3();
  /** Aviso en el suelo de un hechizo lanzado que aún no ha impactado. */
  private readonly telegraphs: { key: string; mesh: THREE.Mesh; age: number; life: number }[] = [];

  constructor(
    private readonly battle: Battle,
    private readonly scene: THREE.Scene,
    private readonly fx: Effects,
    private readonly style: CreatureStyle = 'suave',
  ) {
    for (const t of battle.world.towers) this.towers.set(t.id, new TowerView3D(t, scene));
  }

  /** Llamar antes de cada paso de simulación (para interpolar). */
  beforeStep(): void {
    this.prev = new Map();
    for (const u of this.battle.world.units) this.prev.set(u.id, { x: u.pos.x, y: u.pos.y });
    for (const p of this.battle.world.projectiles) this.prev.set(p.id, { x: p.pos.x, y: p.pos.y });
  }

  private lerp(id: number, cur: Vec, alpha: number): Vec {
    const p = this.prev.get(id) ?? cur;
    return { x: p.x + (cur.x - p.x) * alpha, y: p.y + (cur.y - p.y) * alpha };
  }

  /** Altura de impacto/salida de una entidad. */
  private bodyY(id: number): number {
    const v = this.units.get(id);
    if (v) return (v.flyer ? FLY : 0) + v.rig.height * UNIT_SCALE * 0.5;
    const t = this.towers.get(id);
    if (t) return t.model.muzzle.position.y * 0.6;
    return 0.6;
  }

  handleEvents(events: SimEvent[]): void {
    const w = this.battle.world;
    for (const e of events) {
      switch (e.type) {
        case 'despliegue':
          for (const id of e.unitIds) {
            const u = w.entities.get(id);
            if (u && u.kind === 'unit') this.units.set(id, new UnitView3D(id, u.team, u.cardId, this.scene, this.shadowTex, this.style));
          }
          this.fx.deployBurst(toWorld(e.pos), PAL.team[e.team]);
          break;
        case 'ataque': {
          const uv = this.units.get(e.sourceId);
          if (uv) {
            uv.release = 1;
            uv.charge = 0;
            const card = getCard(uv.cardId) as PokemonCard;
            const fam = familyFor(card.attack.element ?? card.types[0]);
            this.fx.launch(this.emitterOf(uv), fam);
          }
          const tv = this.towers.get(e.sourceId);
          if (tv) {
            tv.model.shoot();
            this.fx.launch(tv.model.muzzleWorld(this.tmp.clone()), familyFor(null, tv.t.team));
          }
          break;
        }
        case 'proyectil': {
          const p = w.projectiles.find((x) => x.id === e.projectileId);
          if (!p) break;
          const uv = this.units.get(e.sourceId);
          const tv = this.towers.get(e.sourceId);
          const start = uv ? this.emitterOf(uv) : tv ? tv.model.muzzleWorld(new THREE.Vector3()) : toWorld(p.pos, 0.6);
          const fam = familyFor(e.element, tv ? tv.t.team : undefined);
          const vis = new ProjectileVisual(this.fx, fam, !!uv);
          vis.group.position.copy(start);
          if (uv) vis.origin = start.clone();
          const dist0 = Math.max(0.5, Math.hypot(p.aim.x - p.pos.x, p.aim.y - p.pos.y));
          this.projectiles.set(p.id, { vis, start, dist0, startY: start.y, endY: this.bodyY(e.targetId), last: start.clone(), element: e.element, team: p.team });
          break;
        }
        case 'dano': {
          const uv = this.units.get(e.targetId);
          const tv = this.towers.get(e.targetId);
          let at: THREE.Vector3 | null = null;
          if (uv) {
            uv.hurt = 1;
            uv.flash = 1;
            at = uv.root.position.clone().add(new THREE.Vector3(0, (uv.flyer ? FLY : 0) + uv.rig.height * UNIT_SCALE + 0.3, 0));
          } else if (tv) {
            tv.model.hit(e.amount > 100 ? 1.4 : 1);
            at = toWorld(tv.t.pos, tv.model.topY - 0.6);
          }
          if (at && e.amount > 0) this.fx.damageNumber(at, e.amount, e.effectiveness);
          break;
        }
        case 'curacion': {
          const uv = this.units.get(e.targetId);
          if (uv) this.fx.healNumber(uv.root.position.clone().add(new THREE.Vector3(0, uv.rig.height * UNIT_SCALE + 0.3, 0)), e.amount);
          break;
        }
        case 'cadena': {
          for (let i = 0; i < e.points.length - 1; i++) {
            this.fx.bolt(toWorld(e.points[i], 0.6), toWorld(e.points[i + 1], 0.6), 0xffe14a, 0.28, 1.2);
          }
          break;
        }
        case 'muerte': {
          const uv = this.units.get(e.unitId);
          if (uv) {
            uv.deathAge = 0;
            this.fx.defeatPoof(uv.root.position.clone(), ELEMENT_COLORS[getCard(uv.cardId).types[0]]);
          }
          break;
        }
        case 'hechizo_lanzado': {
          const card = getCard(e.cardId);
          if (card.kind !== 'hechizo') break;
          const color = ELEMENT_COLORS[card.types[0]];
          const mesh = new THREE.Mesh(
            new THREE.CircleGeometry(card.radius, 48),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false }),
          );
          const edge = new THREE.Mesh(new THREE.RingGeometry(card.radius - 0.12, card.radius, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
          mesh.add(edge);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.copy(toWorld(e.pos, 0.05));
          mesh.renderOrder = 12;
          this.scene.add(mesh);
          this.telegraphs.push({ key: `${e.cardId}|${e.pos.x}|${e.pos.y}`, mesh, age: 0, life: e.delayTicks / this.battle.rules.tickRate });
          break;
        }
        case 'hechizo_impacto': {
          const key = `${e.cardId}|${e.pos.x}|${e.pos.y}`;
          const i = this.telegraphs.findIndex((t) => t.key === key);
          if (i >= 0) this.removeTelegraph(i);
          const at = toWorld(e.pos, 0.3);
          if (e.cardId === 'rayo') {
            const fam = familyFor('electrico');
            for (let k = 0; k < 5; k++) {
              const a = this.fx.rand(0, Math.PI * 2);
              const d = k === 0 ? 0 : this.fx.rand(0.3, e.radius * 0.8);
              const ground = at.clone().add(new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d));
              this.fx.bolt(ground.clone().add(new THREE.Vector3(this.fx.rand(-0.8, 0.8), 9, this.fx.rand(-0.8, 0.8))), ground, 0xffe14a, 0.3, k === 0 ? 2.4 : 1.3);
            }
            this.fx.impact(at, fam, 1.8);
            this.fx.groundRing(at, 0xffe14a, e.radius, 0.5);
          } else {
            const fam = familyFor('hielo');
            for (let k = 0; k < 90; k++) {
              const a = this.fx.rand(0, Math.PI * 2);
              const d = Math.sqrt(this.fx.rand(0, 1)) * e.radius;
              this.fx.soft.emit({
                pos: at.clone().add(new THREE.Vector3(Math.cos(a) * d, this.fx.rand(0.5, 3.5), Math.sin(a) * d)),
                vel: new THREE.Vector3(this.fx.rand(-1.5, 1.5), this.fx.rand(-3, -1), this.fx.rand(-1.5, 1.5)),
                color: new THREE.Color(this.fx.pick([0xffffff, 0xd8f6ff, 0xa8e6ff])),
                size: this.fx.rand(0.12, 0.3),
                life: this.fx.rand(0.6, 1.3),
                drag: 0.9,
              });
            }
            this.fx.impact(at, fam, 1.4);
            this.fx.groundRing(at, 0x9fe8ff, e.radius, 0.8);
          }
          break;
        }
        case 'impacto_area':
          this.fx.groundRing(toWorld(e.pos), e.element ? ELEMENT_COLORS[e.element] : 0xffffff, e.radius, 0.35);
          break;
        case 'canto': {
          const at = toWorld(e.pos, 0.8);
          this.fx.groundRing(toWorld(e.pos), 0xff9ad0, e.radius, 0.7);
          for (let k = 0; k < 18; k++) {
            const a = (k / 18) * Math.PI * 2;
            this.fx.additive.emit({
              pos: at.clone(),
              vel: new THREE.Vector3(Math.cos(a) * e.radius * 0.9, this.fx.rand(0.4, 1.2), Math.sin(a) * e.radius * 0.9),
              color: new THREE.Color(k % 2 ? 0xff9ad0 : 0xffffff),
              size: 0.3,
              life: 1,
              drag: 0.5,
            });
          }
          for (const id of e.targetIds) {
            const uv = this.units.get(id);
            if (uv) this.fx.flash(uv.root.position.clone().add(new THREE.Vector3(0, uv.rig.height * UNIT_SCALE + 0.2, 0)), 0xff9ad0, 0.6, 0.4);
          }
          break;
        }
        case 'explosion': {
          const at = toWorld(e.pos, 0.5);
          this.fx.impact(at, familyFor('roca'), 2.2);
          this.fx.impact(at, familyFor('fuego'), 1.2);
          this.fx.groundRing(toWorld(e.pos), 0xffb347, e.radius, 0.5);
          break;
        }
        default:
          break;
      }
    }
  }

  private removeTelegraph(i: number): void {
    const t = this.telegraphs[i];
    this.scene.remove(t.mesh);
    t.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.telegraphs.splice(i, 1);
  }

  private emitterOf(uv: UnitView3D): THREE.Vector3 {
    const r = uv.rig as CreatureRig & { mouthWorld?: (o: THREE.Vector3) => THREE.Vector3 };
    return r.mouthWorld ? r.mouthWorld(new THREE.Vector3()) : uv.root.position.clone().add(new THREE.Vector3(0, uv.rig.height * UNIT_SCALE * 0.6, 0));
  }

  update(alpha: number, time: number, dt: number): void {
    const w = this.battle.world;
    const live = new Set<number>();
    for (const u of w.units) {
      live.add(u.id);
      const v = this.units.get(u.id);
      if (!v) continue;
      const p = this.lerp(u.id, u.pos, alpha);
      const prev = this.prev.get(u.id) ?? u.pos;
      const moving = Math.hypot(u.pos.x - prev.x, u.pos.y - prev.y) > 0.005;
      v.run += ((moving && u.deployTicks <= 0 ? 1 : 0) - v.run) * Math.min(1, dt * 10);
      // Mirar hacia donde camina o hacia su objetivo cuando ataca
      const target = u.targetId !== null ? w.entities.get(u.targetId) : undefined;
      if (u.engaged && target) v.faceTowards(target.pos.x - u.pos.x, target.pos.y - u.pos.y, dt);
      else if (moving) v.faceTowards(u.pos.x - prev.x, u.pos.y - prev.y, dt);
      // Anticipación: carga durante los últimos pasos antes del golpe
      const charging = u.engaged && u.deployTicks <= 0 && u.cooldown > 0 && u.cooldown <= CHARGE_TICKS;
      const goal = charging ? 1 - u.cooldown / CHARGE_TICKS : 0;
      v.charge += (goal - v.charge) * Math.min(1, dt * 18);
      v.update(u, toWorld(p), time, dt, w.tick);
      if (v.charge > 0.1) {
        const card = getCard(u.cardId) as PokemonCard;
        const fam = familyFor(card.attack.element ?? card.types[0]);
        for (const cp of v.rig.chargePoints()) this.fx.chargeSparks(cp.pos, cp.out, fam, v.charge);
      }
    }
    // Unidades que ya no están en la simulación: terminan su animación de derrota.
    for (const [id, v] of this.units) {
      if (live.has(id)) continue;
      if (v.deathAge < 0) v.deathAge = 0;
      v.update(null, v.root.position, time, dt, w.tick);
      if (v.dead) {
        v.dispose(this.scene);
        this.units.delete(id);
      }
    }
    for (const t of this.towers.values()) t.update(time, dt, this.fx);
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tg = this.telegraphs[i];
      tg.age += dt;
      const k = Math.min(1, tg.age / Math.max(0.05, tg.life));
      (tg.mesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + 0.25 * k + Math.sin(time * 20) * 0.05;
      tg.mesh.scale.setScalar(0.85 + 0.15 * k);
      if (tg.age > tg.life + 1) this.removeTelegraph(i);
    }

    // Proyectiles: trayectoria en arco sobre la recta de la simulación.
    const liveP = new Set<number>();
    for (const p of w.projectiles as Projectile[]) {
      liveP.add(p.id);
      const pv = this.projectiles.get(p.id);
      if (!pv) continue;
      const q = this.lerp(p.id, p.pos, alpha);
      const remaining = Math.hypot(p.aim.x - q.x, p.aim.y - q.y);
      const prog = THREE.MathUtils.clamp(1 - remaining / pv.dist0, 0, 1);
      const y = THREE.MathUtils.lerp(pv.startY, pv.endY, prog) + Math.sin(prog * Math.PI) * 0.45 * Math.min(1, pv.dist0 / 3);
      pv.vis.group.position.set(q.x, y, q.y);
      pv.last.copy(pv.vis.group.position);
      pv.vis.update(dt, time);
    }
    for (const [id, pv] of this.projectiles) {
      if (liveP.has(id)) continue;
      const fam = familyFor(pv.element as never, pv.team);
      if (pv.vis.origin) this.fx.bolt(pv.vis.origin, pv.last.clone(), fam.glow, 0.16, 1.6);
      this.fx.impact(pv.last, fam, pv.vis.big ? 1 : 0.5);
      pv.vis.dispose();
      this.projectiles.delete(id);
    }
  }

  /** Estado interno de las vistas (depuración y pruebas visuales). */
  debugState(): { units: { id: number; charge: number; run: number; release: number }[]; projectiles: { id: number; big: boolean; beam: boolean }[] } {
    return {
      units: [...this.units.values()].map((u) => ({ id: u.id, charge: +u.charge.toFixed(2), run: +u.run.toFixed(2), release: +u.release.toFixed(2) })),
      projectiles: [...this.projectiles.entries()].map(([id, p]) => ({ id, big: p.vis.big, beam: p.vis.origin !== null })),
    };
  }

  /** Unidad visible por id (para cámaras y pruebas). */
  unitPosition(id: number): THREE.Vector3 | null {
    return this.units.get(id)?.root.position ?? null;
  }
}
