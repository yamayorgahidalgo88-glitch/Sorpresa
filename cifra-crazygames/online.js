// ───────── Modo online ─────────
// Salas de hasta 5 jugadores sincronizadas con Firebase Realtime Database.
// El anfitrión elige las preguntas; todos contestan a la vez. Versión para CrazyGames:
// las salas llevan app:'cg' y se integran las invitaciones del SDK (cg.js).
// Con ?local=1 en la dirección se usa un servidor de pruebas dentro del propio
// navegador (varias pestañas), útil para probar sin Firebase.
(function(){
'use strict';

const MAX_PLAYERS=5;
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SESSION_KEY='cifra-cg-online-session';
const APP_ID='cg';
const TEST_PARAMS=new URLSearchParams(location.search);
// Tiempo para contestar. Solo con el servidor de pruebas (?local=1&turno=N) se puede acortar.
const TURN_MS=TEST_PARAMS.get('local')==='1'&&Number(TEST_PARAMS.get('turno'))>0?Number(TEST_PARAMS.get('turno'))*1000:60000;
const GRACE_MS=1500;      // margen por la latencia de la red
const MAX_STRIKES=2;      // turnos seguidos sin contestar antes de la expulsión

const online={active:false,net:null,code:null,pid:null,isHost:false,room:null,unsub:null,mode:null,name:'',renderKey:'',skipTimer:null,tickerTimer:null,leaving:false};
window.CifraOnline=online;

// ── Utilidades ──
function randomCode(){let s='';const a=new Uint32Array(4);crypto.getRandomValues(a);for(const n of a)s+=CODE_CHARS[n%CODE_CHARS.length];return s;}
function randomId(){const a=new Uint32Array(3);crypto.getRandomValues(a);return 'p'+[...a].map(n=>n.toString(36)).join('');}
function normCode(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);}
function sortedPlayers(room){
  return Object.entries(room?.players||{}).map(([id,p])=>({id,...p})).sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0)||a.id.localeCompare(b.id));
}
function playerName(room,pid){return room?.players?.[pid]?.name||t('player',{n:''}).trim();}
function saveSession(){try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({code:online.code,pid:online.pid,name:online.name}));}catch(_e){}}
function clearSession(){try{sessionStorage.removeItem(SESSION_KEY);}catch(_e){}}
function readSession(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch(_e){return null;}}
function toast(msg){
  let t=el('onlineToast');
  if(!t){t=document.createElement('div');t.id='onlineToast';t.className='online-toast';document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),3200);
}

// ── Conexión: Firebase ──
function firebaseNet(config){
  let api=null,db=null,offset=0;
  const ready=(async()=>{
    const v='10.12.2';
    const app=await import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`);
    const d=await import(`https://www.gstatic.com/firebasejs/${v}/firebase-database.js`);
    const fb=app.getApps().length?app.getApp():app.initializeApp(config);
    db=d.getDatabase(fb);api=d;
    // Diferencia entre el reloj del móvil y el del servidor: todos ven la misma cuenta atrás.
    d.onValue(d.ref(db,'.info/serverTimeOffset'),s=>{offset=Number(s.val())||0;});
  })();
  const r=path=>api.ref(db,path);
  return {
    async transaction(path,fn){await ready;const res=await api.runTransaction(r(path),fn,{applyLocally:false});return {committed:res.committed,value:res.snapshot.val()};},
    async update(path,obj){await ready;await api.update(r(path),obj);},
    async remove(path){await ready;await api.remove(r(path));},
    async now(){return Date.now();},
    watch(path,cb){let off=()=>{};let stopped=false;ready.then(()=>{if(stopped)return;off=api.onValue(r(path),s=>cb(s.val()));});return ()=>{stopped=true;off();};},
    presence(path){
      let off=()=>{};
      ready.then(()=>{off=api.onValue(r('.info/connected'),s=>{if(s.val()!==true)return;api.onDisconnect(r(path)).set(false).then(()=>api.set(r(path),true));});});
      return ()=>{off();ready.then(()=>api.onDisconnect(r(path)).cancel()).catch(()=>{});};
    },
    now(){return Date.now()+offset;}
  };
}

