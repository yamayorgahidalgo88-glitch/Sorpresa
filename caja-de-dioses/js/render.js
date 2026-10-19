"use strict";
// ---------- render ----------
const nightCol = [18, 26, 60];
function dayLight() {
  if (!modOn('clima') || tickN === 0) return 1;
  const d = (tickN % (YEAR / 2)) / (YEAR / 2);
  return clamp(.62 + Math.cos(d * Math.PI * 2) * .55, .4, 1);
}
function season() { return modOn('clima') ? Math.floor((tickN % YEAR) / (YEAR / 4)) : 1; }
const SEASONS = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
function renderMap() {
  const d = img.data, light = dayLight(), sea = season(), t0 = tickN * .05 + performance.now() * .0006;
  const winter = sea === 3 && tickN > 0, autumn = sea === 2;
  for (let y = 0; y < H; y++) {
    const lat = Math.abs(y / H - .5) * 2, snowy = winter && lat > .45;
    for (let x = 0; x < W; x++) {
      const i = y * W + x, t = tile[i], c = TILE[t].c, j = jit[i];
      let r = c[0] + j, g = c[1] + j, b = c[2] + j;
      if (t <= 1) { const w = Math.sin(t0 + x * .35 + y * .22) * 4; r += w; g += w; b += w; }
      else if (t === T.LAVA || t === T.ACID) { const w = Math.sin(t0 * 3 + x + y) * 18; g += w; }
      else if (snowy && t !== T.DESERT && t !== T.MESA) { const k = Math.min(1, (lat - .45) * 3); r += (236 - r) * k; g += (240 - g) * k; b += (246 - b) * k; }
      else if (autumn && (t === T.FOREST || t === T.GRASS)) { r += 30; g -= 6; b -= 10; }
      const m = ore[i];
      if (m) { const mc = MAT[m].c, sp = hash(x, y, m) > .45; if (sp) { r = mc[0]; g = mc[1]; b = mc[2]; } else { r = 70 + mc[0] * .3; g = 66 + mc[1] * .3; b = 64 + mc[2] * .3; } if (((x * 13 + y * 7 + (tickN >> 3)) % 37) === 0) { r += 60; g += 60; b += 60; } }
      const o = owner[i];
      let city = null;
      if (o) {
        city = cities[o - 1];
        if (city && city.alive && city.k) {
          const kc = city.k.color;
          const bd = (x > 0 && owner[i - 1] !== o) || (x < W - 1 && owner[i + 1] !== o) || (y > 0 && owner[i - W] !== o) || (y < H - 1 && owner[i + W] !== o);
          if (bd && city.k.walls && modOn('tecnologia')) { r = 110 + kc[0] * .25; g = 106 + kc[1] * .25; b = 100 + kc[2] * .25; }
          else { const mm = bd ? .6 : .16; r += (kc[0] - r) * mm; g += (kc[1] - g) * mm; b += (kc[2] - b) * mm; }
        } else city = null;
      }
      const bl = bld[i];
      let lit = false;
      if (bl) {
        const k = city && city.k;
        const ht = k && modOn('tecnologia') ? k.house : 0;
        if (bl === 4) { r = 60; g = 52; b = 48; }
        else if (bl === 2) { const kc = k ? k.color : [200, 200, 200]; r = kc[0] * .5 + 120; g = kc[1] * .5 + 110; b = kc[2] * .5 + 100; lit = true; }
        else {
          const hc = HOUSES[ht][1]; r = hc[0]; g = hc[1]; b = hc[2];
          if (k && (x + y) % 2) { r = r * .6 + k.color[0] * .4; g = g * .6 + k.color[1] * .4; b = b * .6 + k.color[2] * .4; }
          lit = true;
        }
      }
      if (wall[i]) { const s = ((x + y) >> 1) % 2; r = s ? 245 : 214; g = s ? 245 : 40; b = s ? 240 : 48; }
      if (rad[i]) { const k = Math.min(.45, rad[i] / 400); r += (120 - r) * k; g += (255 - g) * k; b += (80 - b) * k; }
      if (fire[i]) { const f = rnd(); r = 255; g = 90 + f * 140; b = 20 + f * 30; }
      else if (light < 1 && !wall[i]) {
        if (lit && light < .7 && ((x * 7 + y * 3) % 4 === 0)) { r = 236; g = 196; b = 112; }
        else { r = r * light + nightCol[0] * (1 - light); g = g * light + nightCol[1] * (1 - light); b = b * light + nightCol[2] * (1 - light); }
      }
      const p = i * 4;
      d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
}
function bodyColor(u) { return u.k ? u.k.color : u.def.skin.map(v => v * .75); }
function drawSprite(ctx, u, sx, sy, z) {
  const def = u.def;
  const size = (def.size || 1) * tmul(u, 'size') * (def.civ && u.age < 12 ? .7 : 1);
  const pat = SPR[def.spr], ph = pat.length, pw = pat[0].length;
  const tall = z * 1.05 * size, p = tall / ph, w = p * pw;
  const ox = sx - w / 2, oy = sy - tall + p * .8;
  const red = u.hitT > 0;
  const skin = red ? [255, 80, 80] : def.skin;
  const body = red ? [255, 60, 60] : bodyColor(u);
  const tech = def.civ && u.k && modOn('tecnologia');
  const helm = tech && u.k.armor.tier >= 1 && u.age >= 12 ? ARMORS[u.k.armor.tier][2] : skin;
  const pal = { s: skin, h: helm, b: body, d: [40, 32, 30], r: [200, 110, 40], w: def.skin.map(v => v * .65), e: [20, 10, 10], y: [180, 240, 255], c: [140, 220, 255], S: [240, 120, 120] };
  const bob = def.fly ? Math.sin((tickN + u.id * 7) * .1) * p : 0;
  for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) {
    const ch = pat[yy][xx]; if (ch === '.') continue;
    ctx.fillStyle = css(pal[ch] || skin);
    ctx.fillRect(ox + xx * p, oy + yy * p + bob, Math.ceil(p), Math.ceil(p));
  }
  if (tech && u.age >= 12 && u.k.weapon.c) {
    ctx.fillStyle = css(u.k.weapon.c);
    if (u.k.gun) ctx.fillRect(ox + w - p * .2, oy + p * 2.4 + bob, p * 1.8, Math.ceil(p * .7));
    else ctx.fillRect(ox + w, oy + p * .6 + bob, Math.ceil(p * .7), p * 3.6);
  }
  const crown = (u.k && u.k.king === u) ? 'king' : u.hero ? 'hero' : null;
  if (crown) {
    ctx.fillStyle = crown === 'king' ? '#ffd23a' : '#e8b64c';
    const cw = crown === 'king' ? w * .8 : w * .5;
    ctx.fillRect(sx - cw / 2, oy - p * 1.3 + bob, cw, p);
    if (crown === 'king') { ctx.fillRect(sx - cw / 2, oy - p * 2 + bob, p * .7, p); ctx.fillRect(sx + cw / 2 - p * .7, oy - p * 2 + bob, p * .7, p); ctx.fillRect(sx - p * .35, oy - p * 2 + bob, p * .7, p); }
  }
  if (u.traits.length && z >= 12 && !crown) { ctx.fillStyle = 'rgba(232,182,76,.9)'; ctx.fillRect(sx - p * .4, oy - p * 1.4 + bob, p * .8, p * .8); }
  if (u.plague) { ctx.fillStyle = 'rgba(140,255,90,.8)'; ctx.fillRect(sx + w / 2, oy, p, p); }
  if (u.hp < u.maxHp && z >= 8) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(ox, oy - p * 2.8, w, Math.max(2, p * .7));
    ctx.fillStyle = u.hp / u.maxHp > .5 ? '#62bd6c' : '#e0584b'; ctx.fillRect(ox, oy - p * 2.8, w * Math.max(0, u.hp / u.maxHp), Math.max(2, p * .7));
  }
  if (u === selected) { ctx.strokeStyle = '#e8b64c'; ctx.lineWidth = Math.max(1, p * .5); ctx.strokeRect(ox - p, oy - p * 3.5, w + p * 2, tall + p * 3.5); }
}
function render() {
  renderMap();
  const ctx = vctx, z = cam.z * DPR;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#06090c'; ctx.fillRect(0, 0, view.width, view.height);
  let sxo = 0, syo = 0;
  if (shake > 0) { sxo = (rnd() - .5) * shake * DPR; syo = (rnd() - .5) * shake * DPR; if (!paused) shake *= .9; if (shake < .3) shake = 0; }
  const ox = -cam.x * z + sxo, oy = -cam.y * z + syo;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, ox, oy, W * z, H * z);
  const toS = (x, y) => [ox + x * z, oy + y * z];
  const vx0 = cam.x - 3, vy0 = cam.y - 3, vx1 = cam.x + VW / cam.z + 3, vy1 = cam.y + VH / cam.z + 3;
  for (const u of units) {
    if (u.x < vx0 || u.x > vx1 || u.y < vy0 || u.y > vy1) continue;
    const [sx, sy] = toS(u.x, u.y);
    if (z >= 7) drawSprite(ctx, u, sx, sy, z);
    else {
      const s = Math.max(2 * DPR, z * .9 * (u.def.size || 1));
      const c = u.hitT ? [255, 70, 70] : u.def.civ ? bodyColor(u) : u.def.skin;
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(sx - s / 2 - 1, sy - s - 1, s + 2, s + 2);
      ctx.fillStyle = css(c); ctx.fillRect(sx - s / 2, sy - s, s, s);
      if (u.def.civ) { ctx.fillStyle = css(u.def.skin); ctx.fillRect(sx - s / 4, sy - s, s / 2, s / 2.5); }
      if ((u.k && u.k.king === u) || u.hero) { ctx.fillStyle = '#ffd23a'; ctx.fillRect(sx - s / 2, sy - s - s * .5, s, s * .35); }
      if (u === selected) { ctx.strokeStyle = '#e8b64c'; ctx.lineWidth = 2; ctx.strokeRect(sx - s, sy - s * 1.6, s * 2, s * 2); }
    }
  }
  for (const p of projs) {
    const [sx, sy] = toS(p.x, p.y);
    ctx.fillStyle = p.kind === 'fireball' ? '#ff8a1e' : p.kind === 'laser' ? '#6cff8a' : p.kind === 'bullet' ? '#ffe9a0' : '#d8c8a0';
    const s = Math.max(2, z * (p.kind === 'fireball' ? .5 : .22));
    ctx.fillRect(sx - s / 2, sy - s / 2 - z * .5, s, s);
  }
  for (const f of fx) {
    const [sx, sy] = toS(f.x, f.y);
    if (f.k === 'meteor') {
      const k = f.life / 40, hx = sx + k * 30 * z, hy = sy - k * 60 * z;
      ctx.strokeStyle = 'rgba(255,170,60,.8)'; ctx.lineWidth = Math.max(2, z * .6);
      ctx.beginPath(); ctx.moveTo(hx + 8 * z, hy - 16 * z); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = '#ffe2a0'; ctx.beginPath(); ctx.arc(hx, hy, Math.max(3, z * 1.2), 0, 7); ctx.fill();
    } else if (f.k === 'bolt') {
      ctx.strokeStyle = `rgba(230,240,255,${f.life / 12})`; ctx.lineWidth = Math.max(2, z * .4);
      ctx.beginPath(); let x = sx, y = sy - 70 * z; ctx.moveTo(x, y);
      let s = f.seed * 1000;
      while (y < sy) { s = (s * 9301 + 49297) % 233280; x += ((s / 233280) - .5) * 6 * z; y += 6 * z; ctx.lineTo(x, Math.min(y, sy)); }
      ctx.stroke();
    } else if (f.k === 'tornado') {
      for (let k = 0; k < 7; k++) { const a = tickN * .4 + k; ctx.strokeStyle = 'rgba(200,200,190,.55)'; ctx.lineWidth = Math.max(1, z * .3); ctx.beginPath(); ctx.ellipse(sx + Math.sin(a) * z * .3, sy - k * z * .8, z * (.4 + k * .28), z * (.15 + k * .08), 0, 0, 7); ctx.stroke(); }
    } else if (f.k === 'cloud') {
      ctx.fillStyle = f.acid ? 'rgba(150,200,60,.45)' : 'rgba(210,220,235,.5)';
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(sx + (k - 2.5) * z * 1.5, sy - z * 7 + Math.sin(k * 2) * z, z * 2.2, 0, 7); ctx.fill(); }
      ctx.strokeStyle = f.acid ? 'rgba(170,240,60,.6)' : 'rgba(150,190,255,.6)'; ctx.lineWidth = Math.max(1, z * .15);
      for (let k = 0; k < 14; k++) { const rx = sx + (rnd() - .5) * z * 9, ry = sy - z * 6 + rnd() * z * 7; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - z * .3, ry + z * .9); ctx.stroke(); }
    } else if (f.k === 'bhole') {
      const r = (f.r || 2) * z;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.6);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(10,0,20,1)'); g.addColorStop(.7, 'rgba(160,90,255,.8)'); g.addColorStop(1, 'rgba(80,20,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r * 1.6, 0, 7); ctx.fill();
    } else if (f.k === 'beam') {
      ctx.fillStyle = `rgba(140,255,170,${f.life / 40})`; ctx.fillRect(sx - z * .6, sy - z * 6, z * 1.2, z * 6);
    }
  }
  for (const p of parts) {
    if (p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1) continue;
    const [sx, sy] = toS(p.x, p.y); const s = Math.max(1.5, z * .35 * p.s);
    ctx.globalAlpha = Math.min(1, p.l / 15);
    ctx.fillStyle = css(p.c); ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  if (cam.z >= 3) {
    ctx.font = `600 ${Math.round(11 * DPR)}px Barlow, system-ui, sans-serif`; ctx.textAlign = 'center';
    for (const c of cities) {
      if (!c || !c.alive || c.x < vx0 || c.x > vx1 || c.y < vy0 || c.y > vy1) continue;
      const [sx, sy] = toS(c.x + .5, c.y - 1.5);
      const label = (c.k.capital === c.id ? '♛ ' : '') + c.name + ' ' + c.pop + (c.k.wars.size ? ' ⚔' : '');
      const w = ctx.measureText(label).width + 10 * DPR;
      ctx.fillStyle = 'rgba(8,12,16,.75)'; ctx.fillRect(sx - w / 2, sy - 14 * DPR, w, 16 * DPR);
      ctx.fillStyle = css(c.k.color); ctx.fillRect(sx - w / 2, sy + 1 * DPR, w, 2 * DPR);
      ctx.fillStyle = c.k === warPick ? '#e8b64c' : '#eef2ee'; ctx.fillText(label, sx, sy - 2 * DPR);
    }
  }
  if (hover && !['inspect', 'move', 'act', 'spawn', 'bolt', 'heroize', 'village', 'declare', 'peace', 'gift', 'scope'].includes(curTool.kind) && !(curTool.kind === 'trait' && traitScope === 'village')) {
    const [sx, sy] = toS(hover.x, hover.y);
    const k = curTool.kind;
    const r = (k === 'quake' ? 8 + brush : k === 'flood' ? 6 + brush : k === 'nuke' ? 15 : k === 'bomb' ? 3 + brush * .5 : k === 'meteor' ? 4 + brush * .4 : k === 'wall' ? Math.max(.75, brush * .3) : k === 'unwall' ? Math.max(1, brush * .7) : k === 'ore' ? Math.max(.8, brush * .6) : (k === 'trait' || k === 'untrait') ? Math.max(1.2, brush * .8) : brush) * z;
    ctx.strokeStyle = k === 'wall' ? 'rgba(224,88,75,.9)' : 'rgba(232,182,76,.85)'; ctx.lineWidth = DPR; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.stroke();
  }
  if (flash > 0) { ctx.fillStyle = `rgba(255,250,235,${flash})`; ctx.fillRect(0, 0, view.width, view.height); if (!paused) flash *= .93; if (flash < .02) flash = 0; }
}
