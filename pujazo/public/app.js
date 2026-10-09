/* PUJAZO · cliente */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TIER_LABEL = { terrible: 'Muy malo', malo: 'Malo', normal: 'Normal', bueno: 'Bueno', brutal: 'Muy bueno' };
  const AVATAR_COLORS = ['#ffc21a', '#22e1ff', '#ff6b9d', '#2ee59d', '#c86bff'];
  const SESSION_KEY = 'pujazo:session';

  const socket = io();
  let state = null;
  let me = null;
  let clockOffset = 0;
  let prev = { phase: null, histLen: 0, itemId: null, soldKey: null };
  let categories = [];
  let createCat = 'random';
  let joinName = '';
  let voteBuiltFor = null;
  let resultsBuiltFor = null;
  let sentVotes = false;

  /* ---------- Utilidades ---------- */
  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    window.scrollTo(0, 0);
  }
  let toastTimer;
  function toast(msg, err) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.className = 'toast', 2600);
  }
  const now = () => Date.now() + clockOffset;
  const colorFor = id => AVATAR_COLORS[state ? Math.max(0, state.players.findIndex(p => p.id === id)) % 5 : 0];
  const avatar = p => `<span class="avatar" style="background:${colorFor(p.id)}">${esc(p.name[0].toUpperCase())}</span>`;

  // Imágenes generadas con IA: el servidor las genera (Pollinations), las cachea y las sirve.
  const itemImgUrl = item => `/img/item/${encodeURIComponent(item.id)}`;
  const sceneImgUrl = (items, cat) => `/img/scene/${cat.key}/${items.map(i => encodeURIComponent(i.id)).sort().join(',')}`;
  const preloaded = new Set();
  function preload(url) {
    if (preloaded.has(url)) return;
    preloaded.add(url);
    const img = new Image();
    img.src = url;
  }

  /* ---------- Sonido (WebAudio) ---------- */
  let actx = null;
  let muted = localStorage.getItem('pujazo:muted') === '1';
  $('#muteBtn').textContent = muted ? '🔇' : '🔊';
  $('#muteBtn').onclick = () => {
    muted = !muted;
    localStorage.setItem('pujazo:muted', muted ? '1' : '0');
    $('#muteBtn').textContent = muted ? '🔇' : '🔊';
  };
  function ac() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  document.addEventListener('pointerdown', () => { try { ac(); } catch (e) {} }, { once: true });
  function tone(freq, dur, type = 'sine', vol = .2, slide = 0) {
    if (muted) return;
    try {
      const a = ac(), o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = freq;
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, a.currentTime + dur);
      g.gain.setValueAtTime(vol, a.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, a.currentTime + dur);
      o.connect(g).connect(a.destination);
      o.start(); o.stop(a.currentTime + dur);
    } catch (e) {}
  }
  function noise(dur, vol, filterType, freq) {
    if (muted) return;
    try {
      const a = ac(), len = a.sampleRate * dur, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      src.buffer = buf; f.type = filterType; f.frequency.value = freq; g.gain.value = vol;
      src.connect(f).connect(g).connect(a.destination);
      src.start();
    } catch (e) {}
  }
  const sfx = {
    bid: () => { tone(660, .12, 'square', .08); setTimeout(() => tone(990, .15, 'square', .08), 70); },
    tick: () => tone(1200, .05, 'square', .05),
    bang: () => { tone(120, .35, 'sine', .6, 40); noise(.25, .7, 'lowpass', 900); },
    glass: () => { noise(.9, .45, 'highpass', 2500); [2600, 3400, 4100].forEach((f, i) => setTimeout(() => tone(f, .25, 'triangle', .05), i * 60)); },
    reveal: () => [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, .18, 'triangle', .12), i * 90)),
    slot: () => tone(400 + Math.random() * 400, .05, 'square', .04),
    win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .3, 'triangle', .15), i * 120)),
  };

  /* ---------- Navegación inicial ---------- */
  $$('[data-go]').forEach(b => b.onclick = () => show(b.dataset.go));

  fetch('/api/categories').then(r => r.json()).then(d => {
    categories = d.categories;
    renderCatGrid($('#catGrid'), createCat, k => { createCat = k; });
  });

  function renderCatGrid(el, selected, onPick) {
    const opts = [{ key: 'random', name: 'Categoría aleatoria', emoji: '🎲' }, ...categories];
    el.innerHTML = opts.map(c => `<button class="cat-opt ${c.key === 'random' ? 'random' : ''} ${c.key === selected ? 'sel' : ''}" data-k="${c.key}"><span class="e">${c.emoji}</span>${esc(c.name)}</button>`).join('');
    el.querySelectorAll('.cat-opt').forEach(b => b.onclick = () => {
      el.querySelectorAll('.cat-opt').forEach(x => x.classList.toggle('sel', x === b));
      onPick(b.dataset.k);
    });
  }

  const savedName = localStorage.getItem('pujazo:name') || '';
  $('#createName').value = savedName;
  $('#joinName').value = savedName;

  $('#createBtn').onclick = () => {
    const name = $('#createName').value.trim();
    if (!name) return toast('Escribe tu nombre', true);
    localStorage.setItem('pujazo:name', name);
    socket.emit('create', { name, category: createCat }, r => { if (!r.ok) toast(r.error, true); });
  };
  $('#createName').onkeydown = e => { if (e.key === 'Enter') $('#createBtn').click(); };

  $('#joinNameBtn').onclick = () => {
    joinName = $('#joinName').value.trim();
    if (!joinName) return toast('Escribe tu nombre', true);
    localStorage.setItem('pujazo:name', joinName);
    $('#joinHello').textContent = joinName;
    $('#joinStep1').hidden = true;
    $('#joinStep2').hidden = false;
    $('#joinCode').focus();
  };
  $('#joinName').onkeydown = e => { if (e.key === 'Enter') $('#joinNameBtn').click(); };
  $('#joinBack').onclick = () => { $('#joinStep1').hidden = false; $('#joinStep2').hidden = true; };
  $('#joinCode').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
  $('#joinCode').onkeydown = e => { if (e.key === 'Enter') $('#joinBtn').click(); };
  $('#joinBtn').onclick = () => {
    const code = $('#joinCode').value.trim();
    if (code.length !== 4) return toast('El código tiene 4 caracteres', true);
    socket.emit('join', { name: joinName, code }, r => { if (!r.ok) toast(r.error, true); });
  };

  /* ---------- Conexión ---------- */
  socket.on('connect', () => {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (s) socket.emit('resume', s, r => { if (!r.ok) { localStorage.removeItem(SESSION_KEY); show('home'); } });
  });
  socket.on('disconnect', () => toast('Conexión perdida, reconectando…', true));
  socket.on('joined', d => {
    me = d.playerId;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ code: d.code, token: d.token }));
  });
  socket.on('state', s => {
    clockOffset = s.serverNow - Date.now();
    state = s;
    render();
  });

  function leave() {
    socket.emit('leave');
    localStorage.removeItem(SESSION_KEY);
    state = null; me = null;
    prev = { phase: null, histLen: 0, itemId: null, soldKey: null };
    $('#joinStep1').hidden = false; $('#joinStep2').hidden = true; $('#joinCode').value = '';
    show('home');
  }
  $('#leaveBtn').onclick = leave;
  $('#exitBtn').onclick = leave;

  /* ---------- Render principal ---------- */
  function render() {
    const s = state;
    const phase = s.phase;
    if (phase === 'lobby') { renderLobby(); show('lobby'); }
    if (phase === 'category' && prev.phase !== 'category') { show('game'); renderGame(); categoryReveal(); }
    if (phase === 'reveal' || phase === 'auction' || phase === 'sold') { show('game'); renderGame(); }
    if (phase === 'sold') {
      const key = s.sold.item.id;
      if (prev.soldKey !== key) { prev.soldKey = key; playSold(s.sold); }
    }
    if (phase === 'voting') { renderVoting(); show('voting'); }
    if (phase === 'results') { renderResults(); show('results'); }
    if (phase !== 'voting') { voteBuiltFor = null; sentVotes = false; }
    if (phase !== 'results') resultsBuiltFor = null;
    if (s.nextItem && s.category) preload(itemImgUrl(s.nextItem));
    prev.phase = phase;
  }

  /* ---------- Sala ---------- */
  function renderLobby() {
    const s = state, isHost = s.hostId === me;
    $('#codeBox').textContent = s.code;
    const c = s.categoryChoice === 'random' ? { emoji: '🎲', name: 'Categoría aleatoria' } : s.categoryChoices.find(x => x.key === s.categoryChoice);
    $('#lobbyCat').innerHTML = `<span>${c.emoji}</span><span>${esc(c.name)}</span>${isHost ? '<button id="changeCat">Cambiar</button>' : ''}`;
    if (isHost) $('#changeCat').onclick = () => {
      const picker = $('#lobbyCatPicker');
      picker.hidden = !picker.hidden;
      if (!picker.hidden) renderCatGrid(picker, s.categoryChoice, k => { socket.emit('setCategory', { category: k }); picker.hidden = true; });
    };
    if (!isHost) $('#lobbyCatPicker').hidden = true;
    $('#lobbyCount').textContent = `(${s.players.length}/5)`;
    const slots = [];
    for (let i = 0; i < 5; i++) {
      const p = s.players[i];
      slots.push(p
        ? `<li>${avatar(p)}<span>${esc(p.name)}${p.id === me ? ' <span class="muted small">(tú)</span>' : ''}</span>${p.id === s.hostId ? '<span class="badge">👑 Anfitrión</span>' : ''}</li>`
        : `<li class="empty"><span class="avatar" style="background:rgba(255,255,255,.15)"></span>Esperando jugador…</li>`);
    }
    $('#lobbyPlayers').innerHTML = slots.join('');
    $('#startBtn').hidden = !isHost;
    $('#startBtn').disabled = s.players.length < 2;
    $('#lobbyWait').textContent = isHost
      ? (s.players.length < 2 ? 'Hace falta al menos 1 jugador más para empezar.' : '¡Todo listo! Pulsa comenzar cuando estéis todos.')
      : 'Esperando a que el anfitrión empiece la partida…';
  }
  $('#codeBox').onclick = () => {
    const txt = state?.code;
    if (!txt) return;
    (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => toast('¡Código copiado!'), () => toast(txt));
  };
  $('#startBtn').onclick = () => socket.emit('start', null, r => { if (!r.ok) toast(r.error, true); });

  /* ---------- Revelación de categoría ---------- */
  function categoryReveal() {
    const s = state, ov = $('#catOverlay'), slot = $('#catSlot');
    ov.hidden = false;
    slot.classList.remove('final');
    const final = s.category;
    const finish = () => {
      slot.innerHTML = `<span class="e">${final.emoji}</span>${esc(final.name)}`;
      slot.classList.add('final');
      sfx.reveal();
      setTimeout(() => { ov.hidden = true; }, 1600);
    };
    if (s.categoryChoice !== 'random') return finish();
    const list = s.categoryChoices;
    let i = 0, delay = 60;
    const spin = () => {
      const c = list[i++ % list.length];
      slot.innerHTML = `<span class="e">${c.emoji}</span>${esc(c.name)}`;
      sfx.slot();
      delay *= 1.12;
      if (delay < 420) setTimeout(spin, delay); else finish();
    };
    spin();
  }

  /* ---------- Partida ---------- */
  function myPlayer() { return state.players.find(p => p.id === me); }

  function renderGame() {
    const s = state, a = s.auction, mine = myPlayer();
    if (!s.category) return;
    $('#gameCat').textContent = `${s.category.emoji} ${s.category.name}`;
    $('#gameCounter').textContent = s.totalItems ? `Objeto ${Math.max(1, s.itemIndex)} / ${s.totalItems}` : '';

    // Barra de jugadores
    $('#playersBar').innerHTML = s.players.map(p => {
      const lead = a && a.leaderId === p.id && s.phase === 'auction';
      const full = p.items.length >= 4;
      const passed = a && a.passed.includes(p.id);
      let st = '';
      if (!p.connected) st = '<span class="state">Desconectado</span>';
      else if (lead) st = '<span class="state lead">🔨 Gana</span>';
      else if (full) st = '<span class="state full">✓ Completo</span>';
      else if (passed && s.phase === 'auction') st = '<span class="state pass">Se retira</span>';
      const slots = [0, 1, 2, 3].map(i => `<span class="slot" title="${p.items[i] ? esc(p.items[i].name) : ''}">${p.items[i] ? p.items[i].emoji : ''}</span>`).join('');
      return `<div class="pchip ${p.id === me ? 'me' : ''} ${lead ? 'leader' : ''} ${(passed || full) && s.phase === 'auction' ? 'out' : ''} ${p.connected ? '' : 'offline'}">
        ${st}<div class="top">${avatar(p)}<span class="nm">${esc(p.name)}</span><span class="coins">${p.coins}🪙</span></div>
        <div class="slots">${slots}</div></div>`;
    }).join('');

    if (!a) {
      $('#itemCard').style.visibility = 'hidden';
      $('#controls').style.visibility = 'hidden';
      return;
    }
    $('#itemCard').style.visibility = '';
    $('#controls').style.visibility = '';

    // Objeto
    if (prev.itemId !== a.item.id) {
      prev.itemId = a.item.id;
      prev.histLen = 0;
      const card = $('#itemCard');
      card.classList.remove('enter'); void card.offsetWidth; card.classList.add('enter');
      $('#itemTier').className = 'tier ' + a.item.tier;
      $('#itemTier').textContent = TIER_LABEL[a.item.tier];
      $('#itemEmoji').textContent = a.item.emoji;
      $('#itemName').textContent = a.item.name;
      const img = $('#itemImg');
      img.classList.remove('loaded');
      img.onload = () => img.classList.add('loaded');
      img.onerror = () => img.removeAttribute('src');
      img.src = itemImgUrl(a.item);
      $('#customBid').value = '';
      sfx.reveal();
    }

    // Puja actual
    const leader = s.players.find(p => p.id === a.leaderId);
    $('#bidAmount').innerHTML = a.bid ? `${a.bid} <span class="coin-s">🪙</span>` : '—';
    $('#bidLeader').innerHTML = leader ? `🔨 ${esc(leader.name)}${leader.id === me ? ' (tú)' : ''}` : (s.phase === 'auction' ? 'Nadie ha pujado aún' : 'Preparando la puja…');
    if (a.history.length && a.history.length !== prev.histLen) {
      const el = $('#bidAmount');
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
      sfx.bid();
    }
    prev.histLen = a.history.length;
    $('#bidFeed').innerHTML = a.history.map(h => `<li>${esc(h.name)} puja <b>${h.amount} 🪙</b></li>`).join('');

    // Controles
    const eligible = mine && a.eligible.includes(me);
    const passed = a.passed.includes(me);
    const iLead = a.leaderId === me;
    const live = s.phase === 'auction';
    const canBid = live && eligible && !passed && !iLead && mine.coins > a.bid;
    $('#quickBid').textContent = `PUJAR ${a.bid + 1} 🪙`;
    $('#quickBid').disabled = !canBid;
    $('#customBid').disabled = !canBid;
    $('#customBidBtn').disabled = !canBid;
    $('#customBid').min = a.bid + 1;
    $('#customBid').max = mine ? mine.coins : 20;
    $('#passBtn').disabled = !(live && eligible && !passed && !iLead);
    $('#passBtn').textContent = passed ? '✋ Te has retirado' : '✋ Dejar de pujar';

    let status = '';
    if (!mine) status = '';
    else if (mine.items.length >= 4) status = '✅ Ya tienes tus 4 cosas. ¡Disfruta viendo sufrir al resto!';
    else if (a.eligible.length === 1 && eligible) status = '🎁 Eres el único con huecos: ¡te lo llevas gratis!';
    else if (iLead) status = '🔥 ¡Vas ganando! Aguanta…';
    else if (passed) status = 'Te has retirado de esta puja';
    else if (mine.coins === 0) status = '😬 Sin monedas: si nadie puja, puede tocarte gratis';
    else if (live && mine.coins <= a.bid) status = 'No te llega para superar la puja';
    else status = `Tienes <b>${mine.coins} 🪙</b> · te faltan ${4 - mine.items.length} cosas`;
    $('#myStatus').innerHTML = status;
  }

  // Reloj (se actualiza cada frame)
  const RING = 326.7;
  let lastTickSec = null;
  function frame() {
    requestAnimationFrame(frame);
    if (!state || !state.auction) return;
    const a = state.auction, timer = $('.timer'), ring = $('#timerRing'), txt = $('#timerText');
    if (state.phase === 'reveal') {
      timer.className = 'timer waiting';
      txt.textContent = a.eligible.length === 1 ? '¡Directo!' : '¡Prepárate!';
      ring.style.strokeDashoffset = 0;
      ring.style.stroke = 'var(--cyan)';
      return;
    }
    if (state.phase !== 'auction') {
      timer.className = 'timer';
      txt.textContent = '0';
      ring.style.strokeDashoffset = RING;
      return;
    }
    const total = a.leaderId ? 5000 : 10000;
    const left = Math.max(0, a.endsAt - now());
    const frac = Math.min(1, left / total);
    ring.style.strokeDashoffset = RING * (1 - frac);
    ring.style.stroke = frac > .5 ? 'var(--green)' : frac > .25 ? 'var(--gold)' : 'var(--red)';
    const sec = Math.ceil(left / 1000);
    txt.textContent = sec;
    timer.className = 'timer' + (left < 3000 ? ' urgent' : '');
    if (left < 3000 && sec !== lastTickSec && sec > 0) sfx.tick();
    lastTickSec = sec;
  }
  requestAnimationFrame(frame);

  function sendBid(amount) {
    socket.emit('bid', { amount }, r => { if (!r.ok) toast(r.error, true); });
  }
  $('#quickBid').onclick = () => state?.auction && sendBid(state.auction.bid + 1);
  $('#customBidBtn').onclick = () => {
    const v = parseInt($('#customBid').value, 10);
    if (!Number.isFinite(v)) return toast('Escribe cuánto quieres pujar', true);
    sendBid(v);
    $('#customBid').value = '';
  };
  $('#customBid').onkeydown = e => { if (e.key === 'Enter') $('#customBidBtn').click(); };
  $('#passBtn').onclick = () => socket.emit('pass', null, r => { if (!r.ok) toast(r.error, true); });

  /* ---------- Animación de VENDIDO ---------- */
  function buildCracks(svg) {
    const W = window.innerWidth, H = window.innerHeight, cx = W / 2, cy = H / 2;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const R = Math.hypot(W, H);
    const n = 13;
    const angles = Array.from({ length: n }, (_, i) => (i + Math.random() * .6) * (Math.PI * 2 / n)).sort((a, b) => a - b);
    const rays = angles.map(ang => {
      const pts = [[cx, cy]];
      let r = 0;
      while (r < R) {
        r += 40 + Math.random() * 90;
        const a = ang + (Math.random() - .5) * .18;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      return pts;
    });
    let html = '';
    // Fragmentos de cristal (cuñas entre rayos)
    rays.forEach((ray, i) => {
      const next = rays[(i + 1) % n];
      const poly = [...ray, ...next.slice().reverse()].map(p => p.join(',')).join(' ');
      const dx = (Math.random() - .5) * 200, rot = (Math.random() - .5) * 90;
      html += `<polygon class="shard" points="${poly}" style="--dx:${dx}px;--rot:${rot}deg;animation-delay:${Math.random() * .25}s"/>`;
    });
    // Grietas radiales
    rays.forEach(ray => {
      const d = 'M' + ray.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L');
      let len = 0;
      for (let i = 1; i < ray.length; i++) len += Math.hypot(ray[i][0] - ray[i - 1][0], ray[i][1] - ray[i - 1][1]);
      html += `<path class="line" d="${d}" style="--len:${len.toFixed(0)}"/>`;
    });
    // Anillos concéntricos que unen los rayos
    [70, 150, 260].forEach((rad, k) => {
      rays.forEach((ray, i) => {
        if (Math.random() < .3) return;
        const next = rays[(i + 1) % n];
        const p1 = pointAt(ray, rad + Math.random() * 30), p2 = pointAt(next, rad + Math.random() * 30);
        const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        html += `<path class="line" d="M${p1.join(',')} L${p2.join(',')}" style="--len:${len.toFixed(0)};animation-delay:${.08 + k * .06}s;stroke-width:1.4"/>`;
      });
    });
    svg.innerHTML = html;
    function pointAt(ray, dist) {
      const [x0, y0] = ray[0], [x1, y1] = ray[ray.length - 1];
      const L = Math.hypot(x1 - x0, y1 - y0);
      return [x0 + (x1 - x0) * dist / L, y0 + (y1 - y0) * dist / L].map(v => +v.toFixed(1));
    }
  }

  let soldTimers = [];
  function playSold(sold) {
    soldTimers.forEach(clearTimeout);
    soldTimers = [];
    const ov = $('#soldOverlay');
    ov.className = 'overlay sold-overlay';
    ov.hidden = false;
    buildCracks($('#cracks'));
    const free = sold.price === 0;
    const word = $('#soldWord');
    word.textContent = free ? '¡ADJUDICADO!' : '¡VENDIDO!';
    word.classList.toggle('free', free);
    const who = sold.winnerId === me ? 'ti' : esc(sold.winnerName);
    $('#soldWho').innerHTML = free
      ? `Para <b>${who}</b> gratis ${sold.reason === 'unico' ? '(era el único con huecos)' : '(nadie pujó)'}`
      : `A <b>${who}</b> por <b>${sold.price} 🪙</b>`;
    $('#soldWhat').textContent = `${sold.item.emoji} ${sold.item.name}`;
    void ov.offsetWidth;
    ov.classList.add('play');
    soldTimers.push(setTimeout(() => {
      ov.classList.add('cracked');
      sfx.bang(); sfx.glass();
      const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
      document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
      if (navigator.vibrate) navigator.vibrate([60, 30, 90]);
      if (sold.winnerId === me) setTimeout(sfx.win, 400);
    }, 550));
    soldTimers.push(setTimeout(() => ov.classList.add('fall'), 3000));
    soldTimers.push(setTimeout(() => ov.classList.add('dim-out'), 3700));
    soldTimers.push(setTimeout(() => { ov.hidden = true; ov.className = 'overlay sold-overlay'; document.body.classList.remove('shake'); }, 4100));
  }

  /* ---------- Tarjetas finales ---------- */
  function finalCard(p, extra = '') {
    const cat = state.category;
    const spent = p.items.reduce((t, i) => t + i.price, 0);
    const list = p.items.map(i => `<li><span class="e">${i.emoji}</span><span class="n">${esc(i.name)} <span class="tier ${i.tier}">${TIER_LABEL[i.tier]}</span></span><span class="p">${i.price} 🪙</span></li>`).join('');
    return `<article class="fcard" data-id="${p.id}">
      <h3>${avatar(p)}${esc(p.name)}${p.id === me ? '<span class="me-tag">TÚ</span>' : ''}</h3>
      <div class="final-img">
        <div class="collage">${p.items.map(i => `<span>${i.emoji}</span>`).join('')}</div>
        <div class="loading">🎨 Generando imagen con IA…</div>
        <img alt="${esc(cat.name)} de ${esc(p.name)}" data-src="${sceneImgUrl(p.items, cat)}">
      </div>
      <ul class="final-list">${list}</ul>
      <div class="final-left">Gastado: ${spent} 🪙 · Le sobran: ${p.coins} 🪙</div>
      ${extra}
    </article>`;
  }
  function loadFinalImages(container) {
    container.querySelectorAll('img[data-src]').forEach(img => {
      const loading = img.parentElement.querySelector('.loading');
      img.onload = () => { img.classList.add('loaded'); loading?.remove(); };
      img.onerror = () => { if (loading) loading.textContent = 'No se pudo generar la imagen'; };
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  /* ---------- Votación ---------- */
  function renderVoting() {
    const s = state;
    const key = s.code + ':' + s.players.map(p => p.id).join(',') + ':' + s.category.key;
    if (voteBuiltFor !== key) {
      voteBuiltFor = key;
      $('#votingTitle').textContent = `¡A votar! ${s.category.emoji}`;
      $('#voteCards').innerHTML = s.players.map(p => finalCard(p, p.id === me
        ? '<div class="vote-box"><label>Esta es tu creación 😎</label></div>'
        : `<div class="vote-box"><label for="v-${p.id}">Tu nota para ${esc(p.name)}</label><input id="v-${p.id}" data-target="${p.id}" type="number" inputmode="decimal" min="0" max="10" step="0.5" placeholder="?"><span class="of">/10</span></div>`)).join('');
      $$('#voteCards input').forEach(inp => inp.oninput = () => {
        let v = parseFloat(inp.value.replace(',', '.'));
        if (v > 10) inp.value = 10;
        if (v < 0) inp.value = 0;
      });
      loadFinalImages($('#voteCards'));
    }
    const voted = s.players.filter(p => p.voted).length;
    const meVoted = myPlayer()?.voted;
    $('#voteProgress').textContent = `Han votado ${voted}/${s.players.filter(p => p.connected).length}`;
    $('#sendVotes').disabled = !!meVoted;
    $('#sendVotes').textContent = meVoted ? '✓ Votos enviados' : 'Enviar votos';
    $$('#voteCards input').forEach(i => i.disabled = !!meVoted);
    $('#forceResults').hidden = s.hostId !== me;
  }
  $('#sendVotes').onclick = () => {
    const scores = {};
    for (const inp of $$('#voteCards input')) {
      const v = parseFloat(String(inp.value).replace(',', '.'));
      if (!Number.isFinite(v) || v < 0 || v > 10) { inp.focus(); return toast('Pon una nota del 0 al 10 a todos', true); }
      scores[inp.dataset.target] = v;
    }
    socket.emit('vote', { scores }, r => { if (!r.ok) toast(r.error, true); else toast('¡Votos enviados!'); });
  };
  $('#forceResults').onclick = () => socket.emit('forceResults');

  /* ---------- Resultados ---------- */
  function renderResults() {
    const s = state;
    const key = JSON.stringify(s.results);
    if (resultsBuiltFor !== key) {
      resultsBuiltFor = key;
      const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
      $('#podium').innerHTML = s.results.map((r, i) => `<li style="animation-delay:${(s.results.length - i) * .35}s"><span class="medal">${medals[i]}</span>${esc(r.name)}${r.id === me ? ' <span class="muted small">(tú)</span>' : ''}<span class="sc">${r.avg.toFixed(1)}/10</span></li>`).join('');
      $('#resultCards').innerHTML = s.results.map(r => {
        const p = s.players.find(x => x.id === r.id);
        if (!p) return '';
        const detail = r.votes.length ? r.votes.map(v => `${esc(v.from)}: ${v.score}`).join(' · ') : 'Sin votos';
        return finalCard(p, `<div class="vote-box"><label>Nota media</label><span class="score-big">${r.avg.toFixed(1)}</span></div><div class="votes-detail">${detail}</div>`);
      }).join('');
      loadFinalImages($('#resultCards'));
      if (s.results[0]?.id === me) setTimeout(sfx.win, 800);
    }
    const isHost = s.hostId === me;
    $('#againBtn').hidden = !isHost;
    $('#againWait').textContent = isHost ? '' : 'El anfitrión puede empezar otra partida';
  }
  $('#againBtn').onclick = () => socket.emit('again');
})();
