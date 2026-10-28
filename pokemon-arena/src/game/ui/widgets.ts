import Phaser from 'phaser';
import type { Card } from '../../sim/data/cards';
import { getCard, isTransform, maxStage } from '../../sim/data/cards';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../../sim/data/elements';
import { iconKey } from './icons';
import type { IconName } from './icons';
import { bake, drawCreature, drawSpellIcon } from '../render/creatureArt';
import { portraitKey } from '../render/portraits';
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

/** Coste que se muestra en la carta: Ditto enseña «+1» (cuesta la carta copiada más 1). */
export function costLabel(card: Card): string {
  return isTransform(card) ? `+${card.ability.extraCost}` : String(card.cost);
}

/** Color del marco según la fase (o el nivel del hechizo): plata, oro y épico. */
export const STAGE_FRAME: Record<number, { light: number; dark: number }> = {
  1: { light: 0xc9d6ea, dark: 0x56627e },
  2: { light: 0xf7b443, dark: 0x8a5212 },
  3: { light: 0xd08cff, dark: 0x5b2a8a },
};

/** Cara de la carta: sombra, marco por fase, ventana con degradado del tipo y cinta del nombre. */
function drawCardFace(g: Phaser.GameObjects.Graphics, card: Card, w: number, h: number, artH: number, drawArt: boolean): void {
  const frame = STAGE_FRAME[card.stage];
  const type = ELEMENT_COLORS[card.types[0]];
  g.fillStyle(0x05080f, 0.55).fillRoundedRect(3, 5, w, h, 12);
  g.fillStyle(frame.dark, 1).fillRoundedRect(0, 0, w, h, 12);
  g.fillStyle(frame.light, 1).fillRoundedRect(2, 2, w - 4, h - 4, 11);
  // Ventana del retrato: degradado del color del tipo y halo central
  g.fillGradientStyle(lighten(type, 0.08), lighten(type, 0.08), darken(type, 0.4), darken(type, 0.4), 1);
  g.fillRect(5, 5, w - 10, artH);
  g.fillStyle(lighten(type, 0.45), 0.35).fillEllipse(w / 2, 5 + artH * 0.5, (w - 10) * 0.85, artH * 0.7);
  g.fillStyle(0xffffff, 0.1).fillRect(5, 5, w - 10, artH * 0.14);
  // Cinta del nombre
  g.fillStyle(0x16203a, 1).fillRoundedRect(5, artH + 3, w - 10, h - artH - 8, { tl: 2, tr: 2, bl: 8, br: 8 });
  g.fillStyle(frame.dark, 1).fillRect(5, artH + 3, w - 10, 3);
  // Puntos de tipo arriba a la derecha
  card.types.forEach((t, i) => {
    const x = w - 13 - i * 15;
    g.fillStyle(0x0b1022, 1).fillCircle(x, 14, 7.5);
    g.fillStyle(ELEMENT_COLORS[t], 1).fillCircle(x, 14, 6);
  });
  if (!drawArt) return;
  g.translateCanvas(w / 2, 5 + artH * 0.5);
  const r = Math.min(w, artH) * 0.3;
  if (card.kind === 'pokemon') drawCreature(g, card.id, r);
  else drawSpellIcon(g, card.id, r * 1.2);
}

