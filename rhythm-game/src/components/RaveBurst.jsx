import { useEffect, useRef, useState } from 'react';
import { RAVE_STEP } from '../game/constants.js';

// Aviso grande cuando sube el nivel de RAVE BONUS
export default function RaveBurst({ level }) {
  const prev = useRef(level);
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (level > prev.current) setShown({ level, id: Date.now() });
    prev.current = level;
  }, [level]);
  if (!shown) return null;
  return (
    <div className="rave-burst" key={shown.id} onAnimationEnd={() => setShown(null)}>
      <div className="rb-title">RAVE BONUS</div>
      <div className="rb-level">
        Lv.{shown.level} <small>SCORE ×{(1 + shown.level * RAVE_STEP).toFixed(1)}</small>
      </div>
    </div>
  );
}
