import { initHours } from './hours.js';
import { initMotion } from './motion.js';
import { initReel } from './reel.js';

document.documentElement.classList.add('js');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initHours();
initReel({ reduce });
initMotion({ reduce });

// Barra inferior del móvil: marca la sección en la que estás
const dockLinks = new Map(
  [...document.querySelectorAll('.dock a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a])
);
if (dockLinks.size && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const a = dockLinks.get(e.target.id);
        if (e.isIntersecting) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      }
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );
  for (const id of dockLinks.keys()) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
}
