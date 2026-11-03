// The 12 zodiac characters, drawn as vector art in one consistent style:
// a round badge with a white rim, and the animal peeking up from the bottom.
// Each comes in two versions: plain, and "musical" (with a music accessory).

const INK = '#2b2622';

// Big friendly eyes: white ovals with dark pupils looking slightly inward.
function eyes(y = 70, gap = 11, look = 1, size = 1) {
  const eye = (x, dir) => `
    <ellipse cx="${x}" cy="${y}" rx="${8.5 * size}" ry="${10.5 * size}" fill="#fff"/>
    <ellipse cx="${x + dir * 2.2 * look}" cy="${y + 1.5}" rx="${4.6 * size}" ry="${6.2 * size}" fill="${INK}"/>
    <circle cx="${x + dir * 2.2 * look + 1.6}" cy="${y - 1.6}" r="${1.5 * size}" fill="#fff"/>`;
  return eye(60 - gap, 1) + eye(60 + gap, -1);
}

function cheeks(y = 82, gap = 21, color = '#f6a3a3') {
  return `<ellipse cx="${60 - gap}" cy="${y}" rx="5" ry="3.2" fill="${color}" opacity=".55"/>
          <ellipse cx="${60 + gap}" cy="${y}" rx="5" ry="3.2" fill="${color}" opacity=".55"/>`;
}

