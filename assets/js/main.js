import { initAdvisor } from './advisor.js';

const root = document.documentElement;
root.classList.add('js');

// El cartel entra cuando la tipografía está lista, para que no salte.
const bill = document.querySelector('.bill');
const ready = () => bill && bill.classList.add('is-ready');
if (document.fonts && document.fonts.load) {
  Promise.race([
    document.fonts.load('900 125% 1em Archivo'),
    new Promise((r) => setTimeout(r, 900)),
  ]).then(ready, ready);
} else {
  ready();
}

// Los encabezados en caja negra se estampan al entrar en pantalla
const heads = document.querySelectorAll('.boxhead');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  heads.forEach((h) => io.observe(h));
} else {
  heads.forEach((h) => h.classList.add('in'));
}

initAdvisor();
