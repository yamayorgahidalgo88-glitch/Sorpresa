// Analizador geométrico de mallas (STL/OBJ/3MF ya convertidos a triángulos).
// JavaScript puro, sin dependencias: funciona en el navegador y en Node (tests).
// Entrada: Float32Array con 9 floats por triángulo (x,y,z ×3), en milímetros.

const DEG = Math.PI / 180;

// ---------------------------------------------------------------- utilidades

export function mat3Identity() { return [1, 0, 0, 0, 1, 0, 0, 0, 1]; }

export function mat3Mul(a, b) {
  const r = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  }
  return r;
}

export function mat3RotZ(deg) {
  const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

// Rotación que lleva el vector unitario d a (0,0,-1): "esta cara va abajo, contra la cama".
export function mat3DownTo(d) {
  const [ax, ay, az] = normalize(d);
  const bx = 0, by = 0, bz = -1;
  const c = ax * bx + ay * by + az * bz;
  if (c > 0.999999) return mat3Identity();
  if (c < -0.999999) return [1, 0, 0, 0, -1, 0, 0, 0, -1]; // 180° sobre X
  const vx = ay * bz - az * by, vy = az * bx - ax * bz, vz = ax * by - ay * bx;
  const k = 1 / (1 + c);
  return [
    1 + k * (-vz * vz - vy * vy), -vz + k * (vx * vy), vy + k * (vx * vz),
    vz + k * (vx * vy), 1 + k * (-vz * vz - vx * vx), -vx + k * (vy * vz),
    -vy + k * (vx * vz), vx + k * (vy * vz), 1 + k * (-vy * vy - vx * vx),
  ];
}

function normalize(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

// PRNG determinista (mulberry32) para que el análisis sea reproducible.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function convexHull2D(pts) {
  // pts: array de [x,y]; monotone chain
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

// Rectángulo de área mínima (rotating calipers simplificado). Devuelve [lado corto, lado largo].
function minRect(pts) {
  const h = convexHull2D(pts);
  if (h.length < 2) return [0, 0];
  if (h.length === 2) return [0, Math.hypot(h[1][0] - h[0][0], h[1][1] - h[0][1])];
  let best = null;
  for (let i = 0; i < h.length; i++) {
    const a = h[i], b = h[(i + 1) % h.length];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    const l = Math.hypot(ex, ey); if (l < 1e-9) continue;
    const ux = ex / l, uy = ey / l;
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const q of h) {
      const u = q[0] * ux + q[1] * uy, v = -q[0] * uy + q[1] * ux;
      if (u < minU) minU = u; if (u > maxU) maxU = u;
      if (v < minV) minV = v; if (v > maxV) maxV = v;
    }
    const w = maxU - minU, d = maxV - minV;
    if (!best || w * d < best.area) best = { area: w * d, a: Math.min(w, d), b: Math.max(w, d) };
  }
  return best ? [best.a, best.b] : [0, 0];
}

function pointInConvex(hull, x, y) {
  if (hull.length < 3) return false;
  let sign = 0;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (Math.abs(c) < 1e-12) continue;
    const s = c > 0 ? 1 : -1;
    if (sign === 0) sign = s; else if (s !== sign) return false;
  }
  return true;
}

