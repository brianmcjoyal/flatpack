# Flatpack

**Live: https://brianmcjoyal.github.io/flatpack/**

Plain-English furniture assembly guides with a three-minute animated walkthrough.
Type in whatever you bought — "Zinus Shalini queen bed", "6 drawer dresser",
"my drawer won't close" — and it works out which assembly pattern your item uses.

No build step, no dependencies. Plain HTML, CSS and JavaScript modules.

## Run it

```bash
node ~/Desktop/flatpack/serve.js
```

Then open http://localhost:4321

## Publishing a change

```bash
cd ~/Desktop/flatpack && node build.js && bash check.sh && git add -A && git commit -m "..." && git push
```

`build.js` regenerates the 31 static guide pages, `fixes.html` and `sitemap.xml`.
GitHub Pages redeploys automatically about a minute after the push.

**Always run `build.js` before committing.** The `/g/*.html` pages are generated
artifacts that are committed to the repo — if you edit a pattern and forget to
rebuild, the live site keeps serving the old version. `check.sh` runs the build
for you and will fail if the output is stale or wrong.

## Why there are two ways to view a guide

- `/g/<id>.html` — the real page. Static, crawlable, ~3,000 words in the HTML,
  with HowTo/FAQ structured data. This is what gets shared and indexed.
- `guide.html?q=<free text>` — the matcher. Takes anything typed, works out the
  pattern, and redirects to the canonical `/g/` page.

Both render identical markup because both call `buildGuideHTML()` in
`js/guide-html.js`, which is deliberately DOM-free so Node can run it too.

## The idea

There is no list of every item ever sold online, and nobody can write half a million
manuals. But all that furniture collapses into **31 assembly patterns**. A Zinus bed,
an Amazon Basics bed and a Novogratz bed are the same six moves. Every cam-lock
dresser — IKEA, Sauder, Ameriwood, South Shore — is the same twelve steps.

So instead of a manual per product, the site:

1. **matches** free text to a pattern (`js/match.js`),
2. layers on anything specific to that **brand's** hardware,
3. renders the written guide plus an **animated 3-minute walkthrough** built from the
   same step data (`js/diagrams.js`).

Type in a product nobody has ever heard of and it still works, because the hardware
underneath is the same.

## Layout

```
index.html          search + browse
guide.html          one assembly guide
styles.css          all styling, light and dark
serve.js            tiny local static server
_scenes.html        dev tool: contact sheet of every step diagram
js/match.js         free text -> pattern + brand
js/diagrams.js      95 step diagrams, drawn as SVG
js/app.js           home page
js/guide.js         guide page + the walkthrough player
data/index.json     pattern summaries, brands, glossary, product catalog
data/patterns/*.json  one file per pattern: the full guide
```

## Nursery guides are different

The ten guides in the `Nursery` group carry three extra fields, because this category is
safety-regulated and the failure mode is not a bad build — it is hardware loosening over time.

- `standard` — `{name, note}`. The ASTM / CFR standard that applies and what it means for the owner.
- `recall` — `true` renders a prompt to check the model at cpsc.gov/recalls before building.
- `recheck` — `[{when, what}]`. **The re-inspection schedule.** This is the one genuinely new thing
  here. Every nursery manual reviewed says to inspect "periodically" and none says how often or what
  to look at. CPSC's own testing found a crib fastener backed off half a turn has already lost its
  clamping force. The schedule closes that gap.

If you add a guide to the `Nursery` group, `check.sh` will fail unless it has a `recheck` schedule.

### What the research turned up

Worth knowing if you edit this content:

- **Mattress support is the #1 structural failure in cribs.** Loose support pins and broken support
  brackets account for repeated recalls across different manufacturers. Those four bolts sit under
  the mattress where nobody ever looks.
- **Mattress fit is the #1 recall cause overall** — undersized mattresses creating a side gap. No
  crib manual read for this project tells the owner to run a two-finger gap test. Ours does.
