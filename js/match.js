// Flatpack — turns free text ("zinus queen bed frame") into an assembly pattern.
// The whole point: there is no list of every product ever sold, but there are
// only about twenty ways furniture actually goes together.

const IRREGULAR = {
  shelves: 'shelf', boxes: 'box', benches: 'bench', dresses: 'dress',
  chairs: 'chair', tables: 'table', legs: 'leg', drawers: 'drawer',
  shelfs: 'shelf', cubbies: 'cubby', casters: 'caster',
};

function stem(t) {
  if (IRREGULAR[t]) return IRREGULAR[t];
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') && !t.endsWith('us')) return t.slice(0, -1);
  return t;
}

export function tokens(s) {
  return String(s || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim().split(' ')
    .filter(Boolean)
    .map(stem);
}

// does the token sequence `needle` appear contiguously inside `hay`?
function has(hay, needle) {
  if (!needle.length || needle.length > hay.length) return false;
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

const SIZE_WORDS = new Set(['twin', 'full', 'queen', 'king', 'cal', 'california', 'single',
  'double', 'inch', 'in', 'cm', 'ft', 'piece', 'pc', 'set', 'tier', 'drawer', 'door', 'x']);

export function matchQuery(query, data) {
  const q = tokens(query);
  if (!q.length) return null;
  const meaningful = q.filter(t => !SIZE_WORDS.has(t) && !/^\d+$/.test(t));

  // brand first — it tells us the hardware system even when the item is vague
  let brand = null;
  for (const b of data.brands) {
    for (const a of b.aka) if (has(q, tokens(a))) { brand = b; break; }
    if (brand) break;
  }

  // a catalog entry is a direct hit: someone typed a product we already mapped
  let catalogHit = null, bestOverlap = 0;
  for (const c of data.catalog) {
    const ct = tokens(c.label);
    const ctm = ct.filter(t => !SIZE_WORDS.has(t) && !/^\d+$/.test(t));
    const overlap = meaningful.filter(t => ct.includes(t)).length;
    const covered = overlap / Math.max(1, meaningful.length);
    // must cover most of what the user typed AND most of the product name,
    // so "bed frame" cannot claim to be a specific Zinus model
    if (overlap >= 2 && covered >= 0.6 && overlap >= ctm.length * 0.5 && overlap > bestOverlap) {
      bestOverlap = overlap; catalogHit = c;
    }
  }

  const scores = data.patterns.map(p => {
    let s = 0; const why = [];
    const score = (list, base, per) => {
      for (const phrase of list || []) {
        const pt = tokens(phrase);
        if (has(q, pt)) { s += base + per * (pt.length - 1); if (pt.length > 1 || base >= 8) why.push(phrase); }
      }
    };
    score(p.strong, 10, 6);
    score(p.covers, 8, 5);
    score(p.weak, 3, 2);
    score([p.name], 6, 4);
    if (brand && (brand.patterns || []).includes(p.id)) { s += 7; why.push(brand.name); }
    if (catalogHit && catalogHit.pattern === p.id) { s += 30; why.push(catalogHit.label); }
    return { pattern: p, score: s, why: [...new Set(why)] };
  }).sort((a, b) => b.score - a.score);

  const best = scores[0], second = scores[1];
  if (!best || best.score === 0) return { pattern: null, brand, query, alts: [], confidence: 'none' };

  const confidence =
    best.score >= 30 ? 'exact' :
    (best.score >= 14 && best.score >= (second?.score || 0) * 1.5) ? 'high' :
    best.score >= 8 ? 'medium' : 'low';

  return {
    query, brand, confidence,
    pattern: best.pattern,
    score: best.score,
    why: best.why,
    catalogLabel: catalogHit && catalogHit.pattern === best.pattern.id ? catalogHit.label : null,
    alts: scores.slice(1).filter(x => x.score >= Math.max(4, best.score * 0.3)).slice(0, 3)
      .map(x => ({ id: x.pattern.id, name: x.pattern.name })),
  };
}

// typeahead over catalog products, pattern names, and the things each pattern covers
export function suggest(query, data, limit = 7) {
  const q = tokens(query);
  if (!q.length) return [];
  const raw = String(query).toLowerCase().trim();
  const out = [];
  const seen = new Set();
  const push = (label, sub, href, rank) => {
    const k = label.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k); out.push({ label, sub, href, rank });
  };

  for (const c of data.catalog) {
    const lt = tokens(c.label);
    const starts = c.label.toLowerCase().startsWith(raw);
    if (starts || q.every(t => lt.some(x => x.startsWith(t)))) {
      const p = data.patterns.find(x => x.id === c.pattern);
      push(c.label, p ? p.name : '', `guide.html?p=${c.pattern}&q=${encodeURIComponent(c.label)}`, starts ? 0 : 1);
    }
  }
  for (const p of data.patterns) {
    const nt = tokens(p.name);
    if (q.every(t => nt.some(x => x.startsWith(t)))) push(p.name, p.tagline, `guide.html?p=${p.id}`, 2);
    for (const cv of p.covers) {
      const ct = tokens(cv);
      if (q.every(t => ct.some(x => x.startsWith(t))))
        push(cv.replace(/^\w/, c => c.toUpperCase()), p.name, `guide.html?p=${p.id}&q=${encodeURIComponent(cv)}`, 3);
    }
  }
  return out.sort((a, b) => a.rank - b.rank || a.label.length - b.label.length).slice(0, limit);
}
