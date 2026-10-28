import type { PoseInput } from './rig';
import { BipedRig, eyeMaterials } from './kit';

/**
 * Snorlax (modelo original): enorme, azul petróleo, con barriga y cara crema, ojos cerrados,
 * colmillos y pies grandes. Anda balanceándose y golpea con la barriga.
 * Altura base 2,25 (2,1 m reales).
 */
export class SnorlaxRig extends BipedRig {
  readonly height = 2.1;

  constructor() {
    super();
    const skin = this.mat(0x2f6f7e);
    const cream = this.mat(0xf2e3bf);
    const dark = this.mat(0x1c2a30);
    const { white } = eyeMaterials();
    this.cadence = 7;
    this.hopHeight = 0.04;
    this.punch = 0.7;

    this.legL = this.joint(this.body, [-0.32, 0.2, 0.1]);
    this.legR = this.joint(this.body, [0.32, 0.2, 0.1]);
    for (const g of [this.legL, this.legR]) {
      this.blob(g, 0.2, [1, 0.8, 1.1], [0, -0.06, 0], skin);
      this.blob(g, 0.2, [0.95, 0.95, 0.45], [0, -0.04, 0.17], cream, [0, 0, 0], 0);
    }
    this.blob(this.body, 0.62, [1.05, 1.08, 0.95], [0, 0.82, 0], skin);
    this.blob(this.body, 0.55, [0.95, 1.02, 0.62], [0, 0.78, 0.22], cream, [0, 0, 0], 0);

    this.head.position.set(0, 1.62, 0.06);
    this.body.add(this.head);
    this.blob(this.head, 0.38, [1.1, 0.85, 1], [0, 0, 0], skin);
    this.blob(this.head, 0.3, [1.05, 0.82, 0.62], [0, -0.06, 0.18], cream, [0, 0, 0], 0);
    for (const s of [-1, 1]) this.blob(this.head, 0.1, [1, 1.5, 0.7], [0.27 * s, 0.32, 0], skin, [0, 0, -0.3 * s]);
    this.face(this.head, ['.dd..dd.', '........', '.dWddWd.', '..dddd..'], { W: white, d: dark }, 0.04);
    this.setMouth(this.head, [0, -0.12, 0.4]);

    this.armL = this.joint(this.body, [-0.6, 1.08, 0.06]);
    this.armR = this.joint(this.body, [0.6, 1.08, 0.06]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) {
      this.cap(g, 0.15, 0.28, [0.1 * s, -0.2, 0.04], [0, 0, 0.6 * s], skin);
      this.blob(g, 0.1, [1, 0.8, 1], [0.22 * s, -0.42, 0.1], cream, [0, 0, 0], 0.03);
    }
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    // Balanceo lateral al andar y panzazo al golpear
    this.body.rotation.z = Math.sin(p.time * this.cadence) * 0.08 * p.run;
    this.body.position.z += p.release * 0.12;
  }
}
