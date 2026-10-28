import type Phaser from 'phaser';
import { getCard } from '../../sim/data/cards';
import { ELEMENT_COLORS } from '../../sim/data/elements';
import { darken } from '../theme';

/**
 * Ilustraciones vectoriales ORIGINALES y muy simplificadas (fichas geométricas),
 * dibujadas con primitivas de Phaser. No se usa ningún sprite ni recurso de juegos
 * comerciales: son marcadores de prototipo reconocibles por forma y color.
 * Todas se dibujan centradas en (0, 0) con radio base `r`.
 */
type Painter = (g: Phaser.GameObjects.Graphics, r: number) => void;

const eye = (g: Phaser.GameObjects.Graphics, x: number, y: number, s: number) => {
  g.fillStyle(0x1b1b1b, 1).fillCircle(x, y, s);
  g.fillStyle(0xffffff, 1).fillCircle(x - s * 0.3, y - s * 0.35, s * 0.4);
};

const face = (g: Phaser.GameObjects.Graphics, r: number, dy = -0.05, spread = 0.36, size = 0.13) => {
  eye(g, -r * spread, r * dy, r * size);
  eye(g, r * spread, r * dy, r * size);
};

const PAINTERS: Record<string, Painter> = {
  pikachu: (g, r) => {
    g.fillStyle(0xf7d33a, 1);
    g.fillTriangle(-r * 0.75, -r * 0.4, -r * 0.35, -r * 0.75, -r * 1.05, -r * 1.35);
    g.fillTriangle(r * 0.75, -r * 0.4, r * 0.35, -r * 0.75, r * 1.05, -r * 1.35);
    g.fillStyle(0x222222, 1);
    g.fillTriangle(-r * 0.92, -r * 1.05, -r * 0.8, -r * 1.15, -r * 1.05, -r * 1.35);
    g.fillTriangle(r * 0.92, -r * 1.05, r * 0.8, -r * 1.15, r * 1.05, -r * 1.35);
    g.fillStyle(0xf7d33a, 1).fillCircle(0, 0, r);
    g.fillStyle(0xe8483a, 1).fillCircle(-r * 0.6, r * 0.25, r * 0.18).fillCircle(r * 0.6, r * 0.25, r * 0.18);
    face(g, r);
  },
  charmeleon: (g, r) => {
    g.fillStyle(0xf6a11a, 1).fillTriangle(r * 0.5, r * 0.6, r * 1.2, r * 0.9, r * 0.95, r * 1.45);
    g.fillStyle(0xd9482b, 1).fillCircle(0, 0, r);
    g.fillTriangle(-r * 0.15, -r * 0.95, r * 0.15, -r * 0.95, 0, -r * 1.35);
    g.fillStyle(0xf3d9a4, 1).fillEllipse(0, r * 0.45, r * 0.9, r * 0.6);
    face(g, r, -0.15);
  },
  squirtle: (g, r) => {
    g.fillStyle(0x9a5a2a, 1).fillCircle(0, r * 0.15, r * 1.02);
    g.fillStyle(0xf2dfa0, 1).fillCircle(0, r * 0.15, r * 0.78);
    g.fillStyle(0x6cb8f0, 1).fillCircle(0, -r * 0.1, r * 0.72);
    face(g, r * 0.8, -0.2);
  },
  bulbasaur: (g, r) => {
    g.fillStyle(0x3f9a4a, 1).fillCircle(0, r * 0.35, r * 0.75);
    g.fillStyle(0x2f7a3a, 1).fillTriangle(-r * 0.3, r * 0.1, r * 0.3, r * 0.1, 0, r * 0.75);
    g.fillStyle(0x6fd0b8, 1).fillCircle(0, -r * 0.15, r * 0.82);
    g.fillStyle(0x3e8f80, 1).fillCircle(-r * 0.45, -r * 0.55, r * 0.14).fillCircle(r * 0.35, -r * 0.35, r * 0.12);
    face(g, r * 0.85, -0.25, 0.45);
  },
  onix: (g, r) => {
    g.fillStyle(0x8b8f99, 1);
    g.fillCircle(0, r * 0.75, r * 0.55).fillCircle(0, r * 0.15, r * 0.7);
    g.fillStyle(0x9da2ad, 1).fillCircle(0, -r * 0.45, r * 0.75);
    g.fillStyle(0x6e727c, 1).fillTriangle(-r * 0.15, -r * 1.1, r * 0.15, -r * 1.1, 0, -r * 1.5);
    g.lineStyle(r * 0.08, 0x5d6069, 1).strokeCircle(0, r * 0.15, r * 0.7);
    face(g, r * 0.75, -0.75, 0.35);
  },
  snorlax: (g, r) => {
    g.fillStyle(0x2d5f6e, 1).fillCircle(0, 0, r);
    g.fillTriangle(-r * 0.75, -r * 0.55, -r * 0.4, -r * 0.85, -r * 0.8, -r * 1.05);
    g.fillTriangle(r * 0.75, -r * 0.55, r * 0.4, -r * 0.85, r * 0.8, -r * 1.05);
    g.fillStyle(0xf0e2bf, 1).fillEllipse(0, r * 0.3, r * 1.3, r * 1.1);
    g.lineStyle(r * 0.08, 0x1b1b1b, 1);
    g.lineBetween(-r * 0.45, -r * 0.35, -r * 0.2, -r * 0.35).lineBetween(r * 0.2, -r * 0.35, r * 0.45, -r * 0.35);
  },
  machop: (g, r) => {
    g.fillStyle(0x8fa6c2, 1).fillCircle(-r * 0.85, r * 0.2, r * 0.32).fillCircle(r * 0.85, r * 0.2, r * 0.32);
    g.fillStyle(0xa7bed8, 1).fillCircle(0, 0, r * 0.9);
    g.fillStyle(0x8fa6c2, 1).fillTriangle(-r * 0.25, -r * 0.8, r * 0.25, -r * 0.8, 0, -r * 1.15);
    g.fillStyle(0xd94a3a, 1).fillRect(-r * 0.55, r * 0.45, r * 1.1, r * 0.18);
    face(g, r * 0.9, -0.15);
  },
  pidgeotto: (g, r) => {
    g.fillStyle(0xa8743f, 1);
    g.fillTriangle(-r * 0.5, -r * 0.1, -r * 1.6, r * 0.25, -r * 0.5, r * 0.55);
    g.fillTriangle(r * 0.5, -r * 0.1, r * 1.6, r * 0.25, r * 0.5, r * 0.55);
    g.fillStyle(0xc28d55, 1).fillCircle(0, 0, r * 0.85);
    g.fillStyle(0xe8483a, 1).fillTriangle(-r * 0.2, -r * 0.7, r * 0.3, -r * 0.75, r * 0.05, -r * 1.35);
    g.fillStyle(0xf2dfa0, 1).fillEllipse(0, r * 0.35, r * 0.9, r * 0.6);
    g.fillStyle(0xf2b83a, 1).fillTriangle(-r * 0.12, -r * 0.05, r * 0.12, -r * 0.05, 0, r * 0.18);
    face(g, r * 0.85, -0.3);
  },
  geodude: (g, r) => {
    g.fillStyle(0x8e8a7c, 1).fillCircle(-r * 1.0, r * 0.1, r * 0.3).fillCircle(r * 1.0, r * 0.1, r * 0.3);
    g.lineStyle(r * 0.18, 0x8e8a7c, 1).lineBetween(-r * 0.7, 0, -r * 1.0, r * 0.1).lineBetween(r * 0.7, 0, r * 1.0, r * 0.1);
    g.fillStyle(0xa39f90, 1).fillCircle(0, 0, r * 0.82);
    g.fillStyle(0x7c786b, 1).fillCircle(-r * 0.3, r * 0.4, r * 0.12).fillCircle(r * 0.4, -r * 0.5, r * 0.1);
    face(g, r * 0.8, -0.1);
  },
  jigglypuff: (g, r) => {
    g.fillStyle(0xf6a8c8, 1).fillCircle(0, 0, r);
    g.fillTriangle(-r * 0.75, -r * 0.5, -r * 0.35, -r * 0.85, -r * 0.85, -r * 1.05);
    g.fillTriangle(r * 0.75, -r * 0.5, r * 0.35, -r * 0.85, r * 0.85, -r * 1.05);
    g.fillStyle(0xe58bb0, 1).fillCircle(0, -r * 0.75, r * 0.22);
    eye(g, -r * 0.35, -r * 0.05, r * 0.22);
    eye(g, r * 0.35, -r * 0.05, r * 0.22);
  },
  charizard: (g, r) => {
    g.fillStyle(0x2f7f8a, 1);
    g.fillTriangle(-r * 0.4, -r * 0.4, -r * 1.7, -r * 0.6, -r * 0.6, r * 0.6);
    g.fillTriangle(r * 0.4, -r * 0.4, r * 1.7, -r * 0.6, r * 0.6, r * 0.6);
    g.fillStyle(0xf6a11a, 1).fillTriangle(r * 0.3, r * 0.7, r * 0.9, r * 1.0, r * 0.6, r * 1.45);
    g.fillStyle(0xf08a2a, 1).fillCircle(0, 0, r * 0.9);
    g.fillTriangle(-r * 0.45, -r * 0.6, -r * 0.25, -r * 0.8, -r * 0.55, -r * 1.15);
    g.fillTriangle(r * 0.45, -r * 0.6, r * 0.25, -r * 0.8, r * 0.55, -r * 1.15);
    g.fillStyle(0xf3d9a4, 1).fillEllipse(0, r * 0.4, r * 0.8, r * 0.6);
    face(g, r * 0.9, -0.15);
  },
};

