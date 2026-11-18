// Profile characters: a small cast of mythological figures, each drawn as a soft,
// glowing scene (light beams, sparkles, a gentle glow, closed-eye faces), in the
// same style as the Clarity angel. All original artwork drawn in code.

const INK = '#4a3a4a';
let uidCount = 0;

// ---------- Shared pieces ----------

const closedEyes = (cx, cy, gap = 5, w = 2.6) => `
  <path d="M${cx - gap - w} ${cy} Q${cx - gap} ${cy + 2.4} ${cx - gap + w} ${cy} M${cx + gap - w} ${cy} Q${cx + gap} ${cy + 2.4} ${cx + gap + w} ${cy}"
    fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>`;

const blush = (cx, cy, gap = 8, r = 2.6) => `
  <ellipse cx="${cx - gap}" cy="${cy}" rx="${r}" ry="${r * 0.6}" fill="#f29bb0" opacity=".55"/>
  <ellipse cx="${cx + gap}" cy="${cy}" rx="${r}" ry="${r * 0.6}" fill="#f29bb0" opacity=".55"/>`;

const smile = (cx, cy, w = 1.8) =>
  `<path d="M${cx - w} ${cy} Q${cx} ${cy + 1.6} ${cx + w} ${cy}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/>`;

const mirror = (svg) => `${svg}<g transform="translate(120 0) scale(-1 1)">${svg}</g>`;

const SPARKS = [[14, 30, 0.9], [24, 70, 0.7], [100, 26, 1], [94, 64, 0.7], [36, 16, 0.6], [82, 12, 0.8], [106, 46, 0.6], [12, 52, 0.6], [30, 96, 0.5], [92, 92, 0.6]];
const sparkles = () => SPARKS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".8"/>`).join('')
  + `<path d="M98 34 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 Z" fill="#fff" opacity=".9"/>
     <path d="M20 40 l.8 2.4 l2.4 .8 l-2.4 .8 l-.8 2.4 l-.8 -2.4 l-2.4 -.8 l2.4 -.8 Z" fill="#fff" opacity=".8"/>
     <g fill="#fff" opacity=".55" transform="translate(22 82) scale(.55)"><ellipse cx="0" cy="10" rx="4.4" ry="3.4" transform="rotate(-20 0 10)"/><rect x="3" y="-6" width="1.8" height="16"/><path d="M4.8 -6 Q11 -3 9 4 Q9 -1 4.8 -1 Z"/></g>`;

const bubbles = () => [[16, 34, 2.6], [24, 58, 1.8], [100, 30, 3], [94, 56, 2], [86, 14, 1.6], [34, 18, 1.4], [104, 80, 1.8], [14, 84, 1.6]]
  .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".15" stroke="#fff" stroke-opacity=".7" stroke-width=".7"/>`).join('');

function scene(u, pal, inner, { extras = sparkles() } = {}) {
  return `
  <defs>
    <clipPath id="${u}clip"><circle cx="60" cy="60" r="58"/></clipPath>
    <linearGradient id="${u}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient>
    <radialGradient id="${u}glow"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="${pal[2]}" stop-opacity=".55"/><stop offset="1" stop-color="${pal[2]}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${u}ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="${u}soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="${u}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <g clip-path="url(#${u}clip)">
    <rect width="120" height="120" fill="url(#${u}bg)"/>
    <g filter="url(#${u}soft)" opacity=".5">
      <polygon points="14,0 24,0 34,120 18,120" fill="url(#${u}ray)"/>
      <polygon points="40,0 46,0 52,120 42,120" fill="url(#${u}ray)"/>
      <polygon points="68,0 78,0 82,120 66,120" fill="url(#${u}ray)"/>
      <polygon points="96,0 102,0 98,120 88,120" fill="url(#${u}ray)"/>
    </g>
    <circle cx="60" cy="64" r="48" fill="url(#${u}glow)"/>
    ${extras}
    ${inner}
    <ellipse cx="60" cy="122" rx="62" ry="16" fill="#fff" opacity=".75" filter="url(#${u}blur)"/>
  </g>`;
}

// ---------- The characters ----------

