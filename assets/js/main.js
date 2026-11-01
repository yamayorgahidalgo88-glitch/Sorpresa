import { initAdvisor } from './advisor.js';
import { initMotion } from './motion.js';
import { initReel } from './reel.js';

document.documentElement.classList.add('js');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initReel({ reduce });
initMotion({ reduce });
initAdvisor();
