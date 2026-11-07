// Exportadores: OrcaSlicer/ElegooSlicer (JSON), PrusaSlicer (.ini), Cura (lista de ajustes)
// y STL binario ya orientado. Claves según la tabla de correspondencias del documento.
import { MATERIALS, startGcode } from './knowledge.js';

const S = v => String(v);
const pctS = v => `${v}%`;

export function orcaProcess(p, name) {
  const s = p.settings, sp = s.speeds, sup = s.support, ad = s.adhesion;
  const machine = `Elegoo Neptune 3 Pro ${p.nozzle} nozzle`;
  return {
    type: 'process', from: 'User', name, inherits: '',
    version: '1.9.0.0', is_custom_defined: '0',
    compatible_printers: [machine],
    layer_height: S(s.layerHeight),
    initial_layer_print_height: S(s.firstLayerHeight),
    line_width: S(s.lineWidth),
    outer_wall_line_width: S(s.lineWidth),
    inner_wall_line_width: S(s.lineWidth),
    initial_layer_line_width: S(s.firstLineWidth),
    sparse_infill_line_width: S(s.lineWidth),
    internal_solid_infill_line_width: S(s.lineWidth),
    top_surface_line_width: S(s.lineWidth),
    support_line_width: S(s.lineWidth),
    wall_loops: S(s.walls),
    top_shell_layers: S(s.topLayers),
    bottom_shell_layers: S(s.bottomLayers),
    sparse_infill_density: pctS(s.infill),
    sparse_infill_pattern: s.pattern,
    wall_generator: s.arachne ? 'arachne' : 'classic',
    detect_thin_wall: s.thinWalls ? '1' : '0',
    outer_wall_speed: S(sp.outer),
    inner_wall_speed: S(sp.inner),
    sparse_infill_speed: S(sp.infill),
    internal_solid_infill_speed: S(sp.solid),
    top_surface_speed: S(sp.top),
    gap_infill_speed: S(sp.top),
    bridge_speed: S(sp.bridge),
    initial_layer_speed: S(sp.first),
    initial_layer_infill_speed: S(sp.firstInfill),
    travel_speed: S(sp.travel),
    support_speed: S(sp.support),
    support_interface_speed: S(Math.round(sp.support * 0.7)),
    default_acceleration: S(s.accel.def),
    outer_wall_acceleration: S(s.accel.outer),
    inner_wall_acceleration: S(s.accel.def),
    travel_acceleration: S(s.accel.travel),
    initial_layer_acceleration: S(s.accel.first),
    top_surface_acceleration: S(s.accel.outer),
    default_jerk: S(s.accel.jerk),
    enable_support: sup.enabled ? '1' : '0',
    support_type: sup.type === 'tree' ? 'tree(auto)' : 'normal(auto)',
    support_style: sup.style,
    support_threshold_angle: S(90 - sup.alpha),
    support_on_build_plate_only: sup.buildPlateOnly ? '1' : '0',
    support_top_z_distance: S(sup.topZ),
    support_bottom_z_distance: S(sup.bottomZ),
    support_object_xy_distance: S(sup.xy),
    support_base_pattern_spacing: S(2.5),
    support_interface_top_layers: S(sup.interfaceLayers),
    support_interface_bottom_layers: S(sup.type === 'tree' ? 0 : 2),
    support_interface_spacing: S(sup.interfaceSpacing),
    bridge_no_support: sup.noBridgeSupport ? '1' : '0',
    brim_type: ad.type === 'brim' ? 'outer_only' : 'no_brim',
    brim_width: S(ad.brimWidth),
    brim_object_gap: S(0.1),
    skirt_loops: S(ad.type === 'skirt' ? ad.skirtLoops : 0),
    skirt_distance: S(ad.skirtDistance),
    raft_layers: S(ad.raftLayers),
    raft_contact_distance: S(0.15),
    elefant_foot_compensation: S(s.elephantFoot),
    xy_hole_compensation: S(s.holeComp),
    seam_position: s.seam,
    ironing_type: s.ironing.enabled ? 'topmost' : 'no ironing',
    ironing_flow: pctS(s.ironing.flow),
    ironing_speed: S(s.ironing.speed),
    spiral_mode: s.vase ? '1' : '0',
    enable_arc_fitting: '0',
  };
}

