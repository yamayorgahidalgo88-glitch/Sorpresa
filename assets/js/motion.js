// Coreografía de la página: el vídeo de portada se abre como en el cine, el
// interludio de las herramientas se abre y su texto se enciende al leerlo, y el
// cierre se abre a pantalla completa.

const EASE_OUT = 'expo.out';

export function initMotion({ reduce }) {
  const header = document.getElementById('header');
  setupHeroVideo(reduce);
  setupLoopVideo('.interlude__video');
  setupLoopVideo('.close__video');

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;

  // Sin GSAP o con movimiento reducido: todo visible y quieto
  if (!gsap || !ST || reduce) {
    header?.classList.add('is-in');
    onScrollHeader(header);
    document.querySelectorAll('.statement__text').forEach((el) => el.querySelectorAll('.sw').forEach((w) => (w.style.opacity = 1)));
    return;
  }

  document.documentElement.classList.add('motion');
  gsap.registerPlugin(ST);

  // ---------- Scroll suave ----------
  if (window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.4 });
        history.replaceState(null, '', id);
      });
    });
  }

  // ---------- Entrada: se abren las bandas, aparece el logo ----------
  const logoImg = document.querySelector('.hero__logo img');
  const logoWrap = document.querySelector('.hero__logo');
  const tl = gsap.timeline({ delay: 0.2, defaults: { ease: EASE_OUT } });
  tl.to('.hero__bars span', { scaleY: 0, duration: 1.4, ease: 'expo.inOut' })
    .fromTo(logoImg, { '--reveal': '0%' }, { '--reveal': '120%', duration: 1.8, ease: 'power3.inOut' }, '-=0.7')
    .fromTo(logoWrap, { '--shine': '160%' }, { '--shine': '-60%', duration: 1.5, ease: 'power2.inOut' }, '-=0.7')
    .to('[data-hero]', { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, '-=1.3')
    .add(() => header.classList.add('is-in'), '-=1');
  gsap.fromTo(logoWrap, { '--shine': '160%' }, { '--shine': '-60%', duration: 1.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 7, delay: 6 });

  // Al bajar, la portada se recoge como una pantalla que se aleja
  gsap.to('#hero-frame', {
    scale: 0.95,
    borderRadius: 14,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__content', {
    yPercent: -25,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true },
  });

  onScrollHeader(header);

  // ---------- Declaración: palabra a palabra, siguiendo la lectura ----------
  const st = document.getElementById('statement');
  if (st) {
    const gold = new Set(['medida.', 'Ayoub', 'Lahmany,']);
    const words = st.textContent.trim().split(/\s+/);
    st.setAttribute('aria-label', st.textContent.trim());
    st.innerHTML = words.map((w) => `<span class="sw${gold.has(w) ? ' is-gold' : ''}" aria-hidden="true">${w}</span>`).join(' ');
    gsap.to(st.querySelectorAll('.sw'), {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: 0.4 },
    });
  }

  const inter = document.getElementById('interlude-frame');
  if (inter) {
    gsap.fromTo(inter, { '--inset-x': '7%', '--inset-r': '18px' }, {
      '--inset-x': '0%',
      '--inset-r': '0px',
      ease: 'none',
      scrollTrigger: { trigger: inter, start: 'top 95%', end: 'top 20%', scrub: true },
    });
  }

  // ---------- Titulares palabra a palabra ----------
  document.querySelectorAll('[data-split]').forEach((el) => {
    splitWords(el);
    gsap.from(el.querySelectorAll('.w > span'), {
      yPercent: 110,
      rotate: 4,
      duration: 1.1,
      stagger: 0.07,
      ease: EASE_OUT,
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });

  gsap.utils.toArray('[data-fade]').forEach((el) => {
    gsap.from(el, { y: 26, opacity: 0, duration: 1.1, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  gsap.utils.toArray('[data-stagger]').forEach((g) => {
    gsap.from(g.querySelectorAll('h3, li'), {
      y: 20,
      opacity: 0,
      duration: 0.9,
      stagger: 0.06,
      ease: EASE_OUT,
      scrollTrigger: { trigger: g, start: 'top 86%' },
    });
  });

  // ---------- Línea de corte: las tijeras la recorren ----------
  const cut = document.querySelector('.cutline');
  if (cut) {
    const sc = cut.querySelector('.cutline__scissors');
    const rule = cut.querySelector('.cutline__rule');
    const trig = { trigger: cut, start: 'top 92%', end: 'top 35%', scrub: 0.6 };
    gsap.fromTo(sc, { x: 0 }, { x: () => cut.offsetWidth - 28, ease: 'none', scrollTrigger: trig });
    gsap.fromTo(rule, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { ...trig } });
    gsap.to(sc, { scaleY: 0.55, duration: 0.16, repeat: -1, yoyo: true, ease: 'power1.inOut' });
  }

  // ---------- Carrusel: las fotos entran escalonadas ----------
  gsap.from('.reel__item', {
    clipPath: 'inset(100% 0 0 0)',
    duration: 1.2,
    stagger: 0.07,
    ease: 'expo.inOut',
    scrollTrigger: { trigger: '.reel', start: 'top 82%' },
  });

  // ---------- Cierre: el marco se abre a pantalla completa ----------
  const frame = document.getElementById('close-frame');
  if (frame) {
    gsap.fromTo(frame, { '--inset-x': '8%', '--inset-r': '18px' }, {
      '--inset-x': '0%',
      '--inset-r': '0px',
      ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top 90%', end: 'top 15%', scrub: true },
    });
  }

  window.addEventListener('load', () => ST.refresh());
}

function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
}

// ---------- Vídeo de portada: horizontal o vertical según la pantalla ----------
function setupHeroVideo(reduce) {
  const v = document.getElementById('hero-video');
  if (!v) return;
  const tall = window.matchMedia('(max-aspect-ratio: 4/5)').matches;
  if (tall) v.poster = v.dataset.posterTall;
  if (reduce) return; // con movimiento reducido se queda la imagen fija
  v.src = tall ? v.dataset.srcTall : v.dataset.srcWide;
  v.play().catch(() => {});
  // se pausa cuando no se ve, para no gastar batería
  new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause())).observe(v);
}

function setupLoopVideo(sel) {
  const v = document.querySelector(sel);
  if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
      v.play().catch(() => {});
    } else v.pause();
  }, { rootMargin: '200px 0px' }).observe(v);
}

function onScrollHeader(header) {
  if (!header) return;
  let last = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 60);
    header.classList.toggle('is-hidden', y > 700 && y > last + 2);
    if (y < last - 2) header.classList.remove('is-hidden');
    last = y;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}
