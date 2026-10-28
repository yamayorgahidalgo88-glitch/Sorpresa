import * as THREE from 'three';
import type { CreatureRig } from './rig';

/**
 * Estilo "píxel 3D" (vóxel): convierte las piezas de un personaje en cubos alineados a una
 * rejilla, conservando su jerarquía (cabeza, orejas, brazos, cola…) para que la animación
 * procedural siga funcionando igual.
 *
 * - Una rejilla por grupo animado: los rasgos de la cara (ojos, mejillas, boca) se pintan
 *   como píxeles sobre la misma rejilla que el cráneo.
 * - Solo se generan las caras exteriores (sin caras ocultas entre cubos).
 * - Oclusión ambiental por vértice (como en los juegos de vóxeles) y una ligera variación de
 *   tono por cubo: dan volumen y textura de "pixel art" sin texturas.
 * - Las piezas originales se ocultan pero se conservan como anclajes (mejillas, boca…).
 */

type Inside = (p: THREE.Vector3) => boolean;

const tmpMesh = new THREE.Mesh();
const raycaster = new THREE.Raycaster();
const RAY_DIR = new THREE.Vector3(1, 0.0137, 0.0071).normalize();

/** Prueba "dentro/fuera" en el espacio local de la geometría. */
function insideTest(geo: THREE.BufferGeometry): Inside {
  const g = geo as THREE.BufferGeometry & { type: string; parameters?: Record<string, number> };
  const P = g.parameters ?? {};
  switch (g.type) {
    case 'SphereGeometry':
      return (p) => p.lengthSq() <= P.radius * P.radius;
    case 'ConeGeometry':
      return (p) => {
        if (Math.abs(p.y) > P.height / 2) return false;
        const r = P.radius * (0.5 - p.y / P.height);
        return p.x * p.x + p.z * p.z <= r * r;
      };
    case 'CylinderGeometry':
      return (p) => {
        if (Math.abs(p.y) > P.height / 2) return false;
        const t = p.y / P.height + 0.5;
        const r = P.radiusBottom + (P.radiusTop - P.radiusBottom) * t;
        return p.x * p.x + p.z * p.z <= r * r;
      };
    case 'CapsuleGeometry':
      return (p) => {
        const y = Math.max(-P.height / 2, Math.min(P.height / 2, p.y));
        return p.x * p.x + (p.y - y) * (p.y - y) + p.z * p.z <= P.radius * P.radius;
      };
    case 'BoxGeometry':
      return (p) => Math.abs(p.x) <= P.width / 2 && Math.abs(p.y) <= P.height / 2 && Math.abs(p.z) <= P.depth / 2;
    default: {
      // Geometría arbitraria (extrusiones…): paridad de cortes de un rayo.
      const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      geo.computeBoundingBox();
      const box = geo.boundingBox!;
      return (p) => {
        if (!box.containsPoint(p)) return false;
        tmpMesh.geometry = geo;
        tmpMesh.material = mat;
        tmpMesh.matrixWorld.identity();
        raycaster.set(p, RAY_DIR);
        const hits = raycaster.intersectObject(tmpMesh, false);
        return hits.length % 2 === 1;
      };
    }
  }
}

/** Ruido determinista por celda (variación de tono tipo pixel art). */
function hash(i: number, j: number, k: number): number {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const FACES = [
  { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0] },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { n: [0, 0, -1], u: [0, 1, 0], v: [1, 0, 0] },
] as const;
const AO = [0.52, 0.7, 0.86, 1];

interface PartInfo {
  mesh: THREE.Mesh;
  inverse: THREE.Matrix4;
  inside: Inside;
  material: THREE.MeshStandardMaterial;
}

