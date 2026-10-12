// Generates a real, crawlable HTML page per guide.
// The site works without this (guide.html?p=... renders client-side), but a
// search engine will not reliably index that. These pages are the front door.

import fs from 'node:fs';
import path from 'node:path';
import { buildGuideHTML } from './js/guide-html.js';

const ROOT = import.meta.dirname;
const SITE = process.env.SITE_URL || 'https://brianmcjoyal.github.io/flatpack';
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const index = read('data/index.json');
const outDir = path.join(ROOT, 'g');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Titles are written to match what people actually type into a search box.
const titleFor = p => `How to assemble a ${p.name.toLowerCase()} — plain-English steps | Flatpack`;
const descFor = (p, full) =>
  `${p.tagline} Step-by-step in plain English, a ${Math.round(full.steps.reduce((a, s) => a + s.secs, 0) / 60)}-minute ` +
  `walkthrough, the tools you actually need, and what to do when ${full.fixes[0].q.toLowerCase().replace(/\?$/, '')}.`;

function jsonld(p, full) {
  const howto = {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: `How to assemble a ${p.name.toLowerCase()}`,
    description: p.tagline,
    totalTime: `PT${p.minutes}M`,
    tool: full.tools.map(t => ({ '@type': 'HowToTool', name: t.n })),
    supply: full.provided.map(s => ({ '@type': 'HowToSupply', name: s })),
    step: full.steps.map((s, i) => ({
      '@type': 'HowToStep', position: i + 1, name: s.title,
      text: s.say, itemListElement: s.do.map(d => ({ '@type': 'HowToDirection', text: d })),
    })),
  };
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: full.fixes.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Flatpack', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: p.group, item: `${SITE}/#browse-sec` },
      { '@type': 'ListItem', position: 3, name: p.name, item: `${SITE}/g/${p.id}.html` },
    ],
  };
  return [howto, faq, crumbs]
    .map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
}

const shell = (p, full, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titleFor(p))}</title>
<meta name="description" content="${esc(descFor(p, full))}">
<link rel="canonical" href="${SITE}/g/${p.id}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(titleFor(p))}">
<meta property="og:description" content="${esc(p.tagline)}">
<meta property="og:url" content="${SITE}/g/${p.id}.html">
<meta property="og:site_name" content="Flatpack">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="../styles.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='26' font-size='26'>🪛</text></svg>">
${jsonld(p, full)}
</head>
<body>
<header class="top noprint">
  <div class="wrap">
    <a class="logo" href="../index.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M4 7h16M4 7v12h16V7M9 7V4h6v3M9 13h6"/></svg>
      Flatpack
    </a>
    <nav><a href="../index.html">New search</a><a href="../fixes.html">Something's wrong</a><a href="#written">Steps</a></nav>
  </div>
</header>
<main class="wrap" id="guide" data-pattern="${p.id}" data-base="../">${body}</main>
<footer class="wrap">
  <p>Where your manual and this guide disagree, your manual wins — it knows your exact model.
  Missing a part? Nearly every manufacturer ships replacement hardware free.</p>
  <p><a href="../index.html">← Look up something else</a> · <a href="../fixes.html">Troubleshooting index</a></p>
</footer>
<script type="module" src="../js/guide.js"></script>
</body>
</html>`;

let pages = 0, steps = 0, fixes = 0;
for (const p of index.patterns) {
  const full = read(`data/patterns/${p.id}.json`);
  const body = buildGuideHTML(full, p, index, null, '', p.id, '../');
  fs.writeFileSync(path.join(outDir, `${p.id}.html`), shell(p, full, body));
  pages++; steps += full.steps.length; fixes += full.fixes.length;
}

// "Something's gone wrong" — every troubleshooting question in one crawlable place.
// This is the page the symptom searches should land on.
const allFixes = index.patterns.flatMap(p => {
  const full = read(`data/patterns/${p.id}.json`);
  return full.fixes.map(f => ({ ...f, pid: p.id, pname: p.name, group: p.group }));
});
const groups = [...new Set(index.patterns.map(p => p.group))];
const fixesBody = groups.map(g => {
  const inGroup = allFixes.filter(f => f.group === g);
  return `<h3 style="margin:30px 0 10px;font-size:.8rem;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-faint)">${esc(g)}</h3>
  <div class="panel" style="padding-top:4px;padding-bottom:4px">
  ${inGroup.map(f => `<details class="fix"><summary>${esc(f.q)}</summary>
    <p>${esc(f.a)} <a href="g/${f.pid}.html">Full guide: ${esc(f.pname)} →</a></p></details>`).join('')}
  </div>`;
}).join('');

fs.writeFileSync(path.join(ROOT, 'fixes.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Furniture assembly problems, and how to fix them | Flatpack</title>
<meta name="description" content="${allFixes.length} real furniture assembly problems with plain-English fixes: cam locks that spin, drawers that will not close, crib bolts that will not line up, beds that squeak, gates that will not latch.">
<link rel="canonical" href="${SITE}/fixes.html">
<meta property="og:title" content="Furniture assembly problems, and how to fix them">
<meta property="og:description" content="${allFixes.length} things that go wrong during furniture assembly, and what to do about each one.">
<link rel="stylesheet" href="styles.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='26' font-size='26'>🪛</text></svg>">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: allFixes.map(f => ({ '@type': 'Question', name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a } })),
})}</script>
</head>
<body>
<header class="top noprint"><div class="wrap">
  <a class="logo" href="index.html">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 7h16M4 7v12h16V7M9 7V4h6v3M9 13h6"/></svg>Flatpack</a>
  <nav><a href="index.html">New search</a></nav>
</div></header>
<main class="wrap">
  <div class="hero" style="padding-bottom:0">
    <h1>Something's gone wrong</h1>
    <p class="lede">${allFixes.length} things that go wrong mid-build, and what to actually do about each one.</p>
  </div>
  <section>${fixesBody}</section>
  <section><p><a href="index.html">← Look up a specific item instead</a></p></section>
</main>
<footer class="wrap"><p>Where your manual and this guide disagree, your manual wins — it knows your exact model.</p></footer>
</body>
</html>`);

const urls = [`${SITE}/`, `${SITE}/fixes.html`,
  ...index.patterns.map(p => `${SITE}/g/${p.id}.html`)];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);

fs.writeFileSync(path.join(ROOT, 'robots.txt'),
`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`✓ ${pages} static guide pages in /g`);
console.log(`✓ fixes.html — ${allFixes.length} troubleshooting questions, all crawlable`);
console.log(`✓ sitemap.xml — ${urls.length} urls`);
console.log(`✓ robots.txt — indexing enabled, pointing at the sitemap`);
console.log(`  (${steps} steps, ${fixes} fixes rendered into static HTML)`);
