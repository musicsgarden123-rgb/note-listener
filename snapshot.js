// Snapshot: freeze the staff as a picture, then draw on it.
// Pen, highlighter and eraser; four colours; undo, redo, clear; save or share; delete; back.

const COLORS = [
  { c: '#e5484d', name: 'Red' },
  { c: '#2563eb', name: 'Blue' },
  { c: '#16a34a', name: 'Green' },
  { c: '#141318', name: 'Black' },
];
const TOOLS = {
  pen: { width: 3.5, alpha: 1 },
  highlighter: { width: 18, alpha: 0.32 },
  eraser: { width: 26, alpha: 1 },
};
const COPY_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity',
  'fill-opacity', 'stroke-opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'visibility', 'display'];

const ic = (d) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICON = {
  camera: ic('<path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.6"/>'),
  back: ic('<path d="M15 5l-7 7 7 7"/>'),
  pen: ic('<path d="M4 20l1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19z"/><path d="M13.8 7l3.2 3.2"/>'),
  highlighter: ic('<path d="M9 15l-3 3h5l1.5-1.5"/><path d="M8.5 13.5l7.8-9 3.2 3.2-9 7.8z"/><path d="M4 21h16"/>'),
  eraser: ic('<path d="M8.5 19.5L3.8 14.8a1.6 1.6 0 0 1 0-2.3l8.7-8.7a1.6 1.6 0 0 1 2.3 0l5.4 5.4a1.6 1.6 0 0 1 0 2.3l-8 8z"/><path d="M8.5 19.5H20M8 10.3l6.7 6.7"/>'),
  undo: ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  redo: ic('<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
  clear: ic('<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/>'),
  trash: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  hand: ic('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8.5c0 3.6-2.4 6.5-6 6.5-2.6 0-4-1.2-5.4-3.4L3.8 14.4a1.5 1.5 0 0 1 2.5-1.7L8 15"/>'),
  zoomIn: ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20M8 10.5h5M10.5 8v5"/>'),
  zoomOut: ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20M8 10.5h5"/>'),
  share: ic('<path d="M12 15V3.5M7.5 8L12 3.5 16.5 8"/><path d="M5 12v8h14v-8"/>'),
};

let staffEl, shotBtn, reopenBtn, root, sheet, baseCv, inkCv, stage;
let strokes = [], undoStack = [], redoStack = [];
let tool = 'pen', color = COLORS[0].c;
let drawing = null, frame = 0, hasShot = false;
// Zoom and move: the sheet is scaled and shifted inside the stage.
const MIN_ZOOM = 1, MAX_ZOOM = 6;
let zoom = 1, panX = 0, panY = 0;
const pointers = new Map();   // fingers, pen or mouse currently down on the stage
let gesture = null;           // { kind: 'draw' | 'pan' | 'pinch', ... }
let penSeen = false;          // once an Apple Pencil draws, a single finger moves the page instead

export function initSnapshot({ staff, bar }) {
  staffEl = staff;
  shotBtn = button('snap-btn', 'icon-btn small', ICON.camera, 'Snapshot the staff to draw on it');
  reopenBtn = button('snap-reopen', 'snap-thumb', '', 'Open your last snapshot');
  reopenBtn.hidden = true;
  const anchor = bar.querySelector('#restart');
  anchor.after(shotBtn, reopenBtn);
  shotBtn.addEventListener('click', take);
  reopenBtn.addEventListener('click', open);
  build();
}

function button(id, cls, html, label) {
  const b = document.createElement('button');
  b.type = 'button'; b.id = id; b.className = cls; b.innerHTML = html;
  b.setAttribute('aria-label', label); b.title = label;
  return b;
}

function build() {
  root = document.createElement('div');
  root.id = 'snap'; root.className = 'snap'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Snapshot');
  root.innerHTML = `
    <div class="snap-top">
      <button type="button" class="icon-btn" data-act="back" aria-label="Back to practice" title="Back">${ICON.back}</button>
      <span class="snap-title">Snapshot</span>
      <button type="button" class="icon-btn small" data-act="undo" aria-label="Undo" title="Undo">${ICON.undo}</button>
      <button type="button" class="icon-btn small" data-act="redo" aria-label="Redo" title="Redo">${ICON.redo}</button>
      <button type="button" class="icon-btn small snap-danger" data-act="delete" aria-label="Delete snapshot" title="Delete">${ICON.trash}</button>
      <button type="button" class="primary snap-save" data-act="save">${ICON.share}<span>Save</span></button>
    </div>
    <div class="snap-stage"><div class="snap-sheet"><canvas class="snap-base"></canvas><canvas class="snap-ink"></canvas></div></div>
    <div class="snap-tools">
      <div class="segmented snap-toolset" role="radiogroup" aria-label="Tool">
        ${[['pen', 'Pen'], ['highlighter', 'Highlighter'], ['eraser', 'Eraser'], ['hand', 'Move']].map(([t, n]) => `<button type="button" role="radio" data-tool="${t}" aria-label="${n}" title="${n}">${ICON[t]}</button>`).join('')}
      </div>
      <div class="snap-colors" role="radiogroup" aria-label="Colour">
        ${COLORS.map((k) => `<button type="button" role="radio" class="snap-swatch" data-color="${k.c}" style="--sw:${k.c}" aria-label="${k.name}" title="${k.name}"></button>`).join('')}
      </div>
      <div class="snap-zoom" role="group" aria-label="Zoom">
        <button type="button" class="icon-btn small" data-act="zoomOut" aria-label="Zoom out" title="Zoom out">${ICON.zoomOut}</button>
        <button type="button" class="snap-zoom-level" data-act="zoomFit" aria-label="Fit to screen" title="Fit to screen">100%</button>
        <button type="button" class="icon-btn small" data-act="zoomIn" aria-label="Zoom in" title="Zoom in">${ICON.zoomIn}</button>
      </div>
      <button type="button" class="snap-clear" data-act="clear">${ICON.clear}<span>Clear</span></button>
    </div>`;
  document.body.append(root);
  stage = root.querySelector('.snap-stage');
  sheet = root.querySelector('.snap-sheet');
  baseCv = root.querySelector('.snap-base');
  inkCv = root.querySelector('.snap-ink');

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool);
    else if (b.dataset.color) { setColor(b.dataset.color); if (tool === 'eraser' || tool === 'hand') setTool('pen'); }
    else ({ back: close, undo, redo, clear, delete: discard, save, zoomIn: () => zoomBy(1.5), zoomOut: () => zoomBy(1 / 1.5), zoomFit: resetZoom })[b.dataset.act]?.();
  });
  stage.addEventListener('pointerdown', down);
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', wheel, { passive: false });
  // Safari's own pinch events: stop the whole page zooming instead of the sheet.
  for (const t of ['gesturestart', 'gesturechange']) stage.addEventListener(t, (e) => e.preventDefault());
  window.addEventListener('resize', () => { if (!root.hidden) fit(); });
  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') close();
    else if ((e.metaKey || e.ctrlKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if ((e.metaKey || e.ctrlKey) && k === 'y') { e.preventDefault(); redo(); }
    else if (k === '+' || k === '=') zoomBy(1.5);
    else if (k === '-') zoomBy(1 / 1.5);
    else if (k === '0') resetZoom();
    else return;
    e.stopPropagation();
  }, true);
  setTool('pen'); setColor(color);
}

