// Themed wallpapers, drawn in code in the same soft, glowing style as the characters:
// gradient skies, beams of light, sparkles, layered hills and a misty foreground.
// Each theme has 5 options. All original artwork. Portrait 300 x 400, scaled to fill.

const W = 300, H = 400;
let uidCount = 0;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ---------- Times of day ----------
const TOD = {
  dawn:   { sky: ['#f4bfa6', '#f8dcc4', '#cfe0ee'], sun: '#fff3d6', glow: '#ffd9b0', hills: ['#d9b3c0', '#b693ad', '#8a7398'] },
  day:    { sky: ['#6fa8dc', '#a4cdee', '#e6f3fb'], sun: '#fffbe6', glow: '#ffffff', hills: ['#a8d4a6', '#82bb8a', '#5f9e72'] },
  golden: { sky: ['#ee9a58', '#f6c587', '#fbe6bc'], sun: '#fff0c0', glow: '#ffd27a', hills: ['#d39a66', '#b07a52', '#82573c'] },
  dusk:   { sky: ['#37386c', '#8f6698', '#f0a689'], sun: '#ffd6b0', glow: '#ffb48a', hills: ['#76628f', '#56497a', '#3a3360'] },
  night:  { sky: ['#0e1838', '#23336a', '#48599a'], sun: '#fff8dc', glow: '#b8c8ff', hills: ['#2c3c6c', '#212e58', '#162243'] },
};

// ---------- Building blocks ----------

function base(u, sky) {
  return `<defs>
    <linearGradient id="${u}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".55" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient>
    <linearGradient id="${u}ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="${u}soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="${u}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="${u}tiny" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${u}sky)"/>`;
}

const rays = (u, op = 0.45) => `<g filter="url(#${u}soft)" opacity="${op}">
  <polygon points="30,0 52,0 92,400 54,400" fill="url(#${u}ray)"/>
  <polygon points="104,0 116,0 138,400 112,400" fill="url(#${u}ray)"/>
  <polygon points="176,0 198,0 214,400 178,400" fill="url(#${u}ray)"/>
  <polygon points="246,0 258,0 262,400 236,400" fill="url(#${u}ray)"/></g>`;

const sun = (u, x, y, r, c, g) => `<circle cx="${x}" cy="${y}" r="${r * 4}" fill="${g}" opacity=".45" filter="url(#${u}blur)"/>
  <circle cx="${x}" cy="${y}" r="${r * 1.6}" fill="${g}" opacity=".5" filter="url(#${u}soft)"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;

const moon = (u, x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 3.5}" fill="#c8d4ff" opacity=".3" filter="url(#${u}blur)"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="#fff8dc"/>
  <circle cx="${x - r * 0.3}" cy="${y - r * 0.2}" r="${r * 0.18}" fill="#efe3b8" opacity=".7"/>
  <circle cx="${x + r * 0.35}" cy="${y + r * 0.3}" r="${r * 0.12}" fill="#efe3b8" opacity=".7"/>`;

function stars(rand, n, maxY = 220) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * maxY, r = 0.4 + rand() * 1.1;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${(0.5 + rand() * 0.5).toFixed(2)}"/>`;
  }
  return s;
}

function sparkles(rand, n, y0 = 0, y1 = 300) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = y0 + rand() * (y1 - y0), r = 0.6 + rand() * 1.2;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity=".8"/>`;
  }
  return s;
}

// A smooth rolling hill line.
function hill(rand, y, amp, color, { op = 1, freq = 1 } = {}) {
  const p1 = rand() * 6, p2 = rand() * 6;
  let d = `M0 ${H} L0 ${y}`;
  for (let x = 0; x <= W; x += 10) {
    const yy = y + Math.sin((x / W) * Math.PI * 2 * freq + p1) * amp + Math.sin((x / W) * Math.PI * 5 * freq + p2) * amp * 0.3;
    d += ` L${x} ${yy.toFixed(1)}`;
  }
  return `<path d="${d} L${W} ${H} Z" fill="${color}" opacity="${op}"/>`;
}

// Jagged distant mountains.
function range(rand, y, h, color, op = 1) {
  let d = `M0 ${H} L0 ${y}`;
  let x = 0;
  while (x < W) {
    const w = 30 + rand() * 40;
    d += ` L${(x + w / 2).toFixed(0)} ${(y - h * (0.5 + rand() * 0.5)).toFixed(0)} L${(x + w).toFixed(0)} ${(y - rand() * h * 0.2).toFixed(0)}`;
    x += w;
  }
  return `<path d="${d} L${W} ${H} Z" fill="${color}" opacity="${op}"/>`;
}

const mist = (u, y, h, op = 0.6, c = '#fff') => `<rect x="-20" y="${y}" width="${W + 40}" height="${h}" fill="${c}" opacity="${op}" filter="url(#${u}blur)"/>`;
const fog = (u, op = 0.75) => `<ellipse cx="${W / 2}" cy="${H + 10}" rx="${W * 0.9}" ry="60" fill="#fff" opacity="${op}" filter="url(#${u}blur)"/>`;

// Particles
function snow(rand, n) {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${(rand() * W).toFixed(1)}" cy="${(rand() * H).toFixed(1)}" r="${(0.8 + rand() * 1.8).toFixed(2)}" fill="#fff" opacity="${(0.6 + rand() * 0.4).toFixed(2)}"/>`;
  return s;
}
function petals(rand, n, colors = ['#f9c6d6', '#f6b1c6', '#fde3ea']) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * H, r = rand() * 180;
    s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="1.5" fill="${colors[i % colors.length]}" transform="rotate(${r.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" opacity=".9"/>`;
  }
  return s;
}
function leaves(rand, n, colors = ['#e8743b', '#f2a03d', '#c9472f', '#f6c453']) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * H, r = rand() * 180;
    s += `<path d="M0 -4 Q3 0 0 4 Q-3 0 0 -4 Z" fill="${colors[i % colors.length]}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(0)}) scale(1.2)"/>`;
  }
  return s;
}
function fireflies(u, rand, n, y0 = 220, y1 = 380, c = '#fff3a0') {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = y0 + rand() * (y1 - y0);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${c}" opacity=".5" filter="url(#${u}tiny)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="#fff"/>`;
  }
  return s;
}

// ---------- Objects ----------

const pine = (x, y, s, c = '#3f7a5a', snowy = false) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-3" y="-6" width="6" height="10" fill="#6b4a32"/>
  <path d="M0 -60 L16 -30 L8 -30 L22 -8 L-22 -8 L-8 -30 L-16 -30 Z" fill="${c}"/>
  ${snowy ? '<path d="M0 -60 L7 -46 L-7 -46 Z M-12 -30 L12 -30 L9 -26 L-9 -26 Z M-18 -10 L18 -10 L14 -6 L-14 -6 Z" fill="#fff"/>' : ''}</g>`;

function xmasTree(x, y, s, rand) {
  const colors = ['#ffd36b', '#ff7f7f', '#8fd3ff', '#fff3a0', '#ffa8e0'];
  let lights = '';
  for (let i = 0; i < 18; i++) {
    const t = rand(), yy = -54 + t * 50, half = 4 + t * 20, xx = (rand() * 2 - 1) * half;
    lights += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="1.6" fill="${colors[i % colors.length]}"/><circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="3.4" fill="${colors[i % colors.length]}" opacity=".35"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-3" y="-6" width="6" height="10" fill="#6b4a32"/>
    <path d="M0 -62 L16 -32 L8 -32 L24 -6 L-24 -6 L-8 -32 L-16 -32 Z" fill="#2f7a55"/>
    <path d="M-12 -40 Q0 -34 12 -42 M-18 -20 Q0 -12 20 -22" fill="none" stroke="#ffd36b" stroke-width="1" opacity=".8"/>
    ${lights}
    <circle cx="0" cy="-64" r="9" fill="#fff3a0" opacity=".45"/>
    <path d="M0 -70 l1.8 4 l4.4 .5 l-3.3 3 l.9 4.3 l-3.8 -2.2 l-3.8 2.2 l.9 -4.3 l-3.3 -3 l4.4 -.5 Z" fill="#ffd36b"/></g>`;
}

const gift = (x, y, w, h, c, r = '#fff3c0') => `<g transform="translate(${x} ${y})">
  <rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="1.5" fill="${c}"/>
  <rect x="-1.5" y="${-h}" width="3" height="${h}" fill="${r}"/><rect x="${-w / 2}" y="${-h * 0.62}" width="${w}" height="3" fill="${r}"/>
  <path d="M0 ${-h} q-6 -6 -8 -1 q2 3 8 1 q6 -6 8 -1 q-2 3 -8 1" fill="none" stroke="${r}" stroke-width="1.6"/></g>`;

