// Real vector playing-card art, vendored from htdebeer/SVG-cards (LGPL-2.1,
// github.com/htdebeer/SVG-cards) — see src/assets/cards/README.md. One sprite
// file with a <symbol> per card, referenced via <use>, so every card is a
// crisp, dynamically-sized SVG instead of a hand-drawn bordered box.
import cardsSpriteUrl from '../../../assets/cards/svg-cards.svg?url';

export { cardsSpriteUrl };

// The sprite's native card viewBox — every symbol shares this box.
export const CARD_VIEWBOX = '0 0 169.075 244.64';
export const CARD_ASPECT_RATIO = 169.075 / 244.64;

const SUIT_NAME = { h: 'heart', d: 'diamond', c: 'club', s: 'spade' };
const RANK_TOKEN = { A: '1', T: '10', J: 'jack', Q: 'queen', K: 'king' };

export const CARD_BACK_ID = 'back';

// Hold'em card strings look like "Ah" / "Td" / "9c" (pokersolver format).
export function cardSymbolId(card) {
  const rank = card[0];
  const suit = card[1];
  const token = RANK_TOKEN[rank] ?? rank;
  return `${SUIT_NAME[suit]}_${token}`;
}

// Indian Poker deals a numeric rank only (2-14, 14 = ace) — suit is
// irrelevant to that game's rules (everyone compares rank only), so every
// card renders in one fixed suit rather than exposing a real one that would
// wrongly imply suit matters.
export function rankSymbolId(rank, suit = 'c') {
  const token = rank === 14 ? '1' : rank === 11 ? 'jack' : rank === 12 ? 'queen' : rank === 13 ? 'king' : String(rank);
  return `${SUIT_NAME[suit]}_${token}`;
}

// A single card face/back as a dynamically-sized SVG `<use>` reference.
export const CardArt = ({ symbolId, width = '3.5rem', className = '', style = {} }) => (
  <svg
    viewBox={CARD_VIEWBOX}
    width={width}
    style={{ aspectRatio: `${CARD_ASPECT_RATIO}`, display: 'block', ...style }}
    className={className}
    aria-hidden="true"
  >
    <use href={`${cardsSpriteUrl}#${symbolId}`} />
  </svg>
);