export function orcaFilament(p, name) {
  const s = p.settings, M = MATERIALS[p.material];
  const t = s.temps, f = s.fan, r = s.retract;
  return {
    type: 'filament', from: 'User', name, inherits: '',
    version: '1.9.0.0', is_custom_defined: '0',
    compatible_printers: [`Elegoo Neptune 3 Pro ${p.nozzle} nozzle`],
    filament_type: [p.material === 'TPU' ? 'TPU' : p.material],
    filament_diameter: ['1.75'],
    filament_density: [S(M.density)],
    filament_flow_ratio: [S(s.flowRatio)],
    filament_max_volumetric_speed: [S(s.flowMax)],
    nozzle_temperature: [S(t.nozzle)],
    nozzle_temperature_initial_layer: [S(t.nozzle0)],
    textured_plate_temp: [S(t.bed)],
    textured_plate_temp_initial_layer: [S(t.bed0)],
    hot_plate_temp: [S(t.bed)],
    hot_plate_temp_initial_layer: [S(t.bed0)],
    fan_min_speed: [S(f.min)],
    fan_max_speed: [S(f.max)],
    close_fan_the_first_x_layers: [S(f.offLayers)],
    full_fan_speed_layer: [S(f.fullFrom)],
    overhang_fan_speed: [S(f.overhang)],
    overhang_fan_threshold: ['50%'],
    slow_down_for_layer_cooling: ['1'],
    slow_down_layer_time: [S(f.minLayerTime)],
    filament_retraction_length: [S(r.length)],
    filament_retraction_speed: [S(r.speed)],
    filament_deretraction_speed: [S(r.speed)],
    filament_z_hop: [S(r.zHop)],
    filament_wipe: [r.wipe ? '1' : '0'],
    enable_pressure_advance: [s.pa.enabled ? '1' : '0'],
    pressure_advance: [S(s.pa.k || 0.04)],
  };
}

export function prusaIni(p) {
  const s = p.settings, sp = s.speeds, sup = s.support, ad = s.adhesion, t = s.temps, f = s.fan, r = s.retract;
  const lines = {
    layer_height: s.layerHeight,
    first_layer_height: s.firstLayerHeight,
    nozzle_diameter: p.nozzle,
    extrusion_width: s.lineWidth,
    first_layer_extrusion_width: s.firstLineWidth,
    perimeters: s.walls,
    top_solid_layers: s.topLayers,
    bottom_solid_layers: s.bottomLayers,
    fill_density: pctS(s.infill),
    fill_pattern: s.pattern === 'lightning' ? 'lightning' : s.pattern,
    perimeter_generator: s.arachne ? 'arachne' : 'classic',
    thin_walls: s.thinWalls ? 1 : 0,
    external_perimeter_speed: sp.outer,
    perimeter_speed: sp.inner,
    infill_speed: sp.infill,
    solid_infill_speed: sp.solid,
    top_solid_infill_speed: sp.top,
    bridge_speed: sp.bridge,
    first_layer_speed: sp.first,
    travel_speed: sp.travel,
    support_material_speed: sp.support,
    default_acceleration: s.accel.def,
    perimeter_acceleration: s.accel.outer,
    first_layer_acceleration: s.accel.first,
    travel_acceleration: s.accel.travel,
    temperature: t.nozzle,
    first_layer_temperature: t.nozzle0,
    bed_temperature: t.bed,
    first_layer_bed_temperature: t.bed0,
    min_fan_speed: f.min,
    max_fan_speed: f.max,
    bridge_fan_speed: f.bridge,
    disable_fan_first_layers: f.offLayers,
    full_fan_speed_layer: f.fullFrom,
    slowdown_below_layer_time: f.minLayerTime,
    retract_length: r.length,
    retract_speed: r.speed,
    retract_lift: r.zHop,
    wipe: r.wipe ? 1 : 0,
    filament_max_volumetric_speed: s.flowMax,
    extrusion_multiplier: s.flowRatio,
    support_material: sup.enabled ? 1 : 0,
    support_material_auto: 1,
    support_material_style: sup.type === 'tree' ? 'organic' : 'snug',
    support_material_threshold: 90 - sup.alpha,
    support_material_buildplate_only: sup.buildPlateOnly ? 1 : 0,
    support_material_contact_distance: sup.topZ,
    support_material_bottom_contact_distance: sup.bottomZ,
    support_material_xy_spacing: sup.xy,
    support_material_spacing: 2.5,
    support_material_interface_layers: sup.interfaceLayers,
    dont_support_bridges: sup.noBridgeSupport ? 1 : 0,
    brim_width: ad.type === 'brim' ? ad.brimWidth : 0,
    skirts: ad.type === 'skirt' ? ad.skirtLoops : 0,
    skirt_distance: ad.skirtDistance,
    raft_layers: ad.raftLayers,
    elefant_foot_compensation: s.elephantFoot,
    seam_position: s.seam === 'back' ? 'rear' : 'aligned',
    ironing: s.ironing.enabled ? 1 : 0,
    ironing_type: 'top',
    ironing_flowrate: pctS(s.ironing.flow),
    ironing_speed: s.ironing.speed,
    spiral_vase: s.vase ? 1 : 0,
    bed_shape: '0x0,225x0,225x225,0x225',
    max_print_height: 280,
    start_filament_gcode: s.pa.enabled ? `"M900 K${s.pa.k}"` : '""',
  };
  const header = `# Perfil generado para Elegoo Neptune 3 Pro — ${p.material}, boquilla ${p.nozzle}\n# Cárgalo con Archivo → Importar → Importar configuración\n`;
  const gcode = 'start_gcode = ' + startGcode().replace(/\n/g, '\\n');
  return header + Object.entries(lines).map(([k, v]) => `${k} = ${v}`).join('\n') + '\n' + gcode + '\n';
}

