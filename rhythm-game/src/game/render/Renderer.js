// Orquesta el dibujo de cada fotograma en un único canvas.
import { createGeometry } from '../perspective.js';
import { buildBackgroundLayer, BackgroundFX } from './background.js';
import { buildTrackLayer, drawTrackDynamic } from './track.js';
import { NoteRenderer } from './notes.js';
import { EffectsRenderer } from './effects.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.notes = new NoteRenderer();
    this.effects = new EffectsRenderer();
    this.bgfx = new BackgroundFX();
    this.deck = [];
    this.lastPerf = performance.now();
    this.geom = null;
  }

  resize(w, h, dpr, deck = this.deck) {
    this.deck = deck;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.geom = createGeometry(w, h);
    this.bgLayer = buildBackgroundLayer(this.geom, dpr, deck);
    this.trackLayer = buildTrackLayer(this.geom, dpr);
  }

  draw(engine, perf, opts = {}) {
    const ctx = this.ctx;
    const g = this.geom;
    if (!g) return;
    const running = engine && (engine.state === 'playing' || engine.state === 'ended' || engine.state === 'ready');
    const rawDt = Math.min(0.1, Math.max(0, (perf - this.lastPerf) / 1000));
    this.lastPerf = perf;
    const dt = running ? rawDt : 0;

    const songTime = engine ? engine.songTime : 0;
    const beat = engine ? 60 / (engine.song.bpm || 120) : 0.5;
    const beatOffset = engine ? engine.song.beatOffset || 0 : 0;
    const phase = (((songTime - beatOffset) / beat) % 1 + 1) % 1;
    const pulse = engine && engine.state === 'playing' && songTime > 0 ? Math.exp(-phase * 5) : 0;
    const rave = engine ? engine.raveLevel : 0;

    // fx pendientes del motor
    if (engine && engine.fx.length) {
      for (const ev of engine.fx) this.effects.handle(ev, g, this.bgfx);
      engine.fx.length = 0;
    }

    let spectrum = null;
    const clock = engine && engine.clock;
    if (clock && clock.analyser && engine.state === 'playing') {
      clock.analyser.getByteFrequencyData(clock.freq);
      spectrum = clock.freq;
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.drawImage(this.bgLayer, 0, 0, g.viewW, g.viewH);
    this.bgfx.draw(ctx, g, dt || rawDt * 0.3, pulse, perf / 1000, rave, spectrum);
    ctx.drawImage(this.trackLayer, 0, 0, g.viewW, g.viewH);

    if (engine) {
      drawTrackDynamic(ctx, g, {
        songTime,
        approach: engine.approach,
        beat,
        beatOffset,
        laneDown: engine.laneDown,
        lanePressPerf: engine.lanePressPerf,
        perf,
        pulse,
        showKeys: opts.showKeys,
        keyLabels: opts.keyLabels,
      });
      this.notes.draw(ctx, g, engine.notes, songTime, engine.approach, perf);
    }
    this.effects.draw(ctx, g, dt, engine);
  }
}
