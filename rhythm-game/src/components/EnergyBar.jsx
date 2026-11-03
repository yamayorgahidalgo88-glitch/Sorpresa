export default function EnergyBar({ energy }) {
  const pct = Math.max(0, Math.min(100, energy));
  const level = pct < 25 ? 'low' : pct < 55 ? 'mid' : 'high';
  return (
    <div className={`energy ${level}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Energía">
      <div className="energy-head">
        <span className="energy-label">ENERGY</span>
        <span className="energy-pct" data-testid="energy">{Math.round(pct)}%</span>
      </div>
      <div className="energy-bar">
        <div className="energy-fill" style={{ width: `${pct}%` }} />
        <div className="energy-shine" />
      </div>
    </div>
  );
}
