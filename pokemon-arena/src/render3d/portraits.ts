import * as THREE from 'three';
import { getCard } from '../sim/data/cards';
import { createRig } from './creatures/registry';

/**
 * Retratos de los Pokémon para cartas y fichas: se fotografía el modelo vóxel (el mismo que
 * en batalla) en una escena de estudio con fondo transparente. El estudio se crea al pedir
 * el primer retrato y cada retrato se dibuja una sola vez (lo guarda quien lo pide).
 */
class PortraitStudio {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  constructor(private readonly size: number) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(size, size, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.setClearColor(0x000000, 0);
    this.scene.add(new THREE.HemisphereLight(0xe4f4ff, 0x5f8d43, 1.3));
    const sun = new THREE.DirectionalLight(0xfff0d2, 2.4);
    sun.position.set(-3, 5, 6);
    const rim = new THREE.DirectionalLight(0x9fc7ff, 0.9);
    rim.position.set(4, 3, -5);
    this.scene.add(sun, rim);
  }

  render(cardId: string): HTMLCanvasElement {
    const rig = createRig(cardId, 'voxel');
    rig.root.rotation.y = -0.4;
    rig.pose({ time: 0.6, dt: 0, run: 0, charge: 0, release: 0, hurt: 0, stunned: false });
    this.scene.add(rig.root);
    rig.root.updateMatrixWorld(true);
    // Encuadre por la caja visible del modelo
    const box = new THREE.Box3();
    rig.root.traverse((o) => {
      if (o instanceof THREE.Mesh && o.visible && (o.userData.voxel || !o.userData.part)) box.expandByObject(o);
    });
    const center = box.getCenter(new THREE.Vector3());
    const dim = box.getSize(new THREE.Vector3());
    const r = Math.max(dim.x, dim.y, dim.z) * 0.62;
    const dist = r / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.camera.position.set(center.x, center.y + dist * 0.3, center.z + dist);
    this.camera.lookAt(center);
    this.renderer.render(this.scene, this.camera);
    const c = document.createElement('canvas');
    c.width = c.height = this.size;
    c.getContext('2d')!.drawImage(this.renderer.domElement, 0, 0);
    this.scene.remove(rig.root);
    rig.dispose();
    return c;
  }
}

let studio: PortraitStudio | null = null;

/** Retrato de un Pokémon (lanza una excepción si no hay WebGL). */
export function renderPortrait(cardId: string, size = 256): HTMLCanvasElement {
  if (getCard(cardId).kind !== 'pokemon') throw new Error(`Sin retrato: ${cardId}`);
  studio ??= new PortraitStudio(size);
  return studio.render(cardId);
}
