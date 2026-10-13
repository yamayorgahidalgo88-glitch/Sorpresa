// Capa fina sobre el SDK v3 de CrazyGames. Si el SDK no está (por ejemplo, jugando fuera de
// CrazyGames) todas las llamadas se ignoran y el juego funciona igual, sin anuncios.
(function(){
'use strict';
let sdk=null,ready=false,playing=false,adRunning=false;
const ok=()=>ready&&sdk&&sdk.environment!=='disabled';
const safe=fn=>{try{return fn();}catch(e){console.warn('[CrazyGames SDK]',e);return undefined;}};

const CG={
  async init(){
    sdk=window.CrazyGames?.SDK||null;
    if(!sdk)return;
    try{
      // Si el SDK no responde en unos segundos, el juego arranca igualmente.
      await Promise.race([sdk.init(),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),5000))]);
      ready=true;
    }catch(e){console.warn('[CrazyGames SDK] init:',e);}
  },
  get available(){return ok();},
  locale(){return ok()?safe(()=>sdk.user.systemInfo?.locale)||'':'';},
  // Avisa a CrazyGames de cuándo se está jugando (rondas) y cuándo no (menús, sala, resultados).
  gameplay(on){
    if(!ok()||on===playing||adRunning)return;
    playing=on;
    safe(()=>on?sdk.game.gameplayStart():sdk.game.gameplayStop());
  },
  happy(){if(ok())safe(()=>sdk.game.happytime());},
  // Anuncio entre partidas. La interfaz queda bloqueada hasta que termina (o falla).
  adBreak(){
    if(!ok()||adRunning)return Promise.resolve();
    return new Promise(resolve=>{
      const wasPlaying=playing;
      const done=()=>{if(!adRunning)return;adRunning=false;document.body.classList.remove('ad-running');if(wasPlaying)CG.gameplay(true);resolve();};
      if(wasPlaying)CG.gameplay(false);
      adRunning=true;document.body.classList.add('ad-running');
      const watchdog=setTimeout(done,90000);
      const end=()=>{clearTimeout(watchdog);done();};
      try{sdk.ad.requestAd('midgame',{adFinished:end,adError:end});}
      catch(e){console.warn('[CrazyGames SDK] ad:',e);end();}
    });
  },
  async username(){
    if(!ok())return null;
    try{
      if(!sdk.user.isUserAccountAvailable)return null;
      const u=await sdk.user.getUser();
      return u?.username||null;
    }catch(_e){return null;}
  },
  // Multijugador: invitaciones y estado de la sala.
  inviteCode(){
    let code=null;
    if(ok())code=safe(()=>sdk.game.getInviteParam('roomCode'))||null;
    if(!code){try{code=new URLSearchParams(location.search).get('roomCode');}catch(_e){}}
    return code?String(code).toUpperCase():null;
  },
  isInstantMultiplayer(){return ok()&&!!safe(()=>sdk.game.isInstantMultiplayer);},
  inviteLink(code){return ok()?safe(()=>sdk.game.inviteLink({roomCode:code}))||null:null;},
  updateRoom(code,joinable){if(ok())safe(()=>sdk.game.updateRoom({roomId:code,isJoinable:!!joinable,inviteParams:{roomCode:code}}));},
  leftRoom(){if(ok())safe(()=>sdk.game.leftRoom());},
  onJoinRoom(fn){
    if(!ok())return;
    safe(()=>sdk.game.addJoinRoomListener(params=>{const code=params?.roomCode;if(code)fn(String(code).toUpperCase());}));
  }
};
window.CG=CG;
})();
