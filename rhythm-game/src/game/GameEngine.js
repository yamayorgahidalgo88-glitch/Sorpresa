// Motor del juego: estado central, reloj, juicios, puntuación, combo, energía,
// RAVE BONUS y rotación de cartas. Es independiente de React; la interfaz se
// suscribe a sus cambios (subscribe/getSnapshot) y el renderer lee su estado.
import { AudioClock } from './audio.js';
import {
  LANES, NOTE_STATE, JUDGE, JUDGE_INFO, TYPE_MULT, DIFFICULTIES,
  RAVE_MAX_LEVEL, RAVE_STEP, ENERGY_MAX, approachTimeForSpeed,
} from './constants.js';

const RESUME_COUNTDOWN_MS = 3000;
const CARD_PERIOD = 16; // s entre cambios de carta

export class GameEngine {
  constructor({ ctx, buffer, chart, song, difficulty = 'normal', speed, calibrationMs = 0, deck = [], themeBonus }) {
    this.ctx = ctx;
    this.buffer = buffer;
    this.song = song;
    this.difficulty = DIFFICULTIES[difficulty] ? difficulty : 'normal';
    this.diff = DIFFICULTIES[this.difficulty];
    this.windows = this.diff.windows;
    this.speed = speed || this.diff.defaultSpeed;
    this.approach = approachTimeForSpeed(this.speed);
    this.deck = deck;
    this.themeBonus = themeBonus || { level: 0, percent: 0, multiplier: 1 };
    this.clock = new AudioClock(ctx);
    this.clock.calibration = calibrationMs / 1000;

    this.chart = chart;
    this.notes = chart.map((n) => ({
      ...n,
      endTime: n.time + (n.type === 'hold' ? n.duration : 0),
      spawnTime: n.time - this.approach,
      state: NOTE_STATE.PENDING,
      judgment: null,
      tailJudgment: null,
      hitAt: null,
      pos: null, // posición calculada por el renderer en cada fotograma
    }));
    this.laneQueues = Array.from({ length: LANES }, () => []);
    this.notes.forEach((n, i) => this.laneQueues[n.lane].push(i));
    this.laneQueues.forEach((q) => q.sort((a, b) => this.notes[a].time - this.notes[b].time));
    this.totalJudgments = this.notes.reduce((a, n) => a + (n.type === 'hold' ? 2 : 1), 0);
    this.lastNoteTime = this.notes.reduce((a, n) => Math.max(a, n.endTime), 0);
    const firstTime = this.notes.length ? this.notes[0].time : 0;
    this.leadIn = Math.max(0, this.approach + 0.6 - firstTime);
    this.endAt = Math.min(buffer.duration, this.lastNoteTime + 4);

    this.listeners = new Set();
    this.frameListeners = new Set();
    this.endListeners = new Set();
    this.fx = []; // eventos visuales pendientes para el renderer
    this.laneDown = new Array(LANES).fill(false);
    this.laneDownCount = new Array(LANES).fill(0);
    this.lanePressPerf = new Array(LANES).fill(-1e9);
    this.state = 'ready';
    this.lastPerf = performance.now();
    this.reset();
  }

  // ---------------------------------------------------------------- estado
  reset() {
    for (const n of this.notes) {
      n.state = NOTE_STATE.PENDING;
      n.judgment = null;
      n.tailJudgment = null;
      n.hitAt = null;
      n.graceUntil = -Infinity;
    }
    this.laneHead = new Array(LANES).fill(0);
    this.holding = new Array(LANES).fill(null);
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.energy = ENERGY_MAX;
    this.raveLevel = 0;
    this.raveGauge = 0;
    this.raveUps = 0;
    this.counts = { SPERFECT: 0, PERFECT: 0, GOOD: 0, MISS: 0 };
    this.judged = 0;
    this.accSum = 0;
    this.lastJudgment = null;
    this.seq = 0;
    this.cardIndex = 0;
    this.songTime = -this.leadIn;
    this.countdown = 0;
    this.countdownEnd = 0;
    this.result = null;
    this.fx.length = 0;
    this.notify();
  }

