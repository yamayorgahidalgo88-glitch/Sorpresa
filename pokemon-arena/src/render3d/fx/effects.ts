import * as THREE from 'three';
import type { Element, EffectivenessLabel } from '../../sim/data/elements';
import { Rng } from '../../sim/core/rng';
import { flareTexture, ringTexture } from '../textures';
import { ParticleSystem } from './particles';

/**
 * Biblioteca modular de efectos visuales.
 *
 * Cada ataque se compone de piezas reutilizables:
 *   anticipación (la anima el personaje) → lanzamiento → proyectil con trayectoria y estela
 *   → impacto (destello + onda + partículas + rayos) → reacción del objetivo → número de daño
 *   → limpieza automática al acabar su vida.
 * Cada FAMILIA elemental define colores y comportamiento de sus partículas.
 */

interface Family {
  core: number;
  glow: number;
  spark: number[];
  /** Gravedad de las partículas de impacto (fuego sube, agua cae). */
  gravity: number;
  bolts: boolean;
}

export const FAMILIES: Partial<Record<Element | 'torre0' | 'torre1' | 'fisico', Family>> = {
  electrico: { core: 0xffffff, glow: 0xffe14a, spark: [0xfff6a0, 0xffe14a, 0xffffff, 0x9fe8ff], gravity: -6, bolts: true },
  fuego: { core: 0xfff1c0, glow: 0xff7a1a, spark: [0xffd27a, 0xff8a2a, 0xff4a1a], gravity: 2.5, bolts: false },
  agua: { core: 0xe8fbff, glow: 0x3fb7ff, spark: [0xbfeaff, 0x5fc8ff, 0xffffff], gravity: -9, bolts: false },
  planta: { core: 0xf0ffd8, glow: 0x6fd64a, spark: [0xb8f08a, 0x5fc83a, 0x2f9a3a], gravity: -4, bolts: false },
  veneno: { core: 0xf4dcff, glow: 0xb45fe0, spark: [0xd59af0, 0xa04fd0, 0x7a2fb0], gravity: -3, bolts: false },
  roca: { core: 0xfff4e0, glow: 0xc9a26a, spark: [0xb8a07a, 0x8a7a62, 0xe0d0b0], gravity: -12, bolts: false },
  tierra: { core: 0xfff4e0, glow: 0xd9a95a, spark: [0xc9a46a, 0x9a7a4a, 0xe8d0a0], gravity: -12, bolts: false },
  acero: { core: 0xffffff, glow: 0xcfdcea, spark: [0xe8f0f8, 0xb8c8d8, 0xffffff], gravity: -10, bolts: false },
  hada: { core: 0xffffff, glow: 0xff9ad0, spark: [0xffc8e6, 0xff8ac4, 0xffffff], gravity: -1.5, bolts: false },
  lucha: { core: 0xffffff, glow: 0xffb27a, spark: [0xffe0c0, 0xff9a5a, 0xffffff], gravity: -8, bolts: false },
  volador: { core: 0xffffff, glow: 0xbfe0ff, spark: [0xe6f4ff, 0xa8d4ff, 0xffffff], gravity: -2, bolts: false },
  hielo: { core: 0xffffff, glow: 0x9fe8ff, spark: [0xe6fbff, 0xbff0ff, 0x7fd8ff], gravity: -3, bolts: false },
  fisico: { core: 0xffffff, glow: 0xfff3d6, spark: [0xffffff, 0xf0e0c0, 0xc8b89a], gravity: -8, bolts: false },
  torre0: { core: 0xffffff, glow: 0x5fa8ff, spark: [0xbfe0ff, 0x5fa8ff, 0xffffff], gravity: -5, bolts: false },
  torre1: { core: 0xffffff, glow: 0xff6a5a, spark: [0xffd0c8, 0xff6a5a, 0xffffff], gravity: -5, bolts: false },
};

export function familyFor(element: Element | null, towerTeam?: 0 | 1): Family {
  if (element === null) return FAMILIES[towerTeam === 1 ? 'torre1' : 'torre0']!;
  return FAMILIES[element] ?? FAMILIES.fisico!;
}

abstract class Effect {
  age = 0;
  constructor(readonly life: number) {}
  /** Devuelve false cuando debe eliminarse. */
  abstract update(dt: number, camera: THREE.Camera): boolean;
  abstract dispose(): void;
}

