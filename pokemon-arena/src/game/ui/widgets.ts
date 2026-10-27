import Phaser from 'phaser';
import type { Card } from '../../sim/data/cards';
import { ROLE_NAMES, getCard } from '../../sim/data/cards';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../../sim/data/elements';
import { bake, drawCreature, drawSpellIcon } from '../render/creatureArt';
import { COLORS, css, darken, textStyle } from '../theme';

/** Resumen táctico de una carta (para tarjetas, colección y tooltips). */
export function cardStatsLine(card: Card): string {
  if (card.kind === 'hechizo') return `Daño ${card.damage} · Radio ${card.radius}`;
  const n = card.count > 1 ? ` x${card.count}` : '';
  return `PS ${card.hp}${n} · Daño ${card.damage}`;
}

export function targetsLabel(card: Card): string {
  if (card.kind === 'hechizo') return 'Área';
  if (card.targets === 'edificios') return 'Solo torres';
  if (card.targets === 'tierra') return 'Ataca: tierra';
  return 'Ataca: aire y tierra';
}

/**
 * Tarjeta de carta reutilizable. `compact` reduce los textos (para la "siguiente carta").
 */
export class CardWidget {
  readonly root: Phaser.GameObjects.Container;
  private readonly dim: Phaser.GameObjects.Graphics;
  private readonly selectGlow: Phaser.GameObjects.Graphics;
  private readonly fill: Phaser.GameObjects.Graphics;
  private cardId = '';
  private affordKey = '';
  private lockOverlay: Phaser.GameObjects.Container | null = null;
  private content: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    readonly w: number,
    readonly h: number,
    private readonly compact = false,
  ) {
    this.root = scene.add.container(x, y).setDepth(200);
    this.selectGlow = scene.add.graphics();
    this.dim = scene.add.graphics();
    this.fill = scene.add.graphics();
    this.root.add([this.selectGlow]);
  }

  setCard(cardId: string): void {
    if (cardId === this.cardId) return;
    this.cardId = cardId;
    for (const o of this.content) o.destroy();
    this.content = [];
    const card = getCard(cardId);
    const color = ELEMENT_COLORS[card.types[0]];
    const { w, h, scene } = this;

    const r = this.compact ? h * 0.17 : h * 0.16;
    const cr = this.compact ? 12 : 16;
    const pw = this.compact ? 10 : 12;
    // Fondo, ilustración, tipos y burbuja de coste se hornean en una sola textura.
    const faceKey = bake(scene, `carta-${card.id}-${w}x${h}`, w + 4, h + 6, (g) => {
      g.fillStyle(0x0b1022, 0.6).fillRoundedRect(3, 5, w, h, 12);
      g.fillStyle(darken(color, 0.45), 1).fillRoundedRect(0, 0, w, h, 12);
      g.fillStyle(darken(color, 0.75), 1).fillRoundedRect(4, 4, w - 8, h * 0.58, 9);
      g.lineStyle(3, color, 1).strokeRoundedRect(1.5, 1.5, w - 3, h - 3, 12);
      card.types.forEach((t, i) => {
        g.fillStyle(ELEMENT_COLORS[t], 1).fillCircle(w - 12 - i * (pw + 4), 14, pw / 2 + 1);
        g.lineStyle(2, 0x0b1022, 1).strokeCircle(w - 12 - i * (pw + 4), 14, pw / 2 + 1);
      });
      g.fillStyle(COLORS.energyDark, 1).fillCircle(cr + 2, cr + 2, cr + 2);
      g.fillStyle(COLORS.energy, 1).fillCircle(cr + 2, cr + 2, cr);
      g.translateCanvas(w / 2, h * 0.32);
      if (card.kind === 'pokemon') drawCreature(g, card.id, r);
      else drawSpellIcon(g, card.id, r * 1.2);
    });
    this.content.push(scene.add.image(0, 0, faceKey).setOrigin(0));

    const name = scene.add.text(w / 2, h * 0.64, card.name, textStyle(this.compact ? 12 : 17)).setOrigin(0.5);
    this.content.push(name);
    if (!this.compact) {
      const role = scene.add.text(w / 2, h * 0.77, ROLE_NAMES[card.role], textStyle(12, css(0xffe9a8))).setOrigin(0.5);
      const stats = scene.add.text(w / 2, h * 0.89, cardStatsLine(card), textStyle(11, '#dfe7ff')).setOrigin(0.5);
      this.content.push(role, stats);
    }

    const costText = scene.add.text(cr + 2, cr + 2, String(card.cost), textStyle(this.compact ? 14 : 19)).setOrigin(0.5);
    this.content.push(costText);

    this.root.add(this.content);
    this.root.add([this.dim, this.fill]);
    this.root.bringToTop(this.dim);
    this.root.bringToTop(this.fill);
    this.root.sendToBack(this.selectGlow);
  }

  /** Oscurece la carta según la energía disponible (progreso hasta poder pagarla). */
  setAffordability(energy: number): void {
    const card = getCard(this.cardId);
    // Solo se redibuja cuando cambia de forma visible (evita trabajo en cada fotograma).
    const key = `${this.cardId}|${energy >= card.cost ? 'ok' : Math.floor((energy / card.cost) * 40)}`;
    if (key === this.affordKey) return;
    this.affordKey = key;
    this.dim.clear();
    this.fill.clear();
    if (energy >= card.cost) return;
    this.dim.fillStyle(0x0b1022, 0.55).fillRoundedRect(0, 0, this.w, this.h, 12);
    const p = Math.max(0, Math.min(1, energy / card.cost));
    this.fill.fillStyle(COLORS.energy, 0.25).fillRect(4, this.h - 6 - (this.h - 12) * p, this.w - 8, (this.h - 12) * p);
  }

  setSelected(selected: boolean, baseY: number): void {
    this.selectGlow.clear();
    if (selected) {
      this.selectGlow.lineStyle(6, COLORS.gold, 1).strokeRoundedRect(-4, -4, this.w + 8, this.h + 8, 15);
    }
    this.scene.tweens.add({ targets: this.root, y: baseY - (selected ? 14 : 0), duration: 110, ease: 'Quad.Out' });
  }

  /** Marca la carta como bloqueada (requisito en trofeos) o la desbloquea (null). */
  setLocked(requirement: number | null): void {
    this.lockOverlay?.destroy();
    this.lockOverlay = null;
    if (requirement === null) return;
    const c = this.scene.add.container(0, 0);
    const g = this.scene.add.graphics();
    g.fillStyle(0x0b1022, 0.86).fillRoundedRect(0, 0, this.w, this.h, 12);
    const lock = this.scene.add.text(this.w / 2, this.h * 0.4, '🔒', textStyle(34)).setOrigin(0.5);
    const req = this.scene.add.text(this.w / 2, this.h * 0.78, `🏆 ${requirement}`, textStyle(18, css(COLORS.gold))).setOrigin(0.5);
    c.add([g, lock, req]);
    this.root.add(c);
    this.lockOverlay = c;
  }

  shake(): void {
    const x = this.root.x;
    this.scene.tweens.add({ targets: this.root, x: x + 6, duration: 40, yoyo: true, repeat: 2, onComplete: () => this.root.setX(x) });
  }

  get id(): string {
    return this.cardId;
  }
}

