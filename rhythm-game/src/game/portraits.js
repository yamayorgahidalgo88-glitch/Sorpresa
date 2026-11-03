// Ilustraciones originales generadas por código (sin imágenes externas).
import { CHAR_BY_ID } from './cards.js';

const W = 240;
const H = 300;
const canvasCache = new Map();
const urlCache = new Map();

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) {
    r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt;
  } else {
    r *= 1 + amt; g *= 1 + amt; b *= 1 + amt;
  }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function starPath(ctx, x, y, r1, r2, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = rot + (i * Math.PI) / n;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

function drawPortrait(ch) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const { accent, hairColor, skin, outfit, hair, acc } = ch;

  // ---- Fondo ----
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, shade(outfit, -0.3));
  bg.addColorStop(0.55, '#1a0838');
  bg.addColorStop(1, shade(outfit, -0.5));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(120, 130, 10, 120, 130, 170);
  glow.addColorStop(0, rgba(accent, 0.75));
  glow.addColorStop(0.45, rgba(accent, 0.18));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // rayos diagonales
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = rgba(i % 2 ? '#ffffff' : accent, 0.07);
    ctx.beginPath();
    const x = -40 + i * 62;
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 26, 0);
    ctx.lineTo(x + 126, H);
    ctx.lineTo(x + 100, H);
    ctx.fill();
  }
  // bokeh
  const seed = ch.id.split('').reduce((a, ch2) => a + ch2.charCodeAt(0), 0);
  for (let i = 0; i < 14; i++) {
    const x = (seed * (i + 3) * 37) % W;
    const y = (seed * (i + 7) * 53) % (H * 0.6);
    const r = 2 + ((seed + i * 11) % 9);
    ctx.fillStyle = rgba(i % 3 ? accent : '#ffffff', 0.16);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const hairDark = shade(hairColor, -0.35);
  const hairGrad = (y0, y1) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, shade(hairColor, 0.25));
    g.addColorStop(0.5, hairColor);
    g.addColorStop(1, hairDark);
    return g;
  };

  // ---- Pelo trasero ----
  if (hair === 'long') {
    ctx.fillStyle = hairGrad(60, 290);
    ctx.beginPath();
    ctx.moveTo(62, 120);
    ctx.bezierCurveTo(40, 190, 46, 250, 36, 292);
    ctx.lineTo(204, 292);
    ctx.bezierCurveTo(194, 250, 200, 190, 178, 120);
    ctx.closePath();
    ctx.fill();
  } else if (hair === 'bob') {
    ctx.fillStyle = hairGrad(60, 220);
    ctx.beginPath();
    ctx.moveTo(60, 120);
    ctx.bezierCurveTo(46, 170, 52, 214, 76, 222);
    ctx.lineTo(164, 222);
    ctx.bezierCurveTo(188, 214, 194, 170, 180, 120);
    ctx.closePath();
    ctx.fill();
  } else if (hair === 'bun') {
    ctx.fillStyle = hairGrad(30, 90);
    ctx.beginPath();
    ctx.arc(120, 62, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Cuerpo ----
  const body = ctx.createLinearGradient(0, 220, 0, H);
  body.addColorStop(0, shade(outfit, 0.15));
  body.addColorStop(1, shade(outfit, -0.3));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(14, H);
  ctx.bezierCurveTo(20, 252, 52, 236, 92, 226);
  ctx.lineTo(148, 226);
  ctx.bezierCurveTo(188, 236, 220, 252, 226, H);
  ctx.closePath();
  ctx.fill();
  // camisa interior en V
  ctx.fillStyle = shade(accent, 0.55);
  ctx.beginPath();
  ctx.moveTo(98, 226);
  ctx.lineTo(120, 272);
  ctx.lineTo(142, 226);
  ctx.closePath();
  ctx.fill();
  // solapas con acento
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(92, 228);
  ctx.lineTo(120, 282);
  ctx.lineTo(148, 228);
  ctx.stroke();
  ctx.strokeStyle = rgba('#ffffff', 0.25);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 262);
  ctx.lineTo(60, 300);
  ctx.moveTo(200, 262);
  ctx.lineTo(180, 300);
  ctx.stroke();

  // ---- Cuello ----
  ctx.fillStyle = shade(skin, -0.12);
  ctx.fillRect(106, 190, 28, 42);
  ctx.fillStyle = rgba('#000000', 0.12);
  ctx.fillRect(106, 200, 28, 10);

  // ---- Orejas ----
  ctx.fillStyle = shade(skin, -0.05);
  for (const x of [66, 174]) {
    ctx.beginPath();
    ctx.ellipse(x, 146, 8, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Cara ----
  const face = ctx.createLinearGradient(70, 0, 170, 0);
  face.addColorStop(0, skin);
  face.addColorStop(0.75, skin);
  face.addColorStop(1, shade(skin, -0.12));
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.moveTo(68, 122);
  ctx.bezierCurveTo(66, 172, 96, 206, 120, 211);
  ctx.bezierCurveTo(144, 206, 174, 172, 172, 122);
  ctx.bezierCurveTo(172, 66, 68, 66, 68, 122);
  ctx.fill();

  // ---- Ojos ----
  for (const [x, dir] of [[97, -1], [143, 1]]) {
    // iris
    const iris = ctx.createLinearGradient(0, 136, 0, 162);
    iris.addColorStop(0, '#1b0f2e');
    iris.addColorStop(0.6, shade(accent, -0.25));
    iris.addColorStop(1, shade(accent, 0.3));
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, 150, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.ellipse(x, 150, 8.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0614';
    ctx.beginPath();
    ctx.ellipse(x, 151, 4, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 3, 145, 3, 0, Math.PI * 2);
    ctx.arc(x + 3.5, 155, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // línea superior (pestañas)
    ctx.strokeStyle = '#1a0f1f';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 13, 146);
    ctx.quadraticCurveTo(x, 134, x + 13, 144);
    ctx.lineTo(x + 13 + dir * 3, 141);
    ctx.stroke();
    // ceja
    ctx.strokeStyle = shade(hairColor, -0.45);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 11, 128 - (dir < 0 ? 0 : 1));
    ctx.quadraticCurveTo(x, 122, x + 11, 127);
    ctx.stroke();
  }
  // rubor
  ctx.fillStyle = 'rgba(255,110,150,0.22)';
  for (const x of [88, 152]) {
    ctx.beginPath();
    ctx.ellipse(x, 172, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // nariz y boca
  ctx.strokeStyle = shade(skin, -0.3);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(121, 164);
  ctx.lineTo(118, 172);
  ctx.stroke();
  ctx.strokeStyle = '#b4485e';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(110, 186);
  ctx.quadraticCurveTo(120, 192, 130, 185);
  ctx.stroke();

  // ---- Pelo frontal ----
  ctx.fillStyle = hairGrad(60, 150);
  ctx.beginPath();
  if (hair === 'spiky') {
    ctx.moveTo(60, 140);
    ctx.lineTo(54, 96);
    ctx.lineTo(70, 100);
    ctx.lineTo(66, 62);
    ctx.lineTo(90, 80);
    ctx.lineTo(100, 44);
    ctx.lineTo(118, 74);
    ctx.lineTo(140, 42);
    ctx.lineTo(146, 78);
    ctx.lineTo(176, 58);
    ctx.lineTo(170, 96);
    ctx.lineTo(188, 98);
    ctx.lineTo(180, 140);
    ctx.lineTo(166, 112);
    ctx.lineTo(150, 128);
    ctx.lineTo(138, 108);
    ctx.lineTo(122, 130);
    ctx.lineTo(108, 106);
    ctx.lineTo(92, 128);
    ctx.lineTo(80, 108);
    ctx.lineTo(70, 134);
  } else if (hair === 'side') {
    ctx.moveTo(60, 150);
    ctx.bezierCurveTo(52, 70, 120, 48, 168, 70);
    ctx.bezierCurveTo(186, 84, 188, 120, 180, 150);
    ctx.bezierCurveTo(176, 126, 170, 112, 162, 104);
    ctx.bezierCurveTo(140, 124, 110, 134, 76, 138);
    ctx.bezierCurveTo(100, 124, 112, 112, 118, 100);
    ctx.bezierCurveTo(100, 112, 80, 120, 66, 150);
  } else {
    // flequillo con mechones (long, bob, short, bun)
    ctx.moveTo(58, 150);
    ctx.bezierCurveTo(50, 80, 100, 50, 120, 52);
    ctx.bezierCurveTo(140, 50, 190, 80, 182, 150);
    ctx.lineTo(172, 118);
    ctx.lineTo(162, 132);
    ctx.lineTo(152, 108);
    ctx.lineTo(138, 128);
    ctx.lineTo(126, 104);
    ctx.lineTo(112, 128);
    ctx.lineTo(100, 106);
    ctx.lineTo(88, 130);
    ctx.lineTo(78, 112);
    ctx.lineTo(68, 132);
  }
  ctx.closePath();
  ctx.fill();
  if (hair === 'long' || hair === 'bob') {
    // mechones laterales que enmarcan la cara
    ctx.fillStyle = hairGrad(100, 220);
    for (const side of [-1, 1]) {
      const x0 = 120 + side * 56;
      ctx.beginPath();
      ctx.moveTo(x0, 110);
      ctx.bezierCurveTo(x0 + side * 4, 160, x0 - side * 2, 190, x0 - side * 10, hair === 'long' ? 236 : 210);
      ctx.bezierCurveTo(x0 - side * 6, 180, x0 - side * 10, 150, x0 - side * 12, 120);
      ctx.closePath();
      ctx.fill();
    }
  }
  // brillo del pelo
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(120, 112, 48, Math.PI * 1.15, Math.PI * 1.45);
  ctx.stroke();

  // ---- Accesorios ----
  if (acc === 'headphones') {
    ctx.strokeStyle = '#1b1b28';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(120, 140, 66, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    for (const x of [58, 182]) {
      ctx.fillStyle = '#262236';
      ctx.beginPath();
      ctx.ellipse(x, 150, 13, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.ellipse(x, 150, 6, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (acc === 'earring') {
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(174, 164, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (acc === 'star') {
    ctx.fillStyle = '#fff3a0';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    starPath(ctx, 158, 84, 13, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ---- Viñeta ----
  const vig = ctx.createRadialGradient(120, 150, 80, 120, 150, 210);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,0,25,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  return c;
}

export function getPortraitCanvas(id) {
  if (!canvasCache.has(id)) canvasCache.set(id, drawPortrait(CHAR_BY_ID[id]));
  return canvasCache.get(id);
}

export function getPortraitURL(id) {
  if (!urlCache.has(id)) urlCache.set(id, getPortraitCanvas(id).toDataURL('image/png'));
  return urlCache.get(id);
}

export { starPath };