/** Vozeliza un grupo: devuelve la malla de cubos (o null si no tiene piezas). */
function voxelizeGroup(
  group: THREE.Object3D,
  size: number,
  face: CreatureRig['pixelFace'] | undefined,
  remap: (m: THREE.MeshStandardMaterial) => THREE.MeshStandardMaterial,
): THREE.Mesh | null {
  const parts: PartInfo[] = [];
  const bounds = new THREE.Box3();
  for (const c of group.children) {
    if (!(c instanceof THREE.Mesh) || !c.userData.part) continue;
    c.updateMatrix();
    c.geometry.computeBoundingBox();
    bounds.union(c.geometry.boundingBox!.clone().applyMatrix4(c.matrix));
    // `clipAbove` / `clipBelow` (en coordenadas locales de la pieza): media esfera, casquetes…
    const base = insideTest(c.geometry);
    const lo = c.userData.clipAbove as number | undefined;
    const hi = c.userData.clipBelow as number | undefined;
    const inside: Inside = lo === undefined && hi === undefined ? base : (q) => (lo === undefined || q.y >= lo) && (hi === undefined || q.y <= hi) && base(q);
    parts.push({ mesh: c, inverse: c.matrix.clone().invert(), inside, material: c.material as THREE.MeshStandardMaterial });
  }
  if (parts.length === 0) return null;
  bounds.expandByScalar(size);
  const i0 = Math.floor(bounds.min.x / size);
  const j0 = Math.floor(bounds.min.y / size);
  const k0 = Math.floor(bounds.min.z / size);
  const nx = Math.ceil(bounds.max.x / size) - i0;
  const ny = Math.ceil(bounds.max.y / size) - j0;
  const nz = Math.ceil(bounds.max.z / size) - k0;
  const cells = new Int16Array(nx * ny * nz).fill(-1);
  const idx = (i: number, j: number, k: number) => (i * ny + j) * nz + k;
  const at = (i: number, j: number, k: number) => (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz ? -1 : cells[idx(i, j, k)]);

  // Relleno: la última pieza añadida (rasgos) tiene prioridad sobre las anteriores.
  const p = new THREE.Vector3();
  const local = new THREE.Vector3();
  const counts = new Array(parts.length).fill(0);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      for (let k = 0; k < nz; k++) {
        p.set((i0 + i + 0.5) * size, (j0 + j + 0.5) * size, (k0 + k + 0.5) * size);
        for (let m = parts.length - 1; m >= 0; m--) {
          local.copy(p).applyMatrix4(parts[m].inverse);
          if (parts[m].inside(local)) {
            cells[idx(i, j, k)] = m;
            counts[m]++;
            break;
          }
        }
      }
    }
  }
  // Piezas más finas que un cubo (ojos, nariz, boca, brillo): ocupan UN píxel en su centro.
  // Un píxel de detalle no pisa a otro detalle (el brillo no borra el ojo).
  const detail = new Set<number>();
  parts.forEach((part, m) => {
    if (counts[m] > 0) return;
    part.mesh.geometry.computeBoundingBox();
    part.mesh.geometry.boundingBox!.getCenter(p).applyMatrix4(part.mesh.matrix);
    const i = Math.floor(p.x / size) - i0;
    const j = Math.floor(p.y / size) - j0;
    const k = Math.floor(p.z / size) - k0;
    if (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) return;
    const c = idx(i, j, k);
    if (detail.has(c)) return;
    cells[c] = m;
    detail.add(c);
  });

  // Cara de pixel art: cada píxel recolorea el cubo más frontal (mayor z) de su columna.
  const override = new Map<number, THREE.MeshStandardMaterial>();
  if (face && face.group === group) {
    const w = face.rows[0].length;
    face.rows.forEach((row, r) => {
      for (let col = 0; col < w; col++) {
        const mat = face.palette[row[col]];
        if (!mat) continue;
        const i = Math.floor(((col - w / 2 + 0.5) * size) / size) - i0;
        const j = Math.floor((face.top - (r + 0.5) * size) / size) - j0;
        for (let k = nz - 1; k >= 0; k--) {
          if (at(i, j, k) >= 0) {
            override.set(idx(i, j, k), mat);
            break;
          }
        }
      }
    });
  }

  // Geometría: solo caras expuestas, agrupadas por material, con AO por vértice.
  // El color va en los vértices: las piezas sin brillo propio comparten un único material.
  const materials = [...new Set([...parts.map((q) => q.material), ...override.values()].map(remap))];
  const buckets = materials.map(() => ({ pos: [] as number[], nor: [] as number[], col: [] as number[] }));
  const base = new THREE.Color();
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      for (let k = 0; k < nz; k++) {
        const m = cells[idx(i, j, k)];
        if (m < 0) continue;
        const mat = override.get(idx(i, j, k)) ?? parts[m].material;
        const b = buckets[materials.indexOf(remap(mat))];
        const tint = 0.93 + hash(i + i0, j + j0, k + k0) * 0.12;
        base.copy(mat.color).multiplyScalar(tint);
        for (const f of FACES) {
          const [a, bb, c] = f.n;
          if (at(i + a, j + bb, k + c) >= 0) continue;
          // Las 4 esquinas de la cara y su oclusión por vecinos del plano exterior.
          const corners: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
          const verts: number[][] = [];
          const ao: number[] = [];
          for (const [cu, cv] of corners) {
            const su = cu ? 1 : -1;
            const sv = cv ? 1 : -1;
            const o = (du: number, dv: number) =>
              at(i + a + f.u[0] * du + f.v[0] * dv, j + bb + f.u[1] * du + f.v[1] * dv, k + c + f.u[2] * du + f.v[2] * dv) >= 0 ? 1 : 0;
            const s1 = o(su, 0);
            const s2 = o(0, sv);
            const cr = o(su, sv);
            ao.push(AO[s1 && s2 ? 0 : 3 - (s1 + s2 + cr)]);
            const x = (i0 + i + (a > 0 ? 1 : 0) + (f.u[0] * cu + f.v[0] * cv) * (a !== 0 ? 0 : 1)) * size;
            const y = (j0 + j + (bb > 0 ? 1 : 0) + (f.u[1] * cu + f.v[1] * cv) * (bb !== 0 ? 0 : 1)) * size;
            const z = (k0 + k + (c > 0 ? 1 : 0) + (f.u[2] * cu + f.v[2] * cv) * (c !== 0 ? 0 : 1)) * size;
            verts.push([x, y, z]);
          }
          // Diagonal elegida según la AO para evitar artefactos de interpolación.
          const order = ao[0] + ao[2] > ao[1] + ao[3] ? [0, 1, 2, 0, 2, 3] : [1, 2, 3, 1, 3, 0];
          for (const vi of order) {
            b.pos.push(...verts[vi]);
            b.nor.push(a, bb, c);
            b.col.push(base.r * ao[vi], base.g * ao[vi], base.b * ao[vi]);
          }
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  buckets.forEach((b, mi) => {
    geo.addGroup(pos.length / 3, b.pos.length / 3, mi);
    pos.push(...b.pos);
    nor.push(...b.nor);
    col.push(...b.col);
  });
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  for (const part of parts) part.mesh.visible = false; // se conservan como anclajes
  return finishMesh(new THREE.Mesh(geo, materials));
}

/**
 * Caché por modelo: vozelizar cuesta unos milisegundos y en batalla aparecen muchas unidades
 * iguales. La geometría se comparte (no se libera al morir la unidad); los materiales son de
 * cada unidad, para que los destellos y la transparencia sean independientes.
 */
interface CachedVoxels {
  geo: THREE.BufferGeometry;
  /** Material de cada grupo de la geometría: índice en `rig.materials`. */
  mats: number[];
  bones: number;
}
const cache = new Map<string, CachedVoxels>();

function finishMesh(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.voxel = true;
  return mesh;
}

/** ¿Se puede fundir este material con el del cuerpo? (sin brillo propio ni transparencia) */
function isPlain(m: THREE.MeshStandardMaterial): boolean {
  return !m.userData.ownGlow && m.emissive.getHex() === 0 && !m.transparent && m.opacity === 1 && m.side === THREE.FrontSide && m.metalness === 0;
}

/**
 * Funde los cubos de todas las piezas en UNA malla con piel (`SkinnedMesh`): cada grupo
 * animado es un hueso, así la animación procedural sigue moviendo los grupos igual, pero el
 * personaje se dibuja con una llamada por material (antes, una por pieza y material).
 * La geometría queda en el espacio local de cada grupo (hueso), con matrices inversas
 * identidad, de modo que no depende de la pose en la que se construyó.
 */
function mergeGroups(groups: THREE.Object3D[], rig: CreatureRig): CachedVoxels | null {
  const meshes: { mesh: THREE.Mesh; bone: number }[] = [];
  groups.forEach((g, bone) => {
    for (const c of g.children) if (c instanceof THREE.Mesh && c.userData.voxel) meshes.push({ mesh: c, bone });
  });
  if (meshes.length === 0) return null;
  const mats: THREE.Material[] = [];
  const buckets: { pos: number[]; nor: number[]; col: number[]; bone: number[] }[] = [];
  for (const { mesh, bone } of meshes) {
    const geo = mesh.geometry;
    const pos = geo.attributes.position.array;
    const nor = geo.attributes.normal.array;
    const col = geo.attributes.color.array;
    const list = mesh.material as THREE.Material[];
    for (const gr of geo.groups) {
      const mat = list[gr.materialIndex ?? 0];
      let bi = mats.indexOf(mat);
      if (bi < 0) {
        bi = mats.push(mat) - 1;
        buckets.push({ pos: [], nor: [], col: [], bone: [] });
      }
      const b = buckets[bi];
      for (let v = gr.start; v < gr.start + gr.count; v++) {
        b.pos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
        b.nor.push(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]);
        b.col.push(col[v * 3], col[v * 3 + 1], col[v * 3 + 2]);
        b.bone.push(bone);
      }
    }
    mesh.removeFromParent();
    geo.dispose();
  }
  const geo = new THREE.BufferGeometry();
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const skinIndex: number[] = [];
  const skinWeight: number[] = [];
  buckets.forEach((b, mi) => {
    geo.addGroup(pos.length / 3, b.pos.length / 3, mi);
    pos.push(...b.pos);
    nor.push(...b.nor);
    col.push(...b.col);
    for (const bone of b.bone) {
      skinIndex.push(bone, 0, 0, 0);
      skinWeight.push(1, 0, 0, 0);
    }
  });
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  return { geo, mats: mats.map((m) => rig.materials.indexOf(m as THREE.MeshStandardMaterial)), bones: groups.length };
}

