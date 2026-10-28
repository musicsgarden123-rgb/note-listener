import { detectPitch, freqToMidi, midiToFreq, midiToName, rms } from './pitch.js?v=2';

// Full 88-key piano: A0 (MIDI 21) to C8 (MIDI 108).
const LOWEST = 21;
const HIGHEST = 108;
const MIDDLE_C = 60;
const BLACK = new Set([1, 3, 6, 8, 10]); // pitch classes of the black keys

const SILENCE_RMS = 0.01;    // below this the mic is treated as silent
const MIN_CLARITY = 0.85;    // ignore pitch readings less certain than this
const MATCH_CENTS = 50;      // within this many cents of the target counts as a match
const MATCH_FRAMES = 3;      // consecutive matching readings before showing a match
const FOLLOW_FRAMES = 4;     // steady readings before the keyboard scrolls to a note

const $ = (id) => document.getElementById(id);

let ctx;
let analyser;
let micSource;
let micStream;
let buffer;
let targetMidi = null;
let playingUntil = 0;
let matchFrames = 0;
let frame = 0;

const keyEls = new Map();   // midi -> key element
let litMidi = null;         // key currently lit as "detected"
let steadyMidi = null;      // for deciding when to scroll
let steadyFrames = 0;

$('start').addEventListener('click', start);
$('mic-select').addEventListener('change', (e) => connectMic(e.target.value));
$('middle-c').addEventListener('click', () => scrollToKey(MIDDLE_C, 'smooth'));
$('key-size').addEventListener('input', (e) => {
  // Keep the same part of the keyboard in view while resizing.
  const scroller = $('piano-scroll');
  const centre = (scroller.scrollLeft + scroller.clientWidth / 2) / scroller.scrollWidth;
  $('piano').style.setProperty('--white-w', `${e.target.value}px`);
  scroller.scrollLeft = centre * scroller.scrollWidth - scroller.clientWidth / 2;
});

async function start() {
  $('start-error').hidden = true;
  try {
    // The audio engine can only start after a user gesture such as this click.
    ctx = new AudioContext();
    analyser = ctx.createAnalyser();
    // A bigger window so the lowest piano notes (A0 = 27.5 Hz) fit in it.
    analyser.fftSize = 4096;
    buffer = new Float32Array(analyser.fftSize);

    await connectMic();
    await listMics();
    buildPiano();

    $('start-panel').hidden = true;
    $('app').hidden = false;
    scrollToKey(MIDDLE_C, 'instant');
    requestAnimationFrame(tick);
  } catch (err) {
    showError(err);
  }
}

async function connectMic(deviceId) {
  if (micStream) micStream.getTracks().forEach((t) => t.stop());
  if (micSource) micSource.disconnect();

  // Turn off speech processing: it distorts pitch and makes loudness meaningless.
  micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  micSource = ctx.createMediaStreamSource(micStream);
  // Mic goes to the analyser only, never to the speakers (that would feed back).
  micSource.connect(analyser);
}

async function listMics() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const current = micStream.getAudioTracks()[0]?.getSettings().deviceId;
  const select = $('mic-select');
  select.innerHTML = '';
  devices
    .filter((d) => d.kind === 'audioinput')
    .forEach((d, i) => {
      const opt = new Option(d.label || `Microphone ${i + 1}`, d.deviceId);
      opt.selected = d.deviceId === current;
      select.add(opt);
    });
}

function buildPiano() {
  const piano = $('piano');
  if (piano.childElementCount) return;
  let whiteIndex = 0;

  for (let midi = LOWEST; midi <= HIGHEST; midi++) {
    const isBlack = BLACK.has(midi % 12);
    const name = midiToName(midi);
    const key = document.createElement('button');
    key.type = 'button';
    key.className = `key ${isBlack ? 'black' : 'white'}`;
    key.title = `${name} (${midiToFreq(midi).toFixed(1)} Hz)`;
    key.setAttribute('aria-label', name);
    key.dataset.midi = midi;

    if (isBlack) {
      // Sits over the line between the previous white key and the next one.
      key.style.setProperty('--i', whiteIndex);
    } else {
      const letter = name.replace(/-?\d+$/, '');
      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = letter === 'C' ? name : letter;
      if (letter === 'C') key.classList.add('c');
      if (midi === MIDDLE_C) key.classList.add('middle-c');
      key.append(label);
      whiteIndex++;
    }

    key.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      setTarget(midi);
      playNote(midi);
    });
    keyEls.set(midi, key);
    piano.append(key);
  }
  piano.style.setProperty('--whites', whiteIndex);
}

function scrollToKey(midi, behavior = 'smooth') {
  const key = keyEls.get(midi);
  if (!key) return;
  const scroller = $('piano-scroll');
  const left = key.offsetLeft + key.offsetWidth / 2 - scroller.clientWidth / 2;
  scroller.scrollTo({ left, behavior });
}

function isKeyVisible(midi) {
  const key = keyEls.get(midi);
  const scroller = $('piano-scroll');
  const margin = 20;
  return key.offsetLeft >= scroller.scrollLeft + margin
    && key.offsetLeft + key.offsetWidth <= scroller.scrollLeft + scroller.clientWidth - margin;
}

