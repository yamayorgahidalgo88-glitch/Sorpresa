// Probador 3D: una cabeza escaneada (Lee Perry-Smith, CC BY 3.0) con el pelo de
// cada corte generado por capas. Cada capa es una copia de la cabeza un poco más
// hinchada; un patrón de mechones descarta píxeles para que se vean pelos
// sueltos, y la piel del cuero cabelludo se oscurece donde hay pelo, de modo que
// los degradados se ven de verdad: de piel a pelo, sin cortes.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MODEL_URL = 'assets/models/head.glb';

// ---------- Estilos ----------
// Longitudes en unidades del modelo (la cabeza mide ~4,5 de alto).
// flow: hacia dónde se peina cada zona (se curva más en las puntas).
export const HAIR_STYLES = {
  'crop-alto': { top: 0.42, front: 0.48, sides: 0.3, back: 0.26, fade: 'high', messy: 0.7, flow: { front: [0, -0.35, 0.9], top: [0, 0.15, 0.25] } },
  'french-crop': { top: 0.42, front: 0.55, sides: 0.22, back: 0.22, fade: 'low', messy: 0.3, flow: { front: [0, -0.7, 1.15], top: [0, -0.1, 0.9] } },
  buzz: { top: 0.07, front: 0.07, sides: 0.06, back: 0.06, fade: 'none', messy: 0, flow: {} },
  tupe: { top: 0.7, front: 1.05, sides: 0.26, back: 0.24, fade: 'mid', messy: 0.12, flow: { front: [0, 0.85, -0.95], top: [0, 0.2, -1.1], sides: [0, -0.25, -0.8] } },
  pompadour: { top: 0.9, front: 1.3, sides: 0.22, back: 0.22, fade: 'mid', messy: 0.04, flow: { front: [0, 0.75, -1.3], top: [0, 0.15, -1.35], sides: [0, -0.3, -1] } },
  'raya-lado': { top: 0.72, front: 0.8, sides: 0.38, back: 0.34, fade: 'none', messy: 0.05, part: -0.55, flow: { top: 'part', front: 'part', sides: [0, -0.55, -0.45] } },
  'slick-back': { top: 0.8, front: 0.9, sides: 0.42, back: 0.4, fade: 'none', messy: 0.02, flow: { front: [0, 0.35, -1.2], top: [0, -0.1, -1.25], sides: [0, -0.4, -1], back: [0, -0.95, -0.2] } },
  'rizos-taper': { top: 0.8, front: 0.75, sides: 0.55, back: 0.5, fade: 'taper', curl: 1, messy: 0.4, flow: { top: [0, 0.5, 0], front: [0, 0.25, 0.4] } },
  mullet: { top: 0.55, front: 0.6, sides: 0.3, back: 2.2, fade: 'mid', messy: 0.35, mulletBack: true, flow: { front: [0, -0.4, 0.7], top: [0, -0.1, 0.45], back: [0, -1.5, -0.3] } },
  melena: { top: 1.0, front: 1.1, sides: 2.2, back: 2.4, fade: 'none', messy: 0.15, part: 0.0, flow: { top: 'part', front: 'partDown', sides: [0, -1.5, 0.05], back: [0, -1.55, -0.2] } },
  crew: { top: 0.2, front: 0.32, sides: 0.12, back: 0.12, fade: 'low', messy: 0.1, flow: { front: [0, 0.45, 0.15] } },
  flequillo: { top: 0.72, front: 0.9, sides: 0.42, back: 0.38, fade: 'none', messy: 0.75, flow: { front: [0, -0.85, 1.0], top: [0, -0.25, 0.95], sides: [0, -0.65, 0.2] } },
};

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Altura del nacimiento del pelo alrededor de la cabeza, según el ángulo
// (0 = frente, π = nuca). Incluye la patilla y el hueco de la oreja.
const HAIRLINE = [
  [0, 2.95], [0.6, 2.88], [0.95, 2.55], [1.12, 1.5], [1.3, 1.45], [1.43, 2.08],
  [1.95, 2.08], [2.3, 0.95], [2.6, 0.55], [Math.PI + 0.01, 0.55],
];
function hairline(a) {
  for (let i = 1; i < HAIRLINE.length; i++) {
    const [a1, h1] = HAIRLINE[i];
    if (a <= a1) {
      const [a0, h0] = HAIRLINE[i - 1];
      const t = (a - a0) / (a1 - a0);
      const s = t * t * (3 - 2 * t);
      return h0 + (h1 - h0) * s;
    }
  }
  return 0.55;
}

