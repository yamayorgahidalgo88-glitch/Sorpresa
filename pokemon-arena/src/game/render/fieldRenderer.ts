import Phaser from 'phaser';
import type { Battle } from '../../sim/battle';
import type { Team } from '../../sim/core/state';
import { ARENA } from '../../sim/data/arena';
import { getCard } from '../../sim/data/cards';
import { FIELD_H, FIELD_W, FIELD_X, FIELD_Y, TILE } from '../layout';
import { COLORS } from '../theme';
import { bake } from './creatureArt';

/** Dibuja el campo de batalla (estático) y la capa de zonas de despliegue. */
export class FieldRenderer {
  private readonly waves: Phaser.GameObjects.Graphics;
  private zoneImage: Phaser.GameObjects.Image | null = null;
  private zoneKey = '';

  constructor(private readonly scene: Phaser.Scene) {
    // El suelo y los puentes son estáticos: se rasterizan una vez en texturas.
    const h = FIELD_Y + FIELD_H + 16;
    scene.add.image(0, 0, bake(scene, 'campo-suelo', scene.scale.width, h, (g) => this.drawGround(g))).setOrigin(0).setDepth(0);
    this.waves = scene.add.graphics().setDepth(1);
    scene.add.image(0, 0, bake(scene, 'campo-puentes', scene.scale.width, h, (g) => this.drawBridges(g))).setOrigin(0).setDepth(2);
  }

  private drawGround(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(COLORS.grassEdge, 1).fillRoundedRect(FIELD_X - 8, FIELD_Y - 8, FIELD_W + 16, FIELD_H + 16, 14);
    for (let ty = 0; ty < ARENA.height; ty++) {
      for (let tx = 0; tx < ARENA.width; tx++) {
        g.fillStyle((tx + ty) % 2 === 0 ? COLORS.grassA : COLORS.grassB, 1);
        g.fillRect(FIELD_X + tx * TILE, FIELD_Y + ty * TILE, TILE, TILE);
      }
    }
    // Tinte suave de cada mitad para leer de un vistazo qué campo es de quién.
    g.fillStyle(COLORS.team[1], 0.07).fillRect(FIELD_X, FIELD_Y, FIELD_W, ARENA.riverTop * TILE);
    g.fillStyle(COLORS.team[0], 0.07).fillRect(FIELD_X, FIELD_Y + ARENA.riverBottom * TILE, FIELD_W, (ARENA.height - ARENA.riverBottom) * TILE);

    // Caminos de tierra: rutas laterales y paso entre torres.
    g.fillStyle(COLORS.path, 0.45);
    for (const lx of ARENA.laneX) {
      g.fillRect(FIELD_X + (lx - 0.8) * TILE, FIELD_Y + 5 * TILE, 1.6 * TILE, 22 * TILE);
    }
    for (const y of [3, 29]) g.fillRect(FIELD_X + 3.5 * TILE, FIELD_Y + (y - 0.7) * TILE, 11 * TILE, 1.4 * TILE);

    // Río
    const ry = FIELD_Y + ARENA.riverTop * TILE;
    const rh = (ARENA.riverBottom - ARENA.riverTop) * TILE;
    g.fillStyle(0x2b7fb3, 1).fillRect(FIELD_X, ry - 3, FIELD_W, rh + 6);
    g.fillStyle(COLORS.river, 1).fillRect(FIELD_X, ry, FIELD_W, rh);
  }

  private drawBridges(g: Phaser.GameObjects.Graphics): void {
    for (const b of ARENA.bridges) {
      const x = FIELD_X + b.xMin * TILE;
      const w = (b.xMax - b.xMin) * TILE;
      const y = FIELD_Y + (ARENA.riverTop - 0.35) * TILE;
      const h = (ARENA.riverBottom - ARENA.riverTop + 0.7) * TILE;
      g.fillStyle(0x000000, 0.25).fillRect(x + 4, y + 6, w, h);
      g.fillStyle(COLORS.bridge, 1).fillRect(x, y, w, h);
      g.lineStyle(2, COLORS.bridgeDark, 1);
      for (let py = y + 9; py < y + h; py += 10) g.lineBetween(x + 2, py, x + w - 2, py);
      g.fillStyle(COLORS.bridgeDark, 1).fillRect(x - 3, y, 6, h).fillRect(x + w - 3, y, 6, h);
    }
  }

  /** Ondas del río animadas (barato: unas pocas líneas por fotograma). */
  update(time: number): void {
    const g = this.waves;
    g.clear();
    g.lineStyle(2, COLORS.riverLight, 0.55);
    const ry = FIELD_Y + ARENA.riverTop * TILE;
    for (let row = 0; row < 3; row++) {
      const y = ry + 14 + row * 20;
      const offset = ((time / 40) * (row % 2 === 0 ? 1 : -1) + row * 37) % 72;
      for (let x = FIELD_X - 72 + offset; x < FIELD_X + FIELD_W; x += 72) {
        const x0 = Math.max(FIELD_X, x);
        const x1 = Math.min(FIELD_X + FIELD_W, x + 26);
        if (x1 > x0) g.lineBetween(x0, y, x1, y);
      }
    }
  }

  /** Sombrea las casillas donde NO se puede desplegar `cardId` (null = ocultar). */
  showZones(battle: Battle, team: Team, cardId: string | null): void {
    const towersKey = battle.world.towers.map((t) => (t.destroyed ? 1 : 0)).join('');
    // El patrón solo depende del tipo de carta (Pokémon u hechizo) y de las torres en pie.
    const key = cardId === null ? '' : `${getCard(cardId).kind}|${towersKey}`;
    if (key === this.zoneKey) return;
    this.zoneKey = key;
    this.zoneImage?.setVisible(false);
    if (key === '') return;
    // Una textura por combinación carta + torres en pie (el patrón cambia poco).
    const texKey = `zonas-${team}-${key}`;
    bake(this.scene, texKey, FIELD_W, FIELD_H, (g) => {
      g.fillStyle(COLORS.danger, 0.22);
      for (let ty = 0; ty < ARENA.height; ty++) {
        for (let tx = 0; tx < ARENA.width; tx++) {
          if (!battle.isDeployZone(team, cardId!, { x: tx + 0.5, y: ty + 0.5 })) g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        }
      }
      g.lineStyle(3, COLORS.white, 0.6).strokeRect(1, 1, FIELD_W - 2, FIELD_H - 2);
    });
    if (!this.zoneImage) this.zoneImage = this.scene.add.image(FIELD_X, FIELD_Y, texKey).setOrigin(0).setDepth(3);
    this.zoneImage.setTexture(texKey).setVisible(true);
  }
}
