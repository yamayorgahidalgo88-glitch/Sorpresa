import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

type Variant = 'pidgey' | 'pidgeotto' | 'pidgeot';

/**
 * Línea de Pidgey (modelos originales de ave; las tres vuelan):
 * - Pidgey: pequeño y redondo, marrón con cara y pecho crema, mechón corto.
 * - Pidgeotto: cresta roja y amarilla, antifaz negro, cola roja y amarilla.
 * - Pidgeot: alas tostadas grandes, larga melena roja y amarilla y cola roja en abanico.
 */
export class PidgeottoRig extends ModelRig {
  readonly height: number;
  private readonly head = new THREE.Group();
  private readonly wingL: THREE.Group;
  private readonly wingR: THREE.Group;
  private readonly tailG: THREE.Group;
  private readonly flapSpeed: number;

  constructor(variant: Variant = 'pidgeotto') {
    super();
    const k = variant === 'pidgey' ? 0.78 : variant === 'pidgeotto' ? 1 : 1.22;
    this.size.scale.setScalar(k);
    this.height = 1.5 * k;
    this.flapSpeed = variant === 'pidgey' ? 13 : 9;
    const brown = this.mat(variant === 'pidgeot' ? 0x8d6b4d : variant === 'pidgey' ? 0xa97d55 : 0xa86a3a);
    const wingC = this.mat(variant === 'pidgeot' ? 0xd8c49b : variant === 'pidgey' ? 0x9a6e48 : 0xa86a3a);
    const cream = this.mat(0xf2e3b4);
    const red = this.mat(0xe2453a);
    const yellow = this.mat(0xf2c64b);
    const beak = this.mat(0xc9a097);
    const black = this.mat(0x1b1512, { roughness: 0.25 });
    const { white } = eyeMaterials();

    this.blob(this.body, 0.3, variant === 'pidgey' ? [1.05, 1, 1.05] : [1, 1.05, 1.2], [0, 0.7, 0], brown);
    this.blob(this.body, 0.24, [0.9, 1, 0.7], [0, 0.64, 0.14], cream, [0, 0, 0], 0);
    for (const s of [-1, 1]) this.cap(this.body, 0.05, 0.14, [0.11 * s, 0.32, 0.04], [0, 0, 0], beak, 0.03);

    this.head.position.set(0, variant === 'pidgey' ? 1.02 : 1.1, 0.12);
    this.body.add(this.head);
    this.blob(this.head, variant === 'pidgey' ? 0.24 : 0.22, [1, 1, 1.05], [0, 0, 0], brown);
    this.blob(this.head, 0.16, [1, 0.8, 0.6], [0, -0.06, 0.12], cream, [0, 0, 0], 0);
    this.blob(this.head, 0.07, [1, 0.8, 2], [0, -0.05, 0.24], beak, [0, 0, 0], 0.03);
    if (variant === 'pidgey') {
      this.blob(this.head, 0.08, [0.6, 1.4, 1], [0, 0.22, 0.02], brown, [-0.5, 0, 0]);
      this.face(this.head, ['KW....WK', '.K....K.'], { W: white, K: black }, 0.08);
    } else if (variant === 'pidgeotto') {
      this.blob(this.head, 0.1, [0.5, 1.8, 1], [0, 0.22, -0.12], red, [-0.8, 0, 0]);
      this.blob(this.head, 0.09, [0.5, 1.7, 1], [0, 0.14, -0.24], yellow, [-1.1, 0, 0]);
      this.face(this.head, ['KKW..WKK', '.KK..KK.'], { W: white, K: black }, 0.08);
    } else {
      // Melena larga hacia atrás
      this.blob(this.head, 0.11, [0.5, 1.4, 3], [0, 0.16, -0.36], red, [-0.35, 0, 0]);
      this.blob(this.head, 0.1, [0.55, 1.2, 2.6], [0, 0.08, -0.4], yellow, [-0.25, 0, 0]);
      this.blob(this.head, 0.08, [0.5, 1.2, 1.6], [0, 0.26, -0.06], red, [-0.7, 0, 0]);
      this.face(this.head, ['KKW..WKK', '.KK..KK.'], { W: white, K: black }, 0.08);
    }
    this.setMouth(this.head, [0, -0.05, 0.36]);

    const span = variant === 'pidgeot' ? 1.25 : variant === 'pidgey' ? 0.55 : 1;
    this.wingL = this.joint(this.body, [-0.26, 0.82, -0.02]);
    this.wingR = this.joint(this.body, [0.26, 0.82, -0.02]);
    for (const [g, s] of [[this.wingL, -1], [this.wingR, 1]] as const) {
      this.blob(g, 0.3, [1.6 * span, 0.36, 1], [0.4 * span * s, 0, -0.04], wingC);
      this.blob(g, 0.17, [1.5, 0.32, 0.9], [0.78 * span * s, -0.01, -0.08], variant === 'pidgeot' ? brown : cream, [0, 0, 0], 0);
    }
    this.tailG = this.joint(this.body, [0, 0.58, -0.3]);
    if (variant === 'pidgey') {
      this.blob(this.tailG, 0.13, [1, 0.3, 1.4], [0, 0, -0.12], brown, [0.3, 0, 0]);
    } else if (variant === 'pidgeotto') {
      this.blob(this.tailG, 0.15, [1.1, 0.3, 1.6], [0, 0, -0.18], red, [0.3, 0, 0]);
      this.blob(this.tailG, 0.12, [1.2, 0.28, 1.3], [0, 0.02, -0.34], yellow, [0.3, 0, 0], 0);
    } else {
      // Cola en abanico rojo
      for (const a of [-0.45, 0, 0.45]) this.blob(this.tailG, 0.13, [0.9, 0.25, 2.3], [Math.sin(a) * 0.18, 0, -0.32], red, [0.25, a, 0]);
    }
  }

  pose(p: PoseInput): void {
    const flap = Math.sin(p.time * this.flapSpeed) * 0.6 + 0.1 + p.charge * 0.4;
    this.wingL.rotation.z = flap;
    this.wingR.rotation.z = -flap;
    this.body.position.y = Math.sin(p.time * this.flapSpeed + 1) * 0.05;
    // Inclinación hacia delante al volar y picotazo al golpear
    this.body.rotation.x = p.run * 0.2 - p.charge * 0.25 + p.release * 0.5 - p.hurt * 0.3;
    this.body.position.z = p.release * 0.18 - p.hurt * 0.1;
    this.head.rotation.x = p.release * 0.4;
    this.head.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.25 : 0;
    this.tailG.rotation.x = Math.sin(p.time * 4) * 0.1;
  }
}
