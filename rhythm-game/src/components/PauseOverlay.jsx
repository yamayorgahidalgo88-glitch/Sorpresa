export default function PauseOverlay({ state, countdown, onResume, onRestart, onExit }) {
  if (state === 'countdown') {
    return (
      <div className="overlay pause countdown" data-testid="countdown">
        <div className="count" key={countdown}>
          {countdown || 'GO'}
        </div>
      </div>
    );
  }
  return (
    <div className="overlay pause" data-testid="pause-overlay">
      <div className="panel">
        <h2>PAUSA</h2>
        <button className="btn primary" onClick={onResume} data-testid="resume-btn">
          ▶ Continuar
        </button>
        <button className="btn" onClick={onRestart} data-testid="pause-restart-btn">
          ↻ Reiniciar
        </button>
        <button className="btn ghost" onClick={onExit}>
          ⌂ Menú principal
        </button>
        <p className="hint">Esc / P para continuar</p>
      </div>
    </div>
  );
}
