// Carga AdSense (si hay identificador en anuncios-config.js). El aviso de consentimiento
// de cookies lo pone el propio AdSense: actívalo en AdSense → Privacidad y mensajes.
(function(){
  var client=window.CIFRA_ADSENSE_CLIENT;
  window.adsbygoogle=window.adsbygoogle||[];
  // API de Google para anuncios dentro de juegos HTML5 (adBreak). Sin aprobación de Google no muestra nada.
  window.adBreak=window.adConfig=function(o){window.adsbygoogle.push(o);};
  if(!client)return;
  var s=document.createElement('script');
  s.async=true;s.crossOrigin='anonymous';
  s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);
  s.setAttribute('data-ad-client',client);
  if(window.CIFRA_ADSENSE_TEST)s.setAttribute('data-adbreak-test','on');
  document.head.appendChild(s);
})();
