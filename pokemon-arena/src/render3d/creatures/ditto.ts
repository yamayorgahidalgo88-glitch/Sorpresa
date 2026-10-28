import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

/**
 * Ditto (modelo original): masa lila blanda y asimétrica con dos bracitos, ojos de punto y
 * una sonrisa larga y fina. Tiembla como gelatina. En batalla solo se ve un instante: se
 * transforma en la carta que copia.
 */
export class DittoRig extends ModelRig {
  readonly height = 0.95;

  constructor() {
    super();
    const goo = this.mat(0xc49ad8, { roughness: 0.3, clearcoat: 0.7 });
    const gooDark = this.mat(0xa77fc0, { roughness: 0.35, clearcoat: 0.6 });
    const { black } = eyeMaterials();
    this.blob(this.body, 0.46, [1.15, 0.7, 0.95], [0, 0.32, 0], goo);
    this.blob(this.body, 0.3, [1, 0.9, 0.9], [-0.12, 0.56, -0.04], goo);
    this.blob(this.body, 0.2, [1, 0.8, 0.9], [0.24, 0.52, -0.02], gooDark, [0, 0, 0], 0);
    for (const s of [-1, 1]) this.blob(this.body, 0.1, [1.4, 0.7, 0.9], [0.5 * s, 0.38, 0.1], goo, [0, 0, -0.4 * s]);
    this.face(this.body, ['.K....K.', '........', '.K....K.', '..KKKK..'], { K: black }, 0.62);
    this.setMouth(this.body, [0, 0.42, 0.42]);
  }

  pose(p: PoseInput): void {
    const w = Math.sin(p.time * 5) * 0.05 + p.charge * 0.1;
    this.body.scale.set(1 + w, 1 - w + p.release * 0.1, 1 + w * 0.5);
    this.body.position.y = Math.abs(Math.sin(p.time * 8)) * 0.05 * p.run;
    this.body.rotation.z = Math.sin(p.time * 3) * 0.05 + (p.stunned ? Math.sin(p.time * 9) * 0.15 : 0);
    this.body.position.z = p.release * 0.1 - p.hurt * 0.1;
  }
}
