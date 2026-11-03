export default function GameControls({ onPause, onRestart, paused, disabled }) {
  return (
    <div className="controls">
      <button className="ctl-btn" onClick={onPause} disabled={disabled} aria-label={paused ? 'Reanudar' : 'Pausa'} data-testid="pause-btn">
        {paused ? '▶' : '❚❚'}
      </button>
      <button className="ctl-btn" onClick={onRestart} disabled={disabled} aria-label="Reiniciar" data-testid="restart-btn">
        ↻
      </button>
    </div>
  );
}
