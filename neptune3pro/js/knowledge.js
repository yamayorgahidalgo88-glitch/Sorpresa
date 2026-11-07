// Base de conocimiento de la Elegoo Neptune 3 Pro.
// Todos los valores salen del documento de contexto técnico (manual y FAQ de Elegoo,
// Tom's Hardware, The 3D Printer Bee, wikis de Orca/Prusa y consenso de la comunidad).
// Convención interna de ángulos: alfa = ángulo del voladizo medido DESDE LA VERTICAL
// (0° = pared vertical, 90° = techo horizontal).

export const PRINTER = {
  id: 'elegoo_neptune_3_pro',
  name: 'Elegoo Neptune 3 Pro',
  buildVolume: [225, 225, 280], // mm (útil oficial)
  marginMm: 5,
  maxNozzleTemp: 260,
  safeNozzleTemp: 250, // uso continuado con PTFE interno
  maxBedTemp: 100,
  accelSlicer: 500, // mm/s² estable en cama móvil
  firmwareMaxAccel: 1100,
  defaultFlowMax: 11, // mm³/s, conservador por el PTFE, hasta calibrar
  extruder: 'direct',
  eSteps: 380,
  zStepMm: 0.04, // husillo T8 + 400 pasos/mm: alturas múltiplo de 0,04 mm = capas exactas
  nozzles: [0.2, 0.4, 0.6, 0.8],
};

export const MATERIALS = {
  PLA: {
    label: 'PLA', ok: true, density: 1.24,
    nozzle: 205, nozzle0: 210, bed: 60, bed0: 60,
    fanMin: 100, fanMax: 100, fanOffLayers: 1, overhangFan: 100, bridgeFan: 100,
    retract: 1.0, retractSpeed: 30, zHop: 0,
    speedFactor: 1.0, supportAlpha: 50, supportTopZ: 0.2, supportXY: 0.7,
    minLayerTime: 8, wipe: false,
  },
  PETG: {
    label: 'PETG', ok: true, density: 1.27,
    nozzle: 235, nozzle0: 240, bed: 75, bed0: 75,
    fanMin: 30, fanMax: 50, fanOffLayers: 1, overhangFan: 100, bridgeFan: 100,
    retract: 1.5, retractSpeed: 30, zHop: 0,
    speedFactor: 0.8, supportAlpha: 45, supportTopZ: 0.25, supportXY: 0.8,
    minLayerTime: 10, wipe: true,
  },
  TPU: {
    label: 'TPU 95A', ok: true, density: 1.21,
    nozzle: 220, nozzle0: 220, bed: 55, bed0: 55,
    fanMin: 50, fanMax: 80, fanOffLayers: 1, overhangFan: 100, bridgeFan: 100,
    retract: 0.5, retractSpeed: 20, zHop: 0,
    speedFactor: 1.0, speedMax: 25, supportAlpha: 45, supportTopZ: 0.2, supportXY: 0.8,
    minLayerTime: 10, wipe: false,
  },
  ABS: {
    label: 'ABS', ok: 'reservas', density: 1.04,
    nozzle: 245, nozzle0: 245, bed: 95, bed0: 100,
    fanMin: 0, fanMax: 15, fanOffLayers: 3, overhangFan: 40, bridgeFan: 40,
    retract: 1.0, retractSpeed: 30, zHop: 0,
    speedFactor: 0.9, supportAlpha: 45, supportTopZ: 0.2, supportXY: 0.7,
    minLayerTime: 12, wipe: false, enclosure: true,
  },
  ASA: {
    label: 'ASA', ok: 'reservas', density: 1.07,
    nozzle: 248, nozzle0: 250, bed: 95, bed0: 100,
    fanMin: 0, fanMax: 20, fanOffLayers: 3, overhangFan: 40, bridgeFan: 40,
    retract: 1.0, retractSpeed: 30, zHop: 0,
    speedFactor: 0.9, supportAlpha: 45, supportTopZ: 0.2, supportXY: 0.7,
    minLayerTime: 12, wipe: false, enclosure: true,
  },
};

