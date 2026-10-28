import { detectPitch, freqToMidi, midiToFreq, midiToName, rms } from './pitch.js?v=3';

// ---------- Constants ----------

// Full 88-key piano: A0 (MIDI 21) to C8 (MIDI 108).
const LOWEST = 21;
const HIGHEST = 108;
const MIDDLE_C = 60;
const BLACK = new Set([1, 3, 6, 8, 10]); // pitch classes of the black keys
const LETTER_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

const SILENCE_RMS = 0.01;    // below this the mic is treated as silent
const MIN_CLARITY = 0.85;    // ignore pitch readings less certain than this
const MATCH_CENTS = 50;      // within this many cents of the question note counts as correct
const MATCH_FRAMES = 3;      // steady correct readings before the mic answer counts
const FOLLOW_FRAMES = 4;     // steady readings before the keyboard scrolls to a note
const NEXT_DELAY_MS = 700;   // pause on a correct answer before the next note

const $ = (id) => document.getElementById(id);

// ---------- State ----------

let ctx;
let analyser;
let micSource;
let micStream;
let buffer;
let listening = true;
let playingUntil = 0;
let frame = 0;

const keyEls = new Map();   // midi -> key element
let litMidi = null;         // key lit as "you're playing"
let litGlow = -1;
let steadyMidi = null;
let steadyFrames = 0;

let question = null;        // MIDI number of the note on the staff
let answered = false;       // true during the short pause after a correct answer
let micMatchFrames = 0;
let score = 0;

// ---------- Start-up ----------

$('start').addEventListener('click', start);
$('mic-select').addEventListener('change', (e) => connectMic(e.target.value));
$('listen-toggle').addEventListener('click', toggleListening);
$('middle-c').addEventListener('click', () => scrollToKey(MIDDLE_C, 'smooth'));
$('hint').addEventListener('click', showHint);
$('range').addEventListener('change', () => nextQuestion());
$('key-size').addEventListener('input', (e) => setKeySize(e.target.value));
window.addEventListener('resize', () => { updateMinimap(); renderStaff(); });

async function start() {
  $('start-error').hidden = true;
  try {
    if (!window.Vex) throw new Error('The music notation library did not load.');
    // The audio engine can only start after a user gesture such as this click.
    ctx = new AudioContext();
    analyser = ctx.createAnalyser();
    // A big window so even the lowest piano notes (A0 = 27.5 Hz) fit in it.
    analyser.fftSize = 4096;
    buffer = new Float32Array(analyser.fftSize);

    await connectMic();
    await listMics();
    buildPiano();
    buildMinimap();

    $('start-panel').hidden = true;
    $('app').hidden = false;
    scrollToKey(MIDDLE_C, 'instant');
    updateMinimap();
    nextQuestion();
    requestAnimationFrame(tick);
  } catch (err) {
    showError(err);
  }
}

// ---------- Microphone ----------

async function connectMic(deviceId) {
  stopMic();
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

function stopMic() {
  if (micStream) micStream.getTracks().forEach((t) => t.stop());
  if (micSource) micSource.disconnect();
  micStream = null;
  micSource = null;
}

async function listMics() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const current = micStream?.getAudioTracks()[0]?.getSettings().deviceId;
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

async function toggleListening() {
  const btn = $('listen-toggle');
  if (listening) {
    listening = false;
    stopMic();
    showNoPitch(false);
    showLoudness(0);
    btn.textContent = 'Resume listening';
  } else {
    try {
      await connectMic($('mic-select').value || undefined);
      listening = true;
      btn.textContent = 'Pause listening';
    } catch (err) {
      showError(err);
    }
  }
}

// ---------- Piano ----------

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
    key.setAttribute('aria-label', name);
    key.dataset.midi = midi;

    if (isBlack) {
      // Sits over the line between the previous white key and the next one.
      key.style.setProperty('--i', whiteIndex);
    } else {
      const letter = name.replace(/-?\d+$/, '');
      if (midi === MIDDLE_C) {
        key.classList.add('middle-c');
        key.insertAdjacentHTML('beforeend', `
          <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.3l-6 3.3 1.3-6.7-5-4.7 6.8-.8z"/>
          </svg>`);
      }
      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = letter === 'C' ? name : letter;
      if (letter === 'C') key.classList.add('c');
      key.append(label);
      whiteIndex++;
    }

    key.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pressKey(midi);
    });
    keyEls.set(midi, key);
    piano.append(key);
  }
  piano.style.setProperty('--whites', whiteIndex);

  // A mouse wheel scrolls the keyboard sideways.
  $('piano-scroll').addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      $('piano-scroll').scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
  $('piano-scroll').addEventListener('scroll', updateMinimap, { passive: true });
}

