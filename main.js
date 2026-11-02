import { detectPitch, freqToMidi, midiToFreq, rms } from './pitch.js?v=4';

// ======================================================================
// Constants
// ======================================================================

// Full 88-key piano: A0 (MIDI 21) to C8 (MIDI 108).
const LOWEST = 21;
const HIGHEST = 108;
const MIDDLE_C = 60;
const BLACK = new Set([1, 3, 6, 8, 10]); // pitch classes of the black keys
const LETTER_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const SILENCE_RMS = 0.01;    // below this the mic is treated as silent
const MIN_CLARITY = 0.85;    // ignore pitch readings less certain than this
const MATCH_CENTS = 50;      // within this many cents of the question note counts as correct
const MATCH_FRAMES = 3;      // steady correct readings before the mic answer counts
const FOLLOW_FRAMES = 4;     // steady readings before the keyboard scrolls to a note
const NEXT_DELAY_MS = 700;   // pause on a correct answer before the next note

// Key size: the slider runs 0-100%. 50% is the normal size; drills of an octave
// or less open at 70% so the keys are easier to hit.
const SIZE_MIN_PX = 28;
const SIZE_MAX_PX = 76;
const SIZE_DEFAULT = 50;
const SIZE_SMALL_DRILL = 70;

// Grand piano samples (Salamander Grand Piano, every minor third).
const SAMPLE_MIDIS = [];
for (let m = 21; m <= 108; m += 3) SAMPLE_MIDIS.push(m);
const SAMPLE_URL = (m) => `samples/piano/${m}.mp3`;

const PRESETS = [
  { id: 'preset-full', name: 'Full piano (A0 to C8)', notes: whiteKeys(21, 108), spelling: 'sharp', preset: true },
  { id: 'preset-c2c6', name: 'C2 to C6', notes: whiteKeys(36, 84), spelling: 'sharp', preset: true },
  { id: 'preset-c3c5', name: 'C3 to C5 (around middle C)', notes: whiteKeys(48, 72), spelling: 'sharp', preset: true },
];

const $ = (id) => document.getElementById(id);

// ======================================================================
// State
// ======================================================================

let ctx;
let analyser;
let micSource;
let micStream;
let buffer;
let listening = true;
let playingUntil = 0;
let frame = 0;

const keyEls = new Map();   // midi -> key element
let litMidi = null;
let litGlow = -1;
let steadyMidi = null;
let steadyFrames = 0;

let drills = [];            // the person's saved drills
let currentDrill = PRESETS[0];
let question = null;        // MIDI number of the note on the staff
let answered = false;
let micMatchFrames = 0;
let score = 0;

let mode = 'practice';      // 'practice' or 'edit'
let editing = null;         // { id|null, name, notes:Set, spelling }

const samples = new Map();  // midi -> AudioBuffer
let samplesReady = false;

let store = null;           // where drills are saved (account or this device)
let pendingDrillId = null;  // last-used drill, waiting for saved drills to load

// ======================================================================
// Helpers
// ======================================================================

function whiteKeys(lo, hi) {
  const out = [];
  for (let m = lo; m <= hi; m++) if (!BLACK.has(m % 12)) out.push(m);
  return out;
}

// Name a note, spelling black keys as sharps or flats: { letter, acc, octave, text }
function spell(midi, spelling = 'sharp') {
  const pc = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = (spelling === 'flat' ? FLAT_NAMES : SHARP_NAMES)[pc];
  const letter = name[0];
  const acc = name.length > 1 ? name[1] : '';
  const shown = acc === '#' ? '♯' : acc === 'b' ? '♭' : '';
  return { letter, acc, octave, text: `${letter}${acc}${octave}`, pretty: `${letter}${shown}${octave}` };
}

// Diatonic step number: C0 = 0, D0 = 1 ... C4 = 28. Staff lines are every 2 steps.
function step(midi, spelling) {
  const s = spell(midi, spelling);
  return s.octave * 7 + LETTER_STEP[s.letter];
}

function sizeToPx(pct) {
  return SIZE_MIN_PX + (SIZE_MAX_PX - SIZE_MIN_PX) * (pct / 100);
}