  start() {
    this.reset();
    this.clock.play(this.buffer, this.leadIn);
    this.state = 'playing';
    this.notify();
  }

  async restart() {
    this.clock.stop();
    if (this.ctx.state !== 'running') await this.ctx.resume();
    this.start();
  }

  pause() {
    if (this.state !== 'playing' && this.state !== 'countdown') return;
    this.state = 'paused';
    this.countdown = 0;
    this.clock.suspend();
    this.notify();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'countdown';
    this.countdownEnd = performance.now() + RESUME_COUNTDOWN_MS;
    this.countdown = Math.ceil(RESUME_COUNTDOWN_MS / 1000);
    this.notify();
  }

  quit() {
    this.clock.stop();
    this.state = 'ended';
    if (this.ctx.state !== 'running') this.ctx.resume();
  }

  // ---------------------------------------------------------------- bucle
  update(perfNow) {
    const dt = Math.min(0.1, Math.max(0, (perfNow - this.lastPerf) / 1000));
    this.lastPerf = perfNow;

    if (this.state === 'countdown') {
      const left = Math.ceil((this.countdownEnd - perfNow) / 1000);
      if (left !== this.countdown) {
        this.countdown = Math.max(0, left);
        this.notify();
      }
      if (perfNow >= this.countdownEnd) {
        this.state = 'resuming';
        this.clock.resume().then(() => {
          if (this.state !== 'resuming') return;
          this.state = 'playing';
          const t = this.clock.songTime();
          // margen para volver a pulsar las notas largas que se mantenían
          for (let l = 0; l < LANES; l++) if (this.holding[l]) this.holding[l].graceUntil = t + 0.35;
          this.notify();
        });
      }
    }

    const t = this.clock.songTime(perfNow);
    if (this.state === 'playing') {
      this.songTime = t;
      this.autoMiss(t);
      this.updateHolds(t);
      this.updateCard(t);
      if (t >= this.endAt) this.finish(true);
    }

    // animación del contador de puntuación
    const diff = this.score - this.displayScore;
    this.displayScore = Math.abs(diff) < 1 ? this.score : this.displayScore + diff * Math.min(1, dt * 10);
    for (const fn of this.frameListeners) fn(this, perfNow);
  }

  autoMiss(t) {
    const g = this.windows.g;
    for (let l = 0; l < LANES; l++) {
      const q = this.laneQueues[l];
      let h = this.laneHead[l];
      while (h < q.length) {
        const n = this.notes[q[h]];
        if (n.state !== NOTE_STATE.PENDING) {
          h++;
          continue;
        }
        if (t > n.time + g) {
          this.missNote(n, t);
          h++;
          continue;
        }
        break;
      }
      this.laneHead[l] = h;
    }
  }

  missNote(n, t) {
    n.state = NOTE_STATE.MISSED;
    n.judgment = JUDGE.MISS;
    n.hitAt = t;
    this.applyJudgment(JUDGE.MISS, n, 0);
    if (n.type === 'hold') {
      n.tailJudgment = JUDGE.MISS;
      this.applyJudgment(JUDGE.MISS, n, 0, true);
    }
  }

  updateHolds(t) {
    for (let l = 0; l < LANES; l++) {
      const n = this.holding[l];
      if (!n) continue;
      if (t >= n.endTime) {
        this.finishHold(n, JUDGE.SPERFECT, 0);
      } else if (!this.laneDown[l] && t > n.graceUntil) {
        this.releaseHold(n, t);
      }
    }
  }

  updateCard(t) {
    if (!this.deck.length) return;
    const idx = (Math.floor(Math.max(0, t) / CARD_PERIOD) + this.raveUps) % this.deck.length;
    if (idx !== this.cardIndex) {
      this.cardIndex = idx;
      this.fx.push({ kind: 'card', perf: performance.now() });
      this.notify();
    }
  }

