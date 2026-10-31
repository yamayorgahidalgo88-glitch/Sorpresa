import { CUTS, SHAPES, LENGTH_LABEL, hasFade, pictogram, rankCuts } from './cuts.js';
import { analyze, loadLandmarker, IDX } from './face.js';

const MAX_TRIES = 3;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
  shape: null,
  detectedShape: null,
  filter: 'all',
  image: null, // HTMLImageElement con la foto original
  crop: null, // recorte usado en la plancha {sx, sy, sw, sh}
  analysis: null,
  tries: 0,
  activeCut: null,
  busy: false,
  tryonUrl: null,
};

const $ = (id) => document.getElementById(id);

// La imagen generada solo existe cuando hay una prueba hecha
function tryonImg() {
  let img = $('tryon-img');
  if (!img) {
    img = document.createElement('img');
    img.id = 'tryon-img';
    img.alt = '';
    img.hidden = true;
    $('calipers').before(img);
  }
  return img;
}

export function initAdvisor() {
  const plate = $('plate');
  if (!plate) return;

  renderCuts({ animate: false });
  renderShapeChips();

  const consent = $('consent');
  const photo = $('photo');
  const camera = $('camera');
  const drop = $('drop');

  const guard = (e) => {
    if (!consent.checked) {
      e.preventDefault();
      askConsent();
      return false;
    }
    return true;
  };
  drop.addEventListener('click', guard);
  camera.closest('label').addEventListener('click', guard);

  photo.addEventListener('change', () => photo.files[0] && handleFile(photo.files[0]));
  camera.addEventListener('change', () => camera.files[0] && handleFile(camera.files[0]));

  ['dragenter', 'dragover'].forEach((t) =>
    drop.addEventListener(t, (e) => {
      e.preventDefault();
      drop.classList.add('is-over');
    })
  );
  ['dragleave', 'drop'].forEach((t) =>
    drop.addEventListener(t, (e) => {
      e.preventDefault();
      drop.classList.remove('is-over');
    })
  );
  drop.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!consent.checked) return askConsent();
    handleFile(file);
  });

  consent.addEventListener('change', () => {
    consent.closest('.consent').classList.remove('is-missing');
    if (consent.checked) {
      setMsg('');
      // precargamos el modelo en cuanto hay permiso, para que el análisis sea inmediato
      loadLandmarker().catch(() => {});
    }
  });

  document.querySelectorAll('.filter').forEach((btn) =>
    btn.addEventListener('click', () => setFilter(btn.dataset.filter))
  );

  $('reset').addEventListener('click', resetPhoto);
  $('compare-range').addEventListener('input', (e) => setCompare(e.target.value));

  $('cuts').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-try]');
    if (btn) tryOn(btn.dataset.try);
  });
}

function askConsent() {
  const box = $('consent').closest('.consent');
  box.classList.remove('is-missing');
  void box.offsetWidth;
  box.classList.add('is-missing');
  setMsg('Marca la casilla para poder analizar tu foto.', true);
  $('consent').focus();
}

function setMsg(text, isError = false) {
  const el = $('plate-msg');
  el.textContent = text;
  el.classList.toggle('is-error', isError);
}

// ---------- Foto y análisis ----------

async function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    setMsg('Ese archivo no es una imagen. Prueba con una foto JPG o PNG.', true);
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    setMsg('La foto pesa demasiado (más de 15 MB). Prueba con otra.', true);
    return;
  }
  setMsg('Preparando la plancha…');
  const plate = $('plate');

  let img;
  try {
    img = await loadImage(file);
  } catch {
    setMsg('No hemos podido abrir esa foto. Prueba con otra.', true);
    return;
  }

  try {
    setMsg('Midiendo tu cara…');
    const result = await analyze(img);
    if (result.error === 'no-face') {
      setMsg('No encontramos una cara. Usa una foto de frente, con buena luz y sin gorra.', true);
      return;
    }
    if (result.error === 'many-faces') {
      setMsg('Hay más de una cara en la foto. Sube una en la que salgas tú solo.', true);
      return;
    }
    state.image = img;
    state.analysis = result;
    state.detectedShape = result.shape;
    state.tries = 0;
    clearTryon();
    setMsg('');
    plate.dataset.state = 'printed';
    $('print').hidden = false;
    printPhoto(img, result.points);
    renderReadings(result);
    setShape(result.shape, { detected: true });
    $('print').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
  } catch (err) {
    console.error(err);
    setMsg('No hemos podido cargar el analizador. Revisa tu conexión y vuelve a intentarlo.', true);
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // normalizamos a un tamaño razonable (y respetamos la orientación EXIF que aplica el navegador)
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const out = new Image();
      out.onload = () => resolve(out);
      out.onerror = reject;
      out.src = c.toDataURL('image/jpeg', 0.92);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    img.src = url;
  });
}