function remember(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage may be blocked */ }
}
function recall(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

// ======================================================================
// Start-up
// ======================================================================

$('start').addEventListener('click', start);
$('mic-select').addEventListener('change', (e) => connectMic(e.target.value));
$('listen-toggle').addEventListener('click', toggleListening);
$('middle-c').addEventListener('click', () => scrollToKey(MIDDLE_C, 'smooth'));
$('hint').addEventListener('click', showHint);
$('drill-select').addEventListener('change', (e) => selectDrill(e.target.value));
$('edit-drill').addEventListener('click', () => openEditor(currentDrill));
$('new-drill').addEventListener('click', () => openEditor(null));
window.addEventListener('resize', () => { updateMinimap(); redrawStaff(); });

// The key-size slider updates the piano on every movement, batched to the screen's refresh.
let pendingSize = null;
$('key-size').addEventListener('input', (e) => {
  pendingSize = Number(e.target.value);
  $('key-size-val').textContent = `${pendingSize}%`;
  requestAnimationFrame(() => {
    if (pendingSize === null) return;
    setKeySize(pendingSize);
    pendingSize = null;
  });
});
$('key-size').addEventListener('change', (e) => remember('sr-key-size', e.target.value));

async function start() {
  $('start-error').hidden = true;
  try {
    if (!window.Vex) throw new Error('The music notation library did not load. Check your internet connection and reload.');
    // The audio engine can only start after a user gesture such as this click.
    ctx = new AudioContext();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 4096; // big enough for the lowest piano notes (A0 = 27.5 Hz)
    buffer = new Float32Array(analyser.fftSize);

    loadPianoSamples();

    // If the mic isn't allowed, keep going: the quiz still works by tapping keys.
    try {
      await connectMic();
      await listMics();
    } catch (err) {
      setMicUnavailable(err);
    }

    buildPiano();
    buildMinimap();
    buildRangeSelects();

    $('start-panel').hidden = true;
    $('app').hidden = false;

    const savedSize = recall('sr-key-size');
    setKeySize(savedSize !== null ? Number(savedSize) : SIZE_DEFAULT, true);
    renderDrillSelect();
    pendingDrillId = recall('sr-drill');
    selectDrill(pendingDrillId || PRESETS[0].id, { keepSize: savedSize !== null, save: false });
    initStore();
    requestAnimationFrame(tick);
  } catch (err) {
    showError(err);
  }
}

// ======================================================================
// Sound: grand piano samples, with simple synth sounds as alternatives
// ======================================================================

async function loadPianoSamples() {
  const opt = $('waveform').querySelector('option[value="piano"]');
  opt.textContent = 'Grand piano (loading…)';
  let loaded = 0;
  await Promise.all(SAMPLE_MIDIS.map(async (m) => {
    try {
      const res = await fetch(SAMPLE_URL(m));
      if (!res.ok) throw new Error(res.status);
      const data = await res.arrayBuffer();
      samples.set(m, await ctx.decodeAudioData(data));
      loaded++;
    } catch { /* a missing sample falls back to a neighbour */ }
  }));
  samplesReady = loaded > 0;
  opt.textContent = samplesReady ? 'Grand piano' : 'Grand piano (unavailable)';
}

function playNote(midi) {
  const kind = $('waveform').value;
  if (kind === 'piano' && samplesReady) playPiano(midi);
  else playSynth(midi, kind === 'piano' ? 'triangle' : kind);
}

function playPiano(midi) {
  // Use the nearest recorded note and retune it.
  let nearest = null;
  for (const m of samples.keys()) {
    if (nearest === null || Math.abs(m - midi) < Math.abs(nearest - midi)) nearest = m;
  }
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = samples.get(nearest);
  src.playbackRate.value = Math.pow(2, (midi - nearest) / 12);
  const gain = ctx.createGain();
  // Let it ring, then fade so quick answers don't blur together.
  const hold = 1.6;
  gain.gain.setValueAtTime(0.9, t);
  gain.gain.setValueAtTime(0.9, t + hold);
  gain.gain.exponentialRampToValueAtTime(0.001, t + hold + 0.6);
  src.connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + hold + 0.7);
  playingUntil = performance.now() + (hold + 0.4) * 1000;
}

