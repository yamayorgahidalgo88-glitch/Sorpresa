import Phaser from 'phaser';
import type { Difficulty } from '../../sim/ai/opponent';
import type { BattleResult } from '../../sim/core/state';
import type { Command } from '../../sim/battle';
import { loadProfile, recordResult, saveProfile } from '../../persistence/settings';
import { recordChallenge } from '../../persistence/economy';
import type { BattleMode } from './BattleScene';
import { rankOf } from '../../persistence/progression';
import { GAME_H, GAME_W } from '../layout';
import { icon, iconLabel } from '../ui/icons';
import { COLORS, css, textStyle } from '../theme';
import { makeButton } from '../ui/widgets';

export interface ResultData {
  result: BattleResult;
  difficulty: Difficulty;
  deck: string[];
  seed: number;
  cardsPlayed: number;
  energySpent: number;
  towerDamage: [number, number];
  defeated: [number, number];
  replay: { seed: number; decks: [string[], string[]]; log: Command[] };
  mode?: BattleMode;
}

const REASONS: Record<BattleResult['reason'], string> = {
  base_destruida: 'Base principal derribada',
  tiempo: 'Fin del tiempo: más medallas',
  muerte_subita: 'Muerte súbita en la prórroga',
  desempate: 'Desempate por salud de las torres',
  empate: 'Torres con la misma salud',
};

