// Dibujo de notas (equivalente a GameNote). La posición de cada nota se calcula
// en cada fotograma con projectNote() a partir de su tiempo restante.
import { NOTE_STATE, NOTE_COLORS } from '../constants.js';
import { projectNote, Z_FAR, laneWidthAtScale, xAt, yAtScale, laneCenterU } from '../perspective.js';
import { noteSprite } from './sprites.js';

const FADE_IN = 0.14; // fracción de profundidad con fundido de aparición

export class NoteRenderer {
  constructor() {
    this.cursor = 0;
    this.visible = [];
  }

  reset() {
    this.cursor = 0;
  }

  collect(notes, songTime, approach) {
    // avanza el cursor por las notas ya terminadas (las notas están ordenadas por tiempo)
    while (this.cursor < notes.length) {
      const n = notes[this.cursor];
      const done = n.state === NOTE_STATE.HIT || n.state === NOTE_STATE.MISSED;
      if (done && n.endTime < songTime - 0.6) this.cursor++;
      else break;
    }
    const vis = this.visible;
    vis.length = 0;
    for (let i = this.cursor; i < notes.length; i++) {
      const n = notes[i];
      if (n.time - songTime > approach) break;
      if (n.state === NOTE_STATE.HIT && n.type !== 'hold') continue;
      if (n.state === NOTE_STATE.HIT && n.type === 'hold') continue;
      if (n.state === NOTE_STATE.MISSED && songTime - n.endTime > 0.45) continue;
      vis.push(n);
    }
    return vis;
  }

  draw(ctx, g, notes, songTime, approach, perf) {
    if (songTime < this.lastSongTime) this.cursor = 0; // reinicio
    this.lastSongTime = songTime;
    const vis = this.collect(notes, songTime, approach);

    // 1) cuerpos de notas largas (de lejos a cerca)
    for (let i = vis.length - 1; i >= 0; i--) {
      const n = vis[i];
      if (n.type === 'hold') this.drawHoldBody(ctx, g, n, songTime, approach, perf);
    }
    // 2) cabezas (de lejos a cerca para que las cercanas queden encima)
    for (let i = vis.length - 1; i >= 0; i--) {
      const n = vis[i];
      const holding = n.state === NOTE_STATE.HOLDING;
      const remaining = holding ? 0 : n.time - songTime;
      const p = projectNote(g, n.lane, remaining, approach);
      n.pos = p;
      let alpha = Math.min(1, (Z_FAR - p.z) / (Z_FAR * FADE_IN));
      if (n.state === NOTE_STATE.MISSED) alpha *= 0.35 * Math.max(0, 1 - (songTime - n.time) / 0.45);
      if (alpha <= 0) continue;
      ctx.globalAlpha = Math.max(0, alpha);
      const spr = noteSprite(n.color, n.type);
      const size = p.r * 4 * (holding ? 1 + 0.08 * Math.sin(perf / 40) : 1);
      ctx.drawImage(spr, p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  drawHoldBody(ctx, g, n, songTime, approach, perf) {
    const holding = n.state === NOTE_STATE.HOLDING;
    const missed = n.state === NOTE_STATE.MISSED;
    const headRem = holding ? 0 : n.time - songTime;
    const tailRem = Math.min(approach, n.endTime - songTime);
    if (tailRem < -0.4) return;
    const head = projectNote(g, n.lane, headRem, approach);
    const tail = projectNote(g, n.lane, tailRem, approach);
    const u = laneCenterU(n.lane);
    const wHead = laneWidthAtScale(g, head.s) * 0.3;
    const wTail = laneWidthAtScale(g, tail.s) * 0.3;
    const col = NOTE_COLORS[n.color];
    const yH = yAtScale(g, head.s), yT = yAtScale(g, tail.s);
    const xH = xAt(g, head.s, u), xT = xAt(g, tail.s, u);
    ctx.save();
    ctx.globalAlpha = missed ? 0.25 : 1;
    const grad = ctx.createLinearGradient(0, yT, 0, yH);
    grad.addColorStop(0, col.glow + '0.15)');
    grad.addColorStop(1, col.glow + (holding ? '0.85)' : '0.55)'));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(xT - wTail, yT);
    ctx.lineTo(xT + wTail, yT);
    ctx.lineTo(xH + wHead, yH);
    ctx.lineTo(xH - wHead, yH);
    ctx.closePath();
    ctx.fill();
    // bordes brillantes
    ctx.strokeStyle = holding ? '#ffffff' : col.light;
    ctx.lineWidth = holding ? 2.5 : 1.5;
    ctx.globalAlpha *= holding ? 0.6 + 0.4 * Math.sin(perf / 50) ** 2 : 0.7;
    ctx.beginPath();
    ctx.moveTo(xT - wTail, yT);
    ctx.lineTo(xH - wHead, yH);
    ctx.moveTo(xT + wTail, yT);
    ctx.lineTo(xH + wHead, yH);
    ctx.stroke();
    ctx.restore();
    // remate de la cola
    if (n.endTime - songTime <= approach) {
      const size = tail.r * 2.4;
      ctx.globalAlpha = missed ? 0.25 : 0.9;
      ctx.drawImage(noteSprite(n.color, 'tap'), tail.x - size / 2, tail.y - size / 2, size, size);
      ctx.globalAlpha = 1;
    }
  }
}
