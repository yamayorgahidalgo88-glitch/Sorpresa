// Modelos 3D de las criaturas, construidos pieza a pieza siguiendo las láminas
// de diseño, con sus animaciones (reposo, andar, atacar, súper, celebrar).
// Todas miran hacia +Z, con los pies en y = 0. Unidad = 1 casilla del tablero.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const V3 = THREE.Vector3, PI = Math.PI, D = PI / 180;
const sstep = x => x * x * (3 - 2 * x);
function kf(a, keys) {
  if (a <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (a <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
    return v0 + (v1 - v0) * sstep((a - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
}

/* ---------------- geometrías auxiliares ---------------- */
const SPH = new THREE.SphereGeometry(1, 32, 22);
const ICO = new THREE.IcosahedronGeometry(1, 0);
const DODE = new THREE.DodecahedronGeometry(1, 0);
const OCTA = new THREE.OctahedronGeometry(1, 0);
const cyl = (r, h, seg = 24, r2 = r) => new THREE.CylinderGeometry(r2, r, h, seg);
const torus = (r, t, arc = PI * 2, seg = 40) => new THREE.TorusGeometry(r, t, 10, seg, arc);

// tubo de radio variable a lo largo de una curva (cuernos, bigote, sombrero…)
function sweep(pts, radii, radial = 14, segs = 30) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new V3(...p)));
  const n = radii.length - 1, pos = [], uv = [], idx = [];
  const N = new V3(), B = new V3(); let prevT = null;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, P = curve.getPoint(u), T = curve.getTangent(u).normalize();
    if (!prevT) { N.set(1, 0, 0); if (Math.abs(T.x) > 0.9) N.set(0, 0, 1); }
    else { const ax = new V3().crossVectors(prevT, T), l = ax.length(); if (l > 1e-6) N.applyAxisAngle(ax.normalize(), Math.asin(Math.min(1, l))); }
    N.sub(T.clone().multiplyScalar(N.dot(T))).normalize(); B.crossVectors(T, N); prevT = T.clone();
    const f = u * n, k = Math.min(n - 1, Math.floor(f)), r = radii[k] + (radii[k + 1] - radii[k]) * (f - k);
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r;
      pos.push(P.x + N.x * c + B.x * s, P.y + N.y * c + B.y * s, P.z + N.z * c + B.z * s); uv.push(j / radial, u);
    }
  }
  const W = radial + 1;
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * W + j, b = a + 1, c = a + W, d = c + 1; idx.push(a, b, c, b, d, c);
  }
  const p0 = curve.getPoint(0), p1 = curve.getPoint(1), c0 = pos.length / 3;
  pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z); uv.push(.5, 0, .5, 1);
  for (let j = 0; j < radial; j++) { idx.push(c0, j + 1, j); idx.push(c0 + 1, segs * W + j, segs * W + j + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// superficie de revolución con perfil suavizado
function lathe(profile, seg = 36, phiStart = 0, phiLen = PI * 2, smooth = 20) {
  let pts = profile.map(p => new THREE.Vector2(p[0], p[1]));
  if (smooth) pts = new THREE.SplineCurve(pts).getPoints(smooth);
  return new THREE.LatheGeometry(pts, seg, phiStart, phiLen);
}
// ojo enfadado (forma de almendra inclinada). side = +1 ojo en x>0, -1 en x<0
function eyeGeo(side, k = 1) {
  const s = new THREE.Shape(), X = x => x * side * k, Y = y => y * k;
  s.moveTo(X(-0.1), Y(-0.03)); s.lineTo(X(0.1), Y(0.065));
  s.quadraticCurveTo(X(0.13), Y(-0.02), X(0.05), Y(-0.07));
  s.quadraticCurveTo(X(-0.04), Y(-0.09), X(-0.1), Y(-0.03));
  return new THREE.ShapeGeometry(s, 10);
}
// punto y orientación sobre un elipsoide (phi: giro desde el frente, beta: elevación)
function onEllipsoid(c, r, phiDeg, betaDeg, out = 1, spin = 0) {
  const ph = phiDeg * D, be = betaDeg * D;
  const d = new V3(Math.sin(ph) * Math.cos(be), Math.sin(be), Math.cos(ph) * Math.cos(be));
  const p = new V3(c[0] + d.x * r[0] * out, c[1] + d.y * r[1] * out, c[2] + d.z * r[2] * out);
  const nrm = new V3(d.x / r[0], d.y / r[1], d.z / r[2]).normalize();
  const m = new THREE.Matrix4().lookAt(nrm, new V3(), new V3(0, 1, 0));
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  if (spin) q.multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), spin));
  return { p: [p.x, p.y, p.z], q };
}

/* ---------------- texturas ---------------- */
let _glow, _stars, _ring;
function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(.6, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  _glow = new THREE.CanvasTexture(c); _glow.colorSpace = THREE.SRGBColorSpace; return _glow;
}
function ringTex() {
  if (_ring) return _ring;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,.0)'); g.addColorStop(.45, 'rgba(255,255,255,.35)'); g.addColorStop(.62, 'rgba(255,255,255,.9)'); g.addColorStop(.75, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  _ring = new THREE.CanvasTexture(c); _ring.colorSpace = THREE.SRGBColorSpace; return _ring;
}
function starsTex() {
  if (_stars) return _stars;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#7a3cc0'); g.addColorStop(1, '#5d2a9c');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  const star = (cx, cy, R, rot) => {
    x.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * PI / 5, r = i % 2 ? R * 0.46 : R; x.lineTo(cx + Math.sin(a) * r * 0.62, cy - Math.cos(a) * r); }
    x.closePath(); x.fillStyle = '#ffb829'; x.fill(); x.lineJoin = 'round'; x.lineWidth = R * 0.18; x.strokeStyle = '#ffb829'; x.stroke();
  };
  const S = [[60, 90, 46, .2], [250, 200, 62, -.2], [430, 70, 40, .4], [520, 300, 70, 0], [700, 130, 52, -.3], [860, 260, 60, .25], [960, 60, 36, 0], [130, 330, 50, .3], [350, 420, 44, -.4], [700, 430, 48, .1], [900, 440, 40, -.2], [30, 470, 34, 0]];
  for (const [a, b, R, r] of S) { star(a, b, R, r); if (a < 80) star(a + 1024, b, R, r); if (a > 944) star(a - 1024, b, R, r); }
  _stars = new THREE.CanvasTexture(c); _stars.colorSpace = THREE.SRGBColorSpace; _stars.wrapS = THREE.RepeatWrapping; _stars.anisotropy = 4;
  return _stars;
}

/* ---------------- plano de construcción (blueprint) ---------------- */
class Blueprint {
  constructor() { this.groups = { root: { parent: null, abs: [0, 0, 0], rot: [0, 0, 0] } }; this.parts = []; this.sprites = []; }
  group(name, parent, abs = [0, 0, 0], rot = [0, 0, 0]) { this.groups[name] = { parent, abs, rot }; return this; }
  add(group, mat, geom, o = {}) {
    let g = geom.clone(); if (g.index) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (o.flat || !g.attributes.normal) g.computeVertexNormals();
    const ab = this.groups[group].abs, p = o.p || [0, 0, 0];
    const pos = o.local ? new V3(...p) : new V3(p[0] - ab[0], p[1] - ab[1], p[2] - ab[2]);
    const q = o.q ? o.q.clone() : new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.r || [0, 0, 0])));
    const s = o.s == null ? [1, 1, 1] : typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s;
    g.applyMatrix4(new THREE.Matrix4().compose(pos, q, new V3(...s)));
    this.parts.push({ group, mat, g }); return this;
  }
  sprite(name, group, p, color, sx, sy, opacity = 0.6, local = false) { this.sprites.push({ name, group, p, color, sx, sy, opacity, local }); return this; }
  bake() {
    const by = {};
    for (const p of this.parts) (by[p.group + '|' + p.mat] ||= []).push(p.g);
    this.batches = Object.entries(by).map(([k, gs]) => { const [group, mat] = k.split('|'); return { group, mat, geometry: gs.length > 1 ? mergeGeometries(gs) : gs[0] }; });
    this.parts = null; return this;
  }
}
const std = (color, o = {}) => () => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });
const basic = (color, o = {}) => () => new THREE.MeshBasicMaterial({ color, ...o });
const gold = () => new THREE.MeshStandardMaterial({ color: 0xffb21f, roughness: 0.32, metalness: 0.35, emissive: 0x4a2a00 });