const snowman = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
  <circle cx="0" cy="-14" r="14" fill="#fbfdff"/><circle cx="0" cy="-36" r="10" fill="#fbfdff"/>
  <path d="M-4 -38 q1.4 1.6 2.8 0 M1.2 -38 q1.4 1.6 2.8 0" fill="none" stroke="#3b2a20" stroke-width="1" stroke-linecap="round"/>
  <path d="M0 -35 l7 1.6 l-7 1.2 Z" fill="#f29a4a"/>
  <path d="M-9 -28 q9 5 18 0 l0 3 q-9 4 -18 0 Z" fill="#d9534f"/><rect x="5" y="-27" width="3.5" height="9" fill="#d9534f"/>
  <ellipse cx="0" cy="-46" rx="9" ry="2" fill="#3a3a4a"/><rect x="-6" y="-56" width="12" height="10" rx="1" fill="#3a3a4a"/>
  <circle cx="0" cy="-18" r="1.3" fill="#3b2a20"/><circle cx="0" cy="-12" r="1.3" fill="#3b2a20"/></g>`;

const house = (x, y, s, wall, roof, lit = true, snowy = false) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-18" y="-24" width="36" height="24" fill="${wall}"/>
  <path d="M-23 -22 L0 -42 L23 -22 Z" fill="${roof}"/>
  ${snowy ? '<path d="M-23 -22 L0 -42 L23 -22 L19 -22 L0 -38 L-19 -22 Z" fill="#fff"/>' : ''}
  <rect x="-12" y="-17" width="8" height="8" fill="${lit ? '#ffd88a' : '#9aa6c0'}"/><rect x="4" y="-17" width="8" height="8" fill="${lit ? '#ffd88a' : '#9aa6c0'}"/>
  ${lit ? '<circle cx="-8" cy="-13" r="9" fill="#ffd88a" opacity=".25"/><circle cx="8" cy="-13" r="9" fill="#ffd88a" opacity=".25"/>' : ''}
  <rect x="-3" y="-10" width="6" height="10" fill="#6b4a32"/></g>`;

const pumpkin = (x, y, s, face = true) => `<g transform="translate(${x} ${y}) scale(${s})">
  ${face ? '<circle cx="0" cy="-10" r="22" fill="#ffb347" opacity=".3"/>' : ''}
  <ellipse cx="-7" cy="-10" rx="9" ry="10" fill="#e8742f"/><ellipse cx="7" cy="-10" rx="9" ry="10" fill="#e8742f"/>
  <ellipse cx="0" cy="-10" rx="9" ry="11" fill="#f28c38"/>
  <path d="M0 -21 q1 -6 5 -7" fill="none" stroke="#5f7a3a" stroke-width="2.4" stroke-linecap="round"/>
  ${face ? '<path d="M-7 -13 l3 -4 l3 4 Z M1 -13 l3 -4 l3 4 Z M-7 -6 q7 5 14 0 q-3 3 -7 3 q-4 0 -7 -3 Z" fill="#fff2a8"/>' : ''}</g>`;

const bat = (x, y, s, c = '#2a2240') => `<path d="M0 0 q-6 -6 -14 -3 q4 2 4 6 q-4 -2 -8 0 q6 2 8 6 q4 -6 10 -4 q6 -2 10 4 q2 -4 8 -6 q-4 -2 -8 0 q0 -4 4 -6 q-8 -3 -14 3 Z" fill="${c}" transform="translate(${x} ${y}) scale(${s})"/>`;

const ghost = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" opacity=".92">
  <circle cx="0" cy="-12" r="22" fill="#fff" opacity=".25"/>
  <path d="M-12 0 L-12 -18 Q-12 -32 0 -32 Q12 -32 12 -18 L12 0 L8 -4 L4 0 L0 -4 L-4 0 L-8 -4 Z" fill="#f6f4ff"/>
  <path d="M-6 -20 q1.6 1.6 3.2 0 M3 -20 q1.6 1.6 3.2 0" fill="none" stroke="#3b2a40" stroke-width="1.2" stroke-linecap="round"/>
  <ellipse cx="-7" cy="-15" rx="2" ry="1.2" fill="#f2a0b8" opacity=".7"/><ellipse cx="7" cy="-15" rx="2" ry="1.2" fill="#f2a0b8" opacity=".7"/></g>`;

const tomb = (x, y, s, c = '#5a5878') => `<path d="M-8 0 L-8 -14 Q-8 -22 0 -22 Q8 -22 8 -14 L8 0 Z" fill="${c}" transform="translate(${x} ${y}) scale(${s})"/>`;

const spookyHouse = (x, y, s, c = '#2a2442') => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-26" y="-40" width="52" height="40" fill="${c}"/>
  <path d="M-32 -38 L0 -66 L32 -38 Z" fill="${c}"/>
  <rect x="14" y="-80" width="12" height="44" fill="${c}"/><path d="M11 -78 L20 -92 L29 -78 Z" fill="${c}"/>
  <rect x="-18" y="-30" width="9" height="11" fill="#ffd27a"/><rect x="9" y="-30" width="9" height="11" fill="#ffd27a"/><circle cx="0" cy="-48" r="5" fill="#ffd27a"/><rect x="17" y="-70" width="6" height="8" fill="#ffd27a"/>
  <circle cx="0" cy="-30" r="34" fill="#ffd27a" opacity=".12"/>
  <rect x="-4" y="-14" width="8" height="14" fill="#140f24"/></g>`;

function egg(x, y, s, c, stripe = '#fff', pattern = 0) {
  const p = pattern % 3 === 0 ? `<path d="M-8 -2 l4 -3 l4 3 l4 -3 l4 3" fill="none" stroke="${stripe}" stroke-width="1.6"/>`
    : pattern % 3 === 1 ? `<circle cx="-3" cy="-8" r="1.6" fill="${stripe}"/><circle cx="3" cy="-3" r="1.6" fill="${stripe}"/><circle cx="-2" cy="3" r="1.6" fill="${stripe}"/><circle cx="4" cy="-10" r="1.2" fill="${stripe}"/>`
      : `<rect x="-9" y="-5" width="18" height="2.4" fill="${stripe}"/><rect x="-9" y="1" width="18" height="2.4" fill="${stripe}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-3" rx="8.5" ry="11" fill="${c}"/>
    <clipPath id="e${++uidCount}"><ellipse cx="0" cy="-3" rx="8.5" ry="11"/></clipPath><g clip-path="url(#e${uidCount})">${p}</g>
    <ellipse cx="-3" cy="-8" rx="2" ry="3" fill="#fff" opacity=".45"/></g>`;
}

const tulip = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M0 0 L0 -20" stroke="#5f9e5a" stroke-width="1.6"/><path d="M0 -6 q-7 -4 -8 -12 q6 2 8 9 Z" fill="#6fb06a"/>
  <path d="M-5 -26 Q-6 -18 0 -17 Q6 -18 5 -26 L2.5 -22 L0 -27 L-2.5 -22 Z" fill="${c}"/></g>`;

const daisy = (x, y, s, c = '#fff', mid = '#ffd36b') => `<g transform="translate(${x} ${y}) scale(${s})">
  ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-3.2" rx="1.6" ry="3" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="1.8" fill="${mid}"/></g>`;

const bunny = (x, y, s, c = '#fff') => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="-10" rx="11" ry="10" fill="${c}"/><circle cx="-2" cy="-24" r="7" fill="${c}"/>
  <ellipse cx="-5" cy="-36" rx="2.4" ry="8" fill="${c}" transform="rotate(-10 -5 -36)"/><ellipse cx="1" cy="-37" rx="2.4" ry="8" fill="${c}" transform="rotate(8 1 -37)"/>
  <ellipse cx="-5" cy="-36" rx="1" ry="5.5" fill="#f6c3d3" transform="rotate(-10 -5 -36)"/><ellipse cx="1" cy="-37" rx="1" ry="5.5" fill="#f6c3d3" transform="rotate(8 1 -37)"/>
  <circle cx="10" cy="-6" r="3.2" fill="${c}"/>
  <path d="M-6 -25 q1.2 1.2 2.4 0" fill="none" stroke="#3b2a20" stroke-width=".9" stroke-linecap="round"/></g>`;

function blossomTree(x, y, s, rand, pinks = ['#f8c3d4', '#f4a9c0', '#fbdbe5', '#f19bb6']) {
  let blooms = '';
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI, r = rand() * 52;
    const bx = Math.cos(a) * r * 1.4, by = -70 - Math.sin(a) * r * 0.9;
    blooms += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${(7 + rand() * 9).toFixed(1)}" fill="${pinks[i % pinks.length]}" opacity=".92"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-5 0 Q-3 -30 -10 -60 M4 0 Q2 -32 14 -62 M-2 -30 Q-20 -50 -40 -62 M2 -36 Q24 -52 46 -60" stroke="#6b4a3a" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M-6 0 Q-4 -30 -4 -50 L4 -50 Q4 -30 6 0 Z" fill="#6b4a3a"/>
    ${blooms}</g>`;
}

