import { initAdvisor } from './advisor.js';
import { initMotion } from './motion.js';

const root = document.documentElement;
root.classList.add('js');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initMotion({ reduce });
initAdvisor();

// La escena 3D se carga aparte: si falla, la página sigue igual
const canvas = document.getElementById('tools');
if (canvas) {
  import('./scene.js')
    .then(({ initTools }) => initTools(canvas, { reduceMotion: reduce }))
    .catch((err) => {
      console.warn('Escena 3D no disponible', err);
      canvas.remove();
    });
}