// ---------- Taking the picture ----------
function take() { const svg = staffEl.querySelector('svg'); if (svg) snapshotFrom(svg); }

// Picture of the staff as it looks on screen, white space included, so there is room
// above and below the grand staff to write ledger-line notes. Never the keyboard.
export async function snapshotFrom(svg) {
  shotBtn.disabled = true;
  try {
    const { img, w: cw, h: ch } = await svgImage(svg);
    const padX = 24;
    const padY = Math.max(32, ch * 0.18);
    // Extra resolution so the music stays sharp when zoomed in (kept under ~8 million pixels for iPad).
    const area = (cw + padX * 2) * (ch + padY * 2);
    const scale = Math.max(2, Math.min(5, Math.sqrt(8e6 / area)));
    const w = Math.round((cw + padX * 2) * scale), h = Math.round((ch + padY * 2) * scale);
    for (const cv of [baseCv, inkCv]) { cv.width = w; cv.height = h; }
    const ctx = baseCv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, padX * scale, padY * scale, cw * scale, ch * scale);
    strokes = []; undoStack = []; redoStack = [];
    paint();
    hasShot = true;
    open();
  } catch (err) {
    console.error('Snapshot failed', err);
  } finally {
    shotBtn.disabled = false;
  }
}

// Copies the staff's on-screen colours into the copy, so it looks the same outside the page.
function svgImage(svg) {
  const r = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true);
  const src = [svg, ...svg.querySelectorAll('*')];
  const dst = [clone, ...clone.querySelectorAll('*')];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    dst[i].setAttribute('style', COPY_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'));
  });
  if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', r.width);
  clone.setAttribute('height', r.height);
  const xml = new XMLSerializer().serializeToString(clone);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, w: r.width, h: r.height });
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
}

