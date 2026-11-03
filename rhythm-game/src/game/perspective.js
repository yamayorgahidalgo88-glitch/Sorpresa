// Geometría de la pista en perspectiva.
//
// Modelo: cada punto de la pista tiene una profundidad z (0 = línea de
// contacto, Z_FAR = extremo lejano). La escala de perspectiva es
// s = 1 / (1 + z): vale 1 en la línea de contacto y FAR_SCALE en el fondo.
// La posición vertical es lineal en s respecto al punto de fuga, y el ancho
// de la pista es proporcional a s, de modo que los bordes convergen.
import { LANES } from './constants.js';

export const FAR_SCALE = 0.16;
export const Z_FAR = 1 / FAR_SCALE - 1;

export function createGeometry(viewW, viewH) {
  // Columna de juego vertical centrada (en escritorio no se deforma la pista)
  const colW = Math.min(viewW, viewH * 0.62);
  const colX = (viewW - colW) / 2;
  const cx = colX + colW / 2;
  const hitY = viewH * 0.84;
  const farY = viewH * 0.285;
  const bottomHalf = Math.min(colW * 0.44, viewH * 0.3);
  const horizonY = (farY - hitY * FAR_SCALE) / (1 - FAR_SCALE);
  return { viewW, viewH, colW, colX, cx, hitY, farY, bottomHalf, horizonY };
}

export function scaleAtDepth(z) {
  return 1 / (1 + z);
}

export function yAtScale(g, s) {
  return g.horizonY + (g.hitY - g.horizonY) * s;
}

// u: posición transversal en [0, 1] (0 = borde izquierdo, 1 = derecho)
export function xAt(g, s, u) {
  return g.cx + (u - 0.5) * 2 * g.bottomHalf * s;
}

export function laneCenterU(lane) {
  return (lane + 0.5) / LANES;
}

export function laneWidthAtScale(g, s) {
  return (2 * g.bottomHalf * s) / LANES;
}

/**
 * Posición de una nota a partir del tiempo restante hasta su tiempo objetivo.
 * timeRemaining > 0: la nota aún no ha llegado; 0: está en la línea de contacto.
 * La velocidad (approachTime) es configurable.
 */
export function projectNote(g, lane, timeRemaining, approachTime) {
  let z = (timeRemaining / approachTime) * Z_FAR;
  if (z < -0.35) z = -0.35;
  const s = scaleAtDepth(z);
  const y = yAtScale(g, s);
  const x = xAt(g, s, laneCenterU(lane));
  const r = laneWidthAtScale(g, s) * 0.4;
  return { x, y, s, r, z };
}

// Profundidad -> escala para un instante dado (líneas de compás, etc.)
export function scaleForTime(timeRemaining, approachTime) {
  return scaleAtDepth(Math.max(-0.35, (timeRemaining / approachTime) * Z_FAR));
}

// Convierte un punto de pantalla en carril (para controles táctiles)
export function laneFromPoint(g, px, py) {
  let s = (py - g.horizonY) / (g.hitY - g.horizonY);
  s = Math.max(0.5, Math.min(1.3, s));
  const u = (px - g.cx) / (2 * g.bottomHalf * s) + 0.5;
  if (u < -0.08 || u > 1.08) {
    // fuera de la pista: se asigna al carril más cercano si está dentro de la columna
    if (px < g.colX || px > g.colX + g.colW) return -1;
  }
  return Math.max(0, Math.min(LANES - 1, Math.floor(u * LANES)));
}
