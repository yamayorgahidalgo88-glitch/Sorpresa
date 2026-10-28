import * as THREE from 'three';
import type { PoseInput } from './rig';
import { ModelRig, eyeMaterials, gait } from './kit';

type Variant = 'bulbasaur' | 'ivysaur' | 'venusaur';

/**
 * Línea de Bulbasaur (modelos originales, cuadrúpedos con manchas y ojos rojos):
 * - Bulbasaur: verde azulado claro, bulbo verde en el lomo.
 * - Ivysaur: azul verdoso, capullo rosa rodeado de hojas.
 * - Venusaur: verde oscuro, gran flor rosa de cinco pétalos con manchas blancas y palmas.
 * El bulbo, capullo o flor palpita al curar y al cargar.
 */
export class BulbasaurRig extends ModelRig {
  readonly height: number;
  private readonly head = new THREE.Group();
  private readonly bulb: THREE.Group;
  private readonly legs: THREE.Group[] = [];

  constructor(variant: Variant = 'bulbasaur') {
    super();
    const k = variant === 'bulbasaur' ? 1 : variant === 'ivysaur' ? 1.14 : 1.32;
    this.size.scale.setScalar(k);
    this.height = (variant === 'venusaur' ? 1.3 : 1.25) * k;
    const skinC = { bulbasaur: 0x7ccfb0, ivysaur: 0x6fb4bd, venusaur: 0x4f8f86 }[variant];
    const skin = this.mat(skinC);
    const spot = this.mat(variant === 'bulbasaur' ? 0x3f8f78 : 0x3a6f74);
    const bulbMat = this.mat(variant === 'bulbasaur' ? 0x47a64f : 0x3f8a52);
    const leaf = this.mat(0x2f7a3a);
    const pink = this.mat(0xd9707c);
    const pinkSpot = this.mat(0xf3d6d8);
    const trunk = this.mat(0x7a5040);
    const red = this.mat(0xd8343a, { roughness: 0.25 });
    const dark = this.mat(0x2a4a40);
    const { white } = eyeMaterials();

    this.blob(this.body, 0.3, [1.1, 0.85, 1.3], [0, 0.42, -0.04], skin);
    this.blob(this.body, 0.08, [1, 0.6, 1], [0.2, 0.62, 0.12], spot, [0, 0, 0], 0);
    this.blob(this.body, 0.07, [1, 0.6, 1], [-0.24, 0.5, -0.12], spot, [0, 0, 0], 0);

    this.bulb = this.joint(this.body, [0, 0.66, -0.1]);
    if (variant === 'bulbasaur') {
      this.blob(this.bulb, 0.27, [1, 1.05, 1], [0, 0.16, 0], bulbMat);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        this.blob(this.bulb, 0.11, [0.7, 1.7, 0.7], [Math.cos(a) * 0.17, 0.28, Math.sin(a) * 0.17], leaf, [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4], 0);
      }
      this.blob(this.bulb, 0.09, [1, 1.3, 1], [0, 0.46, 0], bulbMat, [0, 0, 0], 0.03);
    } else if (variant === 'ivysaur') {
      // Hojas abiertas alrededor y capullo rosa cerrado
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        this.blob(this.bulb, 0.2, [1.6, 0.25, 0.7], [Math.cos(a) * 0.26, 0.05, Math.sin(a) * 0.26], leaf, [0, -a, Math.cos(a) * 0.3], 0.02);
      }
      this.blob(this.bulb, 0.14, [0.9, 1, 0.9], [0, 0.1, 0], trunk, [0, 0, 0], 0);
      this.blob(this.bulb, 0.19, [1, 1.15, 1], [0, 0.28, 0], pink);
      this.blob(this.bulb, 0.08, [1, 1, 1], [0, 0.48, 0], pink, [0, 0, 0], 0.03);
    } else {
      // Palmas, tronco y gran flor de cinco pétalos con manchas blancas
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        this.blob(this.bulb, 0.22, [1.8, 0.22, 0.75], [Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3], leaf, [0, -a, Math.cos(a) * 0.25], 0.02);
      }
      this.blob(this.bulb, 0.16, [1, 1.1, 1], [0, 0.14, 0], trunk, [0, 0, 0], 0);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const x = Math.cos(a) * 0.32;
        const z = Math.sin(a) * 0.32;
        this.blob(this.bulb, 0.22, [1.4, 0.3, 1], [x, 0.3, z], pink, [0, -a, 0.15], 0.03);
        this.blob(this.bulb, 0.06, [1, 0.6, 1], [x * 1.15, 0.36, z * 1.15], pinkSpot, [0, 0, 0], 0);
      }
      this.blob(this.bulb, 0.12, [1, 1, 1], [0, 0.38, 0], 
        trunk, [0, 0, 0], 0);
    }

    this.head.position.set(0, 0.6, 0.34);
    this.body.add(this.head);
    this.blob(this.head, 0.3, [1.15, 0.88, 0.95], [0, 0, 0], skin);
    for (const s of [-1, 1]) this.blob(this.head, 0.09, [1, 1.3, 0.6], [0.25 * s, 0.24, -0.04], skin, [0, 0, -0.5 * s]);
    this.blob(this.head, 0.07, [1, 0.5, 1], [-0.12, 0.25, -0.05], spot, [0, 0, 0], 0);
    const angry = variant === 'venusaur';
    this.face(this.head, angry ? ['.RR..RR.', '.WR..RW.', '........', '.dWddWd.'] : ['.WR..RW.', '.RR..RR.', '........', '.dddddd.'], { W: white, R: red, d: dark }, 0.1);
    this.setMouth(this.head, [0, -0.1, 0.32]);

    for (const [x, z] of [[-0.21, 0.2], [0.21, 0.2], [-0.21, -0.26], [0.21, -0.26]] as const) {
      const g = this.joint(this.body, [x, 0.24, z]);
      this.cap(g, angry ? 0.11 : 0.09, 0.08, [0, -0.1, 0], [0, 0, 0], skin);
      this.blob(g, angry ? 0.11 : 0.09, [1, 0.6, 1.3], [0, -0.19, 0.05], skin, [0, 0, 0], 0.03);
      this.legs.push(g);
    }
  }

  pose(p: PoseInput): void {
    const { stride, hop, breathe } = gait(p.time, p.run, 11);
    const crouch = p.charge * 0.1 - p.release * 0.06 + p.hurt * 0.1;
    this.body.scale.set(1 + crouch * 0.4, 1 + breathe * 0.02 - crouch, 1 + crouch * 0.4);
    this.body.position.y = hop * 0.05;
    this.body.position.z = p.release * 0.08 - p.hurt * 0.1;
    this.body.rotation.x = -p.hurt * 0.2 + p.release * 0.1;
    // Paso en diagonal (delantera izquierda con trasera derecha)
    this.legs.forEach((g, i) => {
      g.rotation.x = Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.6 * p.run;
    });
    this.head.rotation.x = -p.release * 0.2 + p.charge * 0.1;
    this.head.rotation.z = p.stunned ? Math.sin(p.time * 9) * 0.2 : Math.sin(p.time * 1.4) * 0.04;
    const pulse = 1 + Math.sin(p.time * 2.2) * 0.03 + p.charge * 0.15 + p.release * 0.1;
    this.bulb.scale.set(pulse, pulse, pulse);
  }
}
