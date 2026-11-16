// Versión web: misma interfaz que la capa de CrazyGames, pero con AdSense (anuncios.js).
// Los anuncios dentro del juego usan adBreak(); si Google no los sirve, el juego sigue sin más.
(function(){
'use strict';
let adRunning=false;
const CG={
  async init(){
    try{window.adConfig?.({preloadAdBreaks:'on',sound:'off'});}catch(_e){}
  },
  get available(){return !!window.CIFRA_ADSENSE_CLIENT;},
  locale(){return '';},
  gameplay(){},
  happy(){},
  // Anuncio al acabar la partida (pausa natural). La interfaz queda bloqueada mientras dura.
  adBreak(){
    if(!window.CIFRA_ADSENSE_CLIENT||adRunning||typeof window.adBreak!=='function')return Promise.resolve();
    return new Promise(resolve=>{
      adRunning=true;
      const done=()=>{if(!adRunning)return;adRunning=false;document.body.classList.remove('ad-running');resolve();};
      const watchdog=setTimeout(done,90000);
      try{
        window.adBreak({type:'next',name:'fin-de-partida',
          beforeAd:()=>document.body.classList.add('ad-running'),
          afterAd:()=>document.body.classList.remove('ad-running'),
          adBreakDone:()=>{clearTimeout(watchdog);done();}});
      }catch(e){clearTimeout(watchdog);done();}
    });
  },
  async username(){return null;},
  // Invitaciones: un enlace a esta misma página con el código de la sala.
  inviteCode(){
    try{const c=new URLSearchParams(location.search).get('sala');return c?String(c).toUpperCase():null;}catch(_e){return null;}
  },
  isInstantMultiplayer(){return false;},
  inviteLink(code){return code?location.origin+location.pathname+'?sala='+encodeURIComponent(code):null;},
  updateRoom(){},
  leftRoom(){},
  onJoinRoom(){}
};
window.CG=CG;
})();
