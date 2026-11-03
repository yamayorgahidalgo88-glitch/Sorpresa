// Ajustes del jugador (teclas, velocidad, latencia, dificultad) con persistencia.
import { DEFAULT_KEYS, DIFFICULTIES } from './constants.js';

const KEY = 'neonpulse.settings.v1';

export function defaultSettings() {
  return {
    difficulty: 'normal',
    speed: DIFFICULTIES.normal.defaultSpeed,
    calibrationMs: 0,
    keys: [...DEFAULT_KEYS],
  };
}

export function loadSettings() {
  const d = defaultSettings();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    return {
      difficulty: DIFFICULTIES[s.difficulty] ? s.difficulty : d.difficulty,
      speed: Number.isFinite(s.speed) ? Math.min(10, Math.max(1, s.speed)) : d.speed,
      calibrationMs: Number.isFinite(s.calibrationMs) ? Math.max(-200, Math.min(200, s.calibrationMs)) : 0,
      keys: Array.isArray(s.keys) && s.keys.length === 5 && new Set(s.keys).size === 5 ? s.keys : d.keys,
    };
  } catch {
    return d;
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sin almacenamiento */
  }
}
