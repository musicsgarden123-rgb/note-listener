import { detectPitch, freqToMidi, midiToFreq, midiToName, rms } from './pitch.js';

// Treble clef C4–G5, natural notes only (MIDI numbers).
const NOTES = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79];

const SILENCE_RMS = 0.01;    // below this the mic is treated as silent
const MIN_CLARITY = 0.85;    // ignore pitch readings less certain than this
const MATCH_CENTS = 50;      // within this many cents of the target counts as a match
const MATCH_FRAMES = 4;      // consecutive matching frames before showing a match

const $ = (id) => document.getElementById(id);

let ctx;
let analyser;
let micSource;
let micStream;
let buffer;
let targetMidi = null;
let playingUntil = 0;
let matchFrames = 0;

$('start').addEventListener('click', start);
$('mic-select').addEventListener('change', (e) => connectMic(e.target.value));

async function start() {
  $('start-error').hidden = true;
  try {
    // The audio engine can only start after a user gesture such as this click.
    ctx = new AudioContext();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    buffer = new Float32Array(analyser.fftSize);

    await connectMic();
    await listMics();
    buildKeys();

    $('start-panel').hidden = true;
    $('app').hidden = false;
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

function buildKeys() {
  const keys = $('keys');
  for (const midi of NOTES) {
    const btn = document.createElement('button');
    btn.textContent = midiToName(midi);
    btn.addEventListener('click', () => {
      setTarget(midi);
      playNote(midi);
    });
    keys.append(btn);
  }
}

function setTarget(midi) {
  targetMidi = midi;
  matchFrames = 0;
  $('target').textContent = `${midiToName(midi)} (${midiToFreq(midi).toFixed(1)} Hz). Now play it`;
  $('keys').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.textContent === midiToName(midi));
  });
}

function playNote(midi, duration = 1.2) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = $('waveform').value;
  osc.frequency.value = midiToFreq(midi);

  // Short attack and a gentle decay, so the note doesn't click.
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
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

  // Ignore the mic while the app is playing, so it doesn't hear itself.
  const appPlaying = performance.now() < playingUntil && !$('self-test').checked;
  const pitch = level > SILENCE_RMS && !appPlaying ? detectPitch(buffer, ctx.sampleRate) : null;

  if (pitch && pitch.clarity >= MIN_CLARITY) {
    showPitch(pitch);
  } else {
    showNoPitch(appPlaying);
  }
  requestAnimationFrame(tick);
}

function showLoudness(level) {
  const db = level > 0 ? 20 * Math.log10(level) : -Infinity;
  const pct = Math.max(0, Math.min(100, ((db + 60) / 60) * 100)); // -60 dB .. 0 dB
  $('meter-fill').style.width = `${pct}%`;
  $('db').textContent = Number.isFinite(db) ? `${db.toFixed(0)} dB` : '– dB';
}

function showPitch({ freq, clarity }) {
  const exact = freqToMidi(freq);
  const midi = Math.round(exact);
  const cents = Math.round((exact - midi) * 100);

  $('note').textContent = midiToName(midi);
  $('freq').textContent = `${freq.toFixed(1)} Hz`;
  $('cents').textContent = cents === 0 ? 'in tune' : `${cents > 0 ? '+' : ''}${cents} cents`;
  $('clarity').textContent = `${Math.round(clarity * 100)}%`;

  if (targetMidi === null) return;
  const offTarget = (exact - targetMidi) * 100;
  matchFrames = Math.abs(offTarget) <= MATCH_CENTS ? matchFrames + 1 : 0;

  const match = $('match');
  if (matchFrames >= MATCH_FRAMES) {
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