function autumnTree(x, y, s, rand, colors = ['#e8743b', '#f2a03d', '#c9472f', '#f6c453']) {
  let f = '';
  for (let i = 0; i < 30; i++) {
    const a = rand() * Math.PI * 2, r = rand() * 26;
    f += `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(-50 + Math.sin(a) * r * 0.8).toFixed(1)}" r="${(8 + rand() * 7).toFixed(1)}" fill="${colors[i % colors.length]}"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-4 0 Q-2 -24 -3 -40 L3 -40 Q2 -24 4 0 Z" fill="#6b4a32"/>${f}</g>`;
}

const torii = (x, y, s, c = '#d9483b') => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-20" y="-44" width="5" height="44" fill="${c}"/><rect x="15" y="-44" width="5" height="44" fill="${c}"/>
  <path d="M-30 -50 Q0 -46 30 -50 L31 -55 Q0 -51 -31 -55 Z" fill="#2b2b33"/><rect x="-28" y="-50" width="56" height="5" fill="${c}"/>
  <rect x="-24" y="-38" width="48" height="4" fill="${c}"/><rect x="-2" y="-46" width="4" height="9" fill="${c}"/></g>`;

const pagoda = (x, y, s, c = '#3a3550') => {
  let tiers = '';
  for (let i = 0; i < 4; i++) {
    const w = 26 - i * 4, yy = -i * 16;
    tiers += `<rect x="${-w / 2 + 3}" y="${yy - 12}" width="${w - 6}" height="12" fill="${c}"/><path d="M${-w - 2} ${yy - 11} Q0 ${yy - 18} ${w + 2} ${yy - 11} L${w - 4} ${yy - 15} Q0 ${yy - 21} ${-w + 4} ${yy - 15} Z" fill="${c}"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">${tiers}<rect x="-1" y="-86" width="2" height="18" fill="${c}"/></g>`;
};

const fuji = (u, x, base, w, h, body, snowc = '#fbfdff') => `<g>
  <path d="M${x - w} ${base} Q${x - w * 0.45} ${base - h * 0.55} ${x - w * 0.12} ${base - h} L${x + w * 0.12} ${base - h} Q${x + w * 0.45} ${base - h * 0.55} ${x + w} ${base} Z" fill="${body}"/>
  <path d="M${x - w * 0.12} ${base - h} L${x + w * 0.12} ${base - h} Q${x + w * 0.24} ${base - h * 0.78} ${x + w * 0.32} ${base - h * 0.62} L${x + w * 0.2} ${base - h * 0.68} L${x + w * 0.1} ${base - h * 0.6} L${x} ${base - h * 0.7} L${x - w * 0.1} ${base - h * 0.6} L${x - w * 0.2} ${base - h * 0.68} L${x - w * 0.32} ${base - h * 0.62} Q${x - w * 0.24} ${base - h * 0.78} ${x - w * 0.12} ${base - h} Z" fill="${snowc}"/></g>`;

const lantern = (x, y, s, c = '#e8584a', glow = true) => `<g transform="translate(${x} ${y}) scale(${s})">
  ${glow ? `<circle cx="0" cy="0" r="16" fill="#ffc47a" opacity=".35"/>` : ''}
  <rect x="-1" y="-14" width="2" height="5" fill="#3a2a2a"/>
  <ellipse cx="0" cy="0" rx="7" ry="9" fill="${c}"/><rect x="-5" y="-10" width="10" height="2" fill="#3a2a2a"/><rect x="-5" y="8" width="10" height="2" fill="#3a2a2a"/>
  <path d="M-4 -5 Q0 -6 4 -5 M-5 0 Q0 -1 5 0 M-4 5 Q0 4 4 5" stroke="#fff3c0" stroke-width=".6" fill="none" opacity=".6"/></g>`;

const teahouse = (x, y, s, lit = false, snowy = false) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-40" y="-4" width="80" height="6" fill="#7a5a40"/>
  <rect x="-34" y="-34" width="68" height="30" fill="#f3e6cc"/>
  ${[-26, -14, -2, 10, 22].map((xx) => `<rect x="${xx}" y="-32" width="10" height="26" fill="${lit ? '#ffe2a0' : '#fbf3e0'}" stroke="#8a6a4a" stroke-width=".8"/><path d="M${xx} -23 h10 M${xx} -15 h10 M${xx + 5} -32 v26" stroke="#8a6a4a" stroke-width=".5"/>`).join('')}
  ${lit ? '<rect x="-34" y="-34" width="68" height="30" fill="#ffd27a" opacity=".2"/><ellipse cx="0" cy="-20" rx="50" ry="26" fill="#ffd27a" opacity=".15"/>' : ''}
  <rect x="-36" y="-36" width="4" height="34" fill="#6b4a32"/><rect x="32" y="-36" width="4" height="34" fill="#6b4a32"/>
  <path d="M-52 -34 Q-40 -38 -30 -50 L30 -50 Q40 -38 52 -34 Q30 -40 0 -40 Q-30 -40 -52 -34 Z" fill="#3c4250"/>
  <path d="M-30 -50 Q-20 -62 0 -64 Q20 -62 30 -50 Z" fill="#4a5262"/>
  ${snowy ? '<path d="M-30 -50 Q-20 -62 0 -64 Q20 -62 30 -50 L26 -50 Q18 -59 0 -61 Q-18 -59 -26 -50 Z M-52 -34 Q-40 -38 -30 -50 L-28 -47 Q-38 -37 -48 -34 Z M52 -34 Q40 -38 30 -50 L28 -47 Q38 -37 48 -34 Z" fill="#fff"/>' : ''}
  <path d="M-8 -34 h16 v10 h-16 Z" fill="#4f6f8f"/><path d="M0 -34 v10" stroke="#f3e6cc" stroke-width=".8"/>
  </g>`;

function onsen(u, x, y, w, water = '#9fd8e0', steam = 4, rand = Math.random) {
  let rocks = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, rx = Math.cos(a) * w * 0.52, ry = Math.sin(a) * w * 0.17;
    rocks += `<ellipse cx="${(x + rx).toFixed(1)}" cy="${(y + ry).toFixed(1)}" rx="${(8 + rand() * 6).toFixed(1)}" ry="${(5 + rand() * 3).toFixed(1)}" fill="${i % 2 ? '#7d7f8f' : '#6a6c7c'}"/>`;
  }
  let st = '';
  for (let i = 0; i < steam; i++) {
    const sx = x - w * 0.3 + (i / Math.max(1, steam - 1)) * w * 0.6;
    st += `<path d="M${sx} ${y - 4} q-10 -18 0 -34 q10 -16 0 -34" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".45" filter="url(#${u}soft)"/>`;
  }
  return `<ellipse cx="${x}" cy="${y}" rx="${w * 0.5}" ry="${w * 0.15}" fill="${water}"/>
    <ellipse cx="${x - w * 0.1}" cy="${y - 2}" rx="${w * 0.3}" ry="${w * 0.06}" fill="#fff" opacity=".35"/>
    ${rocks}${st}`;
}

const sea = (y, c1, c2) => `<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="${c1}"/>
  ${[0, 1, 2, 3, 4].map((i) => `<path d="M${-10 + i * 7} ${y + 14 + i * 16} q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="${c2}" stroke-width="1.4" opacity=".6"/>`).join('')}`;

const sand = (y, c = '#f3dcae') => `<path d="M0 ${H} L0 ${y} Q80 ${y - 14} 160 ${y - 4} Q240 ${y + 6} ${W} ${y - 8} L${W} ${H} Z" fill="${c}"/>`;

const palm = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M0 0 Q4 -40 14 -76" stroke="#7a5a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
  ${[-150, -110, -60, -20, 20].map((a) => `<path d="M14 -76 q20 -6 34 8 q-18 -4 -34 -8 Z" fill="#3f8a5a" transform="rotate(${a} 14 -76)"/>`).join('')}</g>`;

const sunflower = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M0 0 L0 -40" stroke="#5f8a3a" stroke-width="2"/><path d="M0 -16 q-10 -2 -12 -10 q8 0 12 8 Z" fill="#6fa04a"/>
  ${Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-49" rx="2.6" ry="6" fill="#f7c536" transform="rotate(${i * 30} 0 -42)"/>`).join('')}
  <circle cx="0" cy="-42" r="5" fill="#7a4a2a"/></g>`;

const butterfly = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" opacity=".9"><ellipse cx="-3" cy="-2" rx="3.4" ry="2.6" fill="${c}"/><ellipse cx="3" cy="-2" rx="3.4" ry="2.6" fill="${c}"/><ellipse cx="-2.4" cy="2" rx="2.2" ry="1.8" fill="${c}"/><ellipse cx="2.4" cy="2" rx="2.2" ry="1.8" fill="${c}"/><rect x="-.4" y="-3" width=".8" height="6" fill="#3b2a20"/></g>`;

const garland = (rand) => {
  const colors = ['#ffd36b', '#ff7f7f', '#8fd3ff', '#a8f0b0', '#ffa8e0'];
  let s = '<path d="M-10 18 Q75 48 150 22 Q225 48 310 18" fill="none" stroke="#2f5a45" stroke-width="2"/>';
  for (let i = 0; i < 16; i++) {
    const t = i / 15, x = -10 + t * 320, y = 18 + Math.sin(t * Math.PI * 2 - Math.PI / 2) * -13 + 13;
    s += `<circle cx="${x.toFixed(1)}" cy="${(y + 4).toFixed(1)}" r="6" fill="${colors[i % 5]}" opacity=".35"/><circle cx="${x.toFixed(1)}" cy="${(y + 4).toFixed(1)}" r="2.4" fill="${colors[i % 5]}"/>`;
  }
  return s;
};

const reflection = (x, y, w, c, op = 0.35) => `<rect x="${x - w / 2}" y="${y}" width="${w}" height="1.6" fill="${c}" opacity="${op}"/><rect x="${x - w / 3}" y="${y + 6}" width="${(w * 2) / 3}" height="1.4" fill="${c}" opacity="${op * 0.8}"/><rect x="${x - w / 5}" y="${y + 12}" width="${(w * 2) / 5}" height="1.2" fill="${c}" opacity="${op * 0.6}"/>`;

// ---------- The themes ----------

// ---------- Second set of scenes (from Carlson's mood references) ----------

const circ = (x, y, r, c, op = 1) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}"${op < 1 ? ` opacity="${op}"` : ''}/>`;