// ── Conexión: servidor de pruebas local (varias pestañas del mismo navegador) ──
function localNet(){
  const KEY='cifra-local-db';
  const ch='BroadcastChannel' in window?new BroadcastChannel('cifra-local-db'):null;
  const listeners=new Set();
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(_e){return {};}};
  const save=db=>{localStorage.setItem(KEY,JSON.stringify(db));ch?.postMessage('x');listeners.forEach(f=>f());};
  const get=(db,path)=>path.split('/').filter(Boolean).reduce((o,k)=>o==null?undefined:o[k],db);
  const set=(db,path,val)=>{const ks=path.split('/').filter(Boolean);let o=db;for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null||typeof o[ks[i]]!=='object')o[ks[i]]={};o=o[ks[i]];}if(val===null||val===undefined)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=val;};
  const notify=()=>listeners.forEach(f=>f());
  ch&&(ch.onmessage=notify);window.addEventListener('storage',e=>{if(e.key===KEY)notify();});
  return {
    async transaction(path,fn){const db=load();const cur=get(db,path);const next=fn(cur===undefined?null:JSON.parse(JSON.stringify(cur)));if(next===undefined)return {committed:false,value:cur??null};set(db,path,next);save(db);return {committed:true,value:next};},
    async update(path,obj){const db=load();for(const [k,v] of Object.entries(obj))set(db,path+'/'+k,v);save(db);},
    async remove(path){const db=load();set(db,path,null);save(db);},
    watch(path,cb){let last;const f=()=>{const v=get(load(),path);const s=JSON.stringify(v??null);if(s!==last){last=s;cb(v??null);}};listeners.add(f);setTimeout(f,0);return ()=>listeners.delete(f);},
    presence(path){const db=load();set(db,path,true);save(db);const off=()=>{const d=load();set(d,path,false);save(d);};window.addEventListener('pagehide',off);return ()=>window.removeEventListener('pagehide',off);},
    now(){return Date.now();}
  };
}

function getNet(){
  if(online.net)return online.net;
  const params=new URLSearchParams(location.search);
  if(params.get('local')==='1'){online.net=localNet();return online.net;}
  const cfg=window.CIFRA_FIREBASE_CONFIG;
  if(!cfg||!cfg.databaseURL)return null;
  online.net=firebaseNet(cfg);return online.net;
}

// ── Pantallas de entrada ──
function openNameScreen(mode){
  if(!getNet()){uiAlert(t('notConfigured'));return;}
  online.mode=mode;
  el('onlineNameTitle').textContent=mode==='create'?t('createRoom'):t('joinRoom');
  const input=el('onlineNameInput');
  input.value=online.name||'';
  el('onlineNameError').textContent='';
  show('onlineName');setTimeout(()=>input.focus(),60);
}
async function confirmName(){
  const name=el('onlineNameInput').value.trim().slice(0,18);
  if(!name){el('onlineNameError').textContent=t('writeName');el('onlineNameInput').focus();return;}
  online.name=name;
  if(online.mode==='create'){await createRoom();}
  else if(online.pendingCode){const c=online.pendingCode;online.pendingCode=null;await joinRoom(c);}
  else{el('onlineCodeInput').value='';el('onlineCodeError').textContent='';show('onlineCode');setTimeout(()=>el('onlineCodeInput').focus(),60);}
}
function busy(btn,on,label){if(!btn)return;btn.disabled=on;if(label)btn.textContent=label;}

async function createRoom(){
  const net=getNet();const btn=el('onlineNameConfirm');
  busy(btn,true,t('creating'));
  try{
    const pid=randomId();
    for(let attempt=0;attempt<8;attempt++){
      const code=randomCode();
      const res=await net.transaction('rooms/'+code,cur=>{
        if(cur)return undefined;
        return {code,app:APP_ID,host:pid,status:'lobby',rounds:10,createdAt:Date.now(),seq:2,players:{[pid]:{name:online.name,joinedAt:1,connected:true}}};
      });
      if(res.committed){enterRoom(code,pid);return;}
    }
    throw new Error(t('noFreeCode'));
  }catch(err){console.error(err);el('onlineNameError').textContent=err.message||t('createFailed');}
  finally{busy(btn,false,t('confirm'));}
}