// Recorte 4:5 centrado en la cara, con aire para el pelo
function faceCrop(img, pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const fw = maxX - minX, fh = maxY - minY;
  let sh = fh * 2.1;
  let sw = sh * 0.8;
  const cx = (minX + maxX) / 2;
  const cy = minY + fh * 0.36;
  const W = img.naturalWidth, H = img.naturalHeight;
  if (sw > W) { sw = W; sh = sw / 0.8; }
  if (sh > H) { sh = H; sw = sh * 0.8; }
  let sx = Math.max(0, Math.min(W - sw, cx - sw / 2));
  let sy = Math.max(0, Math.min(H - sh, cy - sh / 2));
  return { sx, sy, sw, sh, fw };
}

// Semitono: la foto se serigrafía en tinta negra sobre la cartulina
function printPhoto(img, pts) {
  const canvas = $('halftone');
  const stage = $('stage');
  const crop = faceCrop(img, pts);
  state.crop = crop;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(stage.clientWidth * dpr);
  const H = Math.round(W * 1.25);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // La foto en duotono negro y oro: la cara se ve real, con el tono de la casa
  const css = getComputedStyle(document.documentElement);
  const gold = css.getPropertyValue('--gold-hi').trim() || '#f0cf86';
  const bg = css.getPropertyValue('--bg').trim() || '#0b0a08';
  const base = document.createElement('canvas');
  base.width = W;
  base.height = H;
  const bctx = base.getContext('2d');
  bctx.filter = 'grayscale(1) contrast(1.12) brightness(1.04)';
  bctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, W, H);
  bctx.filter = 'none';
  bctx.globalCompositeOperation = 'multiply';
  bctx.fillStyle = gold;
  bctx.fillRect(0, 0, W, H);

  // Barrido de escaneo: la foto aparece de arriba abajo bajo una línea de luz
  const paint = (p) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const y = Math.round(H * p);
    if (y > 0) ctx.drawImage(base, 0, 0, W, y, 0, 0, W, y);
    if (p < 1) {
      const g = ctx.createLinearGradient(0, y - 60, 0, y + 2);
      g.addColorStop(0, 'rgba(240, 207, 134, 0)');
      g.addColorStop(1, 'rgba(240, 207, 134, 0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 60, W, 62);
      ctx.fillStyle = gold;
      ctx.fillRect(0, y, W, Math.max(2, W / 300));
    }
  };

  if (reduceMotion.matches) {
    paint(1);
  } else {
    const start = performance.now();
    const dur = 900;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      paint(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  drawCalipers(pts, crop);
}

function drawCalipers(pts, crop) {
  const svg = $('calipers');
  const VW = 400, VH = 500;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const map = (p) => ({ x: ((p.x - crop.sx) / crop.sw) * VW, y: ((p.y - crop.sy) / crop.sh) * VH });
  const P = (i) => map(pts[i]);

  const L = [];
  const tick = 9;
  const hLine = (a, b, label, y, side = 'above') => {
    const yy = y ?? (a.y + b.y) / 2;
    L.push(`<g class="cal"><line x1="${a.x}" y1="${yy}" x2="${b.x}" y2="${yy}"/>
      <line x1="${a.x}" y1="${yy - tick}" x2="${a.x}" y2="${yy + tick}"/>
      <line x1="${b.x}" y1="${yy - tick}" x2="${b.x}" y2="${yy + tick}"/>
      ${labelBox((a.x + b.x) / 2, side === 'above' ? yy - 20 : yy + 20, label)}</g>`);
  };
  const top = P(IDX.top), chin = P(IDX.chin);
  const vx = Math.max(P(IDX.cheekR).x, P(IDX.jawR).x) + 26;

  hLine(P(IDX.browL), P(IDX.browR), 'Frente', null, 'above');
  hLine(P(IDX.cheekL), P(IDX.cheekR), 'Pómulos', null, 'above');
  hLine(P(IDX.jawL), P(IDX.jawR), 'Mandíbula', null, 'below');
  const topY = top.y - (chin.y - top.y) * 0.12;
  L.push(`<g class="cal"><line x1="${vx}" y1="${topY}" x2="${vx}" y2="${chin.y}"/>
    <line x1="${vx - tick}" y1="${topY}" x2="${vx + tick}" y2="${topY}"/>
    <line x1="${vx - tick}" y1="${chin.y}" x2="${vx + tick}" y2="${chin.y}"/>
    ${labelBox(Math.min(VW - 34, vx + 2), (topY + chin.y) / 2, 'Largo', true)}</g>`);

  svg.innerHTML = L.join('');

  if (!reduceMotion.matches) {
    svg.querySelectorAll('.cal').forEach((g, gi) => {
      g.querySelectorAll('line').forEach((ln) => {
        const len = Math.hypot(ln.x2.baseVal.value - ln.x1.baseVal.value, ln.y2.baseVal.value - ln.y1.baseVal.value);
        ln.animate(
          [{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
          { duration: 420, delay: 650 + gi * 140, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }
        );
      });
      const lab = g.querySelector('.cal-label');
      lab?.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], {
        duration: 260, delay: 900 + gi * 140, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards',
      });
    });
  }
}

function labelBox(x, y, text, vertical = false) {
  const w = text.length * 8.4 + 14;
  const h = 20;
  const t = vertical ? `rotate(-90 ${x} ${y})` : '';
  return `<g class="cal-label" transform="${t}"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}"/><text x="${x}" y="${y + 4.5}" text-anchor="middle">${text}</text></g>`;
}

function renderReadings(r) {
  const fmt = (n) => n.toFixed(2).replace('.', ',');
  const rows = [
    ['Largo / ancho', fmt(r.ratios.length), r.ratios.length > 1.5 ? 'más larga que ancha' : r.ratios.length < 1.3 ? 'casi tan ancha como larga' : 'equilibrada'],
    ['Mandíbula / pómulos', fmt(r.ratios.jaw), r.ratios.jaw > 0.86 ? 'mandíbula ancha' : r.ratios.jaw < 0.74 ? 'barbilla estrecha' : 'mandíbula media'],
    ['Frente / pómulos', fmt(r.ratios.forehead), r.ratios.forehead > 0.86 ? 'frente ancha' : r.ratios.forehead < 0.75 ? 'frente estrecha' : 'frente media'],
    ['Simetría', `${r.symmetry}%`, 'no cambia la recomendación'],
  ];
  $('readings').innerHTML = rows
    .map(([k, v, s]) => `<div><dt>${k}</dt><dd>${v}<small>${s}</small></dd></div>`)
    .join('');
}

function renderShapeChips() {
  $('shape-chips').innerHTML = Object.entries(SHAPES)
    .map(([k, s]) => `<button type="button" class="chip" data-shape="${k}" aria-pressed="false">${s.name}</button>`)
    .join('');
  $('shape-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-shape]');
    if (b) setShape(b.dataset.shape, { detected: false });
  });
}

