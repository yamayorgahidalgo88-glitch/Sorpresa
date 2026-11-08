import { prepareMesh, findOrientations, analyze } from './analyzer.js';
import { computeProfile } from './rules.js';
import { PRINTER, MATERIALS, NOZZLES, TROUBLESHOOT, startGcode } from './knowledge.js';
import { explainWarning, explainConfidence } from './explain.js';
import { orcaProcess, orcaFilament, prusaIni, curaList, stlBinary } from './exporters.js';

const $ = id => document.getElementById(id);
const VOLUME = { size: PRINTER.buildVolume, margin: PRINTER.marginMm };
const fmt = (n, d = 2) => (typeof n === 'number' && isFinite(n) ? String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ',') : String(n));

// ------------------------------------------------------------------ almacenamiento local
const store = {
  get(k, def) { try { const v = localStorage.getItem('n3p:' + k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set(k, v) { try { localStorage.setItem('n3p:' + k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
};

const state = {
  mode: 'file', raw: null, fileName: 'soporte-L-ejemplo', mesh: null, orientations: [], orientIdx: 0,
  metrics: null, profile: null, photos: [], exTab: 'orca-process', viewer: null,
  calib: store.get('calib', { firmware: 'marlin', temps: {}, retract: {} }),
};

// ------------------------------------------------------------------ visor (carga diferida)
import('./viewer.js').then(m => {
  state.viewer = m.createViewer($('viewer'));
  $('viewer-msg').remove();
  redrawViewer();
}).catch(() => { $('viewer-msg').textContent = 'No se pudo cargar el visor 3D (sin conexión a la CDN). El análisis funciona igualmente.'; });

function redrawViewer() {
  if (!state.viewer) return;
  if (state.mode === 'file' && state.metrics) state.viewer.show(state.metrics.pos, state.metrics.faceClass, state.metrics.dims);
  else if (state.mode === 'photo') state.viewer.showBox(photoDims());
}

// ------------------------------------------------------------------ modelo de ejemplo
function voxelMesh(nx, ny, nz, inside) {
  const out = [];
  const I = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < nx && y < ny && z < nz && inside(x, y, z);
  const q = (a, b, c, d) => out.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) for (let z = 0; z < nz; z++) {
    if (!I(x, y, z)) continue;
    const X = x, Y = y, Z = z, S = 1;
    if (!I(x, y, z - 1)) q([X, Y, Z], [X, Y + S, Z], [X + S, Y + S, Z], [X + S, Y, Z]);
    if (!I(x, y, z + 1)) q([X, Y, Z + S], [X + S, Y, Z + S], [X + S, Y + S, Z + S], [X, Y + S, Z + S]);
    if (!I(x - 1, y, z)) q([X, Y, Z], [X, Y, Z + S], [X, Y + S, Z + S], [X, Y + S, Z]);
    if (!I(x + 1, y, z)) q([X + S, Y, Z], [X + S, Y + S, Z], [X + S, Y + S, Z + S], [X + S, Y, Z + S]);
    if (!I(x, y - 1, z)) q([X, Y, Z], [X + S, Y, Z], [X + S, Y, Z + S], [X, Y, Z + S]);
    if (!I(x, y + 1, z)) q([X, Y + S, Z], [X, Y + S, Z + S], [X + S, Y + S, Z + S], [X + S, Y + S, Z]);
  }
  return new Float32Array(out);
}
function sampleModel() {
  // Soporte en L: base 60×30×5, pared 60×6×45 y una ménsula de 16 mm a 32 mm de altura.
  return voxelMesh(60, 30, 45, (x, y, z) => z < 5 || y < 6 || (z >= 32 && z < 36 && y < 22 && x >= 10 && x < 50));
}

// ------------------------------------------------------------------ carga de archivos
async function loadFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const buf = await file.arrayBuffer();
  let geoms = [];
  if (ext === 'stl') {
    const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
    geoms = [new STLLoader().parse(buf)];
  } else if (ext === 'obj') {
    const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
    const obj = new OBJLoader().parse(new TextDecoder().decode(buf));
    geoms = collect(obj);
  } else if (ext === '3mf') {
    const { ThreeMFLoader } = await import('three/addons/loaders/3MFLoader.js');
    const obj = new ThreeMFLoader().parse(buf);
    geoms = collect(obj);
  } else throw new Error('Formato no soportado. Usa STL, 3MF u OBJ.');
  let total = 0;
  const parts = geoms.map(g => { const ng = g.index ? g.toNonIndexed() : g; const p = ng.attributes.position.array; total += p.length; return p; });
  const pos = new Float32Array(total);
  let o = 0; for (const p of parts) { pos.set(p, o); o += p.length; }
  if (!pos.length) throw new Error('El archivo no contiene triángulos.');
  return pos;
}
function collect(root) {
  const out = [];
  root.updateMatrixWorld(true);
  root.traverse(ch => { if (ch.isMesh) { const g = ch.geometry.clone(); g.applyMatrix4(ch.matrixWorld); out.push(g); } });
  return out;
}

// ------------------------------------------------------------------ análisis
const inputs = () => ({
  material: $('material').value, nozzle: Number($('nozzle').value), use: $('use').value, quality: $('quality').value,
});

function scaled(raw) {
  const s = Number($('scale').value) / 100;
  if (!(s > 0) || s === 1) return raw;
  const out = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw[i] * s;
  return out;
}

function busy(on) { $('busy').hidden = !on; }
const tick = () => new Promise(r => setTimeout(r, 30));

async function prepare() {
  busy(true); await tick();
  try {
    state.mesh = prepareMesh(scaled(state.raw));
    await orient();
  } catch (e) { showError(e); }
  busy(false);
}

async function orient() {
  const { material } = inputs();
  state.orientations = findOrientations(state.mesh, MATERIALS[material].supportAlpha, VOLUME);
  const sel = $('orient'); sel.innerHTML = '';
  const best = state.orientations[0];
  const list = state.orientations.slice(0, 4);
  const orig = state.orientations.find(o => o.original);
  if (orig && !list.includes(orig)) list.push(orig);
  // Si la original es prácticamente igual de buena, se recomienda respetar la del diseñador.
  state.list = list;
  list.forEach((o, i) => {
    const label = (i === 0 ? 'Recomendada' : o.original ? 'Original del archivo' : `Alternativa ${i}`)
      + (o.original && i === 0 ? ' (la del archivo)' : '')
      + ` · voladizo ${fmt(100 * o.overArea / state.mesh.totalArea, 1)} % · alto ${fmt(o.dims[2], 0)} mm`
      + (o.rotated45 ? ' · girada 45°' : '');
    sel.add(new Option(label, String(i)));
  });
  state.orientIdx = 0; sel.value = '0';
  void best;
  await runAnalysis();
}

async function runAnalysis() {
  busy(true); await tick();
  try {
    const { material, nozzle } = inputs();
    const o = state.list[state.orientIdx];
    state.metrics = analyze(state.mesh, o.R, { alphaDeg: MATERIALS[material].supportAlpha, lineWidth: NOZZLES[nozzle].lw, volume: VOLUME });
    recompute();
    redrawViewer();
  } catch (e) { showError(e); }
  busy(false);
}

function recompute() {
  const calib = currentCalib();
  const base = inputs();
  if (state.mode === 'file' && state.metrics) {
    state.profile = computeProfile({ ...base, metrics: state.metrics, calib });
  } else if (state.mode === 'photo') {
    state.profile = computeProfile({ ...base, photo: photoInfo(), calib });
  }
  render();
}

function showError(e) {
  console.error(e);
  $('alerts').innerHTML = `<div class="alert">No se pudo analizar el archivo: ${escapeHtml(e.message || String(e))}</div>`;
}
const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------------------------------------------ fotos
function photoDims() { return ['ph-x', 'ph-y', 'ph-z'].map(id => Math.max(1, Number($(id).value) || 1)); }
function photoInfo() {
  return { dims: photoDims(), kind: $('ph-kind').value, overhangs: $('ph-over').value, flatBase: $('ph-flat').checked, thin: $('ph-thin').checked };
}
function addPhotos(files) {
  for (const f of files) {
    if (state.photos.length >= 5) break;
    if (!f.type.startsWith('image/')) continue;
    const r = new FileReader();
    r.onload = () => { state.photos.push({ name: f.name, url: r.result }); drawThumbs(); };
    r.readAsDataURL(f);
  }
}
function drawThumbs() {
  $('thumbs').innerHTML = state.photos.map((p, i) => `<div class="thumb"><img src="${p.url}" alt="Foto ${i + 1}"><button type="button" data-i="${i}" aria-label="Quitar foto ${i + 1}">×</button></div>`).join('');
}
$('thumbs').addEventListener('click', e => {
  const b = e.target.closest('button[data-i]'); if (!b) return;
  state.photos.splice(Number(b.dataset.i), 1); drawThumbs();
});

async function shrink(url, max = 1024) {
  const img = new Image(); img.src = url; await img.decode();
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85).split(',')[1];
}

async function aiAnalyze() {
  const key = $('api-key').value.trim();
  if (!key) { $('ai-status').textContent = 'Introduce tu clave de la API.'; return; }
  if (!state.photos.length) { $('ai-status').textContent = 'Añade al menos una foto.'; return; }
  store.set('apikey', key);
  $('ai-status').textContent = 'Analizando fotos…'; $('ai-run').disabled = true;
  try {
    const images = await Promise.all(state.photos.map(p => shrink(p.url)));
    const content = images.map(data => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } }));
    content.push({ type: 'text', text:
      'Estas fotos muestran una pieza que se va a imprimir en 3D (FDM) en una Elegoo Neptune 3 Pro. ' +
      `Medidas indicadas por el usuario: ${photoDims().join(' x ')} mm (X x Y x Z). ` +
      'Responde SOLO con un JSON con estas claves: ' +
      '"kind" (uno de: figura, miniatura, mecanica, caja, placa, organica), ' +
      '"overhangs" (none, few, many), "flatBase" (true/false: tiene una cara plana grande para apoyar), ' +
      '"thin" (true/false: partes de menos de 1 mm), "use" (decorativo, funcional, mecanica, roscas), ' +
      '"orientation" (frase corta en español: qué cara apoyar en la cama), "notes" (máx. 2 frases en español).' });
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 600, messages: [{ role: 'user', content }] }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || res.statusText);
    const text = data.content.map(c => c.text || '').join('');
    const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    if (j.kind) $('ph-kind').value = j.kind;
    if (j.overhangs) $('ph-over').value = j.overhangs;
    if (typeof j.flatBase === 'boolean') $('ph-flat').checked = j.flatBase;
    if (typeof j.thin === 'boolean') $('ph-thin').checked = j.thin;
    if (j.use && [...$('use').options].some(o => o.value === j.use)) $('use').value = j.use;
    $('ai-status').textContent = `Claude: ${j.orientation || ''} ${j.notes || ''}`.trim();
    recompute(); redrawViewer();
  } catch (e) {
    $('ai-status').textContent = 'No se pudo analizar: ' + (e.message || e) + '. Rellena los campos a mano.';
  }
  $('ai-run').disabled = false;
}

