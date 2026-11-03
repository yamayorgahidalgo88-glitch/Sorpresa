import { useEffect, useRef } from 'react';
import ScoreDisplay from './ScoreDisplay.jsx';
import EnergyBar from './EnergyBar.jsx';
import RaveBonus from './RaveBonus.jsx';
import CharacterCard from './CharacterCard.jsx';
import GameControls from './GameControls.jsx';

export default function GameHeader({ engine, snap, deck, song, onPause, onRestart, canControl }) {
  const progressRef = useRef(null);
  useEffect(
    () =>
      engine.onFrame((e) => {
        if (!progressRef.current) return;
        const p = Math.max(0, Math.min(1, e.songTime / e.endAt));
        progressRef.current.style.transform = `scaleX(${p})`;
      }),
    [engine],
  );
  const card = deck[snap.cardIndex] || deck[0];
  return (
    <header className="game-header">
      <div className="hdr-left">
        <ScoreDisplay engine={engine} score={snap.score} />
        <GameControls onPause={onPause} onRestart={onRestart} paused={snap.state === 'paused'} disabled={!canControl} />
      </div>
      <div className="hdr-center">
        {card && <CharacterCard card={card} index={snap.cardIndex} bonus={snap.lastJudgment?.cardBonus} judgeId={snap.lastJudgment?.id} />}
      </div>
      <div className="hdr-right">
        <EnergyBar energy={snap.energy} />
        <RaveBonus level={snap.raveLevel} gauge={snap.raveGauge} />
      </div>
      <div className="song-progress">
        <div className="song-title">♪ {song.title}</div>
        <div className="progress-track">
          <div className="progress-fill" ref={progressRef} />
        </div>
      </div>
    </header>
  );
}