function setShape(shape, { detected }) {
  state.shape = shape;
  state.shapeOverridden = !detected && shape !== state.detectedShape;
  $('shape-name').textContent = SHAPES[shape].name;
  const rule = $('shape-rule');
  rule.textContent = SHAPES[shape].rule;

  const old = document.querySelector('.shape__note');
  old?.remove();
  const a = state.analysis;
  const notes = [];
  if (detected && a) {
    const conf = a.scores[shape];
    if (conf < 0.4) notes.push('Tu cara está entre dos formas: si no te convence, elige otra abajo.');
    if (a.turned) notes.push('Tienes la cara algo girada; con una foto más de frente mediremos mejor.');
    else if (a.tilted) notes.push('Tienes la cabeza algo inclinada; con una foto recta mediremos mejor.');
  }
  if (!detected && state.detectedShape && shape !== state.detectedShape) {
    notes.push(`Has elegido ${SHAPES[shape].name.toLowerCase()}; por la foto salía ${SHAPES[state.detectedShape].name.toLowerCase()}.`);
  }
  if (notes.length) {
    const p = document.createElement('p');
    p.className = 'shape__note';
    p.textContent = notes.join(' ');
    rule.after(p);
  }

  document.querySelectorAll('#shape-chips .chip').forEach((c) => {
    const on = c.dataset.shape === shape;
    c.classList.toggle('is-on', on);
    c.setAttribute('aria-pressed', String(on));
  });
  $('lineup-title').innerHTML = `Tu cartel · <span>cara ${SHAPES[shape].name.toLowerCase()}</span>`;
  renderCuts({ animate: true });
}

