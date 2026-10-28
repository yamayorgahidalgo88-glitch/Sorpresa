import Phaser from 'phaser';
import { CARD_IDS, getCard } from '../../sim/data/cards';
import { validateDeck } from '../../sim/systems/deck';
import { loadSettings, loadStats, saveSettings } from '../../persistence/settings';
import { isUnlocked, unlockRequirement } from '../../persistence/progression';
import type { Settings } from '../../persistence/settings';
import { play } from '../audio/sfx';
import { GAME_H, GAME_W } from '../layout';
import { COLORS, css, textStyle } from '../theme';
import { CardDetail } from '../ui/cardDetail';
import { CardWidget, makeButton } from '../ui/widgets';

const GRID_W = 150;
const GRID_H = 158;
const GRID_COLS = 4;
const GRID_X = (GAME_W - GRID_COLS * GRID_W) / 2 + 7;

function gridPos(i: number, top: number): { x: number; y: number } {
  return { x: GRID_X + (i % GRID_COLS) * GRID_W, y: top + Math.floor(i / GRID_COLS) * GRID_H };
}

/** Colección: todas las cartas; al tocar una se abre su ficha completa. */
export class CollectionScene extends Phaser.Scene {
  detail: CardDetail | null = null;

  constructor() {
    super('collection');
  }

  create(): void {
    this.detail = null;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.text(GAME_W / 2, 50, 'Colección', textStyle(44, css(COLORS.gold))).setOrigin(0.5);
    this.add.text(GAME_W / 2, 96, 'Toca una carta para ver su ficha', textStyle(17, '#c9d4f5')).setOrigin(0.5);
    const trophies = loadStats().trophies;
    CARD_IDS.forEach((id, i) => {
      const p = gridPos(i, 130);
      const w = new CardWidget(this, p.x, p.y, GRID_W - 12, GRID_H - 14);
      w.setCard(id);
      const locked = !isUnlocked(id, trophies);
      if (locked) w.setLocked(unlockRequirement(id));
      w.onTap(() => {
        play('seleccion');
        this.detail = new CardDetail(this, id, {
          locked: locked ? `Se desbloquea con ${unlockRequirement(id)} trofeos (tienes ${trophies}).` : undefined,
          onClose: () => (this.detail = null),
        });
      });
    });
    makeButton(this, GAME_W / 2, GAME_H - 70, 360, 70, 'Volver', () => this.scene.start('menu'), COLORS.panelLight);
  }
}

/** Constructor de mazos: toca cartas para añadirlas o quitarlas (8 distintas). */
export class DeckScene extends Phaser.Scene {
  private settings!: Settings;
  private deck: string[] = [];
  private widgets = new Map<string, CardWidget>();
  private info!: Phaser.GameObjects.Text;
  private saveBtn!: Phaser.GameObjects.Container;
  private trophies = 0;
  detail: CardDetail | null = null;

  constructor() {
    super('deck');
  }

  create(): void {
    this.settings = loadSettings();
    this.deck = this.settings.deck.slice();
    this.trophies = loadStats().trophies;
    this.widgets = new Map();
    this.detail = null;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.text(GAME_W / 2, 50, 'Constructor de mazo', textStyle(40, css(COLORS.gold))).setOrigin(0.5);
    this.add.text(GAME_W / 2, 94, 'Toca una carta para ver su ficha y añadirla o quitarla', textStyle(17, '#c9d4f5')).setOrigin(0.5);

    CARD_IDS.forEach((id, i) => {
      const p = gridPos(i, 130);
      const w = new CardWidget(this, p.x, p.y, GRID_W - 12, GRID_H - 14);
      w.setCard(id);
      if (!isUnlocked(id, this.trophies)) w.setLocked(unlockRequirement(id));
      w.root.setData('baseY', p.y);
      w.onTap(() => this.openDetail(id));
      this.widgets.set(id, w);
    });

    const infoY = 130 + Math.ceil(CARD_IDS.length / GRID_COLS) * GRID_H + 20;
    this.info = this.add.text(GAME_W / 2, infoY, '', textStyle(22, '#ffffff', { align: 'center' })).setOrigin(0.5, 0);
    this.saveBtn = makeButton(this, GAME_W / 2, GAME_H - 170, 380, 76, 'Guardar mazo', () => this.save());
    makeButton(this, GAME_W / 2, GAME_H - 75, 380, 64, 'Volver', () => this.scene.start('menu'), COLORS.panelLight);
    this.refresh();
  }

  /** Ficha de la carta con la acción de añadirla o quitarla del mazo. */
  private openDetail(id: string): void {
    play('seleccion');
    const locked = !isUnlocked(id, this.trophies);
    const inDeck = this.deck.includes(id);
    const actions = locked
      ? []
      : [
          {
            label: inDeck ? 'Quitar del mazo' : 'Añadir al mazo',
            color: inDeck ? COLORS.danger : COLORS.ok,
            onClick: () => {
              this.detail?.destroy();
              this.detail = null;
              this.toggle(id);
            },
          },
        ];
    this.detail = new CardDetail(this, id, {
      locked: locked ? `Se desbloquea con ${unlockRequirement(id)} trofeos (tienes ${this.trophies}).` : undefined,
      actions,
      onClose: () => (this.detail = null),
    });
  }

  private toggle(id: string): void {
    if (!isUnlocked(id, this.trophies)) {
      this.widgets.get(id)?.shake();
      this.info.setText(`🔒 ${getCard(id).name} se desbloquea con ${unlockRequirement(id)} trofeos (tienes ${this.trophies}).`).setColor(css(COLORS.gold));
      play('rechazo');
      return;
    }
    const i = this.deck.indexOf(id);
    if (i >= 0) this.deck.splice(i, 1);
    else if (this.deck.length < 8) this.deck.push(id);
    else {
      this.widgets.get(id)?.shake();
      this.info.setText('El mazo ya tiene 8 cartas: quita una antes de añadir otra.').setColor(css(COLORS.gold));
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
