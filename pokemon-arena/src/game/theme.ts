import type Phaser from 'phaser';
import type { Team } from '../sim/core/state';

/** Paleta e identidad visual propias del prototipo. */
export const COLORS = {
  bg: 0x16203a,
  panel: 0x1f2b4d,
  panelLight: 0x2d3d6b,
  grassA: 0x7ccc5c,
  grassB: 0x72c153,
  grassEdge: 0x4e9a3a,
  path: 0xe2cf8f,
  river: 0x3aa6e6,
  riverLight: 0x8fd6ff,
  bridge: 0xb57b45,
  bridgeDark: 0x7e522b,
  energy: 0xd94dd9,
  energyDark: 0x5a1f63,
  gold: 0xffd23f,
  white: 0xffffff,
  danger: 0xff4d4d,
  ok: 0x6ee87a,
  team: [0x3d8bff, 0xff5a4a] as const,
  teamDark: [0x1d4ea8, 0xa52a1f] as const,
};

export const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

export function teamColor(team: Team): number {
  return COLORS.team[team];
}

export function css(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export function darken(color: number, f: number): number {
  const r = Math.round(((color >> 16) & 0xff) * f);
  const g = Math.round(((color >> 8) & 0xff) * f);
  const b = Math.round((color & 0xff) * f);
  return (r << 16) | (g << 8) | b;
}

export function textStyle(size: number, color = '#ffffff', extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: 'bold',
    color,
    stroke: '#0b1022',
    strokeThickness: Math.max(2, Math.round(size / 7)),
    ...extra,
  };
}
