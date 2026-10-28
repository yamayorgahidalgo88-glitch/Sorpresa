import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

type Variant = 'geodude' | 'graveler' | 'golem';

/**
 * Línea de Geodude (modelos originales de roca):
 * - Geodude: roca gris con cejas gruesas y dos brazos; flota.
 * - Graveler: canto rodado grumoso y claro con cuatro brazos y piernas cortas.
 * - Golem: caparazón de placas de roca oscura, cabeza, brazos y patas que asoman.
 */
export class GeodudeRig extends ModelRig {
  readonly height: number;
  private readonly arms: THREE.Group[] = [];
  private readonly variant: Variant;

  constructor(variant: Variant = 'geodude') {
    super();
    this.variant = variant;
    const k = variant === 'geodude' ? 1 : variant === 'graveler' ? 1.25 : 1.3;
    this.size.scale.setScalar(k);
    this.height = 1.2 * k;
    const rock = this.mat(variant === 'graveler' ? 0xbab7ab : variant === 'golem' ? 0x5a5653 : 0x9b8f80, { roughness: 0.8, clearcoat: 0 });
    const rockDark = this.mat(variant === 'graveler' ? 0x8e8e86 : variant === 'golem' ? 0x3d3836 : 0x7a6f62, { roughness: 0.85, clearcoat: 0 });
    const hide = this.mat(0x9a8f8c, { roughness: 0.7 });
    const brow = this.mat(0x4e463e);
    const dark = this.mat(0x2a2420);
    const claw = this.mat(0xeee6dc);
    const { white, black } = eyeMaterials();

    if (variant === 'golem') {
      // Caparazón de placas
      this.blob(this.body, 0.45, [1.05, 0.95, 1], [0, 0.66, -0.06], rock);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const y = 0.66 + (i % 3 - 1) * 0.22;
        this.blob(this.body, 0.16, [1, 0.9, 0.6], [Math.cos(a) * 0.36, y, Math.sin(a) * 0.36 - 0.06], i % 2 ? rockDark : rock, [0, -a + Math.PI / 2, 0], 0);
      }
      const head = this.joint(this.body, [0, 0.62, 0.36]);
      this.blob(head, 0.2, [1.1, 0.85, 1], [0, 0, 0], hide);
      this.face(head, ['.WK..KW.', '.KK..KK.', '........', '.dddddd.'], { W: white, K: black, d: dark }, 0.1);
      this.setMouth(head, [0, -0.06, 0.2]);
      for (const s of [-1, 1]) {
        const g = this.joint(this.body, [0.42 * s, 0.72, 0.18]);
        this.blob(g, 0.11, [1, 1.3, 1], [0.04 * s, -0.08, 0.04], hide);
        this.blob(g, 0.05, [1, 1, 1.4], [0.06 * s, -0.22, 0.12], claw, [0, 0, 0], 0);
        this.arms.push(g);
        this.blob(this.body, 0.13, [1, 0.8, 1.2], [0.24 * s, 0.14, 0.1], hide);
      }
    } else {
      this.blob(this.body, 0.38, variant === 'graveler' ? [1.2, 1, 1.05] : [1.1, 0.95, 1], [0, 0.72, 0], rock);
      const bumps: [number, number, number, number][] = variant === 'graveler'
        ? [[0.3, 1.0, -0.1, 0.16], [-0.32, 0.95, -0.05, 0.15], [0.05, 1.08, -0.15, 0.15], [0.36, 0.6, -0.1, 0.14], [-0.36, 0.6, -0.12, 0.14], [0, 0.82, -0.32, 0.18]]
        : [[0.28, 0.95, -0.12, 0.13], [-0.3, 0.55, -0.15, 0.12], [0.05, 1.04, -0.2, 0.11], [-0.22, 0.98, 0.05, 0.09]];
      for (const [x, y, z, r] of bumps) this.blob(this.body, r, [1, 0.8, 1], [x, y, z], rockDark, [0, 0, 0], 0);
      this.face(this.body, ['DDD..DDD', '.WK..KW.', '.KK..KK.', '........', '..dddd..'], { D: brow, W: white, K: black, d: dark }, 0.9);
      const pairs = variant === 'graveler' ? [0.86, 0.6] : [0.75];
      pairs.forEach((y, i) => {
        for (const s of [-1, 1]) {
          const g = this.joint(this.body, [0.42 * s, y, 0.04]);
          this.cap(g, 0.085, 0.18, [0.12 * s, 0.02, 0], [0, 0, 1.25 * s], rock);
          this.blob(g, i ? 0.12 : 0.14, [1.1, 1, 1.1], [0.3 * s, -0.04, 0.08], rock);
          this.arms.push(g);
        }
      });
      if (variant === 'graveler') for (const s of [-1, 1]) this.blob(this.body, 0.11, [1, 0.9, 1.2], [0.2 * s, 0.32, 0.08], rock);
      this.setMouth(this.arms[1], [0.3, -0.04, 0.24]);
    }
  }

  pose(p: PoseInput): void {
    const walker = this.variant !== 'geodude';
    // Geodude flota; Graveler y Golem caminan con pasos cortos
    const bob = walker ? Math.abs(Math.sin(p.time * 8)) * 0.05 * p.run : Math.sin(p.time * 3) * 0.05 + 0.06;
    this.body.position.y = bob;
    this.body.rotation.x = p.run * (walker ? 0.08 : 0.2) - p.charge * 0.15 + p.release * 0.35 - p.hurt * 0.3;
    this.body.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.15 : walker ? Math.sin(p.time * 8) * 0.05 * p.run : 0;
    const swing = Math.sin(p.time * 10) * 0.5 * p.run;
    this.arms.forEach((g, i) => {
      const s = i % 2 ? -1 : 1;
      g.rotation.x = swing * s + p.charge * 0.6 - p.release * 1.4;
      g.rotation.z = Math.sin(p.time * 2 + i) * 0.1;
    });
    const sq = 1 - p.charge * 0.1 + p.hurt * 0.05;
    this.body.scale.set(2 - sq, sq, 2 - sq);
  }
}