  // ---------------------------------------------------------------- entrada
  press(lane, perfTs = performance.now()) {
    if (lane < 0 || lane >= LANES) return;
    this.laneDownCount[lane]++;
    this.laneDown[lane] = true;
    this.lanePressPerf[lane] = performance.now();
    if (this.state !== 'playing') return;
    const t = this.clock.songTimeAtEvent(perfTs);
    const hold = this.holding[lane];
    if (hold) {
      // se vuelve a pulsar dentro del margen tras reanudar
      return;
    }
    const q = this.laneQueues[lane];
    let h = this.laneHead[lane];
    while (h < q.length && this.notes[q[h]].state !== NOTE_STATE.PENDING) h++;
    this.laneHead[lane] = h;
    if (h >= q.length) return;
    const n = this.notes[q[h]];
    const delta = t - n.time;
    if (delta < -this.windows.miss) return; // demasiado pronto: se ignora
    const ad = Math.abs(delta);
    const w = this.windows;
    const j = ad <= w.s ? JUDGE.SPERFECT : ad <= w.p ? JUDGE.PERFECT : ad <= w.g ? JUDGE.GOOD : JUDGE.MISS;
    n.hitAt = t;
    n.judgment = j;
    this.laneHead[lane] = h + 1;
    if (j === JUDGE.MISS) {
      n.state = NOTE_STATE.MISSED;
      this.applyJudgment(j, n, delta);
      if (n.type === 'hold') {
        n.tailJudgment = JUDGE.MISS;
        this.applyJudgment(JUDGE.MISS, n, 0, true);
      }
      return;
    }
    if (n.type === 'hold') {
      n.state = NOTE_STATE.HOLDING;
      n.graceUntil = -Infinity;
      this.holding[lane] = n;
    } else {
      n.state = NOTE_STATE.HIT;
    }
    this.applyJudgment(j, n, delta);
  }

  release(lane, perfTs = performance.now()) {
    if (lane < 0 || lane >= LANES) return;
    this.laneDownCount[lane] = Math.max(0, this.laneDownCount[lane] - 1);
    this.laneDown[lane] = this.laneDownCount[lane] > 0;
    if (this.laneDown[lane] || this.state !== 'playing') return;
    const n = this.holding[lane];
    if (n) {
      const t = this.clock.songTimeAtEvent(perfTs);
      if (t > n.graceUntil) this.releaseHold(n, t);
    }
  }

  releaseAll() {
    for (let l = 0; l < LANES; l++) {
      this.laneDownCount[l] = 0;
      this.laneDown[l] = false;
    }
  }

  releaseHold(n, t) {
    const early = n.endTime - t;
    const w = this.windows;
    const j = early <= w.s ? JUDGE.SPERFECT : early <= w.p ? JUDGE.PERFECT : early <= w.g * 1.5 ? JUDGE.GOOD : JUDGE.MISS;
    this.finishHold(n, j, -early);
  }

  finishHold(n, j, delta) {
    this.holding[n.lane] = null;
    n.tailJudgment = j;
    n.state = j === JUDGE.MISS ? NOTE_STATE.MISSED : NOTE_STATE.HIT;
    this.applyJudgment(j, n, delta, true);
  }

