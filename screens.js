import { CHARACTER_IDS, characterSVG, characterName } from './characters.js?v=8';
import { startTour } from './tour.js?v=1';
import { THEME_IDS, themeName, wallpaperSVG, wallpaperCount } from './wallpapers.js?v=2';
import { LOOKS, applyLook, deriveLook, lookArt } from './theme.js?v=1';

// The pages around the practice screen: splash, intro, the first-time setup
// (onboarding), home, drills, profile, theme and settings.

const $ = (id) => document.getElementById(id);
const PROFILE_KEY = 'sr-profile';
const MASCOT = 'dragon';
const SCREENS = ['splash', 'intro', 'onboard', 'home', 'drills-page', 'profile-page', 'theme-page', 'settings-page'];

let api = null;
let profile = null; // { name, character, variant, heard }
let settingsFromPractice = false;

// ---------- Look (colours and fonts) ----------
const LOOK_KEY = 'sr-look';
let look = 'recital';
function loadLook() {
  try { look = new URLSearchParams(location.search).get('look') || localStorage.getItem(LOOK_KEY) || 'recital'; } catch { look = 'recital'; }
  applyLook(look);
}
function renderLooks() {
  const grid = $('look-grid');
  grid.innerHTML = '';
  for (const L of LOOKS) {
    const c = deriveLook(L);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'look-tile';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(L.id === look));
    const sw = document.createElement('span');
    sw.className = 'look-swatch';
    sw.style.background = `linear-gradient(160deg, ${c.hdr0}, ${c.hdr1})`;
    sw.innerHTML = lookArt(L, c);
    const name = document.createElement('span');
    name.textContent = L.name;
    b.append(sw, name);
    b.addEventListener('click', () => {
      look = L.id;
      try { localStorage.setItem(LOOK_KEY, look); } catch { /* storage may be blocked */ }
      applyLook(look);
      for (const o of grid.children) o.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-checked', 'true');
    });
    grid.append(b);
  }
}

// ---------- Wallpaper ----------
const WALL_KEY = 'sr-wall';
let wall = '';   // "theme:variant", or '' for none
function loadWall() { try { wall = localStorage.getItem(WALL_KEY) || ''; } catch { wall = ''; } }
function applyWall() {
  const [id, v] = wall.split(':');
  $('wallpaper').innerHTML = id ? wallpaperSVG(id, Number(v) || 0) : '';
}
// The wallpaper shows behind the home page and the practice screen only.
function showWall(on) { document.body.classList.toggle('has-wall', Boolean(on && wall)); }

function renderWalls() {
  const grid = $('wall-grid');
  grid.innerHTML = '';
  const options = [['', 'None']];
  for (const id of THEME_IDS) {
    const n = wallpaperCount(id);
    for (let v = 0; v < n; v++) options.push([`${id}:${v}`, themeName(id) + (n > 1 ? ` ${v === 0 ? 'A' : 'B'}` : '')]);
  }
  for (const [key, label] of options) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'wall-tile';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(key === wall));
    const pic = document.createElement('span');
    pic.className = 'wall-pic';
    if (key) { const [id, v] = key.split(':'); pic.innerHTML = wallpaperSVG(id, Number(v)); }
    const name = document.createElement('span');
    name.className = 'wall-name';
    name.textContent = label;
    b.append(pic, name);
    b.addEventListener('click', () => {
      wall = key;
      try { localStorage.setItem(WALL_KEY, wall); } catch { /* storage may be blocked */ }
      applyWall();
      for (const other of grid.children) other.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-checked', 'true');
    });
    grid.append(b);
  }
}

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch { return null; }
}
function saveProfile() {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* storage may be blocked */ }
}

// ---------- Moving between pages ----------

function hideAll() {
  for (const id of SCREENS) $(id).hidden = true;
  $('bottom-nav').hidden = true;
}