// Con «direct» (invitación de CrazyGames) se entra sin pasar por la pantalla del código;
// si algo falla, se muestra esa pantalla con el código ya escrito y el motivo.
async function joinRoom(direct){
  const net=getNet();
  if(typeof direct==='string'){el('onlineCodeInput').value=normCode(direct);show('onlineCode');}
  const code=normCode(el('onlineCodeInput').value);const err=el('onlineCodeError');const btn=el('onlineCodeConfirm');
  if(code.length!==4){err.textContent=t('codeLength');return;}
  busy(btn,true,t('entering'));err.textContent='';
  const pid=randomId();let reason='';
  try{
    const res=await net.transaction('rooms/'+code,cur=>{
      reason='';
      // Con Firebase la primera pasada puede llegar vacía antes de leer el servidor:
      // se devuelve tal cual para que lo compruebe con el dato real.
      if(!cur){reason=t('noRoom');return null;}
      if(cur.app!==APP_ID){reason=t('otherApp');return undefined;}
      if(cur.status!=='lobby'){reason=t('alreadyStarted');return undefined;}
      const active=Object.values(cur.players||{}).filter(p=>p.connected!==false&&!p.left&&!p.kicked);
      if(active.length>=MAX_PLAYERS){reason=t('roomFull');return undefined;}
      cur.players=cur.players||{};
      // Los desconectados no ocupan hueco, pero no se borran: una conexión que se
      // corta un momento (por ejemplo, la del anfitrión) no debe sacar a nadie de la sala.
      // El orden de la lista es el orden de llegada a la sala.
      const seq=cur.seq||(Object.keys(cur.players).length+1);
      cur.players[pid]={name:online.name,joinedAt:seq,connected:true};
      cur.seq=seq+1;
      return cur;
    });
    if(!res.committed||!res.value||!res.value.players?.[pid]){err.textContent=reason||t('joinFailed');return;}
    enterRoom(code,pid);
  }catch(e){console.error(e);err.textContent=t('connectFailed');}
  finally{busy(btn,false,t('enter'));}
}

function enterRoom(code,pid){
  const net=getNet();
  online.active=true;online.code=code;online.pid=pid;online.leaving=false;online.renderKey='';
  saveSession();
  online.stopPresence?.();online.stopPresence=net.presence(`rooms/${code}/players/${pid}/connected`);
  online.unsub?.();online.unsub=net.watch('rooms/'+code,room=>render(room));
}

async function leaveRoom(silent){
  const net=online.net;const {code,pid,room}=online;
  online.leaving=true;
  online.unsub?.();online.unsub=null;online.stopPresence?.();online.stopPresence=null;
  stopTicker();stopClock();clearTimeout(online.backTimer);
  online.active=false;online.room=null;clearSession();online.cgRoomKey='';window.CG?.leftRoom();
  if(net&&code&&pid){
    try{
      if(room&&room.status==='lobby'){
        if(room.host===pid)await net.remove('rooms/'+code);
        else await net.remove(`rooms/${code}/players/${pid}`);
      }else{
        // Durante la partida, si sale el anfitrión el mando pasa al siguiente jugador.
        const heir=room&&room.host===pid?gamePlayers(room).find(p=>p.id!==pid):null;
        const patch={[`players/${pid}/connected`]:false,[`players/${pid}/left`]:true};
        if(room&&room.host===pid){if(heir)patch.host=heir.id;else patch.closed=true;}
        await net.update(`rooms/${code}`,patch);
      }
    }catch(_e){}
  }
  online.code=online.pid=null;
  if(!silent){if(typeof syncHomePlayersUI==='function')syncHomePlayersUI();show('home');window.scrollTo?.(0,0);}
}

// ── Estado de los jugadores ──
// left: ha pulsado «Salir»; kicked: expulsado (por el anfitrión o por no contestar a tiempo).
function isActive(room,id){const p=room?.players?.[id];return !!p&&!p.left&&!p.kicked;}
function lobbyPlayers(room){return sortedPlayers(room).filter(p=>p.connected!==false&&!p.left&&!p.kicked);}
function gamePlayers(room){return sortedPlayers(room).filter(p=>!p.left&&!p.kicked);}
function clean(o){return JSON.parse(JSON.stringify(o));}
function netNow(){return online.net?.now?.()??Date.now();}

