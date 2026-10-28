import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Rng } from '../sim/core/rng';
import type { Team } from '../sim/core/state';
import { PAL, toyMaterial } from './palette';
import { roofTexture, stoneTexture } from './textures';
import type { TowerKind } from './towerModel';

/** Une geometrías de distinto tipo (indexadas o no). */
const merge = (gs: THREE.BufferGeometry[]) => mergeGeometries(gs.map((g) => (g.index ? g.toNonIndexed() : g)))!;

const hexCss = (c: number) => '#' + c.toString(16).padStart(6, '0');

/**
 * Ruinas de una torre destruida (hito F): muñón de piedra con el borde superior roto,
 * cascotes y vigas por el suelo, el tejado caído con las tejas del equipo, el cristal
 * apagado y partido, y el estandarte en el suelo. Todo determinista (semilla por torre).
 * `rise` (0..1) hace emerger las piezas desde el suelo durante el derrumbe.
 */
export class TowerRuins {
  readonly root = new THREE.Group();
  /** Punto de salida del humo (coordenadas del mundo, relativo a la torre). */
  readonly smokeY: number;
  private readonly pieces: { mesh: THREE.Object3D; y: number; delay: number }[] = [];

  constructor(team: Team, kind: TowerKind, seed: number) {
    const rng = new Rng(seed);
    const rand = (a: number, b: number) => a + rng.next() * (b - a);
    const r = kind === 'base' ? 1.62 : 1.18;
    const h = kind === 'base' ? 1.5 : 1.2;
    this.smokeY = h;

    const stoneTex = stoneTexture(team * 7 + 11);
    stoneTex.repeat.set(4, 0.8);
    const stone = toyMaterial(0xffffff, { map: stoneTex, roughness: 0.85 });
    const plinthTex = stoneTexture(31, [150, 142, 130]);
    plinthTex.repeat.set(6, 0.35);
    const plinth = toyMaterial(0xffffff, { map: plinthTex, roughness: 0.9 });
    const rubbleMat = toyMaterial(0xcfc6b6, { roughness: 0.85, flatShading: true });
    const scorched = toyMaterial(0x5a5048, { roughness: 1, flatShading: true });
    const wood = toyMaterial(PAL.woodDark, { roughness: 0.85 });
    const roofTex = roofTexture(hexCss(PAL.team[team]), hexCss(PAL.teamDark[team]));
    roofTex.repeat.set(3, 1.5);
    const roof = toyMaterial(0xffffff, { map: roofTex, roughness: 0.6, side: THREE.DoubleSide });
    const crystal = toyMaterial(PAL.teamLight[team], { emissive: PAL.team[team], emissiveIntensity: 0.25, roughness: 0.2, flatShading: true });
    const banner = toyMaterial(PAL.team[team], { roughness: 0.7, side: THREE.DoubleSide });

    const add = (mesh: THREE.Mesh, y: number, delay = 0) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.root.add(mesh);
      this.pieces.push({ mesh, y, delay });
      return mesh;
    };

