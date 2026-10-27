import Phaser from 'phaser';
import { Battle } from '../../sim/battle';
import type { DeployFailure } from '../../sim/battle';
import { DIFFICULTIES, OpponentAI } from '../../sim/ai/opponent';
import type { Difficulty } from '../../sim/ai/opponent';
import { observe } from '../../sim/ai/observation';
import { deriveSeed } from '../../sim/core/rng';
import type { SimEvent, Team } from '../../sim/core/state';
import type { Vec } from '../../sim/core/vec';
import { snapToTile } from '../../sim/data/arena';
import { DEFAULT_RIVAL_DECK, getCard } from '../../sim/data/cards';
import { ELEMENT_COLORS } from '../../sim/data/elements';
import { play } from '../audio/sfx';
import { DeployController } from '../input/deployController';
import {
  CARD_H,
  CARD_W,
  ENERGY_Y,
  FIELD_Y,
  GAME_H,
  GAME_W,
  HAND_Y,
  HUD_Y,
  NEXT_W,
  TILE,
  cardSlotRect,
  tileToScreen,
} from '../layout';
import { Effects } from '../render/effects';
import { FieldRenderer } from '../render/fieldRenderer';
import { TowerView, UnitView } from '../render/views';
import { COLORS, css, textStyle } from '../theme';
import { CardWidget } from '../ui/widgets';

export interface BattleSceneData {
  difficulty: Difficulty;
  deck: string[];
  seed?: number;
}

const REJECT_TEXT: Record<DeployFailure, string> = {
  partida_terminada: 'La partida ha terminado',
  carta_no_en_mano: 'Esa carta ya no está en tu mano',
  energia_insuficiente: '¡Energía insuficiente!',
  zona_no_permitida: 'No puedes desplegar ahí',
};

/** Escena de combate: une simulación, IA, entrada, vistas y HUD. */
export class BattleScene extends Phaser.Scene {
  battle!: Battle;
  controller!: DeployController;
  private ai!: OpponentAI;
  private data_!: BattleSceneData;
  private field!: FieldRenderer;
  private fx!: Effects;
  private readonly unitViews = new Map<number, UnitView>();
  private readonly towerViews = new Map<number, TowerView>();
  private readonly projViews = new Map<number, Phaser.GameObjects.Arc>();
  private prevPos = new Map<number, Vec>();
  private acc = 0;
  private stepMs = 50;
  private ending = false;
  private cards: CardWidget[] = [];
  private nextCard!: CardWidget;
  private energyBar!: Phaser.GameObjects.Graphics;
  private energyText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private medalsGfx!: Phaser.GameObjects.Graphics;
  private ghost!: Phaser.GameObjects.Graphics;
  private toastText!: Phaser.GameObjects.Text;
  private toastTween: Phaser.Tweens.Tween | null = null;
  private lastEnergyKey = -1;
  private lastFrame = 0;
  private lastMedalsKey = '';

  constructor() {
    super('battle');
  }

  init(data: BattleSceneData): void {
    this.data_ = data;
    this.unitViews.clear();
    this.towerViews.clear();
    this.projViews.clear();
    this.prevPos = new Map();
    this.acc = 0;
    this.ending = false;
    this.cards = [];
    this.lastEnergyKey = -1;
    this.lastMedalsKey = '';
    this.lastFrame = 0;
  }

