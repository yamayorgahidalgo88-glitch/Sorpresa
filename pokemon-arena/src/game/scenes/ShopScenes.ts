import Phaser from 'phaser';
import { Rng } from '../../sim/core/rng';
import { getCard } from '../../sim/data/cards';
import { BALLS, BALL_ORDER, TROPHY_ROAD, buyBall, openBall } from '../../persistence/economy';
import type { BallKind, Drop, Profile } from '../../persistence/economy';
import { loadProfile, loadStats, saveProfile } from '../../persistence/settings';
import { play } from '../audio/sfx';
import { GAME_H, GAME_W } from '../layout';
import { drawPokeball } from '../render/pokeball';
import { iconLabel } from '../ui/icons';
import { COLORS, bodyStyle, css, textStyle } from '../theme';
import { CardWidget, makeButton } from '../ui/widgets';

function ballSummary(kind: BallKind): string {
  const b = BALLS[kind];
  const parts = [`${b.distinct} cartas distintas`, `${b.min}–${b.max} copias de cada una`, `${Math.round(b.newChance * 100)} % de carta nueva por hueco`];
  if (kind === 'master') parts.push('¡Al menos una ya evolucionada (fase 2)!', `${Math.round(b.stage3Chance * 100)} % de fase 3`);
  else if (b.stage2Chance > 0) parts.push(`${Math.round(b.stage2Chance * 100)} % de fase 2 · ${Math.round(b.stage3Chance * 100)} % de fase 3`);
  return parts.join(' · ');
}

/** Semilla de apertura: el azar del navegador (las aperturas no necesitan reproducirse). */
const openSeed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

/** Tienda: comprar y abrir Pokéballs con monedas, y abrir las que se tienen guardadas. */
export class ShopScene extends Phaser.Scene {
  private profile!: Profile;

  constructor() {
    super('tienda');
  }

  create(): void {
    this.profile = loadProfile();
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.text(30, 26, 'Tienda de Pokéballs', textStyle(36, css(COLORS.gold)));
    iconLabel(this, GAME_W - 30, 48, 'moneda', String(this.profile.coins), 26, '#ffe27a', 1);
    this.add.text(30, 82, 'Gana monedas en cada partida (más si ganas y derribas torres).', bodyStyle(17, '#c9d4f5'));

    BALL_ORDER.forEach((kind, i) => {
      const y = 130 + i * 270;
      const def = BALLS[kind];
      const g = this.add.graphics();
      g.fillStyle(COLORS.panel, 1).fillRoundedRect(20, y, GAME_W - 40, 250, 22);
      g.lineStyle(3, kind === 'master' ? 0xb06ae8 : COLORS.panelLight, 1).strokeRoundedRect(20, y, GAME_W - 40, 250, 22);
      drawPokeball(g, kind, 120, y + 110, 66);
      this.add.text(220, y + 22, def.name, textStyle(32));
      this.add.text(220, y + 68, ballSummary(kind), bodyStyle(17, '#dfe7ff', { wordWrap: { width: GAME_W - 270 }, lineSpacing: 2 }));
      const owned = this.profile.balls[kind];
      const affordable = this.profile.coins >= def.price;
      const buy = makeButton(this, owned > 0 ? 340 : 470, y + 205, 240, 62, `${def.price}`, () => this.buy(kind), affordable ? COLORS.gold : 0x5a6488, 'moneda');
      buy.setData('ball', kind);
      if (owned > 0) {
        const open = makeButton(this, 590, y + 205, 190, 62, `Abrir (${owned})`, () => this.open(kind), COLORS.ok);
        open.setData('ball', kind);
      }
      this.add.text(120, y + 205, def.name === 'Master Ball' ? 'La más difícil' : '', textStyle(13, '#d9b8ff')).setOrigin(0.5);
    });
    makeButton(this, GAME_W / 2, GAME_H - 70, 380, 70, 'Volver', () => this.scene.start('menu'), COLORS.panelLight);
  }

