import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

type Variant = 'gastly' | 'haunter' | 'gengar';

/**
 * Línea de Gastly (modelos originales de fantasma; flotan):
 * - Gastly: esfera negra con ojos blancos de mirada pícara y colmillos, rodeada de gas morado.
 * - Haunter: cabeza-cuerpo morado con púas, sonrisa rosa y manos sueltas que flotan.
 * - Gengar: cuerpo redondo morado con púas en la espalda, orejas puntiagudas, ojos rojos y
 *   gran sonrisa blanca.
 */
export class GastlyRig extends ModelRig {
  readonly height: number;
  private readonly variant: Variant;
  private readonly gas: THREE.Group[] = [];
  private readonly hands: THREE.Group[] = [];

  constructor(variant: Variant = 'gastly') {
    super();
    this.variant = variant;
    this.height = { gastly: 1.25, haunter: 1.6, gengar: 1.55 }[variant];
    const purple = this.mat({ gastly: 0x8f738e, haunter: 0x7c6e9a, gengar: 0x7f7ab0 }[variant]);
    const purpleDark = this.mat(variant === 'gengar' ? 0x5f5a88 : 0x5a4d6a);
    const black = this.mat(0x1b1418, { roughness: 0.3 });
    const red = this.mat(0xe0303c, { roughness: 0.2 });
    const pink = this.mat(0xe86a9a);
    const { white } = eyeMaterials();

    if (variant === 'gastly') {
      this.blob(this.body, 0.36, [1, 1, 1], [0, 0.75, 0], black);
      // Gas: bolas moradas alrededor (palpitan)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const g = this.joint(this.body, [Math.cos(a) * 0.42, 0.75 + Math.sin(a * 2) * 0.12, Math.sin(a) * 0.3 - 0.08]);
        this.blob(g, 0.17, [1, 1, 0.8], [0, 0, 0], purple, [0, 0, 0], 0);
        this.gas.push(g);
      }
      this.face(this.body, ['WW....WW', 'WWW..WWW', '.WK..KW.', '........', '.W....W.'], { W: white, K: black }, 0.95);
      this.setMouth(this.body, [0, 0.65, 0.4]);
      return;
    }
    if (variant === 'haunter') {
      this.blob(this.body, 0.36, [1.05, 1, 0.9], [0, 0.95, 0], purple);
      for (const [x, y, rz] of [[-0.3, 1.25, 0.6], [0.3, 1.25, -0.6], [0, 1.35, 0], [-0.4, 0.95, 1.2], [0.4, 0.95, -1.2]] as const) {
        this.cone(this.body, 0.1, 0.3, [x, y, -0.08], [0, 0, rz], purple);
      }
      this.blob(this.body, 0.22, [1, 0.9, 0.8], [0, 0.6, -0.05], purpleDark, [0, 0, 0], 0);
      this.face(this.body, ['.WW..WW.', '.WK..KW.', '........', '.PPPPPP.', '..PPPP..'], { W: white, K: black, P: pink }, 1.08);
      for (const s of [-1, 1]) {
        const h = this.joint(this.body, [0.62 * s, 0.85, 0.18]);
        this.blob(h, 0.12, [1, 0.8, 0.9], [0, 0, 0], purple);
        for (let f = 0; f < 3; f++) this.blob(h, 0.05, [0.8, 1.6, 0.8], [(f - 1) * 0.07 * s, -0.15, 0.04], purple, [0, 0, (f - 1) * 0.3], 0);
        this.hands.push(h);
      }
      this.setMouth(this.body, [0, 0.82, 0.4]);
      return;
    }
    // Gengar
    this.blob(this.body, 0.42, [1.1, 1, 0.95], [0, 0.72, 0], purple);
    for (const [x, y] of [[-0.25, 1.05], [0.25, 1.05], [0, 1.12], [-0.4, 0.85], [0.4, 0.85]] as const) {
      this.cone(this.body, 0.1, 0.28, [x, y, -0.25], [-0.9, 0, -x * 1.5], purpleDark);
    }
    for (const s of [-1, 1]) this.cone(this.body, 0.1, 0.32, [0.26 * s, 1.14, 0], [0, 0, -0.4 * s], purple);
    this.face(this.body, ['.RR..RR.', '.RK..KR.', '........', 'WWWWWWWW', '.WWWWWW.'], { R: red, K: black, W: white }, 0.98);
    for (const s of [-1, 1]) {
      const h = this.joint(this.body, [0.46 * s, 0.7, 0.08]);
      this.blob(h, 0.1, [1, 1.4, 1], [0.04 * s, -0.08, 0], purple);
      this.hands.push(h);
      this.blob(this.body, 0.13, [1, 0.8, 1.3], [0.2 * s, 0.22, 0.05], purple);
    }
    this.setMouth(this.body, [0, 0.62, 0.45]);
  }

  pose(p: PoseInput): void {
    const t = p.time;
    const float = this.variant === 'gengar' ? Math.abs(Math.sin(t * 7)) * 0.08 * p.run : Math.sin(t * 2.4) * 0.08;
    this.body.position.y = float;
    this.body.position.z = p.release * 0.15 - p.hurt * 0.1;
    this.body.rotation.x = p.run * 0.15 - p.charge * 0.15 + p.release * 0.25 - p.hurt * 0.3;
    this.body.rotation.z = p.stunned ? Math.sin(t * 9) * 0.2 : Math.sin(t * 1.6) * 0.06;
    const sq = 1 + p.charge * 0.08 + Math.sin(t * 3) * 0.02;
    this.body.scale.set(sq, 2 - sq, sq);
    this.gas.forEach((g, i) => g.scale.setScalar(1 + Math.sin(t * 4 + i * 1.3) * 0.18 + p.charge * 0.2));
    this.hands.forEach((h, i) => {
      const s = i ? 1 : -1;
      h.position.y = (this.variant === 'haunter' ? 0.85 : 0.7) + Math.sin(t * 3 + i) * 0.06 + p.charge * 0.1;
      h.position.z = (this.variant === 'haunter' ? 0.18 : 0.08) + p.release * 0.35;
      h.rotation.z = s * (Math.sin(t * 2) * 0.2 - p.charge * 0.4);
    });
  }
}
