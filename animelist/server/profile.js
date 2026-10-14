// Colores que se pueden elegir. El verde es de YHM (lo pidió así).
export const COLORS = {
  '#8bc34a': 'Verde', '#ff4d5e': 'Rojo', '#a77bff': 'Morado', '#ff8a1f': 'Naranja',
  '#ff6fb5': 'Rosa', '#4aa8ff': 'Azul', '#ffd23f': 'Amarillo', '#2ed3c6': 'Turquesa',
};
export const RESERVED = { '#8bc34a': 'yhm' };
export const DEFAULT_COLOR = (username) => (username.toLowerCase() === RESERVED['#8bc34a'] ? '#8bc34a' : null);
export const QUIZ_RESULTS = ['rengoku', 'jinwoo', 'hinata', 'anya', 'kageyama', 'zenitsu', 'tanjiro'];
export const FALLBACK_COLOR = '#9aa0b4';
