import type { Vec } from '../sim/core/vec';
import { ARENA } from '../sim/data/arena';

/**
 * Resolución lógica del juego (vertical). Phaser la escala para encajar en cualquier
 * pantalla manteniendo la proporción, así que la disposición es fija y legible.
 */
export const GAME_W = 720;
export const GAME_H = 1420;

export const TILE = 36;
export const FIELD_W = ARENA.width * TILE;
export const FIELD_H = ARENA.height * TILE;
export const FIELD_X = (GAME_W - FIELD_W) / 2;
export const FIELD_Y = 64;
export const HUD_Y = FIELD_Y + FIELD_H;

export const CARD_W = 136;
export const CARD_H = 142;
export const CARD_GAP = 8;
export const NEXT_W = 84;
export const HAND_X = 16 + NEXT_W + 12;
export const HAND_Y = HUD_Y + 10;
export const ENERGY_Y = HAND_Y + CARD_H + 12;

export function tileToScreen(p: Vec): Vec {
  return { x: FIELD_X + p.x * TILE, y: FIELD_Y + p.y * TILE };
}

export function screenToTile(x: number, y: number): Vec {
  return { x: (x - FIELD_X) / TILE, y: (y - FIELD_Y) / TILE };
}

export function isInField(x: number, y: number): boolean {
  return x >= FIELD_X && x < FIELD_X + FIELD_W && y >= FIELD_Y && y < FIELD_Y + FIELD_H;
}

export function cardSlotRect(slot: number): { x: number; y: number; w: number; h: number } {
  return { x: HAND_X + slot * (CARD_W + CARD_GAP), y: HAND_Y, w: CARD_W, h: CARD_H };
}

/** Hueco de carta bajo el puntero, o -1. */
export function slotAt(x: number, y: number, slots = 4): number {
  for (let i = 0; i < slots; i++) {
    const r = cardSlotRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