export function curaList(p) {
  const s = p.settings, sp = s.speeds, sup = s.support, ad = s.adhesion, t = s.temps, f = s.fan, r = s.retract;
  const rows = [
    ['layer_height', s.layerHeight], ['layer_height_0', s.firstLayerHeight], ['line_width', s.lineWidth],
    ['wall_line_count', s.walls], ['top_layers', s.topLayers], ['bottom_layers', s.bottomLayers],
    ['infill_sparse_density', s.infill], ['infill_pattern', s.pattern === 'lightning' ? 'lightning' : s.pattern],
    ['speed_wall_0', sp.outer], ['speed_wall_x', sp.inner], ['speed_infill', sp.infill], ['speed_topbottom', sp.top],
    ['speed_layer_0', sp.first], ['speed_travel', sp.travel], ['speed_support', sp.support], ['bridge_wall_speed', sp.bridge],
    ['acceleration_enabled', 'true'], ['acceleration_print', s.accel.def], ['acceleration_wall_0', s.accel.outer],
    ['jerk_enabled', 'true'], ['jerk_print', s.accel.jerk],
    ['material_print_temperature', t.nozzle], ['material_print_temperature_layer_0', t.nozzle0],
    ['material_bed_temperature', t.bed], ['material_bed_temperature_layer_0', t.bed0],
    ['cool_fan_speed', f.max], ['cool_fan_speed_min', f.min], ['cool_fan_full_layer', f.fullFrom], ['cool_min_layer_time', f.minLayerTime], ['bridge_fan_speed', f.bridge],
    ['retraction_amount', r.length], ['retraction_speed', r.speed], ['retraction_hop_enabled', r.zHop > 0 ? 'true' : 'false'],
    ['material_flow', Math.round(s.flowRatio * 100)],
    ['support_enable', sup.enabled ? 'true' : 'false'], ['support_structure', sup.type === 'tree' ? 'tree' : 'normal'],
    ['support_angle', sup.alpha], ['support_type', sup.buildPlateOnly ? 'buildplate' : 'everywhere'],
    ['support_top_distance', sup.topZ], ['support_bottom_distance', sup.bottomZ], ['support_xy_distance', sup.xy],
    ['support_infill_rate', sup.density], ['support_interface_enable', 'true'],
    ['adhesion_type', ad.type === 'raft' ? 'raft' : ad.type], ['brim_width', ad.brimWidth], ['skirt_line_count', ad.skirtLoops],
    ['xy_offset_layer_0', -s.elephantFoot], ['hole_xy_offset', s.holeComp],
    ['z_seam_type', s.seam === 'back' ? 'back' : 'sharpest_corner'],
    ['ironing_enabled', s.ironing.enabled ? 'true' : 'false'], ['magic_spiralize', s.vase ? 'true' : 'false'],
  ];
  return '; Cura: introduce estos valores a mano (los .curaprofile dependen de la versión de Cura).\n'
    + '; OJO: el perfil elegoo_neptune_3pro de Cura fuerza retracción 1 mm @25 y cama = material+10 °C; sobreescríbelos.\n'
    + rows.map(([k, v]) => `${k} = ${v}`).join('\n') + '\n';
}

// STL binario a partir de posiciones (9 floats por triángulo).
export function stlBinary(pos, name = 'pieza') {
  const F = pos.length / 9;
  const buf = new ArrayBuffer(84 + F * 50);
  const dv = new DataView(buf);
  const head = `Neptune3Pro orientado: ${name}`.slice(0, 79);
  for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i) & 0x7f);
  dv.setUint32(80, F, true);
  let o = 84;
  for (let f = 0; f < F; f++) {
    const b = f * 9;
    const ux = pos[b + 3] - pos[b], uy = pos[b + 4] - pos[b + 1], uz = pos[b + 5] - pos[b + 2];
    const vx = pos[b + 6] - pos[b], vy = pos[b + 7] - pos[b + 1], vz = pos[b + 8] - pos[b + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true); o += 12;
    for (let k = 0; k < 9; k++) { dv.setFloat32(o, pos[b + k], true); o += 4; }
    dv.setUint16(o, 0, true); o += 2;
  }
  return buf;
}
