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

let index;
try { index = await loadJSON('data/index.json'); } catch (err) { fail(err); throw err; }

/* ---------- decide which pattern to show ---------- */
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
  try {
    const pattern = await loadJSON(`data/patterns/${summary.id}.json`);
    render(pattern, summary, result);
  } catch (err) { fail(err); }
}

function standardNote(s) {
  if (!s) return '';
  return `<div class="panel" style="margin-top:20px;border-left:4px solid var(--accent)">
    <h3 style="margin-bottom:6px">Safety standard: ${esc(s.name)}</h3>
    <p style="margin:0">${esc(s.note)}</p>
  </div>`;
}

function recallNote(on) {
  if (!on) return '';
  return `<div class="warnbox" style="margin-top:20px">
    <h3>Check this model for a recall first</h3>
    <p style="margin:6px 0 0">Nursery products are recalled more often than any other furniture category, and a
    recall can be issued years after a product ships. Find the model number on the product label, then search it at
    <a href="https://www.cpsc.gov/Recalls" target="_blank" rel="noopener">cpsc.gov/recalls</a>.
    Register the product with the manufacturer too — that registration is the only way they can reach you later.
    This matters most for anything bought second-hand or handed down.</p>
  </div>`;
}

function recheckSection(items) {
  if (!items || !items.length) return '';
  return `<section id="keep-checking">
    <div class="sec-head"><h2>Keep checking it</h2><span class="faint">${items.length} checks</span></div>
    <div class="panel" style="margin-top:12px">
      <p style="margin-top:0" class="muted">Manuals tell you to inspect "periodically" and never say how often or
      what to look at. This is that missing schedule. Fasteners lose their grip gradually — CPSC testing found a crib
      bolt backed off half a turn has already lost its clamping force — so the checks matter more than the build.</p>
      <dl class="terms" style="margin-top:16px">
        ${items.map(r => `<dt>${esc(r.when)}</dt><dd>${esc(r.what)}</dd>`).join('')}
      </dl>
    </div>
  </section>`;
}

function brandNote(b) {
  return `<div class="note" style="margin-top:20px">
    <h3 style="margin-bottom:6px">${esc(b.name)}</h3>
    <p style="margin:0 0 8px"><b>How their hardware works.</b> ${esc(b.system)}</p>
    <p style="margin:0"><b>Worth knowing.</b> ${esc(b.tip)}</p>
  </div>`;
}