function playSynth(midi, type, duration = 1.2) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
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

// ======================================================================
// Microphone
// ======================================================================

function setMicUnavailable(err) {
  listening = false;
  stopMic();
  const why = err && err.name === 'NotAllowedError'
    ? 'The microphone is blocked here, so the app can\'t hear a real piano. Tap the keys to answer.'
    : 'No microphone is available here, so the app can\'t hear a real piano. Tap the keys to answer.';
  $('mic-status').textContent = why;
  $('mic-status').hidden = false;
  $('listen-toggle').hidden = true;
  $('follow-label').hidden = true;
  document.querySelector('.sound-details summary .muted').textContent = '(mic not available here)';
}

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
  micSource.connect(analyser); // to the analyser only, never the speakers
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
      setMicUnavailable(err);
    }
  }
}

// ======================================================================
// Piano
// ======================================================================

function buildPiano() {
  const piano = $('piano');
  if (piano.childElementCount) return;
  let whiteIndex = 0;

  for (let midi = LOWEST; midi <= HIGHEST; midi++) {
    const isBlack = BLACK.has(midi % 12);
    const key = document.createElement('button');
    key.type = 'button';
    key.className = `key ${isBlack ? 'black' : 'white'}`;
    key.dataset.midi = midi;

    if (isBlack) {
      key.style.setProperty('--i', whiteIndex); // sits over the line between two white keys
    } else {
      if (midi === MIDDLE_C) {
        key.classList.add('middle-c');
        key.insertAdjacentHTML('beforeend', `
          <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.3l-6 3.3 1.3-6.7-5-4.7 6.8-.8z"/>
          </svg>`);
      }
      if (midi % 12 === 0) key.classList.add('c');
      whiteIndex++;
    }
    const label = document.createElement('span');
    label.className = 'key-label';
    key.append(label);

    key.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pressKey(midi);
    });
    keyEls.set(midi, key);
    piano.append(key);
  }
  piano.style.setProperty('--whites', whiteIndex);
  labelKeys('sharp');

  // A mouse wheel scrolls the keyboard sideways.
  $('piano-scroll').addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      $('piano-scroll').scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
  $('piano-scroll').addEventListener('scroll', updateMinimap, { passive: true });
}

// White keys show their letter (C keys with the octave); black keys show
// their name as a sharp or a flat.
function labelKeys(spelling) {
  for (const [midi, key] of keyEls) {
    const s = spell(midi, spelling);
    const label = key.querySelector('.key-label');
    if (BLACK.has(midi % 12)) label.textContent = s.pretty;
    else label.textContent = s.letter === 'C' ? s.text : s.letter;
    key.setAttribute('aria-label', s.pretty);
  }
}

function setKeySize(pct, instant = false) {
  pct = Math.max(0, Math.min(100, Math.round(pct)));
  $('key-size').value = pct;
  $('key-size-val').textContent = `${pct}%`;
  // Keep the same part of the keyboard in view while resizing.
  const scroller = $('piano-scroll');
  const centre = scroller.scrollWidth
    ? (scroller.scrollLeft + scroller.clientWidth / 2) / scroller.scrollWidth
    : 0.5;
  $('piano').style.setProperty('--white-w', `${sizeToPx(pct).toFixed(1)}px`);
  if (!instant) scroller.scrollLeft = centre * scroller.scrollWidth - scroller.clientWidth / 2;
  updateMinimap();
}

function scrollToKey(midi, behavior = 'smooth') {
  const key = keyEls.get(midi);
  if (!key) return;
  const scroller = $('piano-scroll');
  const left = key.offsetLeft + key.offsetWidth / 2 - scroller.clientWidth / 2;
  scroller.scrollTo({ left, behavior });
}

function scrollToNotes(notes, behavior = 'smooth') {
  if (!notes.length) return;
  const lo = keyEls.get(Math.min(...notes));
  const hi = keyEls.get(Math.max(...notes));
  const scroller = $('piano-scroll');
  const mid = (lo.offsetLeft + hi.offsetLeft + hi.offsetWidth) / 2;
  scroller.scrollTo({ left: mid - scroller.clientWidth / 2, behavior });
}

