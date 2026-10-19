"use strict";
// ---------- menú ----------
const modal = document.getElementById('modal');
document.getElementById('menuBtn').onclick = () => { document.getElementById('mSize').querySelector('[value="384x224"]').disabled = !modOn('trucos'); modal.hidden = false; };
document.getElementById('mClose').onclick = () => modal.hidden = true;
modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
document.getElementById('mSave').onclick = () => { saveGame(); modal.hidden = true; };
document.getElementById('mLoad').onclick = () => { if (loadGame()) modal.hidden = true; };
document.getElementById('mGen').onclick = () => {
  const [w, h] = document.getElementById('mSize').value.split('x').map(Number);
  newWorld(w, h, document.getElementById('mType').value, document.getElementById('mOre').value, document.getElementById('mLife').value);
  modal.hidden = true;
};
function newWorld(w, h, type, ores, life) {
  genWorld(w, h, type, ores);
  selected = null; selectedCity = null; selectedKingdom = null; warPick = null;
  computeRegions();
  if (life === 'civ') {
    for (const r of ['human', 'elf', 'dwarf', 'orc']) {
      for (let a = 0; a < 20; a++) { const p = randomTile(t => TILE[t].build && t !== T.SNOW && t !== T.DESERT); if (p && !nearCity(p[0], p[1], 20)) { foundVillage(r, p[0] + .5, p[1] + .5); break; } }
    }
  }
  if (life === 'civ' || life === 'animals') {
    for (let k = 0; k < 24; k++) { const p = randomTile(t => t === T.GRASS); if (p) spawn('sheep', p[0] + .5, p[1] + .5); }
    for (let k = 0; k < 5; k++) { const p = randomTile(t => t === T.FOREST); if (p) spawn('wolf', p[0] + .5, p[1] + .5); }
  }
  setSpeed(0);
  addLog('Los dioses crean un mundo nuevo. El tiempo está detenido.', 'found');
  sideDirty = true;
}

// pantalla en horizontal
const rotate = document.getElementById('rotate');
let rotSkipped = false;
function checkRotate() { rotate.hidden = rotSkipped || !(window.innerWidth < 760 && window.innerHeight > window.innerWidth); }
document.getElementById('rotSkip').onclick = () => { rotSkipped = true; checkRotate(); };
document.getElementById('rotFull').onclick = async () => {
  try { await document.documentElement.requestFullscreen(); } catch (e) { }
  try { await screen.orientation.lock('landscape'); } catch (e) { toast('Gira el teléfono a mano: este navegador no deja girarlo solo'); }
  setTimeout(checkRotate, 400);
};

// ---------- arranque ----------
function loop(now) {
  if (!loop.last) loop.last = now;
  const dt = Math.min(100, now - loop.last); loop.last = now;
  if (!paused) {
    loop.acc = (loop.acc || 0) + dt / 16.67 * speed;
    let n = 0;
    while (loop.acc >= 1 && n < 30) { tick(); loop.acc--; n++; }
    if (loop.acc > 30) loop.acc = 0;
  }
  heldTool(now); keyPan();
  render();
  loop.f = (loop.f || 0) + 1;
  if (loop.f % 15 === 0) { renderStats(); if (sideDirty || (loop.f % 45 === 0 && !paused && sidePane !== 'log')) renderSide(); }
  requestAnimationFrame(loop);
}
window.addEventListener('resize', () => { resize(); clampCam(); checkRotate(); });
if (window.ResizeObserver) new ResizeObserver(() => { resize(); clampCam(); }).observe(document.getElementById('stage'));
resize();
newWorld(192, 112, 'cont', 'few', 'none');
renderTabs(); renderTools(); setBrush(3); updateHint(); renderStats(); renderSide(); checkRotate();
requestAnimationFrame(loop);
