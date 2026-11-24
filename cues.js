// Correct-answer sounds: tiny, quiet cues that say "next one" without a ding or a whoosh.
// All made with Web Audio, no files. Each is under a tenth of a second.

export const CUES = [
  { id: 'pop', name: 'Soft pop' },
  { id: 'wood', name: 'Wood tap' },
  { id: 'felt', name: 'Felt thump' },
  { id: 'bubble', name: 'Bubble' },
  { id: 'tick', name: 'Tiny click' },
  { id: 'nudge', name: 'Two-step nudge' },
  { id: 'glass', name: 'Glass tick' },
  { id: 'heart', name: 'Heartbeat' },
  { id: 'pluck', name: 'Muted pluck' },
  { id: 'tock', name: 'Clock tock' },
];

const VOLUME = 0.22; // well under the piano

// One short tone: frequency glides from f0 to f1, quick attack, fast fade.
function tone(ctx, out, { type = 'sine', f0, f1 = f0, at = 0, dur, attack = 0.004, peak = 1, lowpass }) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = osc.connect(g);
  if (lowpass) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = lowpass;
    node = node.connect(f);
  }
  node.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// A few milliseconds of softened noise: the "contact" at the start of a tap.
function click(ctx, out, { at = 0, dur = 0.004, peak = 0.5, lowpass = 3000 }) {
  const t = ctx.currentTime + at;
  const len = Math.max(1, Math.round(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = lowpass;
  const g = ctx.createGain();
  g.gain.value = peak;
  src.connect(f).connect(g).connect(out);
  src.start(t);
}

const DRAW = {
  pop: (c, o) => tone(c, o, { f0: 620, f1: 260, dur: 0.06, peak: 0.9 }),
  wood: (c, o) => { tone(c, o, { f0: 820, dur: 0.035, peak: 0.7 }); tone(c, o, { f0: 2240, dur: 0.018, peak: 0.25 }); },
  felt: (c, o) => { tone(c, o, { f0: 196, dur: 0.09, attack: 0.008, peak: 1, type: 'triangle', lowpass: 700 }); click(c, o, { peak: 0.25, lowpass: 900 }); },
  bubble: (c, o) => tone(c, o, { f0: 320, f1: 720, dur: 0.07, attack: 0.01, peak: 0.8 }),
  tick: (c, o) => click(c, o, { dur: 0.006, peak: 0.9, lowpass: 2500 }),
  nudge: (c, o) => { tone(c, o, { f0: 523, dur: 0.045, peak: 0.45 }); tone(c, o, { f0: 659, at: 0.05, dur: 0.05, peak: 0.45 }); },
  glass: (c, o) => tone(c, o, { f0: 2637, dur: 0.03, peak: 0.5 }),
  heart: (c, o) => tone(c, o, { f0: 140, f1: 70, dur: 0.09, attack: 0.005, peak: 1.4 }),
  pluck: (c, o) => tone(c, o, { f0: 392, dur: 0.08, attack: 0.002, peak: 0.8, type: 'triangle', lowpass: 1400 }),
  tock: (c, o) => { tone(c, o, { f0: 1046, dur: 0.025, peak: 0.5, type: 'triangle', lowpass: 2500 }); click(c, o, { peak: 0.3, lowpass: 2000 }); },
};

// Plays the cue; returns how long the mic should ignore sound (ms).
export function playCue(ctx, id) {
  const draw = DRAW[id];
  if (!ctx || !draw) return 0;
  const out = ctx.createGain();
  out.gain.value = VOLUME;
  out.connect(ctx.destination);
  draw(ctx, out);
  setTimeout(() => out.disconnect(), 400);
  return 250;
}
