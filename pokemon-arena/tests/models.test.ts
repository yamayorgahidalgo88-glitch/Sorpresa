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
      expect(rig.height, id).toBeGreaterThan(0.9);
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
