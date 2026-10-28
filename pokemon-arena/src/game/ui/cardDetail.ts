import Phaser from 'phaser';
import type { Ability, Card, PokemonCard } from '../../sim/data/cards';
import { ROLE_NAMES, getCard } from '../../sim/data/cards';
import { ELEMENTS, ELEMENT_COLORS, ELEMENT_NAMES, typeMultiplier } from '../../sim/data/elements';
import type { Element } from '../../sim/data/elements';
import { GAME_H, GAME_W } from '../layout';
import { bake, drawCreature, drawSpellIcon } from '../render/creatureArt';
import { portraitKey } from '../render/portraits';
import { COLORS, css, darken, textStyle } from '../theme';
import { makeButton } from './widgets';

/** Una casilla de la ficha: etiqueta y valor, como en los juegos de cartas de estrategia. */
export interface StatTile {
  label: string;
  value: string;
}

export function speedLabel(speed: number): string {
  if (speed < 0.9) return 'Lenta';
  if (speed < 1.2) return 'Media';
  if (speed < 1.6) return 'Rápida';
  return 'Muy rápida';
}

function abilityText(a: Ability): string {
  switch (a.kind) {
    case 'aura_curativa':
      return `Cura ${a.amount} PS a los aliados a ${a.radius} casillas cada ${a.interval} s.`;
    case 'autodestruccion':
      return `Al caer explota: ${a.damage} de daño en ${a.radius} casillas (${Math.round(a.towerFactor * 100)} % a torres).`;
    case 'canto':
      return `Duerme ${a.duration} s a los enemigos a ${a.radius} casillas (cada ${a.interval} s).`;
    case 'cadena':
      return `La descarga salta a ${a.jumps} enemigos más (x${a.falloff} por salto).`;
    case 'ralentizar':
      return `Ralentiza un ${Math.round(a.factor * 100)} % durante ${a.duration} s.`;
  }
}

/** Estadísticas de la ficha, calculadas solo a partir del catálogo (sim/data/cards.ts). */
export function cardStatTiles(card: Card): StatTile[] {
  if (card.kind === 'hechizo') {
    const tiles: StatTile[] = [
      { label: 'Daño', value: String(card.damage) },
      { label: 'Daño a torres', value: `${Math.round(card.damage * card.towerDamageFactor)} (${Math.round(card.towerDamageFactor * 100)} %)` },
      { label: 'Radio', value: `${card.radius} casillas` },
      { label: 'Tiempo de impacto', value: `${card.delay} s` },
    ];
    if (card.effect) {
      tiles.push(
        card.effect.kind === 'aturdir'
          ? { label: 'Efecto', value: `Aturde ${card.effect.duration} s` }
          : { label: 'Efecto', value: `Ralentiza ${Math.round(card.effect.factor * 100)} % · ${card.effect.duration} s` },
      );
    }
    return tiles;
  }
  const melee = card.range <= 1.2;
  const targets = card.targets === 'edificios' ? 'Solo torres' : card.targets === 'tierra' ? 'Tierra' : 'Aire y tierra';
  const tiles: StatTile[] = [
    { label: 'Puntos de salud', value: String(card.hp) },
    { label: 'Daño', value: String(card.damage) },
    { label: 'Daño por segundo', value: String(Math.round(card.damage / card.hitSpeed)) },
    { label: 'Vel. de ataque', value: `${card.hitSpeed} s` },
    { label: 'Velocidad', value: `${speedLabel(card.speed)} (${card.speed})` },
    { label: 'Alcance', value: melee ? `Cuerpo a cuerpo` : `${card.range} casillas` },
    { label: 'Objetivos', value: targets },
    { label: 'Unidad', value: card.locomotion === 'aire' ? 'Voladora' : 'Terrestre' },
  ];
  if (card.count > 1) tiles.push({ label: 'Cantidad', value: `x${card.count}` });
  if (card.attack.splashRadius) tiles.push({ label: 'Daño en área', value: `${card.attack.splashRadius} casillas` });
  tiles.push({ label: 'Despliegue', value: `${card.deployTime} s` });
  return tiles;
}