/** Rayo quebrado (núcleo blanco + halo de color), parpadea regenerando su forma. */
class Bolt extends Effect {
  private readonly core: THREE.Mesh;
  private readonly halo: THREE.Mesh;
  private regen = 0;
  constructor(private readonly fx: Effects, private readonly a: THREE.Vector3, private readonly b: THREE.Vector3, color: number, life = 0.22, private readonly width = 1) {
    super(life);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    this.core = new THREE.Mesh(this.makeGeo(0.025 * width), coreMat);
    this.halo = new THREE.Mesh(this.makeGeo(0.075 * width), haloMat);
    this.core.renderOrder = this.halo.renderOrder = 30;
    fx.scene.add(this.core, this.halo);
  }
  private path(): THREE.CatmullRomCurve3 {
    const pts: THREE.Vector3[] = [this.a.clone()];
    const n = 6;
    const dir = this.b.clone().sub(this.a);
    const len = dir.length();
    for (let i = 1; i < n; i++) {
      const p = this.a.clone().addScaledVector(dir, i / n);
      p.x += this.fx.rand(-1, 1) * 0.12 * len * 0.3;
      p.y += this.fx.rand(-1, 1) * 0.12 * len * 0.3;
      p.z += this.fx.rand(-1, 1) * 0.12 * len * 0.3;
      pts.push(p);
    }
    pts.push(this.b.clone());
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
  }
  private makeGeo(r: number): THREE.TubeGeometry {
    return new THREE.TubeGeometry(this.path(), 18, r, 5, false);
  }
  update(dt: number): boolean {
    this.age += dt;
    this.regen -= dt;
    if (this.regen <= 0) {
      this.regen = 0.05;
      const p = this.path();
      this.core.geometry.dispose();
      this.halo.geometry.dispose();
      this.core.geometry = new THREE.TubeGeometry(p, 18, 0.025 * this.width, 5, false);
      this.halo.geometry = new THREE.TubeGeometry(p, 18, 0.075 * this.width, 5, false);
    }
    const k = 1 - this.age / this.life;
    (this.core.material as THREE.MeshBasicMaterial).opacity = k;
    (this.halo.material as THREE.MeshBasicMaterial).opacity = 0.55 * k;
    return this.age < this.life;
  }
  dispose(): void {
    for (const m of [this.core, this.halo]) {
      this.fx.scene.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }
}

/** Sprite que escala y se desvanece (destellos). */
class Flash extends Effect {
  private readonly sprite: THREE.Sprite;
  constructor(private readonly fx: Effects, pos: THREE.Vector3, color: number, private readonly size: number, life: number) {
    super(life);
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: fx.flare, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
    this.sprite.position.copy(pos);
    this.sprite.renderOrder = 40;
    fx.scene.add(this.sprite);
  }
  update(dt: number): boolean {
    this.age += dt;
    const t = this.age / this.life;
    const s = this.size * (0.5 + Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) * 0.9);
    this.sprite.scale.set(s, s, s);
    this.sprite.material.opacity = 1 - t;
    this.sprite.material.rotation += dt * 2;
    return t < 1;
  }
  dispose(): void {
    this.fx.scene.remove(this.sprite);
    this.sprite.material.dispose();
  }
}

