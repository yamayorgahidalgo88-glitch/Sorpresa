"use strict";
// ---------- sonido ----------
// Todo se sintetiza con Web Audio: no hay archivos. Los sonidos del mundo
// suenan más o menos según lo cerca que estén de lo que mira la cámara.
const SND = { ctx: null, master: null, music: null, sfx: null, noise: null, on: true, musicOn: true, last: {}, nextChord: 0, chordI: 0 };
try { const s = JSON.parse(localStorage.getItem('caja-de-dioses-sonido') || 'null'); if (s) { SND.on = s.on; SND.musicOn = s.musicOn; } } catch (e) { }
function audioInit() {
  if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ctx = SND.ctx = new AC();
  SND.master = ctx.createGain(); SND.master.gain.value = SND.on ? .7 : 0; SND.master.connect(ctx.destination);
  SND.sfx = ctx.createGain(); SND.sfx.gain.value = .9; SND.sfx.connect(SND.master);
  // la música pasa por un eco suave para dar espacio
  SND.music = ctx.createGain(); SND.music.gain.value = SND.musicOn ? .22 : 0;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
  const dl = ctx.createDelay(1.5); dl.delayTime.value = .42; const fb = ctx.createGain(); fb.gain.value = .38;
  SND.music.connect(lp); lp.connect(SND.master); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(SND.master);
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  SND.noise = buf;
}
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, audioInit, { passive: true }));
function sndSave() { try { localStorage.setItem('caja-de-dioses-sonido', JSON.stringify({ on: SND.on, musicOn: SND.musicOn })); } catch (e) { } }
function setSound(on) { SND.on = on; if (SND.master) SND.master.gain.setTargetAtTime(on ? .7 : 0, SND.ctx.currentTime, .05); sndSave(); syncSoundBtn(); }
function setMusic(on) { SND.musicOn = on; if (SND.music) SND.music.gain.setTargetAtTime(on ? .22 : 0, SND.ctx.currentTime, .3); sndSave(); syncSoundBtn(); }

