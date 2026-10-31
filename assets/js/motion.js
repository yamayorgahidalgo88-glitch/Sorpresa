// Coreografía de la página: entrada del logo, scroll suave, titulares que
// suben línea a línea, imágenes que se descubren y la galería horizontal.

export function initMotion({ reduce }) {
  const header = document.getElementById('header');
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;

  // Sin GSAP o con movimiento reducido: todo visible y quieto
  if (!gsap || !ST || reduce) {
    header?.classList.add('is-in');
    onScrollHeader(header);
    return;
  }

  document.documentElement.classList.add('motion');
  gsap.registerPlugin(ST);

  // ---------- Scroll suave ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
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

  // ---------- Entrada ----------
  const logoImg = document.querySelector('.hero__logo img');
  const logoWrap = document.querySelector('.hero__logo');
  const tl = gsap.timeline({ delay: 0.35, defaults: { ease: 'expo.out' } });
  tl.fromTo(logoImg, { '--reveal': '0%' }, { '--reveal': '120%', duration: 1.8, ease: 'power3.inOut' })
    .fromTo(logoWrap, { '--shine': '160%' }, { '--shine': '-60%', duration: 1.5, ease: 'power2.inOut' }, '-=0.7')
    .to('[data-hero]', { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, '-=1.2')
    .add(() => header.classList.add('is-in'), '-=1');
  // El brillo vuelve a pasar de vez en cuando, como la luz sobre el metal
  gsap.fromTo(logoWrap, { '--shine': '160%' }, { '--shine': '-60%', duration: 1.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 6, delay: 5 });

  // La portada se aleja al bajar
  gsap.to('.hero__content', {
    yPercent: -14,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  onScrollHeader(header, ST);

  // ---------- Titulares palabra a palabra ----------
  document.querySelectorAll('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
    gsap.from(el.querySelectorAll('.w > span'), {
      yPercent: 110,
      rotate: 4,
      duration: 1.1,
      stagger: 0.07,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });

  gsap.utils.toArray('[data-fade]').forEach((el) => {
    gsap.from(el, { y: 26, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  gsap.utils.toArray('[data-stagger]').forEach((g) => {
    gsap.from(g.querySelectorAll('h3, li'), {
      y: 20,
      opacity: 0,
      duration: 0.9,
      stagger: 0.07,
      ease: 'expo.out',
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

  // ---------- Galería de trabajos ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1081px)', () => {
    const track = document.getElementById('works-track');
    const pin = document.querySelector('.works__pin');
    if (!track || !pin) return;
    const distance = () => Math.max(0, track.scrollWidth - (window.innerWidth - track.getBoundingClientRect().left) + 56);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
  });
  gsap.from('.work', {
    clipPath: 'inset(100% 0 0 0)',
    duration: 1.3,
    stagger: 0.12,
    ease: 'expo.inOut',
    scrollTrigger: { trigger: '.works', start: 'top 70%' },
  });

  // ---------- El local ----------
  gsap.from('.place__img', {
    clipPath: 'inset(0 0 100% 0)',
    duration: 1.5,
    ease: 'expo.inOut',
    scrollTrigger: { trigger: '.place__img', start: 'top 82%' },
  });
  gsap.fromTo('.place__img img', { yPercent: 5 }, {
    yPercent: -5,
    ease: 'none',
    scrollTrigger: { trigger: '.place__img', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  const num = document.querySelector('[data-count]');
  if (num) {
    const v = { n: 0 };
    gsap.to(v, {
      n: Number(num.dataset.count),
      duration: 1.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: num, start: 'top 88%' },
      onUpdate: () => (num.textContent = v.n.toFixed(1).replace('.', ',')),
    });
  }

  // ---------- Poste del cierre ----------
  gsap.from('.pole', { y: 60, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.close', start: 'top 80%' } });

  window.addEventListener('load', () => ST.refresh());
}

function onScrollHeader(header, ST) {
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
