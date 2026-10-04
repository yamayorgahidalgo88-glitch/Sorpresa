// Thin wrapper over the CrazyGames HTML5 SDK v3. Every call is safe when the SDK
// is missing (blocked, offline or played outside CrazyGames).
(function () {
  let sdk = null;
  let ready = false;

  function call(fn) {
    if (!ready) return;
    try { fn(sdk); } catch (e) { console.warn('[SDK]', e); }
  }

  // The SDK is only loaded on CrazyGames (and local tests); the installable
  // phone version runs without it.
  function loadSdk() {
    const host = location.hostname;
    if (!/crazygames|^localhost$|^127\.0\.0\.1$/.test(host)) return Promise.resolve();
    return new Promise(resolve => {
      const tag = document.createElement('script');
      tag.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
      tag.onload = tag.onerror = () => resolve();
      document.head.appendChild(tag);
      setTimeout(resolve, 3000);
    });
  }

  const Platform = {
    async init() {
      try {
        await loadSdk();
        if (window.CrazyGames && window.CrazyGames.SDK) {
          sdk = window.CrazyGames.SDK;
          // never let the SDK block the game (outside CrazyGames it may not answer)
          const ok = await Promise.race([sdk.init().then(() => true), new Promise(r => setTimeout(() => r(false), 3000))]);
          ready = ok && sdk.environment !== 'disabled';
        }
      } catch (e) {
        console.warn('[SDK] init failed', e);
        ready = false;
      }
      return ready;
    },
    get available() { return ready; },
    loadingStart() { call(s => s.game.loadingStart()); },
    loadingStop() { call(s => s.game.loadingStop()); },
    gameplayStart() { call(s => s.game.gameplayStart()); },
    gameplayStop() { call(s => s.game.gameplayStop()); },
    happytime() { call(s => s.game.happytime()); },

    // Resolves true only when the ad finished; false on error or without SDK.
    // onStart lets the game pause and mute while the ad plays.
    showAd(type, onStart) {
      return new Promise(resolve => {
        if (!ready) return resolve(false);
        try {
          sdk.ad.requestAd(type, {
            adStarted: () => { if (onStart) onStart(); },
            adFinished: () => resolve(true),
            adError: () => resolve(false),
          });
        } catch (e) { resolve(false); }
      });
    },

    load(key) {
      try {
        const store = ready && sdk.data ? sdk.data : window.localStorage;
        return store.getItem(key);
      } catch (e) { return null; }
    },
    save(key, value) {
      try {
        const store = ready && sdk.data ? sdk.data : window.localStorage;
        store.setItem(key, value);
      } catch (e) { /* storage unavailable: progress lives for this session only */ }
    },
  };

  window.Platform = Platform;
})();
