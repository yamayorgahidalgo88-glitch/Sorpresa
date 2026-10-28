import type { PoseInput } from './rig';
import { BipedRig, eyeMaterials } from './kit';

type Variant = 'squirtle' | 'wartortle' | 'blastoise';

/**
 * Línea de Squirtle (modelos originales sobre la misma forma de tortuga bípeda):
 * - Squirtle: azul claro, caparazón marrón, cola enroscada.
 * - Wartortle: azul lavanda, orejas y cola de pelo blanco azulado.
 * - Blastoise: azul oscuro, gran caparazón con borde blanco y dos cañones en los hombros
 *   (el ataque sale de ellos).
 */
export class SquirtleRig extends BipedRig {
  readonly height: number;
  private readonly variant: Variant;

  constructor(variant: Variant = 'squirtle') {
    super();
    this.variant = variant;
    const big = variant === 'blastoise';
    const k = variant === 'squirtle' ? 1 : variant === 'wartortle' ? 1.18 : 1.32;
    this.size.scale.setScalar(k);
    this.height = 1.3 * k * (big ? 1.05 : 1);
    const skin = this.mat(variant === 'squirtle' ? 0x7cc6ea : variant === 'wartortle' ? 0x93a9de : 0x6b8cc4);
    const shell = this.mat(variant === 'blastoise' ? 0x7a5a45 : 0xa4652e, { roughness: 0.45, clearcoat: 0.5 });
    const rim = this.mat(variant === 'blastoise' ? 0xe8e6ea : 0xf3e7c4);
    const belly = this.mat(0xf1d98c);
    const eye = this.mat(0x6b2a1a, { roughness: 0.25 });
    const mouthMat = this.mat(0x7a3a2a);
    const fur = this.mat(0xe2edf8);
    const metal = this.mat(0xb9bcc4, { roughness: 0.3, clearcoat: 0.6 });
    const { white, black } = eyeMaterials();
    if (big) this.cadence = 9;

    // Torso con caparazón (detrás), borde claro y peto (delante)
    this.blob(this.body, 0.28, [1, 1.05, 1], [0, 0.48, 0], skin);
    this.blob(this.body, big ? 0.38 : 0.33, [1.05, 1.05, big ? 0.9 : 0.82], [0, 0.52, -0.1], shell);
    this.blob(this.body, big ? 0.36 : 0.31, [1.08, 0.5, 0.86], [0, 0.32, -0.04], rim, [0, 0, 0], 0);
    this.blob(this.body, 0.25, [0.95, 1.08, 0.6], [0, 0.48, 0.12], belly, [0, 0, 0], 0);

    // Cabeza
    this.head.position.set(0, big ? 0.92 : 0.95, 0.04);
    this.body.add(this.head);
    this.blob(this.head, big ? 0.26 : 0.3, [1.05, 0.95, 1], [0, 0, 0], skin);
    if (variant === 'wartortle') {
      for (const s of [-1, 1]) {
        this.blob(this.head, 0.11, [0.55, 1.5, 0.9], [0.26 * s, 0.22, -0.06], fur, [0, 0, -0.5 * s]);
        this.blob(this.head, 0.07, [0.5, 1.2, 0.8], [0.2 * s, 0.38, -0.04], skin, [0, 0, -0.4 * s], 0);
      }
    }
    if (big) for (const s of [-1, 1]) this.blob(this.head, 0.06, [0.7, 1.2, 0.7], [0.18 * s, 0.22, -0.02], skin, [0, 0, -0.3 * s]);
    const rows = big ? ['.KW..WK.', '.KK..KK.', '........', '..kkkk..'] : ['.WE..WE.', '.EE..EE.', '........', '..kkkk..'];
    this.face(this.head, rows, { W: white, E: eye, K: black, k: mouthMat }, big ? 0.1 : 0.12);
    this.setMouth(this.head, [0, -0.1, 0.32]);

    // Brazos y piernas (más gruesos en Blastoise)
    const ar = big ? 0.1 : 0.075;
    this.armL = this.joint(this.body, [-0.29, 0.62, 0.06]);
    this.armR = this.joint(this.body, [0.29, 0.62, 0.06]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) this.cap(g, ar, 0.14, [0.04 * s, -0.08, 0.02], [0, 0, 0.9 * s], skin);
    this.legL = this.joint(this.body, [-0.15, 0.2, 0.03]);
    this.legR = this.joint(this.body, [0.15, 0.2, 0.03]);
    for (const g of [this.legL, this.legR]) this.blob(g, big ? 0.13 : 0.11, [1, 1.1, 1.3], [0, -0.08, 0.02], skin);

    // Cola
    this.tail = this.joint(this.body, [0, 0.3, -0.32]);
    if (variant === 'wartortle') {
      this.blob(this.tail, 0.16, [1, 1.1, 1.3], [0, 0.05, -0.12], fur);
      this.blob(this.tail, 0.13, [1, 1.1, 1], [0, 0.25, -0.24], fur);
      this.blob(this.tail, 0.09, [1, 1, 1], [0, 0.36, -0.1], skin, [0, 0, 0], 0);
    } else {
      this.blob(this.tail, big ? 0.1 : 0.13, [1, 1, 1.3], [0, 0, -0.08], skin);
      if (!big) {
        this.blob(this.tail, 0.11, [1, 1.1, 1], [0, 0.17, -0.2], skin);
        this.blob(this.tail, 0.08, [1, 1, 1], [0, 0.28, -0.1], skin);
      }
    }

    // Cañones de Blastoise
    if (big) {
      for (const s of [-1, 1]) {
        this.cap(this.body, 0.08, 0.28, [0.3 * s, 0.98, 0.0], [Math.PI / 2 - 0.15, 0, 0], metal);
      }
      this.setMouth(this.body, [0.3, 1.02, 0.26]);
    }
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    // Echa la cabeza atrás al cargar el chorro y la proyecta al disparar.
    if (this.variant !== 'blastoise') this.head.position.z = 0.04 - p.charge * 0.06 + p.release * 0.08;
  }
}
