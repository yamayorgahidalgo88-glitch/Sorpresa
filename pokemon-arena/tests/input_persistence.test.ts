import { describe, expect, it } from 'vitest';
import { DeployController, DRAG_THRESHOLD } from '../src/game/input/deployController';
import { cardSlotRect, isInField, screenToTile, tileToScreen } from '../src/game/layout';
import { DEFAULT_SETTINGS, loadSettings, loadStats, recordResult, saveSettings } from '../src/persistence/settings';
import type { KeyValueStore } from '../src/persistence/settings';

/**
 * Los controles se prueban sobre el controlador, que recibe coordenadas lógicas de
 * puntero: Phaser unifica ratón y pantalla táctil en esos mismos eventos.
 * (La prueba en navegador real con ratón y táctil está en scripts/e2e.mjs.)
 */
function setup(valid = (t: { x: number; y: number }) => t.y > 17) {
  const deployed: { slot: number; tile: { x: number; y: number } }[] = [];
  const rejected: number[] = [];
  const selections: (number | null)[] = [];
  const c = new DeployController({
    canDeploy: (_s, t) => valid(t),
    deploy: (slot, tile) => {
      if (!valid(tile)) return false;
      deployed.push({ slot, tile });
      return true;
    },
    onSelect: (s) => selections.push(s),
    onReject: (s) => rejected.push(s),
  });
  const card = (i: number) => {
    const r = cardSlotRect(i);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  };
  return { c, deployed, rejected, selections, card };
}

const field = (tx: number, ty: number) => tileToScreen({ x: tx, y: ty });

describe('controles de despliegue (ratón y táctil)', () => {
  it('convierte pantalla <-> casillas de forma consistente', () => {
    const s = tileToScreen({ x: 3.5, y: 20.5 });
    expect(screenToTile(s.x, s.y)).toEqual({ x: 3.5, y: 20.5 });
    expect(isInField(s.x, s.y)).toBe(true);
    const r = cardSlotRect(0);
    expect(isInField(r.x + 5, r.y + 5)).toBe(false);
  });

  it('toque en carta + toque en campo despliega la carta', () => {
    const { c, deployed, card } = setup();
    const p = card(2);
    c.pointerDown(p.x, p.y);
    c.pointerUp(p.x, p.y);
    expect(c.selected).toBe(2);
    const f = field(5, 22);
    c.pointerDown(f.x, f.y);
    c.pointerUp(f.x, f.y);
    expect(deployed).toEqual([{ slot: 2, tile: { x: 5, y: 22 } }]);
    expect(c.selected).toBeNull();
  });

  it('tocar dos veces la misma carta la deselecciona', () => {
    const { c, card } = setup();
    const p = card(1);
    c.pointerDown(p.x, p.y);
    c.pointerUp(p.x, p.y);
    c.pointerDown(p.x, p.y);
    c.pointerUp(p.x, p.y);
    expect(c.selected).toBeNull();
  });

  it('arrastrar y soltar en el campo despliega; la vista previa sigue al puntero', () => {
    const { c, deployed, card } = setup();
    const p = card(0);
    const f = field(9, 25);
    c.pointerDown(p.x, p.y);
    c.pointerMove(p.x, p.y - DRAG_THRESHOLD - 1);
    expect(c.dragging).toBe(true);
    c.pointerMove(f.x, f.y);
    expect(c.preview).toEqual({ slot: 0, tile: { x: 9, y: 25 }, valid: true });
    c.pointerUp(f.x, f.y);
    expect(deployed).toEqual([{ slot: 0, tile: { x: 9, y: 25 } }]);
    expect(c.preview).toBeNull();
  });

  it('un movimiento pequeño (temblor del dedo) no se convierte en arrastre', () => {
    const { c, deployed, card } = setup();
    const p = card(3);
    c.pointerDown(p.x, p.y);
    c.pointerMove(p.x + 4, p.y + 3);
    c.pointerUp(p.x + 4, p.y + 3);
    expect(c.dragging).toBe(false);
    expect(c.selected).toBe(3);
    expect(deployed).toEqual([]);
  });

  it('soltar fuera del campo cancela el arrastre sin desplegar', () => {
    const { c, deployed, card } = setup();
    const p = card(0);
    c.pointerDown(p.x, p.y);
    c.pointerMove(p.x, p.y - 40);
    c.pointerUp(p.x, p.y - 40); // sigue en el HUD
    expect(deployed).toEqual([]);
  });

  it('una zona no permitida se rechaza y la carta sigue seleccionada', () => {
    const { c, deployed, rejected, card } = setup();
    const p = card(1);
    c.pointerDown(p.x, p.y);
    c.pointerUp(p.x, p.y);
    const f = field(9, 8);
    c.pointerMove(f.x, f.y);
    expect(c.preview?.valid).toBe(false);
    c.pointerDown(f.x, f.y);
    expect(deployed).toEqual([]);
    expect(rejected).toEqual([1]);
    expect(c.selected).toBe(1);
  });

  it('tocar el campo sin carta seleccionada no hace nada', () => {
    const { c, deployed, rejected } = setup();
    const f = field(9, 25);
    c.pointerDown(f.x, f.y);
    c.pointerUp(f.x, f.y);
    expect(deployed).toEqual([]);
    expect(rejected).toEqual([]);
  });

  it('cancelar (Esc) limpia la selección', () => {
    const { c, card, selections } = setup();
    const p = card(2);
    c.pointerDown(p.x, p.y);
    c.pointerUp(p.x, p.y);
    c.cancel();
    expect(c.selected).toBeNull();
    expect(selections).toEqual([2, null]);
  });
});

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
}

describe('persistencia', () => {
  it('guarda y recupera ajustes y mazo', () => {
    const store = new MemoryStore();
    const deck = ['snorlax', 'charizard', 'geodude', 'jigglypuff', 'squirtle', 'pikachu', 'machop', 'ventisca'];
    saveSettings({ difficulty: 'dificil', muted: true, deck }, store);
    expect(loadSettings(store)).toEqual({ difficulty: 'dificil', muted: true, deck });
  });

  it('valores corruptos o mazos no válidos vuelven a los valores por defecto', () => {
    const store = new MemoryStore();
    store.setItem('pokemon-arena:ajustes', '{"difficulty":"imposible","deck":["onix","onix"]}');
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
    store.setItem('pokemon-arena:ajustes', 'no es json');
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('registra victorias, derrotas y empates', () => {
    const store = new MemoryStore();
    recordResult(0, store);
    recordResult(0, store);
    recordResult(1, store);
    recordResult(null, store);
    expect(loadStats(store)).toEqual({ wins: 2, losses: 1, draws: 1 });
  });
});
