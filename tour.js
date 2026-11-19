import { characterSVG } from './characters.js?v=8';

// The guided tutorial: highlights one thing at a time, the dragon explains it,
// and the person taps the highlighted thing (or Next) to carry on. Exit any time.

const $ = (id) => document.getElementById(id);
const sel = (q) => () => document.querySelector(q);
const row = (id) => () => $(id)?.closest('.setting-row');

// Each step: el (what to highlight; none = a centred message), text, and either
// `next: true` (a Next button) or `until` (carry on once this becomes true).
function buildSteps() {
  let savedName = '';
  return [
    { text: "Hi! I'm your guide. Let's make your first drill together: the notes from A3 up to E4. Tap Next to start, or Exit any time.", next: true },
    { el: () => $('card-drills'), text: 'A drill is the set of notes you practise. Tap Drills.', until: () => !$('drills-page').hidden },
    { el: () => $('drills-new'), text: 'Tap New drill.', until: () => !$('editor').hidden && !$('app').hidden },
    { el: () => $('ed-from'), text: 'Choose the lowest note of your drill: A3.', until: () => $('ed-from').value === '57', auto: true },
    { el: () => $('ed-to'), text: 'Now the highest note: E4. (If it already says E4, just tap Next.)', next: true },
    { el: () => $('ed-add'), text: 'Tap Add. All the white notes from A3 to E4 go into your drill.', until: () => /^[1-9]/.test($('ed-count').textContent) },
    { el: () => $('ed-staff'), text: 'Here are your notes on the staff. You can also tap keys on the piano to add or remove single notes.', next: true },
    { el: () => $('ed-name'), text: 'Your drill already has a name, but you can change it here.', next: true },
    {
      el: () => $('ed-save'), text: 'Tap Save.',
      until: () => {
        if (!$('editor').hidden) savedName = $('ed-name').value.trim();
        return !$('drills-page').hidden;
      },
    },
    {
      el: () => {
        const buttons = [...document.querySelectorAll('#drills-list [data-practise]')];
        return buttons.find((b) => b.dataset.name === savedName) || buttons[buttons.length - 1];
      },
      text: 'Your drill is saved under My drills. Tap Practise to try it.', until: () => !$('practice').hidden && !$('app').hidden,
    },
    { el: () => $('staff'), text: 'A note appears on the staff. Read it…', next: true },
    { el: () => $('dock'), text: '…then tap that key on the piano. Slide the bar above the keys to move along the keyboard.', next: true },
    { el: () => $('hint'), text: 'Stuck? Hint lights up the right key.', next: true },
    { el: () => $('mic-toggle'), text: 'Practising on a real piano? Turn the mic on and play the note instead of tapping.', next: true },
    { el: () => $('drill-select'), text: 'Switch between your drills here.', next: true },
    { el: () => $('settings-btn'), text: 'Now tap Settings.', until: () => !$('settings-page').hidden },
    { el: row('mic-sens'), text: "If the mic misses notes you play, turn up Mic sensitivity. If it hears notes you didn't play, turn it down.", next: true },
    { el: row('show-accuracy'), text: 'Turn on Show accuracy to see your score as a percentage.', next: true },
    { el: row('key-size'), text: 'Make the piano keys bigger or smaller here.', next: true },
    { text: "That's it! You can replay this tour any time with the Tutorial button on the home page. Happy practising!", next: true, last: true },
  ];
}

let steps = [];
let index = 0;
let root = null;
let raf = 0;
let poll = 0;
let currentEl = null;

function make(tag, cls, parent) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (parent) parent.append(el);
  return el;
}

function buildUI() {
  root = make('div', 'tour', document.body);
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Tutorial');
  for (const side of ['t', 'b', 'l', 'r']) make('div', `tour-block tour-${side}`, root);
  make('div', 'tour-ring', root);
  const bubble = make('div', 'tour-bubble', root);
  const face = make('div', 'tour-face', bubble);
  face.innerHTML = characterSVG('dragon');
  const body = make('div', 'tour-body', bubble);
  make('p', 'tour-text', body).setAttribute('aria-live', 'polite');
  const bar = make('div', 'tour-bar', body);
  make('span', 'tour-count', bar);
  const exit = make('button', 'tour-exit', bar);
  exit.type = 'button';
  exit.textContent = 'Exit';
  exit.addEventListener('click', endTour);
  const next = make('button', 'tour-next', bar);
  next.type = 'button';
  next.addEventListener('click', () => go(index + 1));
}