class UnionFind {
  constructor(n) { this.p = new Int32Array(n); for (let i = 0; i < n; i++) this.p[i] = i; }
  find(x) { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
  union(a, b) { a = this.find(a); b = this.find(b); if (a !== b) this.p[a] = b; }
}

// ---------------------------------------------------------------- BVH + rayos

class BVH {
  constructor(pos) {
    const F = pos.length / 9;
    this.pos = pos; this.F = F;
    const idx = new Uint32Array(F);
    const cen = new Float32Array(F * 3);
    for (let f = 0; f < F; f++) {
      idx[f] = f; const o = f * 9;
      cen[f * 3] = (pos[o] + pos[o + 3] + pos[o + 6]) / 3;
      cen[f * 3 + 1] = (pos[o + 1] + pos[o + 4] + pos[o + 7]) / 3;
      cen[f * 3 + 2] = (pos[o + 2] + pos[o + 5] + pos[o + 8]) / 3;
    }
    this.idx = idx;
    const nb = [], nl = [], ns = [], nc = []; // bounds(6), left child, start, count
    const stack = [[0, F, 0]];
    nb.push(0, 0, 0, 0, 0, 0); nl.push(-1); ns.push(0); nc.push(0);
    while (stack.length) {
      const [s, e, node] = stack.pop();
      let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
      let cmnx = Infinity, cmny = Infinity, cmnz = Infinity, cmxx = -Infinity, cmxy = -Infinity, cmxz = -Infinity;
      for (let i = s; i < e; i++) {
        const f = idx[i], o = f * 9;
        for (let k = 0; k < 9; k += 3) {
          const x = pos[o + k], y = pos[o + k + 1], z = pos[o + k + 2];
          if (x < mnx) mnx = x; if (x > mxx) mxx = x;
          if (y < mny) mny = y; if (y > mxy) mxy = y;
          if (z < mnz) mnz = z; if (z > mxz) mxz = z;
        }
        const cx = cen[f * 3], cy = cen[f * 3 + 1], cz = cen[f * 3 + 2];
        if (cx < cmnx) cmnx = cx; if (cx > cmxx) cmxx = cx;
        if (cy < cmny) cmny = cy; if (cy > cmxy) cmxy = cy;
        if (cz < cmnz) cmnz = cz; if (cz > cmxz) cmxz = cz;
      }
      const b = node * 6;
      nb[b] = mnx; nb[b + 1] = mny; nb[b + 2] = mnz; nb[b + 3] = mxx; nb[b + 4] = mxy; nb[b + 5] = mxz;
      const n = e - s;
      if (n <= 8) { nl[node] = -1; ns[node] = s; nc[node] = n; continue; }
      const ex = cmxx - cmnx, ey = cmxy - cmny, ez = cmxz - cmnz;
      const axis = ex >= ey && ex >= ez ? 0 : (ey >= ez ? 1 : 2);
      const mid = axis === 0 ? (cmnx + cmxx) / 2 : axis === 1 ? (cmny + cmxy) / 2 : (cmnz + cmxz) / 2;
      let i = s, j = e - 1;
      while (i <= j) {
        if (cen[idx[i] * 3 + axis] < mid) i++;
        else { const t = idx[i]; idx[i] = idx[j]; idx[j] = t; j--; }
      }
      let m = i;
      if (m === s || m === e) m = (s + e) >> 1;
      const left = nl.length;
      for (let k = 0; k < 2; k++) { nb.push(0, 0, 0, 0, 0, 0); nl.push(-1); ns.push(0); nc.push(0); }
      nl[node] = left; nc[node] = 0;
      stack.push([s, m, left], [m, e, left + 1]);
    }
    this.nb = Float32Array.from(nb); this.nl = Int32Array.from(nl);
    this.ns = Uint32Array.from(ns); this.nc = Uint32Array.from(nc);
  }