/* =====================================================================
   BOLAB — sapo de lava
   ===================================================================== */
function buildBolab() {
  const b = new Blueprint(), C = [0, 0.4, 0], R = [0.45, 0.37, 0.43];
  b.group('all', 'root').group('body', 'all', [0, 0.04, 0]).group('horn', 'body', [0, 0.72, -0.02])
    .group('footFL', 'all', [0.2, 0.05, 0.36]).group('footFR', 'all', [-0.2, 0.05, 0.36])
    .group('footBL', 'all', [0.4, 0.05, 0.14]).group('footBR', 'all', [-0.4, 0.05, 0.14])
    .group('flameL', 'all', [0.33, 0.9, 0.06]).group('flameR', 'all', [-0.35, 0.86, 0.02]);
  b.add('body', 'skin', SPH, { p: C, s: R });
  b.add('body', 'belly', SPH, { p: [0, 0.2, -0.03], s: [0.37, 0.19, 0.36] });
  for (const s of [1, -1]) {
    b.add('body', 'skin', SPH, { p: [s * 0.37, 0.25, -0.07], s: [0.17, 0.215, 0.25] });
    const fb = s > 0 ? 'footBL' : 'footBR', ff = s > 0 ? 'footFL' : 'footFR';
    b.add(fb, 'skin', SPH, { p: [s * 0.4, 0.055, 0.14], s: [0.115, 0.058, 0.15] });
    b.add(ff, 'skin', SPH, { p: [s * 0.2, 0.055, 0.36], s: [0.095, 0.055, 0.11] });
    for (const t of [-1, 0, 1]) {
      b.add(fb, 'skinLight', SPH, { p: [s * 0.4 + t * 0.068, 0.045, 0.27 - Math.abs(t) * 0.02], s: [0.046, 0.04, 0.05] });
      b.add(ff, 'skinLight', SPH, { p: [s * 0.2 + t * 0.058, 0.042, 0.45 - Math.abs(t) * 0.018], s: [0.04, 0.036, 0.044] });
    }
  }
  // lava bajo las placas de roca
  const lava = new THREE.SphereGeometry(1, 40, 14, PI / 2 - 1.95, 3.9, 1.3, 1.12);
  b.add('body', 'lava', lava, { p: C, s: [R[0] * 1.035, R[1] * 1.035, R[2] * 1.035] });
  // placas hexagonales de roca en dos filas encajadas
  const HEX = new THREE.CylinderGeometry(0.72, 1, 1, 6); HEX.rotateX(PI / 2);
  [-84, -42, 0, 42, 84].forEach((ph, i) => b.add('body', i % 2 ? 'rock' : 'rockLight', HEX, { ...onEllipsoid(C, R, ph, 2, 1.05), s: [0.184, 0.152, 0.085], flat: true }));
  [-63, -21, 21, 63].forEach((ph, i) => b.add('body', i % 2 ? 'rockLight' : 'rock', HEX, { ...onEllipsoid(C, R, ph, -34, 1.045), s: [0.158, 0.138, 0.08], flat: true }));
  // ojos
  for (const s of [1, -1]) {
    b.add('body', 'eyeLine', eyeGeo(s, 1.5), onEllipsoid(C, R, s * 25, 31, 1.035));
    b.add('body', 'eye', eyeGeo(s, 1.2), onEllipsoid(C, R, s * 25, 31, 1.06));
    const e = onEllipsoid(C, R, s * 25, 31, 1.1); b.sprite('eye' + (s > 0 ? 'L' : 'R'), 'body', e.p, 0xffd628, 0.3, 0.2, 0.4);
  }
  // cuerno y rocas
  b.add('horn', 'rock', new THREE.ConeGeometry(0.165, 0.46, 6), { p: [0, 0.92, -0.04], r: [-0.22, 0.3, 0.04], flat: true });
  b.add('horn', 'rockLight', new THREE.ConeGeometry(0.1, 0.24, 5), { p: [0.06, 0.82, 0.05], r: [0.1, 0.7, -0.3], flat: true });
  [[75, 58, .05], [-70, 60, .045], [140, 62, .04]].forEach(([ph, be, s], i) =>
    b.add('body', 'rock', ICO, { ...onEllipsoid(C, R, ph, be, 1.0, i), s: [s, s * .7, s * .4], flat: true }));
  [[150, 30, .075], [-150, 34, .07], [178, 12, .06], [118, 8, .055], [-122, 12, .06], [-170, 52, .05], [160, -8, .045], [100, 38, .045]].forEach(([ph, be, s], i) =>
    b.add('body', i % 2 ? 'rock' : 'rockLight', DODE, { ...onEllipsoid(C, R, ph, be, 0.995, i * 1.3), s: [s, s * .8, s * .3], flat: true }));
  // llamitas
  for (const [gname, p] of [['flameL', [0.33, 0.9, 0.06]], ['flameR', [-0.35, 0.86, 0.02]]]) {
    b.add(gname, 'flame', SPH, { p, s: [0.032, 0.034, 0.032] });
    b.add(gname, 'flame', new THREE.ConeGeometry(0.027, 0.07, 10), { p: [p[0], p[1] + 0.045, p[2]] });
    b.add(gname, 'flameCore', SPH, { p: [p[0], p[1] - 0.004, p[2] + 0.012], s: 0.017 });
    b.sprite(gname, gname, p, 0xff9a1e, 0.22, 0.22, 0.6);
  }
  b.mats = {
    skin: std(0xf78320, { roughness: 0.5 }), skinLight: std(0xffa040, { roughness: 0.5 }), belly: std(0xf9d19a, { roughness: 0.6 }),
    rock: std(0x5f4456, { roughness: 0.9 }), rockLight: std(0x7c5a6a, { roughness: 0.9 }),
    lava: basic(0xffb01f), eye: basic(0xffee3a, { side: THREE.DoubleSide }), eyeLine: basic(0x8a3a08, { side: THREE.DoubleSide }),
    flame: basic(0xffa51e), flameCore: basic(0xfff09a),
  };
  b.height = 1.16; b.durations = { attack: 0.55, super: 0.8 };
  b.animate = (rig, t, st) => {
    const g = rig.g, w = st.walk, ph = rig.walkT * 2 * PI / 0.46, sn = Math.sin(ph);
    let hop = Math.max(0, sn) * 0.17 * w, sq = sn < 0 ? -0.13 * -sn * w : 0.07 * sn * w;
    sq += Math.sin(t * 2.2) * 0.022 * (1 - w);
    let lean = 0, fwd = 0;
    if (st.atk >= 0) {
      const a = st.atk;
      lean = kf(a, [[0, 0], [0.2, -0.3], [0.36, 0.55], [0.55, 0.3], [1, 0]]);
      fwd = kf(a, [[0, 0], [0.2, -0.06], [0.36, 0.2], [1, 0]]);
      sq += kf(a, [[0, 0], [0.2, -0.12], [0.36, 0.12], [0.6, -0.05], [1, 0]]);
      hop += kf(a, [[0, 0], [0.3, 0.07], [0.5, 0], [1, 0]]);
    }
    if (st.cheer > 0) { const c = Math.abs(Math.sin(t * 8)); hop += c * 0.18; sq += c * 0.06 - 0.03; }
    g.all.position.set(0, hop, fwd);
    g.body.scale.set(1 - sq * 0.55, 1 + sq, 1 - sq * 0.55);
    g.body.rotation.x = lean;
    g.horn.rotation.x = -lean * 0.25 + Math.sin(t * 2.2 + 1) * 0.02;
    const tuck = hop * 2.2;
    for (const f of [g.footBL, g.footBR]) { f.position.y = f.userData.py - hop * 0.35; f.rotation.x = tuck * 0.9; }
    for (const f of [g.footFL, g.footFR]) { f.position.y = f.userData.py - hop * 0.15; f.rotation.x = -tuck * 0.6 + (st.atk >= 0 ? -lean * 0.3 : 0); }
    const fl = 1 + Math.sin(t * 13) * 0.12 + Math.sin(t * 23.7) * 0.08;
    g.flameL.position.y = g.flameL.userData.py + Math.sin(t * 3) * 0.025; g.flameL.scale.set(1, fl, 1);
    g.flameR.position.y = g.flameR.userData.py + Math.sin(t * 3 + 2) * 0.025; g.flameR.scale.set(1, 2 - fl, 1);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3), hot = st.atk >= 0 ? kf(st.atk, [[0, 0], [0.36, 1], [1, 0]]) : 0;
    rig.mats.lava.color.setRGB(1, 0.6 + 0.14 * pulse + 0.2 * hot, 0.1 + 0.08 * pulse + 0.4 * hot, THREE.SRGBColorSpace);
    rig.sp.eyeL.material.opacity = rig.sp.eyeR.material.opacity = 0.45 + 0.15 * pulse + 0.4 * hot;
  };
  return b.bake();
}

