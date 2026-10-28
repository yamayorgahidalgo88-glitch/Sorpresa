import type { PoseInput } from './rig';
import { BipedRig, eyeMaterials } from './kit';

/**
 * Squirtle (modelo original): tortuga azul con caparazón marrón, peto crema, cola enroscada
 * y ojos grandes. Altura base 1,44 (0,5 m reales). Ataque: Pistola Agua desde la boca.
 */
export class SquirtleRig extends BipedRig {
  readonly height = 1.3;

  constructor() {
    super();
    const skin = this.mat(0x7cc6ea);
    const shell = this.mat(0xa4652e, { roughness: 0.45, clearcoat: 0.5 });
    const rim = this.mat(0xf3e7c4);
    const belly = this.mat(0xf1d98c);
    const eye = this.mat(0x6b2a1a, { roughness: 0.25 });
    const mouthMat = this.mat(0x7a3a2a);
    const { white } = eyeMaterials();

    // Torso con caparazón (detrás), borde claro y peto (delante)
    this.blob(this.body, 0.28, [1, 1.05, 1], [0, 0.48, 0], skin);
    this.blob(this.body, 0.33, [1.05, 1.05, 0.82], [0, 0.5, -0.08], shell);
    this.blob(this.body, 0.31, [1.08, 0.5, 0.86], [0, 0.32, -0.04], rim, [0, 0, 0], 0);
    this.blob(this.body, 0.25, [0.95, 1.08, 0.6], [0, 0.48, 0.12], belly, [0, 0, 0], 0);

    // Cabeza
    this.head.position.set(0, 0.95, 0.04);
    this.body.add(this.head);
    this.blob(this.head, 0.3, [1.05, 0.95, 1], [0, 0, 0], skin);
    this.face(this.head, ['.WE..WE.', '.EE..EE.', '........', '..kkkk..'], { W: white, E: eye, k: mouthMat }, 0.12);
    this.setMouth(this.head, [0, -0.1, 0.32]);

    // Brazos, piernas y cola enroscada
    this.armL = this.joint(this.body, [-0.27, 0.62, 0.06]);
    this.armR = this.joint(this.body, [0.27, 0.62, 0.06]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) this.cap(g, 0.075, 0.14, [0.04 * s, -0.08, 0.02], [0, 0, 0.9 * s], skin);
    this.legL = this.joint(this.body, [-0.15, 0.2, 0.03]);
    this.legR = this.joint(this.body, [0.15, 0.2, 0.03]);
    for (const g of [this.legL, this.legR]) this.blob(g, 0.11, [1, 1.1, 1.3], [0, -0.08, 0.02], skin);
    this.tail = this.joint(this.body, [0, 0.3, -0.3]);
    this.blob(this.tail, 0.13, [1, 1, 1.3], [0, 0, -0.08], skin);
    this.blob(this.tail, 0.11, [1, 1.1, 1], [0, 0.17, -0.2], skin);
    this.blob(this.tail, 0.08, [1, 1, 1], [0, 0.28, -0.1], skin);
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    // Echa la cabeza atrás al cargar el chorro y la proyecta al disparar.
    this.head.position.z = 0.04 - p.charge * 0.06 + p.release * 0.08;
  }
}
