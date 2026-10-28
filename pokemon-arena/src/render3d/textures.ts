import * as THREE from 'three';
import { ARENA } from '../sim/data/arena';
import { Rng } from '../sim/core/rng';

/**
 * Texturas procedurales originales pintadas en <canvas> al arrancar (sin archivos externos).
 * Estilo "pintado a mano" de juguete: colores saturados, ruido suave, bordes redondeados.
 */

let anisotropy = 4;
export function setMaxAnisotropy(v: number): void {
  anisotropy = Math.min(8, v);
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function toTexture(c: HTMLCanvasElement, repeat = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Manchas suaves de ruido para romper la uniformidad del color. */
function blotches(ctx: CanvasRenderingContext2D, w: number, h: number, rng: Rng, n: number, colors: string[], rMin: number, rMax: number): void {
  for (let i = 0; i < n; i++) {
    const x = rng.next() * w;
    const y = rng.next() * h;
    const r = rMin + rng.next() * (rMax - rMin);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colors[i % colors.length]);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

/** Suelo del campo: césped segado en franjas, caminos de arena y plazas bajo las torres. */
export function arenaGroundTexture(): THREE.CanvasTexture {
  const PX = 64; // píxeles por casilla
  const W = ARENA.width * PX;
  const H = ARENA.height * PX;
  const [c, ctx] = canvas(W, H);
  const rng = new Rng(11);

  // Césped base con franjas de segado (2 casillas) y un damero muy sutil que insinúa la rejilla.
  for (let ty = 0; ty < ARENA.height; ty++) {
    for (let tx = 0; tx < ARENA.width; tx++) {
      const stripe = Math.floor(ty / 2) % 2 === 0;
      const check = (tx + ty) % 2 === 0;
      const base = stripe ? [118, 200, 74] : [104, 186, 64];
      const k = check ? 1.03 : 0.985;
      ctx.fillStyle = `rgb(${base[0] * k},${base[1] * k},${base[2] * k})`;
      ctx.fillRect(tx * PX, ty * PX, PX, PX);
    }
  }
  blotches(ctx, W, H, rng, 260, ['rgba(150,220,90,0.18)', 'rgba(60,140,50,0.16)', 'rgba(180,230,110,0.12)'], 20, 70);

  // Caminos de arena: rutas laterales y paso frente a las bases.
  const path = (pts: [number, number][], width: number) => {
    for (const [color, wMul, blur] of [
      ['rgba(150,120,70,0.55)', 1.18, 10],
      ['#e7c98a', 1, 6],
      ['#f1d9a2', 0.6, 14],
    ] as const) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width * PX * wMul;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * PX, pts[0][1] * PX);
      for (const [x, y] of pts.slice(1)) ctx.lineTo(x * PX, y * PX);
      ctx.stroke();
      ctx.restore();
    }
  };
  for (const lx of ARENA.laneX) {
    path([[lx, 4.2], [lx, ARENA.riverTop - 0.2]], 1.5);
    path([[lx, ARENA.riverBottom + 0.2], [lx, ARENA.height - 4.2]], 1.5);
  }
  // Paso curvo que une las dos rutas por delante de cada base.
  path([[3.5, 5.2], [5.6, 3.4], [12.4, 3.4], [14.5, 5.2]], 1.3);
  path([[3.5, 26.8], [5.6, 28.6], [12.4, 28.6], [14.5, 26.8]], 1.3);

  // Plazas de piedra bajo torres
  const plaza = (x: number, y: number, r: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(90,80,60,0.35)';
    ctx.beginPath();
    ctx.arc(x * PX, y * PX + 6, r * PX * 1.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9c9a4';
    ctx.beginPath();
    ctx.arc(x * PX, y * PX, r * PX, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,100,70,0.5)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x * PX + Math.cos(a) * r * PX * 0.45, y * PX + Math.sin(a) * r * PX * 0.45);
      ctx.lineTo(x * PX + Math.cos(a) * r * PX, y * PX + Math.sin(a) * r * PX);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x * PX, y * PX, r * PX * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };
  for (const [x, y, r] of [[3.5, 6.5, 2], [14.5, 6.5, 2], [9, 3, 2.6], [3.5, 25.5, 2], [14.5, 25.5, 2], [9, 29, 2.6]]) plaza(x, y, r);

  // Matas de hierba y florecillas solo cerca de los bordes (no estorban la lectura).
  for (let i = 0; i < 520; i++) {
    const x = rng.next() * W;
    const y = rng.next() * H;
    const edge = Math.min(x, W - x) / PX;
    if (edge > 2.2 && rng.next() > 0.12) continue;
    ctx.strokeStyle = rng.next() < 0.5 ? 'rgba(70,150,50,0.8)' : 'rgba(160,225,100,0.8)';
    ctx.lineWidth = 2;
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      ctx.moveTo(x + b * 3, y);
      ctx.lineTo(x + b * 3 + (b - 1) * 3, y - 8 - rng.next() * 5);
      ctx.stroke();
    }
    if (rng.next() < 0.18) {
      ctx.fillStyle = ['#fff6a8', '#ffffff', '#ffb3d1', '#b3d9ff'][Math.floor(rng.next() * 4)];
      ctx.beginPath();
      ctx.arc(x + 4, y - 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Oscurecer hacia los bordes del campo (encuadre)
  const vg = ctx.createLinearGradient(0, 0, W, 0);
  vg.addColorStop(0, 'rgba(20,60,20,0.28)');
  vg.addColorStop(0.08, 'rgba(0,0,0,0)');
  vg.addColorStop(0.92, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(20,60,20,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  return toTexture(c);
}

/** Sillares de piedra con juntas y variación de tono (se repite). */
export function stoneTexture(seed = 3, tint: [number, number, number] = [196, 188, 172]): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256);
  const rng = new Rng(seed);
  ctx.fillStyle = '#6f675c';
  ctx.fillRect(0, 0, 256, 256);
  const rows = 4;
  const rh = 256 / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 === 0 ? 0 : -32;
    while (x < 256) {
      const w = 48 + rng.next() * 32;
      const k = 0.86 + rng.next() * 0.22;
      const [cr, cg, cb] = tint.map((v) => Math.min(255, v * k));
      const grad = ctx.createLinearGradient(0, r * rh, 0, (r + 1) * rh);
      grad.addColorStop(0, `rgb(${cr + 18},${cg + 18},${cb + 18})`);
      grad.addColorStop(1, `rgb(${cr - 18},${cg - 18},${cb - 18})`);
      ctx.fillStyle = grad;
      const pad = 3;
      const rx = x + pad;
      const ry = r * rh + pad;
      const rw = w - pad * 2;
      const rhh = rh - pad * 2;
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rhh, 7);
      ctx.fill();
      // brillo superior y sombra inferior para dar volumen
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(rx + 4, ry + 3, rw - 8, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(rx + 4, ry + rhh - 6, rw - 8, 4);
      if (x + w > 256) {
        ctx.beginPath();
        ctx.roundRect(rx - 256, ry, rw, rhh, 7);
        ctx.fill();
      }
      x += w;
    }
  }
  return toTexture(c, true);
}

/** Tablones de madera con vetas. */
export function woodTexture(seed = 5): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 64);
  const rng = new Rng(seed);
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#c98a4b');
  g.addColorStop(1, '#a8682f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = 'rgba(110,60,25,0.45)';
  for (let i = 0; i < 14; i++) {
    ctx.lineWidth = 1 + rng.next() * 1.5;
    ctx.beginPath();
    const y = rng.next() * 64;
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 32) ctx.lineTo(x, y + Math.sin(x / 40 + i) * 3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(90,50,20,0.6)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(rng.next() * 256, rng.next() * 64, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c, true);
}

/** Tejas de tejado en escamas (color de equipo). */
export function roofTexture(base: string, dark: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, 256, 256);
  const rows = 8;
  const cols = 8;
  const w = 256 / cols;
  const h = 256 / rows;
  for (let r = 0; r < rows + 1; r++) {
    for (let col = -1; col < cols + 1; col++) {
      const x = col * w + (r % 2 ? w / 2 : 0);
      const y = r * h;
      const g = ctx.createLinearGradient(0, y - h, 0, y + h * 0.2);
      g.addColorStop(0, base);
      g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y, w / 2 - 1, h, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h * 0.25, w / 2 - 6, h * 0.25, 0, 0, Math.PI);
      ctx.fill();
    }
  }
  return toTexture(c, true);
}

/** Disco difuminado: sombra de contacto y partículas suaves. */
export function softDiscTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)'): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.45, inner.replace(/[\d.]+\)$/, '0.55)'));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = toTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** Destello en estrella para impactos. */
export function flareTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate((i * Math.PI) / 4);
    const lg = ctx.createLinearGradient(-64, 0, 64, 0);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.5, i % 2 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(-64, -3, 128, 6);
    ctx.restore();
  }
  const t = toTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** Anillo para ondas de choque en el suelo. */
export function ringTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 34, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.55, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = toTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** Terreno exterior (fuera del campo): hierba más oscura con manchas. */
export function outerGroundTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 512);
  const rng = new Rng(21);
  ctx.fillStyle = '#4f9a3d';
  ctx.fillRect(0, 0, 512, 512);
  blotches(ctx, 512, 512, rng, 160, ['rgba(110,180,70,0.35)', 'rgba(40,100,40,0.35)', 'rgba(140,190,80,0.25)'], 20, 70);
  return toTexture(c, true);
}