function attachSkinned(rig: CreatureRig, groups: THREE.Object3D[], entry: CachedVoxels): void {
  // Los grupos hacen de huesos (el esqueleto solo lee su `matrixWorld`).
  const bones = groups as unknown as THREE.Bone[];
  const skeleton = new THREE.Skeleton(bones, bones.map(() => new THREE.Matrix4()));
  const mesh = new THREE.SkinnedMesh(entry.geo, entry.mats.map((m) => rig.materials[m]));
  mesh.bind(skeleton, new THREE.Matrix4());
  // El personaje se mueve y deforma: su caja cambia, y una sola malla por unidad es barata.
  mesh.frustumCulled = false;
  rig.root.add(finishMesh(mesh));
}

/** Convierte un personaje al estilo vóxel. `size` = arista del cubo en casillas. */
export function voxelizeRig(rig: CreatureRig, size = 0.055, cacheKey?: string): void {
  const groups: THREE.Object3D[] = [];
  rig.root.traverse((o) => {
    if (o.children.some((c) => c instanceof THREE.Mesh && c.userData.part)) groups.push(o);
  });
  // Material único del cuerpo (estándar: más barato que el físico con barniz en móviles).
  const body = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 });
  const remap = (m: THREE.MeshStandardMaterial) => (isPlain(m) ? body : m);
  const used = new Set<THREE.MeshStandardMaterial>();
  const hit = cacheKey ? cache.get(cacheKey) : undefined;
  let entry: CachedVoxels | null;
  if (hit && hit.bones === groups.length) {
    for (const g of groups) for (const c of g.children) if (c instanceof THREE.Mesh && c.userData.part) c.visible = false;
    entry = hit;
  } else {
    for (const g of groups) {
      const mesh = voxelizeGroup(g, size, rig.pixelFace, remap);
      if (mesh) g.add(mesh);
    }
    entry = null;
  }
  // Solo quedan los materiales que se dibujan (más el del cuerpo), para destellos y transparencia.
  // (Se conservan los que usen otras mallas del modelo que no se pasan a cubos.)
  const elsewhere = new Set<THREE.Material>();
  rig.root.traverse((o) => {
    if (o instanceof THREE.Mesh && !o.userData.part && !o.userData.voxel) for (const m of [o.material].flat()) elsewhere.add(m);
  });
  const all = rig.materials.slice();
  rig.materials.length = 0;
  rig.materials.push(body, ...all.filter((m) => !isPlain(m) || elsewhere.has(m)));
  if (!entry) {
    entry = mergeGroups(groups, rig);
    if (entry && cacheKey && entry.mats.every((m) => m >= 0)) {
      entry.geo.userData.shared = true;
      cache.set(cacheKey, entry);
    }
  }
  if (entry && entry.mats.every((m) => m >= 0)) attachSkinned(rig, groups, entry);
  for (const m of rig.materials) used.add(m);
  // Materiales mate con color por vértice (el color base pasa a los vértices).
  for (const m of used) {
    m.vertexColors = true;
    m.color.set(0xffffff);
    m.roughness = 0.78;
    if (m instanceof THREE.MeshPhysicalMaterial) m.clearcoat = 0.08;
    m.needsUpdate = true;
  }
}
