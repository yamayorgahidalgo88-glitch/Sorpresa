// Sprites pre-renderizados (notas y destellos) para dibujar rápido en cada fotograma.
import { NOTE_COLORS } from '../constants.js';
import { starPath } from '../portraits.js';

const SIZE = 160; // el sprite mide 4 radios de nota (radio de nota = 40)
const cache = new Map();

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function noteSprite(colorId, type = 'tap') {
  const key = `${colorId}:${type}`;
  if (cache.has(key)) return cache.get(key);
  const col = NOTE_COLORS[colorId];
  const c = makeCanvas(SIZE, SIZE);
  const ctx = c.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2;

  // sombra de profundidad
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 16, 38, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // halo
  const halo = ctx.createRadialGradient(cx, cy, 20, cx, cy, 78);
  halo.addColorStop(0, col.glow + '0.75)');
  halo.addColorStop(0.5, col.glow + '0.25)');
  halo.addColorStop(1, col.glow + '0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // borde luminoso
  const ring = ctx.createLinearGradient(cx, cy - 42, cx, cy + 42);
  ring.addColorStop(0, '#ffffff');
  ring.addColorStop(0.5, col.light);
  ring.addColorStop(1, col.main);
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, 41, 0, Math.PI * 2);
  ctx.fill();

  // cuerpo
  const body = ctx.createRadialGradient(cx - 9, cy - 11, 4, cx, cy, 34);
  body.addColorStop(0, col.light);
  body.addColorStop(0.45, col.main);
  body.addColorStop(1, col.dark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fill();

  // anillo interior
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, type === 'hold' ? 22 : 26, 0, Math.PI * 2);
  ctx.stroke();

  if (type === 'star') {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = col.main;
    ctx.shadowBlur = 10;
    starPath(ctx, cx, cy + 1, 25, 11);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // núcleo brillante
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.6, 'rgba(255,255,255,0.85)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  if (type === 'hold') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy + 4);
    ctx.lineTo(cx, cy - 6);
    ctx.lineTo(cx + 9, cy + 4);
    ctx.stroke();
  }

  // brillo especular
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, 30, Math.PI * 1.15, Math.PI * 1.45);
  ctx.stroke();

  cache.set(key, c);
  return c;
}

export function glowSprite(colorCss) {
  const key = `glow:${colorCss}`;
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(64, 64);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, colorCss);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  cache.set(key, c);
  return c;
}

export const SPRITE_RADIUS_FACTOR = 2; // tamaño de dibujo = radio * 4 (mitad = 2r)
