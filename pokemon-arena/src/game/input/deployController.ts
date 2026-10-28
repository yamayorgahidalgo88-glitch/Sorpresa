import type { Vec } from '../../sim/core/vec';
import { isInField, screenToTile, slotAt } from '../layout';

/**
 * Controlador de despliegue independiente del dispositivo. Phaser entrega los eventos
 * de ratón y de pantalla táctil como "pointer", así que ambos siguen el mismo flujo:
 *
 *  - Tocar/clicar una carta la selecciona (tocarla otra vez la deselecciona).
 *  - Con una carta seleccionada, tocar el campo la despliega en esa casilla.
 *  - También se puede arrastrar una carta y soltarla en el campo.
 *  - Soltar el arrastre fuera del campo lo cancela (la carta sigue seleccionada).
 */
export interface DeployActions {
  canDeploy(slot: number, tile: Vec): boolean;
  /** Intenta desplegar; devuelve si tuvo éxito. */
  deploy(slot: number, tile: Vec): boolean;
  /** Avisos opcionales para la interfaz. */
  onSelect?(slot: number | null): void;
  onReject?(slot: number, tile: Vec): void;
}

export interface Preview {
  slot: number;
  tile: Vec;
  valid: boolean;
}

/** Cómo se traducen las coordenadas de pantalla del juego a casillas (2D o perspectiva 3D). */
export interface FieldMapping {
  isInField(x: number, y: number): boolean;
  screenToTile(x: number, y: number): Vec;
}

export const FLAT_MAPPING: FieldMapping = { isInField, screenToTile };

/** Píxeles (en coordenadas lógicas) que distinguen un toque de un arrastre. */
export const DRAG_THRESHOLD = 14;

export class DeployController {
  selected: number | null = null;
  private pressSlot: number | null = null;
  private pressStart: Vec | null = null;
  dragging = false;
  preview: Preview | null = null;

  constructor(
    private readonly actions: DeployActions,
    private readonly field: FieldMapping = FLAT_MAPPING,
  ) {}

  pointerDown(x: number, y: number): void {
    const slot = slotAt(x, y);
    if (slot >= 0) {
      this.pressSlot = slot;
      this.pressStart = { x, y };
      this.dragging = false;
      return;
    }
    if (this.selected !== null && this.field.isInField(x, y)) {
      this.tryDeploy(this.selected, this.field.screenToTile(x, y));
    }
  }

  pointerMove(x: number, y: number): void {
    if (this.pressSlot !== null && this.pressStart && !this.dragging) {
      if (Math.hypot(x - this.pressStart.x, y - this.pressStart.y) >= DRAG_THRESHOLD) {
        this.dragging = true;
        this.select(this.pressSlot);
      }
    }
    const slot = this.dragging ? this.pressSlot : this.selected;
    if (slot !== null && this.field.isInField(x, y)) {
      const tile = this.field.screenToTile(x, y);
      this.preview = { slot, tile, valid: this.actions.canDeploy(slot, tile) };
    } else if (this.dragging) {
      this.preview = null;
    }
  }

  pointerUp(x: number, y: number): void {
    const slot = this.pressSlot;
    const wasDragging = this.dragging;
    this.pressSlot = null;
    this.pressStart = null;
    this.dragging = false;
    if (slot === null) return;
    if (wasDragging) {
      if (this.field.isInField(x, y)) this.tryDeploy(slot, this.field.screenToTile(x, y));
      else this.preview = null;
      return;
    }
    // Toque simple sobre una carta: alterna la selección.
    if (slotAt(x, y) === slot) this.select(this.selected === slot ? null : slot);
  }

  cancel(): void {
    this.pressSlot = null;
    this.pressStart = null;
    this.dragging = false;
    this.select(null);
  }

  private select(slot: number | null): void {
    if (this.selected === slot) return;
    this.selected = slot;
    if (slot === null) this.preview = null;
    this.actions.onSelect?.(slot);
  }

  private tryDeploy(slot: number, tile: Vec): void {
    if (this.actions.deploy(slot, tile)) {
      this.preview = null;
      this.select(null);
    } else {
      this.actions.onReject?.(slot, tile);
    }
  }
}