/** Onda de choque plana sobre el suelo. */
class GroundRing extends Effect {
  private readonly mesh: THREE.Mesh;
  constructor(private readonly fx: Effects, pos: THREE.Vector3, color: number, private readonly radius: number, life: number) {
    super(life);
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: fx.ring, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(pos.x, 0.04, pos.z);
    this.mesh.renderOrder = 15;
    fx.scene.add(this.mesh);
  }
  update(dt: number): boolean {
    this.age += dt;
    const t = this.age / this.life;
    const s = this.radius * (0.25 + 0.75 * (1 - Math.pow(1 - t, 3)));
    this.mesh.scale.set(s, s, s);
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - t;
    return t < 1;
  }
  dispose(): void {
    this.fx.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** Número de daño: aparece con rebote, sube y se desvanece. */
class DamageNumber extends Effect {
  private readonly sprite: THREE.Sprite;
  private readonly base: THREE.Vector3;
  private readonly drift: number;
  constructor(private readonly fx: Effects, pos: THREE.Vector3, text: string, style: 'normal' | 'eficaz' | 'poco' | 'cura') {
    super(0.95);
    const tex = fx.textTexture(text, style);
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    this.sprite.renderOrder = 60;
    this.base = pos.clone();
    this.drift = fx.rand(-0.25, 0.25);
    this.sprite.position.copy(pos);
    fx.scene.add(this.sprite);
    this.aspect = tex.image.width / tex.image.height;
    this.scale = style === 'eficaz' ? 1.25 : style === 'poco' ? 0.75 : 0.95;
  }
  private readonly aspect: number;
  private readonly scale: number;
  update(dt: number): boolean {
    this.age += dt;
    const t = this.age / this.life;
    const pop = t < 0.12 ? 0.4 + (t / 0.12) * 1.0 : t < 0.22 ? 1.4 - ((t - 0.12) / 0.1) * 0.4 : 1;
    const h = 0.55 * this.scale * pop;
    this.sprite.scale.set(h * this.aspect, h, 1);
    this.sprite.position.set(this.base.x + this.drift * t, this.base.y + 0.9 * Math.sqrt(t), this.base.z);
    this.sprite.material.opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    return t < 1;
  }
  dispose(): void {
    this.fx.scene.remove(this.sprite);
    this.sprite.material.dispose();
  }
}

/** Proyectil visual: núcleo brillante + halo + chispas/arcos + estela de partículas. */
export class ProjectileVisual {
  readonly group = new THREE.Group();
  private readonly halo: THREE.Sprite;
  private arcTimer = 0;
  private trailTimer = 0;
  private beamTimer = 0;
  /** Origen del disparo: los ataques eléctricos dibujan un haz quebrado desde aquí. */
  origin: THREE.Vector3 | null = null;
  constructor(private readonly fx: Effects, readonly family: Family, readonly big: boolean) {
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: fx.flare, color: family.core, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    core.scale.setScalar(big ? 0.55 : 0.32);
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: fx.flare, color: family.glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
    this.halo.scale.setScalar(big ? 1.35 : 0.8);
    core.renderOrder = this.halo.renderOrder = 35;
    this.group.add(this.halo, core);
    fx.scene.add(this.group);
  }
  update(dt: number, time: number): void {
    const pulse = 1 + Math.sin(time * 40) * 0.12;
    this.halo.scale.setScalar((this.big ? 1.35 : 0.8) * pulse);
    if (this.family.bolts && this.origin) {
      this.beamTimer -= dt;
      if (this.beamTimer <= 0) {
        this.beamTimer = 0.035;
        this.fx.bolt(this.origin, this.group.position.clone(), this.family.glow, 0.11, 1.3);
      }
    }
    // Estela
    this.trailTimer -= dt;
    while (this.trailTimer <= 0) {
      this.trailTimer += 0.012;
      this.fx.spark(this.group.position, this.family, 0.25, 0.18, 0.28);
    }
    // Pequeños arcos eléctricos alrededor
    if (this.family.bolts) {
      this.arcTimer -= dt;
      if (this.arcTimer <= 0) {
        this.arcTimer = 0.06;
        const a = this.group.position.clone();
        const b = a.clone().add(new THREE.Vector3(this.fx.rand(-1, 1), this.fx.rand(-0.6, 1), this.fx.rand(-1, 1)).multiplyScalar(0.38));
        this.fx.bolt(a, b, this.family.glow, 0.07, 0.5);
      }
    }
  }
  dispose(): void {
    this.fx.scene.remove(this.group);
    for (const c of this.group.children) (c as THREE.Sprite).material.dispose();
  }
}

export class Effects {
  readonly additive = new ParticleSystem(2500, true);
  readonly soft = new ParticleSystem(1200, false);
  readonly flare = flareTexture();
  readonly ring = ringTexture();
  private readonly active: Effect[] = [];
  private readonly textCache = new Map<string, THREE.CanvasTexture>();
  private readonly rng: Rng;

  constructor(readonly scene: THREE.Scene, seed = 99) {
    this.rng = new Rng(seed);
    scene.add(this.additive.points, this.soft.points);
  }

  rand(a: number, b: number): number {
    return a + this.rng.next() * (b - a);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rng.next() * arr.length)];
  }

  private add(e: Effect): void {
    this.active.push(e);
  }

  // -------------------------------------------------------------- piezas

