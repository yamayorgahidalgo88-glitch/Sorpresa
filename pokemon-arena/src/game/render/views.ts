import Phaser from 'phaser';
import type { TowerEntity, UnitEntity } from '../../sim/core/state';
import { TILE } from '../layout';
import { COLORS, darken, textStyle } from '../theme';
import { bake, creatureTexture } from './creatureArt';
import type { TowerRole } from '../../sim/data/arena';
import type { Team } from '../../sim/core/state';

const FLY_OFFSET = 18;

/** Representación gráfica de una tropa. Solo lee el estado de la simulación. */
export class UnitView {
  readonly root: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Container;
  private readonly flash: Phaser.GameObjects.Arc;
  private readonly hp: Phaser.GameObjects.Graphics;
  private readonly deployArc: Phaser.GameObjects.Graphics;
  private readonly status: Phaser.GameObjects.Text;
  private readonly slowRing: Phaser.GameObjects.Arc;
  private readonly r: number;
  private readonly flying: boolean;
  private lastX = NaN;
  private moving = false;
  private lungeTween: Phaser.Tweens.Tween | null = null;
  dying = false;

  constructor(private readonly scene: Phaser.Scene, u: UnitEntity) {
    this.r = u.radius * TILE;
    this.flying = u.locomotion === 'aire';
    const team = COLORS.team[u.team];
    this.root = scene.add.container(0, 0).setDepth(this.flying ? 30 : 20);

    const shadow = scene.add.ellipse(0, this.r * 0.55, this.r * 1.9, this.r * 0.8, 0x000000, this.flying ? 0.18 : 0.28);
    const ring = scene.add.ellipse(0, this.r * 0.55, this.r * 2.1, this.r * 0.95);
    ring.setStrokeStyle(3, team, 0.95).setFillStyle(team, 0.25);
    this.body = scene.add.container(0, this.flying ? -FLY_OFFSET : 0);
    const art = scene.add.image(0, 0, creatureTexture(scene, u.cardId, this.r));
    // Contorno con el color del equipo para distinguir aliados y rivales.
    const outline = scene.add.circle(0, 0, this.r + 2).setStrokeStyle(3, team, 1);
    outline.setFillStyle(0, 0);
    this.flash = scene.add.circle(0, 0, this.r, 0xffffff, 0);
    this.slowRing = scene.add.circle(0, 0, this.r + 5).setStrokeStyle(3, 0x9be7ff, 0.9).setVisible(false);
    this.body.add([outline, art, this.flash, this.slowRing]);
    this.hp = scene.add.graphics();
    this.deployArc = scene.add.graphics();
    this.status = scene.add.text(this.r * 0.6, -this.r - 26, 'Zz', textStyle(16, '#e6f0ff')).setOrigin(0.5).setVisible(false);
    this.root.add([shadow, ring, this.body, this.hp, this.deployArc, this.status]);

    // Aparición: cae y rebota.
    this.body.setScale(0.2);
    scene.tweens.add({ targets: this.body, scale: 1, duration: 260, ease: 'Back.Out' });
  }

