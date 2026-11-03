// Efectos visuales: explosiones de acierto, chispas, ondas de combo y RAVE.
import { NOTE_COLORS, LANES, NOTE_STATE } from '../constants.js';
import { xAt, laneCenterU, laneWidthAtScale } from '../perspective.js';
import { glowSprite } from './sprites.js';

const MAX_PARTICLES = 420;

export class EffectsRenderer {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.flares = [];
    this.waves = [];
  }

  clear() {
    this.particles.length = 0;
    this.rings.length = 0;
    this.flares.length = 0;
    this.waves.length = 0;
  }

  spark(x, y, color, n, speed, life = 0.5, up = 0) {
    for (let i = 0; i < n && this.particles.length < MAX_PARTICLES; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - up,
        life, max: life,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  }

  handle(ev, g, bg) {
    const r = laneWidthAtScale(g, 1) * 0.4;
    if (ev.kind === 'hit' || ev.kind === 'miss') {
      const x = xAt(g, 1, laneCenterU(ev.lane));
      const y = g.hitY;
      if (ev.kind === 'miss') {
        this.rings.push({ x, y, r0: r * 0.9, r1: r * 1.2, life: 0.25, max: 0.25, color: '120,120,150', width: 3 });
        return;
      }
      const col = NOTE_COLORS[ev.color] || NOTE_COLORS.pink;
      const rgb = col.glow.slice(5); // "r,g,b,"
      const tint = rgb.slice(0, -1);
      const big = ev.judgment === 'SPERFECT';
      const scale = ev.tail ? 0.7 : 1;
      this.rings.push({ x, y, r0: r * 0.8, r1: r * (big ? 2.6 : 2) * scale, life: 0.34, max: 0.34, color: tint, width: 5 });
      if (big) this.rings.push({ x, y, r0: r * 0.5, r1: r * 1.6 * scale, life: 0.24, max: 0.24, color: '255,255,255', width: 3 });
      this.flares.push({ x, y, size: r * (big ? 5 : 3.8) * scale, life: 0.2, max: 0.2, color: `rgba(${tint},0.95)`, star: big || ev.type === 'star' });
      this.spark(x, y, `rgba(${tint},0.95)`, big ? 16 : 10, r * 9 * scale, 0.5, r * 2);
      if (ev.type === 'star') this.spark(x, y, 'rgba(255,255,255,0.95)', 14, r * 12, 0.6, r * 3);
    } else if (ev.kind === 'rave') {
      bg.triggerFlash('255,79,216', 1);
      for (let l = 0; l < LANES; l++) {
        const x = xAt(g, 1, laneCenterU(l));
        this.spark(x, g.hitY, l % 2 ? 'rgba(56,225,255,0.95)' : 'rgba(255,210,63,0.95)', 10, r * 14, 0.9, r * 8);
      }
      this.waves.push({ life: 0.8, max: 0.8, color: '255,120,240' });
    } else if (ev.kind === 'combo') {
      bg.triggerFlash('56,225,255', 0.6);
      this.waves.push({ life: 0.6, max: 0.6, color: '56,225,255' });
    }
  }

  draw(ctx, g, dt, engine) {
    const r = laneWidthAtScale(g, 1) * 0.4;
    // chispas continuas mientras se mantiene una nota larga
    if (engine && engine.state === 'playing') {
      for (let l = 0; l < LANES; l++) {
        const h = engine.holding[l];
        if (h && h.state === NOTE_STATE.HOLDING) {
          const col = NOTE_COLORS[h.color];
          this.spark(xAt(g, 1, laneCenterU(l)), g.hitY, col.glow + '0.9)', 2, r * 5, 0.35, r * 6);
        }
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // ondas de combo / rave a lo largo de la línea de contacto
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.life -= dt;
      if (w.life <= 0) {
        this.waves.splice(i, 1);
        continue;
      }
      const k = 1 - w.life / w.max;
      const rx = g.bottomHalf * (0.2 + k * 1.3);
      ctx.strokeStyle = `rgba(${w.color},${(1 - k) * 0.8})`;
      ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath();
      ctx.ellipse(g.cx, g.hitY, rx, rx * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const o = this.rings[i];
      o.life -= dt;
      if (o.life <= 0) {
        this.rings.splice(i, 1);
        continue;
      }
      const k = 1 - o.life / o.max;
      const rad = o.r0 + (o.r1 - o.r0) * (1 - (1 - k) * (1 - k));
      ctx.strokeStyle = `rgba(${o.color},${1 - k})`;
      ctx.lineWidth = o.width * (1 - k) + 0.5;
      ctx.beginPath();
      ctx.arc(o.x, o.y, rad, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = this.flares.length - 1; i >= 0; i--) {
      const f = this.flares[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.flares.splice(i, 1);
        continue;
      }
      const k = f.life / f.max;
      const s = f.size * (1.2 - k * 0.4);
      ctx.globalAlpha = k;
      ctx.drawImage(glowSprite(f.color), f.x - s / 2, f.y - s / 2, s, s);
      if (f.star) {
        ctx.strokeStyle = `rgba(255,255,255,${k})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(f.x - s * 0.7, f.y);
        ctx.lineTo(f.x + s * 0.7, f.y);
        ctx.moveTo(f.x, f.y - s * 0.55);
        ctx.lineTo(f.x, f.y + s * 0.55);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += r * 14 * dt;
      p.vx *= 1 - 2 * dt;
      const k = p.life / p.max;
      const s = p.size * (0.5 + k);
      ctx.globalAlpha = k;
      ctx.drawImage(glowSprite(p.color), p.x - s * 2, p.y - s * 2, s * 4, s * 4);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
