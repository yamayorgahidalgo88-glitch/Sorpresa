import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ARENA } from '../sim/data/arena';
import { Rng } from '../sim/core/rng';
import { mergeStaticMeshes } from './merge';
import { PAL, toyMaterial } from './palette';
import { arenaGroundTexture, outerGroundTexture, stoneTexture, woodTexture } from './textures';

/** Altura de la plataforma del campo sobre el terreno exterior. */
export const PLATFORM_H = 0.55;
/** Profundidad del agua del río respecto al césped. */
const WATER_Y = -0.42;

/**
 * Escenario completo: plataforma de césped con muro de piedra, cauce del río con agua
 * animada, puentes de madera con barandillas y decorado exterior (árboles, rocas,
 * arbustos, flores, banderines). El decorado queda FUERA del área de juego.
 */
export class Arena3D {
  readonly group = new THREE.Group();
  private readonly water: THREE.ShaderMaterial;
  private readonly flags: { mesh: THREE.Mesh; base: Float32Array; phase: number }[] = [];

  constructor() {
    this.group.add(this.buildGround());
    this.water = this.buildRiver();
    this.group.add(this.buildBorderWall());
    for (const b of ARENA.bridges) this.group.add(this.buildBridge((b.xMin + b.xMax) / 2, b.xMax - b.xMin));
    this.group.add(this.buildEnvironment());
    mergeStaticMeshes(this.group, this.flags.map((f) => f.mesh));
  }

