import * as THREE from 'three';
import { plasticMaterial } from '../palette';
import type { PoseInput } from './rig';
import { CreatureRig } from './rig';

const YELLOW = 0xffd23a;
const BROWN = 0x8a5226;
const BLACK = 0x1b1512;
const RED = 0xf0443a;

/**
 * Pikachu (modelo original estilizado, construido con primitivas 3D).
 * Proporción "chibi": cabeza ~55 % de la altura, orejas largas con punta negra,
 * mejillas rojas que se encienden al cargar electricidad y cola en forma de rayo.
 * Altura visual: 1,35 casillas (escala logarítmica a partir de 0,4 m reales, ver
 * docs/direccion_artistica.md).
 */
export class PikachuRig extends CreatureRig {
  readonly height = 1.35;
  private readonly head = new THREE.Group();
  private readonly earL = new THREE.Group();
  private readonly earR = new THREE.Group();
  private readonly armL = new THREE.Group();
  private readonly armR = new THREE.Group();
  private readonly footL = new THREE.Group();
  private readonly footR = new THREE.Group();
  private readonly tail = new THREE.Group();
  private readonly cheekMat: THREE.MeshPhysicalMaterial;
  private cheekL!: THREE.Mesh;
  private readonly cheeks: THREE.Mesh[] = [];
  private readonly eyes: THREE.Group[] = [];
  private blinkT = 2;
  private twitchT = 3;
  private twitch = 0;