  // ---------------------------------------------------------------- puntuación
  applyJudgment(j, n, delta, isTail = false) {
    const info = JUDGE_INFO[j];
    this.counts[j]++;
    this.judged++;
    this.accSum += info.accuracy;
    let points = 0;
    let cardBonus = false;
    if (j === JUDGE.MISS) {
      this.combo = 0;
      this.energy = Math.max(0, this.energy - this.diff.missEnergy);
      this.raveGauge = 0;
      if (this.raveLevel > 0) this.raveLevel--;
    } else {
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.energy = Math.min(ENERGY_MAX, this.energy + info.energy);
      this.raveGauge += info.rave;
      if (this.raveGauge >= 100) {
        if (this.raveLevel < RAVE_MAX_LEVEL) {
          this.raveLevel++;
          this.raveUps++;
          this.raveGauge -= 100;
          this.fx.push({ kind: 'rave', level: this.raveLevel, perf: performance.now() });
        } else {
          this.raveGauge = 100;
        }
      }
      const card = this.deck[this.cardIndex];
      cardBonus = !!card && card.attr === n.color;
      const comboMult = 1 + Math.min(this.combo, 200) * 0.002;
      const raveMult = 1 + this.raveLevel * RAVE_STEP;
      const typeMult = TYPE_MULT[n.type] || 1;
      const cardMult = cardBonus ? 1.1 : 1;
      points = Math.round(info.base * comboMult * raveMult * this.themeBonus.multiplier * typeMult * cardMult);
      this.score += points;
      if (this.combo > 0 && this.combo % 50 === 0) this.fx.push({ kind: 'combo', combo: this.combo, perf: performance.now() });
    }
    this.lastJudgment = {
      id: ++this.seq,
      judgment: j,
      points,
      cardBonus,
      timing: j === JUDGE.MISS || j === JUDGE.SPERFECT || isTail ? '' : delta < 0 ? 'EARLY' : 'LATE',
    };
    this.fx.push({
      kind: j === JUDGE.MISS ? 'miss' : 'hit',
      lane: n.lane,
      color: n.color,
      type: n.type,
      judgment: j,
      tail: isTail,
      perf: performance.now(),
    });
    this.notify();
    if (this.energy <= 0 && this.state === 'playing') this.finish(false);
  }

  get accuracy() {
    return this.judged ? this.accSum / this.judged : 1;
  }

  finish(cleared) {
    if (this.state === 'ended') return;
    this.state = 'ended';
    this.clock.stop(cleared ? 1.2 : 0.6);
    for (let l = 0; l < LANES; l++) this.holding[l] = null;
    const acc = this.accuracy;
    // Notas no jugadas (si se agota la energía) cuentan para la precisión global
    const played = this.judged;
    const accuracy = cleared ? acc : played ? (this.accSum / Math.max(played, this.totalJudgments)) : 0;
    const rank = !cleared ? 'F' : accuracy >= 0.95 ? 'S' : accuracy >= 0.85 ? 'A' : accuracy >= 0.7 ? 'B' : accuracy >= 0.5 ? 'C' : 'D';
    this.result = {
      cleared,
      fullCombo: cleared && this.counts.MISS === 0,
      score: this.score,
      accuracy,
      maxCombo: this.maxCombo,
      hits: this.counts.SPERFECT + this.counts.PERFECT + this.counts.GOOD,
      misses: this.counts.MISS,
      counts: { ...this.counts },
      total: this.totalJudgments,
      rank,
      difficulty: this.difficulty,
      songId: this.song.id,
      songTitle: this.song.title,
      raveLevel: this.raveLevel,
      themeBonus: this.themeBonus,
    };
    this.notify();
    for (const fn of this.endListeners) fn(this.result);
  }

  // ---------------------------------------------------------------- suscripción
  notify() {
    this.snapshot = {
      state: this.state,
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      energy: this.energy,
      raveLevel: this.raveLevel,
      raveGauge: this.raveGauge,
      lastJudgment: this.lastJudgment,
      cardIndex: this.cardIndex,
      countdown: this.countdown,
      counts: this.counts,
      result: this.result,
    };
    for (const fn of this.listeners) fn();
  }

  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.snapshot;

  onFrame(fn) {
    this.frameListeners.add(fn);
    return () => this.frameListeners.delete(fn);
  }

  onEnd(fn) {
    this.endListeners.add(fn);
    return () => this.endListeners.delete(fn);
  }

  destroy() {
    this.clock.stop();
    this.listeners.clear();
    this.frameListeners.clear();
    this.endListeners.clear();
    if (this.ctx.state !== 'running') this.ctx.resume();
  }
}
