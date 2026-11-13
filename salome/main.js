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

  /* ---------- Rastro de pintura en el hero ---------- */
  const trail = document.querySelector('[data-trail]');
  if (trail && finePointer && !reduce) {
    const ctx = trail.getContext('2d');
    const hero = trail.parentElement;
    let w, h, dpr, last = null, hue = 0, active = false;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      trail.width = w * dpr; trail.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); addEventListener('resize', size);
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const p = { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() };
      if (last) {
        const dist = Math.hypot(p.x - last.x, p.y - last.y);
        const speed = dist / Math.max(1, p.t - last.t);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = PALETTE[Math.floor(hue) % PALETTE.length];
        ctx.globalAlpha = .55;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(6, 34 - speed * 9);
        ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        hue += dist / 140;
      }
      last = p;
      if (!active) { active = true; requestAnimationFrame(fade); }
    });
    hero.addEventListener('pointerleave', () => { last = null; });
    let idle = 0;
    function fade() {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = .035;
      ctx.fillRect(0, 0, w, h);
      idle++;
      if (idle > 240) { ctx.clearRect(0, 0, w, h); active = false; idle = 0; return; }
      requestAnimationFrame(fade);
    }
    hero.addEventListener('pointermove', () => { idle = 0; });
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

    // Banda: desplazamiento infinito que acelera con el scroll
    const track = document.querySelector('[data-marquee]');
    if (track) {
      track.innerHTML += track.innerHTML;
      let x = 0, boost = 0, dir = -1;
      const half = () => track.scrollWidth / 2;
      gsap.ticker.add((t, dt) => {
        x += dir * (0.06 + boost) * dt;
        const h = half();
        if (x <= -h) x += h; if (x > 0) x -= h;
        track.style.transform = `translate3d(${x}px,0,0)`;
        boost *= .92;
      });
      if (window.ScrollTrigger) {
        ScrollTrigger.create({
          onUpdate: (s) => { boost = Math.min(Math.abs(s.getVelocity()) / 2500, 1.2); dir = s.direction === 1 ? -1 : 1; },
        });
      }
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