// Boquillas: capa mín/máx, capa recomendada por objetivo, ancho de línea.
export const NOZZLES = {
  0.2: { lw: 0.22, lw0: 0.25, layers: { detalle: 0.08, estandar: 0.12, funcional: 0.12, borrador: 0.12 }, first: 0.12, speedMax: 40, warn: 'Elegoo desaconseja la 0,2 (se atasca). Solo PLA fino, velocidad ≤ 30–40 mm/s.' },
  0.4: { lw: 0.42, lw0: 0.5, layers: { detalle: 0.12, estandar: 0.2, funcional: 0.24, borrador: 0.28 }, first: 0.2, speedMax: null },
  0.6: { lw: 0.62, lw0: 0.68, layers: { detalle: 0.2, estandar: 0.28, funcional: 0.32, borrador: 0.4 }, first: 0.32, speedMax: 50, warn: 'Con 0,6 el hotend PTFE llega al límite de caudal: velocidad 40–50 mm/s.' },
  0.8: { lw: 0.85, lw0: 0.9, layers: { detalle: 0.28, estandar: 0.36, funcional: 0.4, borrador: 0.48 }, first: 0.4, speedMax: 35, warn: 'Con 0,8 el caudal limita mucho: 25–35 mm/s.' },
};

// Paredes / capas / relleno por uso de la pieza.
export const USES = {
  decorativo: { label: 'Decorativa / figura', walls: 2, top: 4, bottom: 3, infill: 10, pattern: 'gyroid', seam: 'back' },
  funcional: { label: 'Funcional ligera', walls: 3, top: 5, bottom: 4, infill: 20, pattern: 'gyroid', seam: 'aligned' },
  mecanica: { label: 'Mecánica / con carga', walls: 4, top: 6, bottom: 5, infill: 35, pattern: 'gyroid', seam: 'aligned' },
  roscas: { label: 'Roscas / insertos', walls: 5, top: 6, bottom: 5, infill: 30, pattern: 'cubic', seam: 'aligned' },
  jarron: { label: 'Modo jarrón (espiral)', walls: 1, top: 0, bottom: 4, infill: 0, pattern: 'gyroid', seam: 'aligned', vase: true },
};

// Velocidades base (PLA, boquilla 0,4, Marlin de serie).
export const SPEEDS = {
  outer: 30, inner: 55, infill: 70, solid: 60, top: 45, bridge: 25,
  first: 18, firstInfill: 25, travel: 150, support: 55,
};

export const QUALITY = {
  detalle: 'Detalle (capa fina)',
  estandar: 'Estándar',
  funcional: 'Funcional (más rápida)',
  borrador: 'Borrador',
};

// G-code de inicio recomendado (Marlin de serie).
export function startGcode({ useMesh = 'M420 S1' } = {}) {
  return [
    'M413 S0 ; desactiva la recuperación tras corte (opcional)',
    'G90',
    'M83',
    'M104 S120 ; precalienta sin rezumar',
    'M140 S[first_layer_bed_temperature]',
    'G28',
    `${useMesh} ; carga la malla guardada (o G29 para medir de nuevo, ~2-3 min)`,
    'M190 S[first_layer_bed_temperature]',
    'M109 S[first_layer_temperature]',
    'G92 E0',
    'G1 Z0.28 F240',
    'G1 X2 Y10 F3000',
    'G1 Y140 E10 F1500 ; línea de purga',
    'G1 X2.3 F5000',
    'G1 Y10 E10 F1200',
    'G92 E0',
  ].join('\n');
}

// Problemas típicos → ajuste (sección 8 del documento).
export const TROUBLESHOOT = [
  ['Hilos (stringing)', 'Temperatura −5 °C; retracción +0,5 mm; combing activado; secar el PETG.'],
  ['Warping', 'Borde de 5–10 mm; cama +5 °C; cerramiento; ventilador bajo en las capas 1–3.'],
  ['Subextrusión', 'Bajar velocidad o limitar el caudal máximo; cambiar el PTFE; recalibrar E-steps (380).'],
  ['Desplazamiento de capa', 'Aceleración ≤ 500; z-hop; revisar correas.'],
  ['Mala adhesión', 'Renivelar; M420 S1 en el inicio; limpiar con alcohol isopropílico; primera capa más lenta.'],
  ['Voladizos caídos', 'Bajar el umbral a 45°; ventilador al 100 %; capa más fina (0,16).'],
  ['Ringing / ghosting', 'Aceleración 300–500; perímetro exterior ≤ 30 mm/s; firmware con input shaping o Klipper.'],
  ['Granos (zits/blobs)', 'Costura alineada o trasera; wipe; Linear Advance (M900).'],
  ['Pie de elefante', 'Compensación 0,1–0,2 mm; cama −5 °C.'],
  ['Delaminación', '+5–10 °C; menos ventilador; cerramiento.'],
  ['Paredes no unidas', 'Subir "Skin Overlap" o el caudal.'],
  ['Medidas XY inexactas', '"Horizontal expansion" / compensación de agujeros, o recalibrar M92 X/Y (80 pasos/mm).'],
];