// A towering, soft cumulus cloud: shaded underside, bright top.
function cumulus(u, x, y, s, rand, { light = '#ffffff', mid = '#fde9f1', shade = '#f2bfd2', n = 22, w = 46, h = 70, blur = true } = {}) {
  let sh = '', md = '', li = '';
  for (let i = 0; i < n; i++) {
    const hh = rand() * h;
    const cx = (rand() * 2 - 1) * (w - hh * (w / h) * 0.55);
    const cy = -hh;
    const rr = 11 + rand() * 13;
    sh += circ(cx + 3, cy + 5, rr, shade);
    md += circ(cx + 1, cy + 1.5, rr * 0.93, mid);
    li += circ(cx - 3, cy - 3, rr * 0.72, light);
  }
  return `<g transform="translate(${x} ${y}) scale(${s})"${blur ? ` filter="url(#${u}tiny)"` : ''}>${sh}${md}${li}<ellipse cx="0" cy="6" rx="${w}" ry="9" fill="${shade}"/></g>`;
}

// A big billowing cloud: puffy lobes around a dome, pink shading underneath.
function bigCloud(u, x, y, s, rand, { light = '#ffffff', mid = '#fdeef4', shade = '#f2bcd0', W = 70, H = 120 } = {}) {
  let body = `<path d="M${-W} 0 Q${-W} ${-H * 0.7} 0 ${-H} Q${W} ${-H * 0.7} ${W} 0 Z" fill="${mid}"/>`;
  let lobes = '', hi = '', sh = '';
  const N = 34;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), xx = -W + t * 2 * W;
    const edge = -H * Math.pow(Math.max(0, 1 - Math.pow(xx / W, 2)), 0.7);
    const rr = 12 + rand() * 12;
    const yy = edge + rr * 0.55 + (rand() - 0.5) * 6;
    sh += circ(xx + 2, yy + 5, rr, shade, 0.9);
    lobes += circ(xx, yy, rr, mid);
    hi += circ(xx - rr * 0.28, yy - rr * 0.3, rr * 0.62, light);
  }
  for (let i = 0; i < 14; i++) {
    const xx = (rand() * 2 - 1) * W * 0.7, yy = -rand() * H * 0.7 - 10, rr = 12 + rand() * 12;
    sh += circ(xx + 3, yy + 6, rr, shade, 0.5);
    lobes += circ(xx, yy, rr, mid);
    hi += circ(xx - rr * 0.3, yy - rr * 0.3, rr * 0.55, light, 0.9);
  }
  const base = `<path d="M${-W - 10} 4 Q0 -14 ${W + 10} 4 Q0 18 ${-W - 10} 4 Z" fill="${shade}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#${u}tiny)">${body}${sh}${lobes}${hi}${base}</g>`;
}

const streak = (x, y, w, c, op = 0.7) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${(w / 9).toFixed(1)}" fill="${c}" opacity="${op}"/>`;

function maple(x, y, s, c, rot = 0) {
  let d = '';
  const lens = [1, 0.42, 0.8, 0.42, 0.62, 0.3, 0.62, 0.42, 0.8, 0.42];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180, r = lens[i] * 10;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)} `;
  }
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="${d}Z" fill="${c}"/><path d="M0 2 L0 9" stroke="${c}" stroke-width="1"/></g>`;
}
function mapleCluster(rand, x, y, n, spread, colors = ['#c9302c', '#e0483a', '#a8231f', '#f0603e']) {
  let s = '';
  for (let i = 0; i < n; i++) s += maple(x + (rand() * 2 - 1) * spread, y + (rand() * 2 - 1) * spread * 0.7, 0.9 + rand() * 0.9, colors[i % colors.length], rand() * 60 - 30);
  return s;
}

function blobTree(rand, x, y, s, c, n = 12) {
  let b = '';
  for (let i = 0; i < n; i++) b += circ((rand() * 2 - 1) * 16, -26 - rand() * 34, 7 + rand() * 9, c);
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-2" y="-28" width="4" height="28" fill="${c}"/>${b}</g>`;
}

const steamWisp = (u, x, y, h = 60, op = 0.35, w = 6) => `<path d="M${x} ${y} q-9 ${-h * 0.25} 0 ${-h * 0.5} q9 ${-h * 0.25} 0 ${-h * 0.5}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="${op}" filter="url(#${u}soft)"/>`;

const andon = (u, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="-12" rx="26" ry="22" fill="#ffcf85" opacity=".28" filter="url(#${u}soft)"/>
  <rect x="-7" y="-26" width="14" height="22" rx="1" fill="#ffe7b0"/><rect x="-7" y="-26" width="14" height="22" rx="1" fill="none" stroke="#3a2a22" stroke-width="1.6"/>
  <path d="M-7 -15 h14 M0 -26 v22" stroke="#3a2a22" stroke-width=".8"/><rect x="-9" y="-29" width="18" height="3" fill="#3a2a22"/>
  <path d="M-6 -4 L-7 2 M6 -4 L7 2" stroke="#3a2a22" stroke-width="1.4"/>
  <rect x="-2" y="2" width="4" height="${30 / s}" fill="#ffcf85" opacity=".25"/></g>`;

// Hot spring: a covered outdoor bath at dusk, Fuji in the distance, maple leaves.
function onsenScene(u, r) {
  const rimStones = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2, x = 150 + Math.cos(a) * 98, y = 300 + Math.sin(a) * 28;
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(13 + r() * 7).toFixed(1)}" ry="${(7 + r() * 4).toFixed(1)}" fill="${i % 2 ? '#3d465e' : '#333b52'}"/><ellipse cx="${(x - 2).toFixed(1)}" cy="${(y - 3).toFixed(1)}" rx="8" ry="2.4" fill="#6a7896" opacity=".5"/>`;
  }).join('');
  return base(u, ['#3d68a6', '#a7c6e8', '#f6c9a8'])
    + `<g filter="url(#${u}soft)" opacity=".55">${streak(80, 70, 70, '#5a6888')}${streak(220, 95, 60, '#5a6888')}${streak(150, 130, 40, '#7484a4')}</g>`
    + sun(u, 60, 228, 8, '#fff2d8', '#ffd8b8')
    + fuji(u, 180, 236, 92, 88, '#8ea3c6', '#eef2fb')
    + mist(u, 214, 30, 0.55)
    + blobTree(r, 30, 240, 1.7, '#2c3d58') + blobTree(r, 85, 238, 1.3, '#34465f') + blobTree(r, 262, 240, 1.6, '#2c3d58') + blobTree(r, 230, 236, 1.1, '#3a4c66')
    + mist(u, 228, 22, 0.45)
    + `<defs><linearGradient id="${u}floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46566f"/><stop offset="1" stop-color="#1e2a40"/></linearGradient>
       <linearGradient id="${u}water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4cfc8"/><stop offset="1" stop-color="#b8c6e8"/></linearGradient></defs>
       <rect x="0" y="242" width="300" height="158" fill="url(#${u}floor)"/>`
    + streak(70, 262, 60, '#f6c9a8', 0.35) + streak(240, 272, 40, '#a7c6e8', 0.3) + streak(110, 360, 70, '#a7c6e8', 0.18)
    + `<path d="M196 300 Q192 262 204 250 Q216 246 222 262 Q226 284 220 300 Z" fill="#3a4258"/>`
    + `<ellipse cx="150" cy="300" rx="96" ry="26" fill="url(#${u}water)"/><ellipse cx="128" cy="296" rx="52" ry="8" fill="#fff" opacity=".35"/>`
    + rimStones
    + steamWisp(u, 110, 296, 70) + steamWisp(u, 150, 292, 80) + steamWisp(u, 190, 296, 66)
    + andon(u, 232, 296, 1.1) + andon(u, 276, 352, 1.5)
    + `<rect x="0" y="0" width="300" height="20" fill="#1a2030"/><rect x="0" y="18" width="300" height="5" fill="#2a3246"/>
       <path d="M210 23 L268 70" stroke="#1a2030" stroke-width="6"/>
       <rect x="22" y="20" width="9" height="380" fill="#1c2232"/><rect x="104" y="20" width="12" height="380" fill="#1a2030"/><rect x="262" y="20" width="10" height="380" fill="#1c2232"/>
       <rect x="104" y="300" width="12" height="100" fill="#141a28"/>`
    + mapleCluster(r, 270, 50, 26, 40) + mapleCluster(r, 18, 330, 18, 30, ['#c9302c', '#e0483a', '#8a3a6a', '#f0603e'])
    + sparkles(r, 8, 0, 200);
}