function fadeFactor(type, y, line) {
  switch (type) {
    case 'low': return smooth(0.55, 1.9, y);
    case 'mid': return smooth(1.7, 2.85, y);
    case 'high': return smooth(2.35, 3.3, y);
    case 'taper': return smooth(line, line + 0.55, y);
    default: return smooth(line, line + 0.22, y);
  }
}

// Ruido estable por vértice
const rand = (i, k) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

function computeHair(info, style, outLen, outFlow, outShade) {
  const { pos, count } = info;
  for (let i = 0; i < count; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const zc = z - 0.05;
    const ang = Math.abs(Math.atan2(x, zc));
    const line = hairline(ang) + 0.05 * Math.sin(ang * 9 + 1.3) + 0.025 * Math.sin(ang * 23);
    const mask = smooth(line - 0.06, line + 0.32, y) * (y > -0.2 ? 1 : 0);
    if (mask <= 0) {
      outLen[i] = 0; outShade[i] = 0;
      outFlow[i * 3] = outFlow[i * 3 + 1] = outFlow[i * 3 + 2] = 0;
      continue;
    }
    const topness = smooth(2.85, 3.35, y);
    let side = smooth(0.75, 1.05, ang) * (1 - smooth(2.0, 2.4, ang));
    let back = smooth(2.0, 2.4, ang);
    side *= 1 - topness;
    back *= 1 - topness;
    const top = Math.max(0, 1 - side - back);
    const frontness = smooth(0.4, 1.7, zc) * top;

    const f = fadeFactor(style.fade, y, line);
    const Ltop = style.top + (style.front - style.top) * smooth(0.4, 1.7, zc);
    let Lback = style.back * f;
    if (style.mulletBack) Lback = style.back * smooth(0.55, 1.6, y) * (ang > 2.3 ? 1 : 0.2) + style.sides * f * (ang > 2.3 ? 0 : 1);
    let L = top * Ltop + side * style.sides * f + back * Lback;

    // raya: un surco sin pelo en la parte de arriba
    if (style.part !== undefined && style.part !== null && y > 2.7 && zc > -1.2) {
      const d = Math.abs(x - style.part);
      L *= 0.15 + 0.85 * smooth(0.025, 0.09, d);
    }
    // textura: unas zonas un poco más largas que otras
    if (style.messy) L *= 1 + (rand(i, 1) - 0.5) * 0.7 * style.messy;
    if (style.curl) L *= 0.85 + rand(i, 2) * 0.35;
    L *= mask;
    outLen[i] = Math.max(0, L);
    outShade[i] = mask * Math.min(1, L / 0.05);

    // dirección del peinado
    const fl = style.flow || {};
    const pick = (zone) => {
      const v = fl[zone];
      if (!v) return [0, 0, 0];
      if (v === 'part') return [Math.sign(x - (style.part || 0)) || 1, -0.35, 0.15].map((n) => n * 0.95);
      if (v === 'partDown') return [(Math.sign(x - (style.part || 0)) || 1) * 1.2, -0.55, -0.35];
      return v;
    };
    const fFront = pick('front'), fTop = pick('top'), fSide = pick('sides'), fBack = pick('back');
    let bx = 0, by = 0, bz = 0;
    const wf = frontness, wt = top - frontness;
    for (const [w, v] of [[wf, fFront], [wt, fTop], [side, fSide], [back, fBack]]) {
      bx += w * v[0]; by += w * v[1]; bz += w * v[2];
    }
    if (style.curl) {
      bx += (rand(i, 3) - 0.5) * 0.6;
      by += (rand(i, 4) - 0.2) * 0.55;
      bz += (rand(i, 5) - 0.5) * 0.6;
    } else if (style.messy) {
      bx += (rand(i, 3) - 0.5) * 0.5 * style.messy;
      bz += (rand(i, 5) - 0.5) * 0.5 * style.messy;
    }
    outFlow[i * 3] = bx;
    outFlow[i * 3 + 1] = by;
    outFlow[i * 3 + 2] = bz;
  }
}

