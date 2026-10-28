import * as THREE from 'three';
import { plasticMaterial } from '../palette';
import type { PoseInput } from './rig';
import { CreatureRig } from './rig';

type V3 = readonly [number, number, number];

/**
 * Base de los modelos de producción construidos con primitivas (hito F).
 * Añade atajos para piezas elipsoidales, grupos con pivote, la cara de pixel art y un
 * anclaje de "boca" del que salen los ataques. Cada Pokémon define su forma y su pose.
 */
export abstract class ModelRig extends CreatureRig {
  /** Origen de los ataques (boca, puño…), en el grupo que corresponda. */
  protected readonly mouth = new THREE.Object3D();

  /** Material de plástico registrado en el modelo. */
  protected mat(color: number, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}): THREE.MeshPhysicalMaterial {
    const m = plasticMaterial(color, { roughness: 0.5, ...opts });
    this.materials.push(m);
    return m;
  }

  /** Material con brillo propio (llamas, cristales): los destellos de daño no lo sobrescriben. */
  protected glowMat(color: number, emissive: number, intensity = 1.2): THREE.MeshPhysicalMaterial {
    const m = plasticMaterial(color, { roughness: 0.4, emissive: new THREE.Color(emissive), emissiveIntensity: intensity });
    m.userData.ownGlow = true;
    this.materials.push(m);
    return m;
  }

  /** Grupo con pivote (articulación) colgado de `parent`. */
  protected joint(parent: THREE.Object3D, pos: V3, rot: V3 = [0, 0, 0]): THREE.Group {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.rotation.set(...rot);
    parent.add(g);
    return g;
  }

  /** Elipsoide: esfera de radio `r` escalada por `s`. */
  protected blob(parent: THREE.Object3D, r: number, s: V3, pos: V3, mat: THREE.MeshStandardMaterial, rot: V3 = [0, 0, 0], outline = 0.04): THREE.Mesh {
    const m = this.part(new THREE.SphereGeometry(r, 20, 14), mat, parent, outline);
    m.scale.set(...s);
    m.position.set(...pos);
    m.rotation.set(...rot);
    return m;
  }

  /** Cápsula (extremidades). */
  protected cap(parent: THREE.Object3D, r: number, len: number, pos: V3, rot: V3, mat: THREE.MeshStandardMaterial, outline = 0.05): THREE.Mesh {
    const m = this.part(new THREE.CapsuleGeometry(r, len, 4, 10), mat, parent, outline);
    m.position.set(...pos);
    m.rotation.set(...rot);
    return m;
  }

  /** Cono (cuernos, picos, garras). */
  protected cone(parent: THREE.Object3D, r: number, h: number, pos: V3, rot: V3, mat: THREE.MeshStandardMaterial, outline = 0.03): THREE.Mesh {
    const m = this.part(new THREE.ConeGeometry(r, h, 14), mat, parent, outline);
    m.position.set(...pos);
    m.rotation.set(...rot);
    return m;
  }

  /**
   * Cara de pixel art (solo en estilo vóxel): filas centradas en x = 0 del grupo; la fila 0
   * empieza en `top`. Los materiales de la paleta se registran en el modelo.
   */
  protected face(group: THREE.Object3D, rows: string[], palette: Record<string, THREE.MeshStandardMaterial>, top: number): void {
    for (const m of Object.values(palette)) if (!this.materials.includes(m)) this.materials.push(m);
    this.pixelFace = { group, rows, palette, top };
  }

  /** Coloca el anclaje de los ataques. */
  protected setMouth(parent: THREE.Object3D, pos: V3): void {
    this.mouth.position.set(...pos);
    parent.add(this.mouth);
  }

  emitterWorld(out: THREE.Vector3): THREE.Vector3 {
    return this.mouth.getWorldPosition(out);
  }

  mouthWorld(out: THREE.Vector3): THREE.Vector3 {
    return this.mouth.getWorldPosition(out);
  }
}

/** Variables de animación comunes derivadas de la pose. */
export function gait(t: number, run: number, cadence = 12): { stride: number; hop: number; breathe: number; swing: number } {
  const stride = t * cadence;
  return {
    stride,
    hop: Math.abs(Math.sin(stride)) * run,
    breathe: Math.sin(t * 3) * (1 - run),
    swing: Math.sin(stride) * run,
  };
}

/** Material blanco/negro reutilizable para ojos de pixel art. */
export function eyeMaterials(): { white: THREE.MeshStandardMaterial; black: THREE.MeshStandardMaterial } {
  return {
    white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1b1512, roughness: 0.25 }),
  };
}

/**
 * Bípedo genérico: cuerpo, cabeza, dos brazos, dos piernas y cola opcional. La pose por
 * defecto cubre reposo (respiración), carrera (zancada y braceo), carga (agacharse),
 * golpe (estirarse y lanzar los brazos), daño (retroceso) y aturdimiento (cabeza que oscila).
 */
export abstract class BipedRig extends ModelRig {
  protected readonly head = new THREE.Group();
  protected armL!: THREE.Group;
  protected armR!: THREE.Group;
  protected legL!: THREE.Group;
  protected legR!: THREE.Group;
  protected tail: THREE.Group | null = null;
  /** Pasos por segundo (radianes) de la zancada. */
  protected cadence = 12;
  /** Altura del salto al correr. */
  protected hopHeight = 0.1;
  /** Cuánto se lanzan los brazos al golpear (puñetazo = mucho). */
  protected punch = 1.2;
  /** Golpea solo con el brazo derecho (alterna si es false). */
  protected oneArmPunch = false;

  pose(p: PoseInput): void {
    const { stride, hop, breathe, swing } = gait(p.time, p.run, this.cadence);
    const crouch = p.charge * 0.14 - p.release * 0.08 + p.hurt * 0.12;
    const sy = 1 + breathe * 0.025 - crouch + hop * 0.04;
    const sxz = 1 - breathe * 0.012 + crouch * 0.6;
    this.body.scale.set(sxz, sy, sxz);
    this.body.position.y = hop * this.hopHeight;
    this.body.rotation.x = p.run * 0.15 - p.charge * 0.15 + p.release * 0.25 - p.hurt * 0.3;
    this.body.position.z = p.release * 0.1 - p.hurt * 0.1;

    this.head.rotation.x = -p.run * 0.08 + p.charge * 0.1 - p.release * 0.12;
    this.head.rotation.z = Math.sin(p.time * 1.3) * 0.05 * (1 - p.run) + (p.stunned ? Math.sin(p.time * 9) * 0.2 : 0);

    const reach = p.release * this.punch;
    this.armL.rotation.x = swing * 0.9 + p.charge * 0.6 - (this.oneArmPunch ? 0 : reach);
    this.armR.rotation.x = -swing * 0.9 + p.charge * 0.6 - reach;
    this.legL.rotation.x = Math.sin(stride) * 0.6 * p.run;
    this.legR.rotation.x = -Math.sin(stride) * 0.6 * p.run;
    if (this.tail) {
      this.tail.rotation.y = Math.sin(p.time * 2.2) * 0.3 * (1 - p.run) + Math.sin(stride) * 0.25 * p.run;
      this.tail.rotation.x = -p.charge * 0.2;
    }
  }
}