  create(): void {
    const seed = (this.data_.seed ?? (Date.now() ^ Math.floor(Math.random() * 0x7fffffff))) >>> 0;
    this.battle = new Battle({ seed, decks: [this.data_.deck, DEFAULT_RIVAL_DECK] });
    this.stepMs = 1000 / this.battle.rules.tickRate;
    this.ai = new OpponentAI(1, DIFFICULTIES[this.data_.difficulty], deriveSeed(seed, 7));

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.field = new FieldRenderer(this);
    this.fx = new Effects(this);
    for (const t of this.battle.world.towers) {
      const s = tileToScreen(t.pos);
      this.towerViews.set(t.id, new TowerView(this, t, s.x, s.y));
    }
    this.ghost = this.add.graphics().setDepth(150);
    this.buildHud();

    this.controller = new DeployController({
      canDeploy: (slot, tile) => this.battle.canDeploy(0, this.battle.hand(0)[slot], tile).ok,
      deploy: (slot, tile) => {
        const r = this.battle.deploy(0, this.battle.hand(0)[slot], tile);
        if (!r.ok) this.toast(REJECT_TEXT[r.reason], css(COLORS.danger));
        return r.ok;
      },
      onSelect: (slot) => {
        this.cards.forEach((c, i) => c.setSelected(i === slot, HAND_Y));
        this.field.showZones(this.battle, 0, slot === null ? null : this.battle.hand(0)[slot]);
        if (slot !== null) play('seleccion');
      },
      onReject: (slot) => {
        this.cards[slot]?.shake();
        play('rechazo');
      },
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.controller.pointerDown(p.x, p.y));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.controller.pointerMove(p.x, p.y));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.controller.pointerUp(p.x, p.y));
    this.input.keyboard?.on('keydown-ESC', () => this.controller.cancel());
    // Teclas 1-4 seleccionan carta (comodidad en ordenador).
    for (let i = 0; i < 4; i++) {
      this.input.keyboard?.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR'][i]}`, () => {
        const r = cardSlotRect(i);
        this.controller.pointerDown(r.x + 5, r.y + 5);
        this.controller.pointerUp(r.x + 5, r.y + 5);
      });
    }

    this.toast('Toca una carta y después el campo · o arrástrala', '#ffffff', 3200);
    (window as unknown as { __arena?: unknown }).__arena = { scene: this, battle: this.battle, seed };
  }

  // ------------------------------------------------------------------ HUD

  private buildHud(): void {
    const top = this.add.graphics().setDepth(190);
    top.fillStyle(COLORS.panel, 1).fillRect(0, 0, GAME_W, FIELD_Y - 10);
    top.fillStyle(0x000000, 0.25).fillRect(0, FIELD_Y - 12, GAME_W, 2);
    this.add.text(20, 14, 'RIVAL', textStyle(14, css(COLORS.team[1]))).setDepth(195);
    this.add.text(GAME_W - 20, 14, 'TÚ', textStyle(14, css(COLORS.team[0]))).setOrigin(1, 0).setDepth(195);
    this.medalsGfx = this.add.graphics().setDepth(195);
    this.timerText = this.add.text(GAME_W / 2, 6, '3:00', textStyle(28)).setOrigin(0.5, 0).setDepth(195);
    this.phaseText = this.add.text(GAME_W / 2, 38, '', textStyle(12, css(COLORS.gold))).setOrigin(0.5, 0).setDepth(195);

    const bottom = this.add.graphics().setDepth(190);
    bottom.fillStyle(COLORS.panel, 1).fillRect(0, HUD_Y, GAME_W, GAME_H - HUD_Y);
    bottom.fillStyle(0x000000, 0.3).fillRect(0, HUD_Y, GAME_W, 3);

    this.add.text(16 + NEXT_W / 2, HAND_Y + 6, 'Siguiente', textStyle(13, '#c9d4f5')).setOrigin(0.5, 0).setDepth(201);
    this.nextCard = new CardWidget(this, 16, HAND_Y + 28, NEXT_W, 106, true);
    for (let i = 0; i < 4; i++) {
      const r = cardSlotRect(i);
      this.cards.push(new CardWidget(this, r.x, r.y, CARD_W, CARD_H));
    }

    this.energyBar = this.add.graphics().setDepth(201);
    this.energyText = this.add.text(16 + NEXT_W / 2, ENERGY_Y + 17, '5', textStyle(24)).setOrigin(0.5).setDepth(203);

    this.toastText = this.add.text(GAME_W / 2, HUD_Y - 40, '', textStyle(20)).setOrigin(0.5).setDepth(400).setAlpha(0);

    // Botón para abandonar
    const exit = this.add.text(GAME_W / 2 + 120, 12, '✕ Salir', textStyle(14, '#c9d4f5')).setDepth(196).setInteractive({ useHandCursor: true });
    exit.on('pointerup', () => this.scene.start('menu'));
  }

  private renderHud(): void {
    const b = this.battle;
    const hand = b.hand(0);
    const energy = b.energy(0);
    hand.forEach((id, i) => {
      this.cards[i].setCard(id);
      this.cards[i].setAffordability(energy);
    });
    this.nextCard.setCard(b.nextCard(0));

    const energyKey = Math.floor(energy * 50);
    if (energyKey !== this.lastEnergyKey) {
      this.lastEnergyKey = energyKey;
      this.drawEnergy(energy);
    }
    this.energyText.setText(String(b.energyPoints(0)));

    const secs = Math.ceil(b.secondsLeft);
    this.timerText.setText(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`);
    this.timerText.setColor(secs <= 10 && !b.isOver ? css(COLORS.danger) : '#ffffff');
    const phase = b.phase === 'doble' ? 'ENERGÍA x2' : b.phase === 'prorroga' ? 'PRÓRROGA · MUERTE SÚBITA · x3' : '';
    this.phaseText.setText(phase);

    const medalsKey = `${b.medals(0)}-${b.medals(1)}`;
    if (medalsKey !== this.lastMedalsKey) {
      this.lastMedalsKey = medalsKey;
      this.drawMedals();
    }
  }

  private drawEnergy(energy: number): void {
    const g = this.energyBar;
    const x0 = 16 + NEXT_W + 12;
    const w = GAME_W - 16 - x0;
    const h = 30;
    g.clear();
    g.fillStyle(COLORS.energyDark, 1).fillCircle(16 + NEXT_W / 2, ENERGY_Y + 17, 22);
    g.fillStyle(COLORS.energy, 1).fillCircle(16 + NEXT_W / 2, ENERGY_Y + 17, 18);
    g.fillStyle(0x0b1022, 1).fillRoundedRect(x0, ENERGY_Y + 2, w, h, 10);
    g.fillStyle(COLORS.energy, 1).fillRoundedRect(x0 + 3, ENERGY_Y + 5, Math.max(0, (w - 6) * (energy / 10)), h - 6, 8);
    g.fillStyle(0xffffff, 0.18).fillRect(x0 + 3, ENERGY_Y + 6, Math.max(0, (w - 6) * (energy / 10)), 6);
    g.lineStyle(2, 0x0b1022, 0.8);
    for (let i = 1; i < 10; i++) {
      const sx = x0 + (w * i) / 10;
      g.lineBetween(sx, ENERGY_Y + 4, sx, ENERGY_Y + h);
    }
  }

  private drawMedals(): void {
    const b = this.battle;
    const m = this.medalsGfx;
    m.clear();
    const drawMedals = (team: Team, x: number, dir: number) => {
      const count = b.medals(team);
      for (let i = 0; i < 3; i++) {
        const cx = x + dir * i * 26;
        m.fillStyle(0x0b1022, 1).fillCircle(cx, 44, 11);
        m.fillStyle(i < count ? COLORS.gold : 0x3a4670, 1).fillCircle(cx, 44, 9);
        if (i < count) m.lineStyle(2, COLORS.team[team], 1).strokeCircle(cx, 44, 10);
      }
    };
    drawMedals(1, 30, 1);
    drawMedals(0, GAME_W - 30, -1);
  }

  private toast(text: string, color = '#ffffff', ms = 1100): void {
    this.toastTween?.stop();
    this.toastText.setText(text).setColor(color).setAlpha(1).setScale(1);
    this.toastTween = this.tweens.add({ targets: this.toastText, alpha: 0, delay: ms, duration: 400 });
  }

  private banner(text: string, color: number): void {
    const t = this.add.text(GAME_W / 2, FIELD_Y + 16 * TILE, text, textStyle(44, css(color))).setOrigin(0.5).setDepth(450).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1300, duration: 400, onComplete: () => t.destroy() });
  }

  // ------------------------------------------------------------------ bucle

  override update(time: number): void {
    // Tiempo real transcurrido: Phaser suaviza `delta` y, con fotogramas lentos, la
    // simulación iría más despacio que el reloj. Tope de 250 ms para evitar espirales.
    const now = performance.now();
    const delta = this.lastFrame === 0 ? 0 : now - this.lastFrame;
    this.lastFrame = now;
    this.acc += Math.min(delta, 250);
    while (this.acc >= this.stepMs && !this.battle.isOver) {
      this.simStep();
      this.acc -= this.stepMs;
    }
    const alpha = this.battle.isOver ? 1 : this.acc / this.stepMs;
    this.renderWorld(alpha, time);
    this.renderGhost();
    this.renderHud();
    this.field.update(time);
  }

  /** Un paso de simulación: la IA decide con la información visible y se avanza la batalla. */
  simStep(): void {
    const b = this.battle;
    const action = this.ai.decide(observe(b, 1));
    if (action) b.deploy(1, action.cardId, action.pos);
    this.prevPos = new Map();
    for (const u of b.world.units) this.prevPos.set(u.id, { x: u.pos.x, y: u.pos.y });
    for (const p of b.world.projectiles) this.prevPos.set(p.id, { x: p.pos.x, y: p.pos.y });
    this.handleEvents(b.step());
  }

  private lerpScreen(id: number, cur: Vec, alpha: number): Vec {
    const prev = this.prevPos.get(id) ?? cur;
    return tileToScreen({ x: prev.x + (cur.x - prev.x) * alpha, y: prev.y + (cur.y - prev.y) * alpha });
  }

  private renderWorld(alpha: number, time: number): void {
    const b = this.battle;
    for (const u of b.world.units) {
      const v = this.unitViews.get(u.id);
      if (!v) continue;
      const s = this.lerpScreen(u.id, u.pos, alpha);
      v.sync(u, s.x, s.y, time, b.tick);
    }
    for (const t of b.world.towers) this.towerViews.get(t.id)?.sync(t);
    const live = new Set<number>();
    for (const p of b.world.projectiles) {
      live.add(p.id);
      const v = this.projViews.get(p.id);
      if (!v) continue;
      const s = this.lerpScreen(p.id, p.pos, alpha);
      v.setPosition(s.x, s.y - 8);
    }
    for (const [id, v] of this.projViews) {
      if (!live.has(id)) {
        v.destroy();
        this.projViews.delete(id);
      }
    }
  }

  private renderGhost(): void {
    const g = this.ghost;
    g.clear();
    const pv = this.controller.preview;
    if (!pv) return;
    const cardId = this.battle.hand(0)[pv.slot];
    if (!cardId) return;
    const card = getCard(cardId);
    const s = tileToScreen(snapToTile(pv.tile));
    const color = pv.valid ? COLORS.ok : COLORS.danger;
    if (card.kind === 'hechizo') {
      g.fillStyle(color, 0.22).fillCircle(s.x, s.y, card.radius * TILE);
      g.lineStyle(3, color, 0.9).strokeCircle(s.x, s.y, card.radius * TILE);
    } else {
      g.lineStyle(2, 0xffffff, 0.35).strokeCircle(s.x, s.y, (card.range + card.radius) * TILE);
      g.fillStyle(color, 0.45).fillCircle(s.x, s.y, card.radius * TILE + 4);
      g.lineStyle(3, color, 1).strokeCircle(s.x, s.y, card.radius * TILE + 4);
      if (card.count > 1) g.fillStyle(0xffffff, 0.8).fillCircle(s.x, s.y, 3);
    }
  }

  // ------------------------------------------------------------------ eventos

  private screenOf(id: number): Vec | null {
    // La vista conserva la última posición dibujada aunque la entidad acabe de morir.
    const v = this.unitViews.get(id);
    if (v) return { x: v.root.x, y: v.bodyY };
    const e = this.battle.world.entities.get(id);
    if (!e) return null;
    const s = tileToScreen(e.pos);
    if (e.kind === 'unit' && e.locomotion === 'aire') s.y -= 18;
    return s;
  }

  private handleEvents(events: SimEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'despliegue': {
          for (const id of e.unitIds) {
            const u = this.battle.world.entities.get(id);
            if (u && u.kind === 'unit') this.unitViews.set(id, new UnitView(this, u));
          }
          const s = tileToScreen(e.pos);
          this.fx.ring(s.x, s.y, 46, COLORS.team[e.team], 380);
          if (e.team === 0) play('despliegue');
          break;
        }
        case 'hechizo_lanzado': {
          const s = tileToScreen(e.pos);
          const card = getCard(e.cardId);
          if (card.kind === 'hechizo') this.fx.telegraph(s.x, s.y, card.radius * TILE, ELEMENT_COLORS[card.types[0]], e.delayTicks * this.stepMs);
          play('hechizo');
          break;
        }
        case 'hechizo_impacto': {
          const s = tileToScreen(e.pos);
          if (e.cardId === 'rayo') this.fx.lightningStrike(s.x, s.y, e.radius * TILE);
          else this.fx.blizzard(s.x, s.y, e.radius * TILE);
          break;
        }
        case 'ataque': {
          const target = this.screenOf(e.targetId);
          const uv = this.unitViews.get(e.sourceId);
          if (uv && target) uv.attack(target.x, target.y, e.melee);
          this.towerViews.get(e.sourceId)?.shoot();
          break;
        }
        case 'proyectil': {
          const src = this.screenOf(e.sourceId);
          if (!src) break;
          const srcEnt = this.battle.world.entities.get(e.sourceId);
          const color = e.element ? ELEMENT_COLORS[e.element] : srcEnt ? COLORS.team[srcEnt.team] : 0xffffff;
          const c = this.add.circle(src.x, src.y, e.element ? 6 : 7, color, 1).setDepth(50);
          c.setStrokeStyle(2, 0xffffff, 0.9);
          this.projViews.set(e.projectileId, c);
          break;
        }
        case 'impacto_area': {
          const s = tileToScreen(e.pos);
          this.fx.ring(s.x, s.y, e.radius * TILE, e.element ? ELEMENT_COLORS[e.element] : 0xffffff, 320);
          break;
        }
        case 'cadena':
          this.fx.zigzag(e.points.map((p) => tileToScreen(p)));
          break;
        case 'dano': {
          const s = this.screenOf(e.targetId);
          this.unitViews.get(e.targetId)?.hitFlash();
          this.towerViews.get(e.targetId)?.hitFlash();
          if (s && e.amount > 0) {
            if (e.effectiveness === 'eficaz') {
              this.fx.floatText(s.x, s.y - 20, `-${e.amount}`, '#ffb13b', 20);
              play('eficaz');
            } else if (e.effectiveness === 'poco_eficaz') {
              this.fx.floatText(s.x, s.y - 20, `-${e.amount}`, '#9aa3b8', 14);
            } else {
              this.fx.floatText(s.x, s.y - 20, `-${e.amount}`, '#ffffff', 16);
            }
            play('golpe');
          }
          break;
        }
        case 'curacion': {
          const s = this.screenOf(e.targetId);
          if (s) this.fx.floatText(s.x, s.y - 26, `+${e.amount}`, '#7dff8a', 16);
          break;
        }
        case 'canto': {
          const s = tileToScreen(e.pos);
          this.fx.notes(s.x, s.y, e.radius * TILE);
          break;
        }
        case 'explosion': {
          const s = tileToScreen(e.pos);
          this.fx.explosion(s.x, s.y, e.radius * TILE);
          break;
        }
        case 'muerte': {
          const v = this.unitViews.get(e.unitId);
          const s = tileToScreen(e.pos);
          this.fx.puff(s.x, s.y, ELEMENT_COLORS[getCard(e.cardId).types[0]]);
          v?.die();
          this.unitViews.delete(e.unitId);
          break;
        }
        case 'torre_destruida': {
          const t = this.battle.world.entities.get(e.towerId);
          if (t) {
            const s = tileToScreen(t.pos);
            this.fx.towerCollapse(s.x, s.y);
          }
          play('torre');
          this.toast(e.team === 1 ? '¡Torre rival derribada!' : '¡Han derribado tu torre!', css(e.team === 1 ? COLORS.gold : COLORS.danger), 1600);
          break;
        }
        case 'base_activada':
          this.toast(e.team === 1 ? 'La base rival se ha activado' : 'Tu base se ha activado', '#ffffff', 1400);
          break;
        case 'fase':
          if (e.phase === 'doble') this.banner('¡ENERGÍA x2!', COLORS.energy);
          if (e.phase === 'prorroga') this.banner('¡PRÓRROGA!', COLORS.gold);
          break;
        case 'fin':
          this.endBattle();
          break;
      }
    }
  }

  private endBattle(): void {
    if (this.ending) return;
    this.ending = true;
    this.controller.cancel();
    const r = this.battle.result!;
    play(r.winner === 0 ? 'victoria' : r.winner === 1 ? 'derrota' : 'seleccion');
    this.time.delayedCall(1300, () => {
      this.scene.launch('result', {
        result: r,
        difficulty: this.data_.difficulty,
        deck: this.data_.deck,
        seed: this.battle.seed,
        cardsPlayed: this.battle.player(0).cardsPlayed,
        energySpent: this.battle.player(0).energySpent,
        towerDamage: [this.battle.player(0).towerDamage, this.battle.player(1).towerDamage],
        defeated: [this.battle.player(0).defeated, this.battle.player(1).defeated],
      });
      this.scene.pause();
    });
  }
}