// ---------- Visor ----------
export async function createHeadViewer(canvas, { layers, interactive = true, reduceMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  // Estudio: tiras de luz para reflejos limpios
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x0a0907);
  const strip = (w, h, c, k, p, r) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...p); m.rotation.set(...r); studio.add(m);
  };
  strip(12, 3, 0xffffff, 3, [0, 8, 3], [Math.PI / 2, 0, 0]);
  strip(3, 10, 0xfff0d8, 2.2, [-8, 2, 4], [0, Math.PI / 2, 0]);
  strip(2, 10, 0xe2b45e, 2.4, [8, 2, -4], [0, -Math.PI / 2, 0]);
  strip(10, 8, 0xffffff, 0.9, [0, 2, 12], [0, Math.PI, 0]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio, 0.03).texture;

  const key = new THREE.DirectionalLight(0xfff0dc, 2.4);
  key.position.set(4, 7, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe0ae58, 2.1);
  rim.position.set(-6, 4, -7);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8c7a66, 0.8);
  fill.position.set(-6, 0, 6);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 2.3, 0.1);
  camera.position.set(7.0, 3.7, 12.6);

  const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
  const src = gltf.scene.getObjectByProperty('type', 'Mesh');
  const geo = src.geometry;
  const count = geo.attributes.position.count;
  const info = { pos: geo.attributes.position.array, count };

  const lenArr = new Float32Array(count);
  const flowArr = new Float32Array(count * 3);
  const shadeArr = new Float32Array(count);
  geo.setAttribute('hairLen', new THREE.BufferAttribute(lenArr, 1));
  geo.setAttribute('hairFlow', new THREE.BufferAttribute(flowArr, 3));
  geo.setAttribute('hairShade', new THREE.BufferAttribute(shadeArr, 1));

  const ROOT = new THREE.Color(0x0f0a07);
  const TIP = new THREE.Color(0x3a291c);

  // Piel: cerámica cálida, el cuero cabelludo se oscurece donde hay pelo
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xc7a586, roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.6, envMapIntensity: 0.8 });
  skin.onBeforeCompile = (sh) => {
    sh.uniforms.uRoot = { value: ROOT };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float hairShade;\nvarying float vShade;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvShade = hairShade;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRoot;\nvarying float vShade;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, uRoot * 1.4, clamp(vShade, 0.0, 1.0) * 0.9);');
  };
  const head = new THREE.Mesh(geo, skin);
  scene.add(head);

  // Pelo: capas instanciadas
  const N = layers || (window.innerWidth < 760 ? 30 : 44);
  const hair = new THREE.MeshStandardMaterial({ color: 0x221710, roughness: 0.72, metalness: 0, envMapIntensity: 0.35 });
  const uniforms = { uLayers: { value: N }, uRoot: { value: ROOT }, uTip: { value: TIP }, uDensity: { value: 30 }, uCurl: { value: 0 } };
  hair.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float hairLen;
        attribute vec3 hairFlow;
        uniform float uLayers;
        varying float vH;
        varying float vLen;
        varying vec3 vBase;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float hh = (float(gl_InstanceID) + 1.0) / uLayers;
        vH = hh; vLen = hairLen; vBase = position;
        transformed += normal * hh * hairLen + hairFlow * hh * hh * hairLen;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uRoot;
        uniform vec3 uTip;
        uniform float uDensity;
        uniform float uCurl;
        varying float vH;
        varying float vLen;
        varying vec3 vBase;
        float hash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }`)
      .replace('void main() {', `void main() {
        if (vLen < 0.004) discard;
        vec3 cell = vBase * uDensity * (1.0 - 0.45 * uCurl);
        vec3 id = floor(cell);
        vec3 fr = fract(cell) - 0.5;
        float rnd = hash3(id);
        float thick = mix(0.66, 0.32, vH * vH) * (0.75 + 0.25 * rnd) + 0.12 * uCurl;
        if (length(fr) > thick) discard;
        if (vH > 0.72 + 0.28 * rnd) discard;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb = mix(uRoot, uTip, vH) * (0.75 + 0.5 * rnd);`);
  };
  const shells = new THREE.InstancedMesh(geo, hair, N);
  const ident = new THREE.Matrix4();
  for (let i = 0; i < N; i++) shells.setMatrixAt(i, ident);
  shells.frustumCulled = false;
  scene.add(shells);

  // ---------- Controles ----------
  let controls = null;
  if (interactive) {
    controls = new OrbitControls(camera, canvas);
    controls.target.copy(target);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 1.1;
    controls.addEventListener('start', () => { controls.autoRotate = false; });
  }
  camera.lookAt(target);

  // ---------- Transición entre cortes ----------
  const cur = { len: lenArr, flow: flowArr, shade: shadeArr };
  const from = { len: new Float32Array(count), flow: new Float32Array(count * 3), shade: new Float32Array(count) };
  const to = { len: new Float32Array(count), flow: new Float32Array(count * 3), shade: new Float32Array(count) };
  let anim = null;
  let curlFrom = 0, curlTo = 0, densTo = 40;
  const densityFor = (st) => (Math.max(st.top, st.front) > 1 ? 24 : Math.max(st.top, st.front) > 0.5 ? 32 : 46);

  function applyStyle(id, { instant = false } = {}) {
    const style = HAIR_STYLES[id] || HAIR_STYLES.buzz;
    computeHair(info, style, to.len, to.flow, to.shade);
    curlFrom = uniforms.uCurl.value;
    curlTo = style.curl ? 1 : 0;
    densTo = densityFor(style);
    if (instant || reduceMotion) {
      cur.len.set(to.len); cur.flow.set(to.flow); cur.shade.set(to.shade);
      uniforms.uCurl.value = curlTo;
      uniforms.uDensity.value = densTo;
      markDirty();
      anim = null;
      return;
    }
    from.len.set(cur.len); from.flow.set(cur.flow); from.shade.set(cur.shade);
    anim = { start: performance.now(), dur: 750 };
  }
  function markDirty() {
    geo.attributes.hairLen.needsUpdate = true;
    geo.attributes.hairFlow.needsUpdate = true;
    geo.attributes.hairShade.needsUpdate = true;
  }
  function stepAnim(now) {
    if (!anim) return;
    const t = Math.min(1, (now - anim.start) / anim.dur);
    // el pelo se recoge y vuelve a crecer con la forma nueva
    const e = t < 0.5 ? 1 - (t / 0.5) * 0.85 : 0.15 + 0.85 * (1 - Math.pow(1 - (t - 0.5) / 0.5, 3));
    const mix = t < 0.5 ? 0 : 1;
    const A = mix ? to : from;
    for (let i = 0; i < count; i++) {
      cur.len[i] = A.len[i] * e;
      cur.shade[i] = from.shade[i] + (to.shade[i] - from.shade[i]) * Math.min(1, t * 1.3);
    }
    cur.flow.set(A.flow);
    uniforms.uCurl.value = mix ? curlTo : curlFrom;
    if (mix) uniforms.uDensity.value = densTo;
    markDirty();
    if (t >= 1) {
      cur.len.set(to.len);
      anim = null;
    }
  }

  // ---------- Bucle ----------
  let w = 0, h = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    w = r.width; h = r.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // en pantallas estrechas se abre el plano para que quepa todo el peinado
    camera.fov = camera.aspect < 1.2 ? 33 : 28;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let running = false, raf = 0, visible = true;
  const loop = (now) => {
    stepAnim(now);
    controls?.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  const play = () => { if (!running && visible) { running = true; raf = requestAnimationFrame(loop); } };
  const pause = () => { running = false; cancelAnimationFrame(raf); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : pause(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));

  // Foto fija de un corte, para las miniaturas de la lista
  function snapshot(id, size = 240) {
    const saved = { len: cur.len.slice(), flow: cur.flow.slice(), shade: cur.shade.slice(), curl: uniforms.uCurl.value, dens: uniforms.uDensity.value };
    const camPos = camera.position.clone();
    const style = HAIR_STYLES[id];
    computeHair(info, style, cur.len, cur.flow, cur.shade);
    uniforms.uCurl.value = style.curl ? 1 : 0;
    uniforms.uDensity.value = densityFor(style);
    markDirty();
    camera.position.set(6.6, 3.6, 11.6);
    camera.lookAt(target);
    renderer.render(scene, camera);
    const out = document.createElement('canvas');
    out.width = out.height = size;
    const ctx = out.getContext('2d');
    const s = Math.min(canvas.width, canvas.height);
    ctx.drawImage(canvas, (canvas.width - s) / 2, (canvas.height - s) / 2, s, s, 0, 0, size, size);
    cur.len.set(saved.len); cur.flow.set(saved.flow); cur.shade.set(saved.shade);
    uniforms.uCurl.value = saved.curl;
    uniforms.uDensity.value = saved.dens;
    markDirty();
    camera.position.copy(camPos);
    camera.lookAt(target);
    return out.toDataURL('image/webp', 0.86);
  }

  play();
  return { setStyle: applyStyle, snapshot, play, pause, renderer };
}