// ── Sala de espera ──
function renderLobby(room){
  const players=lobbyPlayers(room);
  online.isHost=room.host===online.pid;
  el('lobbyCode').textContent=room.code||online.code;
  const list=el('lobbyList');list.innerHTML='';
  for(let i=0;i<MAX_PLAYERS;i++){
    const p=players[i];const row=document.createElement('div');
    row.className='lobby-slot'+(p?' filled':'')+(p&&p.id===online.pid?' me':'');
    row.style.setProperty('--slot-color',PLAYER_COLORS[i%PLAYER_COLORS.length]);
    if(p){
      row.innerHTML=`<span class="lobby-num">${i+1}</span><span class="lobby-name"></span>${p.id===room.host?`<span class="lobby-tag">${escapeHtml(t('host'))}</span>`:''}${p.id===online.pid?`<span class="lobby-tag you">${escapeHtml(t('you'))}</span>`:''}`;
      row.querySelector('.lobby-name').textContent=p.name;
      if(online.isHost&&p.id!==online.pid){
        const kick=document.createElement('button');kick.type='button';kick.className='lobby-kick';kick.textContent=t('kick');
        kick.setAttribute('aria-label',t('kickAria',{name:p.name}));
        kick.addEventListener('click',()=>kickPlayer(p.id,p.name));
        row.appendChild(kick);
      }
    }else{
      row.innerHTML=`<span class="lobby-num">${i+1}</span><span class="lobby-empty">${escapeHtml(t('waiting'))}<span class="dots"><i>.</i><i>.</i><i>.</i></span></span>`;
    }
    list.appendChild(row);
  }
  el('lobbyCount').textContent=t('lobbyCount',{n:players.length,max:MAX_PLAYERS});
  syncCGRoom(room,players.length);
  el('lobbyInvite').hidden=!window.CG?.inviteLink(room.code||online.code);
  const start=el('lobbyStart'),rounds=el('lobbyRoundsWrap'),wait=el('lobbyWaitHost');
  start.hidden=!online.isHost;rounds.hidden=!online.isHost;wait.hidden=online.isHost;
  if(online.isHost){
    el('lobbyRounds').value=String(room.rounds||10);
    start.disabled=players.length<2;
    start.textContent=players.length<2?t('needTwo'):t('begin');
  }
  if(!document.getElementById('lobby').classList.contains('active')){show('lobby');window.scrollTo?.(0,0);}
}
async function kickPlayer(pid,name){
  if(!online.isHost||pid===online.pid)return;
  if(!await uiConfirm(t('kickConfirm',{name})))return;
  try{await online.net.update(`rooms/${online.code}/players/${pid}`,{kicked:true,kickReason:'host'});}
  catch(e){console.error(e);toast(t('kickFailed'));}
}

// ── Reglas de la partida (se aplican dentro de transacciones) ──
// En cada ronda contestan todos a la vez. «pending» son los que siguen en la partida y aún no han contestado.
function pendingIds(room){const g=room.game;return (g.order||[]).filter(id=>isActive(room,id)&&typeof g.answers?.[id]!=='number');}
function finishRound(room){
  const g=room.game;g.phase='reveal';
  if(!room.history||Array.isArray(room.history))room.history=Object.assign({},room.history||{});
  room.history[g.idx]={qid:g.qid,answers:g.answers||{}};
}
// Si solo queda un jugador, la partida termina y gana él.
function checkSolo(room){
  if(room.status!=='playing'||!room.game||room.game.phase==='final')return false;
  const left=gamePlayers(room);
  if(left.length>1)return false;
  room.game.phase='final';room.game.solo=true;room.game.winner=left[0]?.id||null;room.game.finishedAt=Date.now();
  return true;
}
// Cierra la ronda cuando han contestado todos, o cuando se acaba el minuto:
// los que no han contestado suman un fallo y a los dos seguidos quedan fuera.
function enforceRules(room,now){
  if(!room||room.status!=='playing'||!room.game)return false;
  if(checkSolo(room))return true;
  const g=room.game;if(g.phase!=='turn')return false;
  const pending=pendingIds(room);
  if(!pending.length){finishRound(room);return true;}
  if(now>(g.turnStartedAt||now)+TURN_MS+GRACE_MS){
    for(const pid of pending){
      const p=room.players[pid];
      p.strikes=(p.strikes||0)+1;
      if(p.strikes>=MAX_STRIKES){p.kicked=true;p.kickReason='timeout';}
    }
    if(!checkSolo(room))finishRound(room);
    return true;
  }
  return false;
}
let enforcing=false;
async function runEnforcement(){
  const room=online.room;
  if(enforcing||!room||room.status!=='playing'||!online.active)return;
  const now=netNow();
  if(!enforceRules(clean(room),now))return;
  enforcing=true;
  try{
    await online.net.transaction('rooms/'+online.code,cur=>{
      if(!cur)return cur;
      return enforceRules(cur,netNow())?clean(cur):undefined;
    });
  }catch(e){console.warn('No se ha podido aplicar el turno',e);}
  finally{enforcing=false;}
}