export function showScreen(id, { from } = {}) {
  const practiceVisible = !$('app').hidden;
  if (id === 'settings-page' && from === 'app') {
    // Settings over practice: keep practice (and the mic) running underneath.
    settingsFromPractice = true;
    $('app').hidden = true;
  } else if (practiceVisible || settingsFromPractice) {
    settingsFromPractice = false;
    api.leavePractice();
  }
  hideAll();
  const el = $(id);
  el.hidden = false;
  const withNav = el.classList.contains('with-nav');
  $('bottom-nav').hidden = !withNav;
  for (const b of $('bottom-nav').querySelectorAll('button')) {
    b.classList.toggle('active', b.dataset.go === id);
    if (b.dataset.go === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  }
  $('settings-back').hidden = !settingsFromPractice;
  if (id === 'home') renderHome();
  if (id === 'drills-page') renderDrills();
  if (id === 'profile-page') renderProfile();
  if (id === 'theme-page') { renderLooks(); renderWalls(); }
  showWall(id === 'home');
  window.scrollTo(0, 0);
}

function enterPractice() {
  settingsFromPractice = false;
  hideAll();
  showWall(true);
  api.openPractice();
}

function enterEditor(drill) {
  settingsFromPractice = false;
  hideAll();
  api.openEditorFor(drill, 'drills-page');
}

// ---------- Character grids ----------

function fillGrid(container, variant, selected, onPick) {
  container.innerHTML = '';
  for (const id of CHARACTER_IDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'char-btn';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(id === selected));
    b.setAttribute('aria-label', characterName(id));
    b.innerHTML = characterSVG(id, variant);
    b.addEventListener('click', () => {
      for (const other of container.children) other.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-checked', 'true');
      onPick(id);
    });
    container.append(b);
  }
}

// ---------- Splash and intro ----------

function buildSplash() {
  const crowd = $('splash-crowd');
  const cast = [
    ['angel', 'musical'], ['phoenix', 'musical'], ['dragon', 'musical'],
    ['shark', 'musical'], ['unicorn', 'musical'], ['bear', 'musical'],
  ];
  crowd.innerHTML = cast.map(([id, v], i) => `<div class="crowd-char c${i}">${characterSVG(id, v)}</div>`).join('');
  $('intro-mascot').innerHTML = characterSVG(MASCOT, 'musical');
  $('theme-mascot').innerHTML = characterSVG(MASCOT, 'musical');
}

function leaveSplash() {
  if ($('splash').hidden) return;
  if (profile) showScreen('home');
  else showScreen('intro');
}

// ---------- Onboarding ----------

const STEPS = ['heard', 'name', 'character', 'welcome'];
const NEXT_LABEL = { heard: 'Continue', name: 'Next', character: 'Next', welcome: "Let's go" };
let stepIndex = 0;
let draft = { name: '', heard: null, character: null, variant: 'musical' };

function showStep(i) {
  stepIndex = i;
  const step = STEPS[i];
  for (const el of $('onboard').querySelectorAll('.ob-step')) el.hidden = el.dataset.step !== step;
  $('ob-bar').style.width = `${((i + 1) / STEPS.length) * 100}%`;
  $('ob-next').textContent = NEXT_LABEL[step];
  $('ob-next').className = 'btn';
  if (step === 'name') setTimeout(() => $('ob-name').focus(), 50);
  if (step === 'character') {
    $('pick-title').textContent = `Choose a character for ${draft.name}`;
    fillGrid($('ob-grid'), draft.variant, draft.character, (id) => { draft.character = id; updateNext(); });
  }
  if (step === 'welcome') {
    $('welcome-char').innerHTML = characterSVG(draft.character, draft.variant);
    $('welcome-title').textContent = `Welcome, ${draft.name}!`;
  }
  updateNext();
}

function updateNext() {
  const step = STEPS[stepIndex];
  const ok = step === 'heard' ? Boolean(draft.heard)
    : step === 'name' ? draft.name.trim().length > 0
      : step === 'character' ? Boolean(draft.character)
        : true;
  $('ob-next').disabled = !ok;
}

function wireOnboarding() {
  $('get-started').addEventListener('click', () => {
    draft = { name: '', heard: null, character: null, variant: 'musical' };
    $('ob-name').value = '';
    for (const b of $('heard-list').children) b.setAttribute('aria-checked', 'false');
    showScreen('onboard');
    showStep(0);
  });
  for (const b of $('heard-list').children) {
    b.addEventListener('click', () => {
      for (const o of $('heard-list').children) o.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-checked', 'true');
      draft.heard = b.dataset.v;
      updateNext();
    });
  }
  $('ob-name').addEventListener('input', () => { draft.name = $('ob-name').value; updateNext(); });
  $('ob-name').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('ob-next').disabled) $('ob-next').click(); });
  $('ob-back').addEventListener('click', () => {
    if (stepIndex === 0) showScreen('intro');
    else showStep(stepIndex - 1);
  });
  $('ob-next').addEventListener('click', () => {
    if (stepIndex < STEPS.length - 1) { showStep(stepIndex + 1); return; }
    profile = { name: draft.name.trim(), character: draft.character, variant: draft.variant, heard: draft.heard };
    saveProfile();
    showScreen('home');
    // First time in: the tutorial starts by itself (Exit any time).
    setTimeout(startTour, 400);
  });
}

