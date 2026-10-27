import Phaser from 'phaser';
import { CARD_IDS, ROLE_NAMES, getCard } from '../../sim/data/cards';
import type { Ability, Card } from '../../sim/data/cards';
import { ELEMENTS, ELEMENT_NAMES, typeMultiplier } from '../../sim/data/elements';
import type { Element } from '../../sim/data/elements';
import { validateDeck } from '../../sim/systems/deck';
import { loadSettings, saveSettings } from '../../persistence/settings';
import type { Settings } from '../../persistence/settings';
import { play } from '../audio/sfx';
import { GAME_H, GAME_W } from '../layout';
import { COLORS, css, textStyle } from '../theme';
import { CardWidget, makeButton, targetsLabel } from '../ui/widgets';

const GRID_W = 150;
const GRID_H = 158;
const GRID_COLS = 4;
const GRID_X = (GAME_W - GRID_COLS * GRID_W) / 2 + 7;

function gridPos(i: number, top: number): { x: number; y: number } {
  return { x: GRID_X + (i % GRID_COLS) * GRID_W, y: top + Math.floor(i / GRID_COLS) * GRID_H };
}

function abilityText(a: Ability | undefined): string {
  if (!a) return '';
  switch (a.kind) {
    case 'aura_curativa':
      return `Cura ${a.amount} PS a los aliados en ${a.radius} casillas cada ${a.interval} s.`;
    case 'autodestruccion':
      return `Al caer explota: ${a.damage} de daño en ${a.radius} casillas (${Math.round(a.towerFactor * 100)} % a torres).`;
    case 'canto':
      return `Duerme ${a.duration} s a los enemigos en ${a.radius} casillas (cada ${a.interval} s).`;
    case 'cadena':
      return `La descarga salta a ${a.jumps} enemigos más (x${a.falloff} por salto).`;
    case 'ralentizar':
      return `Ralentiza un ${Math.round(a.factor * 100)} % durante ${a.duration} s.`;
  }
}

/** Debilidades y resistencias del Pokémon según la tabla de tipos. */
function matchups(card: Card): { weak: Element[]; resist: Element[] } {
  const weak: Element[] = [];
  const resist: Element[] = [];
  if (card.kind !== 'pokemon') return { weak, resist };
  for (const e of ELEMENTS) {
    const m = typeMultiplier(e, card.types);
    if (m > 1) weak.push(e);
    else if (m < 1) resist.push(e);
  }
  return { weak, resist };
}

export function cardDetailLines(card: Card): string[] {
  const types = card.types.map((t) => ELEMENT_NAMES[t]).join(' / ');
  if (card.kind === 'hechizo') {
    const eff = card.effect ? (card.effect.kind === 'aturdir' ? `Aturde ${card.effect.duration} s.` : `Ralentiza ${Math.round(card.effect.factor * 100)} % durante ${card.effect.duration} s.`) : '';
    return [
      `${card.name} · Hechizo de tipo ${types} · Coste ${card.cost}`,
      `Daño ${card.damage} en ${card.radius} casillas · A torres: ${Math.round(card.towerDamageFactor * 100)} %`,
      `${eff} ${card.description}`,
    ];
  }
  const m = matchups(card);
  return [
    `${card.name} · ${types} · ${ROLE_NAMES[card.role]} · Coste ${card.cost}${card.count > 1 ? ` · ${card.count} unidades` : ''}`,
    `PS ${card.hp} · Daño ${card.damage} cada ${card.hitSpeed} s · Velocidad ${card.speed} · Alcance ${card.range}`,
    `${targetsLabel(card)} · ${card.locomotion === 'aire' ? 'Volador' : 'Terrestre'}${card.attack.splashRadius ? ` · Daño en área (${card.attack.splashRadius})` : ''}`,
    `Débil a: ${m.weak.map((e) => ELEMENT_NAMES[e]).join(', ') || '—'}`,
    `Resiste: ${m.resist.map((e) => ELEMENT_NAMES[e]).join(', ') || '—'}`,
    `${abilityText(card.ability)} ${card.description}`.trim(),
  ];
}

/** Colección: todas las cartas con su ficha técnica. */
export class CollectionScene extends Phaser.Scene {
  private detail!: Phaser.GameObjects.Text;

