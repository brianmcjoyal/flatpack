#!/bin/bash
# Flatpack self-check. Run after any edit: bash check.sh
cd "$(dirname "$0")"
fail=0
say() { printf '%s\n' "$1"; }

for f in data/patterns/*.json data/index.json; do
  python3 -c "import json;json.load(open('$f'))" 2>/dev/null || { say "✗ invalid JSON: $f"; fail=1; }
done
[ $fail -eq 0 ] && say "✓ all JSON valid"

for f in js/*.js; do
  node --input-type=module --check < "$f" >/dev/null 2>&1 || { say "✗ syntax error: $f"; node --input-type=module --check < "$f" 2>&1 | head -3; fail=1; }
done
[ $fail -eq 0 ] && say "✓ all modules parse"

python3 - <<'PY' || fail=1
import json, glob, os, re, sys
ix = json.load(open('data/index.json'))
files = {os.path.basename(f)[:-5]: json.load(open(f)) for f in glob.glob('data/patterns/*.json')}
ids = {p['id'] for p in ix['patterns']}
bad = []
bad += [f"index lists '{p}' with no file" for p in ids - set(files)]
bad += [f"file '{p}.json' not in index" for p in set(files) - ids]
bad += [f"{n}: id '{d['id']}' != filename" for n, d in files.items() if d['id'] != n]
bad += [f"catalog '{c['label']}' -> unknown pattern" for c in ix['catalog'] if c['pattern'] not in ids]
bad += [f"brand '{b['id']}' -> unknown pattern '{p}'" for b in ix['brands'] for p in b.get('patterns', []) if p not in ids]
bad += [f"{p['id']}: related -> unknown '{r}'" for p in ix['patterns'] for r in p.get('related', []) if r not in ids]
REQ = ['id','name','tagline','covers','difficulty','minutes','people','tools','provided','before','safety','steps','fixes']
LISTS = ['covers','tools','provided','before','safety','steps','fixes']
for n, d in files.items():
    for k in REQ:
        if k not in d: bad.append(f"{n}: missing '{k}' (the guide page dereferences it)")
        elif k in LISTS and (not isinstance(d[k], list) or not d[k]): bad.append(f"{n}: '{k}' empty or not a list")
    for i, s in enumerate(d.get('steps', [])):
        for k in ('title','secs','scene','say','do'):
            if k not in s: bad.append(f"{n} step {i+1}: missing '{k}'")
    for i, t in enumerate(d.get('tools', [])):
        if 'n' not in t or 'why' not in t: bad.append(f"{n} tool {i+1}: missing n/why")
    for i, x in enumerate(d.get('fixes', [])):
        if 'q' not in x or 'a' not in x: bad.append(f"{n} fix {i+1}: missing q/a")
bad += [f"{n}: glossary term '{t}' missing" for n, d in files.items() for t in d.get('terms', []) if t not in ix['terms']]
for n, d in files.items():
    for i, r in enumerate(d.get('recheck', [])):
        if not r.get('when') or not r.get('what'): bad.append(f"{n}: recheck[{i}] missing when/what")
    st = d.get('standard')
    if st is not None and (not st.get('name') or not st.get('note')): bad.append(f"{n}: standard missing name/note")
    if d.get('recall') not in (None, True, False): bad.append(f"{n}: recall must be true/false")
nursery = [p for p in ix['patterns'] if p.get('group') == 'Nursery']
for p in nursery:
    d = files.get(p['id'])
    if d and 'recheck' not in d: bad.append(f"{p['id']}: nursery guide with no re-check schedule")
bad += [f"{n}: walkthrough is {sum(s['secs'] for s in d['steps'])}s, must be 180" for n, d in files.items()
        if sum(s['secs'] for s in d['steps']) != 180]
for p in ix['patterns']:
    d = files.get(p['id'])
    if d:
        bad += [f"{p['id']}: index {k}={p[k]} but file says {d[k]}" for k in ('name','difficulty','minutes','people') if p[k] != d[k]]
src = open('js/diagrams.js').read()
have = set(re.findall(r"'([a-z0-9-]+)':\s*\[", src.split('const SCENES = {')[1].split('\n};')[0]))
bad += [f"step uses undefined scene '{s}'" for n, d in files.items() for st in d['steps'] if (s := st['scene']) not in have]
for x in bad: print('✗', x)
print(f"✓ {len(ids)} patterns, {len(ix['catalog'])} products, {len(ix['brands'])} brands, "
      f"{len(ix['terms'])} glossary terms, {sum(len(d['steps']) for d in files.values())} steps — all consistent" if not bad else "")
sys.exit(1 if bad else 0)
PY

node --input-type=module -e "
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('data/index.json','utf8'));
const d = await import('./js/diagrams.js');
const { matchQuery } = await import('./js/match.js');
let bad = [];
for (const p of data.patterns) {
  const r = matchQuery(p.name, data);
  if (r.pattern?.id !== p.id) bad.push('pattern not reachable by its own name: ' + p.id);
}
for (const c of data.catalog) {
  const r = matchQuery(c.label, data);
  if (r.pattern?.id !== c.pattern) bad.push('catalog misroute: ' + c.label);
}
for (const f of fs.readdirSync('data/patterns')) {
  const p = JSON.parse(fs.readFileSync('data/patterns/' + f, 'utf8'));
  for (const s of p.steps) if (d.drawScene(s.scene).length < 300) bad.push('thin diagram: ' + s.scene);
}
if (matchQuery('blender', data).pattern) bad.push('nonsense produced a match');
bad.forEach(b => console.log('✗', b));
if (bad.length) process.exit(1);
console.log('✓ every pattern reachable, every product routes, every diagram renders');
" || fail=1

node --input-type=module -e "
const { advance, offsets } = await import('./js/player-core.js');
const S=[10,20,15,25]; let fail=[];
const eq=(n,g,w)=>{if(JSON.stringify(g)!==JSON.stringify(w))fail.push(n)};
eq('offsets',offsets(S),[0,10,30,45,70]);
eq('inside step',advance(S,0,0,3),{idx:0,into:3,ended:false});
eq('exact boundary',advance(S,0,0,10),{idx:1,into:0,ended:false});
eq('cross boundary',advance(S,0,8,5),{idx:1,into:3,ended:false});
eq('skip two',advance(S,0,0,35),{idx:2,into:5,ended:false});
eq('end clamp',advance(S,3,20,99),{idx:3,into:25,ended:true});
eq('zero dt',advance(S,2,7,0),{idx:2,into:7,ended:false});
let idx=0,into=0,visited=[0],ended=false,g=0;
while(!ended&&g++<100000){const r=advance(S,idx,into,1/60);if(r.idx!==idx)visited.push(r.idx);idx=r.idx;into=r.into;ended=r.ended;}
if(visited.join()!=='0,1,2,3')fail.push('playthrough order');
if(Math.abs(offsets(S)[idx]+into-70)>0.001)fail.push('clock drift');
fail.forEach(f=>console.log('✗ player:',f));
if(fail.length)process.exit(1);
console.log('✓ player clock: boundaries, skips, end-clamp and full playthrough all correct');
" || fail=1

node build.js >/dev/null 2>&1 || { say "✗ build.js failed"; fail=1; }
python3 - <<'PYEOF' || fail=1
import json, glob, os, re, sys
ix = json.load(open('data/index.json'))
bad = []
for p in ix['patterns']:
    f = f"g/{p['id']}.html"
    if not os.path.exists(f): bad.append(f"missing static page {f}"); continue
    html = open(f).read()
    if p['name'] not in html: bad.append(f"{f}: name not in static HTML")
    if 'application/ld+json' not in html: bad.append(f"{f}: no structured data")
    if 'data-pattern=' not in html: bad.append(f"{f}: no hydration marker")
    if 'guide.html?p=' in html: bad.append(f"{f}: links to the non-canonical URL")
    words = len(re.sub(r'<[^>]+>', ' ', re.sub(r'<script[\s\S]*?</script>', '', html)).split())
    if words < 800: bad.append(f"{f}: only {words} words of crawlable content")
for f in ('sitemap.xml', 'robots.txt', 'fixes.html'):
    if not os.path.exists(f): bad.append(f"missing {f}")
if 'Disallow: /' in open('robots.txt').read(): bad.append("robots.txt still blocks indexing")
n = open('sitemap.xml').read().count('<loc>')
if n != len(ix['patterns']) + 2: bad.append(f"sitemap has {n} urls, expected {len(ix['patterns'])+2}")
for x in bad: print('✗', x)
print(f"\u2713 {len(ix['patterns'])} static pages, structured data, sitemap and robots all good" if not bad else "")
sys.exit(1 if bad else 0)
PYEOF

grep -roiE '\b(centre|aluminium|colour|neighbour|labelling|levelling|initialisation|spanner)[a-z]*' data js *.html 2>/dev/null \
  && { say "✗ British spelling found above"; fail=1; } || say "✓ US spelling consistent"

python3 -c "
import re,sys
d=[]
for f in ['index.html','guide.html']:
    ids=re.findall(r'\sid=\"([^\"]+)\"',open(f).read())
    d+= [f+': '+i for i in set(ids) if ids.count(i)>1]
[print('✗ duplicate id:',x) for x in d]; sys.exit(1 if d else 0)" && say "✓ no duplicate element IDs" || fail=1

[ $fail -eq 0 ] && say "" && say "ALL CHECKS PASSED" || { say ""; say "SOME CHECKS FAILED"; exit 1; }