function isKeyVisible(midi) {
  const key = keyEls.get(midi);
  const scroller = $('piano-scroll');
  const margin = 20;
  return key.offsetLeft >= scroller.scrollLeft + margin
    && key.offsetLeft + key.offsetWidth <= scroller.scrollLeft + scroller.clientWidth - margin;
}

function flashKey(midi) {
  const key = keyEls.get(midi);
  key.classList.remove('is-pressed');
  void key.offsetWidth; // restart the animation
  key.classList.add('is-pressed');
}

function pressKey(midi) {
  playNote(midi);
  flashKey(midi);
  if (mode === 'edit') toggleEditNote(midi);
  else answer(midi);
}

// ======================================================================
// Minimap: the small whole-keyboard strip for moving along the piano
// ======================================================================

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

// ======================================================================
// Saving drills: to the person's account on the published page,
// or to this browser when the app runs from the PC folder.
// ======================================================================

async function initStore() {
  if (window.claude && typeof window.claude.use === 'function') {
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      const uid = user ? await user.id() : null;
      if (db && uid) {
        const col = db.collection(`data/users/${uid}`);
        store = {
          kind: 'account',
          async save(d) { await col.doc(d.id).set({ kind: 'drill', name: d.name, notes: d.notes, spelling: d.spelling, updatedAt: Date.now() }); },
          async remove(id) { await col.doc(id).delete(); },
        };
        col.onSnapshot((snap) => {
          drills = snap.docs
            .filter((doc) => doc.exists && doc.data().kind === 'drill')
            .map((doc) => ({ id: doc.id, ...doc.data() }));
          drillsChanged();
        }, () => { /* the page keeps working with what it has */ });
        return;
      }
    } catch { /* fall through to this-device storage */ }
  }
  store = {
    kind: 'device',
    async save(d) { saveLocal([...drills.filter((x) => x.id !== d.id), d]); },
    async remove(id) { saveLocal(drills.filter((x) => x.id !== id)); },
  };
  try { drills = JSON.parse(recall('sr-drills') || '[]'); } catch { drills = []; }
  drillsChanged();
}

function saveLocal(list) {
  drills = list;
  remember('sr-drills', JSON.stringify(list));
  drillsChanged();
}

function drillsChanged() {
  drills.sort((a, b) => a.name.localeCompare(b.name));
  renderDrillSelect();
  // Pick up the remembered drill once it arrives from the store.
  const wanted = pendingDrillId;
  if (wanted && currentDrill.id !== wanted && drills.some((d) => d.id === wanted) && mode === 'practice') {
    selectDrill(wanted, { keepSize: true });
  } else if (!currentDrill.preset) {
    const fresh = drills.find((d) => d.id === currentDrill.id);
    if (fresh) currentDrill = fresh;
  }
}

function allDrills() {
  return [...drills, ...PRESETS];
}

function renderDrillSelect() {
  const sel = $('drill-select');
  sel.innerHTML = '';
  if (drills.length) {
    const mine = document.createElement('optgroup');
    mine.label = 'My drills';
    drills.forEach((d) => mine.append(new Option(d.name, d.id)));
    sel.append(mine);
  }
  const built = document.createElement('optgroup');
  built.label = 'Built in';
  PRESETS.forEach((d) => built.append(new Option(d.name, d.id)));
  sel.append(built);
  sel.value = currentDrill.id;
}

function selectDrill(id, { keepSize = false, save = true } = {}) {
  const drill = allDrills().find((d) => d.id === id) || PRESETS[0];
  currentDrill = drill;
  $('drill-select').value = drill.id;
  $('edit-drill').textContent = drill.preset ? 'Copy & edit' : 'Edit';
  if (save) { remember('sr-drill', drill.id); pendingDrillId = null; }
  labelKeys(drill.spelling);
  if (!keepSize) {
    const span = Math.max(...drill.notes) - Math.min(...drill.notes);
    setKeySize(span <= 12 ? SIZE_SMALL_DRILL : SIZE_DEFAULT, true);
  }
  requestAnimationFrame(() => scrollToNotes(drill.notes, 'instant'));
  score = 0;
  $('score').textContent = 'Correct: 0';
  question = null;
  nextQuestion();
}