export function drawCreature(g: Phaser.GameObjects.Graphics, cardId: string, r: number): void {
  const card = getCard(cardId);
  // Las evoluciones sin dibujo propio usan el de su línea (solo en la vista 2D de respaldo).
  const painter = PAINTERS[cardId] ?? PAINTERS[card.line];
  if (painter) return painter(g, r);
  const c = ELEMENT_COLORS[card.types[0]];
  g.fillStyle(c, 1).fillCircle(0, 0, r);
  g.lineStyle(r * 0.1, darken(c, 0.6), 1).strokeCircle(0, 0, r);
  face(g, r);
}

/** Icono de hechizo (para cartas). */
export function drawSpellIcon(g: Phaser.GameObjects.Graphics, cardId: string, r: number): void {
  if (getCard(cardId).line === 'rayo') {
    g.fillStyle(0xffe14d, 1);
    g.fillPoints(
      [
        { x: r * 0.1, y: -r }, { x: -r * 0.55, y: r * 0.1 }, { x: -r * 0.05, y: r * 0.1 },
        { x: -r * 0.25, y: r }, { x: r * 0.55, y: -r * 0.2 }, { x: r * 0.05, y: -r * 0.2 },
      ] as Phaser.Types.Math.Vector2Like[],
      true,
    );
    return;
  }
  g.fillStyle(0xbff4ff, 1);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    g.lineStyle(r * 0.16, 0xbff4ff, 1).lineBetween(0, 0, Math.cos(a) * r, Math.sin(a) * r);
  }
  g.fillCircle(0, 0, r * 0.22);
}

/** Rasteriza un dibujo vectorial en una textura con nombre (solo la primera vez). */
export function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void, ox = 0, oy = 0): string {
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.translateCanvas(ox, oy);
  draw(g);
  g.generateTexture(key, Math.ceil(w), Math.ceil(h));
  g.destroy();
  return key;
}

/**
 * Hornea la ficha en una textura (una vez por carta y tamaño). Dibujar Graphics vectoriales
 * en cada fotograma es caro; una imagen ya rasterizada se dibuja en un solo paso.
 * La textura es cuadrada y la ficha queda centrada.
 */
export function creatureTexture(scene: Phaser.Scene, cardId: string, r: number): string {
  const size = Math.ceil(r * 1.8) * 2;
  const card = getCard(cardId);
  return bake(scene, `ficha-${cardId}-${size}`, size, size, (g) => {
    if (card.kind === 'pokemon') drawCreature(g, cardId, r);
    else drawSpellIcon(g, cardId, r);
  }, size / 2, size / 2);
}
