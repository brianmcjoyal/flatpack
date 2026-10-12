import { matchQuery } from './match.js';
import { drawScene } from './diagrams.js';
import { advance, offsets } from './player-core.js';

const $ = s => document.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const params = new URLSearchParams(location.search);
const typed = params.get('q') || '';
const forced = params.get('p') || '';

async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}
function fail(err) {
  $('#guide').innerHTML = `<div class="warnbox" style="margin-top:60px">
    <h3>Could not load this guide</h3>
    <p>${esc(err.message)}. If you are running this locally, start the server with
    <code>node serve.js</code> and check the file exists.</p>
    <p><a href="index.html">← Back to search</a></p></div>`;
  console.error(err);
}

// Static pages from build.js arrive with their HTML already in place and a
// data-base pointing back at the site root. Everything else is identical.
const prerendered = $('#guide')?.dataset.pattern || '';
const BASE = $('#guide')?.dataset.base || '';

let index;
try { index = await loadJSON(BASE + 'data/index.json'); } catch (err) { fail(err); throw err; }

if (prerendered) {
  // The markup is already correct — just make it work.
  try {
    const pattern = await loadJSON(`${BASE}data/patterns/${prerendered}.json`);
    wire(pattern);
  } catch (err) { console.error(err); }
} else {

/* ---------- decide which pattern to show (client-side route only) ---------- */
let result = typed ? matchQuery(typed, index) : null;
let summary = forced ? index.patterns.find(p => p.id === forced) : (result && result.pattern);
if (forced && result && result.pattern && result.pattern.id !== forced) result = { ...result, pattern: summary, confidence: 'exact' };
if (!summary && result) summary = result.pattern;

if (!summary) {
  $('#guide').innerHTML = `
    <div class="guide-head">
      <div class="kicker">No match yet</div>
      <h1>We don't have a guide for ${esc(typed || 'that')}</h1>
      <p class="muted">Flatpack covers furniture that arrives flat-packed and needs assembling. Either this is
      something else, or it is one of the categories we have deliberately left out.</p>
    </div>
    ${result && result.brand ? brandNote(result.brand) : ''}
    <div class="note" style="margin-top:20px">
      <h3>Not covered yet</h3>
      <ul>${(index.meta.gaps || []).map(g => `<li>${esc(g)}</li>`).join('')}</ul>
    </div>
    <p style="margin-top:22px"><a href="index.html">← Try another search</a></p>`;
  document.title = 'No match — Flatpack';
} else {
  // A confident match has a canonical static page — send them there so the URL
  // they end up on (and might share) is the one search engines know about.
  if (result && (result.confidence === 'exact' || result.confidence === 'high')) {
    location.replace(`g/${summary.id}.html`);
  } else {
    try {
      const pattern = await loadJSON(`data/patterns/${summary.id}.json`);
      render(pattern, summary, result);
    } catch (err) { fail(err); }
  }
}
}

import { buildGuideHTML } from './guide-html.js';

function render(p, summary, res) {
  $('#guide').innerHTML = buildGuideHTML(p, summary, index, res, typed, forced, BASE);
  document.title = `${p.name} — Flatpack`;
  wire(p);
}