function lighten(color: number, f: number): number {
  const ch = (c: number) => Math.round(c + (255 - c) * f);
  return (ch((color >> 16) & 0xff) << 16) | (ch((color >> 8) & 0xff) << 8) | ch(color & 0xff);
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
  private progress: Phaser.GameObjects.Container | null = null;
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
    const { w, h, scene } = this;
    const artH = Math.round(h * 0.76);
    const top = maxStage(card.line);

    // Retrato vóxel del modelo 3D (si hay WebGL); si no, ficha dibujada en 2D.
    const portrait = card.kind === 'pokemon' ? portraitKey(scene, card.id) : null;
    // Marco, fondo con degradado del tipo, cinta del nombre y gota de coste: una textura.
    const faceKey = bake(scene, `carta2-${card.id}-${w}x${h}${portrait ? '-r' : ''}`, w + 4, h + 6, (g) => drawCardFace(g, card, w, h, artH, !portrait));
    this.content.push(scene.add.image(0, 0, faceKey).setOrigin(0));
    if (portrait) {
      const size = Math.min(w - 8, artH) * 1.08;
      this.content.push(scene.add.image(w / 2, 5 + artH * 0.5, portrait).setDisplaySize(size, size));
    }

    // Nombre en la cinta (se ajusta el tamaño para que quepa)
    let fs = this.compact ? 13 : Math.round(h * 0.12);
    const name = scene.add.text(w / 2, h - (h - artH) / 2 - 1, card.name, textStyle(fs)).setOrigin(0.5);
    while (name.width > w - 12 && fs > 9) name.setFontSize(--fs);
    this.content.push(name);

    // Coste: gota de energía con la cifra
    const drop = Math.round(this.compact ? h * 0.3 : h * 0.24);
    this.content.push(scene.add.image(drop * 0.55, drop * 0.55, iconKey(scene, 'energia')).setDisplaySize(drop * 1.1, drop * 1.1));
    this.content.push(scene.add.text(drop * 0.55, drop * 0.62, costLabel(card), textStyle(Math.round(drop * (isTransform(card) ? 0.42 : 0.55)))).setOrigin(0.5));

    // Fase: estrellas sobre la cinta (solo si la carta evoluciona)
    if (top > 1 && !this.compact) {
      const st = Math.round(h * 0.11);
      for (let i = 0; i < top; i++) {
        const x = w / 2 + (i - (top - 1) / 2) * st * 0.95;
        this.content.push(scene.add.image(x, artH + 2, iconKey(scene, i < card.stage ? 'estrella' : 'estrella-vacia')).setDisplaySize(st, st));
      }
    }

    this.root.add(this.content);
    this.root.add([this.dim, this.fill]);
    this.root.bringToTop(this.dim);
    this.root.bringToTop(this.fill);
    this.root.sendToBack(this.selectGlow);
  }

  /** Oscurece la carta según la energía disponible (progreso hasta poder pagarla). */
  setAffordability(energy: number, costOverride?: number): void {
    // Ditto cuesta según la carta que copia (Infinity = aún no puede jugarse).
    const cost = costOverride ?? getCard(this.cardId).cost;
    // Solo se redibuja cuando cambia de forma visible (evita trabajo en cada fotograma).
    const key = `${this.cardId}|${energy >= cost ? 'ok' : Number.isFinite(cost) ? Math.floor((energy / cost) * 40) : 'x'}`;
    if (key === this.affordKey) return;
    this.affordKey = key;
    this.dim.clear();
    this.fill.clear();
    if (energy >= cost) return;
    this.dim.fillStyle(0x0b1022, 0.55).fillRoundedRect(0, 0, this.w, this.h, 12);
    const p = Number.isFinite(cost) ? Math.max(0, Math.min(1, energy / cost)) : 0;
    this.fill.fillStyle(COLORS.energy, 0.25).fillRect(4, this.h - 6 - (this.h - 12) * p, this.w - 8, (this.h - 12) * p);
  }

  setSelected(selected: boolean, baseY: number): void {
    this.selectGlow.clear();
    if (selected) {
      this.selectGlow.lineStyle(6, COLORS.gold, 1).strokeRoundedRect(-4, -4, this.w + 8, this.h + 8, 15);
    }
    this.scene.tweens.add({ targets: this.root, y: baseY - (selected ? 14 : 0), duration: 110, ease: 'Quad.Out' });
  }

  /** Marca la carta como no conseguida (texto bajo el candado) o la desbloquea (null). */
  setLocked(label: string | null): void {
    this.lockOverlay?.destroy();
    this.lockOverlay = null;
    if (label === null) return;
    const c = this.scene.add.container(0, 0);
    const g = this.scene.add.graphics();
    g.fillStyle(0x0b1022, 0.86).fillRoundedRect(0, 0, this.w, this.h, 12);
    const lock = this.scene.add.image(this.w / 2, this.h * 0.4, iconKey(this.scene, 'candado')).setDisplaySize(this.h * 0.3, this.h * 0.3);
    const req = this.scene.add.text(this.w / 2, this.h * 0.78, label, textStyle(14, css(COLORS.gold), { align: 'center' })).setOrigin(0.5);
    c.add([g, lock, req]);
    this.root.add(c);
    this.lockOverlay = c;
  }

  /**
   * Barra de evolución bajo la carta (como el progreso de nivel de los juegos de cartas):
   * copias reunidas / necesarias (la fase se ve en las estrellas de la carta). `needed` null = fase máxima.
   */
  setProgress(maxStage: number, copies: number, needed: number | null, ready: boolean): void {
    this.progress?.destroy();
    const c = this.scene.add.container(0, this.h + 6);
    const g = this.scene.add.graphics();
    const w = this.w;
    g.fillStyle(0x0b1022, 1).fillRoundedRect(0, 0, w, 20, 8);
    if (needed !== null) {
      const f = Math.min(1, copies / needed);
      g.fillStyle(ready ? COLORS.ok : 0x4f8ff0, 1).fillRoundedRect(2, 2, Math.max(8, (w - 4) * f), 16, 7);
    } else {
      g.fillStyle(COLORS.gold, 1).fillRoundedRect(2, 2, w - 4, 16, 7);
    }
    const label = needed === null ? (maxStage > 1 ? 'Fase máxima' : 'Única') : ready ? '¡Evolucionar!' : `${copies}/${needed}`;
    const t = this.scene.add.text(w / 2, 10, label, textStyle(13)).setOrigin(0.5);
    c.add([g, t]);
    this.root.add(c);
    this.progress = c;
  }

  /**
   * Hace la carta tocable. Se usa una zona propia con origen en la esquina: el área de
   * pulsación de un contenedor se mide desde su centro y dejaba media carta sin respuesta.
   */
  onTap(cb: () => void): void {
    const zone = this.scene.add.zone(0, 0, this.w, this.h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerup', cb);
    this.root.add(zone);
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
  iconName?: IconName,
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
  if (iconName) {
    // Icono a la izquierda del texto, centrados juntos
    const is = Math.min(34, h * 0.5);
    const ic = scene.add.image(0, 0, iconKey(scene, iconName)).setDisplaySize(is, is);
    const total = is + 6 + t.width;
    ic.x = -total / 2 + is / 2;
    t.x = ic.x + is / 2 + 6 + t.width / 2;
    c.add(ic);
  }
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
