const pad = (n: number) => String(n).padStart(2, '0');

export const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export const toIso = (dt: Date) => iso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());

export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (dt: Date, n: number) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher). */
export function easter(y: number): Date {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

/** n-ésimo día de la semana (0=domingo) de un mes (month 1-12). */
export function nthWeekday(y: number, month: number, weekday: number, n: number): Date {
  const first = new Date(y, month - 1, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(y, month - 1, 1 + offset + (n - 1) * 7);
}

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const longDate = (s: string) => {
  const d = parseIso(s);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
};