// Teahouse: looking out of an open lattice window to misty peaks, tea set in the sun.
function teaScene(u, r) {
  const cup = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="20" rx="17" ry="4" fill="#000" opacity=".25"/>
    <path d="M-15 0 L-12 18 Q0 23 12 18 L15 0 Z" fill="#596b63"/><path d="M-13 6 Q0 10 13 6 M-12 12 Q0 16 12 12" stroke="#7a8c82" stroke-width="1" fill="none"/>
    <path d="M-5 4 q3 6 0 12 M5 3 q-3 5 1 11" stroke="#3e4c46" stroke-width=".8" fill="none"/>
    <ellipse cx="0" cy="0" rx="15" ry="4.4" fill="#45534d"/><ellipse cx="0" cy="0.6" rx="12.5" ry="3.3" fill="#8fbf4e"/></g>`;
  const lattice = (x0, x1, y0, y1, cols, rows) => {
    let d = '';
    for (let i = 1; i < cols; i++) { const x = x0 + ((x1 - x0) * i) / cols; d += `M${x} ${y0} V${y1} `; }
    for (let j = 1; j < rows; j++) { const y = y0 + ((y1 - y0) * j) / rows; d += `M${x0} ${y} H${x1} `; }
    return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="#4a3226" stroke-width="5"/><path d="${d}" stroke="#4a3226" stroke-width="2.6"/>`;
  };
  let cubes = '';
  [[0, 0], [10, 0], [20, 0], [5, -8], [15, -8], [10, -16]].forEach(([dx, dy]) => {
    cubes += `<rect x="${222 + dx}" y="${338 + dy}" width="10" height="9" rx="1.5" fill="#8fc45a"/><rect x="${222 + dx}" y="${338 + dy}" width="10" height="3" rx="1.5" fill="#b8e07a"/>`;
  });
  return `<defs><linearGradient id="${u}out" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6f6"/><stop offset="1" stop-color="#f4f8fa"/></linearGradient>
      <linearGradient id="${u}tbl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e4b48"/><stop offset="1" stop-color="#1c302e"/></linearGradient>
      <linearGradient id="${u}ray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d0" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></linearGradient>
      <filter id="${u}soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="${u}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="${u}tiny" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
    <rect width="300" height="400" fill="#3a2a22"/>
    <rect x="18" y="26" width="264" height="214" fill="url(#${u}out)"/>
    <g>${range(r, 200, 70, '#a9bccb', 0.8)}</g>
    <path d="M128 240 L132 120 Q138 70 156 64 Q172 70 176 110 L182 240 Z" fill="#7d8f88"/>
    <path d="M140 120 Q150 100 160 116 M136 160 Q150 150 168 166 M134 200 Q150 190 176 204" stroke="#5f7a6a" stroke-width="5" fill="none" opacity=".7"/>
    ${mist(u, 150, 50, 0.75)}${range(r, 236, 40, '#8fa6b4', 0.7)}${mist(u, 205, 40, 0.8)}
    ${Array.from({ length: 22 }, () => circ(18 + r() * 80, 30 + r() * 150, 10 + r() * 14, ['#7fb85a', '#9fd06a', '#bfe28a', '#6aa04a'][Math.floor(r() * 4)])).join('')}
    <rect x="18" y="26" width="264" height="214" fill="none"/>
    ${lattice(18, 98, 26, 240, 3, 4)}${lattice(214, 282, 26, 240, 2, 4)}
    <rect x="10" y="18" width="280" height="10" fill="#3a2a22"/><rect x="10" y="238" width="280" height="14" fill="#5a3e2e"/>
    <rect x="0" y="252" width="300" height="148" fill="url(#${u}tbl)"/>
    <path d="M30 270 L270 270 L300 400 L0 400 Z" fill="#c9be86" opacity=".9"/>
    <path d="M30 270 L270 270 M15 335 L285 335" stroke="#2e4b48" stroke-width="3"/>
    <polygon points="60,270 150,270 110,400 0,400 0,350" fill="#fff4c0" opacity=".35"/>
    <polygon points="190,270 250,270 290,400 210,400" fill="#fff4c0" opacity=".3"/>
    <polygon points="0,0 120,0 300,300 300,400 230,400 0,90" fill="url(#${u}ray)" opacity=".5"/>
    <path d="M40 318 L120 306 L150 318 L70 332 Z" fill="#4a3022"/>
    ${cup(72, 300, 1.3)}${cup(122, 296, 1.2)}${cup(150, 334, 1.4)}
    ${steamWisp(u, 72, 290, 50, 0.45, 4)}${steamWisp(u, 122, 286, 46, 0.45, 4)}${steamWisp(u, 150, 322, 50, 0.45, 4)}
    <g transform="translate(212 304)">
      <ellipse cx="0" cy="22" rx="40" ry="7" fill="#000" opacity=".3"/>
      <path d="M-30 -6 Q-36 -22 -48 -26 L-44 -30 Q-30 -26 -24 -14 Z" fill="#26252a"/>
      <ellipse cx="0" cy="0" rx="34" ry="24" fill="#2b2a30"/>
      ${Array.from({ length: 30 }, () => circ((r() * 2 - 1) * 26, (r() * 2 - 1) * 16, 1.4, '#3c3b42')).join('')}
      <ellipse cx="-10" cy="-8" rx="10" ry="5" fill="#5a5a66" opacity=".5"/>
      <ellipse cx="0" cy="-22" rx="14" ry="4" fill="#222126"/><circle cx="0" cy="-27" r="3.4" fill="#222126"/>
      <path d="M-26 -16 Q-24 -56 0 -56 Q24 -56 26 -16" fill="none" stroke="#1e1d22" stroke-width="3"/></g>
    <path d="M206 352 L266 342 L280 356 L220 366 Z" fill="#3a2418"/>${cubes}
    ${Array.from({ length: 40 }, () => circ(238 + r() * 50, 378 + r() * 18, 1.6 + r() * 1.6, ['#6fa040', '#8fc45a', '#5a8a30'][Math.floor(r() * 3)])).join('')}`;
}

// Spring: towering pink clouds over a flower meadow, a black cat watching.
function springScene(u, r) {
  const flower = (x, y, s, c, mid) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4" rx="2.8" ry="4.4" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="1.8" fill="${mid}"/></g>`;
  const colors = [['#f7a8c8', '#ffe08a'], ['#ffffff', '#ffd36b'], ['#b9a2f0', '#fff3c0'], ['#ffb27a', '#fff3c0'], ['#f48fb1', '#fff'], ['#8fb4f0', '#fff']];
  let far = '', near = '';
  for (let i = 0; i < 140; i++) { const [c] = colors[i % colors.length]; far += circ(r() * 300, 262 + r() * 50, 1 + r() * 1.4, c, 0.9); }
  for (let i = 0; i < 70; i++) { const y = 300 + r() * 100, [c, m] = colors[Math.floor(r() * colors.length)]; near += flower(r() * 300, y, 0.6 + ((y - 300) / 100) * 1.6, c, m); }
  return base(u, ['#1f6fd0', '#7fbff0', '#d8ecfa'])
    + bigCloud(u, 205, 220, 1.25, r) + cumulus(u, 50, 120, 0.7, r, { n: 10 }) + cumulus(u, 120, 70, 0.45, r, { n: 8 }) + cumulus(u, 40, 200, 0.5, r, { n: 8 })
    + Array.from({ length: 14 }, () => streak(r() * 300, 20 + r() * 150, 6 + r() * 10, '#fbd0e0', 0.8)).join('')
    + hill(r, 238, 4, '#8fbfb0') + hill(r, 248, 6, '#a6d48e') + hill(r, 262, 5, '#c2e29a')
    + `<rect x="0" y="270" width="300" height="130" fill="#9fd08a"/>`
    + far + near
    + `<g transform="translate(176 268) scale(1.15)" fill="#1b1a26">
        <path d="M-9 0 Q-13 -14 -6 -22 Q0 -26 6 -22 Q13 -14 9 0 Z"/>
        <circle cx="0" cy="-28" r="7"/><path d="M-6 -31 L-6 -39 L-1 -33 Z M6 -31 L6 -39 L1 -33 Z"/>
        <path d="M8 -2 Q20 -4 18 -16 Q17 -24 22 -26" fill="none" stroke="#1b1a26" stroke-width="2.6" stroke-linecap="round"/></g>`
    + petals(r, 24, ['#fbd0e0', '#ffffff', '#f7a8c8']);
}

