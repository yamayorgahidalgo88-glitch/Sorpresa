import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials } from './kit';

/**
 * Voltorb y Electrode (modelos originales; edificios bomba con forma de Pokéball):
 * - Voltorb: mitad superior roja y mitad inferior blanca, ojos de mirada enfadada.
 * - Electrode: al revés (blanca arriba, roja abajo), con una gran sonrisa.
 * Se balancean y destellan cuando cargan.
 */
export class VoltorbRig extends ModelRig {
  readonly height: number;
  private readonly glow;

  constructor(variant: 'voltorb' | 'electrode' = 'voltorb') {
    super();
    const big = variant === 'electrode';
    const r = big ? 0.48 : 0.42;
    this.height = r * 2 + 0.05;
    const red = this.mat(0xd85a5a, { roughness: 0.3, clearcoat: 0.8 });
    const white = this.mat(0xeeeef2, { roughness: 0.3, clearcoat: 0.8 });
    const { black, white: eyeW } = eyeMaterials();
    this.glow = this.glowMat(0xfff6a0, 0xffe14a, 0);
    const top = big ? white : red;
    const bottom = big ? red : white;
    this.blob(this.body, r, [1, 1, 1], [0, r, 0], bottom);
    const cap = this.blob(this.body, r * 1.001, [1, 1, 1], [0, r, 0], top);
    cap.userData.clipAbove = 0;
    const rows = big ? ['K......K', '.K....K.', '........', 'KKKKKKKK', '.KWWWWK.', '..KKKK..'] : ['KK....KK', '.KW..WK.', '.KK..KK.'];
    this.face(this.body, rows, { K: black, W: eyeW }, big ? r + 0.2 : r + 0.12);
    this.blob(this.body, 0.06, [1, 1, 1], [r * 0.5, r * 1.75, r * 0.5], this.glow, [0, 0, 0], 0);
    this.setMouth(this.body, [0, r, r + 0.05]);
  }

  pose(p: PoseInput): void {
    this.body.rotation.z = Math.sin(p.time * 2.2) * 0.08 + (p.stunned ? Math.sin(p.time * 9) * 0.2 : 0);
    this.body.rotation.x = -p.charge * 0.2 + p.release * 0.25 - p.hurt * 0.2;
    const k = 1 + p.charge * 0.1 - p.hurt * 0.06;
    this.body.scale.set(k, 2 - k, k);
    this.glow.emissiveIntensity = p.charge * 4 + p.release * 4 + (Math.sin(p.time * 13) > 0.9 ? 1.5 : 0);
  }
}
