/**
 * Efectos de sonido sintetizados con Web Audio (sin archivos de audio externos).
 * El contexto se crea en la primera interacción del usuario, como exigen los navegadores.
 */
type SfxName = 'seleccion' | 'despliegue' | 'golpe' | 'eficaz' | 'torre' | 'rechazo' | 'hechizo' | 'victoria' | 'derrota';

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export function unlockAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) ctx = new Ctor();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number, delay = 0): void {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

let lastHit = 0;

export function play(name: SfxName): void {
  if (muted || !ctx) return;
  switch (name) {
    case 'seleccion':
      return tone(660, 0.06, 'square', 0.04);
    case 'despliegue':
      tone(330, 0.12, 'triangle', 0.08, 660);
      return tone(990, 0.08, 'sine', 0.04, undefined, 0.08);
    case 'golpe': {
      const now = ctx.currentTime;
      if (now - lastHit < 0.05) return; // evita saturar con muchos golpes simultáneos
      lastHit = now;
      return tone(180, 0.06, 'square', 0.03, 90);
    }
    case 'eficaz':
      return tone(520, 0.1, 'sawtooth', 0.04, 1040);
    case 'torre':
      tone(120, 0.5, 'sawtooth', 0.12, 40);
      return tone(80, 0.6, 'square', 0.06, 30, 0.05);
    case 'rechazo':
      return tone(140, 0.15, 'square', 0.05, 110);
    case 'hechizo':
      return tone(900, 0.25, 'sawtooth', 0.05, 200);
    case 'victoria':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.08, undefined, i * 0.14));
      return;
    case 'derrota':
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'triangle', 0.07, undefined, i * 0.18));
      return;
  }
}