  spark(pos: THREE.Vector3, fam: Family, speed: number, size: number, life: number): void {
    this.additive.emit({
      pos: pos.clone().add(new THREE.Vector3(this.rand(-0.05, 0.05), this.rand(-0.05, 0.05), this.rand(-0.05, 0.05))),
      vel: new THREE.Vector3(this.rand(-1, 1), this.rand(-1, 1), this.rand(-1, 1)).multiplyScalar(speed),
      color: new THREE.Color(this.pick(fam.spark)),
      size,
      life: life * this.rand(0.6, 1.2),
      drag: 0.9,
    });
  }

  bolt(a: THREE.Vector3, b: THREE.Vector3, color: number, life = 0.22, width = 1): void {
    this.add(new Bolt(this, a, b, color, life, width));
  }

  flash(pos: THREE.Vector3, color: number, size: number, life = 0.18): void {
    this.add(new Flash(this, pos, color, size, life));
  }

  groundRing(pos: THREE.Vector3, color: number, radius: number, life = 0.4): void {
    this.add(new GroundRing(this, pos, color, radius, life));
  }

  damageNumber(pos: THREE.Vector3, amount: number, eff: EffectivenessLabel): void {
    const style = eff === 'eficaz' ? 'eficaz' : eff === 'poco_eficaz' ? 'poco' : 'normal';
    this.add(new DamageNumber(this, pos, `-${amount}`, style));
    if (eff === 'eficaz') this.add(new DamageNumber(this, pos.clone().add(new THREE.Vector3(0, 0.45, 0)), '¡Eficaz!', 'eficaz'));
  }

  healNumber(pos: THREE.Vector3, amount: number): void {
    this.add(new DamageNumber(this, pos, `+${amount}`, 'cura'));
  }

  // -------------------------------------------------------------- composiciones

  /** Anticipación de un ataque: chispas que convergen y arcos que saltan HACIA FUERA del punto de carga. */
  chargeSparks(pos: THREE.Vector3, out: THREE.Vector3, fam: Family, intensity: number): void {
    if (this.rng.next() < intensity * 0.3) this.flash(pos, fam.glow, 0.2 + intensity * 0.25, 0.07);
    if (this.rng.next() > intensity) return;
    const side = out.clone().multiplyScalar(this.rand(0.15, 0.35));
    const p = pos.clone().add(side).add(new THREE.Vector3(this.rand(-0.1, 0.1), this.rand(-0.05, 0.2), this.rand(-0.1, 0.1)));
    this.additive.emit({ pos: p, vel: pos.clone().sub(p).multiplyScalar(3), color: new THREE.Color(this.pick(fam.spark)), size: 0.14, life: 0.2 });
    if (fam.bolts && this.rng.next() < intensity * 0.5) {
      const tip = pos.clone().addScaledVector(out, this.rand(0.25, 0.45)).add(new THREE.Vector3(0, this.rand(-0.05, 0.25), 0));
      this.bolt(pos, tip, fam.glow, 0.07, 0.5);
    }
  }

  /** Destello de salida al lanzar. */
  launch(pos: THREE.Vector3, fam: Family): void {
    this.flash(pos, fam.glow, 0.55, 0.12);
    for (let i = 0; i < 10; i++) this.spark(pos, fam, 2.5, 0.2, 0.25);
  }