// ---------- El cartel de cortes ----------

function matchesFilter(cut) {
  switch (state.filter) {
    case 'fade': return hasFade(cut);
    case 'nofade': return !hasFade(cut);
    case 'corto': case 'medio': case 'largo': return cut.length === state.filter;
    default: return true;
  }
}

function setFilter(f) {
  state.filter = f;
  document.querySelectorAll('.filter').forEach((b) => {
    const on = b.dataset.filter === f;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  renderCuts({ animate: true });
}

function stars(score) {
  let s = '';
  for (let i = 0; i < 3; i++) {
    s += `<svg class="${i < score ? '' : 'off'}" aria-hidden="true"><use href="#i-star"/></svg>`;
  }
  return s;
}

const FIT_TEXT = ['No te favorece', 'Puede funcionar', 'Te queda bien', 'Muy recomendado'];

function cutWhy(cut, score, tier) {
  if (!state.shape) return cut.why;
  const shapeName = SHAPES[state.shape].name.toLowerCase();
  const a = state.analysis;
  let seam = '';
  if (a && !state.shapeOverridden) {
    if (state.shape === 'redonda' && (cut.top === 'quiff' || cut.top === 'pomp' || cut.fade === 'high'))
      seam = ` Tu cara mide ${a.ratios.length.toFixed(2).replace('.', ',')} de largo por cada 1 de ancho: la altura la estira.`;
    if (state.shape === 'alargada' && (cut.top === 'fringe' || cut.top === 'messy' || cut.top === 'long'))
      seam = ` Con ${a.ratios.length.toFixed(2).replace('.', ',')} de largo por 1 de ancho, el flequillo acorta la cara.`;
    if (state.shape === 'cuadrada' && tier >= 3)
      seam = ` Tu mandíbula es el ${Math.round(a.ratios.jaw * 100)}% del ancho de pómulos: este corte la luce.`;
    if (state.shape === 'corazon' && tier >= 3)
      seam = ` Tu frente es más ancha que tu mandíbula: este corte lo equilibra.`;
  }
  if (score === 0) return `${cut.why} Con cara ${shapeName}, mejor otro: ${FIT_TEXT[0].toLowerCase()}.`;
  return `${cut.why}${seam}`;
}

function renderCuts({ animate }) {
  const list = $('cuts');
  const items = state.shape
    ? rankCuts(state.shape)
    : CUTS.map((c, i) => ({ cut: c, score: null, tier: null, order: i }));
  list.classList.toggle('is-idle', !state.shape);

  // FLIP: medimos dónde estaban antes de reordenar
  const before = new Map();
  if (animate && !reduceMotion.matches) {
    list.querySelectorAll('.cut:not([hidden])').forEach((el) => before.set(el.dataset.id, el.getBoundingClientRect()));
  }

  const existing = new Map([...list.children].map((el) => [el.dataset.id, el]));
  let visibleRank = 0;
  const frag = document.createDocumentFragment();

  for (const { cut, score, tier } of items) {
    let el = existing.get(cut.id);
    if (!el) {
      el = document.createElement('li');
      el.className = 'cut';
      el.dataset.id = cut.id;
    }
    const visible = matchesFilter(cut);
    el.hidden = !visible;
    if (visible) visibleRank++;
    const rank = visible && state.shape ? visibleRank : '';
    const isTop = state.shape && visible && visibleRank === 1 && tier >= 2;

    el.classList.toggle('is-top', Boolean(isTop));
    el.classList.toggle('is-low', score === 0);
    el.classList.toggle('is-minor', tier !== null && tier <= 1);
    el.classList.toggle('is-tail', visible && visibleRank > 3);
    el.innerHTML = `
      <div class="cut__rank" aria-hidden="true"><span class="outline-num">${rank}</span></div>
      ${pictogram(cut, { title: false })}
      <div class="cut__body">
        <h3 class="cut__name">${cut.name}<span class="cut__detail">${cut.detail}</span></h3>
        <p class="cut__why">${cutWhy(cut, score, tier)}</p>
        <div class="cut__meta">
          <span class="tag">${hasFade(cut) ? 'Con degradado' : 'Sin degradado'}</span>
          <span class="tag">${LENGTH_LABEL[cut.length]}</span>
          ${tier !== null ? `<span class="fit" role="img" aria-label="${FIT_TEXT[tier]}">${stars(tier)}<span class="fit__label" aria-hidden="true">${FIT_TEXT[tier]}</span></span>` : ''}
          <button type="button" class="btn btn--line btn--small cut__try cut__try--inline" data-try="${cut.id}" ${state.busy ? 'disabled' : ''}>Pruébatelo <svg aria-hidden="true"><use href="#i-arrow"/></svg></button>
        </div>
      </div>
      <button type="button" class="btn btn--line btn--small cut__try cut__try--col" data-try="${cut.id}" ${state.busy ? 'disabled' : ''}>
        Pruébatelo <svg aria-hidden="true"><use href="#i-arrow"/></svg>
      </button>`;
    el.classList.toggle('is-active', state.activeCut === cut.id);
    frag.appendChild(el);
  }
  list.appendChild(frag);
  $('cuts-empty').hidden = visibleRank > 0;

  if (before.size) {
    list.querySelectorAll('.cut:not([hidden])').forEach((el, i) => {
      const prev = before.get(el.dataset.id);
      const now = el.getBoundingClientRect();
      if (prev) {
        const dy = prev.top - now.top;
        if (Math.abs(dy) < 1) return;
        el.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
          { duration: 520, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        );
      } else {
        el.animate(
          [{ opacity: 0, transform: 'translateY(-10px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'none' }],
          { duration: 360, delay: Math.min(i, 6) * 30, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }
        );
      }
    });
    // el número 1 cae con peso
    const top = list.querySelector('.cut.is-top');
    if (top) {
      top.animate(
        [{ boxShadow: '0 0 0 0 var(--ink)' }, { boxShadow: '0 0 0 6px var(--ink)' }, { boxShadow: '0 0 0 0 var(--ink)' }],
        { duration: 600, delay: 380, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    }
  }
}

// ---------- Prueba con IA ----------

async function tryOn(cutId) {
  const cut = CUTS.find((c) => c.id === cutId);
  if (!cut) return;
  if (!state.image) {
    $('asesor').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    setMsg(`Primero sube tu foto para probarte el ${cut.name.toLowerCase()}.`, true);
    if (!$('consent').checked) $('consent').focus();
    else $('photo').focus();
    return;
  }
  if (state.busy) return;
  if (state.tries >= MAX_TRIES) {
    showPrintCaption(`Has usado tus ${MAX_TRIES} pruebas de esta visita. Enséñale tu favorito a Ayoub al reservar.`, true);
    return;
  }

  state.activeCut = cutId;
  state.busy = true;
  renderCuts({ animate: false });
  const plate = $('plate');
  plate.dataset.state = 'working';
  showPrintCaption(`Imprimiendo tu ${cut.name.toLowerCase()}…`);
  $('print').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'nearest' });

  try {
    const image = cropForApi();
    const res = await fetch('/api/try-on', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cutId, image }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* sin cuerpo */ }

    if (!res.ok) {
      const msg = {
        not_configured: 'La prueba con IA todavía no está activada en esta web. Mientras tanto, enséñale este corte a Ayoub al reservar.',
        rate_limited: 'Demasiadas pruebas seguidas. Espera un minuto y vuelve a intentarlo.',
        content_filtered: 'El servicio de IA no ha aceptado esta foto. Prueba con otra más sencilla, de frente.',
        too_large: 'La foto es demasiado grande para la prueba. Prueba con otra.',
      }[data.error] || 'No ha salido bien la impresión. Vuelve a intentarlo en un momento.';
      throw Object.assign(new Error(msg), { userMessage: msg });
    }

    state.tries++;
    state.tryonUrl = data.image;
    await showTryon(data.image);
    const left = MAX_TRIES - state.tries;
    showPrintCaption(`${cut.name}: arrastra para comparar. ${left > 0 ? `Te quedan ${left} prueba${left === 1 ? '' : 's'}.` : 'Era tu última prueba de esta visita.'}`);
  } catch (err) {
    showPrintCaption(err.userMessage || 'Sin conexión con el servicio de IA. Vuelve a intentarlo en un momento.', true);
  } finally {
    state.busy = false;
    plate.dataset.state = 'printed';
    renderCuts({ animate: false });
  }
}

function cropForApi() {
  const { sx, sy, sw, sh } = state.crop;
  const c = document.createElement('canvas');
  const scale = Math.min(1, 1024 / sh);
  c.width = Math.round(sw * scale);
  c.height = Math.round(sh * scale);
  c.getContext('2d').drawImage(state.image, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.88);
}

function showTryon(src) {
  return new Promise((resolve) => {
    const img = tryonImg();
    img.onload = () => {
      img.hidden = false;
      img.alt = 'Tu foto con el corte elegido, generada con IA';
      $('compare').hidden = false;
      $('plate').classList.add('has-tryon');
      $('calipers').style.opacity = '0';
      // la imagen original en color va debajo: pintamos el recorte en el lienzo
      paintOriginal();
      setCompare(50);
      if (!reduceMotion.matches) {
        img.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 50%)' }], {
          duration: 700, easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
        });
      }
      resolve();
    };
    img.src = src;
  });
}