// Summer A: a sunset beach under big clouds.
function beachScene(u, r) {
  let foam = '';
  for (let i = 0; i < 6; i++) foam += `<path d="M${-20 + r() * 20} ${232 + i * 13} q25 -4 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#fff" stroke-width="${1 + i * 0.25}" opacity=".55"/>`;
  return base(u, ['#2a86dc', '#8cc8f2', '#ffd8b0'])
    + Array.from({ length: 10 }, () => streak(140 + r() * 160, 30 + r() * 90, 12 + r() * 16, '#ffffff', 0.75)).join('')
    + cumulus(u, 45, 205, 1.3, r, { light: '#fff1e6', mid: '#ffd2b8', shade: '#f2a890', n: 22, h: 90, w: 40 })
    + cumulus(u, 230, 190, 1.4, r, { light: '#fffaf2', mid: '#ffe2cc', shade: '#d8b8c8', n: 26, h: 80, w: 50 })
    + cumulus(u, 150, 120, 0.6, r, { light: '#fff', mid: '#ffe8da', shade: '#f2c0b0', n: 10 })
    + sun(u, 90, 214, 10, '#fff6dc', '#ffd8a0')
    + `<path d="M0 214 Q30 208 60 212 L70 216 L0 218 Z M220 216 Q250 206 270 212 Q285 204 300 214 L300 218 L220 218 Z" fill="#2f5a4a"/>`
    + `<defs><linearGradient id="${u}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fa6c0"/><stop offset="1" stop-color="#7ee0d4"/></linearGradient></defs>
       <rect x="0" y="216" width="300" height="100" fill="url(#${u}sea)"/>`
    + `<polygon points="80,216 100,216 140,316 40,316" fill="#fff3c8" opacity=".35"/>`
    + foam
    + `<path d="M0 300 Q60 290 120 304 Q200 318 300 296 L300 400 L0 400 Z" fill="#f2cfa2"/>
       <path d="M0 300 Q60 290 120 304 Q200 318 300 296 L300 306 Q200 328 120 314 Q60 300 0 310 Z" fill="#fff" opacity=".7"/>
       <path d="M0 310 Q60 300 120 314 Q200 328 300 306 L300 324 Q200 342 120 330 Q60 318 0 326 Z" fill="#e2b68a" opacity=".6"/>`
    + Array.from({ length: 9 }, (_, i) => `<ellipse cx="${40 + i * 16 + (i % 2) * 6}" cy="${392 - i * 9}" rx="2.6" ry="1.6" fill="#d9a878"/>`).join('')
    + `<path d="M220 360 l4 -6 l4 6 Z" fill="#fff0e0"/><circle cx="250" cy="372" r="2.4" fill="#ffd8c8"/>`;
}

