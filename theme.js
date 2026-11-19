// Looks: every look uses the same layout and swaps only these values.
// A look names its background, text colour, one accent colour, fonts and a header
// drawing; every other colour is worked out from those and checked for contrast.

import { characterSVG } from './characters.js?v=8';

// ---------- Colour maths ----------
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (c) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const lum = (h) => {
  const c = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// Nudge `fg` towards white or black (whichever helps) until it reaches `min` against every background.
export function ensure(fg, bgs, min = 4.5) {
  const list = Array.isArray(bgs) ? bgs : [bgs];
  const worst = (c) => Math.min(...list.map((b) => contrast(c, b)));
  if (worst(fg) >= min) return fg;
  const darkBg = lum(list[0]) < 0.25;
  const target = darkBg ? '#ffffff' : '#000000';
  for (let t = 0.05; t <= 1.0001; t += 0.05) { const c = mix(fg, target, t); if (worst(c) >= min) return c; }
  return target;
}

// ---------- The looks ----------
// bg, ink, accent; hdr = header gradient; display = display font; art = header drawing.
export const LOOKS = [
  { id: 'recital', name: 'Starlight Recital', bg: '#0f1124', ink: '#f3eee6', accent: '#f2c46d', hdr: ['#1b1d44', '#0f1124'], display: "'Playfair Display', serif", displayWeight: 700, art: 'recital' },
  { id: 'moonlake', name: 'Moonlit Lake', bg: '#0e1a2a', ink: '#eef3fa', accent: '#9cc8ff', hdr: ['#20385e', '#0e1a2a'], display: "'Cormorant Garamond', serif", displayWeight: 700, art: 'moonlake' },
  { id: 'lantern', name: 'Lantern Garden', bg: '#1a1012', ink: '#f7ece4', accent: '#f0b35a', hdr: ['#3a1a1c', '#1a1012'], display: "'Fraunces', serif", displayWeight: 700, art: 'lantern' },
  { id: 'aurora', name: 'Aurora Keys', bg: '#0e1a1f', ink: '#eaf6f2', accent: '#7fe0c4', hdr: ['#12323a', '#0e1a1f'], display: "'DM Serif Display', serif", displayWeight: 400, art: 'aurora' },
  { id: 'dragon', name: 'Dragon Dusk', bg: '#17111c', ink: '#f6eef2', accent: '#ffb347', hdr: ['#4a2a4a', '#17111c'], display: "'Fredoka', sans-serif", displayWeight: 600, art: 'dragon' },
  { id: 'sakura', name: 'Sakura Night', bg: '#18101a', ink: '#f8edf2', accent: '#ff9ec4', hdr: ['#3a2038', '#18101a'], display: "'Cormorant Garamond', serif", displayWeight: 700, displayItalic: true, art: 'sakura' },
  { id: 'golden', name: 'Golden Hour', bg: '#fbf7ef', ink: '#2c2418', accent: '#8a5c12', hdr: ['#f7dcae', '#fbf1df'], display: "'Cormorant Garamond', serif", displayWeight: 700, art: 'golden' },
  { id: 'lavender', name: 'Lavender Twilight', bg: '#f7f3fa', ink: '#2a2236', accent: '#6b4a9b', hdr: ['#d9c8ee', '#f3ecfa'], display: "'Fraunces', serif", displayWeight: 600, displayItalic: true, art: 'lavender' },
  { id: 'candy', name: 'Candy Stars', bg: '#1c1216', ink: '#fbeef3', accent: '#ff8fb8', hdr: ['#3e1f36', '#1c1216'], display: "'Baloo 2', sans-serif", displayWeight: 800, art: 'candy' },
  { id: 'ocean', name: 'Ocean Glow', bg: '#0a1a24', ink: '#e8f7fa', accent: '#3fe0d0', hdr: ['#0f3a4e', '#0a1a24'], display: "'Baloo 2', sans-serif", displayWeight: 700, art: 'ocean' },
];

// Works out every colour of a look (the playbook's recipe), with contrast checked.
export function deriveLook(L) {
  const dark = lum(L.bg) < 0.25;
  const W = '#ffffff', K = '#000000';
  const card = dark ? mix(L.bg, W, 0.06) : mix(L.bg, W, 0.65);
  const line = dark ? mix(L.bg, W, 0.13) : mix(L.bg, L.ink, 0.12);
  const ink = ensure(L.ink, [L.bg, card], 7);
  const muted = ensure(mix(L.ink, L.bg, 0.3), [L.bg, card]);
  const accentInk = contrast(L.accent, '#14110f') >= contrast(L.accent, W) ? '#14110f' : W;
  const accentText = ensure(L.accent, [L.bg, card]);
  const tonal = dark ? mix(L.bg, L.accent, 0.2) : mix(L.bg, L.accent, 0.12);
  const tonalInk = ensure(dark ? mix(L.accent, W, 0.35) : mix(L.accent, K, 0.2), tonal);
  const hdrInk = ensure(dark ? '#ffffff' : L.ink, L.hdr, 7);
  const hdrSub = ensure(mix(hdrInk, L.hdr[0], 0.25), L.hdr);
  const hdrAccent = ensure(L.accent, L.hdr, 3);
  const paper = dark ? '#f8f3e9' : mix(L.bg, W, 0.4);
  return {
    dark, bg: L.bg, card, line, ink, muted, accent: L.accent, accentInk, accentText, tonal, tonalInk,
    hdr0: L.hdr[0], hdr1: L.hdr[1], hdrInk, hdrSub, hdrAccent, paper,
  };
}

// The pairs that must read clearly, for the contrast check.
export function contrastPairs(c) {
  return [
    ['text on background', c.ink, c.bg], ['text on card', c.ink, c.card],
    ['muted on background', c.muted, c.bg], ['muted on card', c.muted, c.card],
    ['accent text on background', c.accentText, c.bg], ['accent text on card', c.accentText, c.card],
    ['text on accent button', c.accentInk, c.accent], ['text on tonal button', c.tonalInk, c.tonal],
    ['header title (top)', c.hdrInk, c.hdr0], ['header title (bottom)', c.hdrInk, c.hdr1],
    ['header subtitle (top)', c.hdrSub, c.hdr0], ['header subtitle (bottom)', c.hdrSub, c.hdr1],
  ];
}

// ---------- Header drawings (flat shapes, 2–4 colours, a soft glow) ----------
let gid = 0;
function glow(id, color, x, y, r) {
  return `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity=".55"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/>`;
}
const dots = (pts, c = '#fff') => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
const spark = (x, y, s, c = '#fff') => `<path d="M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z" fill="${c}"/>`;

const ART = {
  recital: (c) => { const g = `g${++gid}`; return `${glow(g, c.accent, 100, 70, 60)}
    <path d="M100 0 L66 112 L134 112 Z" fill="${c.accent}" opacity=".12"/>
    <g fill="#0a0b18"><path d="M58 96 Q58 72 84 70 Q104 68 112 56 Q124 44 138 56 Q146 66 140 80 L140 96 Z"/><rect x="62" y="96" width="4" height="16"/><rect x="132" y="96" width="4" height="16"/></g>
    <rect x="58" y="88" width="82" height="4" fill="${c.ink}" opacity=".85"/>
    ${spark(36, 24, 6, c.accent)}${spark(150, 18, 4, c.accent)}${dots([[20, 60, 1.4], [44, 50, 1], [154, 44, 1.2], [128, 20, 1]], c.ink)}`; },
  moonlake: (c) => { const g = `g${++gid}`; return `${glow(g, c.accent, 110, 40, 50)}
    <circle cx="110" cy="40" r="18" fill="#f4f8ff"/><circle cx="104" cy="36" r="3" fill="#dfe8f6"/>
    <path d="M0 92 Q40 66 80 84 Q120 62 160 86 L160 120 L0 120 Z" fill="#132a46"/>
    <rect x="96" y="96" width="28" height="2" rx="1" fill="#f4f8ff" opacity=".6"/><rect x="102" y="104" width="16" height="2" rx="1" fill="#f4f8ff" opacity=".4"/>
    ${dots([[24, 20, 1.2], [60, 34, 1], [146, 70, 1], [140, 14, 1.4]], c.ink)}`; },
  lantern: (c) => { const g = `g${++gid}`; const lan = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -24 V-14" stroke="${c.ink}" stroke-width="1.2" opacity=".6"/><ellipse cx="0" cy="0" rx="11" ry="14" fill="#e0483a"/><ellipse cx="0" cy="0" rx="6" ry="13" fill="${c.accent}" opacity=".45"/><rect x="-6" y="-16" width="12" height="3" rx="1.5" fill="#3a1a14"/><rect x="-6" y="13" width="12" height="3" rx="1.5" fill="#3a1a14"/></g>`;
    return `${glow(g, c.accent, 104, 62, 58)}<path d="M50 20 Q100 40 156 18" fill="none" stroke="${c.ink}" stroke-width="1" opacity=".4"/>${lan(72, 54, 1)}${lan(108, 66, 1.35)}${lan(142, 50, 0.9)}${dots([[30, 30, 1.2], [40, 80, 1], [150, 96, 1.2]], c.accent)}`; },
  aurora: (c) => { const g = `g${++gid}`; return `${glow(g, c.accent, 100, 50, 60)}
    <path d="M10 70 Q50 20 90 52 Q130 84 160 34" fill="none" stroke="${c.accent}" stroke-width="10" stroke-linecap="round" opacity=".45"/>
    <path d="M20 86 Q60 46 100 70 Q136 90 160 60" fill="none" stroke="#a98bff" stroke-width="7" stroke-linecap="round" opacity=".45"/>
    <g fill="${c.ink}"><ellipse cx="74" cy="98" rx="7" ry="5" transform="rotate(-20 74 98)"/><rect x="79" y="70" width="2.6" height="28"/><ellipse cx="104" cy="92" rx="7" ry="5" transform="rotate(-20 104 92)"/><rect x="109" y="64" width="2.6" height="28"/><path d="M79 70 L111.6 64 L111.6 70 L79 76 Z"/></g>
    ${dots([[30, 20, 1.2], [140, 16, 1.4], [150, 100, 1], [20, 104, 1]], c.ink)}`; },
  dragon: (c) => { const g = `g${++gid}`; return `${glow(g, c.accent, 110, 60, 62)}
    ${[0, 30, 60, 90, 120, 150].map((a) => `<rect x="108" y="4" width="4" height="30" rx="2" fill="${c.accent}" opacity=".35" transform="rotate(${a - 75} 110 60)"/>`).join('')}
    ${characterSVG('dragon').replace('<svg', '<svg x="58" y="18" width="80" height="80"')}
    ${spark(30, 30, 6, c.accent)}${spark(150, 96, 5, c.accent)}${dots([[44, 90, 1.4], [150, 24, 1.2]], c.ink)}`; },
  sakura: (c) => { const g = `g${++gid}`; const bloom = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.accent}"/><circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="#fff3c0"/>`;
    return `${glow(g, c.accent, 112, 44, 54)}<circle cx="120" cy="36" r="16" fill="#fbf4ec"/>
    <path d="M160 70 Q120 60 96 76 Q76 88 50 84" fill="none" stroke="#5a3040" stroke-width="5" stroke-linecap="round"/><path d="M110 70 Q104 54 112 44" fill="none" stroke="#5a3040" stroke-width="3" stroke-linecap="round"/>
    ${bloom(96, 74, 7)}${bloom(70, 86, 6)}${bloom(122, 66, 8)}${bloom(112, 46, 5)}${bloom(146, 72, 6)}
    ${[[40, 30], [60, 54], [140, 100], [30, 100], [88, 108]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="2" fill="${c.accent}" transform="rotate(30 ${x} ${y})" opacity=".85"/>`).join('')}`; },
  golden: (c) => { const g = `g${++gid}`; return `${glow(g, '#ffd27a', 110, 56, 60)}
    <path d="M84 116 L84 52 Q84 22 112 22 Q140 22 140 52 L140 116 Z" fill="#fff3d6" stroke="${c.accent}" stroke-width="2"/><path d="M112 22 V116 M84 64 H140" stroke="${c.accent}" stroke-width="1.5" opacity=".6"/>
    <path d="M90 116 L40 120 L84 60 Z" fill="#ffd27a" opacity=".25"/>
    <g fill="#e8963a"><path d="M46 40 q-8 -8 -12 0 q4 6 12 0 q8 -8 12 0 q-4 6 -12 0" /><path d="M60 72 q-6 -6 -9 0 q3 4 9 0 q6 -6 9 0 q-3 4 -9 0"/></g>
    ${spark(150, 20, 5, '#e8963a')}`; },
  lavender: (c) => { const g = `g${++gid}`; return `${glow(g, '#b89ae0', 112, 40, 52)}
    <circle cx="120" cy="42" r="20" fill="${c.accent}"/><circle cx="130" cy="36" r="17" fill="${c.hdr0}"/>
    <path d="M0 100 Q40 76 84 94 Q120 70 160 92 L160 120 L0 120 Z" fill="#c9b3e8"/><path d="M30 120 Q80 96 160 108 L160 120 Z" fill="#a98ad6"/>
    ${spark(60, 34, 6, c.accent)}${spark(84, 62, 4, c.accent)}${spark(150, 70, 4, c.accent)}`; },
  candy: (c) => { const g = `g${++gid}`; const pts = [[60, 90], [80, 70], [106, 76], [126, 44], [148, 36]];
    return `${glow(g, c.accent, 108, 62, 58)}<path d="M${pts.map((p) => p.join(' ')).join(' L')}" fill="none" stroke="${c.accent}" stroke-width="1.6" opacity=".7" stroke-dasharray="3 4"/>
    ${pts.map(([x, y], i) => spark(x, y, i === 3 ? 9 : 5, i % 2 ? '#ffe08a' : c.accent)).join('')}
    <g fill="#9fd8ff"><ellipse cx="40" cy="44" rx="6" ry="4.4" transform="rotate(-20 40 44)"/><rect x="44.6" y="20" width="2.4" height="24"/><path d="M47 20 q8 4 6 12 q0 -6 -6 -6 Z"/></g>
    ${dots([[24, 100, 1.4], [150, 104, 1.2], [96, 20, 1.2]], c.ink)}`; },
  ocean: (c) => { const g = `g${++gid}`; const jelly = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 0 Q-12 -14 0 -14 Q12 -14 12 0 Z" fill="${c.accent}" opacity=".85"/><path d="M-8 0 q2 8 -1 14 M-2 0 q2 9 -1 16 M4 0 q2 8 -1 14 M9 0 q1 6 -1 10" stroke="${c.accent}" stroke-width="1.4" fill="none" opacity=".7"/></g>`;
    return `${glow(g, c.accent, 104, 60, 60)}${jelly(92, 54, 1.4)}${jelly(132, 40, 0.9)}${jelly(64, 34, 0.7)}
    <path d="M0 104 q20 -10 40 0 t40 0 t40 0 t40 0 L160 120 L0 120 Z" fill="#0f3a4e"/><path d="M0 110 q20 -8 40 0 t40 0 t40 0 t40 0" stroke="${c.accent}" stroke-width="1.4" fill="none" opacity=".5"/>
    ${dots([[30, 70, 1.6], [50, 92, 1], [150, 86, 1.2], [118, 18, 1]], '#bff6ec')}`; },
};