// ---------- Opening and closing ----------
function open() {
  if (!hasShot) return;
  pointers.clear(); gesture = null; drawing = null;
  root.hidden = false;
  document.body.classList.add('snap-open');
  fit();
}

function close() {
  root.hidden = true;
  document.body.classList.remove('snap-open');
  if (hasShot) {
    reopenBtn.hidden = false;
    reopenBtn.style.backgroundImage = `url(${composite().toDataURL('image/png')})`;
  }
  shotBtn.focus();
}

function discard() {
  hasShot = false;
  strokes = []; undoStack = []; redoStack = [];
  reopenBtn.hidden = true;
  reopenBtn.style.backgroundImage = '';
  close();
}

function fit() {
  const sw = stage.clientWidth, sh = stage.clientHeight;
  const k = Math.min(sw / baseCv.width, sh / baseCv.height);
  sheet.style.width = `${Math.floor(baseCv.width * k)}px`;
  sheet.style.height = `${Math.floor(baseCv.height * k)}px`;
  resetZoom();
}

// ---------- Zoom and move ----------
function applyView() {
  // Keep the sheet on screen: centred when smaller than the stage, edges never pulled past the stage when bigger.
  const sw = stage.clientWidth, sh = stage.clientHeight;
  const w = sheet.offsetWidth * zoom, h = sheet.offsetHeight * zoom;
  const ox = sheet.offsetLeft, oy = sheet.offsetTop;
  panX = w <= sw ? (sw - w) / 2 - ox : Math.min(-ox, Math.max(sw - w - ox, panX));
  panY = h <= sh ? (sh - h) / 2 - oy : Math.min(-oy, Math.max(sh - h - oy, panY));
  sheet.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  root.querySelector('.snap-zoom-level').textContent = `${Math.round(zoom * 100)}%`;
  root.querySelector('[data-act="zoomOut"]').disabled = zoom <= MIN_ZOOM + 0.001;
  root.querySelector('[data-act="zoomIn"]').disabled = zoom >= MAX_ZOOM - 0.001;
  stage.classList.toggle('is-zoomed', zoom > 1.001);
}

// Zoom to `z`, keeping the point (x, y) of the stage under the same spot on the sheet.
function zoomTo(z, x, y) {
  z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  const ox = sheet.offsetLeft, oy = sheet.offsetTop;
  if (x === undefined) { x = stage.clientWidth / 2; y = stage.clientHeight / 2; }
  panX = (x - ox) - (x - ox - panX) * (z / zoom);
  panY = (y - oy) - (y - oy - panY) * (z / zoom);
  zoom = z;
  applyView();
}
function zoomBy(f) { zoomTo(zoom * f); }
function resetZoom() { zoom = 1; panX = 0; panY = 0; applyView(); }

function stagePoint(e) {
  const r = stage.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

function wheel(e) {
  e.preventDefault();
  const [x, y] = stagePoint(e);
  if (e.ctrlKey || e.metaKey) zoomTo(zoom * Math.exp(-e.deltaY * 0.01), x, y);  // trackpad pinch or Ctrl + wheel
  else { panX -= e.deltaX; panY -= e.deltaY; applyView(); }
}

// ---------- Tools ----------
function setTool(t) {
  tool = t;
  root.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.tool === t)));
  root.querySelector('.snap-colors').classList.toggle('is-off', t === 'eraser' || t === 'hand');
  stage?.classList.toggle('is-hand', t === 'hand');
}
function setColor(c) {
  color = c;
  root.querySelectorAll('[data-color]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.color === c)));
}

// ---------- Drawing ----------
function point(e) {
  const r = inkCv.getBoundingClientRect();
  return [(e.clientX - r.left) * (inkCv.width / r.width), (e.clientY - r.top) * (inkCv.height / r.height)];
}

function down(e) {
  if (e.button > 0) return;
  e.preventDefault();
  stage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, stagePoint(e));
  if (e.pointerType === 'pen') penSeen = true;

  if (pointers.size === 2) {
    // A second finger: this is a pinch. Drop the line the first finger had just started.
    if (gesture?.kind === 'draw') { strokes.pop(); undoStack.pop(); schedule(); }
    const [a, b] = [...pointers.values()];
    gesture = { kind: 'pinch', dist: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], zoom, panX, panY };
    drawing = null;
    return;
  }
  if (pointers.size > 2) return;

  const onSheet = e.target === inkCv;
  const moveOnly = tool === 'hand' || (e.pointerType === 'touch' && penSeen) || !onSheet;
  if (moveOnly) { gesture = { kind: 'pan', last: stagePoint(e) }; stage.classList.add('is-panning'); return; }

  const perPx = inkCv.width / inkCv.getBoundingClientRect().width;
  drawing = { tool, color, width: TOOLS[tool].width * perPx, pts: [point(e)], id: e.pointerId };
  gesture = { kind: 'draw' };
  undoStack.push(strokes.slice());
  redoStack = [];
  strokes.push(drawing);
  schedule();
}

