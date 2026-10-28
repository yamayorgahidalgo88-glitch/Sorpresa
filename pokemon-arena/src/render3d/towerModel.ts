import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Team } from '../sim/core/state';
import { PAL, toyMaterial } from './palette';
import { roofTexture, stoneTexture, woodTexture } from './textures';

export type TowerKind = 'guardia' | 'base';

/** Medidas en casillas. La guardiana mide ~5 de alto; la base es más ancha y alta. */
const DIM = {
  guardia: { r: 1.18, body: 2.3, drum: 0.75, roofH: 1.9, roofR: 1.22, posts: 0.85 },
  base: { r: 1.62, body: 2.7, drum: 0.95, roofH: 2.3, roofR: 1.66, posts: 1.0 },
};

const hexCss = (c: number) => '#' + c.toString(16).padStart(6, '0');

/**
 * Torre 3D de producción construida con geometría real (no imágenes):
 * zócalo de piedra, cuerpo troncocónico de sillares, balcón de madera con barandilla y
 * ménsulas, tambor almenado, pabellón sobre postes con tejado de tejas del color del equipo,
 * cristal de energía flotante (es el "cañón" de la torre), puerta en arco, ventanas,
 * estandartes y bandera. Expone puntos de anclaje para efectos y animaciones.
 */
export class TowerModel {
  readonly root = new THREE.Group();
  /** Parte que tiembla al recibir impactos. */
  readonly body = new THREE.Group();
  readonly crystal: THREE.Mesh;
  /** Punto de salida de los disparos (coordenadas locales del cuerpo). */
  readonly muzzle = new THREE.Object3D();
  /** Altura de la barra de vida. */
  readonly topY: number;
  private readonly flashMats: THREE.MeshStandardMaterial[] = [];
  private readonly crystalMat: THREE.MeshStandardMaterial;
  private readonly flag: { mesh: THREE.Mesh; base: Float32Array };
  private readonly light: THREE.PointLight;
  private shake = 0;
  private flash = 0;
  private fire = 0;

  constructor(readonly team: Team, readonly kind: TowerKind) {
    const d = DIM[kind];
    const color = PAL.team[team];
    const dark = PAL.teamDark[team];
    this.root.add(this.body);

    const stoneTex = stoneTexture(team * 7 + (kind === 'base' ? 3 : 1));
    stoneTex.repeat.set(kind === 'base' ? 5 : 4, 1.6);
    const stoneMat = this.flashable(toyMaterial(0xffffff, { map: stoneTex, roughness: 0.82 }));
    const plinthTex = stoneTexture(31, [150, 142, 130]);
    plinthTex.repeat.set(6, 0.35);
    const plinthMat = this.flashable(toyMaterial(0xffffff, { map: plinthTex, roughness: 0.9 }));
    const wood = woodTexture(team + 2);
    wood.repeat.set(3, 1);
    const woodMat = this.flashable(toyMaterial(0xffffff, { map: wood, roughness: 0.78 }));
    const darkWood = this.flashable(toyMaterial(PAL.woodDark, { roughness: 0.85 }));
    const gold = this.flashable(toyMaterial(PAL.gold, { roughness: 0.3, metalness: 0.55 }));
    const teamMat = this.flashable(toyMaterial(color, { roughness: 0.6 }));
    const roofTex = roofTexture(hexCss(color), hexCss(dark));
    roofTex.repeat.set(4, 2);
    const roofMat = this.flashable(toyMaterial(0xffffff, { map: roofTex, roughness: 0.55 }));
    const shadowy = toyMaterial(0x2a2230, { roughness: 1 });
    // Piedra lisa para piezas pequeñas (almenas, contrafuertes): sin sillares a mala escala.
    const capStone = this.flashable(toyMaterial(0xd6cdbd, { roughness: 0.75 }));

    const add = (mesh: THREE.Mesh, cast = true) => {
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      this.body.add(mesh);
      return mesh;
    };

    // 1. Zócalo escalonado
    add(new THREE.Mesh(new THREE.CylinderGeometry(d.r + 0.28, d.r + 0.38, 0.32, 28), plinthMat)).position.y = 0.16;
    add(new THREE.Mesh(new THREE.CylinderGeometry(d.r + 0.12, d.r + 0.2, 0.22, 28), plinthMat)).position.y = 0.42;

    // 2. Cuerpo troncocónico de sillares
    const y0 = 0.52;
    const body = add(new THREE.Mesh(new THREE.CylinderGeometry(d.r * 0.9, d.r, d.body, 28, 1, true), stoneMat));
    body.position.y = y0 + d.body / 2;
    // Contrafuertes
    const buttresses: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const b = new THREE.BoxGeometry(0.34, d.body * 0.82, 0.3);
      b.translate(0, 0, d.r * 0.95);
      b.rotateY(a);
      b.translate(0, y0 + d.body * 0.41, 0);
      buttresses.push(b);
    }
    add(new THREE.Mesh(mergeGeometries(buttresses), capStone));