// ======================================================================
// The note quiz
// ======================================================================

function nextQuestion() {
  clearHint();
  const pool = currentDrill.notes.filter((m) => m !== question);
  question = pool.length ? pool[Math.floor(Math.random() * pool.length)] : currentDrill.notes[0];
  answered = false;
  micMatchFrames = 0;
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  renderQuestion();
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
  renderQuestion(true);
  const done = question;
  setTimeout(() => {
    keyEls.get(done).classList.remove('is-correct');
    if (mode === 'practice') nextQuestion();
  }, NEXT_DELAY_MS);
}

function showHint() {
  if (question === null || answered) return;
  keyEls.get(question).classList.add('is-hint');
  scrollToKey(question, 'smooth');
}

function clearHint() {
  if (question !== null) keyEls.get(question)?.classList.remove('is-hint');
}

// ======================================================================
// Drill editor
// ======================================================================

$('ed-cancel').addEventListener('click', closeEditor);
$('ed-save').addEventListener('click', saveEditor);
$('ed-sharp').addEventListener('click', () => setEditSpelling('sharp'));
$('ed-flat').addEventListener('click', () => setEditSpelling('flat'));
$('ed-add').addEventListener('click', addEditRange);
$('ed-clear').addEventListener('click', () => { editing.notes.clear(); editorChanged(); });
$('ed-delete').addEventListener('click', deleteEditing);
$('ed-name').addEventListener('input', () => { editing.name = $('ed-name').value; });

function buildRangeSelects() {
  for (const id of ['ed-from', 'ed-to']) {
    const sel = $(id);
    if (sel.options.length) continue;
    for (let m = LOWEST; m <= HIGHEST; m++) sel.append(new Option(spell(m).text, m));
  }
  $('ed-from').value = 57; // A3
  $('ed-to').value = 64;   // E4
}

function relabelRangeSelects(spelling) {
  for (const id of ['ed-from', 'ed-to']) {
    for (const opt of $(id).options) opt.textContent = spell(Number(opt.value), spelling).pretty;
  }
}

function openEditor(drill) {
  const copying = drill && drill.preset;
  editing = {
    id: drill && !copying ? drill.id : null,
    name: drill ? (copying ? `My ${drill.name}` : drill.name) : '',
    notes: new Set(drill ? drill.notes : []),
    spelling: drill ? drill.spelling : 'sharp',
  };
  mode = 'edit';
  clearHint();
  $('practice').hidden = true;
  $('editor').hidden = false;
  $('ed-name').value = editing.name;
  $('ed-delete').hidden = !editing.id;
  $('ed-delete').textContent = 'Delete drill';
  $('ed-delete').classList.remove('confirm');
  setEditSpelling(editing.spelling);
  if (editing.notes.size) scrollToNotes([...editing.notes], 'smooth');
}

function closeEditor() {
  for (const key of keyEls.values()) key.classList.remove('is-selected');
  mode = 'practice';
  editing = null;
  $('editor').hidden = true;
  $('practice').hidden = false;
  labelKeys(currentDrill.spelling);
  renderQuestion();
}

function setEditSpelling(spelling) {
  editing.spelling = spelling;
  $('ed-sharp').setAttribute('aria-checked', String(spelling === 'sharp'));
  $('ed-flat').setAttribute('aria-checked', String(spelling === 'flat'));
  labelKeys(spelling);
  relabelRangeSelects(spelling);
  editorChanged();
}

function toggleEditNote(midi) {
  if (editing.notes.has(midi)) editing.notes.delete(midi);
  else editing.notes.add(midi);
  editorChanged();
}

function addEditRange() {
  let a = Number($('ed-from').value);
  let b = Number($('ed-to').value);
  if (a > b) [a, b] = [b, a];
  const withBlack = $('ed-black').checked;
  for (let m = a; m <= b; m++) {
    if (withBlack || !BLACK.has(m % 12)) editing.notes.add(m);
  }
  editorChanged();
  scrollToNotes([a, b], 'smooth');
}