/** Debilidades y resistencias según la tabla de tipos. */
export function matchups(card: PokemonCard): { weak: Element[]; resist: Element[] } {
  const weak: Element[] = [];
  const resist: Element[] = [];
  for (const e of ELEMENTS) {
    const m = typeMultiplier(e, card.types);
    if (m > 1) weak.push(e);
    else if (m < 1) resist.push(e);
  }
  return { weak, resist };
}

export interface CardDetailAction {
  label: string;
  color?: number;
  onClick: () => void;
}

/**
 * Ficha de carta a pantalla completa (ventana modal): retrato, tipos, función, coste,
 * descripción, casillas de estadísticas, habilidad, debilidades y resistencias, y acciones
 * (añadir/quitar del mazo). Se cierra con «Cerrar» o tocando fuera del panel.
 */
export class CardDetail {
  readonly root: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    cardId: string,
    opts: { locked?: string; actions?: CardDetailAction[]; onClose?: () => void } = {},
  ) {
    const card = getCard(cardId);
    const color = ELEMENT_COLORS[card.types[0]];
    const c = (this.root = scene.add.container(0, 0).setDepth(1000));
    const close = () => {
      this.destroy();
      opts.onClose?.();
    };

    // Fondo oscuro que bloquea los toques de detrás
    const shade = scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x05080f, 0.78).setOrigin(0).setInteractive();
    shade.on('pointerup', close);
    c.add(shade);

    // Contenido (se calcula antes para ajustar la altura del panel)
    const tiles = cardStatTiles(card);
    const lines: string[] = [];
    if (card.kind === 'pokemon') {
      if (card.ability) lines.push(`✦ Habilidad: ${abilityText(card.ability)}`);
      const m = matchups(card);
      lines.push(`Débil a: ${m.weak.map((e) => ELEMENT_NAMES[e]).join(', ') || '—'}`);
      lines.push(`Resiste: ${m.resist.map((e) => ELEMENT_NAMES[e]).join(', ') || '—'}`);
    }
    if (opts.locked) lines.push(`🔒 ${opts.locked}`);
    const th = 70;
    const tilesH = Math.ceil(tiles.length / 2) * (th + 10);
    // Las líneas largas (habilidad) ocupan dos renglones
    const linesH = lines.reduce((h, l) => h + (l.length > 58 ? 56 : 30), 0);

    const px = 30;
    const pw = GAME_W - px * 2;
    const ph = Math.min(GAME_H - 60, 350 + tilesH + 16 + linesH + 130);
    const py = Math.round((GAME_H - ph) / 2);
    const panel = scene.add.graphics();
    panel.fillStyle(0x0b1022, 0.6).fillRoundedRect(px + 4, py + 8, pw, ph, 26);
    panel.fillStyle(COLORS.panel, 1).fillRoundedRect(px, py, pw, ph, 26);
    panel.fillStyle(darken(color, 0.5), 1).fillRoundedRect(px, py, pw, 330, { tl: 26, tr: 26, bl: 0, br: 0 });
    panel.fillStyle(darken(color, 0.32), 1).fillRect(px, py + 300, pw, 30);
    panel.lineStyle(4, color, 1).strokeRoundedRect(px, py, pw, ph, 26);
    // El panel absorbe los toques (no cierra la ficha)
    const block = scene.add.zone(px, py, pw, ph).setOrigin(0).setInteractive();
    c.add([panel, block]);

    // Retrato grande
    const portrait = card.kind === 'pokemon' ? portraitKey(scene, card.id) : null;
    if (portrait) {
      c.add(scene.add.image(px + 150, py + 160, portrait).setDisplaySize(270, 270));
    } else {
      const key = bake(scene, `ficha-${card.id}`, 240, 240, (g) => {
        g.translateCanvas(120, 130);
        if (card.kind === 'pokemon') drawCreature(g, card.id, 70);
        else drawSpellIcon(g, card.id, 85);
      });
      c.add(scene.add.image(px + 150, py + 160, key));
    }

    // Cabecera: nombre, coste, tipos, función
    const hx = px + 300;
    c.add(scene.add.text(hx, py + 40, card.name, textStyle(42)).setOrigin(0, 0));
    const cost = scene.add.graphics();
    cost.fillStyle(COLORS.energyDark, 1).fillCircle(px + pw - 52, py + 62, 36);
    cost.fillStyle(COLORS.energy, 1).fillCircle(px + pw - 52, py + 62, 31);
    c.add([cost, scene.add.text(px + pw - 52, py + 62, String(card.cost), textStyle(34)).setOrigin(0.5)]);
    let tx = hx;
    for (const t of card.types) {
      const label = scene.add.text(0, 0, ELEMENT_NAMES[t], textStyle(18)).setOrigin(0, 0.5);
      const chip = scene.add.graphics();
      chip.fillStyle(ELEMENT_COLORS[t], 1).fillRoundedRect(-10, -16, label.width + 20, 32, 14);
      chip.lineStyle(2, 0x0b1022, 0.7).strokeRoundedRect(-10, -16, label.width + 20, 32, 14);
      const g = scene.add.container(tx + 10, py + 122, [chip, label]);
      c.add(g);
      tx += label.width + 34;
    }
    c.add(scene.add.text(hx, py + 160, ROLE_NAMES[card.role] + (card.kind === 'hechizo' ? '' : card.locomotion === 'aire' ? ' · Volador' : ' · Terrestre'), textStyle(20, css(0xffe9a8))));
    c.add(
      scene.add.text(hx, py + 200, card.description, textStyle(17, '#dfe7ff', { wordWrap: { width: px + pw - hx - 24 }, lineSpacing: 4 })),
    );

    // Casillas de estadísticas (2 columnas)
    const gx = px + 22;
    const gw = (pw - 44 - 12) / 2;
    let y = py + 350;
    tiles.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = gx + col * (gw + 12);
      const ty = y + row * (th + 10);
      const g = scene.add.graphics();
      g.fillStyle(COLORS.panelLight, 1).fillRoundedRect(x, ty, gw, th, 14);
      g.fillStyle(0xffffff, 0.06).fillRoundedRect(x + 4, ty + 4, gw - 8, 22, 10);
      c.add(g);
      c.add(scene.add.text(x + 16, ty + 10, t.label, textStyle(15, '#a9b8e6')));
      c.add(scene.add.text(x + 16, ty + 34, t.value, textStyle(23)));
    });
    y += tilesH + 8;

    // Habilidad y tabla de tipos
    if (lines.length) {
      c.add(scene.add.text(gx + 4, y, lines.join('\n'), textStyle(17, '#ffffff', { wordWrap: { width: pw - 52 }, lineSpacing: 8 })));
    }

    // Acciones
    const actions: CardDetailAction[] = [...(opts.actions ?? []), { label: 'Cerrar', color: COLORS.panelLight, onClick: close }];
    const bw = (pw - 44 - (actions.length - 1) * 16) / actions.length;
    actions.forEach((a, i) => {
      const b = makeButton(scene, gx + bw / 2 + i * (bw + 16), py + ph - 62, bw, 76, a.label, a.onClick, a.color);
      b.setDepth(1001);
      c.add(b);
    });

    c.setAlpha(0).setScale(0.96);
    c.setPosition(GAME_W * 0.02, GAME_H * 0.02);
    scene.tweens.add({ targets: c, alpha: 1, scale: 1, x: 0, y: 0, duration: 140, ease: 'Quad.Out' });
  }

  destroy(): void {
    this.root.destroy();
  }
}
