// The 12 zodiac characters, drawn as flat vector art in one soft, pastel style:
// a coloured circle, a big simple face, small dot eyes, a tiny nose and mouth.
// Every character wears a small musical touch (headphones, a bow tie or a beret).

const INK = '#3b2a20';

const PASTEL = {
  green: '#d6e9a1', pink: '#f4c2d2', blue: '#9cc3e8',
  teal: '#94d6d2', lilac: '#d2b8e3', yellow: '#f6dc8f', peach: '#f7c7a6',
};

const eyes = (y = 64, gap = 15, r = 4.6) => `
  <circle cx="${60 - gap}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${60 - gap + 1.5}" cy="${y - 1.6}" r="1.4" fill="#fff"/>
  <circle cx="${60 + gap}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${60 + gap + 1.5}" cy="${y - 1.6}" r="1.4" fill="#fff"/>`;

const nose = (y = 74, w = 4.5, fill = INK) =>
  `<path d="M${60 - w} ${y} Q60 ${y - 2.2} ${60 + w} ${y} Q61.5 ${y + 4} 60 ${y + 4.4} Q58.5 ${y + 4} ${60 - w} ${y} Z" fill="${fill}"/>`;

const mouth = (y = 81, w = 5) =>
  `<path d="M60 ${y - 2.4} V${y} M${60 - w} ${y - 0.6} Q${60 - w / 2} ${y + 3.6} 60 ${y} Q${60 + w / 2} ${y + 3.6} ${60 + w} ${y - 0.6}" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`;

const blush = (y = 76, gap = 23, c = '#ef9a9a') =>
  `<ellipse cx="${60 - gap}" cy="${y}" rx="5" ry="3" fill="${c}" opacity=".45"/><ellipse cx="${60 + gap}" cy="${y}" rx="5" ry="3" fill="${c}" opacity=".45"/>`;

// ---------- The animals (head roughly from y 20 to y 100) ----------