  private buy(kind: BallKind): void {
    if (!buyBall(this.profile, kind)) {
      play('rechazo');
      this.cameras.main.shake(120, 0.004);
      return;
    }
    saveProfile(this.profile);
    this.open(kind);
  }

  private open(kind: BallKind): void {
    const drops = openBall(this.profile, kind, new Rng(openSeed()));
    if (!drops) return;
    saveProfile(this.profile);
    this.scene.start('abrir', { kind, drops, back: 'tienda' } satisfies OpenData);
  }
}

export interface OpenData {
  kind: BallKind;
  drops: Drop[];
  back: string;
}

/**
 * Apertura de una Pokéball: cae, se agita tres veces, destella y muestra cada carta una a
 * una (toca para seguir). Al final, el resumen de todo lo obtenido.
 */
export class OpenBallScene extends Phaser.Scene {
  private data_!: OpenData;
  private index = -1;
  private stageObjs: Phaser.GameObjects.GameObject[] = [];
  private busy = true;

  constructor() {
    super('abrir');
  }

  init(data: OpenData): void {
    this.data_ = data;
    this.index = -1;
    this.stageObjs = [];
    this.busy = true;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0b1022);
    const rays = this.add.graphics();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      rays.fillStyle(i % 2 ? 0x1a2647 : 0x16203a, 1).slice(0, 0, 1200, a, a + Math.PI / 16, false).fillPath();
    }
    rays.setPosition(GAME_W / 2, GAME_H * 0.42);
    this.tweens.add({ targets: rays, angle: 360, duration: 40000, repeat: -1 });
    this.add.text(GAME_W / 2, 80, BALLS[this.data_.kind].name, textStyle(40, css(COLORS.gold))).setOrigin(0.5);

    const ball = this.add.graphics();
    drawPokeball(ball, this.data_.kind, 0, 0, 120);
    ball.setPosition(GAME_W / 2, -200);
    this.tweens.chain({
      targets: ball,
      tweens: [
        { y: GAME_H * 0.42, duration: 520, ease: 'Bounce.Out' },
        { angle: -18, duration: 110, yoyo: true, delay: 250, repeat: 1 },
        { angle: 18, duration: 110, yoyo: true, delay: 200, repeat: 1 },
        { angle: -22, duration: 90, yoyo: true, delay: 200, repeat: 2 },
        {
          scale: 1.25,
          duration: 160,
          onComplete: () => {
            this.cameras.main.flash(300, 255, 255, 255);
            play('victoria');
            ball.destroy();
            this.busy = false;
            this.next();
          },
        },
      ],
    });
    this.input.on('pointerup', () => {
      if (!this.busy && this.index < this.data_.drops.length) this.next();
    });
    (window as unknown as { __opening?: unknown }).__opening = this;
  }

  /** Muestra la siguiente carta o el resumen final. */
  next(): void {
    for (const o of this.stageObjs) o.destroy();
    this.stageObjs = [];
    this.index++;
    const drops = this.data_.drops;
    if (this.index >= drops.length) return this.summary();
    const d = drops[this.index];
    const card = getCard(d.cardId);
    // Carta normal ampliada x2 (así los textos conservan su proporción)
    const w = new CardWidget(this, GAME_W / 2 - 146, GAME_H * 0.42 - 210, 146, 150);
    w.setCard(d.cardId);
    w.root.setScale(0.4).setAlpha(0);
    this.tweens.add({ targets: w.root, scale: 2, alpha: 1, duration: 260, ease: 'Back.Out' });
    this.stageObjs.push(w.root);
    const lines: [string, string][] = [[`x${d.copies}`, '#ffffff']];
    if (d.isNew) lines.unshift(['¡NUEVA CARTA!', css(COLORS.ok)]);
    if (d.upgradedTo) lines.push([`¡Tu carta pasa a ${card.name}!`, css(COLORS.gold)]);
    if (d.coins > 0) lines.push([`Repetida: +${d.coins} monedas`, '#ffe27a']);
    lines.forEach(([t, c], i) => this.stageObjs.push(this.add.text(GAME_W / 2, GAME_H * 0.42 + 140 + i * 48, t, textStyle(i === 0 && d.isNew ? 36 : 30, c)).setOrigin(0.5)));
    this.stageObjs.push(this.add.text(GAME_W / 2, GAME_H - 140, `${this.index + 1}/${drops.length} · Toca para continuar`, textStyle(18, '#c9d4f5')).setOrigin(0.5));
    play(d.isNew || d.upgradedTo ? 'eficaz' : 'seleccion');
  }

  private summary(): void {
    this.busy = true;
    const drops = this.data_.drops;
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 0.96).fillRoundedRect(40, 170, GAME_W - 80, 1010, 24);
    this.add.text(GAME_W / 2, 220, 'Has conseguido', textStyle(34, css(COLORS.gold))).setOrigin(0.5);
    const coins = drops.reduce((s, d) => s + d.coins, 0);
    drops.forEach((d, i) => {
      const card = getCard(d.cardId);
      const tags = [d.isNew ? 'NUEVA' : '', d.upgradedTo ? `→ ${card.name}` : '', d.coins ? `+${d.coins} monedas` : ''].filter(Boolean).join(' · ');
      this.add.text(90, 280 + i * 78, `${card.name}  x${d.copies}`, textStyle(24));
      this.add.text(90, 312 + i * 78, tags || ' ', textStyle(16, d.isNew ? css(COLORS.ok) : '#ffe27a'));
    });
    if (coins > 0) this.add.text(GAME_W / 2, 1110, `Monedas por repetidas: +${coins}`, textStyle(20, '#ffe27a')).setOrigin(0.5);
    makeButton(this, GAME_W / 2, GAME_H - 140, 380, 76, 'Continuar', () => this.scene.start(this.data_.back));
  }
}