// ------------------------------------------------------------------ "Mi impresora"
function currentCalib() {
  const c = state.calib, m = $('material').value;
  return {
    firmware: c.firmware || 'marlin',
    flowMax: Number(c.flowMax) || 0, k: Number(c.k) || 0, flowRatio: Number(c.flowRatio) || 0,
    temps: c.temps || {}, retract: c.retract || {}, material: m,
  };
}
function loadCalibForm() {
  const c = state.calib, m = $('material').value;
  $('c-fw').value = c.firmware || 'marlin';
  $('c-flow').value = c.flowMax || '';
  $('c-k').value = c.k || '';
  $('c-ratio').value = c.flowRatio || '';
  $('c-temp').value = (c.temps || {})[m] || '';
  $('c-retract').value = (c.retract || {})[m] || '';
}
function saveCalibForm() {
  const c = state.calib, m = $('material').value;
  c.firmware = $('c-fw').value;
  c.flowMax = $('c-flow').value; c.k = $('c-k').value; c.flowRatio = $('c-ratio').value;
  c.temps = c.temps || {}; c.retract = c.retract || {};
  c.temps[m] = $('c-temp').value; c.retract[m] = $('c-retract').value;
  store.set('calib', c);
}

// ------------------------------------------------------------------ render
function render() {
  const p = state.profile; if (!p) return;
  const s = p.settings, m = state.mode === 'file' ? state.metrics : null;
  const dims = m ? m.dims : photoDims();

  const stats = [
    ['Confianza', `<button type="button" class="pill ${p.confidence}" id="conf-btn">${p.confidence} · ${p.confScore}/100</button>`, p.warnings.some(w => w.penalty) ? 'pulsa para ver qué la baja' : (m ? 'sin problemas detectados' : 'desde fotos')],
    ['Tamaño', `${fmt(dims[0], 1)} × ${fmt(dims[1], 1)} × ${fmt(dims[2], 1)}`, 'mm (X × Y × Z)'],
    ['Soporte', s.support.enabled ? (s.support.type === 'tree' ? 'Árbol' : 'Normal') : 'No', s.support.enabled ? (s.support.buildPlateOnly ? 'solo desde la cama' : 'en todas partes') : m ? `${fmt(m.overhangPct, 1)} % en voladizo` : ''],
    ['Adhesión', s.adhesion.type === 'brim' ? `Borde ${s.adhesion.brimWidth} mm` : s.adhesion.type === 'raft' ? 'Balsa' : 'Falda', m ? `apoyo ${fmt(m.contactCm2, 1)} cm²` : ''],
  ];
  if (p.estimates) {
    const e = p.estimates;
    stats.push(['Tiempo aprox.', e.minutes >= 60 ? `${Math.floor(e.minutes / 60)} h ${e.minutes % 60} min` : `${e.minutes} min`, '± 30 %, confirma en el laminador']);
    stats.push(['Filamento', `${fmt(e.grams, 0)} g`, `${fmt(e.meters, 1)} m · ${e.layers} capas`]);
  }
  $('summary').innerHTML = stats.map(([k, v, d]) => `<div class="stat"><span class="k">${k}</span><span class="v">${v}</span><span class="d">${d}</span></div>`).join('');

  $('alerts').innerHTML = p.warnings.map((w, i) => `<button type="button" class="alert${w.penalty >= 20 ? '' : ' warn'}" data-w="${i}">`
    + `<span>${escapeHtml(w.text)}</span><span class="more">${w.penalty ? `−${w.penalty} confianza · ` : ''}Ver explicación</span></button>`).join('');

  const sp = s.speeds, a = s.accel, t = s.temps, f = s.fan, r = s.retract, su = s.support, ad = s.adhesion;
  const yes = b => (b ? 'Sí' : 'No');
  const groups = [
    ['Capas y líneas', [
      ['Altura de capa', `${fmt(s.layerHeight)} mm`], ['Primera capa', `${fmt(s.firstLayerHeight)} mm`],
      ['Ancho de línea', `${fmt(s.lineWidth)} mm`], ['Ancho 1.ª capa', `${fmt(s.firstLineWidth)} mm`],
      ['Generador de paredes', s.arachne ? 'Arachne' : 'Clásico'], ['Detectar paredes finas', yes(s.thinWalls)],
    ]],
    ['Paredes y relleno', [
      ['Paredes', s.walls], ['Capas superiores', s.topLayers], ['Capas inferiores', s.bottomLayers],
      ['Relleno', `${s.infill} %`], ['Patrón', s.pattern], ['Modo jarrón', yes(s.vase)],
    ]],
    ['Velocidades (mm/s)', [
      ['Perímetro exterior', sp.outer], ['Perímetros interiores', sp.inner], ['Relleno', sp.infill],
      ['Relleno sólido', sp.solid], ['Superior', sp.top], ['Puentes', sp.bridge],
      ['Primera capa', sp.first], ['Soportes', sp.support], ['Desplazamiento', sp.travel],
    ]],
    ['Aceleración', [
      ['General', `${a.def} mm/s²`], ['Perímetro exterior', `${a.outer} mm/s²`], ['Desplazamiento', `${a.travel} mm/s²`],
      ['Primera capa', `${a.first} mm/s²`], ['Jerk XY', `${a.jerk} mm/s`],
    ]],
    ['Temperaturas', [
      ['Boquilla', `${t.nozzle} °C`], ['Boquilla 1.ª capa', `${t.nozzle0} °C`], ['Cama PEI', `${t.bed} °C`], ['Cama 1.ª capa', `${t.bed0} °C`],
    ]],
    ['Ventilador', [
      ['Velocidad', f.min === f.max ? `${f.max} %` : `${f.min}–${f.max} %`], ['Apagado en', f.offLayers === 1 ? 'capa 1' : `capas 1–${f.offLayers}`],
      ['Velocidad completa desde', `capa ${f.fullFrom}`], ['Puentes y voladizos', `${f.bridge} %`], ['Tiempo mínimo de capa', `${f.minLayerTime} s`],
    ]],
    ['Retracción y caudal', [
      ['Retracción', `${fmt(r.length)} mm`], ['Velocidad retracción', `${r.speed} mm/s`], ['Z-hop', `${fmt(r.zHop)} mm`], ['Wipe', yes(r.wipe)],
      ['Caudal volumétrico máx.', `${fmt(s.flowMax, 1)} mm³/s`], ['Flow ratio', fmt(s.flowRatio)], ['Pressure Advance', s.pa.enabled ? `K ${s.pa.k}` : 'sin calibrar'],
    ]],
    ['Soportes', su.enabled ? [
      ['Activado', 'Sí'], ['Tipo', su.type === 'tree' ? 'Árbol (orgánico)' : 'Normal (snug)'],
      ['Umbral Orca/Elegoo/Prusa', `${90 - su.alpha}°`], ['Umbral Cura (support_angle)', `${su.alpha}°`],
      ['Solo desde la cama', yes(su.buildPlateOnly)], ['Distancia Z superior', `${fmt(su.topZ)} mm`], ['Distancia Z inferior', `${fmt(su.bottomZ)} mm`],
      ['Distancia XY', `${fmt(su.xy)} mm`], ['Densidad', `${su.density} %`], ['Capas de interfaz', su.interfaceLayers], ['No soportar puentes', yes(su.noBridgeSupport)],
    ] : [['Activado', 'No'], ['Umbral si lo activas', `${90 - su.alpha}° Orca · ${su.alpha}° Cura`]]],
    ['Adhesión y precisión', [
      ['Tipo', ad.type === 'brim' ? 'Borde (brim)' : ad.type === 'raft' ? 'Balsa (raft)' : 'Falda (skirt)'],
      ...(ad.type === 'brim' ? [['Ancho del borde', `${ad.brimWidth} mm`]] : []),
      ...(ad.type === 'skirt' ? [['Falda', `${ad.skirtLoops} líneas a ${ad.skirtDistance} mm`]] : []),
      ...(ad.type === 'raft' ? [['Capas de balsa', ad.raftLayers]] : []),
      ['Pie de elefante', `${fmt(s.elephantFoot)} mm`], ['Compensación agujeros', `${fmt(s.holeComp)} mm`],
      ['Costura', s.seam === 'back' ? 'Trasera' : 'Alineada'], ['Planchado', s.ironing.enabled ? `Sí · ${s.ironing.flow} % · ${s.ironing.speed} mm/s` : 'No'],
    ]],
  ];
  $('table').innerHTML = `<div class="groups">${groups.map(([h, rows]) => `<div class="group"><h3>${h}</h3><table>${rows.map(([k, v]) => `<tr><td>${k}</td><td class="val">${v}</td></tr>`).join('')}</table></div>`).join('')}</div>`;
  $('reasons').innerHTML = p.reasons.map(x => `<li>${escapeHtml(x.text)}</li>`).join('');
  $('advice-box').innerHTML = p.advice.length ? `<details open><summary>Consejos para esta pieza</summary><ul>${p.advice.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></details>` : '';
  renderExport();
}