  sync(u: UnitEntity, x: number, y: number, time: number, tick: number): void {
    if (this.dying) return;
    if (!Number.isNaN(this.lastX)) {
      const dx = x - this.lastX;
      this.moving = Math.abs(dx) > 0.05 || Math.abs(y - this.root.y) > 0.05;
      if (Math.abs(dx) > 0.3) this.body.scaleX = dx < 0 ? -Math.abs(this.body.scaleY) : Math.abs(this.body.scaleY);
    }
    this.lastX = x;
    this.root.setPosition(x, y);
    this.root.setDepth((this.flying ? 1000 : 0) + 20 + y / 1000);
    if (!this.lungeTween) {
      const bob = this.flying ? Math.sin(time / 220) * 3 : this.moving ? -Math.abs(Math.sin(time / 90)) * 3 : 0;
      this.body.y = (this.flying ? -FLY_OFFSET : 0) + bob;
    }

    const stunned = tick < u.status.stunUntil;
    this.status.setVisible(stunned);
    this.slowRing.setVisible(tick < u.status.slowUntil);
    this.body.setAlpha(u.deployTicks > 0 ? 0.55 : 1);

    const w = Math.max(28, this.r * 2 + 8);
    const top = -this.r - 14 - (this.flying ? FLY_OFFSET : 0);
    const frac = Math.max(0, u.hp / u.maxHp);
    this.hp.clear();
    this.hp.fillStyle(0x0b1022, 0.85).fillRoundedRect(-w / 2 - 1, top - 1, w + 2, 7, 3);
    this.hp.fillStyle(frac > 0.35 ? COLORS.team[u.team] : COLORS.danger, 1).fillRoundedRect(-w / 2, top, Math.max(2, w * frac), 5, 2);

    this.deployArc.clear();
    if (u.deployTicks > 0) {
      const p = u.deployTicks / 20;
      this.deployArc.lineStyle(3, 0xffffff, 0.9);
      this.deployArc.beginPath();
      this.deployArc.arc(0, this.flying ? -FLY_OFFSET : 0, this.r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p), false);
      this.deployArc.strokePath();
    }
  }

  hitFlash(): void {
    this.scene.tweens.add({ targets: this.flash, fillAlpha: { from: 0.75, to: 0 }, duration: 140 });
  }

  /** Embestida hacia el objetivo (cuerpo a cuerpo) o retroceso (a distancia). */
  attack(tx: number, ty: number, melee: boolean): void {
    if (this.dying) return;
    const dx = tx - this.root.x;
    const dy = ty - this.root.y;
    const d = Math.hypot(dx, dy) || 1;
    const amount = melee ? 9 : -4;
    this.lungeTween?.stop();
    const baseY = this.flying ? -FLY_OFFSET : 0;
    this.body.x = 0;
    this.body.y = baseY;
    this.lungeTween = this.scene.tweens.add({
      targets: this.body,
      x: (dx / d) * amount,
      y: baseY + (dy / d) * amount,
      duration: melee ? 80 : 60,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => (this.lungeTween = null),
      onStop: () => (this.lungeTween = null),
    });
  }

  die(): void {
    if (this.dying) return;
    this.dying = true;
    this.hp.clear();
    this.deployArc.clear();
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      scale: 0.4,
      angle: 25,
      duration: 320,
      ease: 'Quad.In',
      onComplete: () => this.root.destroy(),
    });
  }

  get bodyY(): number {
    return this.root.y + (this.flying ? -FLY_OFFSET : 0);
  }
}

/** Torre guardiana o base. */
export class TowerView {
  readonly root: Phaser.GameObjects.Container;
  private readonly art: Phaser.GameObjects.Image;
  private readonly hp: Phaser.GameObjects.Graphics;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly sleep: Phaser.GameObjects.Text;
  private readonly flash: Phaser.GameObjects.Arc;
  private readonly r: number;
  private destroyedDrawn = false;

  constructor(private readonly scene: Phaser.Scene, t: TowerEntity, x: number, y: number) {
    this.r = t.radius * TILE;
    this.root = scene.add.container(x, y).setDepth(10 + y / 1000);
    this.art = scene.add.image(0, 0, towerTexture(scene, this.r, t.team, t.role, false));
    this.flash = scene.add.circle(0, -6, this.r * 0.8, 0xffffff, 0);
    this.hp = scene.add.graphics();
    this.hpText = scene.add.text(0, 0, '', textStyle(13)).setOrigin(0.5);
    this.sleep = scene.add.text(this.r * 0.55, -this.r - 12, 'Zz', textStyle(18, '#e6f0ff')).setOrigin(0.5);
    this.root.add([this.art, this.flash, this.hp, this.hpText, this.sleep]);
    this.scene.tweens.add({ targets: this.sleep, y: '-=6', alpha: 0.5, yoyo: true, repeat: -1, duration: 900 });
    this.sync(t);
  }