  // Devuelve {t, f} del impacto más cercano en (tmin, tmax) o null.
  // accept(f) permite filtrar triángulos (p. ej. solo los que se "salen" del sólido).
  raycast(ox, oy, oz, dx, dy, dz, tmin, tmax, accept) {
    const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
    const { nb, nl, ns, nc, idx, pos } = this;
    const stack = [0];
    let bestT = tmax, bestF = -1;
    while (stack.length) {
      const node = stack.pop(), b = node * 6;
      let t1 = (nb[b] - ox) * ix, t2 = (nb[b + 3] - ox) * ix;
      let lo = Math.min(t1, t2), hi = Math.max(t1, t2);
      t1 = (nb[b + 1] - oy) * iy; t2 = (nb[b + 4] - oy) * iy;
      lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
      t1 = (nb[b + 2] - oz) * iz; t2 = (nb[b + 5] - oz) * iz;
      lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
      if (!(hi >= Math.max(lo, tmin) && lo <= bestT)) continue;
      if (nl[node] >= 0) { stack.push(nl[node], nl[node] + 1); continue; }
      for (let i = ns[node], e = ns[node] + nc[node]; i < e; i++) {
        const f = idx[i], o = f * 9;
        const e1x = pos[o + 3] - pos[o], e1y = pos[o + 4] - pos[o + 1], e1z = pos[o + 5] - pos[o + 2];
        const e2x = pos[o + 6] - pos[o], e2y = pos[o + 7] - pos[o + 1], e2z = pos[o + 8] - pos[o + 2];
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
        const det = e1x * px + e1y * py + e1z * pz;
        if (Math.abs(det) < 1e-12) continue;
        const inv = 1 / det;
        const tx = ox - pos[o], ty = oy - pos[o + 1], tz = oz - pos[o + 2];
        const u = (tx * px + ty * py + tz * pz) * inv; if (u < -1e-7 || u > 1 + 1e-7) continue;
        const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
        const v = (dx * qx + dy * qy + dz * qz) * inv; if (v < -1e-7 || u + v > 1 + 1e-7) continue;
        const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
        if (t > tmin && t < bestT && (!accept || accept(f))) { bestT = t; bestF = f; }
      }
    }
    return bestF >= 0 ? { t: bestT, f: bestF } : null;
  }
}

// ---------------------------------------------------------------- preparación

// Suelda vértices, calcula normales/áreas, vecindad por aristas, estanqueidad y volumen.
export function prepareMesh(input) {
  const pos = new Float32Array(input); // copia (podemos invertir triángulos)
  const F = pos.length / 9;
  if (!F) throw new Error('El archivo no contiene triángulos.');

  // Soldadura por posición cuantizada (1 µm).
  const map = new Map();
  const vid = new Uint32Array(F * 3);
  let nV = 0;
  for (let c = 0; c < F * 3; c++) {
    const o = c * 3;
    const key = Math.round(pos[o] * 1000) + ',' + Math.round(pos[o + 1] * 1000) + ',' + Math.round(pos[o + 2] * 1000);
    let id = map.get(key);
    if (id === undefined) { id = nV++; map.set(key, id); }
    vid[c] = id;
  }

  // Volumen con signo: si es negativo, las normales están invertidas → se corrigen.
  let vol = 0;
  for (let f = 0; f < F; f++) {
    const o = f * 9;
    vol += (pos[o] * (pos[o + 4] * pos[o + 8] - pos[o + 5] * pos[o + 7])
      - pos[o + 1] * (pos[o + 3] * pos[o + 8] - pos[o + 5] * pos[o + 6])
      + pos[o + 2] * (pos[o + 3] * pos[o + 7] - pos[o + 4] * pos[o + 6])) / 6;
  }
  let flipped = false;
  if (vol < 0) {
    flipped = true; vol = -vol;
    for (let f = 0; f < F; f++) {
      const o = f * 9;
      for (let k = 0; k < 3; k++) { const t = pos[o + 3 + k]; pos[o + 3 + k] = pos[o + 6 + k]; pos[o + 6 + k] = t; }
      const t = vid[f * 3 + 1]; vid[f * 3 + 1] = vid[f * 3 + 2]; vid[f * 3 + 2] = t;
    }
  }

  const normals = new Float32Array(F * 3);
  const areas = new Float32Array(F);
  let totalArea = 0, degenerate = 0;
  for (let f = 0; f < F; f++) {
    const o = f * 9;
    const ux = pos[o + 3] - pos[o], uy = pos[o + 4] - pos[o + 1], uz = pos[o + 5] - pos[o + 2];
    const vx = pos[o + 6] - pos[o], vy = pos[o + 7] - pos[o + 1], vz = pos[o + 8] - pos[o + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz);
    areas[f] = l / 2; totalArea += l / 2;
    if (l > 1e-12) { normals[f * 3] = nx / l; normals[f * 3 + 1] = ny / l; normals[f * 3 + 2] = nz / l; } else degenerate++;
  }

  // Vecindad por aristas.
  const neighbors = new Int32Array(F * 3).fill(-1);
  const edgeMap = new Map();
  let nonManifold = 0;
  for (let f = 0; f < F; f++) {
    for (let k = 0; k < 3; k++) {
      const a = vid[f * 3 + k], b = vid[f * 3 + (k + 1) % 3];
      if (a === b) continue;
      const key = a < b ? a * nV + b : b * nV + a;
      const prev = edgeMap.get(key);
      if (prev === undefined) edgeMap.set(key, f * 3 + k);
      else if (prev >= 0) {
        const pf = (prev / 3) | 0, pk = prev % 3;
        neighbors[f * 3 + k] = pf; neighbors[pf * 3 + pk] = f;
        edgeMap.set(key, -2);
      } else { nonManifold++; }
    }
  }
  let openEdges = 0;
  for (const v of edgeMap.values()) if (v >= 0) openEdges++;

  return {
    pos, F, nV, vid, normals, areas, totalArea, neighbors,
    volume: vol, flipped, degenerate, openEdges, nonManifold,
    watertight: openEdges === 0 && nonManifold === 0,
  };
}

// ---------------------------------------------------------------- orientación

// Agrupa normales para encontrar caras planas grandes (candidatas a apoyarse en la cama).
function normalClusters(mesh) {
  const { normals, areas, F } = mesh;
  const acc = new Map();
  for (let f = 0; f < F; f++) {
    const nx = normals[f * 3], ny = normals[f * 3 + 1], nz = normals[f * 3 + 2];
    if (!nx && !ny && !nz) continue;
    const key = Math.round(nx * 25) + ',' + Math.round(ny * 25) + ',' + Math.round(nz * 25);
    let c = acc.get(key);
    if (!c) { c = { a: 0, x: 0, y: 0, z: 0 }; acc.set(key, c); }
    const a = areas[f]; c.a += a; c.x += nx * a; c.y += ny * a; c.z += nz * a;
  }
  return [...acc.values()].sort((p, q) => q.a - p.a).map(c => ({ area: c.a, n: normalize([c.x, c.y, c.z]) }));
}

// Evalúa rápidamente una orientación (sin rayos): voladizos, contacto, altura, encaje.
export function scoreOrientation(mesh, R, alphaDeg, volume) {
  const { pos, normals, areas, F, totalArea } = mesh;
  const s = Math.sin(alphaDeg * DEG);
  let zmin = Infinity, zmax = -Infinity, xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  const n = pos.length / 3;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const tx = R[0] * x + R[1] * y + R[2] * z, ty = R[3] * x + R[4] * y + R[5] * z, tz = R[6] * x + R[7] * y + R[8] * z;
    if (tz < zmin) zmin = tz; if (tz > zmax) zmax = tz;
    if (tx < xmin) xmin = tx; if (tx > xmax) xmax = tx;
    if (ty < ymin) ymin = ty; if (ty > ymax) ymax = ty;
  }
  let over = 0, contact = 0;
  for (let f = 0; f < F; f++) {
    const nz = R[6] * normals[f * 3] + R[7] * normals[f * 3 + 1] + R[8] * normals[f * 3 + 2];
    if (nz >= -s) continue;
    const o = f * 9;
    let fz = -Infinity, cz = 0;
    for (let k = 0; k < 9; k += 3) {
      const z = R[6] * pos[o + k] + R[7] * pos[o + k + 1] + R[8] * pos[o + k + 2] - zmin;
      cz += z / 3; if (z > fz) fz = z;
    }
    if (nz < -0.985 && fz < 0.1) contact += areas[f];
    else if (cz > 0.2) over += areas[f];
  }
  const dims = [xmax - xmin, ymax - ymin, zmax - zmin];
  const fit = fitsVolume(dims, volume);
  const diag = Math.hypot(...dims) || 1;
  const score = over / totalArea
    + 0.12 * (dims[2] / diag)
    - 0.08 * Math.min(contact / (0.08 * totalArea), 1)
    + (contact < 100 ? 0.04 : 0)
    + (fit.fits ? 0 : (fit.rotated ? 0.02 : 5));
  return { score, overArea: over, contact, dims, fit };
}