/* =====================================================================
   OGUL — mago de un solo ojo
   ===================================================================== */
function buildOgul() {
  const b = new Blueprint();
  b.group('all', 'root').group('robe', 'all', [0, 0.72, 0]).group('orb', 'all', [0, 0.2, 0]).group('halo', 'all', [0, 0.035, 0])
    .group('head', 'all', [0, 0.7, 0]).group('hat', 'head', [0, 0.9, 0]).group('eye', 'head', [0, 0.79, 0.29])
    .group('sleeveL', 'all', [0.2, 0.63, 0.02], [-0.3, 0, 1.2]).group('sleeveR', 'all', [-0.2, 0.63, 0.02], [-0.3, 0, -1.2]);
  // túnica
  b.add('robe', 'cloth', lathe([[0.3, 0.25], [0.345, 0.3], [0.33, 0.42], [0.27, 0.56], [0.215, 0.68], [0.17, 0.75]]));
  b.add('robe', 'gold', torus(0.325, 0.042), { p: [0, 0.272, 0], r: [PI / 2, 0, 0] });
  b.add('robe', 'dark', new THREE.CircleGeometry(0.31, 28), { p: [0, 0.27, 0], r: [PI / 2, 0, 0] });
  b.add('robe', 'gold', sweep([[0, 0.7, 0.205], [0, 0.56, 0.272], [0, 0.42, 0.332], [0, 0.31, 0.352]], [0.024, 0.024, 0.024, 0.024], 8, 14));
  for (const [y, z] of [[0.575, 0.285], [0.445, 0.34]]) {
    b.add('robe', 'gold', torus(0.058, 0.018, PI * 2, 24), { p: [0, y, z], r: [-0.42, 0, 0], s: [1.3, 0.72, 1] });
    b.add('robe', 'gold', SPH, { p: [0, y, z + 0.004], s: 0.026 });
  }
  // orbe y halo
  b.add('orb', 'orb', SPH, { p: [0, 0.2, 0], s: [0.2, 0.17, 0.2] });
  b.add('halo', 'halo', torus(0.215, 0.013), { p: [0, 0.035, 0], r: [PI / 2, 0, 0] });
  b.add('halo', 'halo', torus(0.13, 0.008), { p: [0, 0.03, 0], r: [PI / 2, 0, 0] });
  b.add('halo', 'haloGlow', new THREE.CircleGeometry(0.42, 32), { p: [0, 0.03, 0], r: [-PI / 2, 0, 0] });
  // capucha, ala dorada, cuello
  b.add('head', 'cloth', SPH, { p: [0, 0.81, 0], s: [0.268, 0.25, 0.268] });
  b.add('head', 'gold', torus(0.283, 0.052), { p: [0, 0.875, 0.005], r: [PI / 2 - 0.3, 0, 0] });
  b.add('head', 'gold', torus(0.2, 0.044), { p: [0, 0.69, 0.02], r: [PI / 2 + 0.22, 0, 0] });
  b.add('head', 'dark', SPH, { p: [0, 0.79, 0.095], s: [0.2, 0.2, 0.195] });
  // ojo mecánico
  b.add('head', 'metal', cyl(0.118, 0.07, 28), { p: [0, 0.79, 0.262], r: [PI / 2, 0, 0] });
  b.add('head', 'metalDark', cyl(0.092, 0.075, 28), { p: [0, 0.79, 0.266], r: [PI / 2, 0, 0] });
  for (const s of [1, -1]) b.add('head', 'metal', cyl(0.034, 0.07, 14), { p: [s * 0.135, 0.79, 0.235], r: [0, 0, PI / 2] });
  b.add('eye', 'eyeRed', SPH, { p: [0, 0.79, 0.29], s: [0.072, 0.072, 0.045] });
  b.add('eye', 'eyeDark', torus(0.038, 0.009, PI * 2, 24), { p: [0, 0.79, 0.325] });
  b.add('eye', 'eyeCore', SPH, { p: [0, 0.79, 0.332], s: [0.02, 0.02, 0.012] });
  b.sprite('eye', 'eye', [0, 0.79, 0.37], 0xff3020, 0.28, 0.28, 0.6);
  // sombrero
  b.add('hat', 'clothHat', sweep([[0, 0.85, 0], [0, 1.0, -0.005], [0.005, 1.14, -0.02], [0.02, 1.26, -0.06], [0.045, 1.345, -0.14], [0.065, 1.365, -0.235], [0.075, 1.325, -0.3], [0.075, 1.28, -0.315]], [0.292, 0.232, 0.178, 0.135, 0.108, 0.094, 0.078, 0.03], 22, 44));
  // mangas
  for (const s of [1, -1]) {
    const gname = s > 0 ? 'sleeveL' : 'sleeveR';
    b.add(gname, 'cloth', lathe([[0.085, 0.02], [0.115, -0.1], [0.165, -0.24], [0.182, -0.31]], 26), { local: true });
    b.add(gname, 'gold', torus(0.18, 0.036, PI * 2, 30), { local: true, p: [0, -0.31, 0], r: [PI / 2, 0, 0] });
    b.add(gname, 'dark', new THREE.CircleGeometry(0.165, 24), { local: true, p: [0, -0.3, 0], r: [PI / 2, 0, 0] });
  }
  const tex = starsTex;
  b.mats = {
    cloth: () => new THREE.MeshStandardMaterial({ map: tex(), roughness: 0.6, side: THREE.DoubleSide }),
    clothHat: () => { const t = tex().clone(); t.needsUpdate = true; t.repeat.set(2, 3); t.wrapT = THREE.RepeatWrapping; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide }); },
    gold, dark: std(0x1a0d28, { roughness: 0.9, side: THREE.DoubleSide }), orb: std(0x4a1a78, { roughness: 0.35, emissive: 0x2a0a4a }),
    metal: std(0xa4a4b2, { roughness: 0.35, metalness: 0.5 }), metalDark: std(0x4a4656, { roughness: 0.5, metalness: 0.3 }),
    eyeRed: basic(0xff2f26), eyeDark: basic(0xa30f0f), eyeCore: basic(0xffc9b8),
    halo: basic(0xffcf5a), haloGlow: () => new THREE.MeshBasicMaterial({ map: ringTex(), color: 0xffb040, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  };
  b.noShadow = ['haloGlow', 'halo'];
  b.height = 1.45; b.durations = { attack: 0.6, super: 0.9 };
  b.animate = (rig, t, st) => {
    const g = rig.g, w = st.walk;
    let lean = 0.22 * w, arm = 0, eye = 1 + Math.sin(t * 2.6) * 0.05, glow = 0.5 + 0.12 * Math.sin(t * 2.6), back = 0, bob = 0.06 + Math.sin(t * 1.9) * 0.04;
    const a = st.sup >= 0 ? st.sup : st.atk, big = st.sup >= 0 ? 1.6 : 1;
    if (a >= 0) {
      arm = kf(a, [[0, 0], [0.28, 1], [0.42, 0.35], [1, 0]]) * big;
      lean += kf(a, [[0, 0], [0.28, -0.22], [0.4, 0.3], [1, 0]]);
      eye = kf(a, [[0, 1], [0.28, 1.75 * big], [0.4, 0.8], [1, 1]]);
      glow = kf(a, [[0, 0.5], [0.28, 1], [0.45, 0.3], [1, 0.5]]);
      back = kf(a, [[0, 0], [0.28, 0], [0.36, -0.09], [1, 0]]);
      bob += kf(a, [[0, 0], [0.28, 0.07 * big], [1, 0]]);
    }
    if (st.cheer > 0) { bob += Math.abs(Math.sin(t * 7)) * 0.12; arm = Math.max(arm, 0.8 + Math.sin(t * 14) * 0.2); }
    g.all.position.set(0, bob, back); g.all.rotation.x = lean;
    g.robe.rotation.z = Math.sin(t * 1.9 + 1) * 0.035 + Math.sin(rig.walkT * 9) * 0.07 * w;
    g.robe.rotation.x = -lean * 0.5;
    g.orb.position.y = g.orb.userData.py + Math.sin(t * 1.9 - 0.8) * 0.012;
    g.head.rotation.z = Math.sin(t * 1.4) * 0.03; g.head.rotation.x = Math.sin(t * 1.1) * 0.02 - lean * 0.2;
    g.hat.rotation.x = Math.sin(t * 1.9 - 1.2) * 0.05 + lean * 0.5; g.hat.rotation.z = Math.sin(t * 1.5) * 0.04;
    g.eye.scale.setScalar(eye);
    const sp = rig.sp.eye; sp.material.opacity = glow; sp.scale.setScalar(0.26 * (0.6 + eye * 0.6));
    const sway = Math.sin(t * 1.9 + 0.5) * 0.07;
    g.sleeveL.rotation.set(-0.3 - arm * 0.9 + w * 0.5, 0, 1.2 + arm * 0.75 + sway);
    g.sleeveR.rotation.set(-0.3 - arm * 0.9 + w * 0.5, 0, -1.2 - arm * 0.75 - sway);
    const hp = 1 + Math.sin(t * 3.2) * 0.07 + (a >= 0 ? arm * 0.25 : 0);
    g.halo.scale.set(hp, 1, hp); g.halo.rotation.y = t * 0.8;
    g.halo.position.y = g.halo.userData.py - bob * 0.9;
    rig.mats.haloGlow.opacity = 0.55 + Math.sin(t * 3.2) * 0.15 + (a >= 0 ? arm * 0.3 : 0);
  };
  return b.bake();
}

