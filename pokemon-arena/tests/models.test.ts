import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CARDS } from '../src/sim/data/cards';
import { createRig, hasProductionModel } from '../src/render3d/creatures/registry';

const pokemon = Object.values(CARDS).filter((c) => c.kind === 'pokemon').map((c) => c.id);

function voxelMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o.userData.voxel) out.push(o);
  });
  return out;
}

describe('modelos 3D (hito F)', () => {
  it('todos los Pokémon del catálogo tienen modelo de producción', () => {
    for (const id of pokemon) expect(hasProductionModel(id), id).toBe(true);
  });

  it('cada modelo se vozeliza, anima sin valores inválidos y tiene punto de ataque', () => {
    for (const id of pokemon) {
      const rig = createRig(id, 'voxel');
      const meshes = voxelMeshes(rig.root);
      expect(meshes.length, id).toBeGreaterThan(0);
      for (const m of meshes) expect(m.geometry.attributes.position.count, id).toBeGreaterThan(0);
      for (const [run, charge, release, hurt] of [[0, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 1]]) {
        rig.pose({ time: 1.3, dt: 1 / 30, run, charge, release, hurt, stunned: true });
      }
      rig.root.updateMatrixWorld(true);
      const p = rig.emitterWorld(new THREE.Vector3());
      expect(Number.isFinite(p.x + p.y + p.z), id).toBe(true);
      expect(rig.height, id).toBeGreaterThan(0.6); // los enjambres y Voltorb son pequeños
      // Caja del modelo coherente con su altura declarada (±40 %)
      const box = new THREE.Box3();
      for (const m of meshes) box.expandByObject(m);
      expect(box.max.y, id).toBeGreaterThan(rig.height * 0.6);
      expect(box.max.y, id).toBeLessThan(rig.height * 1.4);
    }
  });

  it('las unidades iguales comparten la geometría vóxel (caché) pero no los materiales', () => {
    const a = createRig('machop', 'voxel');
    const b = createRig('machop', 'voxel');
    const ma = voxelMeshes(a.root);
    const mb = voxelMeshes(b.root);
    expect(ma.length).toBe(mb.length);
    ma.forEach((m, i) => {
      expect(mb[i].geometry).toBe(m.geometry);
      expect(mb[i].material).not.toBe(m.material);
    });
    a.dispose();
    expect(mb[0].geometry.attributes.position.count).toBeGreaterThan(0);
  });
});

describe('rendimiento de los modelos (hito H)', () => {
  it('cada Pokémon es UNA malla con piel: un hueso por grupo animado y pocas llamadas de dibujo', () => {
    for (const id of pokemon) {
      const rig = createRig(id, 'voxel');
      const meshes = voxelMeshes(rig.root);
      expect(meshes.length, id).toBe(1);
      const skinned = meshes[0] as THREE.SkinnedMesh;
      expect(skinned.isSkinnedMesh, id).toBe(true);
      // Una llamada por material: el cuerpo comparte material; solo aparte lo que brilla
      expect(skinned.geometry.groups.length, id).toBeLessThanOrEqual(3);
      const bones = skinned.skeleton.bones.length;
      const idx = skinned.geometry.attributes.skinIndex.array;
      for (let i = 0; i < idx.length; i += 4) expect(idx[i], id).toBeLessThan(bones);
    }
  });

  it('la piel sigue a los grupos animados (mover un grupo mueve sus cubos)', () => {
    const rig = createRig('pikachu', 'voxel');
    const skinned = voxelMeshes(rig.root)[0] as THREE.SkinnedMesh;
    rig.root.updateMatrixWorld(true);
    // Primer vértice de cada hueso, antes y después de desplazar ese hueso
    const bone = skinned.geometry.attributes.skinIndex.getX(0);
    const before = skinned.getVertexPosition(0, new THREE.Vector3());
    skinned.skeleton.bones[bone].position.y += 1;
    rig.root.updateMatrixWorld(true);
    const after = skinned.getVertexPosition(0, new THREE.Vector3());
    expect(after.y - before.y).toBeCloseTo(1, 3);
  });
});

describe('fusión de mallas estáticas (hito H)', () => {
  it('funde por material, conserva la posición y deja aparte las animadas', async () => {
    const { mergeStaticMeshes } = await import('../src/render3d/merge');
    const g = new THREE.Group();
    const a = new THREE.MeshStandardMaterial();
    const b = new THREE.MeshStandardMaterial();
    const m1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), a);
    m1.position.set(5, 0, 0);
    const m2 = new THREE.Mesh(new THREE.SphereGeometry(0.5), a);
    m2.position.set(-5, 0, 0);
    const m3 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), b);
    const keep = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), a);
    g.add(m1, m2, m3, keep);
    mergeStaticMeshes(g, [keep]);
    const meshes = g.children.filter((c) => c instanceof THREE.Mesh) as THREE.Mesh[];
    expect(meshes.length).toBe(3); // fusionada (a), m3 (b, sola) y la animada
    expect(meshes).toContain(keep);
    expect(meshes).toContain(m3);
    const fused = meshes.find((m) => m !== keep && m !== m3)!;
    fused.geometry.computeBoundingBox();
    expect(fused.geometry.boundingBox!.min.x).toBeCloseTo(-5.5, 3);
    expect(fused.geometry.boundingBox!.max.x).toBeCloseTo(5.5, 3);
  });
});