function setKeySize(px) {
  // Keep the same part of the keyboard in view while resizing.
  const scroller = $('piano-scroll');
  const centre = (scroller.scrollLeft + scroller.clientWidth / 2) / scroller.scrollWidth;
  $('piano').style.setProperty('--white-w', `${px}px`);
  scroller.scrollLeft = centre * scroller.scrollWidth - scroller.clientWidth / 2;
  updateMinimap();
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

function flashKey(midi) {
  const key = keyEls.get(midi);
  key.classList.remove('is-pressed');
  void key.offsetWidth; // restart the animation
  key.classList.add('is-pressed');
}

// ---------- Minimap (the small whole-keyboard strip for moving around) ----------

function buildMinimap() {
  const strip = $('minimap-keys');
  if (strip.childElementCount) return;
  let whiteIndex = 0;
  for (let midi = LOWEST; midi <= HIGHEST; midi++) {
    if (BLACK.has(midi % 12)) {
      const b = document.createElement('div');
      b.className = 'mini-black';
      b.style.left = `${(whiteIndex / 52) * 100}%`;
      strip.append(b);
    } else {
      const w = document.createElement('div');
      w.className = midi === MIDDLE_C ? 'mini-white mini-c4' : 'mini-white';
      strip.append(w);
      whiteIndex++;
    }
  }

  const map = $('minimap');
  let dragging = false;
  const moveTo = (clientX) => {
    const rect = map.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const scroller = $('piano-scroll');
    scroller.scrollLeft = frac * scroller.scrollWidth - scroller.clientWidth / 2;
  };
  map.addEventListener('pointerdown', (e) => {
    dragging = true;
    map.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  });
  map.addEventListener('pointermove', (e) => { if (dragging) moveTo(e.clientX); });
  map.addEventListener('pointerup', () => { dragging = false; });
  map.addEventListener('pointercancel', () => { dragging = false; });
}

function updateMinimap() {
  const scroller = $('piano-scroll');
  const win = $('minimap-window');
  if (!scroller.scrollWidth) return;
  win.style.left = `${(scroller.scrollLeft / scroller.scrollWidth) * 100}%`;
  win.style.width = `${Math.min(1, scroller.clientWidth / scroller.scrollWidth) * 100}%`;
}

// ---------- The note quiz ----------

function questionRange() {
  const [lo, hi] = $('range').value.split('-').map(Number);
  return { lo, hi };
}

function nextQuestion() {
  const { lo, hi } = questionRange();
  // White keys (natural notes) only for now.
  const pool = [];
  for (let m = lo; m <= hi; m++) if (!BLACK.has(m % 12) && m !== question) pool.push(m);
  clearHint();
  question = pool[Math.floor(Math.random() * pool.length)];
  answered = false;
  micMatchFrames = 0;
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  renderStaff();
}

function answer(midi) {
  // A wrong note does nothing at all. Only the right one moves on.
  if (answered || midi !== question) return;
  answered = true;
  score++;
  $('score').textContent = `Correct: ${score}`;
  $('feedback').textContent = '✓ Correct';
  $('feedback').className = 'feedback good';
  keyEls.get(question).classList.add('is-correct');
  renderStaff(true);
  const done = question;
  setTimeout(() => {
    keyEls.get(done).classList.remove('is-correct');
    nextQuestion();
  }, NEXT_DELAY_MS);
}

function pressKey(midi) {
  playNote(midi);
  flashKey(midi);
  answer(midi);
}

function showHint() {
  if (question === null || answered) return;
  keyEls.get(question).classList.add('is-hint');
  scrollToKey(question, 'smooth');
}

function clearHint() {
  if (question !== null) keyEls.get(question)?.classList.remove('is-hint');
}

// ---------- Grand staff (drawn with VexFlow) ----------

// Diatonic step number: C0 = 0, D0 = 1 ... C4 = 28. Staff lines are every 2 steps.
function step(midi) {
  const name = midiToName(midi);
  const letter = name[0];
  const octave = Number(name.replace(/^[A-G]#?/, ''));
  return octave * 7 + LETTER_STEP[letter];
}

const TREBLE_TOP = step(77);  // F5, top line of the treble staff
const BASS_BOTTOM = step(43); // G2, bottom line of the bass staff

function renderStaff(correct = false) {
  if (question === null || !window.Vex) return;
  const VF = Vex.Flow;
  const el = $('staff');
  el.innerHTML = '';

  // Leave room above and below for the ledger lines this range can need,
  // so the staves don't jump around from one note to the next.
  const { lo, hi } = questionRange();
  const half = 5; // half a staff space, in px
  const topRoom = Math.max(0, step(hi) - TREBLE_TOP) * half + 22;
  const bottomRoom = Math.max(0, BASS_BOTTOM - step(lo)) * half + 22;
  const gap = 46;      // between the two staves
  const staffH = 40;   // 4 spaces of 10 px
  const width = 340;
  const x = 46;
  const trebleY = topRoom;
  const bassY = trebleY + staffH + gap;
  const height = bassY + staffH + bottomRoom;

  const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();
  const opts = { space_above_staff_ln: 0, space_below_staff_ln: 0 };

  const treble = new VF.Stave(x, trebleY, width - x - 10, opts).addClef('treble');
  const bass = new VF.Stave(x, bassY, width - x - 10, opts).addClef('bass');
  treble.setContext(context).draw();
  bass.setContext(context).draw();
  new VF.StaveConnector(treble, bass).setType('brace').setContext(context).draw();
  new VF.StaveConnector(treble, bass).setType('singleLeft').setContext(context).draw();
  new VF.StaveConnector(treble, bass).setType('singleRight').setContext(context).draw();

  // Middle C and above go on the treble staff; below it, the bass staff.
  const onTreble = question >= MIDDLE_C;
  const stave = onTreble ? treble : bass;
  const name = midiToName(question);
  const note = new VF.StaveNote({
    clef: onTreble ? 'treble' : 'bass',
    keys: [`${name[0].toLowerCase()}/${name.slice(1)}`],
    duration: 'w',
  });
  if (correct) {
    const green = getComputedStyle(document.documentElement).getPropertyValue('--good').trim() || '#1f9d55';
    note.setStyle({ fillStyle: green, strokeStyle: green });
    note.setLedgerLineStyle({ strokeStyle: green });
  }

  // Place the single note in the middle of the space after the clef.
  note.setStave(stave);
  const tick = new VF.TickContext();
  tick.addTickable(note).preFormat();
  const room = stave.getNoteEndX() - stave.getNoteStartX();
  tick.setX(room / 2 - 10);
  note.setContext(context).draw();

  // Make the drawing scale to fit its box.
  const svg = el.querySelector('svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', correct ? `${name}, correct` : 'Which note is this?');
}

// ---------- Listening loop ----------

function tick() {
  if (!listening || !micStream || document.hidden) {
    requestAnimationFrame(tick);
    return;
  }
  analyser.getFloatTimeDomainData(buffer);
  const level = rms(buffer);
  showLoudness(level);

  // Pitch detection is the heavy part, so it runs every other frame (~30 times a second).
  if (frame++ % 2 === 0) {
    // Ignore the mic while the app is playing, so it doesn't hear itself.
    const appPlaying = performance.now() < playingUntil && !$('self-test').checked;
    const pitch = level > SILENCE_RMS && !appPlaying ? findPitch(level) : null;
    if (pitch && pitch.clarity >= MIN_CLARITY) {
      showPitch(pitch, level);
    } else {
      showNoPitch(appPlaying);
    }
  }
  requestAnimationFrame(tick);
}

// Two stages to keep the computer's work down: a quick check on the most recent
// half of the sound covers C2 and up; only if that finds nothing do we run the
// slower full-size check needed for the lowest octave and a half.
function findPitch() {
  const recent = buffer.subarray(buffer.length / 2);
  const quick = detectPitch(recent, ctx.sampleRate, { minFreq: 64 });
  if (quick && quick.clarity >= MIN_CLARITY) return quick;
  if (frame % 4 !== 0) return quick;
  return detectPitch(buffer, ctx.sampleRate, { minFreq: 25, maxFreq: 70 }) || quick;
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

  // Playing the right note on a real piano answers the question too.
  if (question !== null && !answered) {
    const off = Math.abs(exact - question) * 100;
    micMatchFrames = off <= MATCH_CENTS ? micMatchFrames + 1 : 0;
    if (micMatchFrames >= MATCH_FRAMES) answer(question);
  }
}

function showNoPitch(appPlaying) {
  $('note').textContent = appPlaying ? '♪' : '–';
  $('freq').textContent = appPlaying ? 'app is playing' : '–';
  $('cents').textContent = '–';
  $('clarity').textContent = '–';
  micMatchFrames = 0;
  lightKey(null);
}

// Light up the key being played. The glow grows with loudness.
function lightKey(midi, level = 0) {
  if (midi !== null && (midi < LOWEST || midi > HIGHEST)) midi = null;

  if (litMidi !== midi) {
    if (litMidi !== null) keyEls.get(litMidi).classList.remove('is-detected');
    if (midi !== null) keyEls.get(midi).classList.add('is-detected');
    litMidi = midi;
    litGlow = -1;
  }
  if (midi !== null) {
    const db = 20 * Math.log10(Math.max(level, 1e-6));
    const glow = Math.round(Math.max(0, Math.min(1, (db + 50) / 40)) * 10) / 10; // -50 dB .. -10 dB
    // Only redraw the glow when it changes noticeably (redrawing every frame is costly).
    if (glow !== litGlow) {
      keyEls.get(midi).style.setProperty('--glow', glow);
      litGlow = glow;
    }
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
        : `Couldn't start: ${err.message}`;
  $('start-error').textContent = msg;
  $('start-error').hidden = false;
}