/* =====================================================================
   BUSHI — samurái de la espada de jade
   ===================================================================== */
function buildBushi() {
  const b = new Blueprint(), F = [-0.17, -0.1, 0.2], HY = 0.07; // puño derecho (local al brazo)
  b.group('all', 'root').group('legL', 'all', [0.125, 0.23, 0]).group('legR', 'all', [-0.125, 0.23, 0])
    .group('torso', 'all', [0, 0.24, 0]).group('head', 'torso', [0, 0.53, 0])
    .group('armL', 'torso', [0.255, 0.5, 0]).group('armR', 'torso', [-0.255, 0.5, 0]).group('fx', 'all', [0, 0, 0]);
  for (const s of [1, -1]) {
    const L = s > 0 ? 'legL' : 'legR';
    b.add(L, 'armorDark', cyl(0.088, 0.16, 20), { local: true, p: [0, -0.07, 0] });
    b.add(L, 'gold', torus(0.09, 0.02, PI * 2, 24), { local: true, p: [0, -0.115, 0], r: [PI / 2, 0, 0] });
    b.add(L, 'boot', SPH, { local: true, p: [0, -0.17, 0.035], s: [0.105, 0.068, 0.145] });
    b.add(L, 'gold', torus(0.095, 0.014, PI, 16), { local: true, p: [0, -0.2, 0.05], r: [PI / 2 + 0.25, 0, 0], s: [1, 1.3, 1] });
  }
  // torso y faldón
  b.add('torso', 'armor', lathe([[0.29, 0.215], [0.275, 0.3], [0.21, 0.42], [0.195, 0.52], [0.1, 0.575]]));
  b.add('torso', 'gold', torus(0.288, 0.024), { p: [0, 0.222, 0], r: [PI / 2, 0, 0] });
  b.add('torso', 'armorDark', new THREE.CircleGeometry(0.28, 24), { p: [0, 0.22, 0], r: [PI / 2, 0, 0] });
  for (const s of [1, -1]) {
    b.add('torso', 'gold', sweep([[s * 0.075, 0.5, 0.185], [s * 0.09, 0.42, 0.2], [s * 0.115, 0.3, 0.255], [s * 0.12, 0.23, 0.268]], [0.016, 0.016, 0.016, 0.016], 8, 12));
    b.add('torso', 'armor', SPH, { p: [s * 0.275, 0.525, 0], s: [0.125, 0.1, 0.135] });
    b.add('torso', 'gold', SPH, { p: [s * 0.3, 0.6, 0.02], s: 0.03 });
  }
  // cinturón de cuerda, bola dorada y gema
  b.add('torso', 'teal', torus(0.203, 0.036), { p: [0, 0.41, 0], r: [PI / 2, 0, 0] });
  for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; b.add('torso', i % 2 ? 'teal' : 'tealDark', SPH, { p: [Math.sin(a) * 0.207, 0.41, Math.cos(a) * 0.207], r: [0, a, 0.6], s: [0.045, 0.036, 0.04] }); }
  b.add('torso', 'gold', SPH, { p: [0, 0.4, 0.245], s: 0.056 });
  b.add('torso', 'gem', OCTA, { p: [0, 0.305, 0.268], s: [0.042, 0.066, 0.03], flat: true });
  // brazo izquierdo
  b.add('armL', 'armorDark', sweep([[0, 0, 0], [0.045, -0.07, 0.02], [0.075, -0.14, 0.045]], [0.07, 0.062, 0.058], 12, 10), { local: true });
  b.add('armL', 'gold', torus(0.064, 0.02, PI * 2, 20), { local: true, p: [0.075, -0.14, 0.045], r: [PI / 2, 0, 0.3] });
  b.add('armL', 'glove', SPH, { local: true, p: [0.09, -0.2, 0.055], s: [0.088, 0.085, 0.09] });
  // brazo derecho con la espada
  b.add('armR', 'armorDark', sweep([[0, 0, 0], [-0.08, -0.04, 0.09], [-0.15, -0.085, 0.17]], [0.07, 0.062, 0.058], 12, 10), { local: true });
  b.add('armR', 'gold', torus(0.064, 0.02, PI * 2, 20), { local: true, p: [-0.14, -0.078, 0.16], r: [0.4, 0.6, 0] });
  b.add('armR', 'glove', SPH, { local: true, p: F, s: [0.088, 0.085, 0.09] });
  const SW = (x, y, z) => [F[0] + x, F[1] + y, F[2] + z];
  b.add('armR', 'teal', cyl(0.026, 0.2, 14), { local: true, p: SW(0, 0, 0) });
  b.add('armR', 'gold', SPH, { local: true, p: SW(0, -0.105, 0), s: 0.034 });
  b.add('armR', 'gold', torus(0.062, 0.024, PI * 2, 24), { local: true, p: SW(0, 0.105, 0), r: [PI / 2, 0, 0] });
  const bl = new THREE.Shape();
  bl.moveTo(-0.05, 0.12); bl.quadraticCurveTo(-0.13, 0.46, 0.0, 0.78); bl.quadraticCurveTo(0.075, 0.44, 0.05, 0.12); bl.lineTo(-0.05, 0.12);
  const blade = new THREE.ExtrudeGeometry(bl, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 16 });
  blade.translate(0, 0, -0.011);
  b.add('armR', 'jade', blade, { local: true, p: SW(0, 0, 0), r: [0, 0.2, 0.12] });
  b.sprite('sword', 'armR', SW(-0.06, 0.46, 0.02), 0x2dff9a, 0.46, 1.0, 0.45, true);
  // cabeza
  const HC = [0, 0.765, 0.03], HR = [0.255, 0.25, 0.255];
  b.add('head', 'face', SPH, { p: HC, s: HR });
  for (const s of [1, -1]) {
    b.add('head', 'eyeG', eyeGeo(s, 1.0), onEllipsoid(HC, HR, s * 24, 10, 1.03));
    const e = onEllipsoid(HC, HR, s * 24, 10, 1.1); b.sprite('eye' + (s > 0 ? 'L' : 'R'), 'head', e.p, 0x38ffa6, 0.26, 0.18, 0.5);
    b.add('head', 'stache', sweep([[s * 0.005, 0.69, 0.285], [s * 0.1, 0.64, 0.285], [s * 0.2, 0.6, 0.235], [s * 0.29, 0.625, 0.165], [s * 0.335, 0.705, 0.11]], [0.038, 0.066, 0.072, 0.052, 0.01], 14, 26));
    // cuernos dorados
    b.add('head', 'gold', sweep([[s * 0.1, 0.97, 0.24], [s * 0.27, 0.99, 0.2], [s * 0.41, 1.1, 0.15], [s * 0.45, 1.25, 0.11], [s * 0.37, 1.38, 0.09]], [0.06, 0.09, 0.088, 0.062, 0.008], 16, 30));
    // aletas laterales del casco
    b.add('head', 'gold', new THREE.BoxGeometry(0.035, 0.17, 0.15), { p: [s * 0.325, 0.79, 0.13], r: [0, s * 0.95, 0] });
    b.add('head', 'helmet', new THREE.BoxGeometry(0.05, 0.125, 0.105), { p: [s * 0.332, 0.79, 0.136], r: [0, s * 0.95, 0] });
    b.add('head', 'gold', SPH, { p: [s * 0.36, 0.795, 0.155], s: 0.034 });
  }
  b.add('head', 'helmet', new THREE.SphereGeometry(1, 36, 14, 0, PI * 2, 0, PI / 2), { p: [0, 0.79 + HY, 0], s: [0.302, 0.29, 0.302] });
  b.add('head', 'gold', torus(0.302, 0.03), { p: [0, 0.795 + HY, 0], r: [PI / 2, 0, 0] });
  b.add('head', 'gold', torus(0.303, 0.027, PI, 28), { p: [0, 0.79 + HY, 0], r: [0, PI / 2, 0], s: [1, 0.96, 1] });
  b.add('head', 'gold', SPH, { p: [0, 1.085 + HY, 0], s: 0.04 });
  const cr = new THREE.Shape();
  cr.moveTo(-0.2, 0.05); cr.lineTo(-0.11, 0.125); cr.lineTo(0, 0.075); cr.lineTo(0.11, 0.125); cr.lineTo(0.2, 0.05); cr.lineTo(0.07, -0.02); cr.lineTo(0, -0.085); cr.lineTo(-0.07, -0.02); cr.lineTo(-0.2, 0.05);
  const crest = new THREE.ExtrudeGeometry(cr, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
  b.add('head', 'gold', crest, { p: [0, 0.875 + HY, 0.262], r: [-0.22, 0, 0] });
  // protector de nuca (shikoro)
  b.add('head', 'helmet', lathe([[0.3, 0.87], [0.34, 0.78], [0.375, 0.71], [0.42, 0.65]], 30, 58 * D, 244 * D, 10));
  const arc = (r, t, y) => b.add('head', 'gold', torus(r, t, 244 * D, 36), { p: [0, y, 0], q: new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2, -148 * D, 0, 'YXZ')) });
  arc(0.422, 0.026, 0.65);
  // estela del tajo
  b.add('fx', 'slash', new THREE.RingGeometry(0.32, 0.7, 28, 1, -1.0, 2.5), { p: [-0.12, 0.5, 0.18], r: [0, -PI / 2, 0] });
  b.mats = {
    armor: std(0x57449a, { roughness: 0.5, side: THREE.DoubleSide }), armorDark: std(0x3a2c5e, { roughness: 0.6, side: THREE.DoubleSide }),
    helmet: std(0x4e4279, { roughness: 0.42, side: THREE.DoubleSide }), boot: std(0x2c2236, { roughness: 0.6 }), glove: std(0x4a3f54, { roughness: 0.65 }),
    face: std(0x17121f, { roughness: 0.75 }), stache: std(0xe1d8ea, { roughness: 0.5 }), gold,
    teal: std(0x1fb3a5, { roughness: 0.5 }), tealDark: std(0x15897f, { roughness: 0.55 }),
    gem: std(0x4fe6d0, { roughness: 0.2, emissive: 0x0f6a5e }),
    eyeG: basic(0x58ffb4, { side: THREE.DoubleSide }),
    jade: () => new THREE.MeshStandardMaterial({ color: 0x25e08c, emissive: 0x12b86a, emissiveIntensity: 1, roughness: 0.25 }),
    slash: () => new THREE.MeshBasicMaterial({ color: 0x5dffb0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  };
  b.noShadow = ['slash'];
  b.height = 1.45; b.durations = { attack: 0.5, super: 0.75 };
  b.animate = (rig, t, st) => {
    const g = rig.g, w = st.walk, ph = rig.walkT * 12, sn = Math.sin(ph);
    let armX = Math.sin(t * 1.6) * 0.07, armZ = 0, twist = 0, lean = 0, slash = 0, bob = Math.abs(sn) * 0.045 * w;
    if (st.atk >= 0) {
      const a = st.atk;
      armX = kf(a, [[0, 0], [0.24, -1.9], [0.42, 1.45], [0.62, 1.3], [1, 0]]);
      twist = kf(a, [[0, 0], [0.24, 0.45], [0.42, -0.5], [1, 0]]);
      lean = kf(a, [[0, 0], [0.24, -0.12], [0.42, 0.3], [1, 0]]);
      slash = kf(a, [[0.24, 0], [0.36, 1], [0.7, 0]]);
    }
    if (st.sup >= 0) {
      const a = st.sup;
      armX = kf(a, [[0, 0], [0.15, 1.5], [0.8, 1.5], [1, 0]]); armZ = kf(a, [[0, 0], [0.15, -0.7], [0.8, -0.7], [1, 0]]);
      lean = kf(a, [[0, 0], [0.15, 0.18], [0.8, 0.18], [1, 0]]);
    }
    if (st.cheer > 0) { armX = -0.9 + Math.sin(t * 12) * 0.25; bob += Math.abs(Math.sin(t * 8)) * 0.1; }
    g.all.position.y = bob;
    g.all.rotation.y = st.sup >= 0 ? kf(st.sup, [[0.1, 0], [0.85, PI * 4]]) : 0;
    g.legL.rotation.x = sn * 0.75 * w; g.legR.rotation.x = -sn * 0.75 * w;
    const br = Math.sin(t * 2.4) * 0.012;
    g.torso.scale.set(1 + br, 1 - br, 1 + br);
    g.torso.rotation.set(lean + w * 0.08, twist, sn * 0.07 * w);
    g.head.rotation.set(Math.sin(t * 1.7) * 0.03 - lean * 0.4, -twist * 0.6, -sn * 0.05 * w);
    g.armR.rotation.set(armX + sn * 0.25 * w, 0, armZ);
    g.armL.rotation.set(-sn * 0.7 * w + (st.atk >= 0 ? -armX * 0.25 : 0), 0, st.sup >= 0 ? 0.6 : 0);
    rig.mats.slash.opacity = slash * 0.85;
    g.fx.rotation.x = st.atk >= 0 ? kf(st.atk, [[0.24, -0.5], [0.6, 0.5]]) : 0;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.4), hot = Math.max(slash, st.sup >= 0 ? 1 : 0);
    rig.mats.jade.emissiveIntensity = 0.85 + 0.3 * pulse + hot;
    rig.sp.sword.material.opacity = 0.38 + 0.14 * pulse + 0.4 * hot;
    rig.sp.eyeL.material.opacity = rig.sp.eyeR.material.opacity = 0.5 + 0.2 * pulse;
  };
  return b.bake();
}