const ANIMALS = {
  rat: {
    name: 'Rat', bg: PASTEL.lilac, acc: 'headphones',
    draw: () => `
      <circle cx="33" cy="40" r="16" fill="#a9abb4"/><circle cx="33" cy="40" r="9.5" fill="#f2b6c4"/>
      <circle cx="87" cy="40" r="16" fill="#a9abb4"/><circle cx="87" cy="40" r="9.5" fill="#f2b6c4"/>
      <ellipse cx="60" cy="68" rx="31" ry="28" fill="#a9abb4"/>
      <ellipse cx="60" cy="81" rx="15" ry="11" fill="#e1e2e6"/>
      ${eyes(64, 14)} ${nose(74, 4, '#e88aa3')} ${mouth(82, 4.5)}
      <path d="M44 77 L31 74 M44 81 L32 83 M76 77 L89 74 M76 81 L88 83" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity=".45"/>`,
  },
  ox: {
    name: 'Ox', bg: PASTEL.green, acc: 'bowtie',
    draw: () => `
      <path d="M40 40 Q26 36 24 20 Q34 30 46 32 Z" fill="#f2e4c8"/><path d="M80 40 Q94 36 96 20 Q86 30 74 32 Z" fill="#f2e4c8"/>
      <ellipse cx="28" cy="56" rx="11" ry="6.5" fill="#a86c46" transform="rotate(-18 28 56)"/>
      <ellipse cx="92" cy="56" rx="11" ry="6.5" fill="#a86c46" transform="rotate(18 92 56)"/>
      <path d="M32 58 Q32 32 60 32 Q88 32 88 58 L86 80 Q60 92 34 80 Z" fill="#b97a50"/>
      <ellipse cx="60" cy="84" rx="21" ry="13" fill="#f0c6ad"/>
      <ellipse cx="53" cy="84" rx="2.4" ry="3.2" fill="#9c5c3e"/><ellipse cx="67" cy="84" rx="2.4" ry="3.2" fill="#9c5c3e"/>
      ${eyes(60, 13)}`,
  },
  tiger: {
    name: 'Tiger', bg: PASTEL.blue, acc: 'headphones',
    draw: () => `
      <path d="M30 46 L32 26 L48 36 Z" fill="#f0a24f"/><path d="M34 40 L35 31 L43 36 Z" fill="#fbe3c6"/>
      <path d="M90 46 L88 26 L72 36 Z" fill="#f0a24f"/><path d="M86 40 L85 31 L77 36 Z" fill="#fbe3c6"/>
      <ellipse cx="60" cy="66" rx="32" ry="29" fill="#f0a24f"/>
      <path d="M30 72 Q44 70 60 82 Q76 70 90 72 Q86 96 60 96 Q34 96 30 72 Z" fill="#fff6ea"/>
      <path d="M60 38 L56 48 L64 48 Z M30 58 L40 60 L31 64 Z M90 58 L80 60 L89 64 Z" fill="#8a5a3a"/>
      ${eyes(62, 14)} ${nose(75)} ${mouth(83)}`,
  },
  rabbit: {
    name: 'Rabbit', bg: PASTEL.pink, acc: 'beret',
    draw: () => `
      <ellipse cx="45" cy="26" rx="9" ry="22" fill="#f8f1e8" transform="rotate(-10 45 26)"/>
      <ellipse cx="45" cy="27" rx="4.5" ry="15" fill="#f2b6c4" transform="rotate(-10 45 27)"/>
      <ellipse cx="75" cy="26" rx="9" ry="22" fill="#f8f1e8" transform="rotate(10 75 26)"/>
      <ellipse cx="75" cy="27" rx="4.5" ry="15" fill="#f2b6c4" transform="rotate(10 75 27)"/>
      <ellipse cx="60" cy="70" rx="30" ry="27" fill="#f8f1e8"/>
      ${eyes(66, 13)} ${blush(77, 21)} ${nose(75, 3.8, '#e88aa3')} ${mouth(83, 4.5)}`,
  },
  dragon: {
    name: 'Dragon', bg: PASTEL.teal, acc: 'bowtie',
    draw: () => `
      <path d="M42 40 Q34 24 40 14 Q44 28 52 34 Z M78 40 Q86 24 80 14 Q76 28 68 34 Z" fill="#f2c46b"/>
      <path d="M50 35 L54 26 L58 34 L62 26 L66 34 L70 27 L72 37 Z" fill="#ef8f7a"/>
      <ellipse cx="25" cy="62" rx="9" ry="5" fill="#6fbd8f" transform="rotate(-25 25 62)"/>
      <ellipse cx="95" cy="62" rx="9" ry="5" fill="#6fbd8f" transform="rotate(25 95 62)"/>
      <ellipse cx="60" cy="66" rx="33" ry="30" fill="#7fca9b"/>
      <ellipse cx="60" cy="83" rx="22" ry="13" fill="#c9ecd5"/>
      <ellipse cx="53" cy="80" rx="2.3" ry="1.8" fill="#4d9a6c"/><ellipse cx="67" cy="80" rx="2.3" ry="1.8" fill="#4d9a6c"/>
      ${eyes(62, 14, 5)} ${blush(74, 24)}
      <path d="M53 88 Q60 93 67 88" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/>`,
  },
  snake: {
    name: 'Snake', bg: PASTEL.yellow, acc: 'beret',
    draw: () => `
      <path d="M28 70 Q28 38 60 38 Q92 38 92 70 Q92 98 60 98 Q28 98 28 70 Z" fill="#93c46f"/>
      <circle cx="44" cy="50" r="3.2" fill="#75a654"/><circle cx="76" cy="50" r="3.2" fill="#75a654"/><circle cx="60" cy="46" r="3.2" fill="#75a654"/>
      <circle cx="36" cy="80" r="2.6" fill="#75a654"/><circle cx="84" cy="80" r="2.6" fill="#75a654"/>
      ${eyes(64, 13)} ${blush(74, 21)}
      <path d="M52 80 Q60 86 68 80" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M60 85 V92 M60 92 L57 95 M60 92 L63 95" stroke="#e46e63" stroke-width="2" stroke-linecap="round"/>`,
  },
  horse: {
    name: 'Horse', bg: PASTEL.lilac, acc: 'headphones',
    draw: () => `
      <path d="M38 42 L34 22 L50 34 Z M82 42 L86 22 L70 34 Z" fill="#c98b5a"/>
      <path d="M38 40 L37 30 L45 35 Z M82 40 L83 30 L75 35 Z" fill="#f1cfae"/>
      <ellipse cx="60" cy="64" rx="27" ry="31" fill="#c98b5a"/>
      <path d="M44 36 Q60 24 76 36 Q68 34 64 44 Q60 34 52 40 Q50 36 44 36 Z" fill="#7a4f33"/>
      <ellipse cx="60" cy="86" rx="20" ry="13" fill="#efc9a4"/>
      <ellipse cx="53" cy="85" rx="2.4" ry="3" fill="#8a5a3a"/><ellipse cx="67" cy="85" rx="2.4" ry="3" fill="#8a5a3a"/>
      ${eyes(60, 13)}`,
  },
  goat: {
    name: 'Goat', bg: PASTEL.blue, acc: 'bowtie',
    draw: () => `
      <path d="M46 38 Q36 22 46 14 Q44 26 54 34 Z M74 38 Q84 22 74 14 Q76 26 66 34 Z" fill="#c9b08f"/>
      <ellipse cx="27" cy="58" rx="12" ry="6" fill="#f6f0e6" transform="rotate(20 27 58)"/>
      <ellipse cx="93" cy="58" rx="12" ry="6" fill="#f6f0e6" transform="rotate(-20 93 58)"/>
      <ellipse cx="60" cy="64" rx="27" ry="29" fill="#f6f0e6"/>
      <path d="M53 88 Q60 106 67 88 Z" fill="#e5dccd"/>
      ${eyes(60, 12)} ${nose(74, 4)} ${mouth(81, 4.5)}`,
  },
  monkey: {
    name: 'Monkey', bg: PASTEL.yellow, acc: 'headphones',
    draw: () => `
      <circle cx="28" cy="64" r="12" fill="#b17a52"/><circle cx="28" cy="64" r="7" fill="#f6d2b3"/>
      <circle cx="92" cy="64" r="12" fill="#b17a52"/><circle cx="92" cy="64" r="7" fill="#f6d2b3"/>
      <ellipse cx="60" cy="64" rx="31" ry="31" fill="#b17a52"/>
      <path d="M36 70 Q36 48 50 50 Q60 55 70 50 Q84 48 84 70 Q84 94 60 94 Q36 94 36 70 Z" fill="#f6d2b3"/>
      ${eyes(64, 11)}
      <ellipse cx="57.5" cy="75" rx="1.6" ry="1.2" fill="${INK}"/><ellipse cx="62.5" cy="75" rx="1.6" ry="1.2" fill="${INK}"/>
      ${mouth(82, 5)}`,
  },
  rooster: {
    name: 'Rooster', bg: PASTEL.green, acc: 'bowtie',
    draw: () => `
      <path d="M46 40 Q42 24 52 28 Q54 16 61 26 Q68 16 72 30 Q80 28 76 42 Z" fill="#e8706a"/>
      <ellipse cx="60" cy="68" rx="29" ry="29" fill="#fffaf0"/>
      ${eyes(62, 13)} ${blush(74, 21)}
      <path d="M53 72 L67 72 L60 82 Z" fill="#f2b24f"/>
      <path d="M57 82 Q60 92 63 82 Z" fill="#e8706a"/>`,
  },
  dog: {
    name: 'Dog', bg: PASTEL.teal, acc: 'beret',
    draw: () => `
      <ellipse cx="32" cy="58" rx="11" ry="20" fill="#9a6644" transform="rotate(18 32 58)"/>
      <ellipse cx="88" cy="58" rx="11" ry="20" fill="#9a6644" transform="rotate(-18 88 58)"/>
      <ellipse cx="60" cy="66" rx="28" ry="29" fill="#e2ad78"/>
      <ellipse cx="60" cy="82" rx="16" ry="12" fill="#f7e2c7"/>
      ${eyes(62, 12)}
      <ellipse cx="60" cy="77" rx="5.6" ry="4" fill="${INK}"/>
      ${mouth(85, 4.5)}`,
  },
  pig: {
    name: 'Pig', bg: PASTEL.green, acc: 'headphones',
    draw: () => `
      <path d="M36 44 L30 26 L50 36 Z M84 44 L90 26 L70 36 Z" fill="#ee9ab0"/>
      <ellipse cx="60" cy="66" rx="32" ry="29" fill="#f6b8c7"/>
      <ellipse cx="60" cy="78" rx="12" ry="8.5" fill="#ee9ab0"/>
      <ellipse cx="56" cy="78" rx="2.2" ry="3.2" fill="#c96782"/><ellipse cx="64" cy="78" rx="2.2" ry="3.2" fill="#c96782"/>
      ${eyes(62, 14)} ${blush(74, 24, '#e46e8a')}`,
  },
};

