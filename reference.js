// Reference: clean pictures of the note-reading shortcuts from the method book (Unit 18).
// ABCDE around Middle C, FACE in the spaces, EGBDF on the lines, and all three together.
import { snapshotFrom } from './snapshot.js?v=2';

const C = { middle: '#7c3aed', spaces: '#2563eb', lines: '#e5484d' };
const MIDDLE = [['a', 3], ['b', 3], ['c', 4], ['d', 4], ['e', 4]];
const SPACES = [['f', 4], ['a', 4], ['c', 5], ['e', 5]];
const LINES = [['e', 4], ['g', 4], ['b', 4], ['d', 5], ['f', 5]];

const CARDS = [
  {
    title: 'A B C D E', tag: 'Middle', color: C.middle,
    text: 'Around Middle C. A and B sit just under it in the bass clef; C, D and E go up into the treble clef.',
    notes: MIDDLE.map((n) => [...n, C.middle]),
  },
  {
    title: 'F A C E', tag: 'Spaces', color: C.spaces,
    text: 'The 4 spaces of the treble clef, bottom to top, spell FACE.',
    notes: SPACES.map((n) => [...n, C.spaces]),
  },
  {
    title: 'E G B D F', tag: 'Lines', color: C.lines,
    text: 'The 5 lines of the treble clef, bottom to top. Say it as one sound: “egg-b-d-f”.',
    notes: LINES.map((n) => [...n, C.lines]),
  },
  {
    title: 'All three', tag: 'Together', color: null,
    text: 'Spaces = FACE, lines = EGBDF, middle = ABCDE. Line or space first, then the shortcut.',
    notes: [
      ['a', 3, C.middle], ['b', 3, C.middle], ['c', 4, C.middle], ['d', 4, C.middle],
      ['e', 4, C.lines], ['f', 4, C.spaces], ['g', 4, C.lines], ['a', 4, C.spaces], ['b', 4, C.lines],
      ['c', 5, C.spaces], ['d', 5, C.lines], ['e', 5, C.spaces], ['f', 5, C.lines],
    ],
  },
];

const ic = (d) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICON = {
  book: ic('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7h8M8 11h6"/>'),
  back: ic('<path d="M15 5l-7 7 7 7"/>'),
  pen: ic('<path d="M4 20l1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19z"/><path d="M13.8 7l3.2 3.2"/>'),
};

let root, drawn = false;

export function initReference({ before }) {
  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'ref-btn'; btn.className = 'icon-btn';
  btn.setAttribute('aria-label', 'Reference: note shortcuts'); btn.title = 'Reference';
  btn.innerHTML = ICON.book;
  before.before(btn);
  btn.addEventListener('click', open);

  root = document.createElement('div');
  root.id = 'ref'; root.className = 'snap ref'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Reference');
  root.innerHTML = `
    <div class="snap-top">
      <button type="button" class="icon-btn" data-act="back" aria-label="Back to practice" title="Back">${ICON.back}</button>
      <span class="snap-title">Reference</span>
    </div>
    <div class="ref-list">
      ${CARDS.map((c, i) => `
        <article class="ref-card" style="--ref:${c.color || '#1b1a1f'}">
          <header class="ref-head">
            <div><span class="ref-tag">${c.tag}</span><h2 class="ref-title">${c.title}</h2></div>
            <button type="button" class="ref-draw" data-draw="${i}" aria-label="Draw on ${c.title}">${ICON.pen}<span>Draw</span></button>
          </header>
          <div class="ref-sheet" data-sheet="${i}"></div>
          <p class="ref-text">${c.text}</p>
        </article>`).join('')}
    </div>`;
  document.body.append(root);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'back') close();
    else if (b.dataset.draw) {
      const svg = root.querySelector(`[data-sheet="${b.dataset.draw}"] svg`);
      if (svg) snapshotFrom(svg);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (!root.hidden && e.key === 'Escape' && document.getElementById('snap')?.hidden !== false) close();
  });
}

function open() {
  root.hidden = false;
  document.body.classList.add('ref-open');
  if (!drawn && window.Vex) {
    CARDS.forEach((c, i) => draw(root.querySelector(`[data-sheet="${i}"]`), c.notes));
    drawn = true;
  }
  root.querySelector('[data-act="back"]').focus();
}

function close() {
  root.hidden = true;
  document.body.classList.remove('ref-open');
  document.getElementById('ref-btn')?.focus();
}

// A clean grand staff with each note coloured by its shortcut and its letter written underneath.
function draw(el, notes) {
  const VF = Vex.Flow;
  el.innerHTML = '';
  const x = 46, clefRoom = 52, spacing = notes.length > 8 ? 40 : 56;
  const width = x + clefRoom + 24 + notes.length * spacing + 10;
  const trebleY = 30, gap = 64, staffH = 40;
  const bassY = trebleY + staffH + gap;
  const height = bassY + staffH + 44;

  const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
  renderer.resize(width, height);
  const ctx = renderer.getContext();
  const opts = { space_above_staff_ln: 0, space_below_staff_ln: 0 };
  const treble = new VF.Stave(x, trebleY, width - x - 10, opts).addClef('treble');
  const bass = new VF.Stave(x, bassY, width - x - 10, opts).addClef('bass');
  treble.setContext(ctx).draw();
  bass.setContext(ctx).draw();
  new VF.StaveConnector(treble, bass).setType('brace').setContext(ctx).draw();
  new VF.StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw();
  new VF.StaveConnector(treble, bass).setType('singleRight').setContext(ctx).draw();

  notes.forEach(([letter, octave, color], i) => {
    // Same rule as practice: Middle C and above on the treble staff.
    const onTreble = octave >= 4;
    const stave = onTreble ? treble : bass;
    const note = new VF.StaveNote({ clef: onTreble ? 'treble' : 'bass', keys: [`${letter}/${octave}`], duration: 'w' });
    note.setStyle({ fillStyle: color, strokeStyle: color });
    note.setLedgerLineStyle({ strokeStyle: '#1b1a1f', lineWidth: 1.6 });
    note.setStave(stave);
    note.addToModifierContext(new VF.ModifierContext());
    const tick = new VF.TickContext();
    tick.addTickable(note).preFormat();
    tick.setX(14 + i * spacing);
    note.setContext(ctx).draw();

    // The letter: treble notes in the gap between the staves, bass notes below the bass staff.
    const cx = note.getAbsoluteX() + note.getGlyphWidth() / 2;
    const ty = onTreble ? trebleY + staffH + gap / 2 + 8 : bassY + staffH + 30;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', cx); t.setAttribute('y', ty);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', 'ref-letter');
    t.setAttribute('fill', color); t.setAttribute('stroke', 'none');
    t.setAttribute('font-family', 'system-ui, -apple-system, Segoe UI, sans-serif');
    t.setAttribute('font-size', '20'); t.setAttribute('font-weight', '800');
    t.textContent = letter.toUpperCase();
    el.querySelector('svg').append(t);
  });

  const svg = el.querySelector('svg');
  const left = x - 16;
  svg.setAttribute('viewBox', `${left - 10} 0 ${width - left + 10} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.removeAttribute('width'); svg.removeAttribute('height');
  svg.style.width = '100%'; svg.style.height = 'auto';
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', notes.map(([l, o]) => `${l.toUpperCase()}${o}`).join(', '));
}