// ---------- Home ----------

function renderHome() {
  if (!profile) return;
  $('home-hello').textContent = `Hi ${profile.name}!`;
  $('home-avatar').innerHTML = characterSVG(profile.character, profile.variant);
}

// ---------- Drills list ----------

function renderDrills() {
  const list = $('drills-list');
  list.innerHTML = '';
  const mine = api.myDrills();
  const builtIn = api.allDrills().filter((d) => d.preset);
  const section = (title, drills, empty) => {
    const h = document.createElement('h2');
    h.className = 'section-title';
    h.textContent = title;
    list.append(h);
    if (!drills.length) {
      const p = document.createElement('p');
      p.className = 'empty-note';
      p.textContent = empty;
      list.append(p);
      return;
    }
    const card = document.createElement('div');
    card.className = 'list-card';
    list.append(card);
    for (const d of drills) {
      const row = document.createElement('div');
      row.className = 'drill-row';
      const info = document.createElement('div');
      info.className = 'drill-info';
      const name = document.createElement('span');
      name.className = 'drill-name';
      name.textContent = d.name;
      const count = document.createElement('span');
      count.className = 'drill-count';
      count.textContent = `${d.items.length} notes`;
      info.append(name, count);
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn-text';
      edit.textContent = d.preset ? 'Copy' : 'Edit';
      edit.addEventListener('click', () => enterEditor(d));
      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'btn-tonal';
      play.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>Practise';
      play.addEventListener('click', () => { api.selectDrill(d.id); enterPractice(); });
      if (!d.preset) { play.dataset.practise = d.id; play.dataset.name = d.name; }
      row.append(info, edit, play);
      card.append(row);
    }
  };
  section('My drills', mine, 'No drills yet. Tap "New drill" to make one.');
  section('Built in', builtIn, '');
}

// ---------- Profile ----------

function renderProfile() {
  if (!profile) return;
  $('profile-char').innerHTML = characterSVG(profile.character, profile.variant);
  $('profile-name').value = profile.name;
  fillGrid($('profile-grid'), profile.variant, profile.character, (id) => {
    profile.character = id;
    saveProfile();
    $('profile-char').innerHTML = characterSVG(profile.character, profile.variant);
  });
}

function wireProfile() {
  $('profile-name').addEventListener('input', () => {
    const v = $('profile-name').value.trim();
    if (!v) return;
    profile.name = v;
    saveProfile();
  });
  $('profile-reset').addEventListener('click', () => {
    profile = null;
    try { localStorage.removeItem(PROFILE_KEY); } catch { /* ignore */ }
    showScreen('intro');
  });
}

// ---------- Start ----------

export function initScreens(appApi) {
  api = appApi;
  profile = loadProfile();
  loadLook();
  loadWall();
  applyWall();
  buildSplash();
  wireOnboarding();
  wireProfile();

  $('splash').addEventListener('click', leaveSplash);
  $('card-practice').addEventListener('click', enterPractice);
  $('card-drills').addEventListener('click', () => showScreen('drills-page'));
  for (const id of ['home-tutorial', 'settings-tutorial']) {
    $(id).addEventListener('click', () => { showScreen('home'); setTimeout(startTour, 150); });
  }
  $('home-avatar').addEventListener('click', () => showScreen('profile-page'));
  $('drills-new').addEventListener('click', () => enterEditor(null));
  $('settings-back').addEventListener('click', enterPractice);
  for (const b of $('bottom-nav').querySelectorAll('button')) {
    b.addEventListener('click', () => showScreen(b.dataset.go));
  }

  // The splash shows briefly, then moves on by itself (or on a tap).
  hideAll();
  $('splash').hidden = false;
  setTimeout(leaveSplash, profile ? 1400 : 2600);
}
