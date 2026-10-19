"use strict";
// ---------- menú ----------
const modal = document.getElementById('modal');
function renderSlots() {
  const m = saveMeta(), row = slot => {
    const d = m[slot];
    const info = d ? `<small>Año ${d.year} · ${d.pop} habitantes · ${d.kingdoms} pueblo${d.kingdoms === 1 ? '' : 's'}${d.top ? ' · ' + esc(d.top) : ''}<br>${new Date(d.date).toLocaleString()}</small>` : '<small>Vacía</small>';
    return `<div class="slot"><span><b>${slot === 'auto' ? 'Autoguardado' : 'Ranura ' + slot}</b>${info}</span>${slot === 'auto' ? '<span></span>' : `<button class="tbtn" data-save="${slot}">Guardar</button>`}<button class="tbtn" data-load="${slot}" ${d ? '' : 'disabled'}>Cargar</button></div>`;
  };
  document.getElementById('slots').innerHTML = [1, 2, 3, 'auto'].map(row).join('') + (hasOldSave() ? '<div class="slot"><span><b>Partida de la versión anterior</b><small>Guardada antes de esta actualización</small></span><span></span><button class="tbtn" data-load="old">Cargar</button></div>' : '');
  document.querySelectorAll('#slots [data-save]').forEach(b => b.onclick = () => { saveSlot(+b.dataset.save); renderSlots(); });
  document.querySelectorAll('#slots [data-load]').forEach(b => b.onclick = () => { const v = b.dataset.load; if (loadSlot(v === 'auto' || v === 'old' ? v : +v)) modal.hidden = true; });
}
document.getElementById('menuBtn').onclick = () => { document.getElementById('mSize').querySelector('[value="384x224"]').disabled = !modOn('trucos'); renderSlots(); document.getElementById('achList').innerHTML = achHtml(); modal.hidden = false; };
document.getElementById('mExport').onclick = exportGame;
document.getElementById('mImport').onchange = e => { const f = e.target.files[0]; if (f) importGame(f); e.target.value = ''; };
document.getElementById('mClose').onclick = () => modal.hidden = true;
modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
document.getElementById('mGen').onclick = () => {
  const [w, h] = document.getElementById('mSize').value.split('x').map(Number);
  newWorld(w, h, document.getElementById('mType').value, document.getElementById('mOre').value, document.getElementById('mLife').value);
  modal.hidden = true;
};
function newWorld(w, h, type, ores, life) {
  genWorld(w, h, type, ores);
  history = []; histStep = 1; religions = [];
  selected = null; selectedCity = null; selectedKingdom = null; warPick = null;
  computeRegions();
  if (life === 'civ') {
    for (const r of ['human', 'elf', 'dwarf', 'orc']) {
      for (let a = 0; a < 20; a++) {
        const p = randomTile(t => TILE[t].build && t !== T.SNOW && t !== T.DESERT);
        if (p && !nearCity(p[0], p[1], 20)) {
          foundVillage(r, p[0] + .5, p[1] + .5);
          // cada pueblo de ejemplo tiene cobre, estaño y hierro a mano
          if (ores !== 'none') for (const m of ['cobre', 'estano', 'hierro', 'carbon']) { const q = pickTile(p[0], p[1], 11, i => TILE[tile[i]].build && !owner[i] && !bld[i], 40); if (q) placeVein(q[0], q[1], MATID[m], ri(3, 5)); }
          break;
        }
      }
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
  heldTool(now); keyPan(); autoSave(now); musicTick(); moveHeld();
  if (followSel) { if (followSel.dead) followSel = null; else { cam.x += (followSel.x - VW / cam.z / 2 - cam.x) * .12; cam.y += (followSel.y - VH / cam.z / 2 - cam.y) * .12; clampCam(); } }
  render();
  loop.f = (loop.f || 0) + 1;
  if (loop.f % 60 === 0 && welcome.hidden) checkAch();
  if (loop.f % 15 === 0) { renderStats(); if (sideDirty || (loop.f % (sidePane === 'ins' ? 15 : 45) === 0 && !paused && sidePane !== 'log')) renderSide(); }
  requestAnimationFrame(loop);
}
window.addEventListener('resize', () => { resize(); clampCam(); checkRotate(); });
if (window.ResizeObserver) new ResizeObserver(() => { resize(); clampCam(); }).observe(document.getElementById('stage'));
resize();
// pantalla de bienvenida: de fondo, un mundo con cuatro pueblos ya en marcha
newWorld(192, 112, 'cont', 'few', 'civ');
for (let i = 0; i < YEAR * 3; i++) tick();
const welcome = document.getElementById('welcome');
let seenWelcome = false; try { seenWelcome = !!sessionStorage.getItem('cdd-welcome'); } catch (e) { }
if (!seenWelcome && !new URLSearchParams(location.search).has('directo')) {
  welcome.hidden = false; setSpeed(1);
  document.getElementById('wContinue').hidden = !saveMeta().auto && !saveMeta()[1];
}
const closeWelcome = () => { welcome.hidden = true; try { sessionStorage.setItem('cdd-welcome', '1'); } catch (e) { } };
document.getElementById('wPlay').onclick = () => { closeWelcome(); setSpeed(1); toast('Un mundo vivo. Abre el panel de Pueblos o inspecciona a alguien.'); };
document.getElementById('wEmpty').onclick = () => { closeWelcome(); newWorld(192, 112, 'cont', 'few', 'none'); };
document.getElementById('wContinue').onclick = () => { closeWelcome(); loadSlot(saveMeta().auto ? 'auto' : 1); };
renderTabs(); renderTools(); setBrush(3); updateHint(); renderStats(); renderSide(); checkRotate();
requestAnimationFrame(loop);

document.getElementById('soundBtn').onclick = () => { audioInit(); if (SND.on && SND.musicOn) setMusic(false); else if (SND.on) setSound(false); else { setSound(true); setMusic(true); } };
syncSoundBtn();
