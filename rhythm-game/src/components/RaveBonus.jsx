import { RAVE_MAX_LEVEL, RAVE_STEP } from '../game/constants.js';

export default function RaveBonus({ level, gauge }) {
  const mult = (1 + level * RAVE_STEP).toFixed(1);
  return (
    <div className={`rave ${level > 0 ? 'on' : ''} lv${level}`} data-testid="rave">
      <div className="rave-top">
        <span className="rave-label">RAVE BONUS</span>
        <span className="rave-mult">×{mult}</span>
      </div>
      <div className="rave-segs">
        {Array.from({ length: RAVE_MAX_LEVEL }, (_, i) => (
          <span key={i} className={`seg ${i < level ? 'full' : ''}`}>
            {i === level && level < RAVE_MAX_LEVEL && <span className="seg-fill" style={{ width: `${Math.min(100, gauge)}%` }} />}
          </span>
        ))}
      </div>
    </div>
  );
}
