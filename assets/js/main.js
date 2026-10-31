import { initAdvisor } from './advisor.js';
import { initMotion } from './motion.js';

document.documentElement.classList.add('js');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initMotion({ reduce });
initAdvisor();
