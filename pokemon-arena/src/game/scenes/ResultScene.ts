import Phaser from 'phaser';
import type { Difficulty } from '../../sim/ai/opponent';
import type { BattleResult } from '../../sim/core/state';
import { recordResult } from '../../persistence/settings';
import { rankOf } from '../../persistence/progression';
import { getCard } from '../../sim/data/cards';
import { GAME_H, GAME_W } from '../layout';
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
    const { stats, progress } = recordResult(r.winner, data.difficulty);
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
    const g = this.add.graphics();
    const row = (label: string, count: number, y: number, team: 0 | 1) => {
      this.add.text(150, y, label, textStyle(22, css(COLORS.team[team]))).setOrigin(0, 0.5);
      for (let i = 0; i < 3; i++) {
        g.fillStyle(0x0b1022, 1).fillCircle(420 + i * 54, y, 21);
        g.fillStyle(i < count ? COLORS.gold : 0x3a4670, 1).fillCircle(420 + i * 54, y, 17);
      }
    };
    row('Tú', r.medals[0], 570, 0);
    row('Rival', r.medals[1], 630, 1);

    const lines = [
      `Daño a torres: ${data.towerDamage[0]} (rival ${data.towerDamage[1]})   ·   Pokémon derrotados: ${data.defeated[0]}`,
      `Cartas jugadas: ${data.cardsPlayed}   ·   Energía gastada: ${data.energySpent}`,
      `Duración: ${Math.floor(r.tick / 20 / 60)}:${String(Math.floor(r.tick / 20) % 60).padStart(2, '0')}   ·   Semilla: ${data.seed}`,
      `Historial: ${stats.wins} V · ${stats.losses} D · ${stats.draws} E`,
    ];
    lines.forEach((l, i) => this.add.text(GAME_W / 2, 690 + i * 32, l, textStyle(17, '#c9d4f5')).setOrigin(0.5));

    // Progresión
    const rank = rankOf(progress.after);
    const sign = progress.delta > 0 ? '+' : '';
    const trophyColor = progress.delta > 0 ? css(COLORS.gold) : progress.delta < 0 ? css(COLORS.danger) : '#c9d4f5';
    this.add.text(GAME_W / 2, 832, `🏆 ${sign}${progress.delta} trofeos · Total ${progress.after} · ${rank.name}`, textStyle(20, trophyColor)).setOrigin(0.5);
    const news: string[] = [];
    if (progress.rankUp) news.push(`¡Nuevo rango: ${progress.rankUp}!`);
    if (progress.newlyUnlocked.length) news.push(`¡Desbloqueado: ${progress.newlyUnlocked.map((id) => getCard(id).name).join(', ')}!`);
    if (news.length) {
      const n = this.add.text(GAME_W / 2, 868, news.join('  ·  '), textStyle(19, css(COLORS.ok))).setOrigin(0.5);
      this.tweens.add({ targets: n, scale: 1.08, yoyo: true, repeat: 3, duration: 260 });
    }

    makeButton(this, GAME_W / 2, 935, 380, 74, 'Revancha', () => {
      this.scene.stop('battle');
      this.scene.start('battle', { difficulty: data.difficulty, deck: data.deck });
    });
    makeButton(this, GAME_W / 2, 1025, 380, 64, 'Menú principal', () => {
      this.scene.stop('battle');
      this.scene.start('menu');
    }, COLORS.panelLight);
    (window as unknown as { __arenaResult?: unknown }).__arenaResult = { ...data.result, progress };
  }
}
