import { useEffect, useRef } from 'react';
import CharacterCard from './CharacterCard.jsx';

const DURATION = 3400;

// Animación de presentación de cartas al empezar la partida:
// oscurece el fondo, las cartas entran hacia el centro, aparece THEME BONUS
// con su nivel, se aplica el bonus y la animación desaparece.
export default function ThemeBonus({ deck, bonus, song, onDone }) {
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  useEffect(() => {
    const t = setTimeout(finish, DURATION);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const n = deck.length;
  return (
    <div className="theme-bonus" onPointerDown={finish} data-testid="theme-bonus">
      <div className="tb-dim" />
      <div className="tb-rays" />
      <div className="tb-cards">
        {deck.map((c, i) => {
          const off = i - (n - 1) / 2;
          return (
            <div
              key={c.id}
              className="tb-card"
              style={{
                '--fx': `${off * 140}%`,
                '--fy': `${(i % 2 ? -1 : 1) * 70 + 40}vh`,
                '--tx': `${off * 58}%`,
                '--ty': `${Math.abs(off) * 6}%`,
                '--rot': `${off * 7}deg`,
                '--delay': `${i * 90}ms`,
                zIndex: 10 - Math.abs(Math.round(off)),
              }}
            >
              <CharacterCard card={c} size="full" />
            </div>
          );
        })}
      </div>
      <div className="tb-text">
        <div className="tb-song">♪ {song.title} · {song.theme}</div>
        <div className="tb-title">THEME BONUS</div>
        <div className="tb-level">
          Lv.{bonus.level} <span>SCORE +{bonus.percent}%</span>
        </div>
        <div className="tb-hint">Toca para saltar</div>
      </div>
      <div className="tb-flash" />
    </div>
  );
}
