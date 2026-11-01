// Carrusel infinito de trabajos: avanza solo, despacio, y se puede arrastrar o
// deslizar con el dedo. Al soltar conserva la inercia y vuelve poco a poco a su
// velocidad de crucero. Las fotos se duplican para que el bucle no tenga fin.

export function initReel({ reduce = false } = {}) {
  const reel = document.getElementById('reel');
  const track = document.getElementById('reel-track');
  if (!reel || !track) return;

  // Duplicamos la serie para el bucle (las copias no se anuncian a lectores de pantalla)
  const originals = [...track.children];
  for (const li of originals) {
    const c = li.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelector('img')?.setAttribute('alt', '');
    track.appendChild(c);
  }

  const CRUISE = reduce ? 0 : -38; // px por segundo, hacia la izquierda
  let x = 0;
  let v = CRUISE;
  let setWidth = 0;
  let dragging = false;
  let hover = false;
  let lastX = 0, lastT = 0, dragV = 0, moved = 0;
  let raf = 0, last = performance.now();
  let visible = true;

  const measure = () => {
    // ancho de una serie: posición de la primera copia
    const first = track.children[originals.length];
    setWidth = first ? first.offsetLeft - track.children[0].offsetLeft : track.scrollWidth / 2;
  };
  measure();
  window.addEventListener('resize', measure);
  track.querySelectorAll('img').forEach((img) => img.addEventListener('load', measure, { once: true }));

  const wrap = () => {
    if (!setWidth) return;
    if (x <= -setWidth) x += setWidth;
    if (x > 0) x -= setWidth;
  };
  const paint = () => {
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!dragging) {
      const target = hover ? CRUISE * 0.25 : CRUISE;
      // la inercia se apaga suave hacia la velocidad de crucero
      v += (target - v) * Math.min(1, dt * 2.2);
      x += v * dt;
      wrap();
      paint();
    }
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!raf && visible) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  // Arrastre con el ratón o el dedo
  reel.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastT = performance.now();
    dragV = 0;
    reel.setPointerCapture?.(e.pointerId);
    reel.classList.add('is-dragging');
  });
  reel.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    moved += Math.abs(dx);
    x += dx;
    wrap();
    paint();
    const dt = Math.max(1, now - lastT) / 1000;
    dragV = dragV * 0.6 + (dx / dt) * 0.4;
    lastX = e.clientX;
    lastT = now;
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    reel.classList.remove('is-dragging');
    // velocidad del gesto: un golpe rápido basta para lanzar las fotos
    v = Math.max(-2600, Math.min(2600, dragV));
  };
  reel.addEventListener('pointerup', end);
  reel.addEventListener('pointercancel', end);
  // que un arrastre no se convierta en clic sobre una foto
  reel.addEventListener('click', (e) => { if (moved > 6) e.preventDefault(); }, true);

  reel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hover = true; });
  reel.addEventListener('pointerleave', () => { hover = false; });

  // Botones: saltan una foto
  document.querySelectorAll('[data-reel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = track.children[0];
      const step = item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 300;
      v = Number(btn.dataset.reel) > 0 ? -step * 3.2 : step * 3.2;
    });
  });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? start() : stop();
  }).observe(reel);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}