  sync(t: TowerEntity): void {
    if (t.destroyed) {
      if (!this.destroyedDrawn) {
        this.destroyedDrawn = true;
        this.art.setTexture(towerTexture(this.scene, this.r, t.team, t.role, true));
        this.hp.clear();
        this.hpText.setVisible(false);
        this.sleep.setVisible(false);
      }
      return;
    }
    this.sleep.setVisible(t.role === 'base' && !t.active);
    const w = this.r * 2.2;
    const y = this.r + 6;
    const frac = t.hp / t.maxHp;
    this.hp.clear();
    this.hp.fillStyle(0x0b1022, 0.9).fillRoundedRect(-w / 2 - 2, y - 2, w + 4, 16, 5);
    this.hp.fillStyle(frac > 0.3 ? COLORS.team[t.team] : COLORS.danger, 1).fillRoundedRect(-w / 2, y, Math.max(3, w * frac), 12, 4);
    this.hpText.setPosition(0, y + 6).setText(String(t.hp));
  }

  hitFlash(): void {
    this.scene.tweens.add({ targets: this.flash, fillAlpha: { from: 0.6, to: 0 }, duration: 120 });
  }

  shoot(): void {
    this.scene.tweens.add({ targets: this.art, scaleY: 0.94, duration: 60, yoyo: true });
  }
}

function towerTexture(scene: Phaser.Scene, r: number, team: Team, role: TowerRole, rubble: boolean): string {
  const size = Math.ceil(r * 2.6);
  const key = rubble ? `torre-ruinas-${size}` : `torre-${team}-${role === 'base' ? 'base' : 'guardia'}-${size}`;
  return bake(scene, key, size, size, (g) => (rubble ? drawRubble(g, r) : drawTower(g, r, team, role)), size / 2, size / 2);
}

function drawTower(g: Phaser.GameObjects.Graphics, r: number, team: Team, role: TowerRole): void {
  const color = COLORS.team[team];
  g.fillStyle(0x000000, 0.25).fillEllipse(4, r * 0.55, r * 2.3, r * 1.1);
  // Plataforma octogonal de piedra
  const oct = (rad: number, cy: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      return { x: Math.cos(a) * rad, y: cy + Math.sin(a) * rad * 0.8 };
    });
  g.fillStyle(0x8a8f9e, 1).fillPoints(oct(r * 1.05, r * 0.15), true);
  g.fillStyle(0xb5bac8, 1).fillPoints(oct(r * 0.95, 0), true);
  g.fillStyle(darken(color, 0.75), 1).fillCircle(0, -r * 0.12, r * 0.72);
  g.fillStyle(color, 1).fillCircle(0, -r * 0.18, r * 0.64);
  g.lineStyle(4, 0xffffff, 0.95).strokeCircle(0, -r * 0.18, r * 0.64);
  // Emblema: estrella para la base, rombo para las guardianas
  g.fillStyle(role === 'base' ? COLORS.gold : 0xffffff, 1);
  if (role === 'base') {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r * 0.42 : r * 0.18;
      return { x: Math.cos(a) * rr, y: -r * 0.18 + Math.sin(a) * rr };
    });
    g.fillPoints(pts, true);
  } else {
    g.fillPoints([{ x: 0, y: -r * 0.52 }, { x: r * 0.26, y: -r * 0.18 }, { x: 0, y: r * 0.16 }, { x: -r * 0.26, y: -r * 0.18 }], true);
  }
}

function drawRubble(g: Phaser.GameObjects.Graphics, r: number): void {
  g.fillStyle(0x000000, 0.2).fillEllipse(0, r * 0.4, r * 2.2, r);
  g.fillStyle(0x6f7380, 1);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    g.fillCircle(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.35, r * (0.18 + (i % 3) * 0.06));
  }
  g.fillStyle(0x50535c, 1).fillCircle(0, 0, r * 0.3);
}
