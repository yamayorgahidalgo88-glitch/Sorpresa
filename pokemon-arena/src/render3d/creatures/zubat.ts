import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

type Variant = 'zubat' | 'golbat' | 'crobat';

/**
 * Línea de Zubat (modelos originales de murciélago; vuelan en bandada):
 * - Zubat: cuerpo azul pequeño, sin ojos, orejas grandes y alas moradas enormes.
 * - Golbat: cuerpo azul más grande con una boca enorme abierta (roja por dentro) y ojillos.
 * - Crobat: morado, con dos pares de alas y ojos amarillos.
 * Baten las alas muy deprisa.
 */
export class ZubatRig extends ModelRig {
  readonly height: number;
  private readonly wings: THREE.Group[] = [];

  constructor(variant: Variant = 'zubat') {
    super();
    this.height = variant === 'golbat' ? 0.95 : 0.8;
    const bodyC = this.mat(variant === 'crobat' ? 0x7e6aa6 : 0x4c85a3);
    const wing = this.mat(variant === 'crobat' ? 0x5d97a1 : 0x9a6a9e);
    const red = this.mat(0xc8343f);
    const fang = this.mat(0xffffff);
    const yellow = this.mat(0xf2c64b);
    const { black } = eyeMaterials();
    const r = variant === 'golbat' ? 0.26 : 0.2;
    this.blob(this.body, r, [1, 1.1, 0.9], [0, 0.5, 0], bodyC);
    for (const s of [-1, 1]) this.blob(this.body, 0.07, [0.8, 1.8, 0.5], [0.13 * s, 0.5 + r + 0.05, -0.02], bodyC, [0, 0, -0.3 * s]);
    if (variant === 'golbat') {
      this.blob(this.body, 0.17, [1.1, 1, 0.5], [0, 0.42, 0.16], red, [0, 0, 0], 0);
      this.face(this.body, ['.K..K.', '......', 'W....W'], { K: black, W: fang }, 0.66);
    } else if (variant === 'crobat') {
      this.face(this.body, ['YY..YY', '.K..K.', '......', '.W..W.'], { Y: yellow, K: black, W: fang }, 0.62);
    } else {
      this.face(this.body, ['......', '.W..W.'], { W: fang }, 0.48);
    }
    const pairs = variant === 'crobat' ? [0.58, 0.36] : [0.52];
    pairs.forEach((y, i) => {
      for (const s of [-1, 1]) {
        const g = this.joint(this.body, [r * 0.8 * s, y, -0.02]);
        const span = i ? 0.7 : 1;
        this.blob(g, 0.26 * span, [1.8, 0.2, 1.1], [0.42 * span * s, 0, -0.02], wing, [0, 0, 0]);
        this.blob(g, 0.04, [6 * span, 1, 1], [0.42 * span * s, 0.02, 0.18 * span], bodyC, [0, 0, 0], 0);
        this.wings.push(g);
      }
    });
    this.setMouth(this.body, [0, 0.45, r + 0.08]);
  }

  pose(p: PoseInput): void {
    const flap = Math.sin(p.time * 16) * 0.7;
    this.wings.forEach((g, i) => {
      const s = i % 2 ? 1 : -1;
      g.rotation.z = -s * (flap + p.charge * 0.3);
    });
    this.body.position.y = Math.sin(p.time * 16 + 1) * 0.04;
    this.body.rotation.x = p.run * 0.2 + p.release * 0.5 - p.hurt * 0.3;
    this.body.position.z = p.release * 0.15;
    this.body.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.3 : 0;
  }
}
