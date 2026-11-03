import { CHAR_BY_ID } from '../game/cards.js';
import { DIFFICULTIES } from '../game/constants.js';
import CharacterCard from './CharacterCard.jsx';

export default function ResultsScreen({ data, onReplay, onMenu }) {
  const { result: r, rewards } = data;
  const unlocked = rewards.unlocked ? { ...CHAR_BY_ID[rewards.unlocked], level: 1 } : null;
  return (
    <div className="menu results" data-testid="results">
      <div className="menu-bg" />
      <div className="menu-inner">
        <div className={`res-status ${r.cleared ? 'clear' : 'failed'}`}>
          {r.cleared ? (r.fullCombo ? 'FULL COMBO' : 'STAGE CLEAR') : 'STAGE FAILED'}
        </div>
        <div className="res-song">
          {r.songTitle} · <span style={{ color: DIFFICULTIES[r.difficulty].color }}>{DIFFICULTIES[r.difficulty].label}</span>
        </div>
        <div className="res-main">
          <div className={`rank rank-${r.rank}`}>{r.rank}</div>
          <div className="res-score">
            <small>PUNTUACIÓN FINAL</small>
            <b data-testid="final-score">{r.score.toLocaleString('es-ES')}</b>
            {rewards.isBest && r.score > 0 && <span className="new-best">¡NUEVO RÉCORD!</span>}
          </div>
        </div>
        <div className="res-grid">
          <div>
            <small>Precisión</small>
            <b>{(r.accuracy * 100).toFixed(2)}%</b>
          </div>
          <div>
            <small>Combo máximo</small>
            <b>{r.maxCombo}</b>
          </div>
          <div>
            <small>Aciertos</small>
            <b>{r.hits}</b>
          </div>
          <div>
            <small>Fallos</small>
            <b>{r.misses}</b>
          </div>
        </div>
        <ul className="res-breakdown">
          <li className="j-sperfect">
            S PERFECT <b>{r.counts.SPERFECT}</b>
          </li>
          <li className="j-perfect">
            PERFECT <b>{r.counts.PERFECT}</b>
          </li>
          <li className="j-good">
            GOOD <b>{r.counts.GOOD}</b>
          </li>
          <li className="j-miss">
            MISS <b>{r.counts.MISS}</b>
          </li>
        </ul>
        <div className="res-rewards">
          <span>
            Mazo +{rewards.xp} XP
            {rewards.levelUps.length > 0 && ` · ${rewards.levelUps.map((l) => `${CHAR_BY_ID[l.id].name} Lv.${l.level}`).join(', ')}`}
          </span>
          <span>THEME BONUS Lv.{r.themeBonus.level} (+{r.themeBonus.percent}%) · RAVE final Lv.{r.raveLevel}</span>
        </div>
        {unlocked && (
          <div className="unlock">
            <CharacterCard card={unlocked} size="full" />
            <div>
              <b>¡Nueva carta!</b>
              <span>{unlocked.name} se ha unido a tu colección.</span>
            </div>
          </div>
        )}
        <div className="res-actions">
          <button className="btn start" onClick={onReplay} data-testid="replay-btn">
            ↻ JUGAR DE NUEVO
          </button>
          <button className="btn ghost" onClick={onMenu}>
            ⌂ Menú
          </button>
        </div>
      </div>
    </div>
  );
}
