// Fondo: gradientes morados, retratos de personajes, rayos de luz,
// partículas y destellos sincronizados con el pulso de la música.
import { getPortraitCanvas } from '../portraits.js';
import { glowSprite } from './sprites.js';

export function buildBackgroundLayer(g, dpr, deck) {
  const c = document.createElement('canvas');
  c.width = Math.round(g.viewW * dpr);
  c.height = Math.round(g.viewH * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = g.viewW, H = g.viewH;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1b0640');
  bg.addColorStop(0.35, '#2c0b5a');
  bg.addColorStop(0.7, '#14062e');
  bg.addColorStop(1, '#07020f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Retratos de los personajes del mazo detrás de la pista
  const ids = deck.map((d) => d.id);
  if (ids.length) {
    const wide = W > g.colW * 1.35;
    const count = wide ? Math.min(7, Math.max(5, Math.round(W / (g.colW * 0.42)))) : 3;
    const slots = [];
    const centerIdx = Math.floor(count / 2);
    for (let i = 0; i < count; i++) {
      const off = i - centerIdx;
      const pw = (off === 0 ? g.colW * 0.86 : g.colW * 0.62) * (wide ? 0.95 : 1);
      const x = g.cx + off * (wide ? g.colW * 0.52 : g.colW * 0.4) - pw / 2;
      const y = off === 0 ? -g.viewH * 0.02 : g.viewH * 0.04 + Math.abs(off) * g.viewH * 0.02;
      slots.push({ x, y, w: pw, alpha: off === 0 ? 0.42 : 0.3 - Math.abs(off) * 0.03, order: Math.abs(off) });
    }
    slots.sort((a, b) => b.order - a.order);
    slots.forEach((s, i) => {
      const img = getPortraitCanvas(ids[(i + 1) % ids.length]);
      ctx.globalAlpha = Math.max(0.15, s.alpha);
      ctx.drawImage(img, s.x, s.y, s.w, s.w * 1.25);
    });
    ctx.globalAlpha = 1;
  }

  // Tinte morado y degradado hacia abajo para que las notas se lean bien
  ctx.fillStyle = 'rgba(52,12,110,0.35)';
  ctx.fillRect(0, 0, W, H);
  const fade = ctx.createLinearGradient(0, g.farY - g.viewH * 0.12, 0, H);
  fade.addColorStop(0, 'rgba(10,2,26,0)');
  fade.addColorStop(0.35, 'rgba(10,2,26,0.75)');
  fade.addColorStop(1, 'rgba(5,1,12,0.95)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);

  // Suelo de rejilla en perspectiva fuera de la pista
  ctx.strokeStyle = 'rgba(160,90,255,0.12)';
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(g.cx + i * g.bottomHalf * 0.08, g.horizonY + (g.farY - g.horizonY));
    ctx.lineTo(g.cx + i * g.bottomHalf * 0.75, H);
    ctx.stroke();
  }

  // Marco de luces del escenario (arcos superiores)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i === 1 ? 'rgba(56,225,255,0.22)' : 'rgba(255,79,216,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(g.cx, g.farY + 6, g.colW * (0.36 + i * 0.12), g.viewH * (0.05 + i * 0.025), 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Viñeta
  const vig = ctx.createRadialGradient(g.cx, H * 0.5, Math.min(W, H) * 0.3, g.cx, H * 0.5, Math.max(W, H) * 0.8);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  return c;
}

export class BackgroundFX {
  constructor() {
    this.particles = [];
    for (let i = 0; i < 60; i++) this.particles.push(this.spawn(true));
    this.flash = 0;
    this.flashColor = '255,79,216';
  }

  spawn(initial = false) {
    const colors = ['rgba(255,79,216,0.9)', 'rgba(56,225,255,0.9)', 'rgba(255,210,63,0.9)', 'rgba(200,160,255,0.9)'];
    return {
      x: Math.random(),
      y: initial ? Math.random() : 1.05,
      vy: 0.015 + Math.random() * 0.04,
      vx: (Math.random() - 0.5) * 0.01,
      size: 2 + Math.random() * 7,
      color: colors[(Math.random() * colors.length) | 0],
      tw: Math.random() * Math.PI * 2,
    };
  }

  triggerFlash(color = '255,79,216', strength = 1) {
    this.flashColor = color;
    this.flash = Math.max(this.flash, strength);
  }

  draw(ctx, g, dt, pulse, songTime, rave, spectrum) {
    const W = g.viewW, H = g.viewH;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Rayos de luz (focos) que barren el escenario
    const beams = [
      { x: g.cx - g.colW * 0.55, a: 0.35, c: '255,79,216' },
      { x: g.cx + g.colW * 0.55, a: -0.35, c: '56,225,255' },
      { x: g.cx - g.colW * 0.2, a: 0.12, c: '180,120,255' },
      { x: g.cx + g.colW * 0.2, a: -0.12, c: '255,210,63' },
    ];
    beams.forEach((b, i) => {
      const ang = b.a + Math.sin(songTime * 0.6 + i * 1.7) * 0.28;
      const len = H * 0.95;
      const spread = 0.1 + 0.03 * Math.sin(songTime + i);
      const alpha = 0.05 + pulse * 0.07 + rave * 0.015;
      const grad = ctx.createLinearGradient(b.x, -10, b.x + Math.sin(ang) * len, Math.cos(ang) * len);
      grad.addColorStop(0, `rgba(${b.c},${alpha * 2.2})`);
      grad.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(b.x, -10);
      ctx.lineTo(b.x + Math.sin(ang - spread) * len, Math.cos(ang - spread) * len);
      ctx.lineTo(b.x + Math.sin(ang + spread) * len, Math.cos(ang + spread) * len);
      ctx.closePath();
      ctx.fill();
    });

    // Resplandor del horizonte
    const hr = ctx.createRadialGradient(g.cx, g.farY, 0, g.cx, g.farY, g.colW * 0.55);
    hr.addColorStop(0, `rgba(255,120,240,${0.25 + pulse * 0.25})`);
    hr.addColorStop(1, 'rgba(255,120,240,0)');
    ctx.fillStyle = hr;
    ctx.fillRect(g.cx - g.colW, g.farY - g.colW * 0.6, g.colW * 2, g.colW * 1.2);

    // Ecualizador a ambos lados del extremo lejano de la pista
    if (spectrum) {
      const bars = 12;
      const bw = (g.colW * 0.36) / bars;
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < bars; i++) {
          const v = spectrum[2 + i * 2] / 255;
          const h = 4 + v * g.viewH * 0.07;
          const x = g.cx + side * (g.bottomHalf * 0.2 + i * bw) - (side < 0 ? bw : 0);
          const gr = ctx.createLinearGradient(0, g.farY - h, 0, g.farY);
          gr.addColorStop(0, 'rgba(56,225,255,0.0)');
          gr.addColorStop(1, `rgba(${i % 2 ? '56,225,255' : '255,79,216'},${0.25 + v * 0.4})`);
          ctx.fillStyle = gr;
          ctx.fillRect(x + 1, g.farY - h - 4, bw - 2, h);
        }
      }
    }

    // Partículas
    for (const p of this.particles) {
      p.y -= p.vy * dt * (1 + rave * 0.4);
      p.x += p.vx * dt;
      p.tw += dt * 3;
      if (p.y < -0.05) Object.assign(p, this.spawn());
      const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(p.tw)) + pulse * 0.2;
      const s = p.size * (1 + pulse * 0.4);
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(glowSprite(p.color), p.x * W - s * 2, p.y * H - s * 2, s * 4, s * 4);
    }
    ctx.globalAlpha = 1;

    // Destello global (RAVE / combos)
    if (this.flash > 0.01) {
      const fl = ctx.createRadialGradient(g.cx, g.hitY, 0, g.cx, g.hitY, H);
      fl.addColorStop(0, `rgba(${this.flashColor},${0.45 * this.flash})`);
      fl.addColorStop(1, `rgba(${this.flashColor},0)`);
      ctx.fillStyle = fl;
      ctx.fillRect(0, 0, W, H);
      this.flash *= Math.pow(0.04, dt);
    }
    ctx.restore();
  }
}