const CHARACTERS = {
  angel: {
    name: 'Angel', pal: ['#3d6a9a', '#b6d2ee', '#dcecff'],
    draw: (u) => `
      <defs>
        <linearGradient id="${u}robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfe1f6"/></linearGradient>
        <linearGradient id="${u}wing" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#e3eeff" stop-opacity=".3"/></linearGradient>
      </defs>
      <g opacity=".9">${mirror(`
        <path d="M54 70 C42 50 22 42 10 50 C16 56 18 62 26 66 C16 68 14 76 20 82 C30 84 38 80 44 78 C40 86 42 92 48 94 C54 88 56 80 56 74 Z" fill="url(#${u}wing)"/>
        <path d="M50 70 C40 58 28 54 18 56 M48 76 C38 72 30 74 24 78" fill="none" stroke="#fff" stroke-width=".8" opacity=".7"/>`)}
      </g>
      <path d="M56 56 h8 v12 h-8 Z" fill="#f5d6c4"/>
      <path d="M47 68 Q60 62 73 68 L86 118 Q60 124 34 118 Z" fill="url(#${u}robe)"/>
      <path d="M60 70 L58 118 M52 74 L46 118 M68 74 L74 118" stroke="#c2d6ee" stroke-width=".8" opacity=".7"/>
      <rect x="56.5" y="58" width="7" height="12" rx="3" fill="#f6d9c6"/>
      <g transform="translate(0 7)"><g transform="translate(0 5)"><path d="M47 50 Q46 34 60 34 Q74 34 73 50 L75 68 Q60 72 45 68 Z" fill="#f2d58f"/>
      <circle cx="60" cy="49" r="12.5" fill="#fde8d8"/>
      <path d="M47.5 48 Q47 35 60 35 Q73 35 72.5 48 Q68 41 62 42 Q60 45 56 42 Q51 43 47.5 48 Z" fill="#f2d58f"/>
      ${closedEyes(60, 51, 4.6)} ${blush(60, 55, 7.5)} ${smile(60, 57.5)}</g></g>
      <g transform="translate(0 5)"><circle cx="60" cy="80" r="9" fill="#fff" filter="url(#${u}blur)"/>
      <path d="M55 79 Q60 74 65 79 Q60 84 55 79 Z" fill="#fde8d8"/></g>
      <g transform="translate(0 7)"><g transform="translate(0 5)"><ellipse cx="60" cy="29" rx="11" ry="3.2" fill="none" stroke="#ffe9a3" stroke-width="3" opacity=".6" filter="url(#${u}soft)"/>
      <ellipse cx="60" cy="29" rx="11" ry="3.2" fill="none" stroke="#f6d36b" stroke-width="1.8"/></g></g>`,
  },

  dragon: {
    name: 'Dragon', pal: ['#2b6a6b', '#a6dccd', '#d9fbe9'],
    draw: (u) => `
      <defs>
        <radialGradient id="${u}skin" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#c9f2d9"/><stop offset="1" stop-color="#6fc49c"/></radialGradient>
        <linearGradient id="${u}wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#bff0dc" stop-opacity=".25"/></linearGradient>
      </defs>
      ${mirror(`<path d="M46 82 C34 70 20 70 14 76 C22 78 22 84 28 86 C22 90 24 96 30 96 C38 94 44 90 48 88 Z" fill="url(#${u}wing)"/>`)}
      <path d="M74 104 C92 104 98 92 92 84 C90 92 84 96 76 96 Z" fill="#7fcca6"/>
      <ellipse cx="60" cy="96" rx="18" ry="17" fill="url(#${u}skin)"/>
      <ellipse cx="60" cy="99" rx="10" ry="12" fill="#f6efcf"/>
      <path d="M52 94 H68 M51 100 H69 M52 106 H68" stroke="#e3d6a6" stroke-width=".8"/>
      <ellipse cx="60" cy="80" rx="11" ry="8" fill="#8fd6b2"/>
      <g transform="translate(0 9)"><path d="M52 66 Q60 64 68 66 L70 84 Q60 86 50 84 Z" fill="#8fd6b2"/>
      <g transform="translate(0 8)">${mirror(`<path d="M49 42 C46 34 44 28 40 24 C46 26 52 32 54 40 Z" fill="#f7e2a3"/>`)}
      ${mirror(`<path d="M42 50 C34 46 30 48 26 52 C32 54 36 56 42 56 Z" fill="#9adbb9"/>`)}
      <path d="M50 38 Q52 30 56 36 Q58 28 62 35 Q66 29 68 37 Q71 33 72 40" fill="#f6b3c1"/>
      <ellipse cx="60" cy="56" rx="19" ry="16" fill="url(#${u}skin)"/>
      <ellipse cx="60" cy="64" rx="11" ry="7.5" fill="#e3f8ea"/>
      <ellipse cx="56.5" cy="62.5" rx="1.2" ry=".9" fill="#4d9a76"/><ellipse cx="63.5" cy="62.5" rx="1.2" ry=".9" fill="#4d9a76"/>
      ${closedEyes(60, 53, 7.5, 3)} ${blush(60, 58, 12.5, 2.8)} ${smile(60, 67, 2.4)}</g></g>
      <g transform="translate(0 7)"><circle cx="60" cy="86" r="8" fill="#fff" filter="url(#${u}blur)"/>
      <circle cx="60" cy="86" r="5" fill="#fff"/>
      <ellipse cx="53" cy="86" rx="3.4" ry="2.6" fill="#8fd6b2"/><ellipse cx="67" cy="86" rx="3.4" ry="2.6" fill="#8fd6b2"/></g>`,
  },

  phoenix: {
    name: 'Phoenix', pal: ['#8a4560', '#f7c79a', '#ffe6c2'],
    draw: (u) => `
      <defs>
        <radialGradient id="${u}body" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#fff0b8"/><stop offset="1" stop-color="#f6a650"/></radialGradient>
        <linearGradient id="${u}flame" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".6" stop-color="#ff8f73" stop-opacity=".7"/><stop offset="1" stop-color="#ff6f8a" stop-opacity=".1"/></linearGradient>
        <linearGradient id="${u}tail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb35c"/><stop offset="1" stop-color="#ff7d8a" stop-opacity=".2"/></linearGradient>
      </defs>
      <g opacity=".95">${mirror(`
        <path d="M54 66 C44 44 28 34 8 36 C18 42 20 48 26 52 C14 54 10 60 12 66 C22 64 28 66 32 70 C24 74 24 82 28 86 C38 80 48 76 54 74 Z" fill="url(#${u}flame)"/>`)}
      </g>
      ${mirror(`<path d="M56 84 C52 98 44 108 36 118 C46 114 54 104 58 92 Z" fill="url(#${u}tail)"/>`)}
      <path d="M58 86 C58 100 60 110 60 122 C62 110 64 100 62 86 Z" fill="url(#${u}tail)"/>
      <ellipse cx="60" cy="74" rx="13" ry="16" fill="url(#${u}body)"/>
      <path d="M60 36 C57 30 56 24 52 20 M60 36 C60 28 60 22 60 16 M60 36 C63 30 64 24 68 20" fill="none" stroke="#ffb35c" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="52" cy="20" r="2.4" fill="#ffd27a"/><circle cx="60" cy="16" r="2.6" fill="#ffd27a"/><circle cx="68" cy="20" r="2.4" fill="#ffd27a"/>
      <circle cx="60" cy="49" r="13" fill="url(#${u}body)"/>
      ${closedEyes(60, 48, 5.2)} ${blush(60, 53, 8.5)}
      <path d="M57.5 52 L62.5 52 L60 56.5 Z" fill="#e5844a"/>
      <circle cx="60" cy="76" r="7" fill="#fff" opacity=".7" filter="url(#${u}blur)"/>`,
  },

  unicorn: {
    name: 'Unicorn', pal: ['#6a5a9e', '#efc8e2', '#ffe9f6'],
    draw: (u) => `
      <defs>
        <radialGradient id="${u}coat" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e6dcf3"/></radialGradient>
        <linearGradient id="${u}horn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f6cf6a"/><stop offset="1" stop-color="#fff3c4"/></linearGradient>
      </defs>
      <path d="M48 70 C46 92 36 106 28 122 L92 122 C84 106 74 92 72 70 Z" fill="url(#${u}coat)"/>
      <path d="M50 44 C40 52 38 66 42 80 C38 90 40 100 44 108 C46 96 48 88 50 80 Z" fill="#f7b8d2" opacity=".9"/>
      <path d="M72 44 C86 50 90 66 86 82 C92 90 90 104 84 116 C80 100 78 90 74 82 Z" fill="#c9b3f0"/>
      <path d="M70 42 C80 50 82 62 78 76 C82 84 80 94 76 102 C74 90 72 82 70 76 Z" fill="#f7b8d2"/>
      ${mirror(`<path d="M44 46 L40 30 L52 40 Z" fill="url(#${u}coat)"/><path d="M44.5 43 L42.5 34 L49 39.5 Z" fill="#f7c6da"/>`)}
      <ellipse cx="60" cy="58" rx="18" ry="19" fill="url(#${u}coat)"/>
      <ellipse cx="60" cy="71" rx="11" ry="8" fill="#f9e6ef"/>
      <ellipse cx="56.5" cy="71" rx="1.1" ry="1.5" fill="#d79ab4"/><ellipse cx="63.5" cy="71" rx="1.1" ry="1.5" fill="#d79ab4"/>
      <path d="M50 42 C54 36 64 34 70 40 C66 40 64 44 60 48 C58 44 54 42 50 42 Z" fill="#a9d4f5"/>
      <path d="M56 40 L60 14 L64 40 Z" fill="#fff6c8" opacity=".7" filter="url(#${u}soft)"/>
      <path d="M56.5 40 L60 16 L63.5 40 Z" fill="url(#${u}horn)"/>
      <path d="M57 34 L63 32 M57.6 28 L62.4 26.4 M58.3 22 L61.7 20.8" stroke="#e8b84e" stroke-width=".8"/>
      ${closedEyes(60, 58, 7, 3)}
      <path d="M50 59 L48.5 60.5 M70 59 L71.5 60.5" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
      ${blush(60, 63, 11)} ${smile(60, 76, 2)}`,
  },

  mermaid: {
    name: 'Mermaid', pal: ['#1f5878', '#94dbd6', '#d6fbf5'],
    extras: bubbles(),
    draw: (u) => `
      <defs>
        <linearGradient id="${u}hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f28f8a"/><stop offset="1" stop-color="#f7c3a4"/></linearGradient>
        <linearGradient id="${u}tail" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fe0cf"/><stop offset="1" stop-color="#3a9fb6"/></linearGradient>
        <linearGradient id="${u}fin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9ff0e2" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>
      </defs>
      <path d="M60 41 C49 41 45 47 46 54 C40 68 38 84 32 98 C42 96 48 88 50 78 L70 78 C72 88 78 96 88 98 C82 84 80 68 74 54 C75 47 71 41 60 41 Z" fill="url(#${u}hair)"/>
      <path d="M52 78 C50 94 56 104 70 106 C80 107 88 104 92 98 C84 100 74 98 70 92 C68 88 68 82 68 78 Z" fill="url(#${u}tail)"/>
      <path d="M90 98 C96 88 104 86 108 90 C102 92 100 98 98 104 C102 108 102 114 98 116 C96 110 92 104 90 98 Z" fill="url(#${u}fin)"/>
      <path d="M56 86 q3 2 6 0 M58 92 q3 2 6 0 M62 98 q3 2 6 0 M70 101 q3 2 6 0" fill="none" stroke="#c9fff3" stroke-width=".8" opacity=".8"/>
      <path d="M56 56 h8 v12 h-8 Z" fill="#f5d6c4"/>
      <path d="M52 66 Q60 62 68 66 L69 80 Q60 82 51 80 Z" fill="#fde5d6"/>
      <circle cx="56" cy="71" r="3.2" fill="#c9b3f0"/><circle cx="64" cy="71" r="3.2" fill="#c9b3f0"/>
      <rect x="56.5" y="60" width="7" height="9" rx="3" fill="#f6d9c6"/>
      <g transform="translate(0 6)"><g transform="translate(0 4)"><circle cx="60" cy="50" r="12.5" fill="#fde8d8"/>
      <path d="M47.5 50 Q46 36 60 36 Q74 36 72.5 50 Q70 43 64 42 Q60 46 54 42 Q49 44 47.5 50 Z" fill="url(#${u}hair)"/>
      <path d="M68 40 l1.4 3 l3.2 .4 l-2.4 2.2 l.6 3.2 l-2.8 -1.6 l-2.8 1.6 l.6 -3.2 l-2.4 -2.2 l3.2 -.4 Z" fill="#ffe08a"/>
      ${closedEyes(60, 52, 4.6)} ${blush(60, 56, 7.5)} ${smile(60, 58.5)}</g></g>`,
  },

  fairy: {
    name: 'Fairy', pal: ['#4d7a5e', '#dcebaa', '#f6ffd9'],
    draw: (u) => `
      <defs>
        <linearGradient id="${u}wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd1ec" stop-opacity=".85"/><stop offset="1" stop-color="#bfe6ff" stop-opacity=".35"/></linearGradient>
        <linearGradient id="${u}dress" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8c8"/><stop offset="1" stop-color="#f6c7d8"/></linearGradient>
      </defs>
      ${mirror(`
        <path d="M54 68 C44 50 26 44 18 52 C16 62 30 70 52 72 Z" fill="url(#${u}wing)" stroke="#fff" stroke-opacity=".7" stroke-width=".7"/>
        <path d="M54 74 C42 78 30 88 34 96 C42 98 50 88 55 78 Z" fill="url(#${u}wing)" stroke="#fff" stroke-opacity=".7" stroke-width=".7"/>`)}
      <path d="M56 56 h8 v12 h-8 Z" fill="#f5d6c4"/>
      <path d="M52 66 Q60 62 68 66 L72 80 Q82 96 80 104 Q70 100 66 106 Q60 100 54 106 Q50 100 40 104 Q38 96 48 80 Z" fill="url(#${u}dress)"/>
      <path d="M57 104 L56 120 M63 104 L64 120" stroke="#fde8d8" stroke-width="3" stroke-linecap="round"/>
      <circle cx="60" cy="78" r="8" fill="#fff9c8" filter="url(#${u}blur)"/>
      <circle cx="60" cy="78" r="3.2" fill="#fffbe0"/>
      <ellipse cx="55.5" cy="80" rx="2.4" ry="2" fill="#fde8d8"/><ellipse cx="64.5" cy="80" rx="2.4" ry="2" fill="#fde8d8"/>
      <rect x="56.5" y="58" width="7" height="10" rx="3" fill="#f6d9c6"/>
      <g transform="translate(0 6)"><g transform="translate(0 4)"><path d="M47 50 Q45 34 60 34 Q75 34 73 50 L74 60 Q70 56 70 50 L50 50 Q50 56 46 60 Z" fill="#b9875a"/>
      <circle cx="60" cy="49" r="12.5" fill="#fde8d8"/>
      <path d="M47.5 48 Q47 36 60 35 Q73 36 72.5 48 Q66 42 58 44 Q52 43 47.5 48 Z" fill="#b9875a"/>
      <circle cx="49" cy="40" r="2.4" fill="#f7a8c4"/><circle cx="54" cy="36.5" r="2.2" fill="#fff"/><circle cx="60" cy="35.2" r="2.4" fill="#f7c76a"/><circle cx="66" cy="36.5" r="2.2" fill="#fff"/><circle cx="71" cy="40" r="2.4" fill="#f7a8c4"/>
      ${closedEyes(60, 51, 4.6)} ${blush(60, 55, 7.5)} ${smile(60, 57.5)}</g></g>`,
  },

  fox: {
    name: 'Fox Spirit', pal: ['#3a3470', '#e9b394', '#ffe3cf'],
    draw: (u) => `
      <defs>
        <linearGradient id="${u}tail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f6a66b"/><stop offset=".7" stop-color="#ffd9b8"/><stop offset="1" stop-color="#fff"/></linearGradient>
        <radialGradient id="${u}fur" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#f8d7b8"/></radialGradient>
        <radialGradient id="${u}fire"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#bfe2ff"/><stop offset="1" stop-color="#7fb8ff" stop-opacity="0"/></radialGradient>
      </defs>
      ${[-64, -34, 0, 34, 64].map((a) => `<path d="M60 104 C42 92 42 62 60 42 C78 62 78 92 60 104 Z" fill="url(#${u}tail)" transform="rotate(${a} 60 104)" opacity=".95"/>`).join('')}
      <ellipse cx="60" cy="92" rx="12" ry="12" fill="url(#${u}fur)"/>
      <ellipse cx="54" cy="102" rx="4" ry="3" fill="#fff"/><ellipse cx="66" cy="102" rx="4" ry="3" fill="#fff"/>
      <g transform="translate(0 8)"><g transform="translate(0 7)">${mirror(`<path d="M45 52 L40 30 L56 44 Z" fill="#f8d2ae"/><path d="M45.5 48 L43 35 L52.5 43.5 Z" fill="#f4a7b9"/>`)}
      <path d="M41 58 Q42 42 60 42 Q78 42 79 58 Q78 72 60 76 Q42 72 41 58 Z" fill="url(#${u}fur)"/>
      <path d="M58 46 Q60 50 62 46" fill="none" stroke="#e86f7a" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="60" cy="66" rx="2" ry="1.4" fill="${INK}"/>
      ${closedEyes(60, 58, 7, 3)}
      <path d="M50 57 L48.5 58.5 M70 57 L71.5 58.5" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
      ${blush(60, 63, 11)} ${smile(60, 69, 2)}</g></g>
      <circle cx="26" cy="64" r="7" fill="url(#${u}fire)"/><circle cx="26" cy="64" r="2.2" fill="#fff"/>
      <circle cx="94" cy="58" r="6" fill="url(#${u}fire)"/><circle cx="94" cy="58" r="1.8" fill="#fff"/>`,
  },

  moonrabbit: {
    name: 'Moon Rabbit', pal: ['#1e2753', '#7d8cc4', '#e6ecff'],
    draw: (u) => `
      <defs>
        <radialGradient id="${u}moon" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#f6e3a8"/></radialGradient>
        <radialGradient id="${u}fur" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#dfe3f2"/></radialGradient>
      </defs>
      <circle cx="60" cy="52" r="36" fill="#fff6d6" opacity=".6" filter="url(#${u}blur)"/>
      <circle cx="60" cy="52" r="31" fill="url(#${u}moon)"/>
      <circle cx="46" cy="40" r="3.5" fill="#efdca0" opacity=".6"/><circle cx="78" cy="62" r="4.5" fill="#efdca0" opacity=".5"/><circle cx="74" cy="34" r="2.4" fill="#efdca0" opacity=".6"/>
      <g transform="translate(0 7)"><g transform="translate(0 4)"><ellipse cx="51" cy="40" rx="5.5" ry="16" fill="url(#${u}fur)" transform="rotate(-12 51 40)"/>
      <ellipse cx="51" cy="41" rx="2.6" ry="11" fill="#f6c3d3" transform="rotate(-12 51 41)"/>
      <ellipse cx="69" cy="40" rx="5.5" ry="16" fill="url(#${u}fur)" transform="rotate(12 69 40)"/>
      <ellipse cx="69" cy="41" rx="2.6" ry="11" fill="#f6c3d3" transform="rotate(12 69 41)"/></g></g>
      <ellipse cx="60" cy="96" rx="18" ry="17" fill="url(#${u}fur)"/>
      <g transform="translate(0 7)"><g transform="translate(0 4)"><ellipse cx="60" cy="66" rx="15" ry="13.5" fill="url(#${u}fur)"/>
      ${closedEyes(60, 65, 6)} ${blush(60, 70, 9.5)}
      <path d="M58.6 69 L61.4 69 L60 70.6 Z" fill="#e88aa3"/> ${smile(60, 72, 1.8)}</g></g>
      <g transform="translate(0 6)"><circle cx="60" cy="88" r="8" fill="#fff6c0" filter="url(#${u}blur)"/>
      <path d="M60 82 l1.8 4 l4.4 .5 l-3.3 3 l.9 4.3 l-3.8 -2.2 l-3.8 2.2 l.9 -4.3 l-3.3 -3 l4.4 -.5 Z" fill="#ffe27a"/>
      <ellipse cx="53" cy="90" rx="3.2" ry="2.6" fill="#fff"/><ellipse cx="67" cy="90" rx="3.2" ry="2.6" fill="#fff"/></g>`,
  },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS);
export function characterName(id) { return CHARACTERS[id]?.name || ''; }

// Returns an SVG string for a character. Unknown ids (such as old zodiac picks) show the dragon.
export function characterSVG(id, _variant = 'musical', { title = '' } = {}) {
  const c = CHARACTERS[id] || CHARACTERS.dragon;
  const u = `ch${++uidCount}`;
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title || c.name}">
    ${scene(u, c.pal, c.draw(u), c.extras ? { extras: c.extras } : {})}
  </svg>`;
}