// ── Partida ──
function questionById(id){return bank.find(q=>q.id===id)||null;}
function pickOnlineQuestion(room){
  // El anfitrión usa su propio historial: no se repiten preguntas hasta agotar el banco.
  state.deck=(room.history?Object.values(room.history):[]).map(h=>questionById(h?.qid)).filter(Boolean);
  return pickNextQuestion();
}
async function startGame(){
  const room=online.room;if(!room||room.host!==online.pid)return;
  const players=lobbyPlayers(room);
  if(players.length<2)return;
  const btn=el('lobbyStart');busy(btn,true,t('starting'));
  try{
    const rounds=parseInt(el('lobbyRounds').value,10)||10;
    state.deck=[];
    const q=pickNextQuestion();
    const patch={status:'playing',rounds,history:null,
      game:{idx:0,rounds,order:players.map(p=>p.id),phase:'turn',qid:q.id,answers:null,turnStartedAt:netNow()}};
    for(const [id,p] of Object.entries(room.players||{})){
      if(p.connected===false||p.left||p.kicked)patch['players/'+id]=null;
      else patch[`players/${id}/strikes`]=null;
    }
    await online.net.update('rooms/'+online.code,patch);
  }catch(e){console.error(e);toast(t('startFailed'));busy(btn,false,t('begin'));}
}

function computeScores(room,order,uptoIdx){
  const scores=Object.fromEntries(order.map(id=>[id,0]));
  const hist=room.history||{};
  for(const [k,h] of Object.entries(hist)){
    if(!h||Number(k)>=uptoIdx)continue;
    const q=questionById(h.qid);if(!q)continue;
    const ans=h.answers||{};
    const ids=order.filter(id=>typeof ans[id]==='number');if(!ids.length)continue;
    const diffs=ids.map(id=>Math.abs(ans[id]-q.answer));const min=Math.min(...diffs);
    const winners=ids.filter((id,i)=>diffs[i]===min);
    if(winners.length===1)scores[winners[0]]++;
  }
  return scores;
}
function loadRoundIntoState(room,g){
  const order=g.order||[];
  state.players=order.map(id=>playerName(room,id));
  state.rounds=g.rounds||room.rounds||10;
  state.idx=g.idx||0;
  state.current=questionById(g.qid);
  const scores=computeScores(room,order,state.idx);
  state.scores=order.map(id=>scores[id]||0);
  return order;
}

function renderGame(room){
  const g=room.game;if(!g)return;
  const order=loadRoundIntoState(room,g);
  if(!state.current){toast(t('otherVersion'));return;}
  if(g.phase==='turn'){
    const answered=typeof g.answers?.[online.pid]==='number';
    const key=`${g.idx}|turn|${answered}`;
    if(key!==online.renderKey){
      online.renderKey=key;
      if(!answered){
        online.warned10=false;stopTicker();
        state.turn=Math.max(0,order.indexOf(online.pid));state.answers=Array(order.length).fill(null);
        updateTurnUI();el('confirmBtn').disabled=false;show('turn');resetRuler();window.scrollTo?.(0,0);
        try{navigator.vibrate?.([60,40,60]);}catch(_e){}
      }else{
        el('waitRound').textContent=t('roundOf',{i:g.idx+1,n:state.rounds});
        show('onlineWait');startTicker();window.scrollTo?.(0,0);
      }
    }
    if(answered){
      const missing=pendingIds(room).map(id=>playerName(room,id));
      el('waitInfo').textContent=missing.length?t('missing',{names:joinNames(missing)}):'';
    }
    updateClock();
  }else if(g.phase==='reveal'){
    const key=`${g.idx}|reveal`;
    if(key===online.renderKey)return;
    online.renderKey=key;stopTicker();
    const ans=room.history?.[g.idx]?.answers||g.answers||{};
    state.answers=order.map(id=>typeof ans[id]==='number'?ans[id]:null);
    renderReveal(order);
  }else if(g.phase==='final'){
    const key=`${g.idx}|final`;
    if(key===online.renderKey)return;
    online.renderKey=key;stopTicker();
    renderFinal(room,g);
  }
}