function render(p, summary, res) {
  const totalSecs = p.steps.reduce((n, s) => n + s.secs, 0);
  document.title = `${p.name} — Flatpack`;

  const lowConf = res && (res.confidence === 'low' || res.confidence === 'medium') && !forced;
  const head = `
    <div class="guide-head">
      ${typed ? `<div class="kicker">You said: ${esc(typed)}</div>` : '<div class="kicker">Assembly guide</div>'}
      <h1>${esc(p.name)}</h1>
      <p class="muted" style="font-size:1.1rem">${esc(p.tagline)}</p>
      <div class="statrow">
        <div class="stat"><b>Time</b>${p.minutes} minutes</div>
        <div class="stat"><b>People</b>${p.people === 1 ? 'One is fine' : p.people + ' needed'}</div>
        <div class="stat"><b>Difficulty</b>${'●'.repeat(p.difficulty)}${'○'.repeat(5 - p.difficulty)}</div>
        <div class="stat"><b>Walkthrough</b>${mmss(totalSecs)} video</div>
        ${p.recheck ? `<div class="stat"><b>Then</b>re-check it <a href="#keep-checking">on a schedule</a></div>` : ''}
      </div>
    </div>`;

  const confBanner = lowConf ? `
    <div class="warnbox" style="margin-top:20px">
      <h3>We took our best guess</h3>
      <p style="margin:6px 0 0">“${esc(typed)}” could be a few things. This is the closest match. Try: ${(res.alts.length ? res.alts : (summary.related || []).map(id => {
          const n = index.patterns.find(x => x.id === id); return n && { id, name: n.name };
        }).filter(Boolean)).slice(0, 3).map(a =>
        `<a href="guide.html?p=${a.id}">${esc(a.name)}</a>`).join(' · ')}</p>
    </div>` : '';

  // alternatives the matcher found, then this pattern's neighbors, deduped
  const seen = new Set([summary.id]);
  const others = [];
  for (const a of (res && res.alts) || []) if (!seen.has(a.id)) { seen.add(a.id); others.push(a); }
  for (const id of summary.related || []) {
    if (seen.has(id)) continue;
    const n = index.patterns.find(x => x.id === id);
    if (n) { seen.add(id); others.push({ id, name: n.name }); }
  }
  const altLine = (!lowConf && others.length) ? `
    <p class="faint" style="margin-top:14px">Not what you bought? Try
      ${others.slice(0, 3).map(a => `<a href="guide.html?p=${a.id}">${esc(a.name)}</a>`).join(' · ')}</p>` : '';

  const player = `
    <div class="player noprint">
      <div class="stage" id="stage"><div class="badge" id="badge"></div></div>
      <div class="caption">
        <div class="ctitle" id="ctitle"></div>
        <div class="csay" id="csay"></div>
      </div>
      <div class="scrub" id="scrub"></div>
      <div class="controls">
        <button class="iconbtn" id="prev" title="Previous step (←)" aria-label="Previous step">
          <svg viewBox="0 0 24 24"><path d="M18 5v14l-11-7zM6 5h2v14H6z"/></svg></button>
        <button class="iconbtn primary" id="play" title="Play or pause (space)" aria-label="Play">
          <svg viewBox="0 0 24 24" id="playicon"><path d="M8 5v14l12-7z"/></svg></button>
        <button class="iconbtn" id="next" title="Next step (→)" aria-label="Next step">
          <svg viewBox="0 0 24 24"><path d="M6 5v14l11-7zM16 5h2v14h-2z"/></svg></button>
        <button class="speed" id="speed">1×</button>
        <span class="time" id="time"></span>
      </div>
    </div>`;

  const tools = `
    <section>
      <div class="sec-head"><h2>What you need</h2>
        <button class="btn ghost small noprint" id="printbtn">Print the steps</button></div>
      <div class="panel">
        ${p.tools.map((t, i) => `
          <div class="check${t.req ? ' req' : ''}">
            <input type="checkbox" id="tool${i}">
            <label for="tool${i}"><span>${esc(t.n)}</span><span class="why">${esc(t.why)}</span></label>
          </div>`).join('')}
        <p class="faint" style="margin:14px 0 0"><b>In the box already:</b> ${p.provided.map(esc).join(' · ')}</p>
      </div>
    </section>`;

  const before = `
    <section>
      <h2>Before you open anything</h2>
      <div class="panel" style="margin-top:12px">
        <ul style="margin:0;padding-left:20px">${p.before.map(b => `<li style="margin:7px 0">${esc(b)}</li>`).join('')}</ul>
      </div>
    </section>`;

  const safety = `
    <section>
      <div class="warnbox">
        <h3>Please don't skip these</h3>
        <ul style="margin:8px 0 0;padding-left:20px">${p.safety.map(s => `<li style="margin:6px 0">${esc(s)}</li>`).join('')}</ul>
      </div>
    </section>`;

  const steps = `
    <section id="written">
      <div class="sec-head"><h2>The whole thing, step by step</h2>
        <span class="faint">${p.steps.length} steps</span></div>
      <ol class="steps">
        ${p.steps.map((s, i) => `
          <li id="step${i}">
            <h3>${esc(s.title)}</h3>
            <p class="muted" style="margin:2px 0 0">${esc(s.say)}</p>
            <ul>${s.do.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
            ${s.tip ? `<div class="tip"><b>Tip.</b> ${esc(s.tip)}</div>` : ''}
            ${s.watch ? `<div class="watch"><b>Watch out.</b> ${esc(s.watch)}</div>` : ''}
            <button class="chip noprint" style="margin-top:12px" data-jump="${i}">▶ Watch this step</button>
          </li>`).join('')}
      </ol>
    </section>`;

  const fixes = `
    <section>
      <h2>If something has gone wrong</h2>
      <div class="panel" style="margin-top:12px;padding-top:4px;padding-bottom:4px">
        ${p.fixes.map(f => `<details class="fix"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
      </div>
    </section>`;

  const termList = (p.terms || []).filter(t => index.terms[t]);
  const glossary = termList.length ? `
    <section>
      <h2>Words you will see in the manual</h2>
      <div class="panel" style="margin-top:12px">
        <dl class="terms">${termList.map(t =>
          `<dt>${esc(t.replace(/-/g, ' '))}</dt><dd>${esc(index.terms[t])}</dd>`).join('')}</dl>
      </div>
    </section>` : '';

  const alsoFor = `
    <section class="noprint">
      <h2>This same guide covers</h2>
      <div class="pills" style="margin-top:12px">${p.covers.map(c => `<span class="pill">${esc(c)}</span>`).join('')}</div>
      <p style="margin-top:22px"><a href="index.html">← Look up something else</a></p>
    </section>`;

  $('#guide').innerHTML = head + confBanner + recallNote(p.recall) + standardNote(p.standard) +
    (res && res.brand ? brandNote(res.brand) : '') + altLine +
    player + tools + before + safety + steps + recheckSection(p.recheck) + fixes + glossary + alsoFor;

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

  function show(i) {
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
  function play() { playing = true; playIcon.innerHTML = PAUSE; playBtn.ariaLabel = 'Pause'; last = performance.now(); raf = requestAnimationFrame(tick); }
  function pause() { playing = false; playIcon.innerHTML = PLAY; playBtn.ariaLabel = 'Play'; cancelAnimationFrame(raf); }

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

  show(0); paint();
}
