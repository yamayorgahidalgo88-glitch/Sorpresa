"use strict";
// ---------- entrada ----------
let hover = null, painting = false, panning = null, lastApply = 0, lastWall = null;
const pointers = new Map(); let pinch = null;
function screenToWorld(px, py) { const r = view.getBoundingClientRect(); return { x: cam.x + (px - r.left) / cam.z, y: cam.y + (py - r.top) / cam.z }; }
function zoomAt(px, py, f) {
  const r = view.getBoundingClientRect();
  const wx = cam.x + (px - r.left) / cam.z, wy = cam.y + (py - r.top) / cam.z;
  cam.z = clamp(cam.z * f, 1.2, 48);
  cam.x = wx - (px - r.left) / cam.z; cam.y = wy - (py - r.top) / cam.z;
  clampCam();
}
function clampCam() { cam.x = clamp(cam.x, -VW / cam.z * .5, W - VW / cam.z * .5); cam.y = clamp(cam.y, -VH / cam.z * .5, H - VH / cam.z * .5); }
view.addEventListener('contextmenu', e => e.preventDefault());
view.addEventListener('pointerdown', e => {
  view.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    painting = false; panning = null; lastWall = null;
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    return;
  }
  if (e.button === 1 || e.button === 2 || curTool.kind === 'move') { panning = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }; return; }
  if (e.button === 0) {
    const w = screenToWorld(e.clientX, e.clientY);
    hover = w;
    if (curTool.kind === 'wall' || curTool.kind === 'unwall') { lastWall = w; wallLine(w.x, w.y, w.x, w.y, curTool.kind === 'wall'); return; }
    painting = !curTool.once && curTool.kind !== 'act' && !(curTool.kind === 'trait' && traitScope === 'village');
    if (curTool.kind === 'act' || curTool.kind === 'scope') return;
    applyTool(curTool, w.x, w.y, true); lastApply = performance.now();
  }
});
view.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    cam.x -= (cx - pinch.cx) / cam.z; cam.y -= (cy - pinch.cy) / cam.z;
    zoomAt(cx, cy, d / pinch.d);
    pinch = { d, cx, cy }; return;
  }
  hover = screenToWorld(e.clientX, e.clientY);
  if (lastWall) { wallLine(lastWall.x, lastWall.y, hover.x, hover.y, curTool.kind === 'wall'); lastWall = hover; }
  if (panning) { cam.x = panning.cx - (e.clientX - panning.x) / cam.z; cam.y = panning.cy - (e.clientY - panning.y) / cam.z; clampCam(); }
  updateHint();
});
function endPointer(e) {
  pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null;
  if (!pointers.size) { painting = false; panning = null; if (lastWall) { lastWall = null; computeRegions(); sideDirty = true; } }
}
view.addEventListener('pointerup', endPointer);
view.addEventListener('pointercancel', endPointer);
view.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = null; });
view.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
document.getElementById('zin').onclick = () => { const r = view.getBoundingClientRect(); zoomAt(r.left + VW / 2, r.top + VH / 2, 1.35); };
document.getElementById('zout').onclick = () => { const r = view.getBoundingClientRect(); zoomAt(r.left + VW / 2, r.top + VH / 2, 1 / 1.35); };
function heldTool(now) {
  if (!painting || !hover) return;
  const rate = curTool.rate ? curTool.rate * 16 : curTool.kind === 'spawn' ? 70 : curTool.kind === 'trait' ? 60 : 40;
  if (now - lastApply > rate) { applyTool(curTool, hover.x, hover.y, false); lastApply = now; }
}
const keys = new Set();
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  keys.add(e.key.toLowerCase());
  if (e.key === 'p' || e.key === 'P' || e.key === ' ') { togglePause(); e.preventDefault(); }
  const sp = { '1': 1, '2': 2, '3': 5, '4': 10, '5': 25 }[e.key]; if (sp && (sp < 10 || modOn('trucos'))) setSpeed(sp);
  if (e.key === '+' || e.key === '=') document.getElementById('zin').click();
  if (e.key === '-') document.getElementById('zout').click();
  if (e.key === 'i' || e.key === 'I') selectTool(TOOLS.find(t => t.id === 'inspect'));
  if (e.key === '[') setBrush(brush - 1); if (e.key === ']') setBrush(brush + 1);
  if (e.key === 'Escape') { document.getElementById('modal').hidden = true; warPick = null; }
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
function keyPan() {
  const s = 8 / cam.z;
  if (keys.has('a') || keys.has('arrowleft')) cam.x -= s; if (keys.has('d') || keys.has('arrowright')) cam.x += s;
  if (keys.has('w') || keys.has('arrowup')) cam.y -= s; if (keys.has('s') || keys.has('arrowdown')) cam.y += s;
  if (keys.size) clampCam();
}