function exportText() {
  const p = state.profile; if (!p) return { text: '', file: '' };
  const base = `N3Pro ${p.material} ${p.nozzle} ${state.mode === 'file' ? state.fileName : 'fotos'}`.replace(/\s+/g, ' ').slice(0, 60);
  switch (state.exTab) {
    case 'orca-process': return { text: JSON.stringify(orcaProcess(p, base), null, 2), file: `${slug(base)}-proceso.json` };
    case 'orca-filament': return { text: JSON.stringify(orcaFilament(p, `${p.material} N3Pro ${slug(state.fileName)}`), null, 2), file: `${slug(base)}-filamento.json` };
    case 'prusa': return { text: prusaIni(p), file: `${slug(base)}.ini` };
    case 'cura': return { text: curaList(p), file: `${slug(base)}-cura.txt` };
    default: return { text: startGcode(), file: 'neptune3pro-start.gcode' };
  }
}
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
function renderExport() {
  $('ex-code').textContent = exportText().text;
  document.querySelectorAll('.ex-tab').forEach(b => b.classList.toggle('active', b.dataset.ex === state.exTab));
}
function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

// ------------------------------------------------------------------ eventos
function setMode(mode) {
  state.mode = mode;
  $('tab-file').classList.toggle('active', mode === 'file'); $('tab-file').setAttribute('aria-selected', mode === 'file');
  $('tab-photo').classList.toggle('active', mode === 'photo'); $('tab-photo').setAttribute('aria-selected', mode === 'photo');
  $('pane-file').hidden = mode !== 'file'; $('pane-photo').hidden = mode !== 'photo';
  $('orient-box').hidden = mode !== 'file';
  recompute(); redrawViewer();
}
$('tab-file').onclick = () => setMode('file');
$('tab-photo').onclick = () => setMode('photo');

