import type Phaser from 'phaser';
import type { BallKind } from '../../persistence/economy';

/**
 * Pokéballs dibujadas con primitivas (dibujo propio, sin recursos externos): mitad superior
 * con el color y el motivo de cada tipo, franja negra, mitad inferior blanca y botón central.
 */
const STYLE: Record<BallKind, { top: number; dark: number }> = {
  poke: { top: 0xe8392e, dark: 0xa52219 },
  super: { top: 0x2f6fd8, dark: 0x1d4ba3 },
  ultra: { top: 0x2a2a30, dark: 0x16161a },
  master: { top: 0x7b3fc4, dark: 0x522a8a },
};

export function drawPokeball(g: Phaser.GameObjects.Graphics, kind: BallKind, x: number, y: number, r: number): void {
  const s = STYLE[kind];
  g.fillStyle(0x0b1022, 0.35).fillEllipse(x, y + r * 1.02, r * 1.6, r * 0.35);
  g.fillStyle(0x1b1512, 1).fillCircle(x, y, r + r * 0.08);
  // Mitad inferior blanca con sombra
  g.fillStyle(0xf4f4f4, 1).fillCircle(x, y, r);
  g.fillStyle(0xd6d6dc, 1).slice(x, y, r, 0.15, Math.PI - 0.15, false).fillPath();
  // Mitad superior
  g.fillStyle(s.top, 1).slice(x, y, r, Math.PI, 0, false).fillPath();
  g.fillStyle(s.dark, 1).slice(x, y, r, -0.4, 0, false).fillPath();
  if (kind === 'super') {
    // Dos franjas rojas a los lados
    g.fillStyle(0xe8392e, 1);
    g.fillRoundedRect(x - r * 0.72, y - r * 0.78, r * 0.2, r * 0.6, r * 0.08);
    g.fillRoundedRect(x + r * 0.52, y - r * 0.78, r * 0.2, r * 0.6, r * 0.08);
  } else if (kind === 'ultra') {
    // Franjas amarillas en forma de H
    g.fillStyle(0xf6cf2e, 1);
    g.fillRect(x - r * 0.62, y - r * 0.8, r * 0.22, r * 0.66);
    g.fillRect(x + r * 0.4, y - r * 0.8, r * 0.22, r * 0.66);
    g.fillRect(x - r * 0.62, y - r * 0.56, r * 1.24, r * 0.14);
  } else if (kind === 'master') {
    // Círculos rosas y la "M" blanca
    g.fillStyle(0xf06aa8, 1).fillCircle(x - r * 0.55, y - r * 0.5, r * 0.2).fillCircle(x + r * 0.55, y - r * 0.5, r * 0.2);
    g.lineStyle(r * 0.11, 0xffffff, 1);
    g.beginPath();
    g.moveTo(x - r * 0.24, y - r * 0.28);
    g.lineTo(x - r * 0.24, y - r * 0.7);
    g.lineTo(x, y - r * 0.45);
    g.lineTo(x + r * 0.24, y - r * 0.7);
    g.lineTo(x + r * 0.24, y - r * 0.28);
    g.strokePath();
  }
  // Brillo
  g.fillStyle(0xffffff, 0.35).fillEllipse(x - r * 0.4, y - r * 0.55, r * 0.45, r * 0.25);
  // Franja central y botón
  g.fillStyle(0x1b1512, 1).fillRect(x - r, y - r * 0.09, r * 2, r * 0.18);
  g.fillStyle(0x1b1512, 1).fillCircle(x, y, r * 0.3);
  g.fillStyle(0xf4f4f4, 1).fillCircle(x, y, r * 0.2);
  g.lineStyle(r * 0.04, 0xb8b8c0, 1).strokeCircle(x, y, r * 0.13);
}