const smile = (y = 86, w = 6) => `<path d="M${60 - w} ${y} Q60 ${y + w * 0.9} ${60 + w} ${y}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
const shoulders = (fill, y = 118, rx = 40) => `<ellipse cx="60" cy="${y}" rx="${rx}" ry="24" fill="${fill}"/>`;

// ---------- The animals ----------

const ANIMALS = {
  rat: {
    name: 'Rat', bg: '#f2a93b',
    draw: () => `
      ${shoulders('#9aa0a8')}
      <circle cx="33" cy="50" r="15" fill="#9aa0a8"/><circle cx="33" cy="50" r="9" fill="#f4a7b9"/>
      <circle cx="87" cy="50" r="15" fill="#9aa0a8"/><circle cx="87" cy="50" r="9" fill="#f4a7b9"/>
      <ellipse cx="60" cy="76" rx="27" ry="26" fill="#9aa0a8"/>
      <ellipse cx="60" cy="88" rx="13" ry="10" fill="#c9ccd1"/>
      ${eyes(72, 11)}
      <ellipse cx="60" cy="84" rx="4" ry="3" fill="#f08aa5"/>
      <path d="M44 86 L30 83 M44 89 L31 91 M76 86 L90 83 M76 89 L89 91" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>`,
  },
  ox: {
    name: 'Ox', bg: '#3fa66a',
    draw: () => `
      ${shoulders('#8b5a3c')}
      <path d="M36 52 Q22 44 24 30 Q32 42 44 46 Z" fill="#f3e3c3"/>
      <path d="M84 52 Q98 44 96 30 Q88 42 76 46 Z" fill="#f3e3c3"/>
      <ellipse cx="31" cy="64" rx="10" ry="6" fill="#8b5a3c" transform="rotate(-20 31 64)"/>
      <ellipse cx="89" cy="64" rx="10" ry="6" fill="#8b5a3c" transform="rotate(20 89 64)"/>
      <ellipse cx="60" cy="72" rx="28" ry="27" fill="#8b5a3c"/>
      <ellipse cx="60" cy="90" rx="20" ry="12" fill="#e8b9a0"/>
      <ellipse cx="53" cy="90" rx="2.6" ry="3.2" fill="#8b5a3c"/><ellipse cx="67" cy="90" rx="2.6" ry="3.2" fill="#8b5a3c"/>
      ${eyes(68, 11)}`,
  },
  tiger: {
    name: 'Tiger', bg: '#3d8bd9',
    draw: () => `
      ${shoulders('#f39a2e')}
      <circle cx="36" cy="50" r="10" fill="#f39a2e"/><circle cx="36" cy="50" r="5" fill="#fff3e0"/>
      <circle cx="84" cy="50" r="10" fill="#f39a2e"/><circle cx="84" cy="50" r="5" fill="#fff3e0"/>
      <ellipse cx="60" cy="74" rx="30" ry="27" fill="#f39a2e"/>
      <path d="M60 48 L56 58 L64 58 Z M33 70 L42 72 L33 76 Z M87 70 L78 72 L87 76 Z" fill="${INK}"/>
      <ellipse cx="60" cy="88" rx="16" ry="11" fill="#fff3e0"/>
      ${eyes(70, 11)}
      <path d="M56 82 L64 82 L60 86 Z" fill="${INK}"/>
      ${smile(89, 5)}`,
  },
  rabbit: {
    name: 'Rabbit', bg: '#7a5fd0',
    draw: () => `
      ${shoulders('#fbe9f0')}
      <ellipse cx="46" cy="32" rx="8" ry="22" fill="#fbe9f0" transform="rotate(-8 46 32)"/>
      <ellipse cx="46" cy="33" rx="4" ry="16" fill="#f4a7b9" transform="rotate(-8 46 33)"/>
      <ellipse cx="74" cy="32" rx="8" ry="22" fill="#fbe9f0" transform="rotate(8 74 32)"/>
      <ellipse cx="74" cy="33" rx="4" ry="16" fill="#f4a7b9" transform="rotate(8 74 33)"/>
      <ellipse cx="60" cy="76" rx="27" ry="26" fill="#fbe9f0"/>
      ${eyes(72, 11)}
      ${cheeks(84, 19)}
      <path d="M57 83 L63 83 L60 86.5 Z" fill="#f08aa5"/>
      <rect x="56.5" y="89" width="7" height="6" rx="1.5" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`,
  },
  dragon: {
    name: 'Dragon', bg: '#ef6f5e',
    draw: () => `
      ${shoulders('#4cbf8a')}
      <path d="M40 54 Q34 36 42 28 Q44 42 50 48 Z M80 54 Q86 36 78 28 Q76 42 70 48 Z" fill="#f2a93b"/>
      <path d="M52 47 L56 38 L60 47 L64 38 L68 47 Z" fill="#f2c94c"/>
      <ellipse cx="60" cy="74" rx="29" ry="27" fill="#4cbf8a"/>
      <ellipse cx="60" cy="90" rx="19" ry="11" fill="#7fd6a8"/>
      <ellipse cx="53" cy="88" rx="2.4" ry="1.8" fill="#2f7a55"/><ellipse cx="67" cy="88" rx="2.4" ry="1.8" fill="#2f7a55"/>
      ${eyes(69, 11)}
      <path d="M40 98 Q60 106 80 98" fill="none" stroke="#f7e29b" stroke-width="5" stroke-linecap="round"/>`,
  },
  snake: {
    name: 'Snake', bg: '#f2c94c',
    draw: () => `
      <path d="M20 122 Q20 100 44 98 L76 98 Q100 100 100 122 Z" fill="#6fbf4b"/>
      <ellipse cx="60" cy="72" rx="28" ry="24" fill="#6fbf4b"/>
      <circle cx="44" cy="56" r="3.2" fill="#4f9a33"/><circle cx="76" cy="56" r="3.2" fill="#4f9a33"/><circle cx="60" cy="52" r="3.2" fill="#4f9a33"/>
      <circle cx="32" cy="110" r="3.5" fill="#4f9a33"/><circle cx="88" cy="110" r="3.5" fill="#4f9a33"/>
      ${eyes(70, 12)}
      ${smile(84, 7)}
      <path d="M60 87 L60 95 M60 95 L56 99 M60 95 L64 99" stroke="#e8473d" stroke-width="2.2" stroke-linecap="round"/>`,
  },
  horse: {
    name: 'Horse', bg: '#e86fa6',
    draw: () => `
      ${shoulders('#c2814f')}
      <path d="M38 52 L34 32 L48 44 Z M82 52 L86 32 L72 44 Z" fill="#c2814f"/>
      <ellipse cx="60" cy="72" rx="25" ry="28" fill="#c2814f"/>
      <path d="M48 46 Q60 34 72 46 Q66 44 62 52 Q58 44 48 46 Z" fill="#5a3a2a"/>
      <ellipse cx="60" cy="92" rx="18" ry="12" fill="#e2b28a"/>
      <ellipse cx="54" cy="91" rx="2.4" ry="3" fill="#7a4e30"/><ellipse cx="66" cy="91" rx="2.4" ry="3" fill="#7a4e30"/>
      ${eyes(68, 11)}`,
  },
  goat: {
    name: 'Goat', bg: '#4fb3c8',
    draw: () => `
      ${shoulders('#f4efe6')}
      <path d="M44 50 Q34 30 46 24 Q42 36 52 46 Z M76 50 Q86 30 74 24 Q78 36 68 46 Z" fill="#b9a58a"/>
      <ellipse cx="30" cy="66" rx="11" ry="5.5" fill="#f4efe6" transform="rotate(18 30 66)"/>
      <ellipse cx="90" cy="66" rx="11" ry="5.5" fill="#f4efe6" transform="rotate(-18 90 66)"/>
      <ellipse cx="60" cy="74" rx="25" ry="27" fill="#f4efe6"/>
      <path d="M54 96 Q60 112 66 96 Z" fill="#e3dccf"/>
      ${eyes(70, 10.5)}
      <path d="M57 85 L63 85 L60 88 Z" fill="${INK}"/>`,
  },
  monkey: {
    name: 'Monkey', bg: '#8bc34a',
    draw: () => `
      ${shoulders('#8a5a3b')}
      <circle cx="31" cy="72" r="12" fill="#8a5a3b"/><circle cx="31" cy="72" r="7" fill="#f2d0a9"/>
      <circle cx="89" cy="72" r="12" fill="#8a5a3b"/><circle cx="89" cy="72" r="7" fill="#f2d0a9"/>
      <ellipse cx="60" cy="72" rx="28" ry="28" fill="#8a5a3b"/>
      <path d="M38 76 Q38 56 52 58 Q60 62 68 58 Q82 56 82 76 Q82 98 60 98 Q38 98 38 76 Z" fill="#f2d0a9"/>
      ${eyes(72, 10)}
      <ellipse cx="57" cy="84" rx="1.6" ry="1.3" fill="${INK}"/><ellipse cx="63" cy="84" rx="1.6" ry="1.3" fill="${INK}"/>
      ${smile(89, 6)}`,
  },
  rooster: {
    name: 'Rooster', bg: '#5b6bd6',
    draw: () => `
      ${shoulders('#fff7e8')}
      <path d="M48 52 Q46 36 54 40 Q56 30 62 38 Q68 30 72 42 Q78 40 74 52 Z" fill="#e8473d"/>
      <ellipse cx="60" cy="76" rx="27" ry="28" fill="#fff7e8"/>
      ${eyes(70, 11)}
      <path d="M52 81 L68 81 L60 92 Z" fill="#f2a93b"/>
      <path d="M57 92 Q60 102 63 92 Z" fill="#e8473d"/>
      ${cheeks(84, 20)}`,
  },
  dog: {
    name: 'Dog', bg: '#ef8f3b',
    draw: () => `
      ${shoulders('#d9a36b')}
      <ellipse cx="36" cy="66" rx="10" ry="18" fill="#8a5a3b" transform="rotate(16 36 66)"/>
      <ellipse cx="84" cy="66" rx="10" ry="18" fill="#8a5a3b" transform="rotate(-16 84 66)"/>
      <ellipse cx="60" cy="74" rx="26" ry="27" fill="#d9a36b"/>
      <circle cx="71" cy="64" r="9" fill="#f0d2a8"/>
      <ellipse cx="60" cy="89" rx="14" ry="10" fill="#f0d2a8"/>
      ${eyes(70, 10.5)}
      <ellipse cx="60" cy="84" rx="5" ry="3.6" fill="${INK}"/>
      <path d="M56 92 Q60 101 64 92 Z" fill="#f08aa5"/>`,
  },
  pig: {
    name: 'Pig', bg: '#4cbf8a',
    draw: () => `
      ${shoulders('#f7b3c2')}
      <path d="M38 54 L34 38 L50 48 Z M82 54 L86 38 L70 48 Z" fill="#f08aa5"/>
      <ellipse cx="60" cy="74" rx="29" ry="27" fill="#f7b3c2"/>
      <ellipse cx="60" cy="86" rx="11" ry="8" fill="#f08aa5"/>
      <ellipse cx="56" cy="86" rx="2.2" ry="3" fill="#c25f7c"/><ellipse cx="64" cy="86" rx="2.2" ry="3" fill="#c25f7c"/>
      ${eyes(69, 12)}
      ${cheeks(82, 22, '#e8607f')}`,
  },
};

// ---------- Musical accessories ----------

const NOTE = (x, y, s = 1, fill = '#fff') => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    <ellipse cx="0" cy="10" rx="4.4" ry="3.4" transform="rotate(-20 0 10)"/>
    <rect x="3" y="-6" width="1.8" height="16"/>
    <path d="M4.8 -6 Q11 -3 9 4 Q9 -1 4.8 -1 Z"/>
  </g>`;