    // Puerta en arco orientada hacia el propio campo
    const doorShape = new THREE.Shape();
    const dw = kind === 'base' ? 0.42 : 0.34;
    const dh = kind === 'base' ? 0.95 : 0.78;
    doorShape.moveTo(-dw, 0);
    doorShape.lineTo(-dw, dh - dw);
    doorShape.absarc(0, dh - dw, dw, Math.PI, 0, true);
    doorShape.lineTo(dw, 0);
    const doorGeo = new THREE.ExtrudeGeometry(doorShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 10 });
    const door = add(new THREE.Mesh(doorGeo, gold), false);
    door.position.set(0, y0, d.r - 0.06);
    const doorIn = add(new THREE.Mesh(new THREE.ShapeGeometry(doorShape, 10), toyMaterial(0x5a3a22, { roughness: 0.9 })), false);
    doorIn.scale.set(0.82, 0.9, 1);
    doorIn.position.set(0, y0 + 0.02, d.r + 0.115);
    // Ventanas en aspillera
    for (const a of [-1.0, 1.0, Math.PI]) {
      const rr = d.r * 0.94;
      const w = add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.08), shadowy), false);
      w.position.set(Math.sin(a) * rr, y0 + d.body * 0.62, Math.cos(a) * rr);
      w.rotation.y = a;
      const sill = add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.12), capStone), false);
      sill.position.set(Math.sin(a) * (rr + 0.02), w.position.y - 0.23, Math.cos(a) * (rr + 0.02));
      sill.rotation.y = a;
    }

    // 3. Balcón de madera con ménsulas y barandilla
    const yb = y0 + d.body;
    add(new THREE.Mesh(new THREE.CylinderGeometry(d.r + 0.42, d.r + 0.32, 0.16, 32), woodMat)).position.y = yb;
    const corbels: THREE.BufferGeometry[] = [];
    const rails: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const c = new THREE.BoxGeometry(0.14, 0.32, 0.4);
      c.rotateX(-0.6);
      c.translate(0, -0.18, d.r + 0.12);
      c.rotateY(a);
      c.translate(0, yb, 0);
      corbels.push(c);
      const p = new THREE.CylinderGeometry(0.045, 0.045, 0.38, 6);
      p.translate(0, yb + 0.26, d.r + 0.36);
      p.rotateY(a + Math.PI / 12);
      rails.push(p);
    }
    add(new THREE.Mesh(mergeGeometries(corbels), darkWood));
    add(new THREE.Mesh(mergeGeometries(rails), darkWood));
    const railRing = add(new THREE.Mesh(new THREE.TorusGeometry(d.r + 0.36, 0.05, 6, 40), woodMat));
    railRing.rotation.x = Math.PI / 2;
    railRing.position.y = yb + 0.45;

    // Estandartes colgando del balcón
    for (const a of [-0.55, 0.55]) {
      const banner = add(new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.85, 1, 4), teamMat), true);
      const rr = d.r * 0.93 + 0.03;
      banner.position.set(Math.sin(a) * rr, yb - 0.55, Math.cos(a) * rr);
      banner.rotation.y = a;
      (banner.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      const emblem = add(new THREE.Mesh(new THREE.CircleGeometry(0.11, 5), gold), false);
      emblem.position.copy(banner.position).add(new THREE.Vector3(Math.sin(a) * 0.01, 0.12, Math.cos(a) * 0.01));
      emblem.rotation.y = a;
      emblem.rotation.z = Math.PI / 2;
    }

    // 4. Tambor superior con almenas
    const yd = yb + 0.08;
    const drumR = d.r * 0.86;
    const drum = add(new THREE.Mesh(new THREE.CylinderGeometry(drumR, drumR * 1.02, d.drum, 24, 1, true), stoneMat));
    drum.position.y = yd + d.drum / 2;
    const floor = add(new THREE.Mesh(new THREE.CircleGeometry(drumR, 24), plinthMat), false);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = yd + d.drum - 0.1;
    const merlons: THREE.BufferGeometry[] = [];
    const nM = kind === 'base' ? 12 : 10;
    for (let i = 0; i < nM; i++) {
      const a = (i / nM) * Math.PI * 2;
      const mg = new THREE.BoxGeometry(0.34, 0.32, 0.22);
      mg.translate(0, 0, drumR - 0.06);
      mg.rotateY(a);
      mg.translate(0, yd + d.drum + 0.14, 0);
      merlons.push(mg);
    }
    add(new THREE.Mesh(mergeGeometries(merlons), capStone));
    const trim = add(new THREE.Mesh(new THREE.TorusGeometry(drumR + 0.02, 0.06, 6, 40), gold), false);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = yd + 0.04;

    // 5. Pabellón: postes y tejado de tejas
    const yp = yd + d.drum;
    const postGeo: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const p = new THREE.CylinderGeometry(0.075, 0.09, d.posts + 0.2, 8);
      p.translate(Math.sin(a) * drumR * 0.72, yp + d.posts / 2, Math.cos(a) * drumR * 0.72);
      postGeo.push(p);
    }
    add(new THREE.Mesh(mergeGeometries(postGeo), darkWood));
    const yr = yp + d.posts;
    const roof = add(new THREE.Mesh(new THREE.ConeGeometry(d.roofR, d.roofH, 10, 3), roofMat));
    roof.position.y = yr + d.roofH / 2;
    const eave = add(new THREE.Mesh(new THREE.TorusGeometry(d.roofR * 0.97, 0.07, 6, 40), gold), false);
    eave.rotation.x = Math.PI / 2;
    eave.position.y = yr + 0.04;
    const finial = add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), gold));
    finial.position.y = yr + d.roofH + 0.08;
    const spike = add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 8), gold));
    spike.position.y = yr + d.roofH + 0.36;
    if (kind === 'base') {
      // Corona dorada en el alero de la base
      const crown: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const c = new THREE.ConeGeometry(0.12, 0.34, 4);
        c.translate(0, 0, d.roofR * 0.96);
        c.rotateY(a);
        c.translate(0, yr + 0.2, 0);
        crown.push(c);
      }
      add(new THREE.Mesh(mergeGeometries(crown), gold));
    }

    // Bandera ondeante sobre el remate
    const flagGeo = new THREE.PlaneGeometry(0.75, 0.42, 8, 3);
    flagGeo.translate(0.38, 0, 0);
    const flag = add(new THREE.Mesh(flagGeo, teamMat));
    flag.position.set(0.04, yr + d.roofH + 0.42, 0);
    this.flag = { mesh: flag, base: Float32Array.from(flagGeo.attributes.position.array) };

    // 6. Cristal de energía: el "cañón" de la torre
    this.crystalMat = new THREE.MeshStandardMaterial({
      color: PAL.teamLight[team],
      emissive: color,
      emissiveIntensity: 1.3,
      roughness: 0.15,
      metalness: 0.1,
      flatShading: true,
    });
    this.crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), this.crystalMat);
    this.crystal.scale.set(1, 1.45, 1);
    this.crystal.position.y = yp + d.posts * 0.52;
    this.crystal.castShadow = false;
    this.body.add(this.crystal);
    this.muzzle.position.copy(this.crystal.position);
    this.body.add(this.muzzle);
    this.light = new THREE.PointLight(color, 1.2, 4.5, 2);
    this.light.position.copy(this.crystal.position);
    this.body.add(this.light);

    this.topY = yr + d.roofH + 0.75;
    // Las torres rivales miran hacia su propio campo (puerta hacia su base).
    this.root.rotation.y = team === 0 ? 0 : Math.PI;
  }

  private flashable<T extends THREE.MeshStandardMaterial>(m: T): T {
    this.flashMats.push(m);
    return m;
  }

  /** Recibe un impacto: temblor y destello blanco breve. */
  hit(strength = 1): void {
    this.shake = Math.min(1, this.shake + 0.55 * strength);
    this.flash = Math.min(1, this.flash + 0.8 * strength);
  }

  /** Dispara: el cristal destella y el tejado rebota. */
  shoot(): void {
    this.fire = 1;
  }

  muzzleWorld(out = new THREE.Vector3()): THREE.Vector3 {
    return this.muzzle.getWorldPosition(out);
  }

  update(time: number, dt: number, active: boolean): void {
    // Cristal: flota y gira; más brillante al disparar. La base inactiva queda apagada.
    const idle = active ? 1 : 0.25;
    this.crystal.rotation.y += dt * (active ? 1.2 : 0.3);
    this.crystal.position.y = this.muzzle.position.y + Math.sin(time * 2.2) * 0.07 * idle;
    this.crystalMat.emissiveIntensity = (0.5 + 0.9 * idle) + this.fire * 4;
    this.light.intensity = (0.4 + 0.9 * idle) + this.fire * 5;
    const s = 1 + this.fire * 0.35;
    this.crystal.scale.set(s, 1.45 * s, s);
    this.fire = Math.max(0, this.fire - dt * 5);

    // Temblor por impacto
    this.shake = Math.max(0, this.shake - dt * 4);
    const k = this.shake * this.shake;
    this.body.position.set(Math.sin(time * 70) * 0.06 * k, 0, Math.cos(time * 63) * 0.05 * k);
    this.body.scale.set(1 + k * 0.03, 1 - k * 0.04, 1 + k * 0.03);

    this.flash = Math.max(0, this.flash - dt * 6);
    for (const m of this.flashMats) m.emissive.setScalar(this.flash * 0.22);

    // Bandera
    const pos = this.flag.mesh.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = this.flag.base[i * 3];
      pos.setZ(i, Math.sin(time * 6 + x * 5) * 0.08 * x);
    }
    pos.needsUpdate = true;
  }
}
