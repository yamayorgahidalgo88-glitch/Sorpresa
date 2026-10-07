// ───────── Modo online ─────────
// Salas de hasta 5 jugadores sincronizadas con Firebase Realtime Database.
// El anfitrión elige las preguntas; cada jugador escribe su cifra cuando le toca.
// Con ?local=1 en la dirección se usa un servidor de pruebas dentro del propio
// navegador (varias pestañas), útil para probar sin Firebase.
(function(){
'use strict';

const MAX_PLAYERS=5;
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SESSION_KEY='cifra-online-session';
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
function playerName(room,pid){return room?.players?.[pid]?.name||'Jugador';}
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
  if(!getNet()){alert('El modo online todavía no está configurado.\n\nHay que rellenar el archivo firebase-config.js con los datos del proyecto de Firebase.');return;}
  online.mode=mode;
  el('onlineNameTitle').textContent=mode==='create'?'Crear sala':'Unirse a una sala';
  const input=el('onlineNameInput');
  input.value=online.name||'';
  el('onlineNameError').textContent='';
  show('onlineName');setTimeout(()=>input.focus(),60);
}
async function confirmName(){
  const name=el('onlineNameInput').value.trim().slice(0,18);
  if(!name){el('onlineNameError').textContent='Escribe tu nombre.';el('onlineNameInput').focus();return;}
  online.name=name;
  if(online.mode==='create'){await createRoom();}
  else{el('onlineCodeInput').value='';el('onlineCodeError').textContent='';show('onlineCode');setTimeout(()=>el('onlineCodeInput').focus(),60);}
}
function busy(btn,on,label){if(!btn)return;btn.disabled=on;if(label)btn.textContent=label;}

async function createRoom(){
  const net=getNet();const btn=el('onlineNameConfirm');
  busy(btn,true,'Creando sala…');
  try{
    const pid=randomId();
    for(let attempt=0;attempt<8;attempt++){
      const code=randomCode();
      const res=await net.transaction('rooms/'+code,cur=>{
        if(cur)return undefined;
        return {code,host:pid,status:'lobby',rounds:10,createdAt:Date.now(),seq:2,players:{[pid]:{name:online.name,joinedAt:1,connected:true}}};
      });
      if(res.committed){enterRoom(code,pid);return;}
    }
    throw new Error('No se ha podido generar un código libre. Inténtalo otra vez.');
  }catch(err){console.error(err);el('onlineNameError').textContent=err.message||'No se ha podido crear la sala.';}
  finally{busy(btn,false,'Confirmar');}
}

async function joinRoom(){
  const net=getNet();const code=normCode(el('onlineCodeInput').value);const err=el('onlineCodeError');const btn=el('onlineCodeConfirm');
  if(code.length!==4){err.textContent='El código tiene 4 caracteres.';return;}
  busy(btn,true,'Entrando…');err.textContent='';
  const pid=randomId();let reason='';
  try{
    const res=await net.transaction('rooms/'+code,cur=>{
      reason='';
      // Con Firebase la primera pasada puede llegar vacía antes de leer el servidor:
      // se devuelve tal cual para que lo compruebe con el dato real.
      if(!cur){reason='No existe ninguna sala con ese código.';return null;}
      if(cur.status!=='lobby'){reason='Esa partida ya ha empezado.';return undefined;}
      const active=Object.values(cur.players||{}).filter(p=>p.connected!==false&&!p.left&&!p.kicked);
      if(active.length>=MAX_PLAYERS){reason='La sala está llena (máximo 5 jugadores).';return undefined;}
      cur.players=cur.players||{};
      // Los desconectados no ocupan hueco, pero no se borran: una conexión que se
      // corta un momento (por ejemplo, la del anfitrión) no debe sacar a nadie de la sala.
      // El orden de la lista es el orden de llegada a la sala.
      const seq=cur.seq||(Object.keys(cur.players).length+1);
      cur.players[pid]={name:online.name,joinedAt:seq,connected:true};
      cur.seq=seq+1;
      return cur;
    });
    if(!res.committed||!res.value||!res.value.players?.[pid]){err.textContent=reason||'No se ha podido entrar en la sala.';return;}
    enterRoom(code,pid);
  }catch(e){console.error(e);err.textContent='No se ha podido conectar. Revisa tu conexión.';}
  finally{busy(btn,false,'Entrar');}
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
  online.active=false;online.room=null;clearSession();
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
      row.innerHTML=`<span class="lobby-num">${i+1}</span><span class="lobby-name"></span>${p.id===room.host?'<span class="lobby-tag">Anfitrión</span>':''}${p.id===online.pid?'<span class="lobby-tag you">Tú</span>':''}`;
      row.querySelector('.lobby-name').textContent=p.name;
      if(online.isHost&&p.id!==online.pid){
        const kick=document.createElement('button');kick.type='button';kick.className='lobby-kick';kick.textContent='Expulsar';
        kick.setAttribute('aria-label',`Expulsar a ${p.name}`);
        kick.addEventListener('click',()=>kickPlayer(p.id,p.name));
        row.appendChild(kick);
      }
    }else{
      row.innerHTML=`<span class="lobby-num">${i+1}</span><span class="lobby-empty">Esperando<span class="dots"><i>.</i><i>.</i><i>.</i></span></span>`;
    }
    list.appendChild(row);
  }
  el('lobbyCount').textContent=`${players.length}/${MAX_PLAYERS} jugadores`;
  const start=el('lobbyStart'),rounds=el('lobbyRoundsWrap'),wait=el('lobbyWaitHost');
  start.hidden=!online.isHost;rounds.hidden=!online.isHost;wait.hidden=online.isHost;
  if(online.isHost){
    el('lobbyRounds').value=String(room.rounds||10);
    start.disabled=players.length<2;
    start.textContent=players.length<2?'Hacen falta al menos 2 jugadores':'Comenzar';
  }
  if(!document.getElementById('lobby').classList.contains('active')){show('lobby');window.scrollTo?.(0,0);}
}
async function kickPlayer(pid,name){
  if(!online.isHost||pid===online.pid)return;
  if(!confirm(`¿Expulsar a ${name} de la sala?`))return;
  try{await online.net.update(`rooms/${online.code}/players/${pid}`,{kicked:true,kickReason:'host'});}
  catch(e){console.error(e);toast('No se ha podido expulsar al jugador.');}
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
  const btn=el('lobbyStart');busy(btn,true,'Empezando…');
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
  }catch(e){console.error(e);toast('No se ha podido empezar la partida.');busy(btn,false,'Comenzar');}
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
  if(!state.current){toast('Esta sala usa otra versión de las preguntas. Recarga la app.');return;}
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
        el('waitRound').textContent=`Ronda ${g.idx+1}/${state.rounds}`;
        show('onlineWait');startTicker();window.scrollTo?.(0,0);
      }
    }
    if(answered){
      const missing=pendingIds(room).map(id=>playerName(room,id));
      el('waitInfo').textContent=missing.length?`Falta${missing.length>1?'n':''}: ${missing.join(', ').replace(/, ([^,]*)$/,' y $1')}`:'';
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
    el('targetValue').textContent=`${state.current.approx?'≈ ':''}${fmtValue(state.current.answer,state.current)}${state.current.year?'':' '+displayUnit(state.current.unit)}`;
    el('targetLabel').textContent=state.current.text;
    ['resultLabels','resultColumns','resultDiffs'].forEach(id=>el(id).innerHTML='');
    el('winnerTitle').textContent='Nadie contestó a tiempo';el('winnerText').textContent='Esta ronda no suma puntos.';
  }
  state.players=fullPlayers;state.answers=fullAnswers;state.scores=fullScores;
  const btn=el('nextBtn');
  if(online.isHost){btn.disabled=false;btn.textContent=state.idx+1>=state.rounds?'Ver resultado final':'Siguiente ronda';}
  else{btn.disabled=true;btn.textContent='Esperando al anfitrión…';}
}

