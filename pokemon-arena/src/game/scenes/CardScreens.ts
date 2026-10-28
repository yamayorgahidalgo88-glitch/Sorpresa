import Phaser from 'phaser';
import { LINES, getCard, maxStage } from '../../sim/data/cards';
import { validateDeck } from '../../sim/systems/deck';
import { canEvolve, cardIdFor, evolve, evolveCost } from '../../persistence/economy';
import type { Profile } from '../../persistence/economy';
import { loadProfile, loadSettings, saveProfile, saveSettings } from '../../persistence/settings';
import type { Settings } from '../../persistence/settings';
import { play } from '../audio/sfx';
import { GAME_H, GAME_W } from '../layout';
import { iconLabel } from '../ui/icons';
import { COLORS, css, textStyle } from '../theme';
import { CardDetail } from '../ui/cardDetail';
import type { CardDetailAction } from '../ui/cardDetail';
import { CardWidget, makeButton } from '../ui/widgets';

const CELL_W = 160;
const CELL_H = 182;
const CARD_W = 146;
const CARD_H = 150;
const COLS = 4;
const GRID_X = (GAME_W - COLS * CELL_W) / 2 + (CELL_W - CARD_W) / 2;

function cellPos(i: number, top: number): { x: number; y: number } {
  return { x: GRID_X + (i % COLS) * CELL_W, y: top + Math.floor(i / COLS) * CELL_H };
}

/** Texto de evolución para la ficha. */
function evolutionNotes(profile: Profile, line: string): string[] {
  const own = profile.owned[line];
  if (!own) return [];
  const top = maxStage(line);
  if (top === 1) return ['Esta carta no evoluciona: sus copias se convierten en monedas.'];
  if (own.stage >= top) return [`Fase ${own.stage}/${top} · Evolución máxima: las copias se convierten en monedas.`];
  const c = evolveCost(profile, line)!;
  const next = getCard(cardIdFor({ ...profile, owned: { ...profile.owned, [line]: { ...own, stage: c.to } } }, line));
  const verb = next.kind === 'hechizo' ? 'Sube a' : 'Evoluciona a';
  return [`Fase ${own.stage}/${top} · ${verb} ${next.name}: ${own.copies}/${c.copies} cartas y ${c.coins} monedas (tienes ${profile.coins}).`];
}

/**
 * Constructor de mazo al estilo de los juegos de cartas de estrategia:
 * arriba el mazo de batalla (8 cartas), debajo el resto de la colección y, al final, las
 * cartas que aún no tienes (salen en las Pokéballs). Tocar una carta abre su ficha:
 * «Usar» inicia el cambio (después se toca la carta del mazo que sale) y «Evolucionar»
 * gasta copias y monedas. El mazo se guarda en cada cambio.
 */
export class DeckScene extends Phaser.Scene {
  private settings!: Settings;
  private profile!: Profile;
  deck: string[] = [];
  /** Línea que se va a meter en el mazo (esperando a que se toque la carta que sale). */
  swapping: string | null = null;
  detail: CardDetail | null = null;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private info!: Phaser.GameObjects.Text;
  private coins!: ReturnType<typeof iconLabel>;

  constructor() {
    super('deck');
  }

  create(): void {
    this.settings = loadSettings();
    this.profile = loadProfile();
    this.deck = this.settings.deck.slice();
    this.swapping = null;
    this.detail = null;
    this.layer = [];
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.text(30, 26, 'Mazo de batalla', textStyle(36, css(COLORS.gold)));
    this.coins = iconLabel(this, GAME_W - 30, 48, 'moneda', '0', 26, '#ffe27a', 1);
    this.info = this.add.text(GAME_W / 2, 1270, '', textStyle(19, '#ffffff', { align: 'center', wordWrap: { width: GAME_W - 60 } })).setOrigin(0.5, 0);
    makeButton(this, GAME_W / 2, GAME_H - 70, 380, 70, 'Volver', () => this.scene.start('menu'), COLORS.panelLight);
    this.renderAll();
  }

  private renderAll(): void {
    for (const o of this.layer) o.destroy();
    this.layer = [];
    const p = this.profile;
    this.coins.set(String(p.coins));

    // Mazo
    const deckTop = 90;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 1).fillRoundedRect(14, deckTop - 12, GAME_W - 28, CELL_H * 2 + 18, 20);
    panel.lineStyle(3, this.swapping ? COLORS.gold : COLORS.panelLight, 1).strokeRoundedRect(14, deckTop - 12, GAME_W - 28, CELL_H * 2 + 18, 20);
    this.layer.push(panel);
    this.deck.forEach((line, i) => this.cardAt(line, cellPos(i, deckTop), true));