function renderReveal(order){
  // Solo aparecen los jugadores que contestaron en esta ronda.
  const keep=order.map((_,i)=>state.answers[i]!==null);
  const fullPlayers=state.players,fullAnswers=state.answers,fullScores=state.scores;
  state.players=fullPlayers.filter((_,i)=>keep[i]);state.answers=fullAnswers.filter((_,i)=>keep[i]);state.scores=fullScores.filter((_,i)=>keep[i]);
  if(state.players.length)showReveal();
  else{
    show('reveal');
    el('targetValue').textContent=`${state.current.approx?'≈ ':''}${fmtValue(state.current.answer,state.current)}${state.current.year?'':' '+displayUnit(state.current)}`;
    el('targetLabel').textContent=qText(state.current);
    el('sourceName').textContent=sourceName(state.current.source);el('sourceDate').textContent='';
    ['resultLabels','resultColumns','resultDiffs'].forEach(id=>el(id).innerHTML='');
    el('winnerTitle').textContent=t('nobodyAnswered');el('winnerText').textContent=t('noPoints');
  }
  state.players=fullPlayers;state.answers=fullAnswers;state.scores=fullScores;
  const btn=el('nextBtn');
  if(online.isHost){btn.disabled=false;btn.textContent=state.idx+1>=state.rounds?t('seeFinal'):t('nextRound');}
  else{btn.disabled=true;btn.textContent=t('waitingHost');}
}

function renderFinal(room,g){
  // En el marcador final solo aparecen los que siguen en la partida.
  const ids=(g.order||[]).filter(id=>isActive(room,id));
  const scores=computeScores(room,g.order||[],Infinity);
  state.players=ids.map(id=>playerName(room,id));
  state.scores=ids.map(id=>scores[id]||0);
  if(g.solo){
    showFinal();
    el('finalTitle').textContent=t('gameFinished');
    el('finalWinner').textContent=g.winner?playerName(room,g.winner):t('noPlayers');
    el('finalSub').textContent=t('lastOne');
    el('againBtn').hidden=true;
    clearTimeout(online.backTimer);
    if(online.isHost)online.backTimer=setTimeout(()=>online.again(),6000);
  }else{
    showFinal();
    el('againBtn').hidden=!online.isHost;
    // Pausa natural al acabar la partida: aquí puede salir un anuncio.
    window.CG?.adBreak();
  }
  el('againBtn').textContent=t('backToRoom');
  el('homeBtn').textContent=t('leaveRoom');
}

// ── Cuenta atrás de cada ronda ──
function updateClock(){
  const room=online.room;const g=room?.game;
  const timer=el('turnTimer'),wt=el('waitTimer');
  if(!online.active||!g||room.status!=='playing'||g.phase!=='turn'){timer.hidden=true;wt.hidden=true;return;}
  const left=Math.max(0,(g.turnStartedAt||netNow())+TURN_MS-netNow());
  const secs=Math.ceil(left/1000);
  const label=`0:${String(Math.min(59,secs)).padStart(2,'0')}`.replace('0:60','1:00');
  const txt=secs>=60?'1:00':label;
  const mine=isActive(room,online.pid)&&typeof g.answers?.[online.pid]!=='number';
  timer.hidden=!mine;wt.hidden=mine;
  if(mine){
    el('turnTimerText').textContent=left>0?txt:t('timeUp');
    el('turnTimerBar').style.transform=`scaleX(${left/TURN_MS})`;
    timer.classList.toggle('urgent',secs<=10);
    if(secs<=10&&secs>0&&!online.warned10){online.warned10=true;try{navigator.vibrate?.(200);}catch(_e){}}
    if(left<=0){el('confirmBtn').disabled=true;}
  }else{
    wt.textContent=left>0?t('timeLeft',{t:txt}):t('timeOver');
    wt.classList.toggle('urgent',secs<=10);
  }
}
function startClock(){
  if(online.clockTimer)return;
  online.clockTimer=setInterval(()=>{updateClock();runEnforcement();},500);
}
function stopClock(){clearInterval(online.clockTimer);online.clockTimer=null;const t=el('turnTimer'),w=el('waitTimer');if(t)t.hidden=true;if(w)w.hidden=true;}