function renderFinal(room,g){
  // En el marcador final solo aparecen los que siguen en la partida.
  const ids=(g.order||[]).filter(id=>isActive(room,id));
  const scores=computeScores(room,g.order||[],Infinity);
  state.players=ids.map(id=>playerName(room,id));
  state.scores=ids.map(id=>scores[id]||0);
  if(g.solo){
    showFinal();
    el('finalTitle').textContent='Partida terminada';
    el('finalWinner').textContent=g.winner?playerName(room,g.winner):'Sin jugadores';
    el('finalSub').textContent='Es el único jugador que queda en la partida. Volviendo a la sala…';
    el('againBtn').hidden=true;
    clearTimeout(online.backTimer);
    if(online.isHost)online.backTimer=setTimeout(()=>online.again(),6000);
  }else{
    showFinal();
    el('againBtn').hidden=!online.isHost;
  }
  el('againBtn').textContent='Volver a la sala';
  el('homeBtn').textContent='Salir de la sala';
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
    el('turnTimerText').textContent=left>0?txt:'¡Tiempo!';
    el('turnTimerBar').style.transform=`scaleX(${left/TURN_MS})`;
    timer.classList.toggle('urgent',secs<=10);
    if(secs<=10&&secs>0&&!online.warned10){online.warned10=true;try{navigator.vibrate?.(200);}catch(_e){}}
    if(left<=0){el('confirmBtn').disabled=true;}
  }else{
    wt.textContent=left>0?`Quedan ${txt}`:'Se ha acabado el tiempo';
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
    if(!res.committed){toast('Se te ha acabado el tiempo.');}
  }
  catch(e){console.error(e);online.sentKey=null;toast('No se ha podido enviar tu cifra. Inténtalo otra vez.');el('confirmBtn').disabled=false;}
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
  }catch(e){console.error(e);toast('No se ha podido continuar.');el('nextBtn').disabled=false;}
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
    if(p.kicked&&!before.kicked)toast(p.kickReason==='timeout'?`${p.name} queda fuera: no ha contestado a tiempo dos veces seguidas.`:`El anfitrión ha expulsado a ${p.name}.`);
    else if(p.left&&!before.left&&!p.kicked)toast(`${p.name} ha salido de la partida.`);
  }
}