- **The barrel nut is the hardest step and gets one clause** in a real manual ("use the flat head
  screwdriver to hold the barrel nut in the proper alignment"). It is the step everyone gets stuck on,
  so here it is a full step with its own diagram.
- Sources: CPSC recall database, CPSC's crib fastener-loosening test methodology, 16 CFR 1219 /
  1218 / 1221 / 1231 / 1239 / 1261, ASTM F1169-25 (mandatory for full-size cribs since 1 Aug 2026),
  and a full Delta Children crib manual read end to end.

## Adding a new pattern

Everything is data. You do not need to touch any JavaScript to add a guide.

1. **Copy an existing pattern file** in `data/patterns/` and rename it, e.g.
   `vanity-desk.json`. Change the `id` to match the filename.
2. **Write the steps.** Each step needs:
   ```json
   {
     "title": "Short imperative title",
     "secs": 18,
     "scene": "bolt-hex",
     "say": "The narration. About 35 words reads comfortably in 18 seconds.",
     "do": ["bullet", "bullet", "bullet"],
     "tip": "optional",
     "watch": "optional warning"
   }
   ```
   Make the `secs` add up to **180**. That is what makes it a three-minute video.
3. **Pick a `scene` for each step** from the diagram library. Open
   http://localhost:4321/_scenes.html?page=0 to see all 95 with their names
   (six pages, `?page=0` to `?page=5`). Reuse freely — scenes are meant to be shared.
4. **Register it** in `data/index.json` under `patterns`, with `id`, `name`,
   `tagline`, `group`, `difficulty` (1-5), `minutes`, `people`, `covers`, and the
   matching keywords:
   - `strong` — phrases that clearly mean this pattern ("gaming chair")
   - `weak` — supporting hints ("recline", "lumbar pillow")
   Multi-word phrases score higher than single words, so prefer them.
5. Reload. Nothing to rebuild.

## Adding a brand

Add to `brands` in `data/index.json`:

```json
{
  "id": "brandname",
  "name": "Display Name",
  "aka": ["brandname", "common misspelling"],
  "system": "How their hardware works, in one or two sentences.",
  "tip": "The thing that catches people out with this brand.",
  "patterns": ["pattern-id-this-brand-usually-means"]
}
```

A brand with `"patterns": []` will show its note without routing to any guide —
that is how cribs are handled.

## Adding a new diagram scene

In `js/diagrams.js`, either add a variant to an existing routine (`D.chair`,
`D.panels`, `D.bed`, …) or write a new routine, then register the scene id in the
`SCENES` map at the bottom. Drawing helpers available: `rect`, `circle`, `line`,
`path`, `text`, `plate` (text with a backing plate), `arrow`, `dowel`, `cam`,
`bolt`, `hexKey`, `mallet`, `driver`, `tick`, `cross`, `ring`, `caption`.
Canvas is 640 × 400. Colours come from CSS variables so they follow light/dark mode.

Animation classes you can pass as `cls`: `sweep`, `pulse`, `spin`, `nudge`, `drop`,
`grow`, `blink`. All are disabled automatically for visitors who prefer reduced motion.

## Checking your work

```bash
bash ~/Desktop/flatpack/check.sh
```

One command. It verifies that all JSON parses, every JS file is valid, every pattern in
the index has a file (and vice versa), every catalog product and brand points at a real
pattern, every glossary term a guide references actually exists, every walkthrough is
exactly 180 seconds, every step's diagram scene is defined and renders, every pattern is
findable by its own name, the player's clock maths is right, spelling is consistent, and
there are no duplicate element IDs.

Run it after every edit. It catches the mistakes that are invisible until a user hits them
— a glossary term that silently vanishes, a step diagram that falls back to a placeholder,
a walkthrough that is 2:40 instead of 3:00.

## Deliberately not covered

Cribs and bassinets, exercise equipment, wall-mounted TV brackets, and outdoor
structures like gazebos and sheds. These are listed on the home page so the gap is
visible rather than hidden. Cribs in particular are safety-regulated — the site shows
the safety checks and points at the manufacturer's manual instead of improvising.
