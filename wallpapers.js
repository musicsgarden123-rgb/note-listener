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

const T = (name) => TOD[name];

const THEMES = {
  spring: {
    name: 'Spring',
    draw: [
      (u, r) => { const t = T('dawn'); return base(u, t.sky) + rays(u) + sun(u, 210, 120, 16, t.sun, t.glow) + hill(r, 260, 10, '#c6dfb4') + hill(r, 300, 14, '#a8d29a') + hill(r, 340, 10, '#8cc386') + [40, 70, 100, 130, 170, 200, 240, 270].map((x, i) => tulip(x, 370 + (i % 2) * 8, 1.1, ['#f6a5c0', '#ffd36b', '#f28b82', '#c9a7f0'][i % 4])).join('') + petals(r, 20) + fog(u); },
      (u, r) => { const t = T('day'); return base(u, t.sky) + rays(u) + sun(u, 70, 80, 18, t.sun, t.glow) + hill(r, 250, 16, '#bfe3b0') + hill(r, 290, 18, '#9fd59a') + hill(r, 335, 12, '#7fc282') + Array.from({ length: 30 }, () => daisy(r() * W, 300 + r() * 90, 1 + r() * .6, ['#fff', '#ffe1ec', '#fff6c8'][Math.floor(r() * 3)])).join('') + butterfly(120, 200, 1.8, '#f6a5c0') + butterfly(200, 230, 1.5, '#ffd36b') + butterfly(90, 250, 1.3, '#a9d4f5') + fog(u); },
      (u, r) => { const t = T('golden'); return base(u, t.sky) + rays(u) + sun(u, 150, 170, 20, t.sun, t.glow) + hill(r, 270, 10, '#e6c99a') + blossomTree(70, 320, 1.1, r) + blossomTree(240, 330, 0.9, r) + hill(r, 330, 10, '#b9cf8e') + petals(r, 40) + fog(u); },
      (u, r) => { const t = T('dusk'); return base(u, t.sky) + rays(u, .3) + sun(u, 150, 230, 18, t.sun, t.glow) + hill(r, 260, 8, '#8a7aa6') + Array.from({ length: 5 }, (_, row) => Array.from({ length: 12 }, (_, i) => tulip(i * 26 + (row % 2) * 13, 300 + row * 22, 0.7 + row * 0.15, ['#f6a5c0', '#ffd36b', '#f28b82', '#c9a7f0', '#fff'][row])).join('')).join('') + sparkles(r, 20, 0, 200) + fog(u); },
      (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 70) + moon(u, 220, 80, 16) + hill(r, 270, 12, '#3a5a6a') + hill(r, 310, 14, '#2f4c5a') + Array.from({ length: 18 }, () => tulip(r() * W, 350 + r() * 40, 1, ['#c9a7f0', '#f6a5c0', '#a9d4f5'][Math.floor(r() * 3)])).join('') + fireflies(u, r, 22) + fog(u, .4); },
    ],
  },
  summer: {
    name: 'Summer',
    draw: [
      (u, r) => { const t = T('day'); return base(u, t.sky) + rays(u) + sun(u, 220, 70, 20, t.sun, t.glow) + sea(230, '#4fb6d6', '#fff') + sand(310) + palm(60, 340, 1.2) + `<ellipse cx="200" cy="340" rx="30" ry="4" fill="#e9c88f"/>` + fog(u, .5); },
      (u, r) => { const t = T('golden'); return base(u, t.sky) + rays(u) + sun(u, 150, 215, 26, t.sun, t.glow) + sea(230, '#e8956a', '#ffe0b0') + reflection(150, 240, 80, '#fff3c0', .6) + reflection(150, 262, 50, '#fff3c0', .5) + sand(330, '#e8c08a') + palm(250, 350, 1) + fog(u, .5); },
      (u, r) => { const t = T('day'); return base(u, t.sky) + rays(u) + sun(u, 80, 70, 18, t.sun, t.glow) + hill(r, 240, 10, '#a8d4a6') + hill(r, 280, 8, '#8fc07a') + Array.from({ length: 4 }, (_, row) => Array.from({ length: 9 }, (_, i) => sunflower(i * 36 + (row % 2) * 18, 310 + row * 26, 0.6 + row * 0.18)).join('')).join('') + fog(u, .5); },
      (u, r) => { const t = T('dusk'); return base(u, t.sky) + rays(u, .3) + sun(u, 90, 210, 18, t.sun, t.glow) + sea(225, '#5a5f95', '#f0a689') + reflection(90, 236, 60, '#ffd6b0', .5) + sand(320, '#c99a86') + palm(230, 340, 1.3) + palm(270, 350, 0.9) + sparkles(r, 25, 0, 180) + fog(u, .4); },
      (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 90, 200) + moon(u, 150, 110, 18) + sea(230, '#1f3566', '#b8c8ff') + reflection(150, 242, 60, '#fff8dc', .6) + reflection(150, 266, 40, '#fff8dc', .45) + sand(330, '#5a6080') + fireflies(u, r, 10, 300, 380) + fog(u, .3); },
    ],
  },
  autumn: {
    name: 'Autumn',
    draw: [
      (u, r) => { const t = T('golden'); return base(u, t.sky) + rays(u) + sun(u, 150, 130, 18, t.sun, t.glow) + hill(r, 270, 10, '#d8a066') + autumnTree(50, 320, 1.4, r) + autumnTree(150, 300, 1.1, r) + autumnTree(255, 325, 1.5, r) + hill(r, 330, 8, '#b9733f') + leaves(r, 30) + fog(u); },
      (u, r) => { const t = T('day'); return base(u, t.sky) + rays(u) + sun(u, 230, 70, 16, t.sun, t.glow) + hill(r, 230, 14, '#e2b27a') + hill(r, 270, 16, '#d08a4a') + Array.from({ length: 9 }, (_, i) => autumnTree(i * 36 + 10, 300 + (i % 3) * 10, 0.7, r)).join('') + hill(r, 320, 12, '#b8662f') + leaves(r, 25) + fog(u); },
      (u, r) => { const t = T('dusk'); return base(u, t.sky) + rays(u, .3) + sun(u, 150, 200, 16, t.sun, t.glow) + autumnTree(40, 360, 2, r, ['#c9472f', '#a8382f', '#e8743b']) + autumnTree(260, 360, 2, r, ['#c9472f', '#e8743b', '#f2a03d']) + `<path d="M120 400 Q140 320 150 260 Q160 320 180 400 Z" fill="#c99a6a" opacity=".7"/>` + leaves(r, 30) + fog(u, .5); },
      (u, r) => { const t = T('dawn'); return base(u, t.sky) + rays(u) + sun(u, 90, 140, 16, t.sun, t.glow) + range(r, 250, 50, '#c9a7b8', .7) + mist(u, 230, 40, .7) + Array.from({ length: 7 }, (_, i) => autumnTree(i * 48 + 10, 320, 1, r, ['#f2a03d', '#e8743b', '#f6c453'])).join('') + mist(u, 300, 40, .5) + leaves(r, 18) + fog(u); },
      (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 60) + `<circle cx="150" cy="150" r="70" fill="#ffd27a" opacity=".2" filter="url(#${u}blur)"/><circle cx="150" cy="150" r="42" fill="#ffcf7a"/>` + hill(r, 280, 10, '#3a3050') + autumnTree(60, 320, 1.2, r, ['#a8382f', '#c9472f', '#8a3a2a']) + autumnTree(240, 330, 1.3, r, ['#a8382f', '#c9472f', '#e8743b']) + pumpkin(130, 370, 1, false) + pumpkin(170, 375, .8, false) + leaves(r, 15) + fog(u, .3); },
    ],
  },
  winter: {
    name: 'Winter',
    draw: [
      (u, r) => { const t = T('day'); return base(u, ['#8fb8de', '#c4dcf0', '#eef6fc']) + rays(u) + sun(u, 210, 80, 16, t.sun, t.glow) + hill(r, 260, 12, '#e6f0fa') + Array.from({ length: 8 }, (_, i) => pine(i * 40 + 10, 300 + (i % 2) * 14, 0.9, '#4f7a6a', true)).join('') + hill(r, 320, 10, '#f6faff') + snow(r, 50) + fog(u); },
      (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 80) + moon(u, 80, 90, 14) + hill(r, 270, 14, '#c6d4ec') + Array.from({ length: 6 }, (_, i) => pine(i * 56 + 20, 320, 1.1, '#2f4c5a', true)).join('') + hill(r, 330, 10, '#dde8f6') + snow(r, 60) + fog(u, .4); },
      (u, r) => { const t = T('dawn'); return base(u, t.sky) + rays(u) + sun(u, 150, 200, 18, t.sun, t.glow) + hill(r, 260, 16, '#f2e6f0') + hill(r, 300, 18, '#e9eef8') + hill(r, 345, 12, '#fbfdff') + pine(60, 330, 1.2, '#6a7a8a', true) + pine(250, 340, 1, '#6a7a8a', true) + snow(r, 35) + fog(u); },
      (u, r) => { const t = T('dusk'); return base(u, t.sky) + stars(r, 30, 120) + rays(u, .25) + hill(r, 280, 12, '#c9c3e0') + house(150, 320, 2.2, '#8a5a4a', '#5a3f4a', true, true) + pine(60, 330, 1.3, '#3f5a5a', true) + pine(250, 335, 1.2, '#3f5a5a', true) + hill(r, 335, 8, '#e6e6f6') + snow(r, 50) + fog(u, .5); },
      (u, r) => { const t = T('day'); return base(u, ['#9cc4e4', '#cfe3f3', '#f2f8fd']) + rays(u) + sun(u, 70, 70, 16, t.sun, t.glow) + hill(r, 270, 12, '#e6f0fa') + pine(40, 310, 1, '#4f7a6a', true) + pine(270, 300, 1.2, '#4f7a6a', true) + hill(r, 320, 8, '#f6faff') + snowman(150, 360, 2) + snow(r, 40) + fog(u); },
    ],
  },
  christmas: {
    name: 'Christmas',
    draw: [
      (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 70) + hill(r, 300, 10, '#d6e2f4') + xmasTree(150, 330, 2.6, r) + gift(95, 345, 22, 16, '#e8584a') + gift(205, 348, 18, 14, '#4f86c6') + gift(120, 352, 14, 10, '#6fb06a') + snow(r, 50) + fog(u, .4); },
      (u, r) => { const t = T('dusk'); return base(u, t.sky) + stars(r, 20, 120) + hill(r, 290, 10, '#cfd6ee') + house(50, 320, 1.4, '#a8604a', '#5a3f4a', true, true) + house(130, 310, 1.6, '#c9a27a', '#4a3f5a', true, true) + house(215, 322, 1.3, '#8a7aa6', '#3a3550', true, true) + xmasTree(270, 330, 1.2, r) + garland(r) + hill(r, 330, 8, '#eef0fa') + snow(r, 50) + fog(u, .5); },
      (u, r) => { const t = T('night'); return base(u, ['#1a1f4a', '#3a3a7a', '#6a6aa8']) + `<circle cx="150" cy="120" r="80" fill="#fff3a0" opacity=".18" filter="url(#${u}blur)"/>` + rays(u, .35) + stars(r, 50) + xmasTree(150, 360, 4, r) + snow(r, 40) + fog(u, .5); },
      (u, r) => { const t = T('day'); return base(u, ['#9cc4e4', '#cfe3f3', '#f2f8fd']) + rays(u) + sun(u, 230, 70, 14, t.sun, t.glow) + hill(r, 280, 12, '#eef4fb') + xmasTree(90, 340, 1.8, r) + snowman(200, 360, 1.8) + gift(130, 362, 18, 14, '#e8584a') + snow(r, 40) + fog(u); },
      (u, r) => { const t = T('night'); return base(u, ['#3a1f2a', '#6a2a3a', '#a8484a']) + garland(r) + `<g transform="translate(0 40)">${garland(r)}</g>` + `<circle cx="150" cy="330" r="90" fill="#ffd27a" opacity=".2" filter="url(#${u}blur)"/>` + gift(110, 380, 50, 40, '#2f7a55', '#ffd36b') + gift(190, 380, 44, 52, '#e8e0d0', '#d9483b') + gift(150, 385, 34, 24, '#4f6f8f', '#fff3c0') + gift(60, 385, 30, 22, '#d9483b', '#ffd36b') + gift(245, 385, 34, 28, '#f2a03d', '#fff') + snow(r, 40) + sparkles(r, 20); },
    ],
  },
  halloween: {
    name: 'Halloween',
    draw: [
      (u, r) => base(u, ['#1c1438', '#3a2560', '#6a3a7a']) + stars(r, 50) + moon(u, 210, 100, 30) + hill(r, 310, 10, '#2a1f44') + pumpkin(80, 360, 2) + pumpkin(170, 365, 1.5) + pumpkin(240, 368, 1.2) + bat(80, 90, 1) + bat(120, 120, 0.8) + fog(u, .25),
      (u, r) => base(u, T('dusk').sky) + stars(r, 20, 120) + `<circle cx="80" cy="120" r="24" fill="#ffd6b0"/>` + hill(r, 300, 10, '#3a2f55') + spookyHouse(170, 300, 2) + pumpkin(60, 360, 1.3) + pumpkin(250, 365, 1.1) + bat(200, 70, .9) + bat(230, 90, .7) + fog(u, .35),
      (u, r) => base(u, ['#0f1030', '#2a2a5a', '#4a4a80']) + stars(r, 60) + moon(u, 150, 170, 60) + Array.from({ length: 9 }, () => bat(40 + r() * 220, 80 + r() * 200, 0.7 + r() * 0.8)).join('') + hill(r, 330, 8, '#1a1a38') + fog(u, .25),
      (u, r) => base(u, ['#2a1a44', '#4a2a6a', '#7a5a9a']) + stars(r, 40) + moon(u, 70, 80, 16) + hill(r, 300, 10, '#3a2f55') + tomb(60, 340, 1.4) + tomb(110, 330, 1) + tomb(230, 338, 1.3) + ghost(160, 280, 2) + ghost(240, 230, 1) + pumpkin(190, 360, 1) + mist(u, 320, 40, .35) + fog(u, .3),
      (u, r) => base(u, ['#4a2a4a', '#c86a4a', '#f2b06a']) + sun(u, 150, 230, 26, '#ffd6a0', '#ffb47a') + hill(r, 280, 8, '#5a3a3a') + Array.from({ length: 4 }, (_, row) => Array.from({ length: 6 }, (_, i) => pumpkin(i * 54 + 25 + (row % 2) * 26, 310 + row * 26, 0.6 + row * 0.22, row === 3)).join('')).join('') + bat(60, 80, .8) + bat(240, 100, .7) + fog(u, .3),
    ],
  },
  easter: {
    name: 'Easter',
    draw: [
      (u, r) => { const t = T('day'); return base(u, t.sky) + rays(u) + sun(u, 220, 70, 16, t.sun, t.glow) + hill(r, 280, 14, '#bfe3b0') + hill(r, 320, 10, '#9fd59a') + Array.from({ length: 9 }, (_, i) => egg(30 + i * 30, 335 + (i % 3) * 14, 2, ['#f6a5c0', '#a9d4f5', '#ffd36b', '#c9a7f0', '#9fe0c0'][i % 5], '#fff', i)).join('') + Array.from({ length: 20 }, () => daisy(r() * W, 310 + r() * 70, 1.3)).join('') + fog(u, .35); },
      (u, r) => { const t = T('dawn'); return base(u, t.sky) + rays(u) + sun(u, 150, 200, 22, t.sun, t.glow) + hill(r, 290, 10, '#c6dfb4') + `<path d="M60 400 Q150 260 240 400 Z" fill="#a8d29a"/>` + bunny(150, 310, 2.4) + egg(80, 350, 2.2, '#f6a5c0', '#fff', 1) + egg(220, 352, 2.2, '#a9d4f5', '#fff', 0) + egg(115, 360, 1.6, '#ffd36b', '#fff', 2) + petals(r, 15) + fog(u, .35); },
      (u, r) => { const t = T('day'); return base(u, ['#a9d4f5', '#d6ecfb', '#f7fbff']) + rays(u) + hill(r, 280, 10, '#bfe3b0') + Array.from({ length: 14 }, (_, i) => tulip(i * 22 + 6, 340 + (i % 2) * 10, 1.4, ['#f6a5c0', '#ffd36b', '#c9a7f0'][i % 3])).join('') + egg(80, 372, 2.4, '#ffd36b', '#f28b82', 2) + egg(150, 378, 2.4, '#c9a7f0', '#fff', 0) + egg(220, 372, 2.4, '#9fe0c0', '#fff', 1) + butterfly(200, 200, 2, '#f6a5c0') + butterfly(90, 240, 1.6, '#ffd36b') + fog(u, .25); },
      (u, r) => { const t = T('golden'); return base(u, t.sky) + rays(u) + sun(u, 150, 140, 18, t.sun, t.glow) + hill(r, 300, 10, '#d8c08a') + `<g transform="translate(150 360)"><path d="M-50 -20 Q-50 20 0 22 Q50 20 50 -20 Z" fill="#b9874f"/><path d="M-50 -20 Q0 -90 50 -20" fill="none" stroke="#a8743f" stroke-width="5"/><path d="M-46 -6 H46 M-40 8 H40" stroke="#9a6a3a" stroke-width="1.5"/></g>` + egg(120, 345, 1.6, '#f6a5c0', '#fff', 0) + egg(150, 338, 1.8, '#a9d4f5', '#fff', 1) + egg(180, 345, 1.6, '#ffd36b', '#f28b82', 2) + sparkles(r, 20) + fog(u); },
      (u, r) => { const t = T('day'); return base(u, ['#f6c6d8', '#fbe2ec', '#fff6fa']) + rays(u) + hill(r, 260, 16, '#d6c6f0') + hill(r, 300, 14, '#bfe3c8') + hill(r, 340, 10, '#a9d8b4') + Array.from({ length: 10 }, () => egg(20 + r() * 260, 310 + r() * 50, 1.8 + r() * 0.6, ['#f6a5c0', '#a9d4f5', '#ffd36b', '#c9a7f0', '#9fe0c0'][Math.floor(r() * 5)], '#fff', Math.floor(r() * 3))).join('') + bunny(60, 300, 1.8) + fog(u, .3); },
    ],
  },
  sakura: {
    name: 'Cherry blossom',
    draw: [
      (u, r) => { const t = T('day'); return base(u, ['#a9cfee', '#d8ebf8', '#fbeef3']) + rays(u) + hill(r, 300, 8, '#cfe3c0') + blossomTree(150, 360, 2.2, r) + petals(r, 60) + fog(u); },
      (u, r) => { const t = T('dusk'); return base(u, t.sky) + rays(u, .3) + sun(u, 150, 220, 18, t.sun, t.glow) + hill(r, 300, 6, '#6a5a8a') + torii(150, 330, 2) + blossomTree(40, 340, 1.4, r) + blossomTree(265, 345, 1.3, r) + petals(r, 40) + fog(u, .4); },
      (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 50) + moon(u, 230, 70, 14) + blossomTree(150, 380, 2.4, r, ['#e8b8d4', '#d9a0c4', '#f4d4e6']) + [50, 100, 150, 200, 250].map((x, i) => lantern(x, 260 + (i % 2) * 14, 1.2)).join('') + `<path d="M20 248 Q150 280 280 248" fill="none" stroke="#3a2a2a" stroke-width="1"/>` + petals(r, 40) + fog(u, .3); },
      (u, r) => { const t = T('dawn'); return base(u, t.sky) + rays(u) + sun(u, 150, 150, 16, t.sun, t.glow) + range(r, 250, 40, '#d6b8c8', .6) + `<path d="M0 400 L0 320 Q150 290 300 320 L300 400 Z" fill="#a8d0e0"/><path d="M110 400 Q140 330 150 300 Q160 330 190 400 Z" fill="#c4e2ee" opacity=".7"/>` + blossomTree(40, 330, 1.3, r) + blossomTree(260, 335, 1.3, r) + petals(r, 50) + fog(u, .5); },
      (u, r) => { const t = T('golden'); return base(u, t.sky) + rays(u) + sun(u, 210, 150, 18, t.sun, t.glow) + range(r, 280, 40, '#c9a07a', .6) + blossomTree(10, 380, 1.3, r) + blossomTree(295, 385, 1.2, r) + pagoda(150, 345, 2.4, '#5a3a4a') + petals(r, 50) + fog(u); },
    ],
  },
  fuji: {
    name: 'Mount Fuji',
    draw: [
      (u, r) => { const t = T('day'); return base(u, t.sky) + rays(u) + sun(u, 240, 70, 14, t.sun, t.glow) + fuji(u, 150, 260, 150, 150, '#6f8fb8') + mist(u, 240, 30, .5) + `<rect x="0" y="260" width="300" height="140" fill="#8fc0dc"/><g transform="translate(0 520) scale(1 -1)" opacity=".35">${fuji(u, 150, 260, 150, 150, '#6f8fb8')}</g>` + hill(r, 330, 6, '#7fae7a') + blossomTree(30, 360, 0.9, r) + fog(u); },
      (u, r) => { const t = T('dawn'); return base(u, ['#f2b2b8', '#f8d8d0', '#fbeee4']) + rays(u) + sun(u, 150, 230, 20, t.sun, t.glow) + fuji(u, 150, 280, 160, 170, '#b08aa6', '#fff4f6') + mist(u, 260, 40, .6) + hill(r, 320, 10, '#9a7a98') + hill(r, 350, 8, '#7a6080') + petals(r, 20) + fog(u); },
      (u, r) => { const t = T('dusk'); return base(u, t.sky) + rays(u, .3) + sun(u, 210, 160, 18, t.sun, t.glow) + fuji(u, 140, 290, 170, 180, '#3a3060', '#c9b8e0') + range(r, 320, 30, '#2a2450') + pagoda(240, 340, 1.2, '#1f1a3a') + fog(u, .4); },
      (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 90, 200) + moon(u, 220, 70, 14) + fuji(u, 150, 290, 160, 170, '#2a3a6a', '#dde6ff') + `<rect x="0" y="290" width="300" height="110" fill="#1a2a55"/>` + reflection(220, 300, 40, '#fff8dc', .5) + fireflies(u, r, 12, 300, 390, '#cfe0ff') + fog(u, .3); },
      (u, r) => { const t = T('golden'); return base(u, t.sky) + rays(u) + sun(u, 70, 140, 18, t.sun, t.glow) + fuji(u, 170, 290, 160, 170, '#a86a5a', '#fff2e0') + pagoda(60, 340, 1.6, '#5a3030') + autumnTree(250, 360, 1.3, r, ['#c9472f', '#e8743b', '#f2a03d']) + hill(r, 350, 6, '#8a5a3a') + leaves(r, 15) + fog(u); },
    ],
  },
  teahouse: {
    name: 'Teahouse',
    draw: [
      (u, r) => { const t = T('day'); return base(u, t.sky) + rays(u) + sun(u, 60, 70, 14, t.sun, t.glow) + range(r, 250, 40, '#9fc0a8', .6) + hill(r, 300, 6, '#8fbf8a') + teahouse(150, 330, 2) + pine(40, 350, 1, '#3f6a4a') + `<path d="M80 400 Q130 360 150 335 Q170 360 220 400 Z" fill="#d8ccb0"/>` + [110, 150, 190].map((x, i) => `<ellipse cx="${x}" cy="${370 + i * 8}" rx="9" ry="3" fill="#b8ac94"/>`).join('') + fog(u); },
      (u, r) => { const t = T('dusk'); return base(u, t.sky) + stars(r, 25, 120) + rays(u, .3) + hill(r, 300, 6, '#5a5a7a') + teahouse(150, 335, 2, true) + lantern(50, 300, 1.5) + lantern(250, 300, 1.5) + blossomTree(260, 360, 1, r) + fog(u, .4); },
      (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 70) + moon(u, 230, 70, 14) + teahouse(150, 330, 2, true) + [40, 80, 220, 260].map((x, i) => lantern(x, 240 + (i % 2) * 12, 1.2)).join('') + `<path d="M20 228 Q150 250 280 228" fill="none" stroke="#3a2a2a" stroke-width="1"/>` + fireflies(u, r, 12) + fog(u, .3); },
      (u, r) => { const t = T('dawn'); return base(u, t.sky) + rays(u) + sun(u, 150, 170, 16, t.sun, t.glow) + range(r, 260, 50, '#c9b0c0', .5) + mist(u, 240, 50, .7) + teahouse(150, 330, 1.8) + pine(50, 340, 1.1, '#5a6a6a') + pine(260, 345, 1, '#5a6a6a') + mist(u, 320, 40, .5) + fog(u); },
      (u, r) => { const t = T('golden'); return base(u, t.sky) + rays(u) + sun(u, 230, 120, 16, t.sun, t.glow) + hill(r, 300, 6, '#c99a66') + teahouse(140, 335, 2) + autumnTree(40, 360, 1.4, r, ['#c9472f', '#e8743b', '#a8382f']) + autumnTree(265, 365, 1.2, r, ['#e8743b', '#c9472f', '#f2a03d']) + leaves(r, 30, ['#c9472f', '#e8743b', '#a8382f']) + fog(u); },
    ],
  },
  onsen: {
    name: 'Hot spring',
    draw: [
      (u, r) => { const t = T('night'); return base(u, t.sky) + stars(r, 60) + moon(u, 80, 80, 14) + hill(r, 260, 14, '#c6d4ec') + pine(40, 300, 1, '#2f4c5a', true) + pine(260, 300, 1.1, '#2f4c5a', true) + hill(r, 300, 8, '#e6eef8') + onsen(u, 150, 340, 220, '#7fb8d0', 5, r) + snow(r, 50) + fog(u, .4); },
      (u, r) => { const t = T('dusk'); return base(u, t.sky) + stars(r, 20, 120) + rays(u, .3) + range(r, 270, 40, '#5a4a7a') + onsen(u, 150, 340, 230, '#e0a8a0', 4, r) + lantern(45, 300, 1.4) + lantern(255, 300, 1.4) + fog(u, .4); },
      (u, r) => { const t = T('day'); return base(u, t.sky) + rays(u) + sun(u, 230, 70, 14, t.sun, t.glow) + range(r, 250, 60, '#8fa8c0', .7) + hill(r, 290, 8, '#7fae7a') + pine(40, 310, 1.1, '#3f6a4a') + pine(270, 315, 1, '#3f6a4a') + onsen(u, 150, 345, 220, '#9fd8e0', 4, r) + fog(u); },
      (u, r) => { const t = T('dawn'); return base(u, t.sky) + rays(u) + sun(u, 150, 170, 16, t.sun, t.glow) + fuji(u, 150, 270, 120, 110, '#b08aa6', '#fff4f6') + hill(r, 280, 8, '#f2eef6') + onsen(u, 150, 340, 230, '#a8c8e0', 5, r) + snow(r, 30) + fog(u); },
      (u, r) => { const t = T('golden'); return base(u, t.sky) + rays(u) + sun(u, 70, 120, 16, t.sun, t.glow) + range(r, 270, 40, '#b07a5a', .6) + autumnTree(40, 320, 1.3, r, ['#c9472f', '#e8743b', '#f2a03d']) + autumnTree(260, 318, 1.3, r, ['#e8743b', '#c9472f', '#a8382f']) + onsen(u, 150, 345, 230, '#e8b88a', 4, r) + leaves(r, 25) + fog(u); },
    ],
  },
};

export const THEME_IDS = Object.keys(THEMES);
export function themeName(id) { return THEMES[id]?.name || ''; }

// Returns an SVG string for one wallpaper (variant 0 to 4).
export function wallpaperSVG(theme, variant = 0, { slice = true } = {}) {
  const t = THEMES[theme];
  if (!t) return '';
  const u = `w${++uidCount}`;
  const rand = rng(1000 + THEME_IDS.indexOf(theme) * 37 + variant * 7);
  const inner = t.draw[variant % t.draw.length](u, rand);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="${slice ? 'xMidYMid slice' : 'xMidYMid meet'}" aria-hidden="true">${inner}</svg>`;
}
