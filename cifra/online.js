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
const SKIP_DISCONNECTED_MS=20000;

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
  let api=null,db=null;
  const ready=(async()=>{
    const v='10.12.2';
    const app=await import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`);
    const d=await import(`https://www.gstatic.com/firebasejs/${v}/firebase-database.js`);
    const fb=app.getApps().length?app.getApp():app.initializeApp(config);
    db=d.getDatabase(fb);api=d;
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
    serverTime(){return api?api.serverTimestamp():Date.now();}
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
    serverTime(){return Date.now();}
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
      const active=Object.values(cur.players||{}).filter(p=>p.connected!==false);
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
  stopTicker();clearTimeout(online.skipTimer);
  online.active=false;online.room=null;clearSession();
  if(net&&code&&pid){
    try{
      if(room&&room.status==='lobby'){
        if(room.host===pid)await net.remove('rooms/'+code);
        else await net.remove(`rooms/${code}/players/${pid}`);
      }else{
        await net.update(`rooms/${code}/players/${pid}`,{connected:false,left:true});
        if(room&&room.host===pid)await net.update(`rooms/${code}`,{closed:true});
      }
    }catch(_e){}
  }
  online.code=online.pid=null;
  if(!silent){if(typeof syncHomePlayersUI==='function')syncHomePlayersUI();show('home');window.scrollTo?.(0,0);}
}

// ── Sala de espera ──
function renderLobby(room){
  const players=sortedPlayers(room).filter(p=>p.connected!==false);
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

// ── Partida ──
function questionById(id){return bank.find(q=>q.id===id)||null;}
function pickOnlineQuestion(room){
  // El anfitrión usa su propio historial: no se repiten preguntas hasta agotar el banco.
  state.deck=(room.history?Object.values(room.history):[]).map(h=>questionById(h.qid)).filter(Boolean);
  return pickNextQuestion();
}
async function startGame(){
  const room=online.room;if(!room||room.host!==online.pid)return;
  const players=sortedPlayers(room).filter(p=>p.connected!==false);
  if(players.length<2)return;
  const btn=el('lobbyStart');busy(btn,true,'Empezando…');
  try{
    const rounds=parseInt(el('lobbyRounds').value,10)||10;
    state.deck=[];
    const q=pickNextQuestion();
    const playersPatch={};
    for(const [id,p] of Object.entries(room.players||{}))if(p.connected===false)playersPatch[id]=null;
    await online.net.update('rooms/'+online.code,{
      status:'playing',rounds,history:null,
      game:{idx:0,rounds,order:players.map(p=>p.id),turn:0,phase:'turn',qid:q.id,answers:null},
      ...Object.fromEntries(Object.entries(playersPatch).map(([id,v])=>['players/'+id,v]))
    });
  }catch(e){console.error(e);toast('No se ha podido empezar la partida.');busy(btn,false,'Comenzar');}
}

function computeScores(room,order,uptoIdx){
  const scores=Object.fromEntries(order.map(id=>[id,0]));
  const hist=room.history||{};
  for(const [k,h] of Object.entries(hist)){
    if(Number(k)>=uptoIdx)continue;
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
  const key=`${g.idx}|${g.phase}|${g.turn}`;
  if(g.phase==='turn'){
    const pid=order[g.turn];
    handleDisconnectedTurn(room,g,pid);
    if(key===online.renderKey)return;
    online.renderKey=key;
    if(pid===online.pid){
      stopTicker();
      state.turn=g.turn;state.answers=Array(order.length).fill(null);
      updateTurnUI();el('confirmBtn').disabled=false;show('turn');resetRuler();window.scrollTo?.(0,0);
      try{navigator.vibrate?.([60,40,60]);}catch(_e){}
    }else{
      el('waitName').textContent=playerName(room,pid);
      el('waitName').style.color=PLAYER_COLORS[g.turn%PLAYER_COLORS.length];
      el('waitRound').textContent=`Ronda ${g.idx+1}/${state.rounds}`;
      const pos=order.indexOf(online.pid);
      el('waitInfo').textContent=pos>g.turn?(pos===g.turn+1?'Tú vas después.':`Te toca dentro de ${pos-g.turn} turnos.`):'Tú ya has jugado esta ronda.';
      show('onlineWait');startTicker();window.scrollTo?.(0,0);
    }
  }else if(g.phase==='reveal'){
    if(key===online.renderKey)return;
    online.renderKey=key;stopTicker();
    const ans=room.history?.[g.idx]?.answers||g.answers||{};
    state.answers=order.map(id=>typeof ans[id]==='number'?ans[id]:null);
    renderReveal(order);
  }else if(g.phase==='final'){
    if(key===online.renderKey)return;
    online.renderKey=key;stopTicker();
    const scores=computeScores(room,order,Infinity);
    state.scores=order.map(id=>scores[id]||0);
    showFinal();
    el('againBtn').hidden=!online.isHost;
    el('againBtn').textContent='Volver a la sala';
    el('homeBtn').textContent='Salir de la sala';
  }
}

function renderReveal(order){
  // Los jugadores que no llegaron a responder (desconectados) no puntúan en esta ronda.
  const keep=order.map((_,i)=>state.answers[i]!==null);
  const fullPlayers=state.players,fullAnswers=state.answers,fullScores=state.scores;
  if(keep.every(Boolean)){showReveal();}
  else{
    state.players=fullPlayers.filter((_,i)=>keep[i]);state.answers=fullAnswers.filter((_,i)=>keep[i]);state.scores=fullScores.filter((_,i)=>keep[i]);
    if(state.players.length)showReveal();
    state.players=fullPlayers;state.answers=fullAnswers;state.scores=fullScores;
  }
  const btn=el('nextBtn');
  if(online.isHost){btn.disabled=false;btn.textContent=state.idx+1>=state.rounds?'Ver resultado final':'Siguiente ronda';}
  else{btn.disabled=true;btn.textContent='Esperando al anfitrión…';}
}

function handleDisconnectedTurn(room,g,pid){
  clearTimeout(online.skipTimer);
  if(room.host!==online.pid)return;
  const p=room.players?.[pid];
  if(p&&p.connected!==false)return;
  // Si el jugador al que le toca se ha ido, se le salta tras un margen por si vuelve.
  const key=`${g.idx}|${g.turn}`;
  online.skipTimer=setTimeout(()=>{
    const r=online.room;if(!r||!r.game)return;
    const gg=r.game;if(`${gg.idx}|${gg.turn}`!==key||gg.phase!=='turn')return;
    const pp=r.players?.[pid];if(pp&&pp.connected!==false)return;
    submitTurn(r,pid,null);
  },p?.left?0:SKIP_DISCONNECTED_MS);
}

async function submitTurn(room,pid,value){
  const g=room.game;const order=g.order||[];
  if(order[g.turn]!==pid)return;
  const answers={...(g.answers||{})};
  if(value!==null)answers[pid]=value;
  const last=g.turn+1>=order.length;
  const patch={'game/turn':g.turn+1};
  if(value!==null)patch[`game/answers/${pid}`]=value;
  if(last){patch['game/phase']='reveal';patch[`history/${g.idx}`]={qid:g.qid,answers};}
  await online.net.update('rooms/'+online.code,patch);
}

// Lo llama el juego al pulsar «Hecho» en una partida online.
online.submitAnswer=async function(value){
  const room=online.room;if(!room?.game)return;
  const g=room.game;
  if(g.phase!=='turn'||g.order[g.turn]!==online.pid)return;
  const key=`${g.idx}|${g.turn}`;
  if(online.sentKey===key)return;
  online.sentKey=key;
  el('confirmBtn').disabled=true;
  try{await submitTurn(room,online.pid,value);}
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
    // Los jugadores que se han ido no vuelven a tener turno.
    const order=(g.order||[]).filter(id=>room.players?.[id]&&!room.players[id].left);
    await online.net.update('rooms/'+online.code,{game:{idx:g.idx+1,rounds:g.rounds,order,turn:0,phase:'turn',qid:q.id,answers:null}});
  }catch(e){console.error(e);toast('No se ha podido continuar.');el('nextBtn').disabled=false;}
};
online.again=async function(){
  const room=online.room;if(!room||room.host!==online.pid)return;
  const patch={status:'lobby',game:null,history:null};
  for(const [id,p] of Object.entries(room.players||{}))if(p.connected===false)patch['players/'+id]=null;
  await online.net.update('rooms/'+online.code,patch);
};
online.leave=()=>leaveRoom(false);

function render(room){
  if(online.leaving)return;
  online.room=room;
  if(!room){toast('La sala se ha cerrado.');leaveRoom(false);return;}
  online.isHost=room.host===online.pid;
  if(!room.players?.[online.pid]){toast('Has salido de la sala.');leaveRoom(false);return;}
  if(room.closed&&!online.isHost){toast('El anfitrión ha cerrado la sala.');leaveRoom(false);return;}
  if(room.status==='lobby'){
    online.renderKey='';stopTicker();
    el('againBtn').hidden=false;el('againBtn').textContent='Volver a jugar';el('homeBtn').textContent='Volver al inicio';
    renderLobby(room);
  }else renderGame(room);
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
