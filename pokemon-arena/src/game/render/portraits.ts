import type Phaser from 'phaser';
import { canUse3D } from '../../render3d/gameLayer';
import { renderPortrait } from '../../render3d/portraits';

let available: boolean | null = null;

/**
 * Retrato vóxel de un Pokémon como textura de Phaser (`retrato-<id>`), creado la primera vez
 * que se pide. Sin WebGL devuelve null y se usan las fichas dibujadas en 2D.
 */
export function portraitKey(scene: Phaser.Scene, cardId: string): string | null {
  const key = `retrato-${cardId}`;
  if (scene.textures.exists(key)) return key;
  available ??= canUse3D();
  if (!available) return null;
  try {
    scene.textures.addCanvas(key, renderPortrait(cardId));
    return key;
  } catch (err) {
    console.warn('No se pudo generar el retrato 3D', err);
    available = false;
    return null;
  }
}
