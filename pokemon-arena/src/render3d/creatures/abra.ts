import * as THREE from 'three';
import type { PoseInput } from './rig';
import { BipedRig, eyeMaterials } from './kit';

type Variant = 'abra' | 'kadabra' | 'alakazam';

/**
 * Línea de Abra (modelos originales, psíquicos amarillos con coraza marrón):
 * - Abra: sentado y con los ojos cerrados, orejas puntiagudas, cola con franja marrón.
 * - Kadabra: de pie, estrella roja en la frente, bigote y una cuchara en la mano.
 * - Alakazam: cabeza grande, bigote largo y dos cucharas.
 * Las cucharas (o las manos) brillan al cargar el ataque.
 */
export class AbraRig extends BipedRig {
  readonly height: number;
  private readonly variant: Variant;
  private readonly glow: THREE.MeshPhysicalMaterial;

  constructor(variant: Variant = 'abra') {
    super();
    this.variant = variant;
    this.height = { abra: 1.35, kadabra: 1.75, alakazam: 1.85 }[variant];
    const sit = variant === 'abra';
    const yellow = this.mat(0xf0d45c);
    const brown = this.mat(0x6d5c48);
    const dark = this.mat(0x2a2218);
    const red = this.mat(0xd8343a);
    const fur = this.mat(0xe8dfb8);
    const { white, black } = eyeMaterials();
    this.glow = this.glowMat(0xd8d8e0, 0xc9a2ff, 0.2);

    const legH = sit ? 0.6 : 1;
    this.legL = this.joint(this.body, [-0.15, 0.36 * legH, 0]);
    this.legR = this.joint(this.body, [0.15, 0.36 * legH, 0]);
    for (const g of [this.legL, this.legR]) {
      this.cap(g, 0.07, 0.2 * legH, [0, -0.12 * legH, 0], [0, 0, 0], yellow);
      this.blob(g, 0.09, [1, 0.5, 1.6], [0, -0.3 * legH, 0.06], yellow);
    }
    const ty = sit ? 0.5 : 0.78;
    this.blob(this.body, 0.24, [1.05, 1.3, 0.85], [0, ty, 0], brown);
    this.blob(this.body, 0.17, [1.2, 0.8, 0.9], [0, ty - 0.24, 0], yellow);

    const hy = sit ? 0.92 : variant === 'kadabra' ? 1.24 : 1.3;
    this.head.position.set(0, hy, 0.05);
    this.body.add(this.head);
    this.blob(this.head, variant === 'alakazam' ? 0.27 : 0.24, [1, 1, 1], [0, 0, 0], yellow);
    this.blob(this.head, 0.12, [0.9, 0.7, 1.3], [0, -0.06, 0.2], yellow, [0, 0, 0], 0.03);
    for (const s of [-1, 1]) this.cone(this.head, 0.09, 0.36, [0.17 * s, 0.26, -0.04], [0, 0, -0.3 * s], yellow);
    if (sit) {
      this.face(this.head, ['........', '.KK..KK.', '........'], { K: black }, 0.04);
    } else {
      this.face(this.head, ['...RR...', '........', '.KW..WK.', '.KK..KK.'], { R: red, K: black, W: white }, 0.14);
      // Bigote
      for (const s of [-1, 1]) this.blob(this.head, 0.04, [1, 1, 1], [0.1 * s, -0.14, 0.3], dark, [0, 0, 0], 0);
      const len = variant === 'alakazam' ? 0.6 : 0.36;
      for (const s of [-1, 1]) this.cap(this.head, 0.03, len, [0.16 * s, -0.22 - len / 3, 0.24], [0, 0, 0.35 * s], fur, 0.02);
    }

    const ay = sit ? 0.58 : 0.94;
    this.armL = this.joint(this.body, [-0.27, ay, 0.06]);
    this.armR = this.joint(this.body, [0.27, ay, 0.06]);
    for (const [g, s] of [[this.armL, -1], [this.armR, 1]] as const) {
      this.cap(g, 0.06, 0.18, [0.05 * s, -0.12, 0.04], [sit ? 0.9 : 0.3, 0, 0.3 * s], yellow);
      this.blob(g, 0.07, [1, 1, 1], [0.08 * s, -0.25, sit ? 0.2 : 0.1], yellow, [0, 0, 0], 0.03);
    }
    // Cucharas
    const spoons = variant === 'kadabra' ? [this.armR] : variant === 'alakazam' ? [this.armL, this.armR] : [];
    for (const g of spoons) {
      const s = g === this.armL ? -1 : 1;
      this.cap(g, 0.025, 0.32, [0.08 * s, -0.12, 0.2], [Math.PI / 2 + 0.3, 0, 0], this.glow, 0.02);
      this.blob(g, 0.06, [1, 0.5, 1.3], [0.08 * s, 0.04, 0.34], this.glow, [0, 0, 0], 0.02);
    }
    this.setMouth(spoons.length ? this.armR : this.head, spoons.length ? [0.08, 0.04, 0.36] : [0, -0.06, 0.32]);

    // Cola con franja marrón
    this.tail = this.joint(this.body, [0, 0.3, -0.22]);
    this.blob(this.tail, 0.11, [1, 1, 2.6], [0.06, 0.02, -0.28], yellow, [-0.3, 0.2, 0]);
    this.blob(this.tail, 0.112, [1.02, 1.02, 0.5], [0.06, 0.05, -0.3], brown, [-0.3, 0.2, 0], 0);
  }

  override pose(p: PoseInput): void {
    super.pose(p);
    if (this.variant === 'abra') {
      // Sentado: casi no anda; flota un poco al teletransportarse
      this.body.position.y = Math.sin(p.time * 2) * 0.03 + p.run * 0.08;
    }
    this.glow.emissiveIntensity = 0.2 + p.charge * 3 + p.release * 3;
  }
}
