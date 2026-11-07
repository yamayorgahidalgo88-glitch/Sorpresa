// Visor 3D (three.js): cama de 225×225, volumen de 280 mm y la pieza coloreada por zonas.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FACE } from './analyzer.js';

const COLORS = {
  [FACE.NORMAL]: [0.72, 0.75, 0.78],
  [FACE.BED]: [0.18, 0.62, 0.48],
  [FACE.NEAR]: [0.88, 0.63, 0.19],
  [FACE.OVERHANG]: [0.84, 0.29, 0.2],
  [FACE.BRIDGE]: [0.35, 0.42, 0.84],
  [FACE.THIN]: [0.77, 0.27, 0.61],
};

export function createViewer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 5000);
  camera.up.set(0, 0, 1);
  camera.position.set(260, -300, 240);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 40);
  controls.enableDamping = true;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1));
  const dir = new THREE.DirectionalLight(0xffffff, 1.4);
  dir.position.set(150, -200, 400); scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dir2.position.set(-200, 200, 100); scene.add(dir2);

  // Cama PEI
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(225, 225), new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.9, metalness: 0.1 }));
  bed.position.z = -0.05; scene.add(bed);
  const grid = new THREE.GridHelper(225, 9, 0x6b5320, 0x8a6d32);
  grid.rotation.x = Math.PI / 2; grid.position.z = 0.02; scene.add(grid);
  // Volumen útil
  const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(225, 225, 280)), new THREE.LineBasicMaterial({ color: 0x8892a0, transparent: true, opacity: 0.5 }));
  box.position.z = 140; scene.add(box);
  // Origen (esquina frontal izquierda, X+ derecha, Y+ fondo)
  const axes = new THREE.AxesHelper(25); axes.position.set(-112.5, -112.5, 0.1); scene.add(axes);

  let mesh = null;

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  (function loop() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();

  function show(pos, faceClass, dims) {
    if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const F = pos.length / 9;
    const col = new Float32Array(F * 9);
    for (let f = 0; f < F; f++) {
      const c = COLORS[faceClass ? faceClass[f] : 0] || COLORS[0];
      for (let k = 0; k < 3; k++) col.set(c, f * 9 + k * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05, flatShading: true, side: THREE.DoubleSide }));
    scene.add(mesh);
    const size = Math.max(dims[0], dims[1], dims[2], 30);
    controls.target.set(0, 0, dims[2] / 2);
    const d = size * 2.1 + 60;
    camera.position.set(d * 0.62, -d * 0.78, dims[2] / 2 + d * 0.55);
  }

  function showBox(dims) {
    // Modo foto: caja con las medidas indicadas
    if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); }
    const g = new THREE.BoxGeometry(dims[0], dims[1], dims[2]);
    mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x9aa4ae, transparent: true, opacity: 0.55 }));
    mesh.position.z = dims[2] / 2; scene.add(mesh);
    const size = Math.max(...dims, 30), d = size * 2.1 + 60;
    controls.target.set(0, 0, dims[2] / 2);
    camera.position.set(d * 0.62, -d * 0.78, dims[2] / 2 + d * 0.55);
  }

  return { show, showBox };
}
