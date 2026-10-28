import type Phaser from 'phaser';
import { canUse3D } from '../../render3d/gameLayer';
import { renderPortraits } from '../../render3d/portraits';

let state: 'pendiente' | 'listo' | 'sin3d' = 'pendiente';

/**
 * Retratos vóxel de los Pokémon como texturas de Phaser (`retrato-<id>`). Se generan una vez
 * por partida; sin WebGL se devuelve null y se usan las fichas dibujadas en 2D.
 */
export function portraitKey(scene: Phaser.Scene, cardId: string): string | null {
  if (state === 'pendiente') {
    state = 'sin3d';
    if (canUse3D()) {
      try {
        for (const [id, canvas] of renderPortraits()) {
          if (!scene.textures.exists(`retrato-${id}`)) scene.textures.addCanvas(`retrato-${id}`, canvas);
        }
        state = 'listo';
      } catch (err) {
        console.warn('No se pudieron generar los retratos 3D', err);
      }
    }
  }
  const key = `retrato-${cardId}`;
  return state === 'listo' && scene.textures.exists(key) ? key : null;
}
