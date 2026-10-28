import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

/** Segmentos del cuerpo: desde la punta de la cola (en el suelo, detrás) hasta el cuello. */
const SEGMENTS: [number, number, number][] = [
  // [y, z, radio]
  [0.12, -1.3, 0.13],
  [0.2, -1.02, 0.2],
  [0.3, -0.62, 0.27],
  [0.42, -0.16, 0.33],
  [0.95, 0.08, 0.34],
  [1.55, 0.14, 0.31],
  [2.1, 0.1, 0.3],
];

/**
 * Onix (modelo original): serpiente de cantos rodados grises que se yergue, con un cuerno
 * en la cabeza. Repta ondulando y embiste con la cabeza. Altura base 3,30 (8,8 m reales).
 */
export class OnixRig extends ModelRig {
  readonly height = 3.2;
  private readonly head = new THREE.Group();
  private readonly segs: THREE.Group[] = [];

  constructor() {
    super();
    const rock = this.mat(0x8f9198, { roughness: 0.75, clearcoat: 0.05 });
    const rockDark = this.mat(0x6d6f78, { roughness: 0.8, clearcoat: 0 });
    const { white, black } = eyeMaterials();

    SEGMENTS.forEach(([y, z, r], i) => {
      const g = this.joint(this.body, [0, y, z]);
      this.blob(g, r, [1, 0.92, 1.05], [0, 0, 0], i % 2 ? rockDark : rock);
      this.segs.push(g);
    });

    this.head.position.set(0, 2.72, 0.22);
    this.body.add(this.head);
    this.blob(this.head, 0.38, [1, 0.82, 1.3], [0, 0, 0], rock);
    this.blob(this.head, 0.13, [1, 1, 3], [0, 0.32, -0.3], rockDark, [0.9, 0, 0]);
    this.blob(this.head, 0.3, [0.95, 0.4, 1.1], [0, -0.2, 0.1], rockDark, [0, 0, 0], 0);
    this.face(this.head, ['KW....WK', 'KK....KK'], { W: white, K: black }, 0.14);
    this.setMouth(this.head, [0, -0.15, 0.52]);
  }

  pose(p: PoseInput): void {
    // Ondulación lateral que recorre el cuerpo (más amplia al reptar)
    const amp = 0.05 + p.run * 0.12;
    this.segs.forEach((g, i) => {
      g.position.x = Math.sin(p.time * (2 + p.run * 5) - i * 0.8) * amp * (1 - i / 9);
    });
    // Cabezazo: se echa atrás al cargar y embiste al soltar
    const lunge = p.release * 0.35 - p.charge * 0.2 - p.hurt * 0.15;
    this.head.position.set(Math.sin(p.time * 1.5) * 0.06, 2.72 - p.release * 0.25 + p.charge * 0.1, 0.22 + lunge);
    this.head.rotation.x = p.release * 0.5 - p.charge * 0.2;
    this.head.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.2 : Math.sin(p.time * 1.2) * 0.05;
    this.segs[6].position.z = 0.1 + lunge * 0.5;
    this.segs[5].position.z = 0.14 + lunge * 0.25;
  }
}