/* =====================================================================
   ROGUE — guerrero de la máscara de piedra
   ===================================================================== */
function buildRogue() {
  const b = new Blueprint();
  b.group('all', 'root').group('legL', 'all', [0.12, 0.25, 0]).group('legR', 'all', [-0.12, 0.25, 0])
    .group('torso', 'all', [0, 0.25, 0]).group('head', 'torso', [0, 0.58, 0])
    .group('armL', 'torso', [0.27, 0.52, 0]).group('armR', 'torso', [-0.28, 0.52, 0]);
  for (const s of [1, -1]) {
    const L = s > 0 ? 'legL' : 'legR';
    b.add(L, 'pants', cyl(0.095, 0.17, 20), { local: true, p: [0, -0.07, 0] });
    b.add(L, 'gold', torus(0.098, 0.022, PI * 2, 24), { local: true, p: [0, -0.13, 0], r: [PI / 2, 0, 0] });
    b.add(L, 'boot', SPH, { local: true, p: [0, -0.185, 0.035], s: [0.11, 0.07, 0.15] });
  }
  // túnica, faldón central, cinturón y correa
  b.add('torso', 'tunic', lathe([[0.27, 0.22], [0.27, 0.3], [0.225, 0.42], [0.215, 0.52], [0.12, 0.6]]));
  b.add('torso', 'gold', torus(0.268, 0.022), { p: [0, 0.228, 0], r: [PI / 2, 0, 0] });
  b.add('torso', 'pants', new THREE.CircleGeometry(0.26, 24), { p: [0, 0.225, 0], r: [PI / 2, 0, 0] });
  const tab = new THREE.Shape(); tab.moveTo(-0.075, 0.12); tab.lineTo(0.075, 0.12); tab.lineTo(0.075, -0.05); tab.lineTo(0, -0.1); tab.lineTo(-0.075, -0.05); tab.lineTo(-0.075, 0.12);
  b.add('torso', 'teal', new THREE.ExtrudeGeometry(tab, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }), { p: [0, 0.28, 0.25], r: [-0.12, 0, 0] });
  b.add('torso', 'leather', torus(0.228, 0.04), { p: [0, 0.4, 0], r: [PI / 2, 0, 0], s: [1, 1, 1.25] });
  b.add('torso', 'gold', torus(0.052, 0.02, PI * 2, 24), { p: [0, 0.4, 0.255] });
  b.add('torso', 'leather', torus(0.235, 0.032), { p: [0, 0.47, 0], r: [PI / 2, 0, 0], q: new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2 - 0.1, 0, 0.62, 'ZXY')), s: [1, 1, 1.3] });
  const bk = new THREE.Shape(); bk.moveTo(-0.045, -0.04); bk.lineTo(0.045, -0.04); bk.lineTo(0.045, 0.04); bk.lineTo(-0.045, 0.04); bk.lineTo(-0.045, -0.04);
  const hole = new THREE.Path(); hole.moveTo(-0.022, -0.018); hole.lineTo(-0.022, 0.018); hole.lineTo(0.022, 0.018); hole.lineTo(0.022, -0.018); hole.lineTo(-0.022, -0.018); bk.holes.push(hole);
  b.add('torso', 'gold', new THREE.ExtrudeGeometry(bk, { depth: 0.02, bevelEnabled: false }), { p: [0.05, 0.5, 0.215], r: [-0.1, 0.2, 0.62] });
  // bufanda
  b.add('torso', 'teal', torus(0.17, 0.065), { p: [0, 0.6, 0.01], r: [PI / 2 + 0.12, 0, 0], s: [1, 1, 1.1] });
  // hombreras
  for (const s of [1, -1]) {
    b.add('torso', 'tunic', SPH, { p: [s * 0.27, 0.55, 0], s: [0.13, 0.1, 0.14] });
    b.add('torso', 'gold', torus(0.125, 0.02, PI * 2, 28), { p: [s * 0.275, 0.52, 0], r: [PI / 2, 0, s * -0.2], s: [1, 1.1, 1] });
    b.add('torso', 'gold', cyl(0.052, 0.035, 20), { p: [s * 0.215, 0.565, 0.115], r: [PI / 2 - 0.3, 0, 0] });
  }
  // brazo izquierdo con escudo
  b.add('armL', 'tunic', sweep([[0, 0, 0], [0.05, -0.08, 0.03], [0.08, -0.16, 0.07]], [0.07, 0.062, 0.056], 12, 10), { local: true });
  b.add('armL', 'leather', SPH, { local: true, p: [0.09, -0.2, 0.09], s: [0.07, 0.07, 0.07] });
  const sh = (k) => { const S = new THREE.Shape(); S.moveTo(0, 0.25 * k); S.lineTo(0.16 * k, 0.17 * k); S.lineTo(0.16 * k, -0.08 * k); S.lineTo(0, -0.27 * k); S.lineTo(-0.16 * k, -0.08 * k); S.lineTo(-0.16 * k, 0.17 * k); S.lineTo(0, 0.25 * k); return S; };
  const SP = [0.15, -0.17, 0.13], SR = [0, 0.75, -0.08];
  const shieldQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(...SR));
  const shAdd = (mat, geom, off) => { const o = new V3(...off).applyQuaternion(shieldQ); b.add('armL', mat, geom, { local: true, p: [SP[0] + o.x, SP[1] + o.y, SP[2] + o.z], q: shieldQ }); };
  shAdd('gold', new THREE.ExtrudeGeometry(sh(1), { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }), [0, 0, 0]);
  shAdd('tunic', new THREE.ExtrudeGeometry(sh(0.76), { depth: 0.02, bevelEnabled: false }), [0, 0, 0.034]);
  const spiral = []; for (let i = 0; i <= 26; i++) { const a = i / 26 * PI * 3.3, r = 0.012 + i / 26 * 0.085; spiral.push([Math.cos(a) * r, Math.sin(a) * r - 0.01, 0.06]); }
  shAdd('rune', sweep(spiral, [0.012, 0.016, 0.016, 0.012], 6, 60), [0, 0, 0]);
  // brazo derecho de piedra con runas
  b.add('armR', 'tunic', SPH, { local: true, p: [-0.02, -0.03, 0], s: [0.085, 0.08, 0.085] });
  b.add('armR', 'stone', DODE, { local: true, p: [-0.06, -0.13, 0.03], r: [0.3, 0.5, 0.2], s: [0.115, 0.12, 0.115], flat: true });
  b.add('armR', 'stoneLight', DODE, { local: true, p: [-0.09, -0.24, 0.06], r: [1.1, 0.2, 0.7], s: [0.155, 0.15, 0.155], flat: true });
  b.add('armR', 'stone', ICO, { local: true, p: [-0.06, -0.3, 0.14], r: [0.2, 0.9, 0], s: [0.07, 0.06, 0.07], flat: true });
  b.add('armR', 'stone', ICO, { local: true, p: [-0.13, -0.31, 0.1], r: [0.7, 0.1, 0.4], s: [0.065, 0.06, 0.065], flat: true });
  b.add('armR', 'rune', sweep([[-0.02, -0.08, 0.09], [-0.07, -0.13, 0.125], [-0.04, -0.19, 0.15], [-0.1, -0.23, 0.185], [-0.07, -0.29, 0.19]], [0.011, 0.014, 0.014, 0.014, 0.01], 6, 24), { local: true });
  b.add('armR', 'rune', sweep([[-0.15, -0.12, 0.05], [-0.185, -0.19, 0.07], [-0.2, -0.26, 0.1]], [0.01, 0.013, 0.01], 6, 12), { local: true });
  b.sprite('fist', 'armR', [-0.09, -0.22, 0.14], 0x3dffd0, 0.4, 0.4, 0.4, true);
  // cabeza: piel, orejas, máscara de piedra, pelo
  b.add('head', 'skin', SPH, { p: [0, 0.83, 0], s: [0.255, 0.255, 0.245] });
  for (const s of [1, -1]) b.add('head', 'skin', SPH, { p: [s * 0.255, 0.8, 0.0], s: [0.05, 0.07, 0.06] });
  const mk = new THREE.Shape(), mw = 0.165, mh = 0.2, mr = 0.07;
  mk.moveTo(-mw + mr, -mh); mk.lineTo(mw - mr, -mh); mk.quadraticCurveTo(mw, -mh, mw, -mh + mr); mk.lineTo(mw, mh - mr); mk.quadraticCurveTo(mw, mh, mw - mr, mh); mk.lineTo(-mw + mr, mh); mk.quadraticCurveTo(-mw, mh, -mw, mh - mr); mk.lineTo(-mw, -mh + mr); mk.quadraticCurveTo(-mw, -mh, -mw + mr, -mh);
  b.add('head', 'mask', new THREE.ExtrudeGeometry(mk, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 10 }), { p: [0, 0.81, 0.17] });
  const MZ = 0.272;
  b.add('head', 'crack', sweep([[0.04, 1.03, MZ], [0.0, 0.95, MZ], [0.04, 0.87, MZ], [-0.005, 0.8, MZ], [0.035, 0.72, MZ], [0.0, 0.59, MZ]], [0.004, 0.009, 0.008, 0.01, 0.008, 0.004], 5, 30));
  b.add('head', 'crack', sweep([[0.04, 0.87, MZ], [0.09, 0.9, MZ], [0.12, 0.96, MZ]], [0.007, 0.006, 0.003], 5, 10));
  b.add('head', 'crack', sweep([[-0.005, 0.8, MZ], [-0.06, 0.74, MZ], [-0.08, 0.68, MZ]], [0.006, 0.005, 0.003], 5, 10));
  for (const s of [1, -1]) {
    b.add('head', 'eyeLine', eyeGeo(s, 0.8), { p: [s * 0.095, 0.835, MZ + 0.004] });
    b.add('head', 'eyeW', eyeGeo(s, 0.62), { p: [s * 0.095, 0.835, MZ + 0.008] });
    b.sprite('eye' + (s > 0 ? 'L' : 'R'), 'head', [s * 0.095, 0.835, MZ + 0.05], 0xfff2d0, 0.2, 0.14, 0.45);
  }
  b.add('head', 'hair', SPH, { p: [0, 0.9, -0.04], s: [0.285, 0.25, 0.28] });
  b.add('head', 'hair', SPH, { p: [0, 0.78, -0.12], s: [0.26, 0.22, 0.2] });
  const tuft = (p0, p1, p2, r) => b.add('head', 'hair', sweep([p0, p1, p2], [r, r * 0.75, 0.008], 8, 12));
  tuft([0.02, 1.08, 0.12], [0.1, 1.17, 0.2], [0.2, 1.17, 0.26], 0.1);
  tuft([-0.05, 1.08, 0.1], [-0.14, 1.14, 0.2], [-0.25, 1.1, 0.25], 0.09);
  tuft([0.12, 1.06, 0.02], [0.24, 1.16, 0.05], [0.33, 1.2, 0.02], 0.09);
  tuft([-0.14, 1.04, 0.0], [-0.27, 1.1, 0.02], [-0.36, 1.1, -0.02], 0.085);
  tuft([0, 1.08, -0.05], [0.05, 1.17, -0.1], [0.14, 1.2, -0.18], 0.1);
  tuft([0.05, 1.08, 0.16], [0.02, 1.07, 0.27], [-0.06, 1.0, 0.33], 0.08);
  tuft([0.12, 1.06, 0.16], [0.17, 1.04, 0.27], [0.19, 0.97, 0.31], 0.07);
  tuft([-0.1, 1.06, 0.16], [-0.15, 1.05, 0.27], [-0.2, 0.99, 0.3], 0.07);
  tuft([-0.08, 1.06, -0.14], [-0.14, 1.16, -0.22], [-0.2, 1.2, -0.3], 0.09);
  tuft([0.1, 1.0, -0.2], [0.16, 1.05, -0.32], [0.2, 1.04, -0.4], 0.09);
  tuft([-0.05, 0.92, -0.26], [-0.08, 0.9, -0.37], [-0.1, 0.84, -0.43], 0.09);
  tuft([0.2, 0.98, 0.12], [0.27, 0.98, 0.2], [0.3, 0.92, 0.25], 0.06);
  tuft([-0.2, 0.98, 0.12], [-0.27, 0.96, 0.2], [-0.29, 0.9, 0.24], 0.06);
  b.mats = {
    tunic: std(0x2f3d73, { roughness: 0.55, side: THREE.DoubleSide }), pants: std(0x262240, { roughness: 0.6, side: THREE.DoubleSide }),
    boot: std(0x4a3029, { roughness: 0.6 }), leather: std(0x6a3f2c, { roughness: 0.6 }), teal: std(0x2c6f82, { roughness: 0.6 }), gold,
    skin: std(0xf2a26e, { roughness: 0.6 }), mask: std(0xe9dcc4, { roughness: 0.75 }), crack: std(0x3a302c, { roughness: 0.9 }),
    hair: std(0x4d2a2c, { roughness: 0.55 }), stone: std(0x6c6860, { roughness: 0.9 }), stoneLight: std(0x857f74, { roughness: 0.9 }),
    rune: basic(0x45f5cf), eyeW: basic(0xfffbe8, { side: THREE.DoubleSide }), eyeLine: basic(0x2c2424, { side: THREE.DoubleSide }),
  };
  b.height = 1.42; b.durations = { attack: 0.5, super: 0.85 };
  b.animate = (rig, t, st) => {
    const g = rig.g, w = st.walk, sn = Math.sin(rig.walkT * 11);
    let punch = Math.sin(t * 1.6) * 0.05, shield = 0, twist = 0, lean = 0, bob = Math.abs(sn) * 0.04 * w, hot = 0;
    if (st.atk >= 0) {
      const a = st.atk;
      punch = kf(a, [[0, 0], [0.22, 0.75], [0.4, -1.65], [0.6, -1.4], [1, 0]]);
      twist = kf(a, [[0, 0], [0.22, 0.5], [0.4, -0.55], [1, 0]]);
      lean = kf(a, [[0, 0], [0.22, -0.1], [0.4, 0.28], [1, 0]]);
      hot = kf(a, [[0.15, 0], [0.4, 1], [0.9, 0]]);
    }
    if (st.sup >= 0) {
      const a = st.sup;
      shield = kf(a, [[0, 0], [0.2, 1], [0.5, 1], [0.75, 0.3], [1, 0]]);
      punch = kf(a, [[0, 0], [0.4, 0.9], [0.58, -1.8], [0.8, -1.5], [1, 0]]);
      twist = kf(a, [[0, 0], [0.2, -0.3], [0.4, 0.55], [0.58, -0.6], [1, 0]]);
      lean = kf(a, [[0, 0], [0.4, -0.12], [0.58, 0.32], [1, 0]]);
      hot = kf(a, [[0, 0], [0.4, 1], [0.7, 1], [1, 0]]) * 1.5;
    }
    if (st.cheer > 0) { punch = -2.6 + Math.sin(t * 12) * 0.2; bob += Math.abs(Math.sin(t * 8)) * 0.1; }
    g.all.position.y = bob;
    g.legL.rotation.x = sn * 0.7 * w; g.legR.rotation.x = -sn * 0.7 * w;
    const br = Math.sin(t * 2.3) * 0.012;
    g.torso.scale.set(1 + br, 1 - br, 1 + br);
    g.torso.rotation.set(lean + w * 0.07, twist, sn * 0.06 * w);
    g.head.rotation.set(Math.sin(t * 1.5) * 0.03 - lean * 0.4, -twist * 0.6 + Math.sin(t * 0.7) * 0.05, -sn * 0.04 * w);
    g.armR.rotation.set(punch - sn * 0.5 * w, 0, 0);
    g.armL.rotation.set(-shield * 1.15 + sn * 0.35 * w, -shield * 0.7, 0);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    rig.mats.rune.color.setRGB(0.25 + 0.3 * hot, 0.9 + 0.1 * pulse, 0.78 + 0.1 * pulse, THREE.SRGBColorSpace);
    rig.sp.fist.material.opacity = 0.3 + 0.12 * pulse + 0.5 * Math.min(1, hot);
    rig.sp.fist.scale.setScalar(0.4 + 0.3 * Math.min(1.5, hot));
    rig.sp.eyeL.material.opacity = rig.sp.eyeR.material.opacity = 0.4 + 0.15 * pulse + 0.3 * Math.min(1, hot);
  };
  return b.bake();
}

