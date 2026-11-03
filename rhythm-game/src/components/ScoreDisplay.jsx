import { useEffect, useRef } from 'react';

const fmt = (n) => Math.round(n).toLocaleString('es-ES');

// Puntuación animada: el número se interpola en el bucle central del juego
// (engine.onFrame), sin relojes adicionales.
export default function ScoreDisplay({ engine, score }) {
  const numRef = useRef(null);
  const boxRef = useRef(null);
  const last = useRef(-1);

  useEffect(
    () =>
      engine.onFrame((e) => {
        const v = Math.round(e.displayScore);
        if (v !== last.current && numRef.current) {
          last.current = v;
          numRef.current.textContent = fmt(v);
        }
      }),
    [engine],
  );

  useEffect(() => {
    const el = boxRef.current;
    if (!el || score === 0) return;
    el.classList.remove('bump');
    void el.offsetWidth; // reinicia la animación
    el.classList.add('bump');
  }, [score]);

  return (
    <div className="score-box" ref={boxRef}>
      <span className="score-label">SCORE</span>
      <span className="score-num" ref={numRef} data-testid="score">
        0
      </span>
    </div>
  );
}