    const avg = this.deck.reduce((s, l) => s + getCard(cardIdFor(p, l)).cost, 0) / this.deck.length;
    const antiAir = this.deck.some((l) => {
      const c = getCard(cardIdFor(p, l));
      return c.kind === 'hechizo' || c.targets === 'aire_y_tierra';
    });
    this.layer.push(
      this.add
        .text(GAME_W / 2, deckTop + CELL_H * 2 + 18, `Coste medio de energía: ${avg.toFixed(1)}${antiAir ? '' : '  ·  ¡Sin defensa antiaérea!'}`, textStyle(18, antiAir ? '#c9d4f5' : '#ffd23f'))
        .setOrigin(0.5, 0),
    );

    // Colección (fuera del mazo) y cartas por descubrir
    const rest = LINES.filter((l) => p.owned[l] && !this.deck.includes(l));
    const missing = LINES.filter((l) => !p.owned[l]);
    const colTop = deckTop + CELL_H * 2 + 90;
    this.layer.push(this.add.text(30, colTop - 44, `Colección · ${LINES.length - missing.length}/${LINES.length} cartas`, textStyle(24)));
    [...rest, ...missing].forEach((line, i) => this.cardAt(line, cellPos(i, colTop), false));

    if (this.swapping) {
      this.info.setText(`Toca la carta del mazo que quieres cambiar por ${getCard(cardIdFor(p, this.swapping)).name}.`).setColor(css(COLORS.gold));
    } else {
      this.info.setText('Toca una carta para ver su ficha, usarla en el mazo o evolucionarla.').setColor('#c9d4f5');
    }
  }

  private cardAt(line: string, pos: { x: number; y: number }, inDeck: boolean): void {
    const p = this.profile;
    const own = p.owned[line];
    const w = new CardWidget(this, pos.x, pos.y, CARD_W, CARD_H);
    w.setCard(own ? cardIdFor(p, line) : line);
    if (!own) {
      w.setLocked('En Pokéballs');
    } else {
      const c = evolveCost(p, line);
      w.setProgress(maxStage(line), own.copies, c ? c.copies : null, canEvolve(p, line));
    }
    if (inDeck && this.swapping) w.setSelected(true, pos.y + 14);
    w.onTap(() => this.tap(line, inDeck));
    w.root.setData('line', line);
    this.layer.push(w.root);
  }

  private tap(line: string, inDeck: boolean): void {
    if (this.swapping && inDeck) {
      const i = this.deck.indexOf(line);
      const next = this.deck.slice();
      next[i] = this.swapping;
      this.swapping = null;
      if (validateDeck(next).ok) {
        this.deck = next;
        this.settings.deck = next.slice();
        saveSettings(this.settings);
        play('despliegue');
      }
      this.renderAll();
      return;
    }
    if (this.swapping) {
      this.swapping = null;
      this.renderAll();
    }
    this.openDetail(line, inDeck);
  }

  /** Ficha de la carta con sus acciones (usar, evolucionar). */
  private openDetail(line: string, inDeck: boolean): void {
    play('seleccion');
    const p = this.profile;
    const own = p.owned[line];
    const actions: CardDetailAction[] = [];
    if (own && !inDeck) {
      actions.push({
        label: 'Usar',
        color: COLORS.ok,
        onClick: () => {
          this.closeDetail();
          this.swapping = line;
          this.renderAll();
        },
      });
    }
    if (own && canEvolve(p, line)) {
      const c = evolveCost(p, line)!;
      actions.push({
        label: `Evolucionar · ${c.coins}`,
        icon: 'moneda',
        color: 0xf2782f,
        onClick: () => {
          const before = getCard(cardIdFor(p, line)).name;
          if (evolve(p, line)) {
            saveProfile(p);
            play('victoria');
            this.closeDetail();
            this.renderAll();
            this.celebrate(`¡${before} ha evolucionado a ${getCard(cardIdFor(p, line)).name}!`);
            this.openDetail(line, inDeck);
          }
        },
      });
    }
    this.detail = new CardDetail(this, own ? cardIdFor(p, line) : line, {
      locked: own ? undefined : 'Aún no la tienes: puede salir en cualquier Pokéball.',
      notes: evolutionNotes(p, line),
      actions,
      onClose: () => (this.detail = null),
    });
  }

  private closeDetail(): void {
    this.detail?.destroy();
    this.detail = null;
  }

  private celebrate(text: string): void {
    const t = this.add.text(GAME_W / 2, GAME_H / 2, text, textStyle(30, css(COLORS.gold), { align: 'center', wordWrap: { width: GAME_W - 80 } })).setOrigin(0.5).setDepth(1500).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 320, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1600, duration: 400, onComplete: () => t.destroy() });
  }
}
