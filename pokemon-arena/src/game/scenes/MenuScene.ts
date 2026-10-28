import Phaser from 'phaser';
import type { Difficulty } from '../../sim/ai/opponent';
import { getCard } from '../../sim/data/cards';
import { loadSettings, loadStats, saveSettings } from '../../persistence/settings';
import { nextUnlock, rankOf } from '../../persistence/progression';
import type { Settings } from '../../persistence/settings';
import { setMuted, unlockAudio } from '../audio/sfx';
import { GAME_H, GAME_W } from '../layout';
import { creatureTexture } from '../render/creatureArt';
import { COLORS, css, textStyle } from '../theme';
import { makeButton } from '../ui/widgets';

const DIFF_LABEL: Record<Difficulty, string> = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' };
const DIFF_ORDER: Difficulty[] = ['facil', 'normal', 'dificil'];

export class MenuScene extends Phaser.Scene {
  private settings!: Settings;

  constructor() {
    super('menu');
  }

  create(): void {
    this.settings = loadSettings();
    setMuted(this.settings.muted);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.input.once('pointerdown', () => unlockAudio());

    // Fondo: franjas diagonales suaves
    const bg = this.add.graphics();
    for (let i = -10; i < 20; i++) {
      bg.fillStyle(i % 2 === 0 ? 0x1a2647 : 0x16203a, 1);
      bg.fillPoints([{ x: i * 80, y: 0 }, { x: i * 80 + 80, y: 0 }, { x: i * 80 + 80 - 400, y: GAME_H }, { x: i * 80 - 400, y: GAME_H }], true);
    }

    // Desfile de fichas
    const parade = ['pikachu', 'charmeleon', 'squirtle', 'bulbasaur', 'jigglypuff', 'charizard', 'onix', 'machop'];
    parade.forEach((id, i) => {
      const x = 90 + (i % 4) * 180;
      const y = i < 4 ? 120 : 1260;
      const g = this.add.image(x, y, creatureTexture(this, id, 34));
      this.tweens.add({ targets: g, y: y - 14, duration: 600 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });

    const title = this.add.text(GAME_W / 2, 300, 'POKÉMON\nARENA', textStyle(92, css(COLORS.gold), { align: 'center', strokeThickness: 12 })).setOrigin(0.5);
    title.setLineSpacing(-10);
    this.tweens.add({ targets: title, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add.text(GAME_W / 2, 430, 'Estrategia en tiempo real con cartas', textStyle(22, '#dfe7ff')).setOrigin(0.5);

    makeButton(this, GAME_W / 2, 560, 440, 96, '¡A combatir!', () => {
      unlockAudio();
      this.scene.start('battle', { difficulty: this.settings.difficulty, deck: this.settings.deck, seed: seedFromUrl() });
    });

    const diffBtn = makeButton(this, GAME_W / 2, 680, 440, 70, `Dificultad: ${DIFF_LABEL[this.settings.difficulty]}`, () => {
      const i = DIFF_ORDER.indexOf(this.settings.difficulty);
      this.settings.difficulty = DIFF_ORDER[(i + 1) % DIFF_ORDER.length];
      saveSettings(this.settings);
      (diffBtn.list[1] as Phaser.GameObjects.Text).setText(`Dificultad: ${DIFF_LABEL[this.settings.difficulty]}`);
    }, COLORS.panelLight);

    makeButton(this, GAME_W / 2 - 112, 780, 216, 70, 'Mazo', () => this.scene.start('deck'), 0x3d8bff);
    makeButton(this, GAME_W / 2 + 112, 780, 216, 70, 'Colección', () => this.scene.start('collection'), 0x45b36b);

    const soundBtn = makeButton(this, GAME_W / 2 - 112, 880, 216, 60, this.soundLabel(), () => {
      this.settings.muted = !this.settings.muted;
      setMuted(this.settings.muted);
      saveSettings(this.settings);
      (soundBtn.list[1] as Phaser.GameObjects.Text).setText(this.soundLabel());
    }, COLORS.panelLight);
    // Vista previa del nuevo apartado visual 3D (escena de referencia).
    makeButton(this, GAME_W / 2 + 112, 880, 216, 60, 'Vista 3D', () => {
      window.location.href = 'referencia.html';
    }, 0xf2782f);

    const deckNames = this.settings.deck.map((id) => getCard(id).name).join(' · ');
    this.add.text(GAME_W / 2, 975, 'Tu mazo', textStyle(18, '#c9d4f5')).setOrigin(0.5);
    this.add.text(GAME_W / 2, 1010, deckNames, textStyle(15, '#ffffff', { align: 'center', wordWrap: { width: 620 } })).setOrigin(0.5, 0);

    const s = loadStats();
    const rank = rankOf(s.trophies);
    const next = nextUnlock(s.trophies);
    this.add.text(GAME_W / 2, 470, `🏆 ${s.trophies} trofeos · ${rank.name}`, textStyle(22, css(COLORS.gold))).setOrigin(0.5);
    this.add.text(GAME_W / 2, 1100, `Victorias ${s.wins} · Derrotas ${s.losses} · Empates ${s.draws}`, textStyle(17, '#c9d4f5')).setOrigin(0.5);
    if (next) {
      this.add
        .text(GAME_W / 2, 1132, `Próximo desbloqueo: ${getCard(next.cardId).name} a los ${next.trophies} trofeos`, textStyle(16, '#9fe8a8'))
        .setOrigin(0.5);
    }
    this.add
      .text(GAME_W / 2, GAME_H - 50, 'Proyecto de fans sin ánimo de lucro. Pokémon es una marca de sus respectivos propietarios.\nGráficos y sonidos originales del prototipo.', textStyle(12, '#8e9bc4', { align: 'center' }))
      .setOrigin(0.5);
  }

  private soundLabel(): string {
    return this.settings.muted ? 'Sonido: no' : 'Sonido: sí';
  }
}

function seedFromUrl(): number | undefined {
  try {
    const v = new URLSearchParams(window.location.search).get('seed');
    if (v === null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n >>> 0 : undefined;
  } catch {
    return undefined;
  }
}