function move(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, stagePoint(e));
  if (!gesture) return;

  if (gesture.kind === 'pinch' && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, gesture.zoom * dist / gesture.dist));
    const ox = sheet.offsetLeft, oy = sheet.offsetTop;
    // The spot under the fingers' midpoint at the start stays under their midpoint now.
    panX = (mid[0] - ox) - (gesture.mid[0] - ox - gesture.panX) * (z / gesture.zoom);
    panY = (mid[1] - oy) - (gesture.mid[1] - oy - gesture.panY) * (z / gesture.zoom);
    zoom = z;
    applyView();
  } else if (gesture.kind === 'pan') {
    const p = stagePoint(e);
    panX += p[0] - gesture.last[0]; panY += p[1] - gesture.last[1];
    gesture.last = p;
    applyView();
  } else if (gesture.kind === 'draw' && drawing && e.pointerId === drawing.id) {
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of evs.length ? evs : [e]) drawing.pts.push(point(ev));
    schedule();
  }
}

function up(e) {
  if (!pointers.delete(e.pointerId)) return;
  if (drawing && e.pointerId === drawing.id) { drawing = null; schedule(); }
  // After a pinch, wait until every finger is up before drawing again.
  if (pointers.size === 0) { gesture = null; stage.classList.remove('is-panning'); }
  else if (gesture?.kind === 'pan') gesture.last = [...pointers.values()][0];
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; paint(); });
}

function paint() {
  const ctx = inkCv.getContext('2d');
  ctx.clearRect(0, 0, inkCv.width, inkCv.height);
  for (const s of strokes) stroke(ctx, s);
}

function stroke(ctx, s) {
  const p = s.pts;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = s.width;
  ctx.globalAlpha = TOOLS[s.tool].alpha;
  ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : (s.tool === 'highlighter' ? 'multiply' : 'source-over');
  ctx.strokeStyle = ctx.fillStyle = s.tool === 'eraser' ? '#000' : s.color;
  if (p.length === 1) {
    ctx.beginPath(); ctx.arc(p[0][0], p[0][1], s.width / 2, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) {
      ctx.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
    }
    ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
    ctx.stroke();
  }
  ctx.restore();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(strokes);
  strokes = undoStack.pop();
  paint();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(strokes);
  strokes = redoStack.pop();
  paint();
}
function clear() {
  if (!strokes.length) return;
  undoStack.push(strokes);
  redoStack = [];
  strokes = [];
  paint();
}

// ---------- Saving ----------
function composite() {
  const out = document.createElement('canvas');
  out.width = baseCv.width; out.height = baseCv.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(baseCv, 0, 0);
  ctx.drawImage(inkCv, 0, 0);
  return out;
}

async function save() {
  const blob = await new Promise((res) => composite().toBlob(res, 'image/png'));
  if (!blob) return;
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ').replace(':', '.');
  const file = new File([blob], `Sight Reader ${stamp}.png`, { type: 'image/png' });
  // On the Claude preview page, saving goes through Claude (it asks the viewer first).
  if (window.claude?.use) {
    const downloads = await window.claude.use('downloads').catch(() => null);
    if (downloads) {
      try { await downloads.save({ filename: file.name, data: blob }); } catch { /* declined or unavailable */ }
      return;
    }
  }
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Sight Reader snapshot' });
      return;
    }
  } catch (err) {
    if (err?.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