// Summer B: a huge curling wave with manta rays gliding underneath.
function waveScene(u, r) {
  const manta = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity=".85"><circle cx="0" cy="4" r="16" fill="#c8fff0" opacity=".25" filter="url(#${u}soft)"/><path d="M0 -10 Q14 -3 26 2 Q10 6 3 10 L0 24 L-3 10 Q-10 6 -26 2 Q-14 -3 0 -10 Z" fill="#d8fff2"/></g>`;
  let fish = '';
  for (let i = 0; i < 26; i++) fish += `<path d="M0 0 l4 -1.6 l0 3.2 Z" fill="#e8fff8" opacity=".6" transform="translate(${(r() * 300).toFixed(0)} ${(250 + r() * 150).toFixed(0)}) rotate(${(r() * 40 - 20).toFixed(0)})"/>`;
  let crest = '';
  for (let i = 0; i < 26; i++) {
    const t = i / 25, x = 300 - t * 170, y = 110 - Math.sin(t * Math.PI) * 30 + t * 10;
    crest += circ(x, y, 7 + r() * 8, '#ffffff', 0.9);
  }
  return base(u, ['#0f2a6a', '#2a6ad0', '#7fc8f0']) + stars(r, 25, 60)
    + cumulus(u, 70, 120, 0.9, r, { light: '#ffffff', mid: '#eaf4ff', shade: '#bcd4f0', n: 16, h: 50, w: 60 })
    + cumulus(u, 240, 80, 0.7, r, { light: '#ffffff', mid: '#eaf4ff', shade: '#bcd4f0', n: 12, h: 40, w: 50 })
    + `<defs><linearGradient id="${u}deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ab0b8"/><stop offset="1" stop-color="#0f5a7a"/></linearGradient>
         <linearGradient id="${u}wall" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fe0d0"/><stop offset=".6" stop-color="#1f9aaa"/><stop offset="1" stop-color="#0f6a86"/></linearGradient></defs>
       <rect x="0" y="150" width="300" height="250" fill="url(#${u}deep)"/>
       <path d="M300 400 L300 100 Q240 70 180 96 Q132 120 130 160 Q130 196 162 200 Q190 200 192 176 Q192 160 176 160 Q166 164 170 174 Q150 168 156 146 Q166 118 206 116 Q250 120 262 170 Q272 230 220 300 L170 400 Z" fill="url(#${u}wall)"/>
       <path d="M176 160 Q192 160 192 176 Q190 200 162 200 Q130 196 130 160" fill="none" stroke="#bff6ec" stroke-width="3" opacity=".7"/>
       <path d="M300 160 Q270 200 240 320 M290 220 Q262 270 240 360" stroke="#9ff0e2" stroke-width="2" fill="none" opacity=".4"/>`
    + crest + `<g filter="url(#${u}soft)">${circ(150, 150, 14, '#fff', 0.8)}${circ(160, 190, 10, '#fff', 0.7)}</g>`
    + fish + manta(60, 300, 1.4, -15) + manta(120, 350, 1.1, -10) + manta(40, 370, 0.9, -20) + manta(200, 380, 1.2, -5) + manta(95, 255, 0.8, -25)
    + `<g filter="url(#${u}tiny)" opacity=".5">${Array.from({ length: 8 }, () => streak(r() * 300, 170 + r() * 100, 20 + r() * 30, '#bff6ec', 0.5)).join('')}</g>`;
}

// Winter: a snowman with a glowing lantern on a quiet snowy night.
function winterScene(u, r) {
  let prints = '';
  for (let i = 0; i < 10; i++) prints += `<ellipse cx="${(60 + i * 12 + (i % 2) * 6).toFixed(0)}" cy="${(392 - i * 7).toFixed(0)}" rx="${(3.2 - i * 0.12).toFixed(1)}" ry="${(1.8 - i * 0.07).toFixed(1)}" fill="#7a90c0" opacity=".7"/>`;
  return base(u, ['#0c1838', '#1f3466', '#3a5490']) + stars(r, 90, 210)
    + `<path d="M0 230 Q60 214 120 222 Q200 212 300 226 L300 260 L0 260 Z" fill="#22355f"/>`
    + Array.from({ length: 12 }, (_, i) => pine(i * 26 + 4, 236 + (i % 3) * 4, 0.55, '#1a2a4c', true)).join('')
    + house(80, 238, 0.9, '#3a3a52', '#2a2a40', true, true)
    + `<path d="M88 200 q-6 -10 2 -18 q8 -8 0 -18" fill="none" stroke="#c8d0e8" stroke-width="3" opacity=".35" filter="url(#${u}soft)"/>`
    + `<defs><radialGradient id="${u}lamp" cx="220" cy="350" r="130" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe4a8"/><stop offset=".35" stop-color="#d8c8c8"/><stop offset="1" stop-color="#6f86c0" stop-opacity="0"/></radialGradient>
         <linearGradient id="${u}snowg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f86c0"/><stop offset="1" stop-color="#b9c8ea"/></linearGradient></defs>
       <path d="M0 252 Q150 240 300 254 L300 400 L0 400 Z" fill="url(#${u}snowg)"/>
       <path d="M0 252 Q150 240 300 254 L300 400 L0 400 Z" fill="url(#${u}lamp)"/>`
    + prints
    + `<g transform="translate(205 352)">
        <ellipse cx="0" cy="4" rx="34" ry="7" fill="#5a6ea8" opacity=".5"/>
        <circle cx="0" cy="-22" r="26" fill="#f6f2ee"/><circle cx="0" cy="-62" r="19" fill="#f8f5f2"/><circle cx="0" cy="-92" r="14" fill="#faf8f6"/>
        <circle cx="6" cy="-26" r="22" fill="#ffe2b0" opacity=".4"/>
        <path d="M-5 -95 q1.6 1.8 3.2 0 M2 -95 q1.6 1.8 3.2 0" fill="none" stroke="#3b2a20" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M0 -90 l10 2 l-10 2 Z" fill="#f29a4a"/><path d="M-4 -85 q4 3 8 0" fill="none" stroke="#3b2a20" stroke-width="1" stroke-linecap="round"/>
        <path d="M-15 -80 q15 8 30 0 l0 5 q-15 7 -30 0 Z" fill="#c8302c"/><path d="M8 -76 l5 20 l-7 1 l-3 -19 Z" fill="#c8302c"/>
        <ellipse cx="0" cy="-104" rx="15" ry="3.4" fill="#7a5a44"/><path d="M-10 -104 L-9 -122 Q0 -126 9 -122 L10 -104 Z" fill="#8a6a50"/><rect x="-10" y="-110" width="20" height="3" fill="#c8302c"/>
        <circle cx="0" cy="-66" r="2" fill="#2a2a34"/><circle cx="0" cy="-56" r="2" fill="#2a2a34"/><circle cx="0" cy="-30" r="2" fill="#2a2a34"/>
        <path d="M-17 -64 L-40 -84" stroke="#5a3e2a" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="-42" cy="-88" rx="5" ry="6" fill="#c8302c"/>
        <path d="M17 -64 L36 -52" stroke="#5a3e2a" stroke-width="2.4" stroke-linecap="round"/></g>`
    + `<g transform="translate(250 380)"><circle cx="0" cy="-12" r="26" fill="#ffd27a" opacity=".35" filter="url(#${u}soft)"/>
        <rect x="-7" y="-22" width="14" height="20" rx="2" fill="#ffe7a8"/><rect x="-7" y="-22" width="14" height="20" rx="2" fill="none" stroke="#2a2420" stroke-width="2"/>
        <path d="M-9 -24 L0 -30 L9 -24 Z" fill="#2a2420"/><path d="M-4 -30 Q0 -36 4 -30" fill="none" stroke="#2a2420" stroke-width="1.4"/><rect x="-8" y="-3" width="16" height="3" fill="#2a2420"/></g>`
    + `<g transform="translate(290 300)">${pine(0, 60, 1.4, '#22354a', true)}</g>`
    + snow(r, 50);
}

// Christmas: a snowy shopping street with a giant tree and garlands.
function xmasScene(u, r) {
  const vp = [168, 236];
  const shop = (side, i) => {
    const t = i / 4, x0 = side < 0 ? -10 + t * 120 : 310 - t * 120, w = 70 * (1 - t * 0.75), h = 150 * (1 - t * 0.7);
    const yb = 400 - t * 160, top = yb - h;
    const xa = side < 0 ? x0 : x0 - w;
    const sign = ['#e8584a', '#f6a6c0', '#e8a23a', '#d9483b'][i % 4];
    return `<g><rect x="${xa}" y="${top}" width="${w}" height="${h}" fill="${['#7a3a3a', '#8a5a4a', '#5a4a5a', '#7a4a3a'][i % 4]}"/>
      <rect x="${xa + w * 0.1}" y="${top + h * 0.12}" width="${w * 0.8}" height="${h * 0.16}" fill="${sign}"/>
      <rect x="${xa + w * 0.2}" y="${top + h * 0.17}" width="${w * 0.6}" height="${h * 0.05}" fill="#fff3d6" opacity=".7"/>
      <rect x="${xa + w * 0.08}" y="${top + h * 0.5}" width="${w * 0.84}" height="${h * 0.34}" fill="#ffd88a"/>
      <rect x="${xa + w * 0.08}" y="${top + h * 0.5}" width="${w * 0.84}" height="${h * 0.34}" fill="#ffb24a" opacity=".25"/>
      <path d="M${xa - 2} ${top + h * 0.46} L${xa + w + 2} ${top + h * 0.46} L${xa + w - 4} ${top + h * 0.38} L${xa + 4} ${top + h * 0.38} Z" fill="#2f7a55"/>
      <rect x="${xa - 2}" y="${top - 3}" width="${w + 4}" height="5" rx="2" fill="#fff"/>
      <circle cx="${xa + w / 2}" cy="${top + h * 0.5}" r="${w * 0.6}" fill="#ffd27a" opacity=".12"/></g>`;
  };
  let shops = '';
  for (let i = 3; i >= 0; i--) shops += shop(-1, i) + shop(1, i);
  const garl = (y, sag, scale) => {
    const colors = ['#ffd36b', '#ff7f7f', '#8fd3ff', '#a8f0b0', '#ffa8e0'];
    let s = `<path d="M0 ${y} Q150 ${y + sag} 300 ${y}" fill="none" stroke="#2f6a48" stroke-width="${2.4 * scale}"/>`;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, x = t * 300, yy = y + 2 * sag * t * (1 - t);
      s += circ(x, yy + 2, 4 * scale, colors[i % 5], 0.35) + circ(x, yy + 2, 1.8 * scale, colors[i % 5]);
    }
    return s;
  };
  return base(u, ['#1e5aa8', '#5a9ad8', '#a8d0f0']) + stars(r, 30, 120)
    + `<path d="M240 30 L150 92" stroke="#fff" stroke-width="1.4" opacity=".8"/><circle cx="150" cy="92" r="2" fill="#fff"/>`
    + cumulus(u, 230, 150, 1.3, r, { light: '#fff6ec', mid: '#ffe0c8', shade: '#e8b8b0', n: 24, h: 80, w: 60 })
    + cumulus(u, 60, 70, 0.6, r, { light: '#fff', mid: '#ffe8da', shade: '#e8c0c0', n: 10 })
    + xmasTree(78, 250, 3.4, r)
    + `<path d="M40 400 L160 236 L176 236 L300 400 Z" fill="#40465e"/><path d="M150 400 L166 236 L170 236 L170 400 Z" fill="#525a74" opacity=".5"/>`
    + shops
    + `<path d="M0 400 L0 360 Q20 350 40 362 L70 400 Z M300 400 L300 356 Q280 346 262 360 L232 400 Z" fill="#fbfdff"/>`
    + `<path d="M30 0 L34 400 M276 0 L272 400" stroke="#2a2a38" stroke-width="5"/><path d="M0 60 Q150 90 300 56 M0 74 Q150 100 300 70" stroke="#2a2a38" stroke-width="1" fill="none"/>`
    + garl(150, 20, 0.7) + garl(110, 30, 0.9) + garl(70, 44, 1.2)
    + snow(r, 50);
}

// Halloween: a moonlit concert by the river — a witch on violin, a piano, a castle.
function halloweenScene(u, r) {
  return base(u, ['#1e0c42', '#5a24a0', '#8a50d0'])
    + `<g filter="url(#${u}soft)" opacity=".6">${streak(70, 160, 70, '#b06ad8')}${streak(240, 190, 60, '#b06ad8')}${streak(160, 60, 80, '#7a3ab8')}</g>`
    + `<circle cx="150" cy="105" r="80" fill="#e8d8ff" opacity=".35" filter="url(#${u}blur)"/><circle cx="150" cy="105" r="38" fill="#fbf6ff"/>`
    + Array.from({ length: 10 }, () => bat(40 + r() * 220, 40 + r() * 150, 0.5 + r() * 0.7, '#180a30')).join('')
    + `<g fill="#1c0e3a"><rect x="200" y="200" width="90" height="60"/><rect x="214" y="160" width="14" height="50"/><path d="M210 162 L221 132 L232 162 Z"/>
        <rect x="248" y="150" width="16" height="60"/><path d="M244 152 L256 116 L268 152 Z"/><rect x="276" y="176" width="12" height="40"/><path d="M273 178 L282 150 L291 178 Z"/></g>
       ${[[220, 180], [254, 170], [254, 196], [234, 220], [270, 222]].map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="6" fill="#ffd27a"/>`).join('')}`
    + blobTree(r, 20, 250, 2.4, '#140828', 16) + blobTree(r, 60, 260, 1.5, '#1a0c34')
    + `<path d="M0 262 Q150 250 300 266 L300 300 Q150 290 0 302 Z" fill="#3a5ad0" opacity=".9"/>`
    + streak(150, 276, 30, '#e8e0ff', 0.7) + streak(150, 286, 18, '#e8e0ff', 0.6) + streak(80, 272, 20, '#9fb4ff', 0.5)
    + `<path d="M0 300 Q150 288 300 304 L300 400 L0 400 Z" fill="#1a0c30"/>`
    + `<g transform="translate(220 352)">
        <path d="M-52 0 L-52 -24 Q-50 -40 -20 -40 Q10 -40 30 -56 Q48 -66 56 -50 L56 0 Z" fill="#120822"/>
        <rect x="-50" y="-26" width="70" height="5" fill="#e8e0f0"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${-48 + i * 7}" y="-26" width="3" height="3" fill="#120822"/>`).join('')}
        <path d="M-46 0 L-46 18 M40 0 L40 18" stroke="#120822" stroke-width="4"/>
        <path d="M18 -60 L30 -86 L36 -80 L34 -60 Z" fill="#2a1450"/><ellipse cx="28" cy="-60" rx="16" ry="3.4" fill="#2a1450"/></g>`
    + `<g transform="translate(78 360)">
        <path d="M-22 10 Q-20 -24 -6 -38 L8 -38 Q22 -24 24 10 Z" fill="#160a2a"/>
        <circle cx="1" cy="-44" r="7" fill="#e8d4c8"/><path d="M-6 -46 Q-4 -40 4 -40 Q8 -44 8 -48 L6 -40 Q8 -30 -2 -30 Q-10 -32 -8 -44 Z" fill="#2a1a3a"/>
        <ellipse cx="1" cy="-51" rx="15" ry="3.4" fill="#160a2a"/><path d="M-8 -52 L4 -76 L10 -70 L9 -52 Z" fill="#160a2a"/>
        <g transform="translate(12 -36) rotate(-30)"><ellipse cx="0" cy="0" rx="5" ry="8" fill="#a8582a"/><ellipse cx="0" cy="-2" rx="3.4" ry="2" fill="#8a4420"/><rect x="-1" y="-16" width="2" height="10" fill="#3a2010"/></g>
        <path d="M-6 -30 L34 -52" stroke="#e8d8c0" stroke-width="1.2"/></g>`
    + pumpkin(28, 392, 1.5) + `<g transform="translate(52 392)"><rect x="-2" y="-12" width="4" height="12" fill="#f6ecd8"/><ellipse cx="0" cy="-16" rx="2" ry="3.6" fill="#ffd27a"/><circle cx="0" cy="-16" r="8" fill="#ffd27a" opacity=".3"/></g>`
    + `<g transform="translate(150 396)"><rect x="-2" y="-10" width="4" height="10" fill="#f6ecd8"/><ellipse cx="0" cy="-14" rx="2" ry="3.4" fill="#ffd27a"/><circle cx="0" cy="-14" r="8" fill="#ffd27a" opacity=".3"/></g>`
    + fireflies(u, r, 10, 300, 390, '#c8a8ff');
}

// Easter: a sunny meadow under the trees full of bunnies and big painted eggs.
function easterScene(u, r) {
  const items = [];
  for (let i = 0; i < 16; i++) items.push({ kind: 'bunny', x: 10 + r() * 280, y: 270 + r() * 120 });
  for (let i = 0; i < 12; i++) items.push({ kind: 'egg', x: 10 + r() * 280, y: 270 + r() * 125, c: ['#f6a5c0', '#a9d4f5', '#ffd36b', '#c9a7f0', '#9fe0c0', '#f7b27a'][i % 6], p: i });
  items.sort((a, b) => a.y - b.y);
  const scale = (y) => 0.5 + ((y - 260) / 140) * 1.4;
  return base(u, ['#8fc6ee', '#cfe6f8', '#f4fbff'])
    + cumulus(u, 150, 170, 0.9, r, { light: '#fff', mid: '#f2f8ff', shade: '#d0e2f2', n: 14, w: 60, h: 40 })
    + hill(r, 218, 6, '#9cc0c8') + hill(r, 230, 5, '#8fbf8a')
    + `<path d="M0 238 L300 238" stroke="#b8a888" stroke-width="1"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 20}" y="228" width="2" height="12" fill="#b8a888"/>`).join('')}`
    + Array.from({ length: 10 }, (_, i) => circ(i * 34, 240, 16, '#6fa85a')).join('')
    + `<rect x="0" y="246" width="300" height="154" fill="#8ed06a"/>`
    + Array.from({ length: 10 }, () => `<ellipse cx="${(r() * 300).toFixed(0)}" cy="${(270 + r() * 120).toFixed(0)}" rx="${(20 + r() * 30).toFixed(0)}" ry="${(5 + r() * 6).toFixed(0)}" fill="#c8f08a" opacity=".55"/>`).join('')
    + Array.from({ length: 30 }, () => daisy(r() * 300, 260 + r() * 140, 0.8 + r() * 0.8, ['#fff', '#ffd6e6', '#fff6c8'][Math.floor(r() * 3)])).join('')
    + items.map((it) => it.kind === 'bunny' ? bunny(it.x, it.y, scale(it.y)) : egg(it.x, it.y, scale(it.y) * 1.5, it.c, '#fff', it.p)).join('')
    + `<rect x="0" y="0" width="14" height="300" fill="#6a4a36"/><rect x="284" y="0" width="16" height="320" fill="#6a4a36"/>`
    + Array.from({ length: 40 }, () => circ(r() * 300, r() * 60, 16 + r() * 18, ['#5f9a4a', '#7fb85a', '#9fd06a', '#4f8a3a'][Math.floor(r() * 4)])).join('')
    + `<g filter="url(#${u}soft)" opacity=".45"><polygon points="120,40 150,40 220,400 150,400" fill="#fff8d0"/><polygon points="200,50 216,50 270,400 236,400" fill="#fff8d0"/></g>`
    + sparkles(r, 14, 60, 260);
}