const ACCESSORIES = {
  headphones: () => `
    <path d="M30 70 Q30 38 60 38 Q90 38 90 70" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <rect x="23" y="62" width="13" height="20" rx="6" fill="#e8473d"/>
    <rect x="84" y="62" width="13" height="20" rx="6" fill="#e8473d"/>`,
  bowtie: () => `
    <path d="M60 104 L46 97 L46 111 Z M60 104 L74 97 L74 111 Z" fill="#e8473d"/>
    <circle cx="60" cy="104" r="3.5" fill="#b8322b"/>`,
  beret: () => `
    <ellipse cx="60" cy="49" rx="25" ry="8" fill="#2b2622"/>
    <path d="M36 49 Q38 34 60 33 Q82 34 84 49 Z" fill="#2b2622"/>
    <rect x="58" y="27" width="4" height="7" rx="2" fill="#2b2622"/>`,
  notes: () => '',
};

const MUSICAL = {
  rat: 'headphones', ox: 'bowtie', tiger: 'headphones', rabbit: 'beret',
  dragon: 'bowtie', snake: 'beret', horse: 'headphones', goat: 'bowtie',
  monkey: 'headphones', rooster: 'bowtie', dog: 'headphones', pig: 'beret',
};

export const CHARACTER_IDS = Object.keys(ANIMALS);
export function characterName(id) { return ANIMALS[id]?.name || ''; }

// Returns an SVG string for a character. variant: 'plain' or 'musical'.
export function characterSVG(id, variant = 'plain', { title = '' } = {}) {
  const a = ANIMALS[id] || ANIMALS.rooster;
  const clip = `clip-${id}-${variant}-${Math.random().toString(36).slice(2, 7)}`;
  const acc = variant === 'musical' ? ACCESSORIES[MUSICAL[id]]() : '';
  const notes = variant === 'musical' ? NOTE(23, 26, 0.9) + NOTE(90, 22, 0.75) : '';
  return `<svg viewBox="0 0 120 124" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title || a.name}">
    <circle cx="60" cy="64" r="58" fill="#d9d3c8"/>
    <circle cx="60" cy="60" r="58" fill="#fff"/>
    <clipPath id="${clip}"><circle cx="60" cy="60" r="51"/></clipPath>
    <g clip-path="url(#${clip})">
      <circle cx="60" cy="60" r="51" fill="${a.bg}"/>
      ${notes}
      <g transform="translate(60 84) scale(1.12) translate(-60 -84)">
        ${a.draw()}
        ${acc}
      </g>
    </g>
  </svg>`;
}
