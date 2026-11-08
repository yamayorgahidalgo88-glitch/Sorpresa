// Motor de reglas determinista: métricas de la pieza + material + boquilla + uso
// → perfil completo para la Neptune 3 Pro, con la explicación de cada decisión.
import { PRINTER, MATERIALS, NOZZLES, USES, SPEEDS } from './knowledge.js';

const r2 = x => Math.round(x * 100) / 100;
const r1 = x => Math.round(x * 10) / 10;
const snap = (x, step) => r2(Math.round(x / step) * step);

export function computeProfile(input) {
  const {
    metrics = null,        // salida de analyze() o null en modo foto
    photo = null,          // { dims:[x,y,z], kind, overhangs:'none'|'few'|'many'|'unknown', thin, flatBase }
    material = 'PLA', nozzle = 0.4, use = 'funcional', quality = 'estandar',
    calib = {},            // calibraciones del usuario ("Mi impresora")
  } = input;

  const M = MATERIALS[material];
  const N = NOZZLES[nozzle];
  const U = USES[use];
  const reasons = [];   // por qué se eligió cada valor
  const warnings = [];  // problemas: { id, text, data, penalty } (penalty resta confianza)
  const warn = (id, text, data = {}, penalty = 0) => warnings.push({ id, text, data, penalty });
  const advice = [];    // consejos
  const why = (id, text) => reasons.push({ id, text });

  const firmware = calib.firmware || 'marlin';
  const flowMax = Number(calib.flowMax) > 0 ? Number(calib.flowMax) : PRINTER.defaultFlowMax;
  const dims = metrics ? metrics.dims : (photo && photo.dims) || [0, 0, 0];
  const maxXY = Math.max(dims[0], dims[1]);
  const height = dims[2];
  const minXY = Math.max(0.001, Math.min(dims[0], dims[1]));
  const shape = metrics ? metrics.shapeClass : (photo && ['figura', 'organica'].includes(photo.kind) ? 'organica' : 'prismatica');

  // ------------------------------------------------------------- capa y línea
  let q = quality;
  const minFeat = metrics ? metrics.thickness.min : null;
  if (metrics && (minFeat < 0.8 || (shape === 'organica' && height < 40)) && q !== 'detalle' && use !== 'jarron') {
    why('fine_detail', `Detalle fino detectado (pared mínima ≈ ${r2(minFeat)} mm${shape === 'organica' && height < 40 ? ', figura pequeña orgánica' : ''}): se usa capa de detalle.`);
    q = 'detalle';
  }
  if (photo && photo.kind === 'miniatura' && q !== 'detalle') { why('fine_detail', 'Miniatura: capa de detalle.'); q = 'detalle'; }
  let layer = N.layers[q];
  layer = Math.min(Math.max(layer, nozzle * 0.25), nozzle * 0.75);
  layer = snap(layer, PRINTER.zStepMm);
  why('layer', `Capa ${layer} mm (objetivo "${q}", boquilla ${nozzle}: dentro del 25–75 % del diámetro y múltiplo de ${PRINTER.zStepMm} mm, el paso exacto del husillo Z, para que todas las capas midan lo mismo).`);
  const first = N.first;
  const lw = N.lw, lw0 = N.lw0;

  // Error de altura final por redondeo de capas
  if (height > 0) {
    const n = Math.round((height - first) / layer);
    const h = r2(first + n * layer);
    const err = r2(h - height);
    if (Math.abs(err) >= 0.01) advice.push(`Altura: ${r2(height)} mm → con capa ${layer} saldrá ≈ ${h} mm (${err > 0 ? '+' : ''}${err} mm). Si la cota Z es crítica, ajusta el modelo a ${r2(first)} + n×${layer} mm o usa capa adaptativa.`);
  }

  // ------------------------------------------------------------- paredes / relleno
  let walls = U.walls, top = U.top, bottom = U.bottom, infill = U.infill, pattern = U.pattern;
  if (!U.vase) {
    top = Math.max(top, Math.ceil(0.8 / layer));      // ≥ 0,8 mm de techo
    bottom = Math.max(bottom, Math.ceil(0.6 / layer)); // ≥ 0,6 mm de suelo
  }
  why('walls', `${U.label}: ${walls} paredes, ${top} capas arriba (${r2(top * layer)} mm) / ${bottom} abajo, relleno ${infill} % ${pattern}. Más paredes dan más resistencia que más relleno.`);
  const slender = height / minXY > 3 || (metrics && metrics.slenderness > 3);
  if (slender && !U.vase && walls < 3) { walls = 3; why('slender_walls', 'Pieza alta y fina: mínimo 3 paredes para que no oscile en la cama móvil.'); }
  if (metrics && use === 'decorativo' && metrics.topFlatCm2 < 1 && shape === 'organica' && infill <= 10) {
    pattern = 'lightning'; infill = 10;
    why('lightning', 'Figura sin techos planos grandes: relleno "lightning" (solo sostiene los techos, ahorra tiempo y material).');
  }

  // ------------------------------------------------------------- velocidades
  const f = M.speedFactor;
  let sp = {
    outer: SPEEDS.outer, inner: SPEEDS.inner, infill: SPEEDS.infill, solid: SPEEDS.solid,
    top: SPEEDS.top, bridge: SPEEDS.bridge, first: SPEEDS.first, firstInfill: SPEEDS.firstInfill,
    travel: SPEEDS.travel, support: SPEEDS.support,
  };
  for (const k of ['outer', 'inner', 'infill', 'solid', 'top', 'support']) sp[k] = Math.round(sp[k] * f);
  if (q === 'detalle') { sp.outer = 25; why('outer_detail', 'Detalle: perímetro exterior a 25 mm/s.'); }
  if (slender) {
    for (const k of ['outer', 'inner', 'infill', 'solid', 'top', 'support']) sp[k] = Math.round(sp[k] * 0.8);
    why('slender_speed', 'Pieza alta/esbelta (altura/base > 3): velocidades al 80 % para que no vibre.');
  }
  if (material === 'TPU') {
    for (const k of Object.keys(sp)) if (k !== 'travel') sp[k] = Math.min(sp[k], M.speedMax);
    sp.first = Math.min(sp.first, 15);
    why('tpu_speed', 'TPU: todo a ≤ 25 mm/s (extrusor directo, pero el filamento flexible se comprime).');
  }
  if (N.speedMax) for (const k of Object.keys(sp)) if (k !== 'travel') sp[k] = Math.min(sp[k], N.speedMax);

  // Límite de caudal volumétrico del hotend con PTFE
  const cap = Math.floor(flowMax / (layer * lw));
  let capped = false;
  for (const k of ['inner', 'infill', 'solid', 'top', 'support', 'outer']) if (sp[k] > cap) { sp[k] = cap; capped = true; }
  why('flow_cap', `Caudal máximo ${flowMax} mm³/s${calib.flowMax ? ' (tu calibración)' : ' (conservador por el PTFE, calíbralo)'} → con ${layer}×${lw} mm la velocidad máxima útil es ${cap} mm/s${capped ? ' (se han recortado velocidades)' : ''}.`);

  // ------------------------------------------------------------- aceleración
  let acc;
  if (firmware === 'marlin') {
    acc = { def: 500, outer: (q === 'detalle' || slender) ? 300 : 500, travel: 500, first: 300, jerk: 8 };
    why('accel', `Marlin de serie: ${acc.def} mm/s² general, ${acc.outer} en el perímetro exterior (cama móvil pesada sin input shaping; evita ringing y desplazamientos de capa). Jerk 8 mm/s.`);
  } else {
    acc = { def: 1000, outer: (q === 'detalle' || slender) ? 500 : 700, travel: 1500, first: 300, jerk: 8 };
    why('accel', `Firmware con input shaping (${firmware === 'klipper' ? 'Klipper' : 'Marlin dderg'}): ${acc.def} mm/s² como punto de partida; súbela solo según tu calibración de input shaping.`);
  }

  // ------------------------------------------------------------- temperatura y ventilación
  const ct = calib.temps && Number(calib.temps[material]);
  const temps = {
    nozzle: ct > 0 ? ct : M.nozzle,
    nozzle0: ct > 0 ? Math.min(ct + 5, PRINTER.safeNozzleTemp) : M.nozzle0,
    bed: M.bed, bed0: M.bed0,
  };
  why('temps', `${M.label}: boquilla ${temps.nozzle} °C (1.ª capa ${temps.nozzle0} °C), cama ${temps.bed} °C (1.ª capa ${temps.bed0} °C)${ct > 0 ? ' — temperatura de tu torre de calibración' : ''}.`);
  const fan = {
    min: M.fanMin, max: M.fanMax, offLayers: M.fanOffLayers, fullFrom: M.fanOffLayers + 2,
    overhang: M.overhangFan, bridge: M.bridgeFan, minLayerTime: M.minLayerTime,
  };
  const smallPart = maxXY > 0 && maxXY < 25 && height > 8;
  if (smallPart) {
    fan.minLayerTime = Math.max(fan.minLayerTime, 10);
    advice.push('Pieza pequeña: cada capa dura muy poco. Tiempo mínimo de capa 10 s; si se deforma, imprime 2–4 copias a la vez para que cada capa enfríe.');
  }
  why('fan', `Ventilador ${fan.min === fan.max ? fan.max + ' %' : fan.min + '–' + fan.max + ' %'}, apagado en ${fan.offLayers === 1 ? 'la capa 1' : 'las capas 1–' + fan.offLayers}, ${fan.bridge} % en puentes y voladizos; tiempo mínimo de capa ${fan.minLayerTime} s.`);

  // ------------------------------------------------------------- retracción
  const cr = calib.retract && Number(calib.retract[material]);
  const retract = {
    length: cr > 0 ? cr : M.retract, speed: M.retractSpeed, zHop: M.zHop, wipe: M.wipe,
  };
  why('retract', `Retracción corta de extrusor directo: ${retract.length} mm a ${retract.speed} mm/s${cr > 0 ? ' (tu torre de retracción)' : ''}${retract.wipe ? ', con limpieza (wipe)' : ''}. Nunca los 5 mm del perfil Bowden del Neptune 3 base.`);

  // ------------------------------------------------------------- soportes
  const alpha = M.supportAlpha;
  const support = {
    enabled: false, type: 'tree', style: 'organic', alpha, buildPlateOnly: true,
    topZ: M.supportTopZ, bottomZ: M.supportTopZ, xy: M.supportXY, density: 15,
    interfaceLayers: 3, interfaceSpacing: 0.25, noBridgeSupport: true,
  };
  let needIslands = [];
  if (metrics) {
    // Regla de los 5 mm (UMD) / 2–3 mm (MIT): salientes cortos se imprimen sin soporte.
    needIslands = metrics.islands.filter(i => i.areaMm2 > 4 && (
      (i.kind === 'bridge' && i.spanMm > 50) ||
      (i.kind === 'cantilever' && i.cantileverMm > 3) ||
      (i.kind === 'slope' && i.spanMm > 3)));
    for (const b of metrics.bridges.filter(b => b.spanMm > 30 && b.spanMm <= 50)) {
      warn('bridge_risky', `Puente de ${r1(b.spanMm)} mm a ${r1(b.z)} mm de altura: arriesgado (30–50 mm). Haz un test de puentes o activa soporte si cuelga.`, { span: r1(b.spanMm), z: r1(b.z), speed: sp.bridge, fan: fan.bridge }, 10);
    }
    const cants = metrics.islands.filter(i => i.kind === 'cantilever' && i.cantileverMm > 3 && i.areaMm2 > 4);
    if (cants.length) {
      const c = cants[0];
      advice.push(`Voladizo horizontal en ménsula ${isFinite(c.cantileverMm) ? 'de ' + r1(c.cantileverMm) + ' mm ' : 'sin apoyo '}a ${r1(c.zMin)} mm de altura: necesita soporte o reorientar la pieza.`);
    }
    if (metrics.overhangPct > 0.5 && needIslands.length) {
      support.enabled = true;
      support.buildPlateOnly = needIslands.every(i => i.seesBed !== false);
      const flatBig = metrics.largestIslandFlatness > 0.9 && shape !== 'organica';
      if (shape === 'organica' || use === 'decorativo' || !flatBig) {
        support.type = 'tree'; support.style = 'organic'; support.interfaceLayers = 2;
        why('support', `Soporte en ÁRBOL (orgánico): ${r1(metrics.overhangPct)} % del área en voladizo > ${alpha}° desde la vertical, ${needIslands.length} zona(s) que lo necesitan; forma ${shape}.`);
      } else {
        support.type = 'normal'; support.style = 'snug'; support.interfaceLayers = 3;
        why('support', `Soporte NORMAL ajustado (snug/rejilla): voladizo plano grande (${r1(metrics.overhangPct)} % del área > ${alpha}°).`);
      }
      why('support_base', support.buildPlateOnly
        ? 'Todas las zonas en voladizo ven la cama: soporte solo desde la cama (no deja marcas sobre la pieza).'
        : 'Hay voladizos sin línea de visión a la cama: soporte "en todas partes" (ojo con las marcas encima de la pieza).');
    } else {
      why('support', metrics.overhangPct > 0.5
        ? `Sin soporte: los voladizos son puentes (≤ 50 mm, apoyados en los dos extremos) o salientes ≤ 3 mm, que se imprimen bien con ventilador al ${fan.bridge} % y ${sp.bridge} mm/s.`
        : `Sin soporte: solo ${r1(metrics.overhangPct)} % del área supera ${alpha}° desde la vertical.`);
    }
    if (metrics.bridges.length && !metrics.bridges.some(b => b.spanMm > 50)) {
      why('bridges', `Puentes detectados (máx. ${r1(metrics.maxBridgeMm)} mm): "no soportar puentes", velocidad de puente ${sp.bridge} mm/s y ventilador ${fan.bridge} %.`);
    }
  } else if (photo) {
    if (photo.overhangs !== 'none') {
      support.enabled = true; support.buildPlateOnly = photo.overhangs !== 'many';
      support.type = 'tree'; support.style = 'organic'; support.interfaceLayers = 2;
      why('support', 'Modo foto (baja confianza): soporte en árbol activado por precaución porque no se puede medir la cara oculta.');
    } else why('support', 'Modo foto: indicas que no hay voladizos → sin soporte. Revisa la vista previa del laminador.');
  }
  if (material === 'PETG') { support.topZ = 0.25; support.xy = 0.8; }
  if (support.enabled) why('support_vals', `Distancia Z superior ${support.topZ} mm, inferior ${support.bottomZ} mm, XY ${support.xy} mm, densidad ${support.density} %, ${support.interfaceLayers} capas de interfaz. Umbral: Cura support_angle = ${alpha}°; Orca/Elegoo/Prusa = ${90 - alpha}° (miden desde la horizontal).`);

  // ------------------------------------------------------------- adhesión
  const contactCm2 = metrics ? metrics.contactCm2 : (photo && photo.flatBase === false ? 0.5 : 10);
  const adhesion = { type: 'skirt', brimWidth: 0, skirtLoops: 3, skirtDistance: 3, raftLayers: 0 };
  if (U.vase || material === 'TPU') {
    why('adhesion', material === 'TPU' ? 'TPU: falda (en PEI pega muy bien; incluso demasiado).' : 'Modo jarrón: falda de purga.');
  } else if (metrics && contactCm2 < 0.2) {
    adhesion.type = 'raft'; adhesion.raftLayers = 2;
    why('adhesion', `Casi sin base plana (${r2(contactCm2)} cm² de contacto): balsa de 2 capas (separación 0,1–0,2 mm).`);
  } else if (contactCm2 < 3 || slender || (metrics && !metrics.comInside) || (['PETG', 'ABS', 'ASA'].includes(material) && maxXY > 100) || (photo && photo.flatBase === false)) {
    adhesion.type = 'brim';
    adhesion.brimWidth = (contactCm2 < 1 || ['ABS', 'ASA'].includes(material) || (metrics && !metrics.comInside)) ? 8 : 6;
    const why_ = [];
    if (contactCm2 < 3) why_.push(`contacto pequeño (${r2(contactCm2)} cm² < 3)`);
    if (slender) why_.push('pieza alta y fina');
    if (metrics && !metrics.comInside) why_.push('el centro de masas cae fuera de la huella de apoyo');
    if (['PETG', 'ABS', 'ASA'].includes(material) && maxXY > 100) why_.push(`${material} de más de 100 mm (warping)`);
    if (photo && photo.flatBase === false) why_.push('la base no es plana');
    why('adhesion', `Borde (brim) de ${adhesion.brimWidth} mm: ${why_.join(', ')}.`);
  } else {
    why('adhesion', `Falda de 3 líneas a 3 mm (base de ${r1(contactCm2)} cm²: suficiente apoyo, la falda sirve de purga).`);
  }
  const elephant = ['mecanica', 'roscas'].includes(use) ? 0.15 : 0.1;
  why('elephant', `Compensación de pie de elefante ${elephant} mm${['mecanica', 'roscas'].includes(use) ? ' (cotas de la base exactas)' : ''}.`);
  const holeComp = ['mecanica', 'roscas'].includes(use) ? 0.1 : 0;
  if (holeComp) why('holes', 'Pieza mecánica: compensación de agujeros +0,1 mm (los agujeros FDM salen pequeños). Ejes de agujeros en vertical siempre que se pueda.');

  // ------------------------------------------------------------- acabado
  const ironing = { enabled: false, flow: 15, speed: 15 };
  if (metrics && metrics.topFlatCm2 > 4 && ['decorativo', 'funcional'].includes(use) && q !== 'borrador') {
    ironing.enabled = true;
    why('ironing', `Superficie superior plana de ${r1(metrics.topFlatCm2)} cm² a Z=${r1(metrics.topFlatZ)} mm: planchado solo en la cara superior (flujo 15 %, 15 mm/s).`);
  }
  why('seam', `Costura ${U.seam === 'back' ? 'trasera (back), queda escondida en figuras' : 'alineada en la esquina más aguda (aligned)'}.`);

  // ------------------------------------------------------------- avisos generales
  if (metrics) {
    if (!metrics.fit.fits) {
      if (metrics.fit.rotated) advice.push('No cabe recta pero sí girada 45° en XY: ya se ha aplicado/conviene aplicarlo.');
      else warn('no_fit', `NO CABE: ${dims.map(r1).join(' × ')} mm frente al volumen útil ${metrics.fit.usable.join(' × ')} mm. Escala la pieza, gírala o divídela.`, { dims: dims.map(r1), usable: metrics.fit.usable }, 60);
    }
    if (!metrics.watertight) warn('not_watertight', `La malla no es estanca (${metrics.openEdges} aristas abiertas${metrics.nonManifold ? `, ${metrics.nonManifold} no-manifold` : ''}). Repárala (Orca: "Reparar", Windows 3D Builder, Meshmixer) o el laminado puede tener huecos.`, { open: metrics.openEdges, nonManifold: metrics.nonManifold }, 25);
    if (minFeat !== null) {
      if (metrics.thickness.fracBelowLw > 0.01) warn('thin_walls', `Hay paredes más finas que el ancho de línea (${lw} mm; mínimo medido ≈ ${r2(minFeat)} mm): esas partes NO se imprimirán. ${nozzle > 0.2 && minFeat < 0.4 ? 'Considera boquilla 0,2 o engrosar el modelo.' : 'Activa "detectar paredes finas" y engrosa el modelo.'}`, { lw, min: r2(minFeat), nozzle, frac: Math.round(metrics.thickness.fracBelowLw * 1000) / 10 }, 20);
      else if (metrics.thickness.fracBelow2Lw > 0.02) advice.push(`Paredes finas (< ${r2(2 * lw)} mm) en ~${Math.round(metrics.thickness.fracBelow2Lw * 100)} % de la superficie: generador de paredes Arachne y "detectar paredes finas" activados.`);
    }
    if (!metrics.comInside && metrics.contactCm2 > 0) warn('com_outside', 'El centro de masas cae fuera de la huella de apoyo: la pieza puede volcar durante la impresión. Borde ancho y/o soporte.', { contact: r2(metrics.contactCm2), height: r1(height), brim: 8 }, 20);
    if (maxXY > 150 && ['mecanica', 'funcional'].includes(use) && minFeat > 1.2 && nozzle === 0.4) advice.push('Pieza grande y robusta: considera boquilla 0,6 (capa 0,3, ≤ 45 mm/s por límite de caudal) para ahorrar tiempo.');
    if (metrics.flipped) advice.push('Las normales del archivo venían invertidas; se han corregido para el análisis.');
  }
  if (M.enclosure) warn('enclosure', `${M.label}: necesita cerramiento (warping y vapores). No superes 250 °C de forma continuada: el hotend lleva PTFE interno.`, { material: M.label, nozzle: temps.nozzle, bed: temps.bed }, 5);
  if (N.warn) warn('nozzle_' + String(nozzle).replace('.', ''), N.warn, { nozzle, layer, cap }, 5);
  if (material === 'PETG') advice.push('PETG en PEI texturizada: sin adhesivo, se despega solo al enfriar. En PEI lisa puede arrancar la capa de PEI.');
  if (height > 150) advice.push('Impresión alta en cama móvil: revisa tensión de correas antes de empezar (desplazamientos de capa).');
  advice.push('Nivelación: la malla de 36 puntos depende de la temperatura de la cama. Si cambias mucho de temperatura, vuelve a nivelar (o usa G29 en el inicio).');

  // ------------------------------------------------------------- Linear Advance / caudal
  const pa = { enabled: Number(calib.k) > 0, k: Number(calib.k) > 0 ? Number(calib.k) : 0 };
  if (!pa.enabled) advice.push('Calibra Pressure/Linear Advance (Orca → Calibración). Punto de partida en extrusor directo: K = 0,02–0,1 (emite M900).');
  const flowRatio = Number(calib.flowRatio) > 0 ? Number(calib.flowRatio) : 1.0;

  // ------------------------------------------------------------- estimaciones
  let est = null;
  if (metrics) {
    const V = metrics.volumeCm3 * 1000, A = metrics.areaCm2 * 100;
    const shellT = U.vase ? lw : (walls * lw + (top + bottom) / 2 * layer) / 2;
    const shell = Math.min(V, A * shellT);
    let vm = shell + Math.max(0, V - shell) * infill / 100;
    if (support.enabled) {
      const supV = needIslands.reduce((a, i) => a + i.areaMm2 * Math.max(0, (i.zMin || 0)) * 0.15 * 1.3, 0);
      vm += supV;
    }
    vm *= flowRatio;
    const grams = vm / 1000 * M.density;
    const meters = vm / (Math.PI * 0.875 * 0.875) / 1000;
    const avgSpeed = (sp.inner + sp.infill + sp.outer) / 3;
    const rate = Math.min(flowMax, layer * lw * avgSpeed) * 0.6;
    const layers = Math.max(1, Math.ceil((height - first) / layer) + 1);
    const seconds = vm / rate + layers * 3;
    est = { grams: r1(grams), meters: r2(meters), minutes: Math.round(seconds / 60), layers };
  }

  if (!metrics && photo) {
    const usable = PRINTER.buildVolume.map(v => v - PRINTER.marginMm);
    if (dims[0] > usable[0] || dims[1] > usable[1] || dims[2] > usable[2]) warnings.unshift({ id: 'no_fit_photo', text: `Con ${dims.join(' × ')} mm no cabe en el volumen útil (${usable.join(' × ')} mm). Gírala, escálala o divídela.`, data: { dims, usable }, penalty: 30 });
    warnings.unshift({ id: 'photo_mode', text: 'Confianza baja: perfil calculado desde fotos y medidas. Sube el STL/3MF para un análisis exacto de voladizos, puentes y paredes.', data: {}, penalty: 0 });
  }
  // Confianza: 100 con archivo 3D (40 con fotos) menos lo que resta cada aviso.
  const confBase = metrics ? 100 : 40;
  const confScore = Math.max(0, confBase - warnings.reduce((a, w) => a + w.penalty, 0));
  const confidence = confScore >= 80 ? 'alta' : confScore >= 50 ? 'media' : 'baja';

  return {
    confidence, confScore, confBase, reasons, warnings, advice, estimates: est,
    material, nozzle, use, quality: q, firmware,
    settings: {
      layerHeight: layer, firstLayerHeight: first, lineWidth: lw, firstLineWidth: lw0,
      walls, topLayers: top, bottomLayers: bottom, infill, pattern,
      speeds: sp, accel: acc, temps, fan, retract, flowMax, flowRatio, pa,
      support, adhesion, elephantFoot: elephant, holeComp, seam: U.seam, ironing,
      vase: !!U.vase, arachne: true, thinWalls: !!(metrics && metrics.thickness.fracBelow2Lw > 0.01),
    },
  };
}