export function fitsVolume(dims, volume) {
  const [bx, by, bz] = volume.size, m = volume.margin;
  const ux = bx - m, uy = by - m, uz = bz - m;
  const fits = dims[0] <= ux && dims[1] <= uy && dims[2] <= uz;
  // giro de 45° en XY: la huella diagonal
  const d45 = (dims[0] + dims[1]) / Math.SQRT2;
  const rotated = !fits && dims[2] <= uz && d45 <= Math.min(ux, uy);
  return { fits, rotated, usable: [ux, uy, uz] };
}

// Busca la orientación que minimiza voladizos y altura y maximiza el apoyo (estilo Tweaker-3).
export function findOrientations(mesh, alphaDeg, volume) {
  const cands = [[0, 0, -1], [0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
  const clusters = normalClusters(mesh).slice(0, 14);
  for (const c of clusters) if (c.area > 0.003 * mesh.totalArea) cands.push(c.n);
  const seen = [];
  const results = [];
  for (const d of cands) {
    const n = normalize(d);
    if (seen.some(s => s[0] * n[0] + s[1] * n[1] + s[2] * n[2] > 0.999)) continue;
    seen.push(n);
    let R = mat3DownTo(n);
    let r = scoreOrientation(mesh, R, alphaDeg, volume);
    if (!r.fit.fits && r.fit.rotated) { R = mat3Mul(mat3RotZ(45), R); r = scoreOrientation(mesh, R, alphaDeg, volume); r.rotated45 = true; }
    results.push({ down: n, R, ...r, original: n[2] < -0.999 && !r.rotated45 });
  }
  // La orientación original siempre está en la lista (identidad).
  if (!results.some(r => r.original)) {
    const R = mat3Identity();
    results.push({ down: [0, 0, -1], R, ...scoreOrientation(mesh, R, alphaDeg, volume), original: true });
  }
  results.sort((a, b) => a.score - b.score);
  return results;
}


// Zona plana hacia abajo: ¿puente (apoyado en lados opuestos) o ménsula (un solo apoyo)?
// Anclajes = aristas del borde cuyo vecino baja (una pared que llega desde abajo).
function classifyFlat(faces, pos, neighbors, inIsland) {
  const anchors = [];
  const inSet = new Set(faces);
  for (const f of faces) {
    for (let k = 0; k < 3; k++) {
      const g = neighbors[f * 3 + k];
      if (g < 0 || inSet.has(g)) continue;
      const a = f * 9 + k * 3, b = f * 9 + ((k + 1) % 3) * 3;
      const ez = (pos[a + 2] + pos[b + 2]) / 2;
      const gz = Math.min(pos[g * 9 + 2], pos[g * 9 + 5], pos[g * 9 + 8]);
      if (gz < ez - 0.05) {
        const len = Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1]);
        const n = Math.max(1, Math.ceil(len / 2));
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          anchors.push([pos[a] + t * (pos[b] - pos[a]), pos[a + 1] + t * (pos[b + 1] - pos[a + 1])]);
        }
      }
    }
  }
  if (!anchors.length) return { kind: 'cantilever', cantileverMm: Infinity, spanMm: Infinity };
  // Puntos de muestra: vértices y centroides de la zona (y puntos intermedios en triángulos grandes)
  let P = [];
  for (const f of faces) {
    const o = f * 9;
    const c = [(pos[o] + pos[o + 3] + pos[o + 6]) / 3, (pos[o + 1] + pos[o + 4] + pos[o + 7]) / 3];
    P.push(c);
    for (let k = 0; k < 9; k += 3) {
      P.push([pos[o + k], pos[o + k + 1]]);
      P.push([(pos[o + k] + c[0]) / 2, (pos[o + k + 1] + c[1]) / 2]);
    }
  }
  if (P.length > 600) { const st = Math.ceil(P.length / 600); P = P.filter((_, i) => i % st === 0); }
  const A = anchors.length > 1500 ? anchors.filter((_, i) => i % Math.ceil(anchors.length / 1500) === 0) : anchors;
  let cant = 0;
  const spans = [];
  for (const p of P) {
    let d1 = Infinity, v1 = null;
    for (const a of A) { const d = Math.hypot(a[0] - p[0], a[1] - p[1]); if (d < d1) { d1 = d; v1 = [a[0] - p[0], a[1] - p[1]]; } }
    if (d1 < 0.5) continue; // pegado a un apoyo
    let d2 = Infinity;
    for (const a of A) {
      const vx = a[0] - p[0], vy = a[1] - p[1], d = Math.hypot(vx, vy);
      if (d < 1e-6) continue;
      if ((vx * v1[0] + vy * v1[1]) / (d * d1) < -0.5 && d < d2) d2 = d;
    }
    if (d2 === Infinity) { if (d1 > cant) cant = d1; } else spans.push(d1 + d2);
  }
  spans.sort((a, b) => a - b);
  const span = spans.length ? spans[Math.floor((spans.length - 1) * 0.97)] : 0;
  if (cant > 1.5) return { kind: 'cantilever', cantileverMm: cant, spanMm: span || cant };
  return { kind: 'bridge', cantileverMm: cant, spanMm: span };
}