function paintOriginal() {
  const canvas = $('halftone');
  const ctx = canvas.getContext('2d');
  const { sx, sy, sw, sh } = state.crop;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(state.image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
}

function setCompare(v) {
  const img = tryonImg();
  img.style.clipPath = `inset(0 0 0 ${v}%)`;
  $('compare-range').value = v;
}

function clearTryon() {
  $('plate').classList.remove('has-tryon');
  $('tryon-img')?.remove();
  $('compare').hidden = true;
  $('calipers').style.opacity = '';
  state.tryonUrl = null;
  state.activeCut = null;
  showPrintCaption('Tu foto, analizada');
}

function showPrintCaption(text, isError = false) {
  const cap = $('print-cap');
  cap.textContent = text;
  cap.classList.toggle('is-error', isError);
}

function resetPhoto() {
  clearTryon();
  state.image = null;
  state.analysis = null;
  state.crop = null;
  state.shape = null;
  state.detectedShape = null;
  const canvas = $('halftone');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = canvas.height = 0;
  $('calipers').innerHTML = '';
  $('readings').innerHTML = '';
  $('photo').value = '';
  $('camera').value = '';
  document.querySelector('.shape__note')?.remove();
  $('print').hidden = true;
  $('plate').dataset.state = 'idle';
  $('lineup-title').innerHTML = 'Los cortes · <span>sin ordenar</span>';
  document.querySelectorAll('#shape-chips .chip').forEach((c) => {
    c.classList.remove('is-on');
    c.setAttribute('aria-pressed', 'false');
  });
  setMsg('Foto borrada.');
  renderCuts({ animate: true });
}
