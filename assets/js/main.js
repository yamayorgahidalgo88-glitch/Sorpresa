import { initHours } from './hours.js';
import { initMotion } from './motion.js';
import { initReel } from './reel.js';

document.documentElement.classList.add('js');
// En Safari de iOS, :active solo se aplica si la página escucha toques
document.addEventListener('touchstart', () => {}, { passive: true });
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initHours();
initReel({ reduce });
initMotion({ reduce });