// piezas básicas
function tone(f, t0, dur, { type = 'sine', vol = .3, attack = .01, f2 = null, out = SND.sfx } = {}) {
  const ctx = SND.ctx, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur);
  o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + .05);
}
function noiseHit(t0, dur, { vol = .4, freq = 800, f2 = null, q = .7, type = 'lowpass', attack = .005 } = {}) {
  const ctx = SND.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = SND.noise; s.loop = true;
  f.type = type; f.frequency.setValueAtTime(freq, t0); if (f2) f.frequency.exponentialRampToValueAtTime(f2, t0 + dur); f.Q.value = q;
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur);
  s.connect(f); f.connect(g); g.connect(SND.sfx); s.start(t0, Math.random()); s.stop(t0 + dur + .05);
}
const SFX = {
  boom: v => { const t = SND.ctx.currentTime; noiseHit(t, 1.6 * v + .4, { vol: .8 * Math.min(1, v), freq: 900, f2: 60 }); tone(70, t, 1.2 * v + .3, { vol: .6 * Math.min(1, v), f2: 30 }); },
  thunder: () => { const t = SND.ctx.currentTime; noiseHit(t, .15, { vol: .5, freq: 3000, f2: 800 }); noiseHit(t + .05, 2.2, { vol: .45, freq: 500, f2: 50, attack: .08 }); },
  war: () => { const t = SND.ctx.currentTime; for (const [f, d] of [[110, 0], [146.8, .55]]) { tone(f, t + d, 1, { type: 'sawtooth', vol: .12, attack: .12 }); tone(f * 2, t + d, 1, { type: 'triangle', vol: .06, attack: .12 }); } },
  peace: () => { const t = SND.ctx.currentTime; [392, 494, 587].forEach((f, i) => tone(f, t + i * .12, 1.6, { type: 'triangle', vol: .09, attack: .05 })); },
  found: () => { const t = SND.ctx.currentTime; [523, 659, 784].forEach((f, i) => tone(f, t + i * .09, .5, { type: 'triangle', vol: .08 })); },
  tech: () => { const t = SND.ctx.currentTime; [880, 1175, 1568].forEach((f, i) => tone(f, t + i * .06, .35, { vol: .05 })); },
  hero: () => { const t = SND.ctx.currentTime; [392, 523, 659, 784].forEach((f, i) => tone(f, t + i * .1, .6, { type: 'square', vol: .035 })); },
  doom: () => { const t = SND.ctx.currentTime; tone(98, t, 2, { type: 'sawtooth', vol: .06, attack: .3 }); tone(92.5, t, 2, { type: 'sawtooth', vol: .06, attack: .3 }); },
  birth: () => { const t = SND.ctx.currentTime; tone(1318, t, .6, { vol: .05 }); tone(1760, t + .08, .5, { vol: .035 }); },
  build: () => { const t = SND.ctx.currentTime; for (let k = 0; k < 2; k++) { tone(180, t + k * .14, .09, { type: 'square', vol: .05 }); noiseHit(t + k * .14, .06, { vol: .12, freq: 1200, type: 'bandpass', q: 2 }); } },
  hit: () => { const t = SND.ctx.currentTime; noiseHit(t, .07, { vol: .14, freq: 2500 + Math.random() * 1500, type: 'bandpass', q: 3 }); },
  arrow: () => { const t = SND.ctx.currentTime; noiseHit(t, .12, { vol: .05, freq: 4000, f2: 1500, type: 'bandpass', q: 4 }); },
  ui: () => { const t = SND.ctx.currentTime; tone(660, t, .06, { type: 'triangle', vol: .05 }); },
  splash: () => { const t = SND.ctx.currentTime; noiseHit(t, .5, { vol: .25, freq: 1500, f2: 300 }); },
  magic: () => { const t = SND.ctx.currentTime; tone(1200, t, .4, { vol: .05, f2: 2400 }); },
};
// suena si está cerca de la cámara (o siempre si no tiene posición)
function sfx(name, x, y, vol = 1, gap = 120) {
  if (!SND.ctx || !SND.on || SND.ctx.state !== 'running') return;
  const now = performance.now();
  if (now - (SND.last[name] || 0) < gap) return;
  let v = vol;
  if (x !== undefined) {
    const cx = cam.x + VW / cam.z / 2, cy = cam.y + VH / cam.z / 2, span = Math.max(VW, VH) / cam.z;
    const d = Math.hypot(x - cx, y - cy) / span;
    if (d > 1.1) return;
    v *= clamp(1.2 - d, 0, 1);
  }
  SND.last[name] = now;
  try { SFX[name](v); } catch (e) { }
}
// música ambiental: acordes lentos en re dórico, más oscuros de noche o en guerra
const CHORDS = [[146.8, 220, 293.7, 349.2], [130.8, 196, 261.6, 329.6], [174.6, 220, 261.6, 349.2], [196, 246.9, 293.7, 392], [146.8, 174.6, 220, 293.7]];
function musicTick() {
  if (!SND.ctx || !SND.musicOn || !SND.on || SND.ctx.state !== 'running') return;
  const t = SND.ctx.currentTime;
  if (t < SND.nextChord) return;
  const wars = kingdoms.some(k => k.alive && k.wars.size);
  const night = typeof dayLight === 'function' && dayLight() < .6;
  SND.chordI = (SND.chordI + 1 + (Math.random() < .3 ? 1 : 0)) % CHORDS.length;
  const ch = CHORDS[wars ? (SND.chordI % 2 ? 4 : 1) : SND.chordI], len = 7 + Math.random() * 3;
  for (const f of ch) {
    const o = SND.ctx.createOscillator(), g = SND.ctx.createGain();
    o.type = night ? 'sine' : 'triangle'; o.frequency.value = f * (night ? .5 : 1); o.detune.value = (Math.random() - .5) * 8;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.08, t + 2.5); g.gain.linearRampToValueAtTime(.06, t + len - 2); g.gain.linearRampToValueAtTime(0, t + len + 1);
    o.connect(g); g.connect(SND.music); o.start(t); o.stop(t + len + 1.2);
  }
  // una melodía suelta de vez en cuando
  if (Math.random() < .55) { const notes = ch.map(f => f * 2); for (let k = 0; k < 3; k++) if (Math.random() < .7) tone(pick(notes), t + 1.5 + k * (1 + Math.random()), 1.6, { type: 'sine', vol: .05, attack: .08, out: SND.music }); }
  SND.nextChord = t + len - .5;
}
// botón de sonido en la barra superior
function syncSoundBtn() { const b = document.getElementById('soundBtn'); if (b) { b.textContent = !SND.on ? '🔇' : SND.musicOn ? '🎵' : '🔊'; b.title = !SND.on ? 'Sonido apagado' : SND.musicOn ? 'Sonido y música' : 'Solo efectos'; } }