/* ---------------- creación de instancias ---------------- */
const BUILDERS = { bushi: buildBushi, bolab: buildBolab, ogul: buildOgul, rogue: buildRogue }, BP = {};
export function createCharacter(type) {
  const bp = BP[type] || (BP[type] = BUILDERS[type]());
  const g = {}, mats = {}, sp = {};
  for (const [name, d] of Object.entries(bp.groups)) {
    const o = new THREE.Group(); o.name = name; g[name] = o;
    if (d.parent) { const pa = bp.groups[d.parent].abs; o.position.set(d.abs[0] - pa[0], d.abs[1] - pa[1], d.abs[2] - pa[2]); g[d.parent].add(o); }
    o.rotation.set(...d.rot); o.userData.py = o.position.y;
  }
  for (const [k, f] of Object.entries(bp.mats)) {
    const m = mats[k] = f();
    if (m.emissive) { m.userData.e0 = m.emissive.clone().multiplyScalar(m.emissiveIntensity ?? 1); }
  }
  for (const bt of bp.batches) {
    const m = new THREE.Mesh(bt.geometry, mats[bt.mat]);
    const lit = !(bp.noShadow || []).includes(bt.mat);
    m.castShadow = lit; m.receiveShadow = false; if (!lit) m.renderOrder = 2;
    g[bt.group].add(m);
  }
  for (const s of bp.sprites) {
    const m = new THREE.SpriteMaterial({ map: glowTex(), color: s.color, transparent: true, opacity: s.opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const o = new THREE.Sprite(m), ab = bp.groups[s.group].abs;
    o.position.set(...(s.local ? s.p : [s.p[0] - ab[0], s.p[1] - ab[1], s.p[2] - ab[2]])); o.scale.set(s.sx, s.sy, 1); o.renderOrder = 3;
    g[s.group].add(o); sp[s.name] = o;
  }
  const rig = {
    type, root: g.root, g, mats, sp, height: bp.height, t: Math.random() * 10, walkT: 0, walkW: 0, atkT: -1, supT: -1, cheer: 0, flashK: 0,
    play(name) { if (name === 'attack') { this.atkT = 0; this.supT = -1; } else if (name === 'super') { this.supT = 0; this.atkT = -1; } },
    flash(k) {
      if (k === this.flashK) return; this.flashK = k;
      for (const m of Object.values(mats)) if (m.userData.e0) { m.emissive.copy(m.userData.e0).addScalar(k * 0.75); if (m !== mats.jade) m.emissiveIntensity = 1; }
    },
    update(dt, o = {}) {
      this.t += dt;
      this.walkW += ((o.moving ? 1 : 0) - this.walkW) * Math.min(1, dt * 10);
      if (this.walkW > 0.02) this.walkT += dt; else this.walkT = 0;
      if (this.atkT >= 0) { this.atkT += dt / bp.durations.attack; if (this.atkT >= 1) this.atkT = -1; }
      if (this.supT >= 0) { this.supT += dt / bp.durations.super; if (this.supT >= 1) this.supT = -1; }
      this.cheer = o.cheer ? 1 : 0;
      bp.animate(this, this.t, { walk: this.walkW, atk: this.atkT, sup: this.supT, cheer: this.cheer });
    },
  };
  rig.update(0);
  return rig;
}

/* ---------------- iluminación común ---------------- */
export function setupScene(renderer, scene, { shadows = true } = {}) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  scene.add(new THREE.HemisphereLight(0xfff3e6, 0x6a5a9a, 1.5));
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.4); sun.position.set(-4, 10, 7);
  if (shadows) {
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 6, bottom: -6, near: 1, far: 30 });
    sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  }
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9fb4ff, 0.9); rim.position.set(3, 4, -6); scene.add(rim);
  return sun;
}
export { THREE };