function place() {
  if (!root) return;
  const step = steps[index];
  const el = step.el ? step.el() : null;
  if (el !== currentEl) currentEl = el;
  const vw = innerWidth, vh = innerHeight;
  const blocks = root.querySelectorAll('.tour-block');
  const ring = root.querySelector('.tour-ring');
  const bubble = root.querySelector('.tour-bubble');
  const visible = el && el.getClientRects().length && el.offsetParent !== null;
  let r = { left: vw / 2, right: vw / 2, top: vh / 2, bottom: vh / 2, width: 0, height: 0 };
  if (visible) {
    const b = el.getBoundingClientRect();
    const pad = 6;
    r = { left: b.left - pad, right: b.right + pad, top: b.top - pad, bottom: b.bottom + pad };
    r.width = r.right - r.left; r.height = r.bottom - r.top;
  }
  const hole = visible || !step.el;
  // Four dark panels around the highlighted thing; taps outside it are blocked.
  const [t, bo, l, ri] = blocks;
  Object.assign(t.style, { left: '0px', top: '0px', width: `${vw}px`, height: `${Math.max(0, r.top)}px` });
  Object.assign(bo.style, { left: '0px', top: `${r.bottom}px`, width: `${vw}px`, height: `${Math.max(0, vh - r.bottom)}px` });
  Object.assign(l.style, { left: '0px', top: `${r.top}px`, width: `${Math.max(0, r.left)}px`, height: `${r.height}px` });
  Object.assign(ri.style, { left: `${r.right}px`, top: `${r.top}px`, width: `${Math.max(0, vw - r.right)}px`, height: `${r.height}px` });
  ring.hidden = !visible;
  if (visible) Object.assign(ring.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  root.classList.toggle('waiting', Boolean(step.el) && !hole);

  // The speech bubble goes below the highlight if there's room, otherwise above.
  const bw = Math.min(380, vw - 24);
  bubble.style.width = `${bw}px`;
  const bh = bubble.offsetHeight;
  let top;
  if (!visible) top = vh / 2 - bh / 2;
  else if (vh - r.bottom > bh + 16) top = r.bottom + 12;
  else if (r.top > bh + 16) top = r.top - bh - 12;
  else top = Math.max(12, vh - bh - 12);
  const cx = visible ? r.left + r.width / 2 : vw / 2;
  const left = Math.min(vw - bw - 12, Math.max(12, cx - bw / 2));
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
}

function loop() {
  place();
  raf = requestAnimationFrame(loop);
}

function go(i) {
  if (!root) return;
  if (i >= steps.length || steps[index]?.last && i > index) { endTour(); return; }
  index = i;
  const step = steps[index];
  step.onEnter?.();
  root.querySelector('.tour-text').textContent = step.text;
  root.querySelector('.tour-count').textContent = `${index + 1} of ${steps.length}`;
  const next = root.querySelector('.tour-next');
  next.textContent = step.last ? 'Finish' : 'Next';
  next.hidden = !step.next;
  clearInterval(poll);
  let scrolled = false;
  let advancing = false;
  poll = setInterval(() => {
    const el = step.el?.();
    if (el && !scrolled && el.getClientRects().length) {
      scrolled = true;
      const b = el.getBoundingClientRect();
      if (b.top < 0 || b.bottom > innerHeight) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    if (step.until && !advancing && step.until()) {
      if (step.next && !step.auto) return;
      advancing = true;
      setTimeout(() => { if (steps[index] === step) go(index + 1); }, step.auto ? 500 : 250);
    }
  }, 150);
}

export function startTour() {
  if (root) endTour();
  steps = buildSteps();
  buildUI();
  index = 0;
  currentEl = null;
  go(0);
  loop();
  document.addEventListener('keydown', onKey);
}

export function endTour() {
  clearInterval(poll);
  cancelAnimationFrame(raf);
  root?.remove();
  root = null;
  document.removeEventListener('keydown', onKey);
}

function onKey(e) {
  if (e.key === 'Escape') endTour();
}

export function tourRunning() { return Boolean(root); }