  constructor() {
    super();
    const fur = plasticMaterial(YELLOW, { roughness: 0.5, clearcoat: 0.25 });
    const brown = plasticMaterial(BROWN, { roughness: 0.6 });
    const black = plasticMaterial(BLACK, { roughness: 0.25, clearcoat: 0.8 });
    this.cheekMat = plasticMaterial(RED, { roughness: 0.4, emissive: new THREE.Color(0xff6a3a), emissiveIntensity: 0 });
    this.cheekMat.userData.ownGlow = true;
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    // Torso en forma de pera
    const torso = this.part(new THREE.SphereGeometry(0.33, 28, 20), fur, this.body);
    torso.scale.set(1.0, 1.08, 0.92);
    torso.position.y = 0.38;
    // Rayas de la espalda
    for (const y of [0.42, 0.56]) {
      const s = this.part(new THREE.CapsuleGeometry(0.035, 0.2, 4, 8), brown, this.body, 0);
      s.rotation.z = Math.PI / 2;
      s.position.set(0, y, -0.315);
      s.scale.set(1.2, 1.2, 0.55);
    }

    // Cabeza
    this.head.position.y = 0.82;
    this.body.add(this.head);
    const skull = this.part(new THREE.SphereGeometry(0.36, 32, 24), fur, this.head);
    skull.scale.set(1.12, 0.94, 1.0);

    // Orejas: cono alargado con punta negra, con pivote en la base para animarlas
    for (const [g, side] of [[this.earL, -1], [this.earR, 1]] as const) {
      g.position.set(0.2 * side, 0.22, -0.02);
      g.rotation.z = -0.38 * side;
      this.head.add(g);
      const ear = this.part(new THREE.ConeGeometry(0.105, 0.52, 18), fur, g);
      ear.position.y = 0.26;
      ear.scale.set(1, 1, 0.62);
      const tip = this.part(new THREE.ConeGeometry(0.062, 0.2, 18), black, g, 0.03);
      tip.position.y = 0.43;
      tip.scale.set(1, 1, 0.62);
    }

    // Ojos brillantes con reflejo
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(0.15 * side, 0.03, 0.31);
      this.head.add(eye);
      const ball = this.part(new THREE.SphereGeometry(0.068, 18, 14), black, eye, 0);
      ball.scale.set(1, 1.15, 0.55);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), white);
      hl.position.set(-0.018 * side, 0.03, 0.03);
      eye.add(hl);
      this.eyes.push(eye);
    }
    // Nariz y boca
    const nose = this.part(new THREE.SphereGeometry(0.018, 10, 8), black, this.head, 0);
    nose.position.set(0, -0.04, 0.36);
    for (const side of [-1, 1]) {
      const mouth = this.part(new THREE.TorusGeometry(0.03, 0.009, 6, 12, Math.PI), black, this.head, 0);
      mouth.position.set(0.028 * side, -0.085, 0.345);
      mouth.rotation.set(0, 0, Math.PI);
    }
    // Mejillas eléctricas
    for (const side of [-1, 1]) {
      const c = this.part(new THREE.SphereGeometry(0.075, 16, 12), this.cheekMat, this.head, 0);
      c.position.set(0.25 * side, -0.07, 0.24);
      c.scale.set(1, 1, 0.45);
      c.lookAt(c.position.clone().multiplyScalar(3));
      if (side < 0) this.cheekL = c;
      this.cheeks.push(c);
    }

    // Brazos
    for (const [g, side] of [[this.armL, -1], [this.armR, 1]] as const) {
      g.position.set(0.27 * side, 0.5, 0.1);
      this.body.add(g);
      const arm = this.part(new THREE.CapsuleGeometry(0.055, 0.14, 4, 10), fur, g, 0.05);
      arm.position.set(0.02 * side, -0.07, 0.03);
      arm.rotation.z = 0.5 * side;
    }
    // Pies
    for (const [g, side] of [[this.footL, -1], [this.footR, 1]] as const) {
      g.position.set(0.15 * side, 0.07, 0.04);
      this.body.add(g);
      const foot = this.part(new THREE.SphereGeometry(0.085, 14, 10), fur, g, 0.05);
      foot.scale.set(0.95, 0.6, 1.35);
    }

    // Cola en rayo (forma 2D extruida) con base marrón
    const s = new THREE.Shape();
    const pts: [number, number][] = [
      [0, 0], [0.08, 0.02], [0.14, 0.26], [0.32, 0.22], [0.38, 0.5], [0.62, 0.46], [0.66, 0.86],
      [0.38, 0.8], [0.34, 0.56], [0.16, 0.6], [0.1, 0.34], [-0.04, 0.36],
    ];
    s.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) s.lineTo(x, y);
    s.closePath();
    const tailGeo = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.02, bevelSegments: 2 });
    tailGeo.translate(-0.02, -0.02, -0.035);
    this.tail.position.set(0, 0.3, -0.3);
    this.body.add(this.tail);
    const tailMesh = this.part(tailGeo, fur, this.tail, 0.05);
    tailMesh.rotation.y = Math.PI / 2;
    tailMesh.scale.setScalar(0.95);
    const tailBase = this.part(new THREE.CapsuleGeometry(0.045, 0.1, 4, 8), brown, this.tail, 0);
    tailBase.rotation.x = 0.4;
  }

  pose(p: PoseInput): void {
    const { time: t, dt, run } = p;
    // Parpadeo y tic de orejas ocasionales (vida en reposo)
    this.blinkT -= dt;
    const blink = this.blinkT < 0.12 ? 0.15 : 1;
    if (this.blinkT < 0) this.blinkT = 2 + ((t * 7.3) % 2.5);
    for (const e of this.eyes) e.scale.y = blink;
    this.twitchT -= dt;
    if (this.twitchT < 0) {
      this.twitch = 1;
      this.twitchT = 2.5 + ((t * 3.1) % 3);
    }
    this.twitch = Math.max(0, this.twitch - dt * 6);

    const stride = t * 15;
    const breathe = Math.sin(t * 3) * (1 - run);
    const hop = Math.abs(Math.sin(stride)) * run;

    // Cuerpo: rebote al correr, respiración en reposo, agacharse al cargar, estirarse al soltar
    const crouch = p.charge * 0.16 - p.release * 0.1 + p.hurt * 0.12;
    const sy = 1 + breathe * 0.025 - crouch + hop * 0.04;
    const sxz = 1 - breathe * 0.012 + crouch * 0.6;
    this.body.scale.set(sxz, sy, sxz);
    this.body.position.y = hop * 0.16;
    this.body.rotation.x = run * 0.22 - p.charge * 0.18 + p.release * 0.35 - p.hurt * 0.3;
    this.body.position.z = p.release * 0.12 - p.hurt * 0.1;

    // Cabeza: balanceo y mirada
    this.head.rotation.x = -run * 0.12 + p.charge * 0.1 - p.release * 0.15;
    this.head.rotation.z = Math.sin(t * 1.3) * 0.05 * (1 - run) + (p.stunned ? Math.sin(t * 9) * 0.18 : 0);

    // Orejas: tic en reposo, hacia atrás al correr, erguidas al cargar
    const earBack = run * 0.55 + p.release * 0.3 - p.charge * 0.25;
    const flop = Math.sin(stride * 2) * 0.12 * run;
    this.earL.rotation.x = -earBack + flop;
    this.earR.rotation.x = -earBack - flop;
    this.earL.rotation.z = 0.38 + this.twitch * 0.25 - p.charge * 0.12;
    this.earR.rotation.z = -0.38 + p.charge * 0.12;

    // Brazos: braceo al correr, hacia delante al lanzar
    const swing = Math.sin(stride) * 0.9 * run;
    this.armL.rotation.x = swing - p.release * 1.4 + p.charge * 0.5;
    this.armR.rotation.x = -swing - p.release * 1.4 + p.charge * 0.5;
    // Pies alternos
    this.footL.position.z = 0.04 + Math.sin(stride) * 0.12 * run;
    this.footR.position.z = 0.04 - Math.sin(stride) * 0.12 * run;
    this.footL.position.y = 0.07 + Math.max(0, Math.cos(stride)) * 0.08 * run;
    this.footR.position.y = 0.07 + Math.max(0, -Math.cos(stride)) * 0.08 * run;

    // Cola: vaivén; tiesa y vibrando al cargar
    this.tail.rotation.y = Math.sin(t * 2.4) * 0.35 * (1 - run) + Math.sin(stride) * 0.2 * run;
    this.tail.rotation.x = -0.3 - p.charge * 0.35 + Math.sin(t * 40) * 0.05 * p.charge;

    // Mejillas: chispean al cargar y al lanzar
    this.cheekMat.emissiveIntensity = p.charge * 3.5 + p.release * 5 + (Math.sin(t * 30) > 0.95 ? 0.4 : 0);
  }

  emitterWorld(out: THREE.Vector3): THREE.Vector3 {
    return this.cheekL.getWorldPosition(out);
  }

  /** Las dos mejillas, con la dirección hacia fuera de la cabeza. */
  override chargePoints(): { pos: THREE.Vector3; out: THREE.Vector3 }[] {
    const center = this.head.getWorldPosition(new THREE.Vector3());
    return this.cheeks.map((c) => {
      const pos = c.getWorldPosition(new THREE.Vector3());
      return { pos, out: pos.clone().sub(center).normalize() };
    });
  }

  /** Punto entre las mejillas, delante de la cara (origen del Impactrueno). */
  mouthWorld(out: THREE.Vector3): THREE.Vector3 {
    return this.head.localToWorld(out.set(0, -0.04, 0.45));
  }
}