// Lo llama el juego al pulsar «Hecho» en una partida online.
online.submitAnswer=async function(value){
  const room=online.room;if(!room?.game)return;
  const g=room.game;
  if(g.phase!=='turn'||typeof g.answers?.[online.pid]==='number')return;
  const key=`${g.idx}`;
  if(online.sentKey===key)return;
  online.sentKey=key;
  el('confirmBtn').disabled=true;
  const pid=online.pid,idx=g.idx;
  try{
    const res=await online.net.transaction('rooms/'+online.code,cur=>{
      if(!cur)return cur;
      const gg=cur.game;
      if(!gg||gg.phase!=='turn'||gg.idx!==idx||!isActive(cur,pid))return undefined;
      if(typeof gg.answers?.[pid]==='number')return undefined;
      if(netNow()>(gg.turnStartedAt||0)+TURN_MS+GRACE_MS)return undefined;
      gg.answers=gg.answers||{};gg.answers[pid]=value;
      if(cur.players[pid])cur.players[pid].strikes=0;
      if(!pendingIds(cur).length)finishRound(cur);
      return clean(cur);
    });
    if(!res.committed){toast(t('youTimedOut'));}
  }
  catch(e){console.error(e);online.sentKey=null;toast(t('sendFailed'));el('confirmBtn').disabled=false;}
};
// Lo llama el juego al pulsar «Siguiente ronda».
online.next=async function(){
  const room=online.room;if(!room?.game||room.host!==online.pid)return;
  const g=room.game;if(g.phase!=='reveal')return;
  el('nextBtn').disabled=true;
  try{
    if(g.idx+1>=g.rounds){await online.net.update('rooms/'+online.code,{'game/phase':'final'});return;}
    const q=pickOnlineQuestion(room);
    // Los que se han ido o han sido expulsados ya no juegan.
    const order=gamePlayers(room).map(p=>p.id);
    await online.net.update('rooms/'+online.code,{game:{idx:g.idx+1,rounds:g.rounds,order,phase:'turn',qid:q.id,answers:null,turnStartedAt:netNow()}});
  }catch(e){console.error(e);toast(t('nextFailed'));el('nextBtn').disabled=false;}
};
online.again=async function(){
  clearTimeout(online.backTimer);
  const room=online.room;if(!room||room.host!==online.pid)return;
  const patch={status:'lobby',game:null,history:null};
  for(const [id,p] of Object.entries(room.players||{})){
    if(p.connected===false||p.left||p.kicked)patch['players/'+id]=null;
    else patch[`players/${id}/strikes`]=null;
  }
  await online.net.update('rooms/'+online.code,patch);
};
online.leave=()=>leaveRoom(false);

// Avisos cuando alguien sale o es expulsado durante la partida.
function announceChanges(prev,room){
  if(!prev||!room||room.status!=='playing')return;
  for(const [id,p] of Object.entries(room.players||{})){
    const before=prev.players?.[id];if(!before||id===online.pid)continue;
    if(p.kicked&&!before.kicked)toast(p.kickReason==='timeout'?t('kickedTimeout',{name:p.name}):t('kickedByHost',{name:p.name}));
    else if(p.left&&!before.left&&!p.kicked)toast(t('playerLeft',{name:p.name}));
  }
}

function render(room){
  if(online.leaving)return;
  const prev=online.room;
  online.room=room;
  if(!room){toast(t('roomClosed'));leaveRoom(false);return;}
  online.isHost=room.host===online.pid;
  const me=room.players?.[online.pid];
  if(me?.kicked){toast(me.kickReason==='timeout'?t('youTimeoutOut'):t('youKicked'));leaveRoom(false);return;}
  if(!me){toast(t('youLeft'));leaveRoom(false);return;}
  if(room.closed&&!online.isHost){toast(t('hostClosed'));leaveRoom(false);return;}
  announceChanges(prev,room);
  if(room.status==='lobby'){
    online.renderKey='';stopTicker();stopClock();clearTimeout(online.backTimer);
    el('againBtn').hidden=false;el('againBtn').textContent=t('playAgain');el('homeBtn').textContent=t('backHome');
    renderLobby(room);
  }else{syncCGRoom(room,0);startClock();renderGame(room);runEnforcement();}
}
// Le cuenta a CrazyGames en qué sala estamos y si se puede entrar (solo en la sala de espera y con hueco).
function syncCGRoom(room,count){
  const joinable=room.status==='lobby'&&count<MAX_PLAYERS;
  const key=`${room.code||online.code}|${joinable}`;
  if(key===online.cgRoomKey)return;
  online.cgRoomKey=key;window.CG?.updateRoom(room.code||online.code,joinable);
}