function editorChanged() {
  for (const [midi, key] of keyEls) key.classList.toggle('is-selected', editing.notes.has(midi));
  const n = editing.notes.size;
  $('ed-count').textContent = n === 1 ? '1 note' : `${n} notes`;
  $('ed-save').disabled = n === 0;
  $('ed-msg').textContent = n === 0
    ? 'Tap keys on the piano to add notes, or add a range above.'
    : 'Tap a key again to remove it.';
  $('ed-msg').className = 'ed-msg';
  renderEditorStaff();
}

function defaultName(notes, spelling) {
  const lo = Math.min(...notes);
  const hi = Math.max(...notes);
  return lo === hi ? spell(lo, spelling).pretty : `${spell(lo, spelling).pretty} to ${spell(hi, spelling).pretty}`;
}

async function saveEditor() {
  if (!editing.notes.size) return;
  const notes = [...editing.notes].sort((a, b) => a - b);
  const drill = {
    id: editing.id || `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: editing.name.trim() || defaultName(notes, editing.spelling),
    notes,
    spelling: editing.spelling,
  };
  $('ed-save').disabled = true;
  try {
    await store.save(drill);
  } catch (err) {
    $('ed-save').disabled = false;
    $('ed-msg').textContent = err && err.code === 'quota_exceeded'
      ? 'There\'s no room to save more drills. Delete one you no longer use, then save again.'
      : 'Couldn\'t save the drill. Check your connection and tap Save again.';
    $('ed-msg').className = 'ed-msg error';
    return;
  }
  // Show it straight away, even before the saved copy comes back.
  if (!drills.some((d) => d.id === drill.id)) drills.push(drill);
  else drills = drills.map((d) => (d.id === drill.id ? drill : d));
  drillsChanged();
  closeEditor();
  selectDrill(drill.id);
}

async function deleteEditing() {
  const btn = $('ed-delete');
  if (!btn.classList.contains('confirm')) {
    btn.classList.add('confirm');
    btn.textContent = 'Tap again to delete';
    setTimeout(() => {
      btn.classList.remove('confirm');
      btn.textContent = 'Delete drill';
    }, 3000);
    return;
  }
  const id = editing.id;
  try {
    await store.remove(id);
  } catch {
    $('ed-msg').textContent = 'Couldn\'t delete the drill. Check your connection and try again.';
    $('ed-msg').className = 'ed-msg error';
    return;
  }
  drills = drills.filter((d) => d.id !== id);
  drillsChanged();
  closeEditor();
  selectDrill(PRESETS[0].id);
}

// ======================================================================
// Grand staff (drawn with VexFlow)
// ======================================================================

const TREBLE_TOP = 38;  // F5, top line of the treble staff
const BASS_BOTTOM = 18; // G2, bottom line of the bass staff

function redrawStaff() {
  if (mode === 'edit') renderEditorStaff();
  else renderQuestion();
}

function renderQuestion(correct = false) {
  if (question === null) return;
  const spelling = currentDrill.spelling;
  const steps = currentDrill.notes.map((m) => step(m, spelling));
  drawGrandStaff($('staff'), {
    notes: [question],
    spelling,
    lowStep: Math.min(...steps),
    highStep: Math.max(...steps),
    color: correct ? cssVar('--good', '#1f9d55') : null,
    label: correct ? `${spell(question, spelling).pretty}, correct` : 'Which note is this?',
  });
}

function renderEditorStaff() {
  const el = $('ed-staff');
  const notes = [...editing.notes].sort((a, b) => a - b);
  const steps = notes.map((m) => step(m, editing.spelling));
  drawGrandStaff(el, {
    notes,
    spelling: editing.spelling,
    lowStep: steps.length ? Math.min(...steps) : BASS_BOTTOM,
    highStep: steps.length ? Math.max(...steps) : TREBLE_TOP,
    color: cssVar('--pick', '#d93a3a'),
    wide: true,
    label: notes.length ? `Notes in this drill: ${notes.map((m) => spell(m, editing.spelling).pretty).join(', ')}` : 'No notes yet',
  });
}

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function drawGrandStaff(el, { notes, spelling, lowStep, highStep, color, wide = false, label }) {
  if (!window.Vex) return;
  const VF = Vex.Flow;
  el.innerHTML = '';

  // Leave room above and below for the ledger lines this set of notes needs,
  // so the staves don't jump around from one note to the next.
  const half = 5;
  const topRoom = Math.max(0, highStep - TREBLE_TOP) * half + 24;
  const bottomRoom = Math.max(0, BASS_BOTTOM - lowStep) * half + 24;
  const gap = 46;
  const staffH = 40;
  const x = 46;
  const clefRoom = 46;
  const spacing = 46;
  const width = wide ? Math.max(340, x + clefRoom + 24 + notes.length * spacing) : 340;
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

  const room = treble.getNoteEndX() - treble.getNoteStartX();
  notes.forEach((midi, i) => {
    // Middle C and above go on the treble staff; below it, the bass staff.
    const onTreble = midi >= MIDDLE_C;
    const stave = onTreble ? treble : bass;
    const s = spell(midi, spelling);
    const note = new VF.StaveNote({
      clef: onTreble ? 'treble' : 'bass',
      keys: [`${s.letter.toLowerCase()}${s.acc}/${s.octave}`],
      duration: 'w',
    });
    if (s.acc) note.addModifier(new VF.Accidental(s.acc), 0);
    if (color) {
      note.setStyle({ fillStyle: color, strokeStyle: color });
      note.setLedgerLineStyle({ strokeStyle: color });
    }
    note.setStave(stave);
    const mc = new VF.ModifierContext();
    note.addToModifierContext(mc);
    const tick = new VF.TickContext();
    tick.addTickable(note).preFormat();
    const xPos = wide ? 18 + i * spacing : room / 2 - 10;
    tick.setX(xPos);
    note.setContext(context).draw();
  });

  // Make the drawing scale to fit its box.
  const svg = el.querySelector('svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', wide ? 'xMinYMid meet' : 'xMidYMid meet');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  if (wide) {
    // A long drill scrolls sideways inside its box instead of shrinking.
    const boxH = Math.max(120, el.clientHeight - 16);
    const scale = Math.min(boxH / height, 1.6);
    svg.style.height = `${height * scale}px`;
    svg.style.width = `${width * scale}px`;
  } else {
    svg.style.width = '100%';
    svg.style.height = '100%';
  }
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
}

// ======================================================================
// Listening loop
// ======================================================================

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
    const pitch = level > SILENCE_RMS && !appPlaying ? findPitch() : null;
    if (pitch && pitch.clarity >= MIN_CLARITY) showPitch(pitch, level);
    else showNoPitch(appPlaying);
  }
  requestAnimationFrame(tick);
}

// A quick check on the most recent half of the sound covers C2 and up; only if
// that finds nothing do we run the slower full-size check for the lowest notes.
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

  $('note').textContent = spell(midi, currentDrill.spelling).pretty;
  $('freq').textContent = `${freq.toFixed(1)} Hz`;
  $('cents').textContent = cents === 0 ? 'in tune' : `${cents > 0 ? '+' : ''}${cents} cents`;
  $('clarity').textContent = `${Math.round(clarity * 100)}%`;
  lightKey(midi, level);

  // Playing the right note on a real piano answers the question too.
  if (mode === 'practice' && question !== null && !answered) {
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
    const glow = Math.round(Math.max(0, Math.min(1, (db + 50) / 40)) * 10) / 10;
    if (glow !== litGlow) {
      keyEls.get(midi).style.setProperty('--glow', glow);
      litGlow = glow;
    }
  }
  steadyFrames = midi !== null && midi === steadyMidi ? steadyFrames + 1 : 0;
  steadyMidi = midi;
  if ($('follow').checked && midi !== null && steadyFrames === FOLLOW_FRAMES && !isKeyVisible(midi)) {
    scrollToKey(midi, 'smooth');
  }
}

function showError(err) {
  const msg = err.name === 'NotAllowedError'
    ? 'Microphone access was blocked. Allow it in your browser\'s address bar, then try again.'
    : `Couldn't start: ${err.message}`;
  $('start-error').textContent = msg;
  $('start-error').hidden = false;
}
