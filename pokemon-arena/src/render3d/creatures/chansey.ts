import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

/**
 * Chansey y Blissey (modelos originales; edificio que genera energía):
 * - Chansey: huevo rosa con mechones a los lados de la cabeza, bracitos, patas cortas y un
 *   huevo blanco en la bolsa del vientre.
 * - Blissey: más redonda, con rizos de pelo arriba, plumón blanco a los lados y franja blanca.
 * Cuando pone un huevo de energía se estira y vuelve a su forma.
 */
export class ChanseyRig extends ModelRig {
  readonly height: number;
  private readonly egg: THREE.Group;

  constructor(variant: 'chansey' | 'blissey' = 'chansey') {
    super();
    const plus = variant === 'blissey';
    this.height = plus ? 1.55 : 1.45;
    const pink = this.mat(plus ? 0xf5a9c0 : 0xf2c3d6);
    const pinkDark = this.mat(plus ? 0xd98aa6 : 0xd7a2b6);
    const cream = this.mat(0xf5f3e6);
    const shell = this.mat(0xfbf8ee, { roughness: 0.3, clearcoat: 0.6 });
    const { black, white } = eyeMaterials();
    const red = this.mat(0xc8506a);

    this.blob(this.body, 0.5, plus ? [1.05, 1.05, 0.95] : [0.95, 1.15, 0.9], [0, 0.66, 0], pink);
    if (plus) this.blob(this.body, 0.48, [1.07, 0.38, 0.97], [0, 0.58, 0], cream, [0, 0, 0], 0);
    for (const s of [-1, 1]) {
      // Mechones (Chansey) o rizos y plumón (Blissey)
      for (let i = 0; i < 3; i++) this.blob(this.body, 0.1, [1.5, 0.5, 0.8], [(0.48 + i * 0.03) * s, 0.98 - i * 0.12, 0], plus ? pink : pinkDark, [0, 0, -0.5 * s]);
      if (plus) {
        this.blob(this.body, 0.16, [1, 1, 1], [0.32 * s, 1.18, -0.02], pink);
        this.blob(this.body, 0.17, [1.6, 0.9, 0.5], [0.52 * s, 0.6, -0.05], cream, [0, 0, -0.4 * s]);
      }
      this.cap(this.body, 0.07, 0.12, [0.42 * s, 0.62, 0.22], [0.9, 0, 0.6 * s], pink, 0.03);
      this.blob(this.body, 0.13, [1, 0.6, 1.3], [0.2 * s, 0.1, 0.06], pinkDark);
    }
    this.face(this.body, plus ? ['.K....K.', '.K....K.', '........', '..RRRR..'] : ['K......K', '........', '...rr...'], { K: black, R: red, r: red }, plus ? 1.08 : 1.06);
    // Bolsa y huevo
    this.blob(this.body, 0.2, [1.2, 0.7, 0.6], [0, 0.46, 0.36], pinkDark, [0, 0, 0], 0);
    this.egg = this.joint(this.body, [0, 0.6, 0.4]);
    this.blob(this.egg, 0.15, [0.85, 1.05, 0.85], [0, 0, 0], shell);
    if (plus) this.blob(this.egg, 0.152, [0.86, 1.06, 0.86], [0, 0, 0], this.mat(0xf09ab4), [0, 0, 0], 0).userData.clipAbove = 0.02;
    void white;
    this.setMouth(this.egg, [0, 0.1, 0.1]);
  }

  pose(p: PoseInput): void {
    const t = p.time;
    // Pone el huevo: se estira (release), y respira suavemente en reposo
    const k = 1 + Math.sin(t * 2) * 0.02 + p.release * 0.08 - p.hurt * 0.06;
    this.body.scale.set(2 - k, k, 2 - k);
    this.body.rotation.z = Math.sin(t * 1.4) * 0.04 + (p.stunned ? Math.sin(t * 9) * 0.15 : 0);
    this.egg.position.y = 0.6 + Math.sin(t * 3) * 0.02 + p.release * 0.1;
  }
}