// ---------------------------------------------------------------- análisis completo

export function transformPositions(pos, R) {
  const out = new Float32Array(pos.length);
  const n = pos.length / 3;
  let xmin = Infinity, ymin = Infinity, zmin = Infinity, xmax = -Infinity, ymax = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const tx = R[0] * x + R[1] * y + R[2] * z, ty = R[3] * x + R[4] * y + R[5] * z, tz = R[6] * x + R[7] * y + R[8] * z;
    out[i * 3] = tx; out[i * 3 + 1] = ty; out[i * 3 + 2] = tz;
    if (tx < xmin) xmin = tx; if (tx > xmax) xmax = tx;
    if (ty < ymin) ymin = ty; if (ty > ymax) ymax = ty;
    if (tz < zmin) zmin = tz;
  }
  // Centrado en la cama (origen en la esquina, como Marlin) y apoyado en Z=0.
  const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
  for (let i = 0; i < n; i++) {
    out[i * 3] -= cx; out[i * 3 + 1] -= cy; out[i * 3 + 2] -= zmin;
  }
  return out;
}

// Clasificación de cada cara para colorear el visor.
export const FACE = { NORMAL: 0, BED: 1, NEAR: 2, OVERHANG: 3, BRIDGE: 4, THIN: 5 };

export function analyze(mesh, R, opts) {
  const { alphaDeg = 50, lineWidth = 0.42, volume = { size: [225, 225, 280], margin: 5 }, thicknessSamples = 3000 } = opts || {};
  const pos = transformPositions(mesh.pos, R);
  const { F, areas, neighbors, totalArea } = mesh;
  const normals = new Float32Array(F * 3);
  for (let f = 0; f < F; f++) {
    const x = mesh.normals[f * 3], y = mesh.normals[f * 3 + 1], z = mesh.normals[f * 3 + 2];
    normals[f * 3] = R[0] * x + R[1] * y + R[2] * z;
    normals[f * 3 + 1] = R[3] * x + R[4] * y + R[5] * z;
    normals[f * 3 + 2] = R[6] * x + R[7] * y + R[8] * z;
  }

  // Dimensiones
  let xmin = Infinity, ymin = Infinity, zmax = -Infinity, xmax = -Infinity, ymax = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    if (pos[i] < xmin) xmin = pos[i]; if (pos[i] > xmax) xmax = pos[i];
    if (pos[i + 1] < ymin) ymin = pos[i + 1]; if (pos[i + 1] > ymax) ymax = pos[i + 1];
    if (pos[i + 2] > zmax) zmax = pos[i + 2];
  }
  const dims = [xmax - xmin, ymax - ymin, zmax];
  const fit = fitsVolume(dims, volume);

  const s = Math.sin(alphaDeg * DEG);
  const sNear = Math.sin(Math.max(alphaDeg - 10, 30) * DEG);
  const faceClass = new Uint8Array(F);
  const zc = new Float32Array(F);
  const zTop = new Float32Array(F);
  for (let f = 0; f < F; f++) {
    const o = f * 9;
    zc[f] = (pos[o + 2] + pos[o + 5] + pos[o + 8]) / 3;
    zTop[f] = Math.max(pos[o + 2], pos[o + 5], pos[o + 8]);
  }

  // Contacto con la cama, voladizos y puentes
  let contact = 0, overArea = 0, nearArea = 0;
  const contactPts = [];
  for (let f = 0; f < F; f++) {
    const nz = normals[f * 3 + 2];
    if (nz < -0.985 && zTop[f] < 0.1) {
      faceClass[f] = FACE.BED; contact += areas[f];
      const o = f * 9; contactPts.push([pos[o], pos[o + 1]], [pos[o + 3], pos[o + 4]], [pos[o + 6], pos[o + 7]]);
    } else if (nz < -s && zc[f] > 0.2) {
      faceClass[f] = nz < -0.98 ? FACE.BRIDGE : FACE.OVERHANG; overArea += areas[f];
    } else if (nz < -sNear && zc[f] > 0.2) {
      faceClass[f] = FACE.NEAR; nearArea += areas[f];
    }
  }

  const bvh = new BVH(pos);

  // Islas de voladizo (componentes conexas)
  const uf = new UnionFind(F);
  const isOver = f => faceClass[f] === FACE.OVERHANG || faceClass[f] === FACE.BRIDGE;
  for (let f = 0; f < F; f++) {
    if (!isOver(f)) continue;
    for (let k = 0; k < 3; k++) { const g = neighbors[f * 3 + k]; if (g >= 0 && isOver(g)) uf.union(f, g); }
  }
  const islandMap = new Map();
  for (let f = 0; f < F; f++) {
    if (!isOver(f)) continue;
    const r = uf.find(f);
    let isl = islandMap.get(r);
    if (!isl) { isl = { faces: [], area: 0, zMin: Infinity, zMax: -Infinity, maxAlpha: 0, flat: 0 }; islandMap.set(r, isl); }
    isl.faces.push(f); isl.area += areas[f];
    if (zc[f] < isl.zMin) isl.zMin = zc[f];
    if (zc[f] > isl.zMax) isl.zMax = zc[f];
    const alpha = Math.asin(Math.min(1, -normals[f * 3 + 2])) / DEG;
    if (alpha > isl.maxAlpha) isl.maxAlpha = alpha;
    if (faceClass[f] === FACE.BRIDGE) isl.flat += areas[f];
  }
  const islands = [];
  for (const isl of islandMap.values()) {
    if (isl.area < 2) continue; // < 2 mm²: ruido
    // ¿Ve la cama? Rayos hacia abajo desde varias caras de la isla.
    const sample = isl.faces.slice().sort((a, b) => areas[b] - areas[a]).slice(0, 6);
    let blocked = 0;
    for (const f of sample) {
      const o = f * 9;
      const cx = (pos[o] + pos[o + 3] + pos[o + 6]) / 3, cy = (pos[o + 1] + pos[o + 4] + pos[o + 7]) / 3;
      if (bvh.raycast(cx, cy, zc[f] - 0.01, 1e-9, 1e-9, -1, 0.05, zc[f] + 1, g => g !== f)) blocked++;
    }
    // Rectángulo mínimo de la huella → saliente de un voladizo inclinado
    const pts = [];
    for (const f of isl.faces) { const o = f * 9; pts.push([pos[o], pos[o + 1]], [pos[o + 3], pos[o + 4]], [pos[o + 6], pos[o + 7]]); }
    const [shortSide, longSide] = minRect(pts.length > 3000 ? pts.filter((_, i) => i % Math.ceil(pts.length / 3000) === 0) : pts);
    const flatness = isl.flat / isl.area;
    const island = {
      areaMm2: isl.area, zMin: isl.zMin, zMax: isl.zMax, maxAlpha: isl.maxAlpha,
      flatness, seesBed: blocked === 0, spanMm: shortSide, lengthMm: longSide, kind: 'slope', cantileverMm: 0,
    };
    if (flatness > 0.7) Object.assign(island, classifyFlat(isl.faces, pos, neighbors, isOver));
    islands.push(island);
  }
  islands.sort((a, b) => b.areaMm2 - a.areaMm2);
  const bridges = islands.filter(i => i.kind === 'bridge').map(i => ({ spanMm: i.spanMm, lengthMm: i.lengthMm, areaMm2: i.areaMm2, z: i.zMin }));

  // Grosor de pared: rayos hacia el interior desde puntos aleatorios (ponderados por área).
  const rand = rng(1234567);
  const cum = new Float64Array(F);
  let acc = 0; for (let f = 0; f < F; f++) { acc += areas[f]; cum[f] = acc; }
  const nS = Math.min(thicknessSamples, Math.max(200, F));
  const MAXT = 5;
  const thick = [];
  const thinFaces = [];
  for (let i = 0; i < nS; i++) {
    const r = rand() * acc;
    let lo = 0, hi = F - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; }
    const f = lo, o = f * 9;
    const nx = normals[f * 3], ny = normals[f * 3 + 1], nz = normals[f * 3 + 2];
    if (!nx && !ny && !nz) continue;
    let u = rand(), v = rand(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const px = pos[o] + u * (pos[o + 3] - pos[o]) + v * (pos[o + 6] - pos[o]);
    const py = pos[o + 1] + u * (pos[o + 4] - pos[o + 1]) + v * (pos[o + 7] - pos[o + 1]);
    const pz = pos[o + 2] + u * (pos[o + 5] - pos[o + 2]) + v * (pos[o + 8] - pos[o + 2]);
    const dx = -nx || 1e-9, dy = -ny || 1e-9, dz = -nz || 1e-9;
    const hit = bvh.raycast(px, py, pz, dx, dy, dz, 1e-4, MAXT, g => g !== f &&
      (normals[g * 3] * dx + normals[g * 3 + 1] * dy + normals[g * 3 + 2] * dz) > 0.05);
    const t = hit ? hit.t : MAXT;
    thick.push(t);
    if (t < 2 * lineWidth) thinFaces.push(f);
  }
  thick.sort((a, b) => a - b);
  const pct = p => thick.length ? thick[Math.min(thick.length - 1, Math.floor(p * thick.length))] : MAXT;
  const fracBelow = x => thick.length ? thick.filter(t => t < x).length / thick.length : 0;
  for (const f of thinFaces) if (faceClass[f] === FACE.NORMAL || faceClass[f] === FACE.NEAR) faceClass[f] = FACE.THIN;

  // Centro de masas (tetraedros) y estabilidad
  let cmx = 0, cmy = 0, cmz = 0, vtot = 0;
  for (let f = 0; f < F; f++) {
    const o = f * 9;
    const v = (pos[o] * (pos[o + 4] * pos[o + 8] - pos[o + 5] * pos[o + 7])
      - pos[o + 1] * (pos[o + 3] * pos[o + 8] - pos[o + 5] * pos[o + 6])
      + pos[o + 2] * (pos[o + 3] * pos[o + 7] - pos[o + 4] * pos[o + 6])) / 6;
    vtot += v;
    cmx += v * (pos[o] + pos[o + 3] + pos[o + 6]) / 4;
    cmy += v * (pos[o + 1] + pos[o + 4] + pos[o + 7]) / 4;
    cmz += v * (pos[o + 2] + pos[o + 5] + pos[o + 8]) / 4;
  }
  const com = vtot ? [cmx / vtot, cmy / vtot, cmz / vtot] : [0, 0, dims[2] / 2];
  const hull = convexHull2D(contactPts.length > 6000 ? contactPts.filter((_, i) => i % Math.ceil(contactPts.length / 6000) === 0) : contactPts);
  const comInside = pointInConvex(hull, com[0], com[1]);
  let hullArea = 0;
  for (let i = 0; i < hull.length; i++) { const a = hull[i], b = hull[(i + 1) % hull.length]; hullArea += a[0] * b[1] - b[0] * a[1]; }
  hullArea = Math.abs(hullArea) / 2;

  // Forma: proporción de área en las 6 orientaciones planas dominantes
  const clusters = normalClusters({ normals, areas, F });
  const flatShare = clusters.slice(0, 6).reduce((a, c) => a + c.area, 0) / totalArea;
  const shapeClass = flatShare > 0.7 ? 'prismatica' : flatShare < 0.4 ? 'organica' : 'mixta';

  // Superficie superior plana más grande (para planchado)
  const tops = new Map();
  for (let f = 0; f < F; f++) {
    if (normals[f * 3 + 2] > 0.999) {
      const k = Math.round(zc[f] * 10);
      tops.set(k, (tops.get(k) || 0) + areas[f]);
    }
  }
  let topFlat = 0, topFlatZ = 0;
  for (const [k, a] of tops) if (a > topFlat) { topFlat = a; topFlatZ = k / 10; }

  const contactCm2 = contact / 100;
  const slenderness = dims[2] / Math.sqrt(Math.max(contact, 1e-6));

  return {
    pos, faceClass, dims, fit,
    triangles: F, watertight: mesh.watertight, openEdges: mesh.openEdges, nonManifold: mesh.nonManifold,
    flipped: mesh.flipped,
    volumeCm3: mesh.volume / 1000, areaCm2: totalArea / 100,
    contactCm2, contactHullCm2: hullArea / 100, comInside, com, slenderness,
    overhangPct: 100 * overArea / totalArea, overhangCm2: overArea / 100, nearPct: 100 * nearArea / totalArea,
    maxOverhangAlpha: islands.length ? Math.max(...islands.map(i => i.maxAlpha)) : 0,
    islands, islandsAllSeeBed: islands.every(i => i.seesBed),
    largestIslandFlatness: islands.length ? islands[0].flatness : 0,
    bridges, maxBridgeMm: bridges.length ? Math.max(...bridges.map(b => b.spanMm)) : 0,
    thickness: { min: pct(0.02), p10: pct(0.1), median: pct(0.5), fracBelowLw: fracBelow(lineWidth), fracBelow2Lw: fracBelow(2 * lineWidth), samples: thick.length },
    flatShare, shapeClass, topFlatCm2: topFlat / 100, topFlatZ,
    alphaDeg,
  };
}

