(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const PALETTE = ['#e8694e', '#f2b13b', '#3f9a9c', '#94bb86', '#f2a7a0'];

  /* ---------- Nav: fondo al hacer scroll, se esconde al bajar ---------- */
  const nav = document.querySelector('[data-nav]');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > 400 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- Tarjetas: "Saber más" ---------- */
  document.querySelectorAll('.card__toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      const open = card.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('span').textContent = open ? 'Ver menos' : 'Saber más';
    });
  });

  /* ---------- Trazos de acuarela en el fondo ----------
     Tocar, deslizar el dedo, hacer clic o arrastrar el ratón pinta trazos de acuarela.
     Cada toque nuevo cambia de color y cada trazo se desvanece solo al cabo de unos segundos.
     Nunca pinta sobre textos, fotos, animaciones, botones ni el formulario.
     Cada trazo vive en su propio lienzo pegado a la página: al hacer scroll se mueve con
     ella sin redibujarse, así todo va fluido. */
  const layer = document.createElement('div');
  layer.className = 'paint-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  {
    const COLORS = ['#e8694e', '#f2b13b', '#2f9a9c', '#7fb06f', '#ee8f88', '#4f86cf'];
    const NO_PAINT = 'h1, h2, h3, p, li, label, blockquote, figcaption, img, .card, .polaroid, .hero__art, .band, .btn, .form, .easel, input, textarea, button';
    const BOXES = '.card, .polaroid, .hero__art, .band, .form, .easel, blockquote';
    const TEXT = new Set(['H1', 'H2', 'H3', 'P', 'LI', 'LABEL', 'FIGCAPTION']);
    const FIXED_UI = '.nav, .mbar';
    const HOLD = 2000, MAX_STROKES = 14;
    const DPR = Math.min(devicePixelRatio || 1, 1.5);
    const range = document.createRange();
    let lastColor = -1, stroke = null, holeCache = { t: -1e9, list: [] };

    // Zonas protegidas en coordenadas de la página (no cambian al hacer scroll)
    const holes = () => {
      const now = performance.now();
      if (now - holeCache.t < 250) return holeCache.list;
      const m = innerWidth < 600 ? 10 : 14, top = scrollY - innerHeight, bottom = scrollY + innerHeight * 2, out = [];
      const push = (r) => {
        const y = r.top + scrollY;
        if (!r.width || y + r.height < top || y > bottom) return;
        out.push({ x: r.left - m, y: y - m, w: r.width + m * 2, h: r.height + m * 2 });
      };
      document.querySelectorAll(NO_PAINT).forEach((el) => {
        if (el.parentElement && el.parentElement.closest(BOXES)) return;
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom + scrollY < top || r.top + scrollY > bottom) return;
        if (TEXT.has(el.tagName)) {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.textContent.trim()) continue;
            range.selectNodeContents(n);
            for (const lr of range.getClientRects()) push(lr);
          }
        } else push(r);
      });
      holeCache = { t: now, list: out };
      return out;
    };
    const blocked = (target, x, y) => {
      if (target && target.closest && target.closest(FIXED_UI + ', a, button, input, textarea, label, select')) return true;
      const Y = y + scrollY;
      return holes().some((r) => x >= r.x && x <= r.x + r.w && Y >= r.y && Y <= r.y + r.h);
    };

    // Pinceladas de acuarela pre-pintadas (bordes más oscuros, centro claro y grano de papel)
    const sprites = new Map();
    const sprite = (hex, v) => {
      const key = hex + v;
      if (sprites.has(key)) return sprites.get(key);
      const S = 96, c = document.createElement('canvas'); c.width = c.height = S;
      const g = c.getContext('2d');
      const n = parseInt(hex.slice(1), 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255;
      const col = (a) => `rgba(${R}, ${G}, ${B}, ${a})`;
      const rad = S * .42, pts = 20, path = new Path2D();
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2, k = .8 + Math.random() * .22;
        const x = S / 2 + Math.cos(a) * rad * k, y = S / 2 + Math.sin(a) * rad * k;
        i ? path.lineTo(x, y) : path.moveTo(x, y);
      }
      const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, rad);
      grad.addColorStop(0, col(.065)); grad.addColorStop(.6, col(.085)); grad.addColorStop(.88, col(.13)); grad.addColorStop(1, col(0));
      g.filter = 'blur(2px)';
      g.fillStyle = grad; g.fill(path);
      g.filter = 'none';
      const img = g.getImageData(0, 0, S, S), d = img.data;
      for (let i = 3; i < d.length; i += 4) d[i] *= .7 + Math.random() * .55;
      g.putImageData(img, 0, 0);
      sprites.set(key, c);
      return c;
    };
    const pickColor = () => {
      let i; do { i = Math.floor(Math.random() * COLORS.length); } while (i === lastColor);
      lastColor = i; return COLORS[i];
    };

    // Lienzo para un tramo del trazo, del alto de la pantalla y en coordenadas de la página
    const newSheet = (Y) => {
      const cv = document.createElement('canvas');
      const top = Math.max(0, Math.round(Y - innerHeight * .75)), h = Math.round(innerHeight * 1.5), w = document.documentElement.clientWidth;
      cv.width = w * DPR; cv.height = h * DPR;
      cv.style.top = top + 'px'; cv.style.width = w + 'px'; cv.style.height = h + 'px';
      const ctx = cv.getContext('2d'); ctx.setTransform(DPR, 0, 0, DPR, 0, -top * DPR);
      layer.appendChild(cv);
      // Máscara suave de las zonas protegidas (a 1/4 de resolución y difuminada):
      // la pintura se desvanece al acercarse a textos y fotos en vez de cortarse en seco
      const MS = .25, mask = document.createElement('canvas');
      mask.width = Math.ceil(w * MS); mask.height = Math.ceil(h * MS);
      const mc = mask.getContext('2d');
      mc.filter = 'blur(2px)'; mc.fillStyle = '#000';
      mc.beginPath();
      for (const r of holes()) {
        if (r.y + r.h < top || r.y > top + h) continue;
        const x = (r.x - 4) * MS, y = (r.y - top - 4) * MS, rw = (r.w + 8) * MS, rh = (r.h + 8) * MS;
        if (mc.roundRect) mc.roundRect(x, y, rw, rh, 4); else mc.rect(x, y, rw, rh);
      }
      mc.fill();
      return { cv, ctx, top, bottom: top + h, mask, MS };
    };
    const stamp = (x, Y, size) => {
      let sh = stroke.sheet;
      if (Y < sh.top + size || Y > sh.bottom - size) { sh = stroke.sheet = newSheet(Y); stroke.sheets.push(sh); }
      const { ctx } = sh, img = sprite(stroke.color, Math.floor(Math.random() * 4));
      ctx.save();
      ctx.translate(x, Y); ctx.rotate(Math.random() * Math.PI * 2);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
      // borrar (con borde suave) lo que caiga sobre zonas protegidas
      const { mask, MS, top } = sh, half = size / 2 + 2;
      const sx = Math.max(0, (x - half) * MS), sy = Math.max(0, (Y - half - top) * MS);
      const sw = Math.min(mask.width - sx, size * MS + 1), sh2 = Math.min(mask.height - sy, size * MS + 1);
      if (sw > 0 && sh2 > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(mask, sx, sy, sw, sh2, sx / MS, sy / MS + top, sw / MS, sh2 / MS);
        ctx.restore();
      }
    };

    const press = (target, x, y) => {
      if (blocked(target, x, y)) return;
      const Y = y + scrollY, sheet = newSheet(Y);
      stroke = { color: pickColor(), sheet, sheets: [sheet], last: { x, Y, t: performance.now() }, size: 46 };
      // un toque suelto deja una flor de acuarela
      for (let i = 0; i < 14; i++) stamp(x + (Math.random() - .5) * 22, Y + (Math.random() - .5) * 22, 46 + Math.random() * 34);
    };
    const move = (x, y) => {
      if (!stroke) return;
      const Y = y + scrollY, t = performance.now(), L = stroke.last;
      const d = Math.hypot(x - L.x, Y - L.Y);
      const spacing = Math.max(2.5, stroke.size * .07);
      if (d < spacing) return;
      const speed = d / Math.max(8, t - L.t);
      const target = Math.max(26, Math.min(64, 64 - speed * 18)) * (innerWidth < 600 ? .8 : 1);
      const steps = Math.ceil(d / spacing);
      for (let i = 1; i <= steps; i++) {
        const k = i / steps, sx = L.x + (x - L.x) * k, sY = L.Y + (Y - L.Y) * k;
        stroke.size += (target - stroke.size) * .15;
        if (blocked(null, sx, sY - scrollY)) continue;
        stamp(sx + (Math.random() - .5) * 2, sY + (Math.random() - .5) * 2, stroke.size * (.9 + Math.random() * .2));
      }
      stroke.last = { x, Y, t };
    };
    const release = () => {
      if (!stroke) return;
      const sheets = stroke.sheets;
      stroke = null;
      setTimeout(() => {
        sheets.forEach((s) => { s.cv.style.opacity = '0'; });
        setTimeout(() => sheets.forEach((s) => s.cv.remove()), 1700);
      }, HOLD);
      while (layer.children.length > MAX_STROKES * 2) layer.firstChild.remove();
    };

    // Ratón
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      press(e.target, e.clientX, e.clientY);
      if (stroke) e.preventDefault();
    });
    document.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' && stroke) move(e.clientX, e.clientY); }, { passive: true });
    ['pointerup', 'pointercancel'].forEach((ev) => document.addEventListener(ev, (e) => { if (e.pointerType !== 'touch') release(); }));

    // Dedo: tocar o deslizar pinta sin bloquear el scroll
    document.addEventListener('touchstart', (e) => {
      release();
      if (e.touches.length !== 1) return;
      const t = e.touches[0]; press(e.target, t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: true });
    ['touchend', 'touchcancel'].forEach((ev) => document.addEventListener(ev, release, { passive: true }));
  }

  /* ---------- Lienzo "Pinta aquí" ---------- */
  const easel = document.querySelector('[data-easel]');
  if (easel) {
    const ctx = easel.getContext('2d');
    const box = easel.parentElement;
    const ghost = document.querySelector('[data-easel-ghost]');
    let color = '#e8694e', brush = 16, drawing = false, last = null, cw = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = box.clientWidth, h = box.clientHeight;
      if (w === cw) return;
      const snap = cw ? easel.toDataURL() : null;
      cw = w;
      easel.width = w * dpr; easel.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, w, h);
      if (snap) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, w, h); im.src = snap; }
    };
    size(); addEventListener('resize', size);

    const pos = (e) => { const r = easel.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || .5 }; };
    const dab = (a, b) => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color; ctx.globalAlpha = 1;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = brush * (.7 + b.p * .6);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      // salpicaduras pequeñas, como pintura de verdad
      if (Math.random() < .08 && brush > 10) {
        ctx.globalAlpha = .6; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(b.x + (Math.random() - .5) * brush * 3, b.y + (Math.random() - .5) * brush * 3, Math.random() * brush * .25 + 1, 0, Math.PI * 2); ctx.fill();
      }
    };
    easel.addEventListener('pointerdown', (e) => {
      drawing = true; last = pos(e); easel.setPointerCapture(e.pointerId);
      dab(last, { ...last, x: last.x + .1 });
      ghost.classList.add('is-gone');
    });
    easel.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pos(e); dab(last, p); last = p; });
    ['pointerup', 'pointercancel'].forEach((ev) => easel.addEventListener(ev, () => { drawing = false; }));

    const radio = (sel, attr, set) => {
      const group = document.querySelectorAll(sel);
      group.forEach((b) => b.addEventListener('click', () => {
        group.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        set(b.dataset[attr]);
      }));
    };
    radio('.swatch', 'color', (v) => { color = v; });
    radio('.size', 'size', (v) => { brush = +v; });

    document.querySelector('[data-clear]').addEventListener('click', () => {
      const w = box.clientWidth, h = box.clientHeight;
      if (hasGsap && !reduce) {
        gsap.fromTo(easel, { scale: 1 }, { scale: .97, duration: .12, yoyo: true, repeat: 1, ease: 'power2.out' });
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(0, 0, w, h);
      ghost.classList.remove('is-gone');
    });
    document.querySelector('[data-save]').addEventListener('click', () => {
      const a = document.createElement('a');
      a.download = 'mi-dibujo-taller-salome.png';
      a.href = easel.toDataURL('image/png');
      a.click();
    });
  }

  /* ---------- Formulario: valida y abre el correo ---------- */
  const form = document.querySelector('[data-form]');
  if (form) {
    const note = form.querySelector('[data-form-note]');
    const checks = [
      ['f-nombre', (v) => v.trim().length > 0],
      ['f-apellido', (v) => v.trim().length > 0],
      ['f-email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())],
      ['f-msg', (v) => v.trim().length > 2],
    ];
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null;
      checks.forEach(([id, ok]) => {
        const input = document.getElementById(id);
        const field = input.closest('.field');
        const bad = !ok(input.value);
        field.classList.toggle('has-err', bad);
        input.setAttribute('aria-invalid', String(bad));
        const err = field.querySelector('.field__err');
        if (err) input.setAttribute('aria-describedby', err.id);
        if (bad && !first) first = input;
      });
      if (first) { first.focus(); return; }
      const d = Object.fromEntries(new FormData(form));
      const body = `Hola Salomé,\n\n${d.mensaje}\n\n${d.nombre} ${d.apellido}\n${d.email}${d.telefono ? '\n' + d.telefono : ''}`;
      location.href = `mailto:creatividad.salome@gmail.com?subject=${encodeURIComponent('Taller de arte · ' + d.nombre + ' ' + d.apellido)}&body=${encodeURIComponent(body)}`;
      note.textContent = 'Se ha abierto tu correo con el mensaje listo. ¡Solo falta darle a enviar!';
      burst(form.querySelector('[data-submit]'));
    });
    form.addEventListener('input', (e) => {
      const f = e.target.closest('.field');
      if (f && f.classList.contains('has-err')) f.classList.remove('has-err');
    });
  }

  function burst(el) {
    if (!hasGsap || reduce) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.style.background = PALETTE[i % PALETTE.length];
      s.style.left = r.left + r.width / 2 + 'px'; s.style.top = r.top + r.height / 2 + 'px';
      document.body.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 160;
      gsap.to(s, {
        x: Math.cos(a) * d, y: Math.sin(a) * d - 60, scale: Math.random() * 1.2 + .4,
        duration: .9 + Math.random() * .4, ease: 'power3.out',
        onComplete: () => gsap.to(s, { y: '+=120', opacity: 0, duration: .6, ease: 'power1.in', onComplete: () => s.remove() }),
      });
    }
  }

  /* ---------- Banda de materiales: siempre de derecha a izquierda, a ritmo fijo ---------- */
  const track = document.querySelector('[data-marquee]');
  if (track) {
    const setSpeed = () => { track.style.setProperty('--marquee-dur', (track.scrollWidth / 2 / 70).toFixed(2) + 's'); };
    setSpeed();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setSpeed);
    addEventListener('resize', setSpeed);
  }

  /* ---------- Animaciones con GSAP ---------- */
  const start = () => {
    if (!window.gsap) return;
    const { gsap } = window;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    // Partimos el título en palabras (manteniendo las marcas de color)
    document.querySelectorAll('[data-words]').forEach((line) => {
      [...line.childNodes].forEach((n) => {
        if (n.nodeType === 3 && n.textContent.trim()) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            const s = document.createElement('span'); s.className = 'word'; s.textContent = t; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.classList.contains('mark')) {
          n.classList.add('word');
        }
      });
    });

    // Scroll suave (solo ratón/trackpad; en el móvil el scroll nativo ya es suave)
    if (!reduce && window.Lenis) {
      const lenis = new Lenis({ lerp: .1, smoothWheel: true });
      if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const el = id.length > 1 && document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: id === '#inicio' ? 0 : -70, duration: 1.2 });
        if (id === '#contenido') el.focus({ preventScroll: true });
      }));
    }

    if (reduce) return;

    // Entrada del hero (una vez, al cargar)
    gsap.set('.hero__title, [data-hero-in], [data-hero-art]', { visibility: 'visible' });
    document.documentElement.classList.remove('js-anim');
    const tl = gsap.timeline({ defaults: { ease: 'back.out(1.7)' } });
    tl.from('.hero__eyebrow', { y: 16, opacity: 0, duration: .5, ease: 'power3.out' })
      .from('.hero__title .word', { yPercent: 110, rotate: () => gsap.utils.random(-12, 12), opacity: 0, duration: .8, stagger: .08 }, '-=.2')
      .from('[data-hero-art] .blob', { scale: .6, rotate: -10, opacity: 0, duration: 1.1, ease: 'elastic.out(1, .65)' }, .15)
      .from('[data-hero-art] .splash', { scale: 0, opacity: 0, duration: .9, stagger: .12, ease: 'back.out(2)' }, .4)
      .from('[data-hero-art] .drop', { scale: 0, y: -40, duration: .7, stagger: .1, ease: 'bounce.out' }, .7)
      .from('.hero__sticker', { scale: 0, rotate: 30, duration: .6 }, .9)
      .to('.scribble path', { strokeDashoffset: 0, duration: .7, stagger: .25, ease: 'power2.inOut' }, '-=.5')
      .to('.sparkles', { opacity: 1, duration: .01 }, '-=.2')
      .from('.sparkles', { scale: 0, rotate: -90, duration: .6, ease: 'back.out(3)' }, '<')
      .from('.hero__lead, .hero__actions, .hero__hint', { y: 20, opacity: 0, duration: .6, stagger: .1, ease: 'power3.out' }, 1);

    // Las gotas flotan; las estrellas titilan
    gsap.to('[data-hero-art] .drop', { y: '+=14', duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: .4, delay: 2 });
    gsap.to('.sparkles path', { scale: .7, transformOrigin: 'center', duration: .9, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: .3, delay: 2.4 });

    // La foto y las bolitas se inclinan siempre hacia donde está el ratón (sin saltos al hacer scroll)
    const art = document.querySelector('[data-hero-art]');
    if (art && finePointer) {
      const parts = [...art.querySelectorAll('.splash, .blob, .drop')].map((el, i) => ({
        x: gsap.quickTo(el, 'x', { duration: .9, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: .9, ease: 'power3.out' }),
        k: el.classList.contains('blob') ? 10 : 18 + i * 3,
      }));
      let mx = null, my = null;
      const aim = () => {
        if (mx === null) return;
        const r = art.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
        const len = Math.hypot(dx, dy) || 1, pull = Math.min(1, len / (r.width * .9));
        parts.forEach((p) => { p.x((dx / len) * pull * p.k); p.y((dy / len) * pull * p.k); });
      };
      addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { mx = e.clientX; my = e.clientY; aim(); } }, { passive: true });
      addEventListener('scroll', aim, { passive: true });
    }

    if (!window.ScrollTrigger) return;

    // Tarjetas: caen como fotos sobre la mesa
    gsap.from('.card', {
      scrollTrigger: { trigger: '[data-cards]', start: 'top 80%', once: true },
      y: 120, rotate: (i) => [-14, 10, -8][i] || 0, opacity: 0, duration: 1, stagger: .14, ease: 'back.out(1.4)',
      clearProps: 'transform,opacity',
    });

    // La frase se pinta palabra a palabra
    const st = document.querySelector('[data-paint-words]');
    if (st) {
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((t) => {
              if (!t) return;
              if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
              const s = document.createElement('span'); s.className = 'pw'; s.textContent = t; frag.appendChild(s);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1) { n.classList.add('pw'); }
        });
      };
      walk(st);
      const words = st.querySelectorAll('.pw');
      gsap.to(words, {
        opacity: 1, stagger: .1, ease: 'none',
        scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: .6 },
      });
      gsap.to('[data-draw]', {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: '.statement', start: 'top 85%', end: 'bottom 30%', scrub: .8 },
      });
    }

    // La polaroid se endereza al entrar
    gsap.from('[data-polaroid]', {
      scrollTrigger: { trigger: '.salome', start: 'top 70%', once: true },
      rotate: -14, y: 60, opacity: 0, duration: 1.1, ease: 'elastic.out(1, .7)', clearProps: 'transform,opacity',
    });
  };

  if (document.readyState === 'complete') start(); else addEventListener('load', start);
})();