  /** Impacto completo: destello, onda, chispas con física, rayos radiales y humo. */
  impact(pos: THREE.Vector3, fam: Family, power = 1): void {
    this.flash(pos, fam.core, 0.9 * power, 0.1);
    this.flash(pos, fam.glow, 1.6 * power, 0.2);
    this.groundRing(pos, fam.glow, 1.3 * power, 0.35);
    for (let i = 0; i < 22 * power; i++) {
      const dir = new THREE.Vector3(this.rand(-1, 1), this.rand(0.2, 1.4), this.rand(-1, 1)).normalize();
      this.additive.emit({
        pos: pos.clone(),
        vel: dir.multiplyScalar(this.rand(2.5, 5.5) * power),
        color: new THREE.Color(this.pick(fam.spark)),
        size: this.rand(0.1, 0.22),
        life: this.rand(0.25, 0.55),
        gravity: fam.gravity,
        drag: 0.6,
        grow: 0.1,
      });
    }
    if (fam.bolts) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + this.rand(0, 1);
        const b = pos.clone().add(new THREE.Vector3(Math.cos(a), this.rand(-0.2, 0.6), Math.sin(a)).multiplyScalar(this.rand(0.6, 1.0) * power));
        this.bolt(pos, b, fam.glow, 0.16, 0.8);
      }
    }
    for (let i = 0; i < Math.round(5 * power); i++) {
      this.soft.emit({
        pos: pos.clone().add(new THREE.Vector3(this.rand(-0.2, 0.2), -0.1, this.rand(-0.2, 0.2))),
        vel: new THREE.Vector3(this.rand(-0.4, 0.4), this.rand(0.3, 0.8), this.rand(-0.4, 0.4)),
        color: new THREE.Color(0x9c958a),
        size: this.rand(0.35, 0.55) * power,
        life: this.rand(0.4, 0.7),
        drag: 0.8,
        grow: 1.8,
      });
    }
  }

  /** Aparición: polvo que se abre en anillo + aro del color del equipo. */
  deployBurst(pos: THREE.Vector3, teamColor: number): void {
    this.groundRing(pos, teamColor, 1.5, 0.5);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      this.soft.emit({
        pos: pos.clone().add(new THREE.Vector3(Math.cos(a) * 0.3, 0.08, Math.sin(a) * 0.3)),
        vel: new THREE.Vector3(Math.cos(a) * this.rand(1.2, 2), this.rand(0.2, 0.6), Math.sin(a) * this.rand(1.2, 2)),
        color: new THREE.Color(0xe9dcc0),
        size: this.rand(0.35, 0.55),
        life: this.rand(0.4, 0.65),
        drag: 0.92,
        grow: 1.6,
      });
    }
  }

  /** Derrota: nube de humo, chispas de estrellas que suben. */
  defeatPoof(pos: THREE.Vector3, color: number): void {
    for (let i = 0; i < 12; i++) {
      this.soft.emit({
        pos: pos.clone().add(new THREE.Vector3(this.rand(-0.3, 0.3), this.rand(0, 0.5), this.rand(-0.3, 0.3))),
        vel: new THREE.Vector3(this.rand(-1, 1), this.rand(0.4, 1.6), this.rand(-1, 1)),
        color: new THREE.Color(0xe9e2d4),
        size: this.rand(0.3, 0.55),
        life: this.rand(0.5, 0.9),
        drag: 0.85,
        grow: 1.7,
      });
    }
    for (let i = 0; i < 12; i++) {
      this.additive.emit({
        pos: pos.clone().add(new THREE.Vector3(0, 0.5, 0)),
        vel: new THREE.Vector3(this.rand(-1.2, 1.2), this.rand(1.5, 3), this.rand(-1.2, 1.2)),
        color: new THREE.Color(i % 2 ? color : 0xffffff),
        size: 0.22,
        life: 0.8,
        drag: 0.7,
        gravity: -1,
      });
    }
    this.flash(pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xffffff, 1.4, 0.2);
  }

  // -------------------------------------------------------------- texto

  /** Textura de texto con la tipografía del juego, contorno grueso y degradado. */
  textTexture(text: string, style: 'normal' | 'eficaz' | 'poco' | 'cura'): THREE.CanvasTexture {
    const key = `${style}|${text}`;
    const hit = this.textCache.get(key);
    if (hit) return hit;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    const size = 72;
    ctx.font = `${size}px "Lilita One", "Trebuchet MS", sans-serif`;
    const w = Math.ceil(ctx.measureText(text).width) + 36;
    c.width = w;
    c.height = size + 30;
    ctx.font = `${size}px "Lilita One", "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const colors = { normal: ['#ffffff', '#ffe9b0'], eficaz: ['#fff27a', '#ff8a1a'], poco: ['#e4e8f0', '#9aa3b8'], cura: ['#d6ffd0', '#4fdc6a'] }[style];
    ctx.lineJoin = 'round';
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#1d1410';
    ctx.strokeText(text, w / 2, c.height / 2 + 4);
    const g = ctx.createLinearGradient(0, 10, 0, c.height - 10);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.fillText(text, w / 2, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textCache.set(key, tex);
    return tex;
  }

  update(dt: number, camera: THREE.Camera): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const e = this.active[i];
      if (!e.update(dt, camera)) {
        e.dispose();
        this.active.splice(i, 1);
      }
    }
    this.additive.update(dt);
    this.soft.update(dt);
  }

  get count(): number {
    return this.active.length;
  }
}
