import { suggest } from './match.js';

const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const go = q => { location.href = 'guide.html?q=' + encodeURIComponent(q); };
// (guide.html runs the matcher, then hands off to the canonical /g/ page)

let data;
try {
  const res = await fetch('data/index.json');
  if (!res.ok) throw new Error(`data/index.json returned ${res.status}`);
  data = await res.json();
} catch (err) {
  document.querySelector('main').innerHTML =
    `<div class="warnbox" style="margin-top:60px"><h3>Could not load the guide data</h3>
     <p>${String(err.message)}. If you are running this locally, make sure the server is started
     with <code>node serve.js</code> and that <code>data/index.json</code> exists.</p></div>`;
  throw err;
}

/* ---------------- search box with typeahead ---------------- */
const input = $('#q'), sug = $('#suggest'), form = $('#searchform');
let active = -1, items = [];

function renderSuggest() {
  sug.innerHTML = '';
  items.forEach((s, i) => {
    const b = el('button', null, `${esc(s.label)}<span class="s-sub">${esc(s.sub || '')}</span>`);
    b.type = 'button';
    b.setAttribute('role', 'option');
    b.setAttribute('aria-selected', i === active);
    b.onclick = () => { location.href = s.href; };
    sug.append(b);
  });
}
input.addEventListener('input', () => {
  items = input.value.trim().length >= 2 ? suggest(input.value, data) : [];
  active = -1; renderSuggest();
});
input.addEventListener('keydown', e => {
  if (!items.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    // cycle through the items plus one "nothing selected" slot, which is index -1
    const slots = items.length + 1;
    const step = e.key === 'ArrowDown' ? 1 : -1;
    active = ((active + 1 + step) % slots + slots) % slots - 1;
    renderSuggest();
  } else if (e.key === 'Enter' && active >= 0) {
    e.preventDefault(); location.href = items[active].href;
  } else if (e.key === 'Escape') { items = []; renderSuggest(); }
});
document.addEventListener('click', e => { if (!sug.contains(e.target) && e.target !== input) { items = []; renderSuggest(); } });
form.addEventListener('submit', e => { e.preventDefault(); if (input.value.trim()) go(input.value.trim()); });

document.querySelectorAll('.chip[data-q]').forEach(c => c.onclick = () => go(c.dataset.q));

/* ---------------- popular items ---------------- */
const POPULAR = [
  'Zinus Shalini upholstered platform bed', 'IKEA MALM dresser', 'Hbada ergonomic office chair',
  'GTRACING gaming chair', 'Walker Edison 70-inch TV stand', 'FlexiSpot E7 standing desk',
  'Zinus SmartBase metal bed frame', '9-cube fabric storage organizer', 'Bestier L-shaped gaming desk',
  'LUCID 10-inch memory foam mattress', 'Amazon Basics 5-shelf wire shelving', 'Novogratz Brittany futon',
];
const popWrap = $('#popular');
POPULAR.forEach(label => {
  const c = data.catalog.find(x => x.label === label);
  if (!c) return;
  const p = data.patterns.find(x => x.id === c.pattern);
  const a = el('a', 'card');
  a.href = `g/${c.pattern}.html`;
  a.innerHTML = `<span class="t">${esc(c.label)}</span><span class="s">${esc(p.name)}</span>
    <span class="meta"><span>${p.minutes} min</span><span>${'●'.repeat(p.difficulty)}${'○'.repeat(5 - p.difficulty)}</span></span>`;
  popWrap.append(a);
});

/* ---------------- nursery ---------------- */
const nurseryWrap = document.querySelector('#nursery');
data.patterns.filter(p => p.group === 'Nursery').forEach(p => {
  const a = el('a', 'card');
  a.href = `g/${p.id}.html`;
  a.innerHTML = `<span class="t">${esc(p.name)}</span><span class="s">${esc(p.tagline)}</span>
    <span class="meta"><span>${p.minutes} min</span><span>${p.people === 1 ? '1 person' : p.people + ' people'}</span>
    <span>${'●'.repeat(p.difficulty)}${'○'.repeat(5 - p.difficulty)}</span></span>`;
  nurseryWrap.append(a);
});

/* ---------------- browse by room ---------------- */
const groups = [...new Set(data.patterns.map(p => p.group))];
const browse = $('#browse');
groups.forEach(g => {
  const h = el('h3', 'faint');
  h.textContent = g;
  h.style.cssText = 'margin:26px 0 10px;font-size:.8rem;letter-spacing:.09em;text-transform:uppercase';
  browse.append(h);
  const grid = el('div', 'grid');
  data.patterns.filter(p => p.group === g).forEach(p => {
    const a = el('a', 'card');
    a.href = `g/${p.id}.html`;
    a.innerHTML = `<span class="t">${esc(p.name)}</span><span class="s">${esc(p.tagline)}</span>
      <span class="meta"><span>${p.minutes} min</span><span>${p.people === 1 ? '1 person' : p.people + ' people'}</span>
      <span>${'●'.repeat(p.difficulty)}${'○'.repeat(5 - p.difficulty)}</span></span>`;
    grid.append(a);
  });
  browse.append(grid);
});

/* ---------------- coverage + gaps ---------------- */
$('#covers-list').innerHTML = data.patterns
  .flatMap(p => p.covers).sort((a, b) => a.localeCompare(b))
  .map(c => `<span class="pill">${esc(c)}</span>`).join('');
$('#gaps').innerHTML = (data.meta.gaps || []).map(g => `<li>${esc(g)}</li>`).join('');
document.querySelectorAll('#stat-patterns, #stat-patterns-2')
  .forEach(n => n.textContent = data.patterns.length);
$('#stat-covers').textContent = data.patterns.reduce((n, p) => n + p.covers.length, 0);
$('#stat-brands').textContent = data.brands.length;