// ── Animación de espera: una fila de números aleatorios que no acaba nunca ──
function startTicker(){
  const row=el('waitTicker');if(!row||online.tickerTimer)return;
  row.innerHTML='';
  const add=()=>{
    const s=document.createElement('span');
    s.textContent=String(Math.floor(Math.random()*10));
    s.style.setProperty('--c',PLAYER_COLORS[Math.floor(Math.random()*PLAYER_COLORS.length)]);
    row.appendChild(s);
    while(row.children.length>18)row.firstElementChild.remove();
  };
  for(let i=0;i<18;i++)add();
  online.tickerTimer=setInterval(add,150);
}
function stopTicker(){clearInterval(online.tickerTimer);online.tickerTimer=null;}

// ── Botones ──
function bindOnline(){
  const on=(id,fn)=>el(id)?.addEventListener('click',e=>{e.preventDefault();fn(e);});
  on('createRoomBtn',()=>openNameScreen('create'));
  on('joinRoomBtn',()=>openNameScreen('join'));
  on('onlineNameConfirm',confirmName);
  on('onlineNameBack',()=>show('home'));
  on('onlineCodeConfirm',joinRoom);
  on('onlineCodeBack',()=>show('onlineName'));
  on('lobbyStart',startGame);
  on('lobbyLeave',async()=>{if(await uiConfirm(t('confirmLeaveRoom')))leaveRoom(false);});
  on('waitLeave',async()=>{if(await uiConfirm(t('confirmLeaveGame')))leaveRoom(false);});
  on('lobbyInvite',async()=>{
    const link=window.CG?.inviteLink(online.code);if(!link)return;
    try{await navigator.clipboard.writeText(link);toast(t('linkCopied'));}catch(_e){toast(link);}
  });
  on('lobbyCodeBtn',async()=>{
    const code=online.code;if(!code)return;
    try{await navigator.clipboard.writeText(code);toast(t('codeCopied'));}catch(_e){toast(t('codeIs',{code}));}
  });
  el('onlineNameInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();confirmName();}});
  const code=el('onlineCodeInput');
  code?.addEventListener('input',()=>{const v=normCode(code.value);if(code.value!==v)code.value=v;});
  code?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();joinRoom();}});
  el('lobbyRounds')?.addEventListener('change',e=>{if(online.isHost&&online.code)online.net.update('rooms/'+online.code,{rounds:parseInt(e.target.value,10)||10});});

  // Si se recarga la página en mitad de una partida, se vuelve a la misma sala.
  const s=readSession();
  if(s&&s.code&&s.pid&&getNet()){online.name=s.name||'';enterRoom(s.code,s.pid);return;}

  // Invitaciones de CrazyGames: al abrir el juego desde un enlace o al aceptar una invitación jugando.
  window.CG?.onJoinRoom(code=>{if(online.code!==code)acceptInvite(code);});
  const invited=window.CG?.inviteCode();
  if(invited)acceptInvite(invited);
  else if(window.CG?.isInstantMultiplayer())instantRoom();
}
async function cgName(){
  if(online.name)return online.name;
  const u=await window.CG?.username();
  if(u)online.name=String(u).slice(0,18);
  return online.name;
}
// Entra en la sala de la invitación. Con usuario de CrazyGames se entra directamente;
// sin él, primero se pide el nombre.
async function acceptInvite(code){
  if(!getNet())return;
  code=normCode(code);if(code.length!==4)return;
  if(online.active)await leaveRoom(true);
  const name=await cgName();
  if(name){online.mode='join';await joinRoom(code);}
  else{online.pendingCode=code;openNameScreen('join');}
}
// Multijugador instantáneo: se crea una sala nada más abrir el juego.
async function instantRoom(){
  if(!getNet())return;
  const name=await cgName();
  if(!name){openNameScreen('create');return;}
  online.mode='create';await createRoom();
}
// Rellena el nombre con el usuario de CrazyGames al abrir la pantalla del nombre.
const baseOpenNameScreen=openNameScreen;
openNameScreen=function(mode){baseOpenNameScreen(mode);if(!online.name)cgName().then(n=>{const i=el('onlineNameInput');if(n&&i&&!i.value)i.value=n;});};
online.boot=bindOnline;
})();