    // Zócalo intacto y muñón con el borde superior quebrado (vértices superiores desplazados)
    add(new THREE.Mesh(new THREE.CylinderGeometry(r + 0.28, r + 0.38, 0.32, 28), plinth), 0.16);
    const stump = new THREE.CylinderGeometry(r - 0.05, r + 0.12, h, 24, 4, true);
    const pos = stump.attributes.position as THREE.BufferAttribute;
    const jag = new Map<number, number>();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < h / 2 - 1e-3) continue;
      const a = Math.round(Math.atan2(pos.getZ(i), pos.getX(i)) * 100);
      if (!jag.has(a)) jag.set(a, rand(-0.75, 0.15) * h * 0.6);
      pos.setY(i, y + jag.get(a)!);
    }
    stump.computeVertexNormals();
    const stumpMat = stone.clone();
    stumpMat.side = THREE.DoubleSide;
    add(new THREE.Mesh(stump, stumpMat), 0.32 + h / 2);
    // Interior oscuro (escombros dentro del muñón)
    add(new THREE.Mesh(new THREE.CylinderGeometry(r - 0.15, r - 0.1, 0.2, 20), scorched), 0.32 + h * 0.35);

    // Cascotes alrededor (más cerca de la torre, más grandes)
    const rubble: THREE.BufferGeometry[] = [];
    const burnt: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 22; i++) {
      const a = rand(0, Math.PI * 2);
      const d = r + rand(0.05, 1.5);
      const s = rand(0.18, 0.5) * (1.6 - (d - r) / 1.5 * 0.6);
      const g = new THREE.DodecahedronGeometry(s, 0);
      g.scale(1, rand(0.45, 0.8), rand(0.8, 1.2));
      g.rotateY(rand(0, Math.PI));
      g.translate(Math.cos(a) * d, s * 0.35, Math.sin(a) * d);
      (i % 5 === 0 ? burnt : rubble).push(g);
    }
    // Sillares sueltos (cubos con la piedra de la torre)
    for (let i = 0; i < 7; i++) {
      const a = rand(0, Math.PI * 2);
      const d = r + rand(0.2, 1.2);
      const g = new THREE.BoxGeometry(rand(0.35, 0.55), 0.26, 0.3);
      g.rotateY(rand(0, Math.PI));
      g.rotateZ(rand(-0.3, 0.3));
      g.translate(Math.cos(a) * d, 0.14, Math.sin(a) * d);
      rubble.push(g);
    }
    add(new THREE.Mesh(merge(rubble), rubbleMat), 0, 0.1);
    add(new THREE.Mesh(merge(burnt), scorched), 0, 0.15);

    // Vigas del balcón caídas
    const beams: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      const a = rand(0, Math.PI * 2);
      const g = new THREE.BoxGeometry(rand(1.0, 1.7), 0.14, 0.16);
      g.rotateZ(rand(-0.35, 0.35));
      g.rotateY(a + rand(-0.6, 0.6));
      g.translate(Math.cos(a) * (r + 0.5), 0.2 + rand(0, 0.25), Math.sin(a) * (r + 0.5));
      beams.push(g);
    }
    add(new THREE.Mesh(merge(beams), wood), 0, 0.2);

    // Tejado caído, volcado a un lado y medio hundido
    const ra = rand(0, Math.PI * 2);
    const roofMesh = add(new THREE.Mesh(new THREE.ConeGeometry(r * 0.95, h * 1.15, 16, 1, true), roof), 0, 0.25);
    roofMesh.position.set(Math.cos(ra) * (r + 0.9), 0.55, Math.sin(ra) * (r + 0.9));
    roofMesh.rotation.set(rand(1.1, 1.5), ra, rand(-0.3, 0.3));
    this.pieces[this.pieces.length - 1].y = 0.55;

    // Cristal partido y apagado
    for (let i = 0; i < 3; i++) {
      const c = add(new THREE.Mesh(new THREE.OctahedronGeometry(rand(0.1, 0.18), 0), crystal), 0.15, 0.3);
      const a = rand(0, Math.PI * 2);
      c.position.set(Math.cos(a) * rand(0.2, 0.7), 0.15, Math.sin(a) * rand(0.2, 0.7));
      c.position.y = 0.32 + h * 0.45;
      this.pieces[this.pieces.length - 1].y = c.position.y;
      c.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    }

    // Estandarte en el suelo
    const ba = ra + Math.PI * rand(0.6, 1.4);
    const flag = add(new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.42), banner), 0.05, 0.3);
    flag.rotation.set(-Math.PI / 2, 0, rand(0, 3));
    flag.position.set(Math.cos(ba) * (r + 0.6), 0.05, Math.sin(ba) * (r + 0.6));

    for (const p of this.pieces) {
      if (p.mesh.position.y === 0) p.mesh.position.y = p.y;
    }
    this.setRise(0);
  }

  /** 0 = bajo tierra/invisible, 1 = ruinas asentadas. */
  setRise(k: number): void {
    this.root.visible = k > 0;
    for (const p of this.pieces) {
      const t = THREE.MathUtils.clamp((k - p.delay) / (1 - p.delay), 0, 1);
      const e = 1 - (1 - t) * (1 - t);
      p.mesh.position.y = p.y - (1 - e) * 1.2;
      p.mesh.scale.setScalar(0.6 + 0.4 * e);
    }
  }
}