// Cherry blossom: a full moon over misty stone pillars, petals drifting.
function sakuraScene(u, r) {
  const pillar = (x, w, top, c) => `<path d="M${x - w / 2} 400 L${x - w / 2} ${top + 20} Q${x - w / 2 + 2} ${top} ${x} ${top - 4} Q${x + w / 2 - 2} ${top} ${x + w / 2} ${top + 16} L${x + w / 2} 400 Z" fill="${c}"/>`;
  const blossom = (cx, cy, n, spread, cols) => Array.from({ length: n }, () => circ(cx + (r() * 2 - 1) * spread, cy + (r() * 2 - 1) * spread * 0.6, 5 + r() * 8, cols[Math.floor(r() * cols.length)])).join('');
  return base(u, ['#454a76', '#76698f', '#c89aa8'])
    + `<g filter="url(#${u}soft)" opacity=".4">${streak(200, 150, 70, '#9a8ab0')}${streak(80, 210, 60, '#9a8ab0')}</g>`
    + `<circle cx="140" cy="88" r="70" fill="#f4eeff" opacity=".3" filter="url(#${u}blur)"/><circle cx="140" cy="88" r="27" fill="#fbf8f0"/><ellipse cx="146" cy="94" rx="14" ry="4" fill="#e8e2e8" opacity=".6"/>`
    + pillar(56, 26, 140, '#4a4568') + pillar(92, 20, 176, '#524d72') + pillar(270, 30, 150, '#4a4568') + pillar(236, 14, 200, '#56517a')
    + `<path d="M110 400 L120 246 Q160 206 196 244 Q226 222 250 256 L262 400 Z" fill="#4c4770"/>`
    + mist(u, 280, 50, 0.45, '#e8d0e0')
    + pillar(20, 16, 260, '#463f5e') + pillar(40, 22, 290, '#4a4262')
    + `<path d="M0 400 L0 330 Q80 316 150 332 Q220 316 300 330 L300 400 Z" fill="#3e3550"/>`
    + blossom(14, 18, 24, 34, ['#7a3a54', '#9a4a66', '#b35a78']) + blossom(296, 70, 18, 28, ['#7a3a54', '#9a4a66', '#b35a78'])
    + blossom(296, 380, 22, 34, ['#f2b8d0', '#e89ab8', '#fbd4e2']) + blossom(14, 380, 18, 30, ['#f2b8d0', '#e89ab8', '#fbd4e2']) + blossom(20, 260, 10, 20, ['#9a4a66', '#b35a78'])
    + petals(r, 70, ['#f7b8cc', '#f2a0bc', '#fbd4e2'])
    + Array.from({ length: 60 }, () => circ(60 + r() * 220, 60 + r() * 240, 0.7, '#3a2a3a', 0.6)).join('')
    + sparkles(r, 20, 120, 380);
}

const T = (name) => TOD[name];

// Each theme lists its wallpapers; `seed` keeps the scattered details the same every time.
const THEMES = {
  spring: { name: 'Spring', walls: [{ draw: springScene, seed: 201 }] },
  summer: { name: 'Summer', walls: [{ draw: beachScene, seed: 202 }, { draw: waveScene, seed: 203 }] },
  autumn: { name: 'Autumn', walls: [{ seed: 1095, draw: (u, r) => { const t = T('dawn'); return base(u, t.sky) + rays(u) + sun(u, 90, 140, 16, t.sun, t.glow) + range(r, 250, 50, '#c9a7b8', .7) + mist(u, 230, 40, .7) + Array.from({ length: 7 }, (_, i) => autumnTree(i * 48 + 10, 320, 1, r, ['#f2a03d', '#e8743b', '#f6c453'])).join('') + mist(u, 300, 40, .5) + leaves(r, 18) + fog(u); } }] },
  winter: { name: 'Winter', walls: [{ draw: winterScene, seed: 204 }] },
  halloween: { name: 'Halloween', walls: [{ draw: halloweenScene, seed: 206 }] },
  easter: { name: 'Easter', walls: [{ draw: easterScene, seed: 207 }] },
  sakura: { name: 'Cherry blossom', walls: [{ draw: sakuraScene, seed: 208 }] },
  fuji: { name: 'Mount Fuji', walls: [{ seed: 1317, draw: (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 90, 200) + moon(u, 220, 70, 14) + fuji(u, 150, 290, 160, 170, '#2a3a6a', '#dde6ff') + `<rect x="0" y="290" width="300" height="110" fill="#1a2a55"/>` + `<g opacity=".35" transform="translate(0 592) scale(1 -1)">${pagoda(58, 296, 1.7, '#0f1736')}</g>` + pagoda(58, 296, 1.7, '#0f1736') + [[-6, -24], [4, -40], [-2, -56]].map(([dx, dy]) => `<rect x="${58 + dx * 1.7}" y="${296 + dy * 1.7}" width="4" height="4" fill="#ffd88a" opacity=".85"/>`).join('') + reflection(220, 300, 40, '#fff8dc', .5) + fireflies(u, r, 12, 300, 390, '#cfe0ff') + fog(u, .3); } }] },
  teahouse: { name: 'Teahouse', walls: [{ draw: teaScene, seed: 209 }] },
  onsen: { name: 'Hot spring', walls: [{ draw: onsenScene, seed: 210 }] },
};

export const THEME_IDS = Object.keys(THEMES);
export function themeName(id) { return THEMES[id]?.name || ''; }

export function wallpaperCount(theme) { return THEMES[theme]?.walls.length || 0; }

// Returns an SVG string for one wallpaper of a theme.
export function wallpaperSVG(theme, variant = 0, { slice = true } = {}) {
  const t = THEMES[theme];
  if (!t) return '';
  const w = t.walls[variant % t.walls.length];
  const u = `w${++uidCount}`;
  const inner = w.draw(u, rng(w.seed));
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="${slice ? 'xMidYMid slice' : 'xMidYMid meet'}" aria-hidden="true">${inner}</svg>`;
}
