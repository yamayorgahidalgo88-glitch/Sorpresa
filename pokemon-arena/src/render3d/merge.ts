import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Funde las mallas estáticas de un grupo en una malla por material (y por si proyectan
 * sombra): cada malla es una llamada de dibujo, y en móviles el número de llamadas pesa más
 * que el de triángulos. Se dejan aparte las que se animan (`keep`, con sus descendientes),
 * las instanciadas, las de varios materiales y las ocultas.
 * Debe llamarse al construir, antes del primer fotograma (no libera geometrías ya subidas).
 */
export function mergeStaticMeshes(parent: THREE.Object3D, keep: Iterable<THREE.Object3D> = []): void {
  const skip = new Set(keep);
  parent.updateMatrixWorld(true);
  const inv = parent.matrixWorld.clone().invert();
  const buckets = new Map<string, { mesh: THREE.Mesh; geos: THREE.BufferGeometry[] }>();
  const merged: THREE.Mesh[] = [];
  const visit = (o: THREE.Object3D) => {
    if (skip.has(o) || !o.visible) return;
    if (o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh) && !(o instanceof THREE.SkinnedMesh) && !Array.isArray(o.material) && o.children.length === 0) {
      const key = `${o.material.uuid}|${o.castShadow}|${o.receiveShadow}|${o.renderOrder}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { mesh: o, geos: [] }));
      b.geos.push(toLocal(o, inv));
      merged.push(o);
      return;
    }
    for (const c of o.children) visit(c);
  };
  for (const c of parent.children) visit(c);
  for (const { mesh, geos } of buckets.values()) {
    if (geos.length < 2) continue;
    const geo = mergeGeometries(geos);
    if (!geo) continue;
    const m = new THREE.Mesh(geo, mesh.material);
    m.castShadow = mesh.castShadow;
    m.receiveShadow = mesh.receiveShadow;
    m.renderOrder = mesh.renderOrder;
    parent.add(m);
    for (const o of merged) if (o.material === mesh.material && o.castShadow === m.castShadow && o.receiveShadow === m.receiveShadow && o.renderOrder === m.renderOrder) o.removeFromParent();
  }
}

/** Geometría de la malla en el espacio de `parent`, sin índice y con posición, normal y UV. */
function toLocal(mesh: THREE.Mesh, parentInv: THREE.Matrix4): THREE.BufferGeometry {
  const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', src.attributes.position);
  if (!src.attributes.normal) src.computeVertexNormals();
  g.setAttribute('normal', src.attributes.normal);
  const n = src.attributes.position.count;
  g.setAttribute('uv', src.attributes.uv ?? new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  const m = new THREE.Matrix4().multiplyMatrices(parentInv, mesh.matrixWorld);
  g.applyMatrix4(m);
  // Una escala negativa invierte el sentido de los triángulos: se corrige el orden.
  if (m.determinant() < 0) {
    for (const name of ['position', 'normal', 'uv']) {
      const a = g.attributes[name] as THREE.BufferAttribute;
      for (let t = 0; t < n; t += 3) {
        for (let k = 0; k < a.itemSize; k++) {
          const x = a.array[(t + 1) * a.itemSize + k];
          (a.array as Float32Array)[(t + 1) * a.itemSize + k] = a.array[(t + 2) * a.itemSize + k];
          (a.array as Float32Array)[(t + 2) * a.itemSize + k] = x;
        }
      }
    }
  }
  return g;
}