  constructor() {
    super('collection');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.text(GAME_W / 2, 50, 'Colección', textStyle(44, css(COLORS.gold))).setOrigin(0.5);
    this.add.text(GAME_W / 2, 96, 'Toca una carta para ver su ficha', textStyle(17, '#c9d4f5')).setOrigin(0.5);
    const widgets: CardWidget[] = [];
    CARD_IDS.forEach((id, i) => {
      const p = gridPos(i, 130);
      const w = new CardWidget(this, p.x, p.y, GRID_W - 12, GRID_H - 14);
      w.setCard(id);
      w.root.setSize(GRID_W - 12, GRID_H - 14).setInteractive(new Phaser.Geom.Rectangle(0, 0, GRID_W - 12, GRID_H - 14), Phaser.Geom.Rectangle.Contains);
      w.root.setData('baseY', p.y);
      w.root.on('pointerup', () => {
        widgets.forEach((o) => o.setSelected(o === w, o.root.getData('baseY') as number));
        this.show(id);
        play('seleccion');
      });
      widgets.push(w);
    });
    const panelY = 130 + Math.ceil(CARD_IDS.length / GRID_COLS) * GRID_H + 10;
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 1).fillRoundedRect(24, panelY, GAME_W - 48, 300, 18);
    this.detail = this.add.text(44, panelY + 18, '', textStyle(17, '#ffffff', { wordWrap: { width: GAME_W - 88 }, lineSpacing: 8 }));
    this.show(CARD_IDS[0]);
    makeButton(this, GAME_W / 2, GAME_H - 70, 360, 70, 'Volver', () => this.scene.start('menu'), COLORS.panelLight);
  }

  private show(id: string): void {
    this.detail.setText(cardDetailLines(getCard(id)).join('\n'));
  }
}

/** Constructor de mazos: toca cartas para añadirlas o quitarlas (8 distintas). */
export class DeckScene extends Phaser.Scene {
  private settings!: Settings;
  private deck: string[] = [];
  private widgets = new Map<string, CardWidget>();
  private info!: Phaser.GameObjects.Text;
  private saveBtn!: Phaser.GameObjects.Container;

  constructor() {
    super('deck');
  }

  create(): void {
    this.settings = loadSettings();
    this.deck = this.settings.deck.slice();
    this.widgets = new Map();
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.text(GAME_W / 2, 50, 'Constructor de mazo', textStyle(40, css(COLORS.gold))).setOrigin(0.5);
    this.add.text(GAME_W / 2, 94, 'Toca para añadir o quitar · 8 cartas distintas', textStyle(17, '#c9d4f5')).setOrigin(0.5);

    CARD_IDS.forEach((id, i) => {
      const p = gridPos(i, 130);
      const w = new CardWidget(this, p.x, p.y, GRID_W - 12, GRID_H - 14);
      w.setCard(id);
      w.root.setSize(GRID_W - 12, GRID_H - 14).setInteractive(new Phaser.Geom.Rectangle(0, 0, GRID_W - 12, GRID_H - 14), Phaser.Geom.Rectangle.Contains);
      w.root.setData('baseY', p.y);
      w.root.on('pointerup', () => this.toggle(id));
      this.widgets.set(id, w);
    });

    const infoY = 130 + Math.ceil(CARD_IDS.length / GRID_COLS) * GRID_H + 20;
    this.info = this.add.text(GAME_W / 2, infoY, '', textStyle(22, '#ffffff', { align: 'center' })).setOrigin(0.5, 0);
    this.saveBtn = makeButton(this, GAME_W / 2, GAME_H - 170, 380, 76, 'Guardar mazo', () => this.save());
    makeButton(this, GAME_W / 2, GAME_H - 75, 380, 64, 'Volver', () => this.scene.start('menu'), COLORS.panelLight);
    this.refresh();
  }

  private toggle(id: string): void {
    const i = this.deck.indexOf(id);
    if (i >= 0) this.deck.splice(i, 1);
    else if (this.deck.length < 8) this.deck.push(id);
    else {
      this.widgets.get(id)?.shake();
      play('rechazo');
      return;
    }
    play('seleccion');
    this.refresh();
  }

  private refresh(): void {
    for (const [id, w] of this.widgets) w.setSelected(this.deck.includes(id), w.root.getData('baseY') as number);
    const v = validateDeck(this.deck);
    const avg = this.deck.length ? this.deck.reduce((s, id) => s + getCard(id).cost, 0) / this.deck.length : 0;
    const roles = new Set(this.deck.map((id) => getCard(id).role));
    const antiAir = this.deck.some((id) => {
      const c = getCard(id);
      return c.kind === 'hechizo' || c.targets === 'aire_y_tierra';
    });
    this.info.setText(
      `Mazo ${this.deck.length}/8 · Coste medio ${avg.toFixed(1)}\n` +
        `Funciones: ${roles.size} distintas${antiAir ? '' : ' · ¡Sin defensa antiaérea!'}`,
    );
    this.info.setColor(v.ok ? '#ffffff' : '#ffd23f');
    this.saveBtn.setAlpha(v.ok ? 1 : 0.4);
  }

  private save(): void {
    if (!validateDeck(this.deck).ok) {
      play('rechazo');
      return;
    }
    this.settings.deck = this.deck.slice();
    saveSettings(this.settings);
    play('despliegue');
    this.scene.start('menu');
  }
}
