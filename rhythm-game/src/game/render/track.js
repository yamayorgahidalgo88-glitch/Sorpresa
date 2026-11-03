// Pista trapezoidal en perspectiva con 5 carriles (equivalente a GameTrack/GameLane).
import { LANES } from '../constants.js';
import { FAR_SCALE, yAtScale, xAt, laneCenterU, laneWidthAtScale, scaleForTime } from '../perspective.js';
import { glowSprite } from './sprites.js';

export const LANE_TINTS = ['255,79,216', '56,225,255', '255,210,63', '56,225,255', '255,79,216'];
const NEAR_SCALE = 1.14; // la pista continúa un poco por debajo de la línea de contacto

function trapezoid(ctx, g, s0, s1, u0 = 0, u1 = 1) {
  ctx.beginPath();
  ctx.moveTo(xAt(g, s0, u0), yAtScale(g, s0));
  ctx.lineTo(xAt(g, s0, u1), yAtScale(g, s0));
  ctx.lineTo(xAt(g, s1, u1), yAtScale(g, s1));
  ctx.lineTo(xAt(g, s1, u0), yAtScale(g, s1));
  ctx.closePath();
}

export function buildTrackLayer(g, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.round(g.viewW * dpr);
  c.height = Math.round(g.viewH * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);

  const yFar = yAtScale(g, FAR_SCALE);
  const yNear = yAtScale(g, NEAR_SCALE);

  // Resplandor exterior
  ctx.save();
  ctx.shadowColor = 'rgba(255,79,216,0.9)';
  ctx.shadowBlur = 30;
  trapezoid(ctx, g, FAR_SCALE, NEAR_SCALE);
  ctx.fillStyle = 'rgba(30,8,70,0.9)';
  ctx.fill();
  ctx.restore();

  // Relleno principal
  trapezoid(ctx, g, FAR_SCALE, NEAR_SCALE);
  const fill = ctx.createLinearGradient(0, yFar, 0, yNear);
  fill.addColorStop(0, 'rgba(40,12,90,0.92)');
  fill.addColorStop(0.6, 'rgba(22,6,52,0.94)');
  fill.addColorStop(1, 'rgba(12,3,30,0.97)');
  ctx.fillStyle = fill;
  ctx.fill();

  // Tinte alterno por carril
  for (let l = 0; l < LANES; l++) {
    trapezoid(ctx, g, FAR_SCALE, NEAR_SCALE, l / LANES, (l + 1) / LANES);
    const lg = ctx.createLinearGradient(0, yFar, 0, yNear);
    lg.addColorStop(0, `rgba(${LANE_TINTS[l]},0.02)`);
    lg.addColorStop(1, `rgba(${LANE_TINTS[l]},${l % 2 ? 0.07 : 0.05})`);
    ctx.fillStyle = lg;
    ctx.fill();
  }

  // Divisores de carril luminosos que convergen al punto de fuga
  for (let i = 1; i < LANES; i++) {
    const u = i / LANES;
    const grad = ctx.createLinearGradient(0, yFar, 0, yNear);
    grad.addColorStop(0, 'rgba(170,220,255,0.12)');
    grad.addColorStop(1, 'rgba(170,220,255,0.6)');
    for (const [w, a] of [[6, 0.25], [1.6, 1]]) {
      ctx.globalAlpha = a;
      ctx.strokeStyle = grad;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(xAt(g, FAR_SCALE, u), yFar);
      ctx.lineTo(xAt(g, NEAR_SCALE, u), yNear);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Bordes exteriores (raíles de neón)
  for (const [u, col] of [[0, '255,79,216'], [1, '56,225,255']]) {
    const grad = ctx.createLinearGradient(0, yFar, 0, yNear);
    grad.addColorStop(0, `rgba(${col},0.35)`);
    grad.addColorStop(1, `rgba(${col},1)`);
    ctx.save();
    ctx.shadowColor = `rgba(${col},1)`;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(xAt(g, FAR_SCALE, u), yFar);
    ctx.lineTo(xAt(g, NEAR_SCALE, u), yNear);
    ctx.stroke();
    ctx.restore();
  }

  // Borde lejano
  ctx.strokeStyle = 'rgba(255,180,250,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xAt(g, FAR_SCALE, 0), yFar);
  ctx.lineTo(xAt(g, FAR_SCALE, 1), yFar);
  ctx.stroke();

  // Zona de contacto: banda luminosa
  const hy = g.hitY;
  const x0 = xAt(g, 1, -0.02), x1 = xAt(g, 1, 1.02);
  const band = ctx.createLinearGradient(0, hy - 26, 0, hy + 26);
  band.addColorStop(0, 'rgba(255,79,216,0)');
  band.addColorStop(0.5, 'rgba(255,140,240,0.35)');
  band.addColorStop(1, 'rgba(56,225,255,0)');
  ctx.fillStyle = band;
  ctx.fillRect(x0, hy - 26, x1 - x0, 52);
  ctx.save();
  ctx.shadowColor = '#ff8af0';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#ffe9fd';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, hy);
  ctx.lineTo(x1, hy);
  ctx.stroke();
  ctx.restore();

  // Receptores (indicadores de carril)
  const r = laneWidthAtScale(g, 1) * 0.4;
  for (let l = 0; l < LANES; l++) {
    const x = xAt(g, 1, laneCenterU(l));
    ctx.save();
    ctx.shadowColor = `rgba(${LANE_TINTS[l]},1)`;
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(15,4,35,0.75)';
    ctx.beginPath();
    ctx.arc(x, hy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${LANE_TINTS[l]},0.95)`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, hy, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
  }
  return c;
}

// Elementos dinámicos de la pista: líneas de pulso, haces de carril pulsado
export function drawTrackDynamic(ctx, g, ctxInfo) {
  const { songTime, approach, beat, beatOffset, laneDown, lanePressPerf, perf, pulse, showKeys, keyLabels } = ctxInfo;

  // Líneas de pulso sincronizadas con la música
  if (beat > 0) {
    const kStart = Math.ceil((songTime - 0.1 - beatOffset) / beat);
    const kEnd = Math.floor((songTime + approach - beatOffset) / beat);
    for (let k = Math.max(0, kStart); k <= kEnd; k++) {
      const tb = beatOffset + k * beat;
      const s = scaleForTime(tb - songTime, approach);
      if (s < FAR_SCALE) continue;
      const y = yAtScale(g, s);
      const depth = (s - FAR_SCALE) / (1 - FAR_SCALE);
      const bar = k % 4 === 0;
      ctx.strokeStyle = bar ? `rgba(255,170,250,${0.15 + depth * 0.45})` : `rgba(150,200,255,${0.06 + depth * 0.2})`;
      ctx.lineWidth = (bar ? 2.5 : 1.2) * Math.max(0.4, s);
      ctx.beginPath();
      ctx.moveTo(xAt(g, s, 0), y);
      ctx.lineTo(xAt(g, s, 1), y);
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // Pulso de la línea de contacto con el ritmo
  const hy = g.hitY;
  const x0 = xAt(g, 1, 0), x1 = xAt(g, 1, 1);
  ctx.fillStyle = `rgba(255,120,240,${0.08 + pulse * 0.22})`;
  ctx.fillRect(x0, hy - 4 - pulse * 6, x1 - x0, 8 + pulse * 12);

  // Haces de luz de los carriles pulsados
  const r = laneWidthAtScale(g, 1) * 0.4;
  for (let l = 0; l < LANES; l++) {
    const since = (perf - lanePressPerf[l]) / 1000;
    const active = laneDown[l] ? 1 : Math.max(0, 1 - since / 0.18);
    if (active <= 0) continue;
    const tint = LANE_TINTS[l];
    const sTop = 0.42;
    trapezoid(ctx, g, sTop, 1, l / LANES + 0.01, (l + 1) / LANES - 0.01);
    const grad = ctx.createLinearGradient(0, yAtScale(g, sTop), 0, hy);
    grad.addColorStop(0, `rgba(${tint},0)`);
    grad.addColorStop(1, `rgba(${tint},${0.45 * active})`);
    ctx.fillStyle = grad;
    ctx.fill();
    const x = xAt(g, 1, laneCenterU(l));
    ctx.globalAlpha = active;
    ctx.drawImage(glowSprite(`rgba(${tint},0.9)`), x - r * 1.8, hy - r * 1.8, r * 3.6, r * 3.6);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  if (showKeys && keyLabels) {
    ctx.font = `700 ${Math.max(10, r * 0.55)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let l = 0; l < LANES; l++) {
      const x = xAt(g, 1, laneCenterU(l));
      ctx.fillStyle = laneDown[l] ? '#ffffff' : 'rgba(255,255,255,0.55)';
      ctx.fillText(keyLabels[l], x, hy + r * 1.55);
    }
  }
}