// ---------- Musical accessories (muted, flat) ----------

const NOTE = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".85">
    <ellipse cx="0" cy="10" rx="4.4" ry="3.4" transform="rotate(-20 0 10)"/>
    <rect x="3" y="-6" width="1.8" height="16"/>
    <path d="M4.8 -6 Q11 -3 9 4 Q9 -1 4.8 -1 Z"/>
  </g>`;

const ACCESSORIES = {
  headphones: () => `
    <path d="M27 66 Q27 30 60 30 Q93 30 93 66" fill="none" stroke="#5d6b8a" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="20" y="58" width="13" height="20" rx="6" fill="#e8857b"/>
    <rect x="87" y="58" width="13" height="20" rx="6" fill="#e8857b"/>`,
  bowtie: () => `
    <path d="M60 99 L46 92 L46 106 Z M60 99 L74 92 L74 106 Z" fill="#e8857b"/>
    <circle cx="60" cy="99" r="3.4" fill="#c9675e"/>`,
  beret: () => `
    <ellipse cx="60" cy="42" rx="25" ry="7.5" fill="#5d6b8a"/>
    <path d="M36 42 Q38 27 60 26 Q82 27 84 42 Z" fill="#5d6b8a"/>
    <rect x="58" y="20" width="4" height="7" rx="2" fill="#5d6b8a"/>`,
};

export const CHARACTER_IDS = Object.keys(ANIMALS);
export function characterName(id) { return ANIMALS[id]?.name || ''; }

// Returns an SVG string for a character (always the musical version).
export function characterSVG(id, _variant = 'musical', { title = '' } = {}) {
  const a = ANIMALS[id] || ANIMALS.dragon;
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title || a.name}">
    <circle cx="60" cy="62" r="54" fill="${a.bg}"/>
    ${a.draw()}
    ${ACCESSORIES[a.acc]()}
  </svg>`;
}
