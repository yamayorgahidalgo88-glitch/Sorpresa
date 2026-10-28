import * as THREE from 'three';
import { PAL } from '../palette';

/**
 * Base común para personajes 3D: jerarquía de piezas con pivotes (no hay esqueleto con
 * skinning: cada pieza es una malla rígida animada proceduralmente), contorno de silueta
 * por casco invertido y estados de animación.
 */
export type AnimState = 'aparicion' | 'reposo' | 'carrera' | 'muerte';

export interface PoseInput {
  time: number;
  dt: number;
  /** 0 = parado, 1 = corriendo (suavizado). */
  run: number;
  /** 0..1: anticipación del ataque (carga). */
  charge: number;
  /** 0..1: fase de liberación del ataque (decae). */
  release: number;
  /** 0..1: reacción a un impacto (decae). */
  hurt: number;
  stunned: boolean;
}

const OUTLINE = new THREE.MeshBasicMaterial({ color: PAL.outline, side: THREE.BackSide });

export abstract class CreatureRig {
  readonly root = new THREE.Group();
  /** Pivote del cuerpo (para inclinación y aplastamiento). */
  readonly body = new THREE.Group();
  /** Altura aproximada del modelo (para barras de vida y efectos). */
  abstract readonly height: number;
  readonly materials: THREE.MeshStandardMaterial[] = [];
  /**
   * Cara de pixel art para el estilo vóxel: filas de caracteres centradas en x = 0 del grupo,
   * con la fila 0 empezando en `top`; cada carácter de la paleta pinta el cubo más frontal.
   */
  pixelFace?: { group: THREE.Object3D; rows: string[]; palette: Record<string, THREE.MeshStandardMaterial>; top: number };

  constructor() {
    this.root.add(this.body);
  }

  /** Añade una malla con contorno opcional y la registra para destellos/transparencia. */
  protected part(geo: THREE.BufferGeometry, mat: THREE.MeshStandardMaterial, parent: THREE.Object3D, outline = 0.045): THREE.Mesh {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.userData.part = true; // pieza del modelo (el vozelizador la convierte en cubos)
    parent.add(m);
    if (!this.materials.includes(mat)) this.materials.push(mat);
    if (outline > 0) {
      const o = new THREE.Mesh(geo, OUTLINE);
      o.scale.setScalar(1 + outline);
      m.add(o);
    }
    return m;
  }

  /** Pose procedural del personaje para este fotograma. */
  abstract pose(p: PoseInput): void;

  /** Puntos de efecto en coordenadas del mundo (p. ej. mejillas, boca). */
  abstract emitterWorld(out: THREE.Vector3): THREE.Vector3;

  /** Puntos desde los que se carga energía y dirección hacia fuera de cada uno. */
  chargePoints(): { pos: THREE.Vector3; out: THREE.Vector3 }[] {
    const pos = this.emitterWorld(new THREE.Vector3());
    return [{ pos, out: new THREE.Vector3(0, 1, 0) }];
  }

  /** Destello (blanco al recibir daño, de color al cargar). */
  setFlash(amount: number, color = 0xffffff): void {
    // Las piezas con brillo propio (p. ej. mejillas eléctricas) no se sobrescriben.
    for (const m of this.materials) if (!m.userData.ownGlow) m.emissive.setHex(color).multiplyScalar(amount * 0.6);
  }

  setOpacity(alpha: number): void {
    for (const m of this.materials) {
      m.transparent = alpha < 1;
      m.opacity = alpha;
    }
    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material === OUTLINE) o.visible = alpha > 0.95;
    });
  }

  dispose(): void {
    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    for (const m of this.materials) m.dispose();
  }
}
