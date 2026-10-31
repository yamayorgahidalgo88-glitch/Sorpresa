// Visor 360°: el mismo modelo fotografiado (generado con IA) con cada corte en
// varios ángulos. Se gira arrastrando, con inercia, y fundiendo un ángulo con
// el siguiente para que el giro no salte.

const BASE = 'assets/img/cortes';

export async function loadManifest() {
  try {
    const res = await fetch(`${BASE}/manifest.json`, { cache: 'no-cache' });
    if (!res.ok) return null;
    const m = await res.json();
    return m && Array.isArray(m.cuts) && m.cuts.length ? m : null;
  } catch {
    return null;
  }
}

export const frameUrl = (id, a) => `${BASE}/${id}/${a}.webp`;
export const thumbUrl = (id) => `${BASE}/${id}/thumb.webp`;

export function createTurntable(root, manifest, { reduceMotion = false } = {}) {
  const angles = manifest.angles || 8;
  const stage = root.querySelector('.viewer__stage');
  const a = document.createElement('img');
  const b = document.createElement('img');
  for (const img of [a, b]) {
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    stage.appendChild(img);
  }
  let front = a, back = b;
  let cut = null;
  let pos = 0; // posición continua en «ángulos»
  let shown = -1;
  let vel = 0;
  let dragging = false;
  let lastX = 0, lastT = 0;
  let auto = !reduceMotion;
  let raf = 0;
  const cache = new Map();

  function preload(id) {
    for (let i = 0; i < angles; i++) {
      const url = frameUrl(id, i);
      if (cache.has(url)) continue;
      const im = new Image();
      im.decoding = 'async';
      im.src = url;
      cache.set(url, im);
    }
  }

  function show(index, { fade = true } = {}) {
    const i = ((index % angles) + angles) % angles;
    if (i === shown && cut === front.dataset.cut) return;
    shown = i;
    const url = frameUrl(cut, i);
    back.src = url;
    back.dataset.cut = cut;
    const swap = () => {
      back.classList.add('is-front');
      front.classList.remove('is-front');
      if (!fade) back.style.transition = 'none';
      [front, back] = [back, front];
      requestAnimationFrame(() => { front.style.transition = ''; });
    };
    if (back.complete && back.naturalWidth) swap();
    else back.onload = swap;
  }

  function setCut(id) {
    if (!manifest.cuts.includes(id)) return false;
    cut = id;
    preload(id);
    root.classList.add('is-ready');
    shown = -1;
    show(Math.round(pos));
    return true;
  }

  // Arrastre con inercia
  const onDown = (e) => {
    dragging = true;
    auto = false;
    vel = 0;
    lastX = e.clientX;
    lastT = performance.now();
    stage.setPointerCapture?.(e.pointerId);
    root.classList.add('is-dragging');
  };
  const onMove = (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const step = stage.clientWidth / (angles * 1.4); // píxeles por ángulo
    pos -= dx / step;
    vel = (-dx / step) / Math.max(1, now - lastT) * 16;
    lastX = e.clientX;
    lastT = now;
    show(Math.round(pos));
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    loop();
  };
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);

  // Teclado: flechas para girar
  stage.tabIndex = 0;
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      auto = false;
      pos += e.key === 'ArrowRight' ? 1 : -1;
      show(Math.round(pos));
    }
  });

  let lastAuto = performance.now();
  function loop() {
    cancelAnimationFrame(raf);
    const tick = (now) => {
      if (!dragging && Math.abs(vel) > 0.01) {
        pos += vel;
        vel *= 0.92;
        show(Math.round(pos));
      } else if (auto && now - lastAuto > 900) {
        lastAuto = now;
        pos += 1;
        show(Math.round(pos));
      }
      if (dragging || Math.abs(vel) > 0.01 || auto) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && auto) loop();
    else cancelAnimationFrame(raf);
  }).observe(root);

  return { setCut };
}
