import type Phaser from 'phaser';
import { bake } from '../render/creatureArt';
import { textStyle } from '../theme';

/**
 * Iconos propios de la interfaz, dibujados con primitivas y rasterizados una vez (no se usan
 * emojis: cambian de aspecto en cada sistema y la dirección artística los prohíbe).
 * Todos se dibujan en un lienzo de 64×64 y se escalan al usarlos.
 */
export type IconName = 'moneda' | 'trofeo' | 'energia' | 'medalla' | 'medalla-vacia' | 'candado' | 'estrella' | 'estrella-vacia' | 'check' | 'cerrar';

const S = 64;

const PAINT: Record<IconName, (g: Phaser.GameObjects.Graphics) => void> = {
  moneda: (g) => {
    g.fillStyle(0x8a5a10, 1).fillCircle(32, 34, 28);
    g.fillStyle(0xf5c542, 1).fillCircle(32, 31, 27);
    g.fillStyle(0xffe27a, 1).fillCircle(32, 31, 20);
    g.lineStyle(4, 0xd99a1e, 1).strokeCircle(32, 31, 20);
    // Rayo central (motivo de la moneda)
    g.fillStyle(0xd99a1e, 1).fillPoints(
      [{ x: 35, y: 16 }, { x: 24, y: 34 }, { x: 31, y: 34 }, { x: 28, y: 46 }, { x: 40, y: 28 }, { x: 33, y: 28 }],
      true,
    );
    g.fillStyle(0xffffff, 0.55).fillEllipse(22, 20, 12, 7);
  },
  trofeo: (g) => {
    g.fillStyle(0x8a5a10, 1).fillRoundedRect(16, 50, 32, 10, 3);
    g.fillStyle(0xd99a1e, 1).fillRect(28, 38, 8, 14);
    g.lineStyle(6, 0xd99a1e, 1).strokeCircle(14, 20, 9).strokeCircle(50, 20, 9);
    g.fillStyle(0xf5c542, 1).fillRoundedRect(12, 6, 40, 30, { tl: 4, tr: 4, bl: 18, br: 18 });
    g.fillStyle(0xffe27a, 1).fillRoundedRect(18, 10, 12, 20, 5);
    g.fillStyle(0xf5c542, 1).fillRoundedRect(20, 46, 24, 8, 3);
  },
  energia: (g) => {
    // Gota de energía
    g.fillStyle(0x5a1f63, 1).fillCircle(32, 40, 21).fillTriangle(13, 34, 51, 34, 32, 4);
    g.fillStyle(0xd94dd9, 1).fillCircle(32, 39, 18).fillTriangle(16, 33, 48, 33, 32, 8);
    g.fillStyle(0xf59af5, 1).fillEllipse(25, 32, 8, 14);
  },
  medalla: (g) => {
    // Corona de las torres derribadas
    g.fillStyle(0x8a5a10, 1).fillRoundedRect(8, 22, 48, 34, 6);
    g.fillStyle(0xf5c542, 1).fillPoints([{ x: 10, y: 50 }, { x: 10, y: 18 }, { x: 22, y: 32 }, { x: 32, y: 10 }, { x: 42, y: 32 }, { x: 54, y: 18 }, { x: 54, y: 50 }], true);
    g.fillStyle(0xffe27a, 1).fillRect(12, 40, 40, 6);
    g.fillStyle(0xe8392e, 1).fillCircle(32, 43, 4);
    g.fillStyle(0xffffff, 1).fillCircle(10, 18, 4).fillCircle(32, 10, 4).fillCircle(54, 18, 4);
  },
  'medalla-vacia': (g) => {
    g.fillStyle(0x2a3460, 1).fillPoints([{ x: 10, y: 50 }, { x: 10, y: 18 }, { x: 22, y: 32 }, { x: 32, y: 10 }, { x: 42, y: 32 }, { x: 54, y: 18 }, { x: 54, y: 50 }], true);
    g.lineStyle(3, 0x4a5890, 1).strokePoints([{ x: 10, y: 50 }, { x: 10, y: 18 }, { x: 22, y: 32 }, { x: 32, y: 10 }, { x: 42, y: 32 }, { x: 54, y: 18 }, { x: 54, y: 50 }], true);
  },
  candado: (g) => {
    g.lineStyle(8, 0x9aa6c8, 1).beginPath().arc(32, 28, 13, Math.PI, 0, false).strokePath();
    g.lineBetween(19, 28, 19, 34).lineBetween(45, 28, 45, 34);
    g.fillStyle(0xf5c542, 1).fillRoundedRect(12, 30, 40, 28, 6);
    g.fillStyle(0x8a5a10, 1).fillCircle(32, 41, 5).fillRect(30, 41, 4, 9);
  },
  estrella: (g) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 12 : 28;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push({ x: 32 + Math.cos(a) * r, y: 34 + Math.sin(a) * r });
    }
    g.fillStyle(0x8a5a10, 1).fillPoints(pts.map((p) => ({ x: p.x, y: p.y + 3 })), true);
    g.fillStyle(0xf5c542, 1).fillPoints(pts, true);
  },
  'estrella-vacia': (g) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 12 : 28;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push({ x: 32 + Math.cos(a) * r, y: 34 + Math.sin(a) * r });
    }
    g.fillStyle(0x2a3460, 1).fillPoints(pts, true);
  },
  check: (g) => {
    g.fillStyle(0x2f9a4a, 1).fillCircle(32, 32, 28);
    g.lineStyle(9, 0xffffff, 1).beginPath().moveTo(18, 33).lineTo(28, 43).lineTo(46, 22).strokePath();
  },
  cerrar: (g) => {
    g.lineStyle(9, 0xffffff, 1).lineBetween(16, 16, 48, 48).lineBetween(48, 16, 16, 48);
  },
};

/** Textura del icono (se crea la primera vez). */
export function iconKey(scene: Phaser.Scene, name: IconName): string {
  return bake(scene, `icono-${name}`, S, S, PAINT[name]);
}

export function icon(scene: Phaser.Scene, x: number, y: number, name: IconName, size: number): Phaser.GameObjects.Image {
  return scene.add.image(x, y, iconKey(scene, name)).setDisplaySize(size, size);
}

/**
 * Icono seguido de un texto (p. ej. monedas o trofeos). `originX` 0 = empieza en x,
 * 1 = termina en x, 0.5 = centrado. Devuelve el contenedor y el texto (para actualizarlo).
 */
export function iconLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  name: IconName,
  value: string,
  size: number,
  color = '#ffffff',
  originX = 0,
): { root: Phaser.GameObjects.Container; text: Phaser.GameObjects.Text; set: (v: string) => void } {
  const root = scene.add.container(x, y);
  const img = scene.add.image(0, 0, iconKey(scene, name)).setDisplaySize(size * 1.15, size * 1.15).setOrigin(0, 0.5);
  const text = scene.add.text(size * 1.25, 0, value, textStyle(size, color)).setOrigin(0, 0.5);
  root.add([img, text]);
  const place = () => {
    const w = size * 1.25 + text.width;
    const dx = -w * originX;
    img.x = dx;
    text.x = dx + size * 1.25;
  };
  place();
  return {
    root,
    text,
    set: (v: string) => {
      text.setText(v);
      place();
    },
  };
}