/** Botón redondeado con estado pulsado (ratón y táctil). */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  color: number = COLORS.gold,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y).setDepth(500);
  const g = scene.add.graphics();
  const draw = (pressed: boolean) => {
    g.clear();
    g.fillStyle(darken(color, 0.55), 1).fillRoundedRect(-w / 2, -h / 2 + (pressed ? 2 : 6), w, h, 16);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2 + (pressed ? 2 : 0), w, h, 16);
    g.fillStyle(0xffffff, 0.25).fillRoundedRect(-w / 2 + 6, -h / 2 + (pressed ? 6 : 4), w - 12, h * 0.32, 10);
  };
  draw(false);
  const t = scene.add.text(0, 0, label, textStyle(Math.min(30, h * 0.42), '#ffffff')).setOrigin(0.5);
  c.add([g, t]);
  c.setSize(w, h + 6);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => {
    draw(true);
    t.y = 2;
  });
  c.on('pointerout', () => {
    draw(false);
    t.y = 0;
  });
  c.on('pointerup', () => {
    draw(false);
    t.y = 0;
    onClick();
  });
  c.setData('label', label);
  return c;
}

export function typeChip(scene: Phaser.Scene, x: number, y: number, element: keyof typeof ELEMENT_COLORS): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const label = ELEMENT_NAMES[element];
  const t = scene.add.text(0, 0, label, textStyle(12)).setOrigin(0, 0.5);
  const g = scene.add.graphics();
  g.fillStyle(ELEMENT_COLORS[element], 1).fillRoundedRect(-6, -11, t.width + 12, 22, 10);
  c.add([g, t]);
  return c;
}
