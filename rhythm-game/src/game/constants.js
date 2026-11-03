// Constantes globales del juego: carriles, colores, juicios y dificultades.

export const LANES = 5;

// Colores de nota (tres familias, como en el vídeo de referencia)
export const NOTE_COLORS = {
  yellow: { id: 'yellow', main: '#ffd23f', light: '#fff6c4', dark: '#c77d00', glow: 'rgba(255,210,63,' },
  cyan: { id: 'cyan', main: '#38e1ff', light: '#d9fbff', dark: '#0067c7', glow: 'rgba(56,225,255,' },
  pink: { id: 'pink', main: '#ff4fd8', light: '#ffd6f6', dark: '#9b1fb3', glow: 'rgba(255,79,216,' },
};

export const NOTE_TYPES = { TAP: 'tap', HOLD: 'hold', STAR: 'star' };

export const NOTE_STATE = {
  PENDING: 'pending',
  HOLDING: 'holding',
  HIT: 'hit',
  MISSED: 'missed',
};

// Juicios de precisión
export const JUDGE = {
  SPERFECT: 'SPERFECT',
  PERFECT: 'PERFECT',
  GOOD: 'GOOD',
  MISS: 'MISS',
};

export const JUDGE_INFO = {
  SPERFECT: { label: 'S PERFECT', base: 1200, accuracy: 1, energy: 1.2, rave: 4, className: 'j-sperfect' },
  PERFECT: { label: 'PERFECT', base: 1000, accuracy: 0.85, energy: 0.8, rave: 3, className: 'j-perfect' },
  GOOD: { label: 'GOOD', base: 500, accuracy: 0.5, energy: 0.2, rave: 1, className: 'j-good' },
  MISS: { label: 'MISS', base: 0, accuracy: 0, energy: 0, rave: 0, className: 'j-miss' },
};

// Multiplicador por tipo de nota
export const TYPE_MULT = { tap: 1, hold: 1.1, star: 1.5 };

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'FÁCIL',
    color: '#38e1ff',
    windows: { s: 0.05, p: 0.095, g: 0.155, miss: 0.2 },
    missEnergy: 6,
    defaultSpeed: 4,
  },
  normal: {
    id: 'normal',
    label: 'NORMAL',
    color: '#ffd23f',
    windows: { s: 0.042, p: 0.082, g: 0.135, miss: 0.18 },
    missEnergy: 8,
    defaultSpeed: 5,
  },
  hard: {
    id: 'hard',
    label: 'DIFÍCIL',
    color: '#ff4fd8',
    windows: { s: 0.036, p: 0.072, g: 0.118, miss: 0.16 },
    missEnergy: 10,
    defaultSpeed: 7,
  },
};

// Velocidad 1..10 -> segundos que tarda una nota en recorrer la pista
export function approachTimeForSpeed(speed) {
  const s = Math.max(1, Math.min(10, speed));
  return 2.6 - (s - 1) * 0.2; // 1 -> 2.6 s · 5 -> 1.8 s · 10 -> 0.8 s
}

export const DEFAULT_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'];

export const RAVE_MAX_LEVEL = 5;
export const RAVE_STEP = 0.1; // +10 % de puntuación por nivel
export const ENERGY_MAX = 100;

export function keyLabel(code) {
  if (!code) return '?';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'N' + code.slice(6);
  const map = {
    Space: '␣', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    Semicolon: ';', Comma: ',', Period: '.', Slash: '/', Quote: "'", BracketLeft: '[', BracketRight: ']',
    ShiftLeft: 'ShL', ShiftRight: 'ShR', Enter: '↵',
  };
  return map[code] || code;
}
