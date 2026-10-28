import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

/**
 * Magnemite y Magneton (modelos originales; edificios que flotan):
 * - Magnemite: esfera de acero con un gran ojo, tornillo arriba e imanes en U a los lados
 *   (puntas roja y azul).
 * - Magneton: tres Magnemite unidos en triángulo.
 * Los imanes giran y el conjunto chisporrotea al cargar.
 */
export class MagnemiteRig extends ModelRig {
  readonly height: number;
  private readonly magnets: THREE.Group[] = [];

  constructor(variant: 'magnemite' | 'magneton' = 'magnemite') {
    super();
    const trio = variant === 'magneton';
    this.height = trio ? 1.55 : 1.15;
    const steel = this.mat(0xb3c6cd, { roughness: 0.3, clearcoat: 0.8 });
    const dark = this.mat(0x5a585e, { roughness: 0.35, clearcoat: 0.6 });
    const red = this.mat(0xd8473a);
    const blue = this.mat(0x3f86d8);
    const { white, black } = eyeMaterials();
    const centers: [number, number, number][] = trio ? [[0, 1.05, 0], [-0.36, 0.62, 0], [0.36, 0.62, 0]] : [[0, 0.68, 0]];
    centers.forEach(([x, y, z], i) => {
      const g = this.joint(this.body, [x, y, z]);
      this.blob(g, 0.26, [1, 1, 1], [0, 0, 0], steel);
      this.cap(g, 0.04, 0.08, [0, 0.3, 0], [0, 0, 0], dark, 0.02);
      this.blob(g, 0.07, [1.4, 0.4, 1.4], [0, 0.36, 0], dark, [0, 0, 0], 0.02);
      if (i === 0) this.face(g, ['.WWW.', 'WWKWW', '.WWW.'], { W: white, K: black }, 0.12);
      else {
        this.blob(g, 0.09, [1, 1, 0.5], [0, 0.02, 0.22], white, [0, 0, 0], 0);
        this.blob(g, 0.035, [1, 1, 1], [0, 0.02, 0.27], black, [0, 0, 0], 0);
      }
      for (const s of [-1, 1]) {
        const m = this.joint(g, [0.3 * s, 0, 0]);
        // Imán en U: base y dos brazos con puntas de color
        // Piezas de al menos un cubo de grosor para que no se partan al pasar a vóxel
        this.part(new THREE.BoxGeometry(0.1, 0.12, 0.34), dark, m).position.set(0.06 * s, 0, 0);
        for (const dz of [-0.12, 0.12]) {
          this.part(new THREE.BoxGeometry(0.2, 0.12, 0.1), dark, m).position.set(0.18 * s, 0, dz);
          this.part(new THREE.BoxGeometry(0.1, 0.13, 0.11), dz < 0 ? red : blue, m).position.set(0.32 * s, 0, dz);
        }
        this.magnets.push(m);
      }
    });
    this.setMouth(this.body, [0, centers[0][1], 0.3]);
  }

  pose(p: PoseInput): void {
    this.body.position.y = 0.08 + Math.sin(p.time * 2.5) * 0.06;
    this.body.rotation.y = Math.sin(p.time * 0.8) * 0.15;
    this.body.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.15 : 0;
    this.magnets.forEach((m, i) => {
      m.rotation.x = p.time * (2 + p.charge * 10) + i;
    });
    const k = 1 - p.hurt * 0.08 + p.release * 0.06;
    this.body.scale.setScalar(k);
  }
}