function wire(p) {
  const totalSecs = p.steps.reduce((n, s) => n + s.secs, 0);
  /* ---------- tool checklist persistence ---------- */
  const key = 'flatpack:' + p.id;
  const saved = JSON.parse(localStorage.getItem(key) || '[]');
  document.querySelectorAll('.check input').forEach((box, i) => {
    box.checked = saved.includes(i);
    box.onchange = () => {
      const on = [...document.querySelectorAll('.check input')].map((b, j) => b.checked ? j : -1).filter(j => j >= 0);
      localStorage.setItem(key, JSON.stringify(on));
    };
  });
  $('#printbtn').onclick = () => window.print();

  /* ---------- the 3-minute walkthrough ---------- */
  const stage = $('#stage'), badge = $('#badge'), scrub = $('#scrub');
  const ctitle = $('#ctitle'), csay = $('#csay'), timeEl = $('#time');
  const playBtn = $('#play'), playIcon = $('#playicon');
  const PLAY = '<path d="M8 5v14l12-7z"/>', PAUSE = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
  const SPEEDS = [1, 1.5, 0.75];

  let idx = -1, into = 0, playing = false, rate = 1, last = 0, raf = 0;
  const SECS = p.steps.map(s => s.secs);
  const starts = offsets(SECS);

  p.steps.forEach((s, i) => {
    const seg = el('div', null, '<i></i>');
    seg.style.flexGrow = s.secs;
    seg.title = s.title;
    seg.onclick = () => { show(i); into = 0; paint(); };
    scrub.append(seg);
  });
  const segs = [...scrub.children];

  let show = function (i) {
    if (i === idx) return;
    idx = Math.max(0, Math.min(p.steps.length - 1, i));
    const s = p.steps[idx];
    stage.querySelector('svg')?.remove();
    stage.insertAdjacentHTML('beforeend', drawScene(s.scene));
    badge.textContent = `Step ${idx + 1} of ${p.steps.length}`;
    ctitle.textContent = s.title;
    csay.textContent = s.say;
  }
  function paint() {
    segs.forEach((seg, i) => {
      seg.classList.toggle('done', i < idx);
      seg.firstChild.style.inset = i < idx ? '0'
        : i === idx ? `0 ${100 - (into / p.steps[idx].secs) * 100}% 0 0` : '0 100% 0 0';
    });
    timeEl.textContent = `${mmss(starts[idx] + into)} / ${mmss(totalSecs)}`;
  }
  function tick(now) {
    if (!playing) return;
    // clamp dt so returning to a backgrounded tab does not jump the playhead
    const dt = Math.min(0.5, (now - last) / 1000) * rate;
    last = now;
    const next = advance(SECS, idx, into, dt);
    if (next.idx !== idx) show(next.idx);
    into = next.into;
    if (next.ended) { pause(); paint(); return; }
    paint(); raf = requestAnimationFrame(tick);
  }
  let play = function () { playing = true; playIcon.innerHTML = PAUSE; playBtn.ariaLabel = 'Pause'; last = performance.now(); raf = requestAnimationFrame(tick); };
  let pause = function () { playing = false; playIcon.innerHTML = PLAY; playBtn.ariaLabel = 'Play'; cancelAnimationFrame(raf); };

  playBtn.onclick = () => {
    if (playing) return pause();
    if (idx === p.steps.length - 1 && into >= p.steps[idx].secs) { show(0); into = 0; }
    play();
  };
  $('#prev').onclick = () => { if (into < 1.2 && idx > 0) show(idx - 1); into = 0; paint(); };
  $('#next').onclick = () => { if (idx < p.steps.length - 1) { show(idx + 1); into = 0; paint(); } };
  $('#speed').onclick = e => {
    rate = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length];
    e.target.textContent = rate + '×';
  };
  document.querySelectorAll('[data-jump]').forEach(b => b.onclick = () => {
    show(+b.dataset.jump); into = 0; paint(); pause();
    document.querySelector('.player').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.addEventListener('keydown', e => {
    // a focused button already handles space and enter itself — don't fire twice
    if (/input|textarea|button|select|a/i.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); playBtn.click(); }
    if (e.key === 'ArrowRight') $('#next').click();
    if (e.key === 'ArrowLeft') $('#prev').click();
  });

  /* ---------- you are on a floor, with a screwdriver, and you will be interrupted ---------- */

  // Come back to the step you were on, not back to step 1.
  const posKey = 'flatpack:pos:' + p.id;
  const savedStep = +(localStorage.getItem(posKey) || 0);
  let resumeNote = null;
  if (savedStep > 0 && savedStep < p.steps.length) {
    resumeNote = el('button', 'chip');
    resumeNote.style.cssText = 'margin:0 18px 14px;display:block';
    resumeNote.textContent = `↩ Pick up where you left off — step ${savedStep + 1}`;
    resumeNote.onclick = () => { show(savedStep); into = 0; paint(); resumeNote.remove(); };
    $('.player').insertBefore(resumeNote, $('.controls'));
  }
  const rememberPosition = () => {
    if (idx > 0) localStorage.setItem(posKey, String(idx));
    else localStorage.removeItem(posKey);
  };

  // Phones sleep after 30 seconds. That is useless when both hands are busy.
  let wakeLock = null;
  const keepAwake = async on => {
    try {
      if (on && !wakeLock && 'wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch { /* unsupported or denied — not worth bothering anyone about */ }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && playing) keepAwake(true);
  });

  const _play = play, _pause = pause;
  play = () => { _play(); keepAwake(true); };
  pause = () => { _pause(); keepAwake(false); rememberPosition(); };
  const _show = show;
  show = i => { _show(i); rememberPosition(); };

  show(0); paint();
}
