import { getPortraitURL } from '../game/portraits.js';

const ATTR_LABEL = { yellow: 'SPARK', cyan: 'WAVE', pink: 'BLOOM' };

// Carta de personaje con marco, nivel y efectos. `size` = 'hud' | 'full' | 'mini'
export default function CharacterCard({ card, index = 0, bonus, judgeId, size = 'hud', selected, locked, onClick }) {
  const cls = ['card', `card-${size}`, `attr-${card.attr}`, `r${card.rarity}`];
  if (selected) cls.push('selected');
  if (locked) cls.push('locked');
  return (
    <div className={cls.join(' ')} key={size === 'hud' ? index : undefined} onClick={onClick} data-testid={size === 'hud' ? 'hud-card' : undefined}>
      <div className="card-inner">
        <img src={getPortraitURL(card.id)} alt={card.name} draggable={false} />
        <div className="card-shine" />
        <div className="card-top">
          <span className="card-attr">{ATTR_LABEL[card.attr]}</span>
          <span className="card-stars">{'★'.repeat(card.rarity)}</span>
        </div>
        <div className="card-bottom">
          <span className="card-name">{card.name}</span>
          <span className="card-lv">Lv.{card.level ?? 1}</span>
        </div>
        {locked && <div className="card-lock">🔒</div>}
      </div>
      {size === 'hud' && bonus && <div className="card-bonus" key={judgeId}>CARD BONUS</div>}
    </div>
  );
}
