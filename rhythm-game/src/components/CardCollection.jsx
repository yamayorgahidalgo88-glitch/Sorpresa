import { CHARACTERS, XP_PER_LEVEL, computeThemeBonus, deckCards } from '../game/cards.js';
import { SONG } from '../game/song.js';
import CharacterCard from './CharacterCard.jsx';

const MAX_DECK = 5;

export default function CardCollection({ collection, setCollection }) {
  const owned = Object.keys(collection.cards).length;
  const toggle = (id) => {
    if (!collection.cards[id]) return;
    setCollection((c) => {
      const inDeck = c.deck.includes(id);
      let deck = inDeck ? c.deck.filter((d) => d !== id) : [...c.deck, id];
      if (deck.length > MAX_DECK) deck = deck.slice(deck.length - MAX_DECK);
      if (!deck.length) return c; // al menos una carta
      return { ...c, deck };
    });
  };
  const theme = computeThemeBonus(deckCards(collection), SONG.theme);
  return (
    <section className="panel-sec">
      <h3>
        Colección <small>{owned}/{CHARACTERS.length}</small>
      </h3>
      <p className="hint">
        Toca una carta para añadirla o quitarla del mazo (máx. {MAX_DECK}). Las cartas del tema «{SONG.theme}» suben el THEME BONUS
        (ahora Lv.{theme.level}, +{theme.percent}%). Juega para subir de nivel y desbloquear nuevas cartas.
      </p>
      <div className="collection">
        {CHARACTERS.map((ch) => {
          const own = collection.cards[ch.id];
          const card = { ...ch, level: own?.level || 1 };
          return (
            <div key={ch.id} className="coll-item">
              <CharacterCard card={card} size="full" selected={collection.deck.includes(ch.id)} locked={!own} onClick={() => toggle(ch.id)} />
              <div className="coll-meta">
                <span className={ch.theme === SONG.theme ? 'theme match' : 'theme'}>{ch.theme}</span>
                {own && (
                  <span className="xp">
                    <i style={{ width: `${(own.xp / XP_PER_LEVEL) * 100}%` }} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
