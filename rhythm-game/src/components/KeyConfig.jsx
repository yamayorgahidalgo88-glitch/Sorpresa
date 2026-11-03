import { useEffect, useState } from 'react';
import { DEFAULT_KEYS, keyLabel } from '../game/constants.js';

export default function KeyConfig({ keys, onChange }) {
  const [waiting, setWaiting] = useState(-1);

  useEffect(() => {
    if (waiting < 0) return;
    const onKey = (e) => {
      e.preventDefault();
      if (e.code === 'Escape') {
        setWaiting(-1);
        return;
      }
      const next = [...keys];
      const dup = next.indexOf(e.code);
      if (dup >= 0) next[dup] = next[waiting]; // intercambio si ya estaba asignada
      next[waiting] = e.code;
      onChange(next);
      setWaiting(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [waiting, keys, onChange]);

  return (
    <div className="keycfg">
      <div className="key-row">
        {keys.map((k, i) => (
          <button key={i} className={`keycap ${waiting === i ? 'waiting' : ''}`} onClick={() => setWaiting(i)}>
            <small>Carril {i + 1}</small>
            <b>{waiting === i ? '…' : keyLabel(k)}</b>
          </button>
        ))}
      </div>
      <p className="hint">{waiting >= 0 ? 'Pulsa la nueva tecla (Esc para cancelar)' : 'Haz clic en un carril y pulsa una tecla para cambiarla.'}</p>
      <button className="btn ghost small" onClick={() => onChange([...DEFAULT_KEYS])}>
        Restablecer A S D F G
      </button>
    </div>
  );
}