function setTarget(midi) {
  if (targetMidi !== null) keyEls.get(targetMidi)?.classList.remove('is-target', 'is-match');
  targetMidi = midi;
  matchFrames = 0;
  keyEls.get(midi).classList.add('is-target');
  $('target').textContent = `${midiToName(midi)} (${midiToFreq(midi).toFixed(1)} Hz). Now play it`;
  $('match').textContent = '';
  $('match').className = 'match';
}

function playNote(midi, duration = 1.2) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = $('waveform').value;
  osc.frequency.value = midiToFreq(midi);

  // Short attack and a gentle decay, so the note doesn't click.
  // Very high notes sound piercing, so they're played a little softer.
  const peak = midi > 96 ? 0.18 : 0.3;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
  playingUntil = performance.now() + (duration + 0.15) * 1000;
}

function tick() {
  analyser.getFloatTimeDomainData(buffer);
  const level = rms(buffer);
  showLoudness(level);

  // Pitch detection on a full 88-key range is heavy, so run it every other frame (~30 times a second).
  if (frame++ % 2 === 0) {
    // Ignore the mic while the app is playing, so it doesn't hear itself.
    const appPlaying = performance.now() < playingUntil && !$('self-test').checked;
    const pitch = level > SILENCE_RMS && !appPlaying ? detectPitch(buffer, ctx.sampleRate) : null;

    if (pitch && pitch.clarity >= MIN_CLARITY) {
      showPitch(pitch, level);
    } else {
      showNoPitch(appPlaying);
    }
  }
  requestAnimationFrame(tick);
}

function showLoudness(level) {
  const db = level > 0 ? 20 * Math.log10(level) : -Infinity;
  const pct = Math.max(0, Math.min(100, ((db + 60) / 60) * 100)); // -60 dB .. 0 dB
  $('meter-fill').style.width = `${pct}%`;
  $('db').textContent = Number.isFinite(db) ? `${db.toFixed(0)} dB` : '– dB';
}

function showPitch({ freq, clarity }, level) {
  const exact = freqToMidi(freq);
  const midi = Math.round(exact);
  const cents = Math.round((exact - midi) * 100);

  $('note').textContent = midiToName(midi);
  $('freq').textContent = `${freq.toFixed(1)} Hz`;
  $('cents').textContent = cents === 0 ? 'in tune' : `${cents > 0 ? '+' : ''}${cents} cents`;
  $('clarity').textContent = `${Math.round(clarity * 100)}%`;

  lightKey(midi, level);

  if (targetMidi === null) return;
  const offTarget = (exact - targetMidi) * 100;
  matchFrames = Math.abs(offTarget) <= MATCH_CENTS ? matchFrames + 1 : 0;

  const match = $('match');
  const matched = matchFrames >= MATCH_FRAMES;
  keyEls.get(targetMidi).classList.toggle('is-match', matched);
  if (matched) {
    match.textContent = '✓ Match!';
    match.className = 'match good';
  } else if (midi % 12 === targetMidi % 12) {
    match.textContent = 'Right note name, wrong octave';
    match.className = 'match close';
  } else {
    match.textContent = '';
    match.className = 'match';
  }
}

function showNoPitch(appPlaying) {
  $('note').textContent = appPlaying ? '♪' : '–';
  $('freq').textContent = appPlaying ? 'app is playing' : '–';
  $('cents').textContent = '–';
  $('clarity').textContent = '–';
  matchFrames = 0;
  lightKey(null);
}

// Light up the key being played. The glow grows with loudness.
function lightKey(midi, level = 0) {
  if (midi !== null && (midi < LOWEST || midi > HIGHEST)) midi = null;

  if (litMidi !== midi) {
    if (litMidi !== null) keyEls.get(litMidi).classList.remove('is-detected');
    if (midi !== null) keyEls.get(midi).classList.add('is-detected');
    litMidi = midi;
  }
  if (midi !== null) {
    const db = 20 * Math.log10(Math.max(level, 1e-6));
    const glow = Math.max(0, Math.min(1, (db + 50) / 40)); // -50 dB .. -10 dB
    keyEls.get(midi).style.setProperty('--glow', glow.toFixed(2));
  }

  // Scroll to a steady note that's off screen.
  steadyFrames = midi !== null && midi === steadyMidi ? steadyFrames + 1 : 0;
  steadyMidi = midi;
  if ($('follow').checked && midi !== null && steadyFrames === FOLLOW_FRAMES && !isKeyVisible(midi)) {
    scrollToKey(midi, 'smooth');
  }
}

function showError(err) {
  const msg = err.name === 'NotAllowedError'
    ? 'Microphone access was blocked. Allow it in your browser\'s address bar, then try again.'
    : err.name === 'NotFoundError'
      ? 'No microphone was found.'
      : !window.isSecureContext
        ? 'The microphone only works over https:// or http://localhost. See app/README.md for how to run it.'
        : `Couldn't start audio: ${err.message}`;
  $('start-error').textContent = msg;
  $('start-error').hidden = false;
}