/** Pantalla de resultados superpuesta a la batalla. */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super('result');
  }

  create(data: ResultData): void {
    const r = data.result;
    const mode = data.mode ?? 'normal';
    const title = r.winner === 0 ? '¡VICTORIA!' : r.winner === 1 ? 'DERROTA' : 'EMPATE';
    const color = r.winner === 0 ? COLORS.gold : r.winner === 1 ? COLORS.danger : 0xc9d4f5;

    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0b1022, 0.72).setOrigin(0).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 1).fillRoundedRect(60, 300, GAME_W - 120, 780, 28);
    panel.lineStyle(4, color, 1).strokeRoundedRect(60, 300, GAME_W - 120, 780, 28);

    const t = this.add.text(GAME_W / 2, 420, title, textStyle(64, css(color))).setOrigin(0.5).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 420, ease: 'Back.Out' });
    this.add.text(GAME_W / 2, 490, REASONS[r.reason], textStyle(20, '#dfe7ff')).setOrigin(0.5);

    // Medallas
    const row = (label: string, count: number, y: number, team: 0 | 1) => {
      this.add.text(150, y, label, textStyle(22, css(COLORS.team[team]))).setOrigin(0, 0.5);
      for (let i = 0; i < 3; i++) icon(this, 420 + i * 58, y, i < count ? 'medalla' : 'medalla-vacia', 46);
    };
    row('Tú', r.medals[0], 570, 0);
    row('Rival', r.medals[1], 630, 1);

    const base = [
      `Daño a torres: ${data.towerDamage[0]} (rival ${data.towerDamage[1]})   ·   Pokémon derrotados: ${data.defeated[0]}`,
      `Cartas jugadas: ${data.cardsPlayed}   ·   Energía gastada: ${data.energySpent}`,
      `Duración: ${Math.floor(r.tick / 20 / 60)}:${String(Math.floor(r.tick / 20) % 60).padStart(2, '0')}   ·   Semilla: ${data.seed}`,
    ];
    const prizeName = { poke: 'Pokéball', super: 'Superball', ultra: 'Ultraball', master: 'Master Ball' };
    const back = () => this.scene.stop('battle');
    let summary: unknown = {};

    if (mode === 'desafio') {
      // Desafío: no hay trofeos; cada victoria suma monedas y al final se gana una Pokéball
      const profile = loadProfile();
      const up = recordChallenge(profile, r.winner);
      saveProfile(profile);
      summary = { challenge: up };
      base.forEach((l, i) => this.add.text(GAME_W / 2, 690 + i * 32, l, textStyle(17, '#c9d4f5')).setOrigin(0.5));
      iconLabel(this, GAME_W / 2, 800, 'trofeo', `Desafío: ${up.wins} victorias · ${up.losses}/3 derrotas`, 22, css(COLORS.gold), 0.5);
      if (up.coins) iconLabel(this, GAME_W / 2, 838, 'moneda', `+${up.coins}`, 21, '#ffe27a', 0.5);
      if (up.ended) {
        const msg = up.prize ? `¡Desafío terminado! Premio: ${prizeName[up.prize]} (ábrela en la Tienda)` : 'Desafío terminado: sin premio (hacían falta 3 victorias)';
        const n = this.add.text(GAME_W / 2, 878, msg, textStyle(18, css(up.prize ? COLORS.ok : COLORS.danger), { align: 'center', wordWrap: { width: GAME_W - 160 } })).setOrigin(0.5);
        this.tweens.add({ targets: n, scale: 1.06, yoyo: true, repeat: 3, duration: 260 });
      }
      makeButton(this, GAME_W / 2 - 100, 950, 260, 74, up.ended ? 'Ver desafío' : 'Siguiente', () => {
        back();
        this.scene.start('desafio');
      });
    } else if (mode === 'igualado') {
      base.forEach((l, i) => this.add.text(GAME_W / 2, 700 + i * 32, l, textStyle(17, '#c9d4f5')).setOrigin(0.5));
      this.add.text(GAME_W / 2, 830, 'Combate igualado: todas las cartas en fase máxima.\nNo cuenta para trofeos ni monedas.', textStyle(18, '#c9d4f5', { align: 'center' })).setOrigin(0.5);
      makeButton(this, GAME_W / 2 - 100, 950, 260, 74, 'Otra vez', () => {
        back();
        this.scene.start('battle', { difficulty: data.difficulty, deck: data.deck, mode: 'igualado' });
      });
    } else {
      const { stats, progress, coins, road } = recordResult(r.winner, data.difficulty, undefined, r.medals[0]);
      summary = { progress, coins, road };
      [...base, `Historial: ${stats.wins} V · ${stats.losses} D · ${stats.draws} E`].forEach((l, i) =>
        this.add.text(GAME_W / 2, 690 + i * 32, l, textStyle(17, '#c9d4f5')).setOrigin(0.5),
      );
      const rank = rankOf(progress.after);
      const sign = progress.delta > 0 ? '+' : '';
      const trophyColor = progress.delta > 0 ? css(COLORS.gold) : progress.delta < 0 ? css(COLORS.danger) : '#c9d4f5';
      iconLabel(this, GAME_W / 2 - 60, 818, 'trofeo', `${sign}${progress.delta} · Total ${progress.after} · ${rank.name}`, 21, trophyColor, 0.5);
      iconLabel(this, GAME_W - 150, 818, 'moneda', `+${coins}`, 21, '#ffe27a', 0);
      const news: string[] = [];
      if (progress.rankUp) news.push(`¡Nuevo rango: ${progress.rankUp}!`);
      for (const rw of road) news.push(`¡Premio del camino: ${rw.ball ? prizeName[rw.ball] : `${rw.coins} monedas`}!`);
      if (news.length) {
        const n = this.add.text(GAME_W / 2, 868, news.join('  ·  '), textStyle(19, css(COLORS.ok))).setOrigin(0.5);
        this.tweens.add({ targets: n, scale: 1.08, yoyo: true, repeat: 3, duration: 260 });
      }
      makeButton(this, GAME_W / 2 - 100, 935, 260, 74, 'Revancha', () => {
        back();
        this.scene.start('battle', { difficulty: data.difficulty, deck: data.deck });
      });
    }
    makeButton(this, GAME_W / 2 + 140, mode === 'normal' ? 935 : 950, 200, 74, 'Repetición', () => {
      back();
      this.scene.start('battle', { difficulty: data.difficulty, deck: data.deck, replay: data.replay });
    }, 0x3d8bff);
    makeButton(this, GAME_W / 2, 1035, 380, 64, 'Menú principal', () => {
      back();
      this.scene.start('menu');
    }, COLORS.panelLight);
    (window as unknown as { __arenaResult?: unknown }).__arenaResult = { ...data.result, ...(summary as object), mode };
  }
}
