import { JUDGE_INFO } from '../game/constants.js';

// Texto de precisión central; se reinicia la animación con cada pulsación (key)
export default function JudgmentDisplay({ judgment }) {
  if (!judgment) return null;
  const info = JUDGE_INFO[judgment.judgment];
  return (
    <div className={`judgment ${info.className}`} key={judgment.id} data-testid="judgment">
      <div className="judgment-text">{info.label}</div>
      <div className="judgment-sub">
        {judgment.timing && <span className={`timing ${judgment.timing.toLowerCase()}`}>{judgment.timing}</span>}
        {judgment.points > 0 && <span className="points">+{judgment.points.toLocaleString('es-ES')}</span>}
      </div>
    </div>
  );
}