export function lookArt(look, colours) {
  return `<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${(ART[look.art] || (() => ''))(colours)}</svg>`;
}

// Puts a look on the page: sets the colour and font values and draws the header art.
export function applyLook(id) {
  const look = LOOKS.find((l) => l.id === id) || LOOKS[0];
  const c = deriveLook(look);
  const r = document.documentElement.style;
  const set = (k, v) => r.setProperty(k, v);
  set('--bg', c.bg); set('--card', c.card); set('--line', c.line); set('--ink', c.ink); set('--muted', c.muted);
  set('--accent', c.accent); set('--accent-ink', c.accentInk); set('--accent-text', c.accentText);
  set('--tonal', c.tonal); set('--tonal-ink', c.tonalInk);
  set('--hdr-0', c.hdr0); set('--hdr-1', c.hdr1); set('--hdr-ink', c.hdrInk); set('--hdr-sub', c.hdrSub); set('--hdr-accent', c.hdrAccent);
  set('--paper', c.paper);
  set('--font-display', look.display);
  set('--display-weight', String(look.displayWeight || 700));
  set('--display-style', look.displayItalic ? 'italic' : 'normal');
  document.documentElement.dataset.look = look.id;
  document.documentElement.style.colorScheme = c.dark ? 'dark' : 'light';
  const art = document.getElementById('hero-art');
  if (art) art.innerHTML = lookArt(look, c);
  return look;
}
