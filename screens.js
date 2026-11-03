import { CHARACTER_IDS, characterSVG, characterName } from './characters.js?v=1';

// The pages around the practice screen: splash, intro, the first-time setup
// (onboarding), home, drills, profile, theme and settings.

const $ = (id) => document.getElementById(id);
const PROFILE_KEY = 'sr-profile';
const MASCOT = 'rooster';
const SCREENS = ['splash', 'intro', 'onboard', 'home', 'drills-page', 'profile-page', 'theme-page', 'settings-page'];

let api = null;
let profile = null; // { name, character, variant, heard }
let settingsFromPractice = false;

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
  window.scrollTo(0, 0);
}

function enterPractice() {
  settingsFromPractice = false;
  hideAll();
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

function wireVariantToggle(root, getVariant, onChange) {
  const buttons = root.querySelectorAll('[data-variant]');
  const sync = () => buttons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.variant === getVariant())));
  buttons.forEach((b) => b.addEventListener('click', () => { onChange(b.dataset.variant); sync(); }));
  sync();
  return sync;
}

// ---------- Splash and intro ----------

function buildSplash() {
  const crowd = $('splash-crowd');
  const cast = [
    ['rabbit', 'musical'], ['tiger', 'plain'], ['rooster', 'musical'],
    ['dog', 'plain'], ['dragon', 'musical'], ['pig', 'plain'],
  ];
  crowd.innerHTML = cast.map(([id, v], i) => `<div class="crowd-char c${i}">${characterSVG(id, v)}</div>`).join('');
  $('intro-mascot').innerHTML = characterSVG(MASCOT, 'musical');
  $('theme-mascot').innerHTML = characterSVG(MASCOT, 'plain');
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
let draft = { name: '', heard: null, character: null, variant: 'plain' };

function showStep(i) {
  stepIndex = i;
  const step = STEPS[i];
  for (const el of $('onboard').querySelectorAll('.ob-step')) el.hidden = el.dataset.step !== step;
  $('ob-bar').style.width = `${((i + 1) / STEPS.length) * 100}%`;
  $('ob-next').textContent = NEXT_LABEL[step];
  $('ob-next').className = step === 'welcome' ? 'btn btn-green' : 'btn btn-blue';
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
    draft = { name: '', heard: null, character: null, variant: 'plain' };
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
  wireVariantToggle($('onboard'), () => draft.variant, (v) => {
    draft.variant = v;
    fillGrid($('ob-grid'), v, draft.character, (id) => { draft.character = id; updateNext(); });
  });
  $('ob-back').addEventListener('click', () => {
    if (stepIndex === 0) showScreen('intro');
    else showStep(stepIndex - 1);
  });
  $('ob-next').addEventListener('click', () => {
    if (stepIndex < STEPS.length - 1) { showStep(stepIndex + 1); return; }
    profile = { name: draft.name.trim(), character: draft.character, variant: draft.variant, heard: draft.heard };
    saveProfile();
    showScreen('home');
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
      edit.className = 'btn btn-plain small';
      edit.textContent = d.preset ? 'Copy' : 'Edit';
      edit.addEventListener('click', () => enterEditor(d));
      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'btn btn-green small';
      play.textContent = 'Practise';
      play.addEventListener('click', () => { api.selectDrill(d.id); enterPractice(); });
      row.append(info, edit, play);
      list.append(row);
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
  syncProfileVariant();
  fillGrid($('profile-grid'), profile.variant, profile.character, (id) => {
    profile.character = id;
    saveProfile();
    $('profile-char').innerHTML = characterSVG(profile.character, profile.variant);
  });
}

let syncProfileVariant = () => {};

function wireProfile() {
  $('profile-name').addEventListener('input', () => {
    const v = $('profile-name').value.trim();
    if (!v) return;
    profile.name = v;
    saveProfile();
  });
  syncProfileVariant = wireVariantToggle($('profile-page'), () => profile?.variant || 'plain', (v) => {
    profile.variant = v;
    saveProfile();
    renderProfile();
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
  buildSplash();
  wireOnboarding();
  wireProfile();

  $('splash').addEventListener('click', leaveSplash);
  $('card-practice').addEventListener('click', enterPractice);
  $('card-drills').addEventListener('click', () => showScreen('drills-page'));
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
