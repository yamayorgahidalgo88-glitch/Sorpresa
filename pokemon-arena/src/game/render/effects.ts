import Phaser from 'phaser';
import type { Vec } from '../../sim/core/vec';
import { textStyle } from '../theme';

/** Efectos visuales efímeros (anillos, textos flotantes, rayos, partículas simples). */
export class Effects {
  constructor(private readonly scene: Phaser.Scene) {}

  ring(x: number, y: number, radius: number, color: number, duration = 380, width = 4): void {
    const c = this.scene.add.circle(x, y, radius * 0.25).setStrokeStyle(width, color, 1).setDepth(60);
    c.setFillStyle(color, 0.18);
    this.scene.tweens.add({ targets: c, radius, alpha: 0, duration, ease: 'Quad.Out', onComplete: () => c.destroy() });
  }

  floatText(x: number, y: number, text: string, color = '#ffffff', size = 18): void {
    const t = this.scene.add.text(x, y, text, textStyle(size, color)).setOrigin(0.5).setDepth(80);
    this.scene.tweens.add({ targets: t, y: y - 34, alpha: { from: 1, to: 0 }, duration: 700, ease: 'Quad.Out', onComplete: () => t.destroy() });
  }

  puff(x: number, y: number, color: number, count = 8, spread = 26): void {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const c = this.scene.add.circle(x, y, 4 + Math.random() * 4, color, 0.9).setDepth(55);
      this.scene.tweens.add({
        targets: c,
        x: x + Math.cos(a) * spread * (0.6 + Math.random() * 0.6),
        y: y + Math.sin(a) * spread * (0.6 + Math.random() * 0.6),
        alpha: 0,
        scale: 0.3,
        duration: 420 + Math.random() * 200,
        ease: 'Quad.Out',
        onComplete: () => c.destroy(),
      });
    }
  }

  /** Línea quebrada (descarga eléctrica) entre puntos de pantalla. */
  zigzag(points: Vec[], color = 0xfff27a, width = 4, duration = 220): void {
    const g = this.scene.add.graphics().setDepth(70);
    g.lineStyle(width, color, 1);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      g.beginPath();
      g.moveTo(a.x, a.y);
      const segs = 5;
      for (let s = 1; s < segs; s++) {
        const t = s / segs;
        const nx = -(b.y - a.y);
        const ny = b.x - a.x;
        const len = Math.hypot(nx, ny) || 1;
        const off = (Math.random() - 0.5) * 16;
        g.lineTo(a.x + (b.x - a.x) * t + (nx / len) * off, a.y + (b.y - a.y) * t + (ny / len) * off);
      }
      g.lineTo(b.x, b.y);
      g.strokePath();
    }
    this.scene.tweens.add({ targets: g, alpha: 0, duration, onComplete: () => g.destroy() });
  }

  /** Aviso del área de un hechizo antes de que impacte. */
  telegraph(x: number, y: number, radius: number, color: number, durationMs: number): void {
    const c = this.scene.add.circle(x, y, radius).setStrokeStyle(3, color, 0.9).setDepth(58);
    c.setFillStyle(color, 0.12);
    this.scene.tweens.add({ targets: c, alpha: { from: 1, to: 0.4 }, duration: Math.max(80, durationMs), onComplete: () => c.destroy() });
  }

  lightningStrike(x: number, y: number, radius: number): void {
    this.zigzag([{ x: x + 20, y: y - 420 }, { x: x - 10, y: y - 180 }, { x, y }], 0xfff7a0, 7, 260);
    this.ring(x, y, radius, 0xffe14d, 420, 6);
    this.scene.cameras.main.flash(90, 255, 250, 200, false);
  }

  blizzard(x: number, y: number, radius: number): void {
    this.ring(x, y, radius, 0xbff4ff, 600, 5);
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * radius;
      const f = this.scene.add.text(x + Math.cos(a) * d, y + Math.sin(a) * d - 30, '❄', textStyle(16, '#e8fbff')).setOrigin(0.5).setDepth(65);
      this.scene.tweens.add({ targets: f, y: f.y + 30, alpha: 0, angle: 90, duration: 700 + Math.random() * 300, onComplete: () => f.destroy() });
    }
  }

  notes(x: number, y: number, radius: number): void {
    this.ring(x, y, radius, 0xf6a8c8, 520, 4);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const n = this.scene.add.text(x + Math.cos(a) * 18, y + Math.sin(a) * 18, '♪', textStyle(20, '#ffd1e6')).setOrigin(0.5).setDepth(65);
      this.scene.tweens.add({ targets: n, x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius - 10, alpha: 0, duration: 700, onComplete: () => n.destroy() });
    }
  }

  explosion(x: number, y: number, radius: number): void {
    this.ring(x, y, radius, 0xff9a3a, 420, 7);
    this.puff(x, y, 0xffc35a, 12, radius);
    this.puff(x, y, 0x8e8a7c, 8, radius * 0.7);
    this.scene.cameras.main.shake(140, 0.006);
  }

  towerCollapse(x: number, y: number): void {
    this.puff(x, y, 0x9a9faa, 16, 60);
    this.puff(x, y, 0xffd23f, 8, 40);
    this.ring(x, y, 80, 0xffffff, 500, 6);
    this.scene.cameras.main.shake(280, 0.012);
  }
}
