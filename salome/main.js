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

  /* ---------- Manchas de témpera en el fondo ----------
     Cada toque (o clic) deja una mancha de témpera; al deslizar el dedo o arrastrar
     el ratón va dejando un reguero de manchas. Cada toque nuevo cambia de color.
     Las manchas se desvanecen solas y nunca caen sobre textos, fotos, animaciones,
     botones ni el formulario. El scroll funciona con normalidad. */
  const bg = document.querySelector('[data-bg-paint]');
  if (bg) {
    const ctx = bg.getContext('2d');
    const HOLD = 2400, LIFE = 3900, POP = 160, STEP = 30;
    const COLORS = ['#e8694e', '#f2b13b', '#3f9a9c', '#94bb86', '#f2a7a0', '#5b8fd1'];
    // Zonas protegidas: textos (línea a línea), fotos, animaciones y controles
    const NO_PAINT = 'h1, h2, h3, p, li, label, blockquote, figcaption, img, .card, .polaroid, .hero__art, .band, .btn, .form, .easel, .nav, .mbar, input, textarea, button';
    const BOXES = '.card, .polaroid, .hero__art, .band, .form, .easel, .nav, .mbar, blockquote';
    const TEXT = new Set(['H1', 'H2', 'H3', 'P', 'LI', 'LABEL', 'FIGCAPTION']);
    const range = document.createRange();
    let splats = [], raf = 0, w = 0, h = 0, lastColor = -1, color = COLORS[0], last = null, active = false;
    let cache = { t: -1e9, list: [] };

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      bg.width = w * dpr; bg.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); addEventListener('resize', size);

    const holes = () => {
      const now = performance.now();
      if (now - cache.t < 80) return cache.list;
      const m = w < 600 ? 10 : 14, out = [];
      const push = (r) => {
        if (!r.width || r.bottom < -m || r.top > h + m) return;
        out.push({ x: r.left - m, y: r.top - m, w: r.width + m * 2, h: r.height + m * 2 });
      };
      document.querySelectorAll(NO_PAINT).forEach((el) => {
        if (el.parentElement && el.parentElement.closest(BOXES)) return; // ya cubierto por su caja
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom < -m || r.top > h + m) return;
        if (TEXT.has(el.tagName)) {
          range.selectNodeContents(el);
          for (const lr of range.getClientRects()) push(lr);
        } else push(r);
      });
      cache = { t: now, list: out };
      return out;
    };
    const blocked = (x, y) => holes().some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);

    const pickColor = () => {
      let i; do { i = Math.floor(Math.random() * COLORS.length); } while (i === lastColor);
      lastColor = i; return COLORS[i];
    };
    const shade = (hex, k) => {
      const n = parseInt(hex.slice(1), 16);
      const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
      return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
    };

    // Una mancha: contorno irregular suavizado + gotitas alrededor
    const makeSplat = (x, y, c, big) => {
      const r = (big ? 22 : 13) + Math.random() * (big ? 16 : 10);
      const n = 12 + Math.floor(Math.random() * 6), pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, k = .72 + Math.random() * .45;
        pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k]);
      }
      const body = new Path2D();
      const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      let s0 = mid(pts[n - 1], pts[0]);
      body.moveTo(s0[0], s0[1]);
      for (let i = 0; i < n; i++) { const q = mid(pts[i], pts[(i + 1) % n]); body.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); }
      body.closePath();
      const drops = new Path2D();
      const nd = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < nd; i++) {
        const a = Math.random() * Math.PI * 2, d = r * (1.15 + Math.random() * .7), dr = 1.5 + Math.random() * r * .16;
        drops.moveTo(Math.cos(a) * d + dr, Math.sin(a) * d);
        drops.arc(Math.cos(a) * d, Math.sin(a) * d, dr, 0, Math.PI * 2);
      }
      splats.push({ x, y: y + scrollY, c, rim: shade(c, .82), hi: shade(c, 1.25), r, body, drops, t: performance.now(), rot: Math.random() * Math.PI });
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const press = (x, y) => {
      color = pickColor(); last = { x, y: y + scrollY }; active = true;
      if (!blocked(x, y)) makeSplat(x, y, color, true);
    };
    const drag = (x, y) => {
      if (!active) return;
      const dy = y + scrollY, d = Math.hypot(x - last.x, dy - last.y);
      if (d < STEP) return;
      last = { x, y: dy };
      if (!blocked(x, y)) makeSplat(x, y, color, Math.random() < .35);
    };
    const release = () => { active = false; last = null; };

    function frame(now) {
      raf = 0;
      ctx.clearRect(0, 0, w, h);
      splats = splats.filter((s) => now - s.t < LIFE);
      if (!splats.length) return;
      for (const s of splats) {
        const age = now - s.t;
        const y = s.y - scrollY;
        if (y < -80 || y > h + 80) continue;
        const pop = age < POP ? .55 + .45 * (1 - Math.pow(1 - age / POP, 3)) * 1.08 : 1;
        ctx.save();
        ctx.globalAlpha = age < HOLD ? 1 : 1 - (age - HOLD) / (LIFE - HOLD);
        ctx.translate(s.x, y); ctx.rotate(s.rot); ctx.scale(pop, pop);
        ctx.fillStyle = s.c; ctx.fill(s.body); ctx.fill(s.drops);
        ctx.lineWidth = 2.5; ctx.strokeStyle = s.rim; ctx.stroke(s.body);        // borde algo más oscuro, como témpera espesa
        ctx.globalAlpha *= .35; ctx.fillStyle = s.hi;                             // brillo de pintura fresca
        ctx.beginPath(); ctx.ellipse(-s.r * .3, -s.r * .32, s.r * .32, s.r * .16, -.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // Recortar todo lo que cae sobre zonas protegidas
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      for (const r of holes()) { if (ctx.roundRect) ctx.roundRect(r.x, r.y, r.w, r.h, 12); else ctx.rect(r.x, r.y, r.w, r.h); }
      ctx.fill();
      ctx.restore();
      raf = requestAnimationFrame(frame);
    }

    // Ratón: clic deja una mancha; arrastrar con el botón pulsado deja un reguero
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0 || blocked(e.clientX, e.clientY)) return;
      if (!e.target.closest('a, button, input, textarea, label, select')) e.preventDefault();
      press(e.clientX, e.clientY);
    });
    document.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') drag(e.clientX, e.clientY); });
    ['pointerup', 'pointercancel'].forEach((ev) => document.addEventListener(ev, (e) => { if (e.pointerType !== 'touch') release(); }));

    // Dedo: tocar o deslizar deja manchas, sin bloquear el scroll
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) { release(); return; }
      const t = e.touches[0]; press(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) drag(t.clientX, t.clientY); }, { passive: true });
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

    // La foto y las manchas siguen un poco al ratón (paralaje suave)
    const art = document.querySelector('[data-hero-art]');
    if (art && finePointer) {
      const hero = document.querySelector('.hero');
      const qx = [...art.querySelectorAll('.splash, .blob, .drop')].map((el, i) => ({
        x: gsap.quickTo(el, 'x', { duration: .8, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: .8, ease: 'power3.out' }),
        k: el.classList.contains('blob') ? 8 : 22 + i * 4,
      }));
      hero.addEventListener('pointermove', (e) => {
        const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
        qx.forEach((q) => { q.x(nx * q.k); q.y(ny * q.k); });
      });
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