function render(room){
  if(online.leaving)return;
  const prev=online.room;
  online.room=room;
  if(!room){toast('La sala se ha cerrado.');leaveRoom(false);return;}
  online.isHost=room.host===online.pid;
  const me=room.players?.[online.pid];
  if(me?.kicked){toast(me.kickReason==='timeout'?'Te han sacado de la partida por no contestar a tiempo dos veces seguidas.':'El anfitrión te ha expulsado de la sala.');leaveRoom(false);return;}
  if(!me){toast('Has salido de la sala.');leaveRoom(false);return;}
  if(room.closed&&!online.isHost){toast('El anfitrión ha cerrado la sala.');leaveRoom(false);return;}
  announceChanges(prev,room);
  if(room.status==='lobby'){
    online.renderKey='';stopTicker();stopClock();clearTimeout(online.backTimer);
    el('againBtn').hidden=false;el('againBtn').textContent='Volver a jugar';el('homeBtn').textContent='Volver al inicio';
    renderLobby(room);
  }else{startClock();renderGame(room);runEnforcement();}
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
  on('lobbyLeave',()=>{if(confirm('¿Salir de la sala?'))leaveRoom(false);});
  on('waitLeave',()=>{if(confirm('¿Salir de la partida?'))leaveRoom(false);});
  on('lobbyCodeBtn',async()=>{
    const code=online.code;if(!code)return;
    try{await navigator.clipboard.writeText(code);toast('Código copiado');}catch(_e){toast('Código: '+code);}
  });
  el('onlineNameInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();confirmName();}});
  const code=el('onlineCodeInput');
  code?.addEventListener('input',()=>{const v=normCode(code.value);if(code.value!==v)code.value=v;});
  code?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();joinRoom();}});
  el('lobbyRounds')?.addEventListener('change',e=>{if(online.isHost&&online.code)online.net.update('rooms/'+online.code,{rounds:parseInt(e.target.value,10)||10});});

  // Si se recarga la página en mitad de una partida, se vuelve a la misma sala.
  const s=readSession();
  if(s&&s.code&&s.pid&&getNet()){online.name=s.name||'';enterRoom(s.code,s.pid);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindOnline);else bindOnline();
})();
