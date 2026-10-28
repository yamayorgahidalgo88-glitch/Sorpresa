import * as THREE from 'three';
import { CARDS } from '../sim/data/cards';
import { createRig } from './creatures/registry';

/**
 * Retratos de los Pokémon para cartas y fichas: se fotografía cada modelo vóxel (el mismo
 * que en batalla) en una escena de estudio con fondo transparente. Se hace una sola vez con
 * un renderizador temporal que se libera al terminar.
 */
export function renderPortraits(size = 256): Map<string, HTMLCanvasElement> {
  const out = new Map<string, HTMLCanvasElement>();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  try {
    renderer.setPixelRatio(1);
    renderer.setSize(size, size, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xe4f4ff, 0x5f8d43, 1.3));
    const sun = new THREE.DirectionalLight(0xfff0d2, 2.4);
    sun.position.set(-3, 5, 6);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x9fc7ff, 0.9);
    rim.position.set(4, 3, -5);
    scene.add(rim);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    for (const card of Object.values(CARDS)) {
      if (card.kind !== 'pokemon') continue;
      const rig = createRig(card.id, 'voxel');
      rig.root.rotation.y = -0.4;
      rig.pose({ time: 0.6, dt: 0, run: 0, charge: 0, release: 0, hurt: 0, stunned: false });
      scene.add(rig.root);
      rig.root.updateMatrixWorld(true);
      // Encuadre por la caja visible del modelo
      const box = new THREE.Box3();
      rig.root.traverse((o) => {
        if (o instanceof THREE.Mesh && o.userData.voxel) box.expandByObject(o);
      });
      const center = box.getCenter(new THREE.Vector3());
      const dim = box.getSize(new THREE.Vector3());
      const r = Math.max(dim.x, dim.y, dim.z) * 0.62;
      const dist = r / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.set(center.x, center.y + dist * 0.3, center.z + dist);
      camera.lookAt(center);
      renderer.render(scene, camera);
      const c = document.createElement('canvas');
      c.width = c.height = size;
      c.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
      out.set(card.id, c);
      scene.remove(rig.root);
      rig.dispose();
    }
  } finally {
    renderer.dispose();
    renderer.forceContextLoss();
  }
  return out;
}