  update(time: number, fog?: THREE.Fog): void {
    this.water.uniforms.uTime.value = time;
    if (fog) {
      this.water.uniforms.fogNear.value = fog.near;
      this.water.uniforms.fogFar.value = fog.far;
    }
    for (const f of this.flags) {
      const pos = f.mesh.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = f.base[i * 3];
        const wave = Math.sin(time * 5 + f.phase + x * 3.2) * 0.09 * x;
        pos.setZ(i, f.base[i * 3 + 2] + wave);
      }
      pos.needsUpdate = true;
    }
  }

  // ------------------------------------------------------------------ suelo

  private buildGround(): THREE.Group {
    const g = new THREE.Group();
    const tex = arenaGroundTexture();
    const mat = toyMaterial(0xffffff, { map: tex, roughness: 0.92 });
    // Dos mitades: el río es un hueco real entre ellas.
    for (const [z0, z1] of [[0, ARENA.riverTop], [ARENA.riverBottom, ARENA.height]]) {
      const geo = new THREE.PlaneGeometry(ARENA.width, z1 - z0, 1, 1);
      geo.rotateX(-Math.PI / 2);
      geo.translate(ARENA.width / 2, 0, (z0 + z1) / 2);
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) {
        // UV del plano completo (v=1 arriba de la textura = z=0)
        const v = uv.getY(i);
        const z = z0 + (1 - v) * (z1 - z0);
        uv.setY(i, 1 - z / ARENA.height);
      }
      const m = new THREE.Mesh(geo, mat);
      m.receiveShadow = true;
      g.add(m);
    }
    // Terreno exterior más bajo
    const outerTex = outerGroundTexture();
    outerTex.repeat.set(10, 10);
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), toyMaterial(0xffffff, { map: outerTex, roughness: 1 }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(ARENA.width / 2, -PLATFORM_H, ARENA.height / 2);
    outer.receiveShadow = true;
    g.add(outer);
    return g;
  }

  // ------------------------------------------------------------------ río

  private buildRiver(): THREE.ShaderMaterial {
    const z0 = ARENA.riverTop;
    const z1 = ARENA.riverBottom;
    // Cauce: paredes de piedra a ambos lados y lecho.
    const stone = stoneTexture(8, [170, 160, 140]);
    stone.repeat.set(ARENA.width / 2, 0.5);
    const bankMat = toyMaterial(0xffffff, { map: stone, roughness: 0.9 });
    const bankH = -WATER_Y + 0.15;
    for (const z of [z0, z1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(ARENA.width + 1.2, bankH, 0.18), bankMat);
      wall.position.set(ARENA.width / 2, -bankH / 2 + 0.06, z + (z === z0 ? 0.09 : -0.09));
      wall.receiveShadow = true;
      this.group.add(wall);
    }
    // Lecho oscuro (se ve por la transparencia del borde)
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.width + 1.2, z1 - z0), toyMaterial(0x0f4f7a, { roughness: 1 }));
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(ARENA.width / 2, WATER_Y - 0.25, (z0 + z1) / 2);
    this.group.add(bed);

    // Agua: shader propio con corriente, ondas y espuma junto a las orillas.
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uShallow: { value: new THREE.Color(PAL.water) },
        uDeep: { value: new THREE.Color(PAL.waterDeep) },
        fogColor: { value: new THREE.Color(PAL.fog) },
        fogNear: { value: 48 },
        fogFar: { value: 95 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying float vFogDepth;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFogDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uShallow;
        uniform vec3 uDeep;
        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;
        varying vec2 vUv;
        varying float vFogDepth;
        float wave(vec2 p) {
          return sin(p.x * 1.7 + uTime * 1.6) * 0.5 + sin(p.x * 3.1 - p.y * 4.0 + uTime * 2.3) * 0.3 + sin(p.y * 9.0 + p.x * 0.6 - uTime * 1.1) * 0.2;
        }
        void main() {
          vec2 p = vec2(vUv.x * 20.0, vUv.y * 2.2);
          float edge = min(vUv.y, 1.0 - vUv.y);
          float depth = smoothstep(0.0, 0.5, edge);
          vec3 col = mix(uShallow * 1.08, uDeep, depth * 0.85);
          // Reflejos alargados en dirección de la corriente
          float w = wave(p);
          float streak = smoothstep(0.72, 0.98, sin(p.x * 2.4 + w * 1.4 - uTime * 2.0) * 0.5 + 0.5) * (0.35 + 0.65 * depth);
          col += vec3(0.75, 0.95, 1.0) * streak * 0.35;
          // Espuma en las orillas
          float foam = smoothstep(0.16, 0.02, edge + sin(vUv.x * 60.0 + uTime * 3.0) * 0.012);
          col = mix(col, vec3(0.93, 0.99, 1.0), foam * 0.85);
          float f = smoothstep(fogNear, fogFar, vFogDepth);
          gl_FragColor = vec4(mix(col, fogColor, f), 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const geo = new THREE.PlaneGeometry(ARENA.width + 1.2, z1 - z0, 1, 1);
    const water = new THREE.Mesh(geo, mat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(ARENA.width / 2, WATER_Y, (z0 + z1) / 2);
    this.group.add(water);
    return mat;
  }

  // ------------------------------------------------------------------ puente

  private buildBridge(cx: number, width: number): THREE.Group {
    const g = new THREE.Group();
    const wood = woodTexture(5);
    const plankMat = toyMaterial(0xffffff, { map: wood, roughness: 0.8 });
    const darkWood = toyMaterial(PAL.woodDark, { roughness: 0.85 });
    const z0 = ARENA.riverTop - 0.55;
    const z1 = ARENA.riverBottom + 0.55;
    const len = z1 - z0;
    const arch = (t: number) => 0.06 + Math.sin(Math.PI * t) * 0.22;
    const n = 11;
    const rng = new Rng(Math.round(cx * 10));
    const planks: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const geo = new THREE.BoxGeometry(width + 0.1 - rng.next() * 0.12, 0.13, len / n - 0.04);
      const tilt = Math.cos(Math.PI * t) * 0.18;
      geo.rotateX(-tilt);
      geo.translate(cx + (rng.next() - 0.5) * 0.06, arch(t), z0 + t * len);
      planks.push(geo);
    }
    const deck = new THREE.Mesh(mergeGeometries(planks), plankMat);
    deck.castShadow = deck.receiveShadow = true;
    g.add(deck);

    // Vigas inferiores visibles desde el río
    for (const sx of [-1, 1]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, len), darkWood);
      beam.position.set(cx + sx * (width / 2 - 0.25), -0.12, (z0 + z1) / 2);
      g.add(beam);
    }

    // Barandillas con postes y pasamanos que siguen el arco
    const posts: THREE.BufferGeometry[] = [];
    const rails: THREE.BufferGeometry[] = [];
    for (const sx of [-1, 1]) {
      const x = cx + sx * (width / 2 + 0.02);
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const p = new THREE.CylinderGeometry(0.07, 0.08, 0.62, 8);
        p.translate(x, arch(t) + 0.3, z0 + t * len);
        posts.push(p);
        if (i < steps) {
          const t2 = (i + 1) / steps;
          const a = new THREE.Vector3(x, arch(t) + 0.58, z0 + t * len);
          const b = new THREE.Vector3(x, arch(t2) + 0.58, z0 + t2 * len);
          const r = new THREE.CylinderGeometry(0.055, 0.055, a.distanceTo(b) + 0.06, 6);
          r.rotateX(Math.PI / 2);
          r.lookAt(b.clone().sub(a));
          r.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
          rails.push(r);
        }
      }
    }
    const postMesh = new THREE.Mesh(mergeGeometries(posts), darkWood);
    const railMesh = new THREE.Mesh(mergeGeometries(rails), plankMat);
    postMesh.castShadow = railMesh.castShadow = true;
    g.add(postMesh, railMesh);

    // Estribos de piedra en ambos extremos
    const stone = stoneTexture(4);
    stone.repeat.set(1, 0.5);
    const stoneMat = toyMaterial(0xffffff, { map: stone, roughness: 0.9 });
    for (const z of [z0 - 0.15, z1 + 0.15]) {
      for (const sx of [-1, 1]) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), stoneMat);
        s.position.set(cx + sx * (width / 2 + 0.05), 0.12, z);
        s.rotation.y = sx * 0.08;
        s.castShadow = true;
        g.add(s);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), toyMaterial(PAL.gold, { roughness: 0.35, metalness: 0.4 }));
        cap.position.set(s.position.x, 0.42, z);
        g.add(cap);
      }
    }
    return g;
  }

  // ------------------------------------------------------------------ borde

  private buildBorderWall(): THREE.Group {
    const g = new THREE.Group();
    const stone = stoneTexture(6);
    const mat = toyMaterial(0xffffff, { map: stone, roughness: 0.88 });
    const capMat = toyMaterial(0xe9e1d0, { roughness: 0.7 });
    const h = PLATFORM_H + 0.32;
    const t = 0.45;
    const segs: [number, number, number, number][] = [
      // x, z, largo, rotación
      [-t / 2, ARENA.riverTop / 2, ARENA.riverTop, Math.PI / 2],
      [-t / 2, (ARENA.riverBottom + ARENA.height) / 2, ARENA.height - ARENA.riverBottom, Math.PI / 2],
      [ARENA.width + t / 2, ARENA.riverTop / 2, ARENA.riverTop, Math.PI / 2],
      [ARENA.width + t / 2, (ARENA.riverBottom + ARENA.height) / 2, ARENA.height - ARENA.riverBottom, Math.PI / 2],
      [ARENA.width / 2, -t / 2, ARENA.width + t * 2, 0],
      [ARENA.width / 2, ARENA.height + t / 2, ARENA.width + t * 2, 0],
    ];
    for (const [x, z, len, rot] of segs) {
      const tex = stone.clone();
      tex.repeat.set(len / 1.4, 0.6);
      tex.needsUpdate = true;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(len, h, t), toyMaterial(0xffffff, { map: tex, roughness: 0.88 }));
      wall.position.set(x, h / 2 - PLATFORM_H, z);
      wall.rotation.y = rot;
      wall.castShadow = wall.receiveShadow = true;
      g.add(wall);
      // Remate redondeado
      const cap = new THREE.Mesh(new THREE.CapsuleGeometry(t * 0.58, len - t, 4, 10), capMat);
      cap.rotation.z = Math.PI / 2;
      cap.rotation.y = rot;
      cap.position.set(x, h - PLATFORM_H + 0.02, z);
      cap.castShadow = true;
      g.add(cap);
    }
    // Pilares en las esquinas y junto al río
    const pillarMat = mat;
    for (const [x, z] of [[-t / 2, -t / 2], [ARENA.width + t / 2, -t / 2], [-t / 2, ARENA.height + t / 2], [ARENA.width + t / 2, ARENA.height + t / 2], [-t / 2, ARENA.riverTop], [ARENA.width + t / 2, ARENA.riverTop], [-t / 2, ARENA.riverBottom], [ARENA.width + t / 2, ARENA.riverBottom]]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.75, h + 0.35, 0.75), pillarMat);
      p.position.set(x, (h + 0.35) / 2 - PLATFORM_H, z);
      p.castShadow = true;
      g.add(p);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 4), capMat);
      top.rotation.y = Math.PI / 4;
      top.position.set(x, h + 0.35 - PLATFORM_H + 0.17, z);
      g.add(top);
    }
    return g;
  }

  // ------------------------------------------------------------------ decorado

  private buildEnvironment(): THREE.Group {
    const g = new THREE.Group();
    const rng = new Rng(77);
    const W = ARENA.width;
    const H = ARENA.height;
    const outerY = -PLATFORM_H;

    // Puntos de decorado alrededor del campo (fuera del muro), más densos en los laterales.
    const spots: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 140; i++) {
      const side = rng.next();
      let x: number;
      let z: number;
      if (side < 0.38) {
        x = -1.6 - rng.next() * 9;
        z = -6 + rng.next() * (H + 12);
      } else if (side < 0.76) {
        x = W + 1.6 + rng.next() * 9;
        z = -6 + rng.next() * (H + 12);
      } else {
        x = -6 + rng.next() * (W + 12);
        z = -1.6 - rng.next() * 12;
      }
      spots.push({ x, z, s: 0.8 + rng.next() * 0.7 });
    }

    // Árboles: tronco + copas facetadas en racimo (instanciados para rendimiento).
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 1.2, 7);
    trunkGeo.translate(0, 0.6, 0);
    const leafGeo = new THREE.IcosahedronGeometry(0.75, 1);
    const trunkMat = toyMaterial(0x8a5a33, { roughness: 0.9 });
    const leafMat = toyMaterial(0xffffff, { roughness: 0.8, flatShading: true });
    const trees = spots.filter((_, i) => i % 2 === 0);
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, trees.length);
    const leaves = new THREE.InstancedMesh(leafGeo, leafMat, trees.length * 3);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const greens = [0x3f9a3a, 0x52b043, 0x2f8a3c, 0x67bf4a, 0x4aa65a];
    trees.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, outerY, t.z), q.setFromEuler(new THREE.Euler(0, rng.next() * 6, 0)), new THREE.Vector3(t.s, t.s, t.s));
      trunks.setMatrixAt(i, m);
      for (let k = 0; k < 3; k++) {
        const off = new THREE.Vector3((k - 1) * 0.42 * t.s, (1.45 + (k === 1 ? 0.45 : 0)) * t.s, (rng.next() - 0.5) * 0.4 * t.s);
        const sc = t.s * (k === 1 ? 1.15 : 0.9);
        m.compose(new THREE.Vector3(t.x, outerY, t.z).add(off), q.setFromEuler(new THREE.Euler(rng.next(), rng.next(), 0)), new THREE.Vector3(sc, sc * 0.92, sc));
        leaves.setMatrixAt(i * 3 + k, m);
        leaves.setColorAt(i * 3 + k, new THREE.Color(greens[Math.floor(rng.next() * greens.length)]));
      }
    });
    trunks.castShadow = leaves.castShadow = true;
    g.add(trunks, leaves);

    // Rocas facetadas
    const rocks = spots.filter((_, i) => i % 2 === 1);
    const rockGeo = new THREE.DodecahedronGeometry(0.5, 0);
    const rockMesh = new THREE.InstancedMesh(rockGeo, toyMaterial(0xffffff, { roughness: 0.95, flatShading: true }), rocks.length);
    rocks.forEach((r, i) => {
      const sc = new THREE.Vector3(r.s * (0.8 + rng.next()), r.s * (0.5 + rng.next() * 0.5), r.s * (0.8 + rng.next()));
      m.compose(new THREE.Vector3(r.x, outerY + 0.15, r.z), q.setFromEuler(new THREE.Euler(rng.next(), rng.next() * 6, rng.next())), sc);
      rockMesh.setMatrixAt(i, m);
      const k = 0.75 + rng.next() * 0.25;
      rockMesh.setColorAt(i, new THREE.Color(0.72 * k, 0.69 * k, 0.64 * k));
    });
    rockMesh.castShadow = true;
    g.add(rockMesh);

    // Arbustos y flores pegados al muro exterior (marco del campo)
    const bushGeo = new THREE.SphereGeometry(0.45, 10, 8);
    const bushes: THREE.Vector3[] = [];
    for (let z = 1; z < H; z += 2.3) {
      if (z > ARENA.riverTop - 1 && z < ARENA.riverBottom + 1) continue;
      bushes.push(new THREE.Vector3(-1.05, outerY + 0.25, z + rng.next()), new THREE.Vector3(W + 1.05, outerY + 0.25, z + rng.next()));
    }
    const bushMesh = new THREE.InstancedMesh(bushGeo, toyMaterial(0xffffff, { roughness: 0.75 }), bushes.length);
    bushes.forEach((p, i) => {
      const s = 0.8 + rng.next() * 0.6;
      m.compose(p, q.identity(), new THREE.Vector3(s * 1.3, s, s));
      bushMesh.setMatrixAt(i, m);
      bushMesh.setColorAt(i, new THREE.Color(greens[i % greens.length]).multiplyScalar(0.95));
    });
    bushMesh.castShadow = true;
    g.add(bushMesh);
    const flowerGeo = new THREE.SphereGeometry(0.09, 8, 6);
    const flowerColors = [0xfff176, 0xffffff, 0xff8fb8, 0x8fc8ff, 0xffb347];
    const flowers = new THREE.InstancedMesh(flowerGeo, toyMaterial(0xffffff, { roughness: 0.5, emissive: 0x222222 }), bushes.length * 3);
    bushes.forEach((p, i) => {
      for (let k = 0; k < 3; k++) {
        m.compose(p.clone().add(new THREE.Vector3((rng.next() - 0.5) * 0.9, 0.38 + rng.next() * 0.2, (rng.next() - 0.5) * 0.9)), q.identity(), new THREE.Vector3(1, 1, 1));
        flowers.setMatrixAt(i * 3 + k, m);
        flowers.setColorAt(i * 3 + k, new THREE.Color(flowerColors[(i + k) % flowerColors.length]));
      }
    });
    g.add(flowers);

    // Banderines de equipo en las esquinas (ondean)
    for (const [x, z, team] of [[-1.3, -1.3, 1], [W + 1.3, -1.3, 1], [-1.3, H + 1.3, 0], [W + 1.3, H + 1.3, 0]] as const) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8), toyMaterial(PAL.woodDark));
      pole.position.set(x, outerY + 1.7, z);
      pole.castShadow = true;
      g.add(pole);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), toyMaterial(PAL.gold, { metalness: 0.4, roughness: 0.35 }));
      knob.position.set(x, outerY + 3.45, z);
      g.add(knob);
      const flagGeo = new THREE.PlaneGeometry(1.3, 0.8, 10, 4);
      flagGeo.translate(0.65, 0, 0);
      const flag = new THREE.Mesh(flagGeo, toyMaterial(PAL.team[team], { side: THREE.DoubleSide, roughness: 0.7 }));
      flag.position.set(x, outerY + 2.95, z);
      flag.rotation.y = x < W / 2 ? 0 : Math.PI;
      flag.castShadow = true;
      g.add(flag);
      this.flags.push({ mesh: flag, base: Float32Array.from(flagGeo.attributes.position.array), phase: x + z });
    }
    return g;
  }
}