/** Camino de trofeos: hitos con su recompensa, conseguidos y pendientes. */
export class TrophyRoadScene extends Phaser.Scene {
  constructor() {
    super('camino');
  }

  create(): void {
    const trophies = loadStats().trophies;
    const profile = loadProfile();
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.text(30, 26, 'Camino de trofeos', textStyle(36, css(COLORS.gold)));
    iconLabel(this, GAME_W - 30, 48, 'trofeo', String(trophies), 26, '#ffe27a', 1);
    this.add.text(30, 80, 'Al llegar a cada hito recibes su premio (una sola vez). Las Pokéballs se abren en la Tienda.', textStyle(15, '#c9d4f5', { wordWrap: { width: GAME_W - 60 } }));
    const rowH = 60;
    const top = 140;
    const line = this.add.graphics();
    line.fillStyle(0x2d3d6b, 1).fillRect(76, top, 8, TROPHY_ROAD.length * rowH);
    TROPHY_ROAD.forEach((r, i) => {
      const y = top + i * rowH + rowH / 2;
      const reached = trophies >= r.trophies;
      const claimed = profile.claimedRoad.includes(r.trophies);
      const g = this.add.graphics();
      g.fillStyle(reached ? COLORS.gold : 0x3a4670, 1).fillCircle(80, y, 14);
      g.fillStyle(reached ? COLORS.panelLight : COLORS.panel, 1).fillRoundedRect(120, y - 25, GAME_W - 150, 50, 14);
      iconLabel(this, 140, y, 'trofeo', String(r.trophies), 20, reached ? '#ffe27a' : '#8e9bc4', 0);
      if (r.ball) drawPokeball(g, r.ball, 300, y, 18);
      const label = r.ball ? BALLS[r.ball].name : `${r.coins} monedas`;
      this.add.text(r.ball ? 330 : 290, y, label, textStyle(20, reached ? '#ffffff' : '#aab4d8')).setOrigin(0, 0.5);
      if (claimed) iconLabel(this, GAME_W - 46, y, 'check', 'Cobrado', 17, css(COLORS.ok), 1);
    });
    makeButton(this, GAME_W / 2, GAME_H - 70, 380, 70, 'Volver', () => this.scene.start('menu'), COLORS.panelLight);
  }
}
