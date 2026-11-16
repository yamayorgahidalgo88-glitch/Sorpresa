// Textos de la interfaz en inglés y español. El idioma sale del SDK de CrazyGames
// (systemInfo.locale) o, si no está disponible, del navegador. Por defecto, inglés.
(function(){
'use strict';
const STR={
  en:{
    tagline:'How close can you get?',
    heroEyebrow:'local game',
    heroTitle:'You don’t need to know it.<br>Just nail it.',
    heroText:'Take turns sliding the ruler to pick your number. Then the real answer is revealed. Closest wins.',
    rounds:'Rounds',
    rule1:'Real, curious question',rule2:'Slide your number',rule3:'Closest one wins',
    playOnline:'Play online',playOnlineSub:'everyone on their own device · up to 5',
    createRoom:'Create room',joinRoom:'Join room',startGame:'Start game',howToPlay:'How to play?',
    howToPlayText:'Each round shows a question. Pass the device around and, one by one, everyone picks their number by dragging the ruler (or tapping the number to type it). Once everyone has answered, the real answer is revealed with a chart of all the guesses. The closest player wins the round.\n\nOnline, everyone answers at the same time on their own device, with one minute per round.\n\nDon’t know something in the question? Tap the underlined words to see what they are.',
    players:'{n} players',player:'Player {n}',addPlayer:'＋ Add player',maxPlayers:'Maximum of 5 players',removePlayer:'Remove player {n}',
    roundOf:'Round {i}/{n}',roundOfLong:'Round {i} of {n}',
    tapUnderlined:'Tap the underlined words to see what they are',
    yourAnswer:'Your answer',tapToType:'Tap to type your number',typeNumber:'Type your number',rulerLabel:'Ruler to pick your number',
    rulerHint:'Drag the ruler · tap the number to type it',done:'Done',year:'year',years:'years',units:'units',
    passTitle:'Pass the device',passText:'Now it’s {next}’s turn. {cur}’s answer has been saved.',continueWith:'Continue with {name}',continue:'Continue',
    correctAnswer:'correct answer',source:'Source:',roundedNote:'Figure rounded according to the source.',
    nextRound:'Next round',seeFinal:'See final results',nailedIt:'Nailed it!',
    roundWinner:'{name} wins the round',nailedExact:'Nailed the exact answer!',
    missedBy:'Their guess was {diff} away from the correct answer.',
    roundTie:'It’s a tie this round',tieText:'{names} were equally close to the correct answer.',and:' and ',
    gameOver:'game over',gameFinished:'Victory!',totalTie:'Total tie',tieSub:'Nobody finished ahead.',evenGame:'Even game',
    winsScore:'{name} wins {a}-{b}.',perfectGame:' Perfect game.',tieAt:'Tied at {n} rounds won.',roundsWon:'rounds won',
    questionsStat:'{n} questions',roundsStat:'{n} rounds',officialData:'real data',
    playAgain:'Play again',backHome:'Back to start',backToRoom:'Back to the room',leaveRoom:'Leave room',
    whatIsIt:'What is it?',close:'Close',contextNote:'Background info · doesn’t give away the answer',
    back:'← Back',onlineGame:'online game',yourName:'Your name',namePlaceholder:'Type your name',confirm:'Confirm',
    privacyNote:'We only store your nickname while the room exists.',
    joinARoom:'join a room',roomCode:'Room code',enter:'Enter',leave:'← Leave',leaveShort:'Leave',copyCode:'Copy code',
    shareCode:'Share it so others can join · tap to copy',waitingPlayers:'Waiting for players',waiting:'Waiting',
    begin:'Start',needTwo:'You need at least 2 players',hostWillStart:'The host will start the game when everyone is here.',
    waitingOthers:'Waiting for the other players',inviteFriends:'Invite friends',linkCopied:'Invite link copied',
    host:'Host',you:'You',kick:'Kick',kickAria:'Kick {name}',kickConfirm:'Kick {name} out of the room?',
    lobbyCount:'{n}/{max} players',
    notConfigured:'Online mode isn’t available right now.',
    writeName:'Type your name.',creating:'Creating room…',noFreeCode:'Couldn’t generate a free code. Please try again.',
    createFailed:'Couldn’t create the room.',codeLength:'The code has 4 characters.',entering:'Joining…',
    noRoom:'There’s no room with that code.',alreadyStarted:'That game has already started.',roomFull:'The room is full (5 players max).',
    joinFailed:'Couldn’t join the room.',connectFailed:'Couldn’t connect. Check your connection.',otherApp:'That room belongs to another version of the game.',
    kickFailed:'Couldn’t kick the player.',starting:'Starting…',startFailed:'Couldn’t start the game.',
    otherVersion:'This room uses a different version of the questions. Reload the game.',
    missing:'Missing: {names}',
    nobodyAnswered:'Nobody answered in time',noPoints:'This round doesn’t score.',
    waitingHost:'Waiting for the host…',noPlayers:'No players',
    lastOne:'They’re the only player left in the game. Back to the room…',
    timeUp:'Time’s up!',timeLeft:'{t} left',timeOver:'Time is up',
    youTimedOut:'You ran out of time.',sendFailed:'Couldn’t send your number. Please try again.',nextFailed:'Couldn’t continue.',
    kickedTimeout:'{name} is out: didn’t answer in time two rounds in a row.',kickedByHost:'The host kicked {name}.',playerLeft:'{name} left the game.',
    roomClosed:'The room has been closed.',youTimeoutOut:'You were removed from the game for not answering in time two rounds in a row.',
    youKicked:'The host kicked you out of the room.',youLeft:'You left the room.',hostClosed:'The host closed the room.',
    codeCopied:'Code copied',codeIs:'Code: {code}',
    confirmLeaveRoom:'Leave the room?',confirmLeaveGame:'Leave the game?',ok:'OK',cancel:'Cancel',yes:'Yes',
    errorConfirm:'Couldn’t confirm the number.',errorContinue:'Couldn’t continue the game.',errorStart:'Couldn’t start the game.',
    errorNextPlayer:'Couldn’t continue with the next player.',errorNewGame:'Couldn’t start the new game.',unknownError:'Unknown error'
  },
  es:{
    tagline:'¿Qué tan cerca estás?',
    heroEyebrow:'partida local',
    heroTitle:'No hace falta saberlo.<br>Hay que clavarlo.',
    heroText:'Deslizad la regla para elegir vuestra cifra por turnos. Después se descubre el dato real. El que esté más cerca gana.',
    rounds:'Rondas',
    rule1:'Pregunta real y curiosa',rule2:'Desliza tu cifra',rule3:'Gana quien más se acerque',
    playOnline:'Jugar online',playOnlineSub:'cada uno con su dispositivo · máx. 5',
    createRoom:'Crear sala',joinRoom:'Unirse a sala',startGame:'Empezar partida',howToPlay:'¿Cómo se juega?',
    howToPlayText:'En cada ronda aparece una pregunta. Os pasáis el dispositivo y cada uno elige su cifra por turnos arrastrando la regla (o tocando la cifra para escribirla). Cuando todos han respondido, se revela el dato real y un gráfico con todas las cifras. Gana la ronda quien esté más cerca.\n\nEn el modo online todos contestan a la vez en su dispositivo, con un minuto por ronda.\n\nSi no conoces algo de la pregunta, toca lo subrayado para ver qué es.',
    players:'{n} jugadores',player:'Jugador {n}',addPlayer:'＋ Añadir jugador',maxPlayers:'Máximo de 5 jugadores',removePlayer:'Eliminar jugador {n}',
    roundOf:'Ronda {i}/{n}',roundOfLong:'Ronda {i} de {n}',
    tapUnderlined:'Toca lo subrayado para ver qué es',
    yourAnswer:'Tu respuesta',tapToType:'Toca para escribir la cifra',typeNumber:'Escribe tu cifra',rulerLabel:'Regla para elegir la cifra',
    rulerHint:'Arrastra la regla · toca la cifra para escribirla',done:'Hecho',year:'año',years:'años',units:'unidades',
    passTitle:'Pasa el dispositivo',passText:'Ahora le toca a {next}. La respuesta de {cur} queda guardada.',continueWith:'Continuar con {name}',continue:'Continuar',
    correctAnswer:'dato correcto',source:'Fuente:',roundedNote:'Cifra redondeada según la fuente.',
    nextRound:'Siguiente ronda',seeFinal:'Ver resultado final',nailedIt:'¡Clavado!',
    roundWinner:'{name} se lleva la ronda',nailedExact:'¡Ha clavado el dato exacto!',
    missedBy:'Su estimación quedó a {diff} del dato correcto.',
    roundTie:'Empate en la ronda',tieText:'{names} quedaron a la misma distancia del dato correcto.',and:' y ',
    gameOver:'partida terminada',gameFinished:'¡Victoria!',totalTie:'Empate total',tieSub:'Nadie ha terminado por encima del otro.',evenGame:'Partida igualada',
    winsScore:'{name} gana {a}-{b}.',perfectGame:' Partida perfecta.',tieAt:'Empate a {n} rondas ganadas.',roundsWon:'rondas ganadas',
    questionsStat:'{n} preguntas',roundsStat:'{n} rondas',officialData:'datos reales',
    playAgain:'Volver a jugar',backHome:'Volver al inicio',backToRoom:'Volver a la sala',leaveRoom:'Salir de la sala',
    whatIsIt:'¿Qué es?',close:'Cerrar',contextNote:'Información contextual · no revela la respuesta',
    back:'← Volver',onlineGame:'partida online',yourName:'Tu nombre',namePlaceholder:'Escribe tu nombre',confirm:'Confirmar',
    privacyNote:'Solo guardamos tu apodo mientras existe la sala.',
    joinARoom:'unirse a una sala',roomCode:'Código de la sala',enter:'Entrar',leave:'← Salir',leaveShort:'Salir',copyCode:'Copiar código',
    shareCode:'Compártelo para que se unan · toca para copiar',waitingPlayers:'Esperando jugadores',waiting:'Esperando',
    begin:'Comenzar',needTwo:'Hacen falta al menos 2 jugadores',hostWillStart:'El anfitrión empezará la partida cuando estéis todos.',
    waitingOthers:'Esperando al resto de jugadores',inviteFriends:'Invitar amigos',linkCopied:'Enlace de invitación copiado',
    host:'Anfitrión',you:'Tú',kick:'Expulsar',kickAria:'Expulsar a {name}',kickConfirm:'¿Expulsar a {name} de la sala?',
    lobbyCount:'{n}/{max} jugadores',
    notConfigured:'El modo online no está disponible ahora mismo.',
    writeName:'Escribe tu nombre.',creating:'Creando sala…',noFreeCode:'No se ha podido generar un código libre. Inténtalo otra vez.',
    createFailed:'No se ha podido crear la sala.',codeLength:'El código tiene 4 caracteres.',entering:'Entrando…',
    noRoom:'No existe ninguna sala con ese código.',alreadyStarted:'Esa partida ya ha empezado.',roomFull:'La sala está llena (máximo 5 jugadores).',
    joinFailed:'No se ha podido entrar en la sala.',connectFailed:'No se ha podido conectar. Revisa tu conexión.',otherApp:'Esa sala es de otra versión del juego.',
    kickFailed:'No se ha podido expulsar al jugador.',starting:'Empezando…',startFailed:'No se ha podido empezar la partida.',
    otherVersion:'Esta sala usa otra versión de las preguntas. Recarga el juego.',
    missing:'Falta: {names}',
    nobodyAnswered:'Nadie contestó a tiempo',noPoints:'Esta ronda no suma puntos.',
    waitingHost:'Esperando al anfitrión…',noPlayers:'Sin jugadores',
    lastOne:'Es el único jugador que queda en la partida. Volviendo a la sala…',
    timeUp:'¡Tiempo!',timeLeft:'Quedan {t}',timeOver:'Se ha acabado el tiempo',
    youTimedOut:'Se te ha acabado el tiempo.',sendFailed:'No se ha podido enviar tu cifra. Inténtalo otra vez.',nextFailed:'No se ha podido continuar.',
    kickedTimeout:'{name} queda fuera: no ha contestado a tiempo dos rondas seguidas.',kickedByHost:'El anfitrión ha expulsado a {name}.',playerLeft:'{name} ha salido de la partida.',
    roomClosed:'La sala se ha cerrado.',youTimeoutOut:'Te han sacado de la partida por no contestar a tiempo dos rondas seguidas.',
    youKicked:'El anfitrión te ha expulsado de la sala.',youLeft:'Has salido de la sala.',hostClosed:'El anfitrión ha cerrado la sala.',
    codeCopied:'Código copiado',codeIs:'Código: {code}',
    confirmLeaveRoom:'¿Salir de la sala?',confirmLeaveGame:'¿Salir de la partida?',ok:'Aceptar',cancel:'Cancelar',yes:'Sí',
    errorConfirm:'No se ha podido confirmar la cifra.',errorContinue:'No se ha podido continuar la partida.',errorStart:'No se ha podido iniciar la partida.',
    errorNextPlayer:'No se ha podido continuar con el siguiente jugador.',errorNewGame:'No se ha podido iniciar la nueva partida.',unknownError:'Error desconocido'
  }
};
const CATEGORY_EN={'Historia':'History','Personajes':'People','Cine':'Movies','Series y TV':'TV','Música':'Music','Videojuegos':'Video games','Tecnología':'Technology','Deporte':'Sports','Marcas':'Brands','Mundo':'World','Récords':'Records','Libros y cómics':'Books & comics'};

function detectLang(locale){
  const l=String(locale||'').toLowerCase();
  return l.startsWith('es')?'es':'en';
}
let LANG=detectLang((navigator.languages&&navigator.languages[0])||navigator.language);

window.t=function(key,vars){
  let s=(STR[LANG]&&STR[LANG][key])??STR.en[key]??key;
  if(vars)s=s.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');
  return s;
};
window.getLang=()=>LANG;
window.numberLocale=()=>LANG==='es'?'es-ES':'en-US';
window.categoryName=c=>LANG==='en'?(CATEGORY_EN[c]||c):c;
window.joinNames=names=>names.length<2?names.join(''):names.slice(0,-1).join(', ')+t('and')+names[names.length-1];

// Pone los textos fijos de la página (data-i18n, data-i18n-html, data-i18n-placeholder, data-i18n-aria).
window.applyStaticTexts=function(){
  document.documentElement.lang=LANG;
  document.querySelectorAll('[data-i18n]').forEach(n=>{n.textContent=t(n.dataset.i18n);});
  document.querySelectorAll('[data-i18n-html]').forEach(n=>{n.innerHTML=t(n.dataset.i18nHtml);});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(n=>{n.placeholder=t(n.dataset.i18nPlaceholder);});
  document.querySelectorAll('[data-i18n-aria]').forEach(n=>{n.setAttribute('aria-label',t(n.dataset.i18nAria));});
};
window.setLang=function(locale){
  const next=detectLang(locale);
  if(next===LANG)return false;
  LANG=next;
  return true;
};

// Ventanas propias en lugar de alert/confirm (dentro del iframe de CrazyGames pueden estar bloqueados).
function dialog(msg,withCancel){
  return new Promise(resolve=>{
    const wrap=document.createElement('div');wrap.className='ui-dialog';
    wrap.innerHTML='<div class="ui-dialog-card" role="alertdialog" aria-modal="true"><p></p><div class="ui-dialog-actions"></div></div>';
    wrap.querySelector('p').textContent=String(msg);
    const actions=wrap.querySelector('.ui-dialog-actions');
    const close=v=>{wrap.remove();resolve(v);};
    if(withCancel){const c=document.createElement('button');c.type='button';c.className='secondary';c.textContent=t('cancel');c.onclick=()=>close(false);actions.appendChild(c);}
    const ok=document.createElement('button');ok.type='button';ok.className='primary';ok.textContent=withCancel?t('yes'):t('ok');ok.onclick=()=>close(true);actions.appendChild(ok);
    document.body.appendChild(wrap);ok.focus();
  });
}
window.uiAlert=msg=>dialog(msg,false);
window.uiConfirm=msg=>dialog(msg,true);
})();