async function handleModelFile(file) {
  if (!file) return;
  $('file-name').textContent = `Cargando ${file.name}…`;
  try {
    state.raw = await loadFile(file);
    state.fileName = file.name.replace(/\.[^.]+$/, '');
    $('file-name').innerHTML = `Archivo: <b>${escapeHtml(file.name)}</b> · ${(state.raw.length / 9).toLocaleString('es-ES')} triángulos`;
    await prepare();
  } catch (e) { $('file-name').textContent = 'Error: ' + (e.message || e); }
}
$('file-input').onchange = e => handleModelFile(e.target.files[0]);
$('photo-input').onchange = e => { addPhotos(e.target.files); e.target.value = ''; };
for (const [id, fn] of [['drop-file', fs => handleModelFile(fs[0])], ['drop-photo', fs => addPhotos(fs)]]) {
  const el = $(id);
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('over'); fn([...e.dataTransfer.files]); });
}
$('scale').onchange = () => state.raw && prepare();
$('material').onchange = () => { loadCalibForm(); state.mode === 'file' && state.mesh ? orient() : recompute(); };
$('nozzle').onchange = () => (state.mode === 'file' && state.mesh ? runAnalysis() : recompute());
$('use').onchange = recompute;
$('quality').onchange = recompute;
$('orient').onchange = e => { state.orientIdx = Number(e.target.value); runAnalysis(); };
for (const id of ['c-fw', 'c-flow', 'c-k', 'c-ratio', 'c-temp', 'c-retract']) $(id).addEventListener('change', () => { saveCalibForm(); recompute(); });
for (const id of ['ph-x', 'ph-y', 'ph-z', 'ph-kind', 'ph-over', 'ph-flat', 'ph-thin']) $(id).addEventListener('change', () => { if (state.mode === 'photo') { recompute(); redrawViewer(); } });
$('photo-run').onclick = () => { recompute(); redrawViewer(); $('results').scrollIntoView({ behavior: 'smooth' }); };
$('ai-run').onclick = aiAnalyze;
$('api-key').value = store.get('apikey', '');
document.querySelector('.ex-tabs').addEventListener('click', e => {
  const b = e.target.closest('.ex-tab'); if (!b) return; state.exTab = b.dataset.ex; renderExport();
});
$('ex-copy').onclick = () => {
  const { text } = exportText();
  navigator.clipboard.writeText(text).then(() => { $('ex-note').textContent = 'Copiado.'; })
    .catch(() => { const r = document.createRange(); r.selectNodeContents($('ex-code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $('ex-note').textContent = 'Seleccionado: pulsa Ctrl+C.'; });
};
$('ex-dl').onclick = () => {
  const { text, file } = exportText();
  download(file, text, 'text/plain');
  $('ex-note').textContent = `Descargando ${file}. Si no se descarga, usa Copiar.`;
};
$('dl-stl').onclick = () => {
  if (!state.metrics) return;
  // STL colocado en el centro de la cama (origen Marlin en la esquina)
  const p = state.metrics.pos, out = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) { out[i] = p[i] + 112.5; out[i + 1] = p[i + 1] + 112.5; out[i + 2] = p[i + 2]; }
  download(`${slug(state.fileName)}-orientado-n3pro.stl`, stlBinary(out, state.fileName), 'model/stl');
};
$('trouble').innerHTML = TROUBLESHOOT.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

// ------------------------------------------------------------------ cuadro de explicación
function openDialog(html) {
  $('dlg-body').innerHTML = html;
  const d = $('dlg');
  if (d.showModal) d.showModal(); else d.setAttribute('open', '');
}
$('dlg-close').onclick = () => $('dlg').close();
$('dlg').addEventListener('click', e => { if (e.target === $('dlg')) $('dlg').close(); });
$('alerts').addEventListener('click', e => {
  const b = e.target.closest('[data-w]'); if (!b || !state.profile) return;
  const w = state.profile.warnings[Number(b.dataset.w)];
  const x = explainWarning(w);
  openDialog(`<h2>${escapeHtml(x.title)}</h2>`
    + (w.penalty ? `<p class="pen">Resta ${w.penalty} puntos de confianza</p>` : '')
    + `<h3>Qué ocurre</h3><p>${escapeHtml(x.what)}</p>`
    + (x.why ? `<h3>Por qué</h3><p>${escapeHtml(x.why)}</p>` : '')
    + (x.risk ? `<h3>Qué pasará si imprimes así</h3><p>${escapeHtml(x.risk)}</p>` : '')
    + (x.fix.length ? `<h3>Cómo solucionarlo</h3><ol>${x.fix.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ol>` : ''));
});
$('summary').addEventListener('click', e => {
  if (!e.target.closest('#conf-btn') || !state.profile) return;
  const c = explainConfidence(state.profile);
  openDialog(`<h2>${escapeHtml(c.title)}</h2><p>${escapeHtml(c.what)}</p>`
    + `<table class="conf"><tr><td>Punto de partida</td><td class="val">${c.base}</td></tr>`
    + c.lines.map(l => `<tr><td>${escapeHtml(l.label)}</td><td class="val neg">−${l.penalty}</td></tr>`).join('')
    + `<tr class="tot"><td>Resultado</td><td class="val">${state.profile.confScore}</td></tr></table>`
    + `<p class="note">${escapeHtml(c.scale)}</p>`
    + (c.lines.length ? '<p class="note">Pulsa cada aviso rojo o naranja para ver cómo corregirlo.</p>' : ''));
});

// ------------------------------------------------------------------ arranque con el ejemplo
loadCalibForm();
state.raw = sampleModel();
prepare();
