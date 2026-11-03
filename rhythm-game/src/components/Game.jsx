import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import GameTrack from './GameTrack.jsx';
import GameHeader from './GameHeader.jsx';
import ComboDisplay from './ComboDisplay.jsx';
import JudgmentDisplay from './JudgmentDisplay.jsx';
import ThemeBonus from './ThemeBonus.jsx';
import PauseOverlay from './PauseOverlay.jsx';
import RaveBurst from './RaveBurst.jsx';

export default function Game({ config, onFinish, onExit }) {
  // El motor se crea una sola vez por sesión: cambiar de tamaño, rotar el
  // móvil o cambiar de pestaña NO reinicia la partida.
  const [engine] = useState(() => new GameEngine(config));
  const snap = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const [phase, setPhase] = useState('theme'); // theme | play

  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (new URLSearchParams(location.search).has('debug')) window.__engine = engine;
    let timer = null;
    const off = engine.onEnd((result) => {
      timer = setTimeout(() => finishRef.current(result), 2200);
    });
    return () => {
      off();
      clearTimeout(timer);
      engine.destroy();
      if (window.__engine === engine) delete window.__engine;
    };
  }, [engine]);

  // Teclado
  useEffect(() => {
    const keys = config.keys;
    const down = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (keys.includes(e.code)) return; // si P está asignada a un carril
        e.preventDefault();
        if (engine.state === 'playing' || engine.state === 'countdown') engine.pause();
        else if (engine.state === 'paused') engine.resume();
        return;
      }
      const lane = keys.indexOf(e.code);
      if (lane < 0) return;
      e.preventDefault();
      if (e.repeat) return;
      engine.press(lane, e.timeStamp);
    };
    const up = (e) => {
      const lane = keys.indexOf(e.code);
      if (lane < 0) return;
      e.preventDefault();
      engine.release(lane, e.timeStamp);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [engine, config.keys]);

  // Cambiar de pestaña / bloquear el móvil -> pausa (nunca reinicia)
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        engine.releaseAll();
        engine.pause();
      }
    };
    const onBlur = () => engine.releaseAll();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
    };
  }, [engine]);

  const onThemeDone = useCallback(() => {
    setPhase('play');
    engine.start();
  }, [engine]);

  const restart = useCallback(() => {
    if (phase !== 'play') return;
    engine.restart();
  }, [engine, phase]);

  const togglePause = useCallback(() => {
    if (engine.state === 'paused') engine.resume();
    else engine.pause();
  }, [engine]);

  const ended = snap.state === 'ended' && snap.result;

  return (
    <div className="game">
      <GameTrack engine={engine} deck={config.deck} keys={config.keys} />
      <div className="hud">
        <GameHeader
          engine={engine}
          snap={snap}
          deck={config.deck}
          song={config.song}
          onPause={togglePause}
          onRestart={restart}
          canControl={phase === 'play' && !ended}
        />
        <JudgmentDisplay judgment={snap.lastJudgment} />
        <ComboDisplay combo={snap.combo} />
        <RaveBurst level={snap.raveLevel} />
        {ended && (
          <div className={`end-banner ${snap.result.cleared ? (snap.result.fullCombo ? 'fc' : 'clear') : 'failed'}`}>
            {snap.result.cleared ? (snap.result.fullCombo ? 'FULL COMBO!' : 'CLEAR!') : 'FAILED'}
          </div>
        )}
      </div>
      {phase === 'theme' && (
        <ThemeBonus deck={config.deck} bonus={config.themeBonus} song={config.song} onDone={onThemeDone} />
      )}
      {(snap.state === 'paused' || snap.state === 'countdown') && (
        <PauseOverlay
          state={snap.state}
          countdown={snap.countdown}
          onResume={() => engine.resume()}
          onRestart={restart}
          onExit={() => {
            engine.quit();
            onExit();
          }}
        />
      )}
    </div>
  );
}
