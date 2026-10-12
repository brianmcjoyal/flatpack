// Flatpack — step diagram engine.
// Every step in a pattern names a `scene`. Each scene maps to one drawing
// routine plus a variant, so ~20 routines cover ~100 steps.

const W = 640, H = 400;
const INK = 'var(--ink)', SOFT = 'var(--ink-soft)', FAINT = 'var(--ink-faint)',
      LINE = 'var(--line-strong)', WOOD = 'var(--wood)', WOODD = 'var(--wood-dark)',
      MET = 'var(--metal)', METD = 'var(--metal-dark)', ACC = 'var(--accent)',
      RAISED = 'var(--bg-raised)', SUNK = 'var(--bg-sunk)',
      ONWOOD = '#3f3123';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function rect(x, y, w, h, o = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 3}"
    fill="${o.fill ?? WOOD}" stroke="${o.stroke ?? WOODD}" stroke-width="${o.sw ?? 2}"
    ${o.cls ? `class="${o.cls}"` : ''} ${o.op ? `opacity="${o.op}"` : ''}
    ${o.t ? `transform="${o.t}"` : ''}/>`;
}
function circle(cx, cy, r, o = {}) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill ?? MET}"
    stroke="${o.stroke ?? METD}" stroke-width="${o.sw ?? 2}"
    ${o.cls ? `class="${o.cls}"` : ''} ${o.t ? `transform="${o.t}"` : ''}/>`;
}
function line(x1, y1, x2, y2, o = {}) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? INK}"
    stroke-width="${o.sw ?? 2}" stroke-linecap="round"
    ${o.dash ? `stroke-dasharray="${o.dash}"` : ''} ${o.cls ? `class="${o.cls}"` : ''}/>`;
}
function path(d, o = {}) {
  return `<path d="${d}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? INK}"
    stroke-width="${o.sw ?? 2}" stroke-linecap="round" stroke-linejoin="round"
    ${o.dash ? `stroke-dasharray="${o.dash}"` : ''} ${o.cls ? `class="${o.cls}"` : ''}/>`;
}
function text(x, y, s, o = {}) {
  return `<text x="${x}" y="${y}" fill="${o.fill ?? SOFT}" font-size="${o.size ?? 15}"
    font-weight="${o.w ?? 600}" text-anchor="${o.a ?? 'middle'}"
    font-family="ui-sans-serif, system-ui, sans-serif">${esc(s)}</text>`;
}
function arrow(x1, y1, x2, y2, o = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 10;
  return line(x1, y1, x2, y2, { stroke: o.stroke ?? ACC, sw: o.sw ?? 2.5, cls: o.cls, dash: o.dash }) +
    path(`M${x2} ${y2} L${x2 - L * Math.cos(a - .45)} ${y2 - L * Math.sin(a - .45)}
          M${x2} ${y2} L${x2 - L * Math.cos(a + .45)} ${y2 - L * Math.sin(a + .45)}`,
      { stroke: o.stroke ?? ACC, sw: o.sw ?? 2.5, cls: o.cls });
}
// a wooden alignment peg
function dowel(x, y, len = 34, vert = false, cls = '') {
  return vert
    ? `<g ${cls ? `class="${cls}"` : ''}>${rect(x - 5, y, 10, len, { fill: WOOD, stroke: WOODD, r: 5 })}</g>`
    : `<g ${cls ? `class="${cls}"` : ''}>${rect(x, y - 5, len, 10, { fill: WOOD, stroke: WOODD, r: 5 })}</g>`;
}
// the metal disc that twists to lock
function cam(cx, cy, r = 17, o = {}) {
  return `<g ${o.cls ? `class="${o.cls}"` : ''}>
    ${circle(cx, cy, r, { fill: MET, stroke: METD, sw: 2.5 })}
    ${circle(cx, cy, r - 6, { fill: SUNK, stroke: METD, sw: 1.5 })}
    ${line(cx - r + 4, cy, cx + r - 4, cy, { stroke: METD, sw: 3 })}
    ${o.gap ? path(`M${cx - r} ${cy - 6} L${cx - r} ${cy + 6}`, { stroke: ACC, sw: 4 }) : ''}
  </g>`;
}
// bolt with a mushroom head
function bolt(x, y, len = 54, o = {}) {
  return `<g ${o.cls ? `class="${o.cls}"` : ''}>
    ${rect(x, y - 4, len, 8, { fill: MET, stroke: METD, r: 2 })}
    ${rect(x + len, y - 11, 9, 22, { fill: MET, stroke: METD, r: 3 })}
    ${o.washer ? rect(x - 4, y - 13, 7, 26, { fill: METD, stroke: METD, r: 2 }) : ''}
  </g>`;
}
function hexKey(x, y, cls = '') {
  return `<g ${cls ? `class="${cls}"` : ''}>${path(`M${x} ${y} L${x} ${y + 48} L${x + 30} ${y + 48}`,
    { stroke: METD, sw: 7 })}</g>`;
}
function mallet(x, y, cls = '') {
  return `<g ${cls ? `class="${cls}"` : ''}>
    ${rect(x, y, 46, 26, { fill: '#5b5146', stroke: '#3a332a', r: 5 })}
    ${rect(x + 18, y + 26, 10, 58, { fill: WOODD, stroke: '#5b4028', r: 4 })}
  </g>`;
}
function driver(x, y, cls = '') {
  return `<g ${cls ? `class="${cls}"` : ''}>
    ${rect(x - 9, y, 18, 50, { fill: ACC, stroke: 'none', r: 8 })}
    ${rect(x - 3, y + 50, 6, 44, { fill: MET, stroke: METD, r: 1 })}
    ${path(`M${x - 6} ${y + 94} L${x} ${y + 104} L${x + 6} ${y + 94}`, { stroke: METD, sw: 3 })}
  </g>`;
}
function tick(x, y, s = 1, col = 'var(--good)') {
  return path(`M${x} ${y} l${8 * s} ${9 * s} l${16 * s} ${-20 * s}`, { stroke: col, sw: 4 * s });
}
function cross(x, y, s = 1) {
  return path(`M${x - 9 * s} ${y - 9 * s} l${18 * s} ${18 * s} M${x + 9 * s} ${y - 9 * s} l${-18 * s} ${18 * s}`,
    { stroke: 'var(--warn)', sw: 4 });
}
function plate(x, y, str, o = {}) {
  const size = o.size ?? 15;
  const w = String(str).length * size * 0.56 + 22, h = size + 15;
  return rect(x - w / 2, y - h + 5, w, h, { fill: SUNK, stroke: 'none', r: 8, op: .93 }) +
    text(x, y, str, o);
}
function caption(s, y = H - 18) { return text(W / 2, y, s, { size: 15, fill: FAINT, w: 650 }); }
function ring(cx, cy, r) { return circle(cx, cy, r, { fill: 'none', stroke: ACC, sw: 2.5, cls: 'pulse' }); }

/* ------------------------------------------------------------------ */
/* drawing routines                                                    */
/* ------------------------------------------------------------------ */

const D = {};

D.workspace = v => {
  const box = rect(90, 150, 460, 180, { fill: '#c8a678', stroke: '#9c7b4e', r: 6 }) +
    line(320, 150, 320, 330, { stroke: '#9c7b4e', dash: '7 6' }) +
    path('M110 150 L150 120 L510 120 L550 150', { stroke: '#9c7b4e', sw: 2, fill: '#d8b183' });
  if (v === 'carry') return box + arrow(300, 110, 300, 60) + arrow(120, 240, 60, 240) +
    text(320, 92, 'get it into the room first', { fill: ACC, w: 700 }) + caption('while it is still in the box');
  if (v === 'unwrap') return box + path('M250 170 q70 40 150 10', { stroke: ACC, sw: 3, dash: '8 6', cls: 'sweep' }) +
    driver(560, 120, 'nudge') + caption('cut along the seam, blade angled away');
  if (v === 'protect') return rect(80, 270, 480, 24, { fill: SUNK, stroke: LINE }) +
    rect(150, 160, 340, 110, { fill: WOOD, stroke: WOODD, r: 5 }) +
    [200, 300, 400].map(x => circle(x, 282, 9, { fill: 'var(--good)', stroke: 'none' })).join('') +
    caption('felt pads: protects the floor, kills the drag noise');
  return box + plate(320, 250, 'flatten the box — this is your work surface', { fill: SOFT, w: 650 }) +
    caption('it protects your floor and the finished faces');
};

D.partslist = v => {
  const rows = ['side panel  ×2', 'shelf  ×3', 'back panel  ×1', 'cam lock  ×12', 'dowel  ×12', 'nails  ×30'];
  const body = rect(190, 60, 260, 300, { fill: RAISED, stroke: LINE, r: 10 }) +
    rect(280, 44, 80, 26, { fill: MET, stroke: METD, r: 6 }) +
    rows.map((r, i) => {
      const y = 112 + i * 42;
      return rect(212, y - 15, 22, 22, { fill: i < 4 ? 'none' : 'none', stroke: LINE, r: 4 }) +
        (i < 4 ? tick(216, y - 6, .55) : '') +
        text(248, y + 2, r, { a: 'start', size: 14, fill: i < 4 ? FAINT : INK });
    }).join('');
  if (v === 'repeat') return body + arrow(470, 210, 560, 210) +
    text(520, 190, 'then again', { fill: ACC, size: 13, w: 700 }) + caption('one hardware bag per piece');
  return body + caption('count everything now, while a free replacement is easy');
};

D.hardware = v => {
  const g = (x, lbl, art) => `<g>${art}${text(x, 300, lbl, { size: 14, fill: SOFT, w: 700 })}</g>`;
  if (v === 'lengths') return [
    rect(130, 170, 90, 9, { fill: MET, stroke: METD, r: 4 }) + text(175, 300, 'short — into the top', { size: 13 }),
    rect(275, 170, 150, 9, { fill: MET, stroke: METD, r: 4 }) + text(350, 300, 'long — through the leg', { size: 13 }),
  ].join('') + rect(275, 210, 150, 26, { fill: WOOD, stroke: WOODD }) +
    text(350, 258, 'top thickness', { size: 12, fill: FAINT }) +
    arrow(425, 180, 470, 180) + cross(495, 180) +
    caption('if the screw is longer than the top is thick, it is the wrong screw');
  if (v === 'grease') return circle(320, 190, 46, { fill: 'var(--warn-bg)', stroke: 'var(--warn)', sw: 2 }) +
    bolt(290, 190, 60) + text(320, 290, 'a dab of grease on every outdoor thread', { size: 15, fill: SOFT, w: 650 }) +
    caption('this is what lets you take it apart again in five years');
  if (v === 'slides') return rect(120, 150, 180, 22, { fill: MET, stroke: METD, r: 4 }) +
    rect(340, 150, 180, 22, { fill: MET, stroke: METD, r: 4 }) +
    text(210, 130, 'L', { size: 26, fill: ACC, w: 800 }) + text(430, 130, 'R', { size: 26, fill: ACC, w: 800 }) +
    path('M300 200 q20 30 40 0', { stroke: FAINT, dash: '5 5' }) +
    text(320, 260, 'mirror images — they are handed', { size: 15, fill: SOFT, w: 650 }) +
    caption('sort into two piles before you start');
  return g(150, 'dowel — lines up', dowel(118, 190, 64) ) +
    g(320, 'cam bolt — reaches across', bolt(272, 190, 54)) +
    g(500, 'cam lock — pulls tight', cam(500, 190, 24, { gap: 1 })) +
    caption('three pieces of hardware. that is the whole system.');
};

D.panels = v => {
  const A = rect(90, 110, 210, 180, { fill: WOOD, stroke: WOODD, r: 4 });
  const B = rect(360, 110, 210, 180, { fill: WOOD, stroke: WOODD, r: 4 });
  const holes = [155, 200, 245].map(y => circle(360, y, 7, { fill: SUNK, stroke: WOODD, sw: 1.5 })).join('');
  if (v === 'identify') return A + B +
    text(195, 206, 'good face', { size: 16, fill: ONWOOD, w: 750 }) +
    text(495, 206, 'rough face', { size: 16, fill: ONWOOD, w: 750 }) +
    [150, 180, 210, 240, 270].map(y => circle(390, y, 5, { fill: SUNK, stroke: WOODD, sw: 1.5 })).join('') +
    text(495, 246, 'these holes', { size: 13, fill: ONWOOD, w: 650 }) +
    text(495, 266, 'mean inside', { size: 13, fill: ONWOOD, w: 650 }) +
    rect(90, 100, 210, 8, { fill: ACC, stroke: 'none', r: 4 }) +
    text(195, 86, 'edge strip = faces front', { size: 14, fill: ACC, w: 700 }) +
    caption('good face out, rough face in. the holes tell you which is inside.');
  if (v === 'dowel') return A + [155, 200, 245].map(y => dowel(300, y, 40, false, 'nudge')).join('') +
    mallet(430, 120, 'nudge') + text(320, 330, 'tap to half depth — half in, half out', { size: 15, fill: SOFT, w: 650 }) +
    caption('a dowel driven fully in is hard to get back out');
  if (v === 'cambolt') return A + [155, 200, 245].map(y => bolt(300, y, 44)).join('') +
    hexKey(400, 170, 'spin') + text(320, 335, 'stop when the shoulder touches the wood', { size: 15, fill: SOFT, w: 650 }) +
    caption('any further and you strip the hole');
  if (v === 'caminsert') {
    const P = rect(330, 110, 210, 180, { fill: WOOD, stroke: WOODD, r: 4 });
    const H = [155, 200, 245].map(y => circle(330, y, 7, { fill: SUNK, stroke: WOODD, sw: 1.5 })).join('');
    return P + H +
      cam(250, 155, 22, { gap: 1, cls: 'drop' }) + cam(250, 200, 22, { gap: 1 }) + cam(250, 245, 22, { gap: 1 }) +
      arrow(140, 200, 215, 200) +
      plate(320, 330, 'the keyhole gap must face the incoming bolt', { size: 16, fill: ACC, w: 750 }) +
      caption('a cam facing the wrong way feels exactly like a bolt that is too short');
  }
  if (v === 'camtwist') {
    const P = rect(215, 110, 210, 180, { fill: WOOD, stroke: WOODD, r: 4 });
    return P + cam(320, 160, 26, { cls: 'spin' }) + cam(320, 240, 26) +
      path('M366 134 a44 44 0 0 1 14 44', { stroke: ACC, sw: 3 }) +
      arrow(379, 170, 382, 182) +
      plate(320, 332, 'clockwise, about half a turn, until it bites', { size: 16, fill: SOFT, w: 700 }) +
      caption('stop at firm — cams break');
  }
  if (v === 'join') return rect(150, 110, 200, 180, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(380, 110, 150, 180, { fill: WOOD, stroke: WOODD, r: 4, cls: 'nudge' }) +
    [155, 200, 245].map(y => dowel(350, y, 30)).join('') +
    arrow(400, 320, 330, 320) + caption('it should close with light hand pressure. never force it.');
  if (v === 'back') return rect(120, 90, 400, 230, { fill: 'none', stroke: WOODD, sw: 3, dash: '6 5' }) +
    rect(130, 100, 380, 210, { fill: '#e8e2d6', stroke: LINE, r: 2, op: .95 }) +
    [[140, 110], [500, 110], [140, 300], [500, 300]].map(([x, y], i) =>
      circle(x, y, 5, { fill: ACC, stroke: 'none', cls: i === 0 ? 'pulse' : '' })).join('') +
    [180, 230, 280, 330, 380, 430, 470].flatMap(x => [circle(x, 110, 4, { fill: FAINT, stroke: 'none' }),
      circle(x, 300, 4, { fill: FAINT, stroke: 'none' }), circle(x, 205, 4, { fill: FAINT, stroke: 'none' })]).join('') +
    plate(320, 212, 'nail into the shelves too', { size: 14, fill: SOFT, w: 700 }) +
    caption('corners first. the back is what stops the whole thing racking.');
  if (v === 'holes') return B + path('M360 110 q-30 90 0 180', { stroke: '#8d6a4a', sw: 3, fill: '#c9a97f', op: .9 }) +
    ring(390, 200, 26) + text(465, 330, 'the holes are behind the fabric', { size: 15, fill: ACC, w: 700 }) +
    caption('lift the flap and feel for the metal plate. never cut.');
  if (v === 'flat') return rect(110, 150, 420, 130, { fill: '#8d6a9c', stroke: '#6b4e78', r: 8 }) +
    rect(100, 280, 440, 18, { fill: SUNK, stroke: LINE, r: 4 }) +
    text(320, 222, 'face-down on something soft', { size: 15, fill: '#fff', w: 700 }) +
    caption('fabric picks up every bit of grit from a bare floor');
  return A + B;
};

D.frame = v => {
  const F = (o = {}) => rect(110, 110, 420, 200, { fill: 'none', stroke: o.c ?? METD, sw: 7, r: 5 });
  if (v === 'square') return F() +
    line(110, 110, 530, 310, { stroke: ACC, sw: 2.5, dash: '8 6' }) +
    line(530, 110, 110, 310, { stroke: ACC, sw: 2.5, dash: '8 6' }) +
    plate(320, 196, 'measure both diagonals', { size: 16, fill: ACC, w: 750 }) +
    plate(320, 232, 'the two numbers must match', { size: 14, fill: SOFT }) +
    caption('this one step is why some furniture looks factory-made');
  if (v === 'corner') return path('M150 300 L150 120 L520 120', { stroke: METD, sw: 7 }) +
    line(150, 192, 294, 120, { stroke: ACC, sw: 2.5, dash: '8 6' }) +
    text(166, 215, '3', { a: 'start', size: 18, fill: ACC, w: 800 }) +
    text(230, 108, '4', { size: 18, fill: ACC, w: 800 }) +
    text(248, 175, '5', { size: 18, fill: ACC, w: 800 }) +
    text(320, 280, 'three, four, five — a true right angle', { size: 16, fill: SOFT, w: 700 }) +
    caption('works in any unit: 30/40/50 cm does the same job');
  if (v === 'layout') return F() + rect(100, 100, 24, 220, { fill: METD, stroke: 'none', r: 4 }) +
    rect(516, 100, 24, 220, { fill: METD, stroke: 'none', r: 4 }) +
    text(320, 150, 'head', { size: 14, fill: FAINT }) + text(320, 285, 'foot', { size: 14, fill: FAINT }) +
    plate(320, 215, 'lay the rectangle out before bolting anything', { size: 15, fill: SOFT, w: 650 }) +
    caption('only one end rail has the headboard holes — compare them');
  if (v === 'center') return F() + rect(310, 110, 20, 200, { fill: METD, stroke: 'none', r: 4 }) +
    [150, 320, 490].map(x => rect(x - 7, 310, 14, 44, { fill: MET, stroke: METD, r: 3 })).join('') +
    ring(320, 332, 26) + text(320, 92, 'center support carries the load', { size: 15, fill: ACC, w: 700 }) +
    caption('every leg must actually touch the floor');
  if (v === 'ldesk') return path('M90 120 L470 120 L470 200 L560 200 L560 310 L90 310 Z',
    { fill: WOOD, stroke: WOODD, sw: 2.5 }) +
    text(260, 230, 'long side', { size: 15, fill: ONWOOD, w: 750 }) +
    text(516, 268, 'return', { size: 13, fill: ONWOOD, w: 750 }) +
    arrow(300, 90, 300, 112) + text(300, 76, 'decide left or right now', { size: 14, fill: ACC, w: 700 }) +
    caption('reversing it later means undoing the corner and every leg');
  if (v === 'centered') return rect(80, 120, 480, 190, { fill: WOOD, stroke: WOODD, r: 5 }) +
    rect(170, 150, 300, 130, { fill: 'none', stroke: METD, sw: 6, r: 4 }) +
    arrow(80, 215, 168, 215) + arrow(560, 215, 472, 215) +
    text(124, 198, 'a', { size: 16, fill: ACC, w: 800 }) + text(518, 198, 'a', { size: 16, fill: ACC, w: 800 }) +
    caption('both measurements equal, then tighten');
  if (v === 'wallfit') return rect(70, 80, 18, 250, { fill: SUNK, stroke: LINE }) +
    rect(70, 316, 500, 16, { fill: SUNK, stroke: LINE }) +
    rect(110, 150, 420, 160, { fill: WOOD, stroke: WOODD, r: 4 }) +
    path('M88 150 L110 150 M88 310 L110 310', { stroke: ACC, sw: 3 }) +
    plate(320, 236, 'leave the gap rather than twisting the desk', { size: 15, fill: SOFT, w: 650 }) +
    caption('rooms are rarely square. your furniture should be.');
  return F();
};

D.bolts = v => {
  if (v === 'sequence') return rect(130, 110, 380, 200, { fill: WOOD, stroke: WOODD, r: 5 }) +
    [[180, 160, '1'], [460, 260, '2'], [460, 160, '3'], [180, 260, '4']].map(([x, y, n]) =>
      circle(x, y, 19, { fill: ACC, stroke: 'none' }) + text(x, y + 6, n, { fill: '#fff', size: 15, w: 800 })).join('') +
    line(180, 160, 460, 260, { stroke: ACC, dash: '6 5' }) + line(460, 160, 180, 260, { stroke: ACC, dash: '6 5' }) +
    text(320, 348, 'opposite corners, like a car wheel — then a second lap', { size: 15, fill: SOFT, w: 650 });
  if (v === 'crossbar') return rect(140, 120, 26, 200, { fill: METD, stroke: 'none', r: 4 }) +
    rect(474, 120, 26, 200, { fill: METD, stroke: 'none', r: 4 }) +
    rect(166, 230, 308, 20, { fill: MET, stroke: METD, r: 4, cls: 'nudge' }) +
    ring(320, 240, 34) + plate(320, 344, 'the crossbar is the brace, not decoration', { size: 16, fill: ACC, w: 700 }) +
    caption('skipping it is the number one cause of a wobbly desk');
  if (v === 'plate') return rect(90, 140, 230, 90, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(320, 140, 230, 90, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(240, 236, 160, 34, { fill: MET, stroke: METD, r: 5 }) +
    [268, 300, 340, 372].map(x => circle(x, 253, 6, { fill: METD, stroke: 'none' })).join('') +
    text(320, 306, 'corner plate — tighten this first', { size: 15, fill: ACC, w: 700 }) +
    caption('press the two tops together hard before starting any screw');
  if (v === 'rail') return rect(100, 110, 30, 210, { fill: '#8d6a9c', stroke: '#6b4e78', r: 4 }) +
    rect(130, 180, 400, 26, { fill: METD, stroke: 'none', r: 4, cls: 'nudge' }) +
    bolt(150, 193, 40, { washer: 1 }) + hexKey(200, 240, 'spin') +
    text(320, 320, 'finger-tight only — the frame needs to move', { size: 15, fill: SOFT, w: 650 }) +
    caption('washer under every bolt head, every time');
  if (v === 'guard') return rect(110, 220, 420, 22, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(110, 130, 420, 18, { fill: WOOD, stroke: WOODD, r: 4 }) +
    [140, 500].map(x => rect(x - 9, 120, 18, 200, { fill: WOODD, stroke: 'none', r: 4 })).join('') +
    arrow(320, 196, 320, 158) + plate(320, 298, 'guard rails on BOTH sides, wall side included', { size: 15, fill: ACC, w: 750 }) +
    caption('measure from the mattress top to the rail — the manual gives a minimum');
  if (v === 'drive') return rect(110, 190, 420, 34, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(180, 150, 280, 40, { fill: 'none', stroke: METD, sw: 6, r: 4 }) +
    driver(320, 40, 'nudge') + [220, 280, 360, 420].map(x => circle(x, 190, 6, { fill: METD, stroke: 'none' })).join('') +
    caption('short screws only into the top — compare lengths first');
  return bolt(200, 190, 110, { washer: 1 }) + hexKey(360, 150, 'spin') +
    text(320, 300, 'start every bolt by hand before tightening any', { size: 16, fill: SOFT, w: 700 }) +
    caption('if it will not start by hand, you are cross-threading it');
};

D.bed = v => {
  const rails = rect(100, 120, 440, 200, { fill: 'none', stroke: METD, sw: 7, r: 5 });
  if (v === 'slats') return rails + Array.from({ length: 9 }, (_, i) =>
    rect(118 + i * 48, 128, 32, 184, { fill: WOOD, stroke: WOODD, r: 3, cls: i === 8 ? 'drop' : '' })).join('') +
    text(320, 350, 'even spacing, and secure the end slats', { size: 15, fill: SOFT, w: 650 }) +
    caption('gaps wider than about three inches will sag a foam mattress');
  if (v === 'mattress') return rails + rect(112, 132, 416, 176, { fill: '#e9e3d7', stroke: LINE, r: 14, cls: 'drop' }) +
    plate(320, 230, 'walk it on from the foot end', { size: 16, fill: SOFT, w: 700 }) +
    caption('lift from the foot, not the side');
  if (v === 'shake') return rails + path('M120 110 q24 -26 48 0', { stroke: ACC, sw: 3, cls: 'nudge' }) +
    path('M472 110 q24 -26 48 0', { stroke: ACC, sw: 3, cls: 'nudge' }) +
    text(320, 226, 'rock each corner. chase every knock.', { size: 17, fill: ACC, w: 750 }) +
    caption('ten times easier to find now than at midnight');
  if (v === 'ladder') return [160, 230].map(x => rect(x, 90, 16, 250, { fill: WOODD, stroke: 'none', r: 4 })).join('') +
    [130, 180, 230, 280].map(y => rect(160, y, 86, 14, { fill: WOOD, stroke: WOODD, r: 3 })).join('') +
    rect(300, 90, 240, 20, { fill: WOOD, stroke: WOODD, r: 4 }) +
    arrow(400, 200, 300, 150) + text(430, 240, 'climb it yourself', { size: 16, fill: ACC, w: 750 }) +
    caption("an adult's weight is the test, not a child's");
  return rails;
};

D.chair = v => {
  const base = path('M320 300 L200 340 M320 300 L440 340 M320 300 L320 356 M320 300 L210 272 M320 300 L430 272',
    { stroke: METD, sw: 10 });
  const wheels = [[200, 340], [440, 340], [320, 356], [210, 272], [430, 272]]
    .map(([x, y], i) => circle(x, y, 13, { fill: MET, stroke: METD, cls: i === 0 ? 'pulse' : '' })).join('');
  if (v === 'caster') return base + wheels + arrow(130, 300, 186, 330) +
    text(320, 120, 'push until it clicks', { size: 18, fill: ACC, w: 750 }) +
    caption('no screws. all five should sit at the same height.');
  if (v === 'gaslift') return base + wheels + rect(308, 150, 24, 150, { fill: MET, stroke: METD, r: 5, cls: 'drop' }) +
    rect(300, 200, 40, 100, { fill: SUNK, stroke: LINE, r: 6, op: .8 }) +
    text(460, 180, 'sleeve first', { size: 14, fill: ACC, w: 700 }) + arrow(430, 196, 348, 220) +
    text(320, 120, 'narrow end up', { size: 17, fill: SOFT, w: 700 }) +
    caption('never cut or open a gas cylinder');
  if (v === 'mech') return rect(140, 150, 360, 36, { fill: '#6b6257', stroke: '#453e36', r: 8 }) +
    rect(200, 186, 240, 60, { fill: METD, stroke: 'none', r: 6 }) +
    rect(440, 206, 90, 12, { fill: ACC, stroke: 'none', r: 6 }) +
    text(500, 250, 'lever', { size: 14, fill: ACC, w: 700 }) +
    text(320, 300, 'height lever on the RIGHT as you sit', { size: 17, fill: ACC, w: 750 }) +
    caption('mechanism backwards is the classic office-chair mistake');
  if (v === 'back') return rect(200, 230, 240, 44, { fill: '#6b6257', stroke: '#453e36', r: 8 }) +
    rect(250, 60, 150, 170, { fill: '#6b6257', stroke: '#453e36', r: 14, cls: 'nudge' }) +
    [220, 420].map(x => rect(x - 11, 190, 22, 70, { fill: METD, stroke: 'none', r: 4 })).join('') +
    ring(220, 214, 26) + ring(420, 214, 26) +
    text(320, 330, 'start a bolt on each side before you let go', { size: 15, fill: SOFT, w: 700 }) +
    caption('on gaming chairs these brackets hide under a zipped flap');
  if (v === 'arm') return rect(180, 180, 280, 40, { fill: '#6b6257', stroke: '#453e36', r: 8 }) +
    [150, 470].map(x => path(`M${x} 230 L${x} 150 L${x + (x < 300 ? 50 : -50)} 150`,
      { stroke: METD, sw: 11 })).join('') +
    text(320, 300, 'handed — if one looks wrong, swap sides', { size: 16, fill: SOFT, w: 700 }) +
    caption('both arms should end up the same height');
  if (v === 'cover') return rect(200, 170, 240, 60, { fill: METD, stroke: 'none', r: 6 }) +
    rect(190, 160, 260, 80, { fill: 'none', stroke: ACC, sw: 2.5, dash: '7 6', r: 10, cls: 'drop' }) +
    [210, 320, 430].map(x => circle(x, 250, 6, { fill: ACC, stroke: 'none' })).join('') +
    text(320, 320, 'line up every tab, then press', { size: 16, fill: SOFT, w: 700 }) +
    caption('forcing a cover on at an angle snaps the tabs');
  if (v === 'drop') return base + wheels + rect(308, 180, 24, 120, { fill: MET, stroke: METD, r: 5 }) +
    rect(180, 120, 280, 46, { fill: '#6b6257', stroke: '#453e36', r: 10, cls: 'drop' }) +
    arrow(320, 80, 320, 112) + text(320, 60, 'then sit on it', { size: 17, fill: ACC, w: 750 }) +
    caption('it feels loose until your weight seats the taper. that is correct.');
  if (v === 'adjust') return rect(190, 200, 260, 40, { fill: '#6b6257', stroke: '#453e36', r: 8 }) +
    rect(250, 70, 140, 130, { fill: '#6b6257', stroke: '#453e36', r: 14 }) +
    path('M450 240 L450 320 L540 320', { stroke: FAINT, sw: 2, dash: '6 5' }) +
    text(495, 300, '90°', { size: 14, fill: FAINT }) +
    text(320, 350, 'feet flat, thighs level, elbows at desk height', { size: 15, fill: SOFT, w: 650 });
  return base + wheels;
};

D.cabinet = v => {
  const box = rect(120, 90, 400, 240, { fill: 'none', stroke: WOODD, sw: 4, r: 5 });
  if (v === 'box') return rect(150, 140, 340, 150, { fill: 'none', stroke: WOODD, sw: 4, r: 4 }) +
    rect(162, 152, 316, 126, { fill: '#efe7d8', stroke: LINE, r: 2 }) +
    arrow(540, 215, 492, 215) + text(470, 330, 'base slides into the groove', { size: 15, fill: SOFT, w: 700 }) +
    caption('square the box by its diagonals before you fix the base');
  if (v === 'slide') return rect(150, 150, 340, 130, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(150, 272, 340, 18, { fill: MET, stroke: METD, r: 4 }) +
    plate(320, 215, 'flush with the bottom, pushed right to the front', { size: 15, fill: SOFT, w: 650 }) +
    arrow(100, 281, 144, 281) + caption('set back half an inch and the drawer front sits proud');
  if (v === 'mark') return box +
    [140, 200, 260].map(y => line(130, y, 510, y, { stroke: ACC, sw: 2, dash: '7 6' }) +
      text(100, y + 5, '=', { size: 18, fill: ACC, w: 800 })).join('') +
    arrow(120, 330, 120, 262) + text(320, 356, 'measure from the cabinet bottom — both walls identical', { size: 14, fill: SOFT, w: 650 });
  if (v === 'mount') return box + [150, 215, 280].map((y, i) =>
    rect(140, y, 170, 16, { fill: MET, stroke: METD, r: 4, cls: i === 1 ? 'pulse' : '' }) +
    rect(330, y, 170, 16, { fill: MET, stroke: METD, r: 4 })).join('') +
    driver(560, 120, 'nudge') + caption('front screw first, check it is level, then the back');
  if (v === 'test') return box + rect(140, 200, 300, 70, { fill: WOOD, stroke: WOODD, r: 4, cls: 'nudge' }) +
    arrow(460, 235, 540, 235) + plate(320, 352, 'it should move with one finger', { size: 17, fill: ACC, w: 750 }) +
    caption('if it needs force, stop — something is out of level');
  if (v === 'front') return box + [110, 180, 250].map((y, i) =>
    rect(140, y, 360, 58, { fill: WOOD, stroke: WOODD, r: 4, t: i === 1 ? 'translate(14,0)' : '' })).join('') +
    arrow(540, 210, 500, 210) + text(320, 356, 'close them all and look along the row', { size: 15, fill: SOFT, w: 650 });
  if (v === 'stop') return box + rect(140, 180, 300, 70, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(440, 196, 22, 22, { fill: ACC, stroke: 'none', r: 4, cls: 'pulse' }) +
    plate(320, 356, 'drawer stops: so a loaded drawer cannot come out in your hands', { size: 14, fill: SOFT, w: 650 });
  if (v === 'handle') return rect(150, 140, 340, 150, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(260, 200, 120, 16, { fill: METD, stroke: 'none', r: 8 }) +
    [272, 368].map(x => circle(x, 208, 7, { fill: MET, stroke: METD })).join('') +
    arrow(100, 208, 144, 208) + text(320, 330, 'bolts go in from the inside — snug, not cranked', { size: 15, fill: SOFT, w: 650 });
  if (v === 'hinge') return box + rect(130, 100, 180, 220, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(330, 100, 180, 220, { fill: WOOD, stroke: WOODD, r: 4, t: 'rotate(1.6 330 210)' }) +
    [150, 270].map(y => rect(300, y, 40, 26, { fill: MET, stroke: METD, r: 3 })).join('') +
    [[318, 163], [318, 283]].map(([x, y]) => circle(x, y, 6, { fill: ACC, stroke: 'none', cls: 'pulse' })).join('') +
    text(320, 356, 'hinge screws move the door sideways, in-out, up-down', { size: 14, fill: ACC, w: 700 });
  return box;
};

D.shelfunit = v => {
  const sides = [130, 500].map(x => rect(x - 12, 80, 24, 250, { fill: WOODD, stroke: 'none', r: 3 })).join('');
  if (v === 'pin') return sides + [150, 215, 280].map(y =>
    rect(142, y, 356, 14, { fill: WOOD, stroke: WOODD, r: 3 })).join('') +
    [[136, 192], [494, 192]].map(([x, y]) => circle(x, y, 7, { fill: ACC, stroke: 'none', cls: 'pulse' })).join('') +
    [120, 136, 152, 168, 184, 200].map(y => circle(142, y + 10, 4, { fill: SUNK, stroke: WOODD, sw: 1 })).join('') +
    text(320, 356, 'count holes from the bottom — the same count all four corners', { size: 14, fill: SOFT, w: 650 });
  if (v === 'place') return sides + [150, 215, 280].map(y =>
    rect(142, y, 356, 14, { fill: WOOD, stroke: WOODD, r: 3, cls: y === 150 ? 'drop' : '' })).join('') +
    caption('press each corner to confirm it sits flat');
  if (v === 'load') return sides + [150, 215, 280].map(y => rect(142, y, 356, 14, { fill: WOOD, stroke: WOODD, r: 3 })).join('') +
    [[160, 112, 30], [196, 118, 24], [228, 108, 34]].map(([x, y, h]) =>
      rect(x, 150 - h, 24, h, { fill: ACC, stroke: 'none', r: 2, op: .75 })).join('') +
    [[160, 46], [192, 40], [220, 50], [250, 44], [280, 48]].map(([x, h]) =>
      rect(x, 280 - h, 26, h, { fill: WOODD, stroke: 'none', r: 2 })).join('') +
    text(320, 356, 'heavy at the bottom, light at the top', { size: 16, fill: ACC, w: 750 });
  return sides;
};

D.rack = v => {
  const post = x => rect(x - 9, 70, 18, 280, { fill: MET, stroke: METD, r: 4 }) +
    Array.from({ length: 13 }, (_, i) => line(x - 9, 84 + i * 21, x + 9, 84 + i * 21, { stroke: METD, sw: 1.4 })).join('');
  if (v === 'explain') return post(320) +
    rect(296, 170, 48, 34, { fill: ACC, stroke: 'none', r: 3, op: .85 }) +
    path('M296 170 L344 170 L336 204 L304 204 Z', { fill: 'var(--accent-soft)', stroke: ACC, sw: 2 }) +
    text(450, 176, 'tapered collar', { size: 15, fill: ACC, w: 700, a: 'start' }) +
    text(450, 200, 'wide end UP', { size: 14, fill: SOFT, w: 700, a: 'start' }) +
    text(150, 260, 'grooved post', { size: 14, fill: FAINT, w: 600, a: 'start' }) +
    caption('the shelf wedges down onto the collar. that is the whole system.');
  if (v === 'clip') return [180, 460].map(post).join('') +
    [180, 460].map(x => path(`M${x - 24} 180 L${x + 24} 180 L${x + 16} 212 L${x - 16} 212 Z`,
      { fill: 'var(--accent-soft)', stroke: ACC, sw: 2 })).join('') +
    plate(320, 118, 'the SAME groove number on all four posts', { size: 16, fill: ACC, w: 750 }) +
    caption('say the number out loud as you do each post');
  if (v === 'wedge') return [180, 460].map(post).join('') +
    rect(150, 186, 340, 20, { fill: MET, stroke: METD, r: 4, cls: 'drop' }) +
    mallet(520, 110, 'nudge') + caption('tap each corner in a circuit, not one corner fully');
  if (v === 'stand') return [180, 460].map(post).join('') +
    rect(150, 300, 340, 20, { fill: MET, stroke: METD, r: 4 }) +
    arrow(320, 120, 320, 74) + plate(320, 150, 'stands on its own once the bottom shelf is on', { size: 15, fill: SOFT, w: 650 });
  if (v === 'stack') return [180, 460].map(post).join('') +
    [110, 180, 250, 310].map((y, i) => rect(150, y, 340, 18, { fill: MET, stroke: METD, r: 4, cls: i === 0 ? 'drop' : '' })).join('') +
    text(320, 370, 'top shelf at the very top — it braces the frame', { size: 15, fill: ACC, w: 700 });
  return [180, 460].map(post).join('');
};

D.grid = v => {
  const cells = (hi = -1) => {
    let s = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      s += rect(160 + c * 108, 80 + r * 84, 100, 76,
        { fill: i === hi ? 'var(--accent-soft)' : 'none', stroke: WOODD, sw: 3, r: 3 });
    }
    return s;
  };
  if (v === 'layout') return cells() + text(320, 356, 'dry-lay the whole grid before connecting anything', { size: 15, fill: SOFT, w: 650 });
  if (v === 'build') return cells(0) + arrow(120, 118, 154, 118) + caption('complete one row before starting the next');
  if (v === 'clip') return rect(160, 120, 160, 120, { fill: 'none', stroke: WOODD, sw: 3, r: 3 }) +
    rect(340, 120, 160, 120, { fill: 'none', stroke: WOODD, sw: 3, r: 3, cls: 'nudge' }) +
    path('M320 150 L336 150 L336 180 L320 180 Z M320 180 L304 180 L304 210 L320 210 Z',
      { fill: ACC, stroke: 'none' }) +
    text(320, 300, 'straight, square pressure — never at an angle', { size: 16, fill: ACC, w: 750 }) +
    caption('angled pressure cracks plastic connectors');
  if (v === 'tap') return cells(4) + mallet(520, 90, 'nudge') +
    caption('if you can see daylight at a joint, it is not seated');
  if (v === 'tube') return rect(140, 190, 180, 22, { fill: MET, stroke: METD, r: 10 }) +
    rect(380, 190, 140, 22, { fill: MET, stroke: METD, r: 10, cls: 'nudge' }) +
    rect(320, 178, 54, 46, { fill: ACC, stroke: 'none', r: 6, op: .85 }) +
    text(320, 290, 'push until the tube stops moving', { size: 16, fill: SOFT, w: 700 }) +
    caption('a half-seated joint is the one that fails under load');
  if (v === 'rail') return [150, 490].map(x => rect(x - 9, 80, 18, 250, { fill: MET, stroke: METD, r: 4 })).join('') +
    rect(150, 130, 340, 16, { fill: MET, stroke: METD, r: 8 }) +
    [[240, 146], [320, 146], [400, 146]].map(([x, y]) => path(`M${x} ${y} l0 26 a14 14 0 0 0 28 0`, { stroke: FAINT, sw: 2.5 })).join('') +
    ring(150, 138, 22) + ring(490, 138, 22) +
    caption('seated at BOTH ends — this carries all the weight');
  if (v === 'cover') return [150, 490].map(x => rect(x - 9, 110, 18, 220, { fill: MET, stroke: METD, r: 4 })).join('') +
    rect(120, 70, 400, 60, { fill: '#9aa3ad', stroke: '#6e767f', r: 8, cls: 'drop' }) +
    arrow(320, 150, 320, 190) + plate(320, 230, 'drop it over from the top, evenly', { size: 16, fill: SOFT, w: 700 }) +
    caption('yanking one corner tears the seams');
  return cells();
};

D.sofa = v => {
  const seat = (x, w, cls = '') => `<g ${cls ? `class="${cls}"` : ''}>
    ${rect(x, 200, w, 70, { fill: '#8d7f6e', stroke: '#5f5447', r: 8 })}
    ${rect(x + 6, 130, w - 12, 76, { fill: '#9c8d7a', stroke: '#5f5447', r: 10 })}
    ${[x + 14, x + w - 26].map(lx => rect(lx, 270, 12, 34, { fill: WOODD, stroke: 'none', r: 3 })).join('')}</g>`;
  if (v === 'back') return rect(150, 200, 340, 70, { fill: '#8d7f6e', stroke: '#5f5447', r: 8 }) +
    rect(160, 110, 320, 80, { fill: '#9c8d7a', stroke: '#5f5447', r: 10, cls: 'drop' }) +
    [200, 440].map(x => path(`M${x} 196 l0 -22 l14 0`, { stroke: METD, sw: 5 })).join('') +
    text(320, 340, 'hooks point down into the channel — push until it thunks', { size: 15, fill: SOFT, w: 650 });
  if (v === 'layout') return seat(90, 200) + seat(340, 210) +
    text(320, 350, 'position them before you clip — afterwards it is one heavy object', { size: 14, fill: SOFT, w: 650 });
  if (v === 'clip') return seat(80, 210) + seat(330, 210, 'nudge') +
    rect(286, 230, 60, 26, { fill: ACC, stroke: 'none', r: 4 }) +
    arrow(400, 330, 330, 330) + text(320, 364, 'lift both slightly so the hooks can drop together', { size: 14, fill: ACC, w: 700 });
  if (v === 'align') return seat(80, 210) + seat(296, 210) +
    line(80, 124, 520, 124, { stroke: ACC, sw: 2.5, dash: '8 6' }) +
    line(80, 196, 520, 196, { stroke: ACC, sw: 2.5, dash: '8 6' }) +
    text(320, 348, 'one continuous line — no step between sections', { size: 15, fill: ACC, w: 700 });
  if (v === 'cushion') return rect(130, 220, 380, 60, { fill: '#8d7f6e', stroke: '#5f5447', r: 8 }) +
    [150, 270, 390].map((x, i) => rect(x, 150, 110, 70, { fill: '#9c8d7a', stroke: '#5f5447', r: 10, cls: i === 1 ? 'drop' : '' })).join('') +
    text(320, 330, 'work the foam corners into the cover corners', { size: 16, fill: SOFT, w: 700 }) +
    caption('new covers look baggy until you do');
  if (v === 'strap') return rect(130, 200, 380, 70, { fill: '#7d8f6e', stroke: '#566047', r: 8 }) +
    [200, 320, 440].map(x => path(`M${x} 270 l0 26 l-20 0`, { stroke: ACC, sw: 4 })).join('') +
    text(320, 350, 'velcro or ties underneath — use them', { size: 16, fill: ACC, w: 750 }) +
    caption("unsecured cushions end up in the neighbor's garden");
  return seat(170, 300);
};

D.desk = v => {
  const top = rect(80, 130, 480, 50, { fill: WOOD, stroke: WOODD, r: 5 });
  const legs = (o = {}) => [120, 480].map(x =>
    rect(x - 13, 180, 26, 150, { fill: METD, stroke: 'none', r: 4, t: o.t })).join('');
  if (v === 'leg') return top + legs() + hexKey(300, 200, 'spin') +
    text(320, 364, 'start every screw before tightening any', { size: 15, fill: SOFT, w: 650 });
  if (v === 'angle') return top +
    path('M120 180 L92 330 M160 180 L188 330', { stroke: METD, sw: 14 }) +
    path('M480 180 L452 330 M440 180 L412 330', { stroke: METD, sw: 14 }) +
    plate(320, 104, 'all four lean outward the same way', { size: 16, fill: ACC, w: 750 }) +
    caption('one angled plate turned inward makes the table rock');
  if (v === 'flip') return rect(80, 180, 480, 50, { fill: WOOD, stroke: WOODD, r: 5 }) +
    path('M180 140 a150 150 0 0 1 280 0', { stroke: ACC, sw: 3, dash: '9 7' }) +
    arrow(440, 150, 468, 176) + text(320, 300, 'lift it — never lever it over on one leg', { size: 16, fill: ACC, w: 750 }) +
    caption('that load goes straight into the screw threads');
  if (v === 'level') return top + legs() +
    rect(100, 330, 26, 16, { fill: ACC, stroke: 'none', r: 3, cls: 'pulse' }) +
    rect(468, 326, 26, 12, { fill: MET, stroke: METD, r: 3 }) +
    line(60, 346, 580, 346, { stroke: LINE, sw: 3 }) +
    text(320, 380, 'press each corner, then wind out the foot that lifts', { size: 14, fill: SOFT, w: 650 });
  if (v === 'cable') return top + legs() +
    rect(400, 110, 60, 22, { fill: SUNK, stroke: LINE, r: 11 }) +
    path('M430 132 q-10 70 -60 90 q-70 26 -120 10', { stroke: ACC, sw: 3 }) +
    rect(180, 236, 90, 26, { fill: METD, stroke: 'none', r: 5 }) +
    text(320, 330, 'route the cables while the desk is still empty', { size: 16, fill: SOFT, w: 700 }) +
    caption('leave slack, and label both ends of every cable');
  if (v === 'control') return rect(80, 90, 480, 44, { fill: WOOD, stroke: WOODD, r: 5 }) +
    rect(270, 134, 110, 44, { fill: METD, stroke: 'none', r: 6 }) +
    rect(150, 134, 76, 26, { fill: ACC, stroke: 'none', r: 5 }) +
    text(188, 190, 'keypad', { size: 13, fill: ACC, w: 700 }) +
    text(325, 196, 'control box', { size: 13, fill: FAINT }) +
    [120, 500].map(x => rect(x - 14, 134, 28, 190, { fill: MET, stroke: METD, r: 4 })).join('') +
    caption('keep every cable clear of the lifting columns');
  if (v === 'reset') return top + [120, 500].map(x => rect(x - 14, 180, 28, 150, { fill: MET, stroke: METD, r: 4 })).join('') +
    rect(230, 190, 180, 50, { fill: ACC, stroke: 'none', r: 10 }) +
    text(320, 222, 'HOLD  ▼  10s', { size: 20, fill: '#fff', w: 800 }) +
    text(320, 300, 'it drops, dips, and beeps. that is the reset.', { size: 15, fill: SOFT, w: 700 }) +
    caption('this fixes most brand-new desks that "do not work"');
  if (v === 'adjust') return top + legs() +
    path('M540 130 L540 60', { stroke: FAINT, sw: 2, dash: '6 5' }) +
    text(540, 48, 'eye level', { size: 13, fill: FAINT }) +
    rect(250, 60, 140, 70, { fill: SUNK, stroke: LINE, r: 4 }) +
    text(320, 300, 'elbows level with the surface, sitting and standing', { size: 15, fill: SOFT, w: 650 });
  return top + legs();
};

D.wall = () => rect(60, 50, 160, 300, { fill: SUNK, stroke: LINE }) +
  rect(126, 50, 28, 300, { fill: 'none', stroke: ACC, sw: 2.5, dash: '9 7' }) +
  plate(140, 352, 'stud', { size: 13, fill: ACC, w: 700 }) +
  rect(240, 110, 300, 240, { fill: WOOD, stroke: WOODD, r: 5 }) +
  path('M220 140 L250 140 L250 160 L220 160 Z', { fill: METD, stroke: 'none' }) +
  line(154, 150, 240, 150, { stroke: ACC, sw: 6 }) +
  plate(400, 240, 'strap it. two minutes.', { size: 18, fill: ACC, w: 800 }) +
  caption('a child pulling open the top drawer is all it takes');

D.mattress = v => {
  if (v === 'unroll') return rect(90, 220, 460, 60, { fill: 'none', stroke: METD, sw: 6, r: 5 }) +
    path('M110 220 q120 -40 220 0', { stroke: LINE, sw: 2, fill: '#e9e3d7' }) +
    circle(470, 210, 54, { fill: '#e9e3d7', stroke: LINE, sw: 2 }) +
    arrow(410, 210, 330, 210) + text(320, 330, 'unroll it flat on the frame FIRST', { size: 17, fill: ACC, w: 750 }) +
    caption('cutting the bag while it is rolled means chasing it across the room');
  if (v === 'cut') return rect(100, 190, 440, 70, { fill: '#e9e3d7', stroke: LINE, sw: 2, r: 8 }) +
    path('M140 196 L500 196', { stroke: ACC, sw: 3, dash: '10 8', cls: 'sweep' }) +
    driver(560, 100, 'nudge') +
    text(320, 310, 'shallow, slow, blade angled away from the foam', { size: 16, fill: ACC, w: 750 }) +
    caption('a slice in the foam cannot be repaired');
  if (v === 'expand') return rect(100, 170, 440, 100, { fill: '#e9e3d7', stroke: LINE, sw: 2, r: 10, cls: 'grow' }) +
    rect(90, 270, 460, 18, { fill: 'none', stroke: METD, sw: 6, r: 4 }) +
    arrow(320, 150, 320, 110) + text(320, 340, 'pull the plastic out from underneath as it rises', { size: 15, fill: SOFT, w: 650 });
  if (v === 'rest') return rect(100, 160, 440, 110, { fill: '#e9e3d7', stroke: LINE, sw: 2, r: 12 }) +
    rect(90, 270, 460, 18, { fill: 'none', stroke: METD, sw: 6, r: 4 }) +
    path('M560 120 q-40 -30 -80 0 M560 170 q-40 -30 -80 0', { stroke: FAINT, sw: 2, cls: 'nudge' }) +
    text(320, 330, 'a few hours to rise, up to two days to firm up', { size: 16, fill: SOFT, w: 700 }) +
    caption('leave it bare with a window open');
  return rect(100, 170, 440, 100, { fill: '#e9e3d7', stroke: LINE, sw: 2, r: 10 });
};

D.glass = v => {
  if (v === 'umbrella') return rect(120, 180, 400, 24, { fill: '#cfd8df', stroke: '#9fb0bb', r: 4, op: .85 }) +
    rect(300, 100, 40, 100, { fill: METD, stroke: 'none', r: 6 }) +
    circle(320, 192, 26, { fill: 'none', stroke: ACC, sw: 3 }) +
    text(320, 300, 'plug it, or put the umbrella in — never leave it open', { size: 15, fill: ACC, w: 700 }) +
    caption('and never an umbrella without a weighted base');
  return rect(120, 240, 400, 22, { fill: 'none', stroke: METD, sw: 6, r: 4 }) +
    [160, 320, 480].map(x => circle(x, 232, 9, { fill: '#5b5146', stroke: 'none' })).join('') +
    rect(110, 160, 420, 22, { fill: '#cfd8df', stroke: '#9fb0bb', r: 3, op: .8, cls: 'drop' }) +
    arrow(320, 130, 320, 152) +
    text(320, 324, 'straight down onto clean pads — never slide it', { size: 16, fill: ACC, w: 750 }) +
    caption('tempered glass fails from edge damage, all at once');
};

D.hinge = v => {
  if (v === 'fold') return path('M110 260 L300 260 L300 130', { stroke: '#8d7f6e', sw: 22 }) +
    path('M300 260 L520 260', { stroke: '#8d7f6e', sw: 22, dash: '0' }) +
    circle(300, 260, 16, { fill: ACC, stroke: 'none' }) +
    path('M330 150 a110 110 0 0 1 86 96', { stroke: ACC, sw: 3, dash: '9 7' }) +
    arrow(410, 230, 420, 252) +
    text(320, 330, 'test the fold while everything is still loose', { size: 16, fill: ACC, w: 750 }) +
    caption('this is where you catch a mirrored mechanism cheaply');
  return rect(150, 150, 120, 120, { fill: MET, stroke: METD, r: 6 }) +
    rect(370, 150, 120, 120, { fill: MET, stroke: METD, r: 6 }) +
    path('M270 180 l100 0 M270 240 l100 0', { stroke: METD, sw: 8 }) +
    circle(320, 210, 14, { fill: ACC, stroke: 'none' }) +
    text(320, 320, 'mirror it exactly on both sides', { size: 16, fill: SOFT, w: 700 });
};

D.shake = () => rect(130, 120, 380, 180, { fill: 'none', stroke: WOODD, sw: 5, r: 6 }) +
  path('M110 100 q24 -26 48 0 M482 100 q24 -26 48 0', { stroke: ACC, sw: 3, cls: 'nudge' }) +
  text(320, 200, 'push it. rock it. listen.', { size: 22, fill: ACC, w: 800 }) +
  text(320, 236, 'any knock is a loose bolt', { size: 15, fill: SOFT }) +
  caption('ten times easier to find now than in a month');

D.calendar = () => rect(190, 90, 260, 230, { fill: RAISED, stroke: LINE, sw: 2, r: 12 }) +
  rect(190, 90, 260, 46, { fill: ACC, stroke: 'none' }) +
  path('M190 136 L450 136', { stroke: LINE }) +
  Array.from({ length: 12 }, (_, i) => circle(224 + (i % 4) * 64, 180 + Math.floor(i / 4) * 54, 12,
    { fill: i === 9 ? ACC : SUNK, stroke: 'none' })).join('') +
  text(320, 352, 'set a reminder — then one lap with the Allen key', { size: 15, fill: SOFT, w: 650 }) +
  text(320, 124, 'in two weeks', { size: 17, fill: '#fff', w: 800 });

D.tv = () => rect(120, 230, 400, 90, { fill: WOOD, stroke: WOODD, r: 5 }) +
  rect(290, 230, 20, 90, { fill: WOODD, stroke: 'none' }) +
  rect(160, 80, 320, 140, { fill: '#2b2b2f', stroke: '#17171a', r: 6 }) +
  [250, 390].map(x => rect(x, 220, 20, 12, { fill: '#17171a', stroke: 'none' })).join('') +
  ring(300, 226, 30) +
  path('M100 100 L120 100 L120 120', { stroke: ACC, sw: 4 }) +
  line(120, 110, 160, 110, { stroke: ACC, sw: 5 }) +
  text(320, 352, 'feet over a divider, strap the stand AND the TV', { size: 15, fill: ACC, w: 700 });


/* ------------------------------------------------------------------ */
/* nursery                                                             */
/* ------------------------------------------------------------------ */

const slats = (x, y, w, h, n = 9, cls = '') =>
  Array.from({ length: n }, (_, i) =>
    rect(x + 6 + i * ((w - 12) / n), y, 7, h, { fill: WOOD, stroke: WOODD, r: 3, cls })).join('');

D.crib = v => {
  const ends = (y = 90, h = 230) => [120, 520].map(x =>
    rect(x - 11, y, 22, h, { fill: WOODD, stroke: 'none', r: 4 })).join('');
  if (v === 'frame') return ends() +
    rect(131, 110, 389, 14, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(131, 286, 389, 14, { fill: WOOD, stroke: WOODD, r: 4 }) +
    slats(131, 124, 389, 162) +
    [[131, 117], [131, 293], [509, 117], [509, 293]].map(([x, y]) =>
      circle(x, y, 7, { fill: ACC, stroke: 'none', cls: 'pulse' })).join('') +
    plate(320, 344, 'start all four bolts by hand before tightening any', { size: 15, fill: SOFT, w: 700 }) +
    caption('the frame needs slack to find its shape');
  if (v === 'barrel') {
    const nut = (cx, cy, ok) => `<g>
      ${rect(cx - 16, cy - 30, 32, 60, { fill: MET, stroke: METD, r: 16 })}
      ${circle(cx, cy, 9, { fill: ok ? 'var(--good)' : SUNK, stroke: METD, sw: 2 })}
      ${line(cx - 11, cy - 30, cx + 11, cy - 30, { stroke: METD, sw: 4 })}
    </g>`;
    return rect(60, 150, 180, 110, { fill: WOOD, stroke: WOODD, r: 4 }) + nut(150, 205, false) +
      cross(150, 300) + text(150, 340, 'threaded hole turned away', { size: 13, fill: 'var(--warn)', w: 700 }) +
      rect(400, 150, 180, 110, { fill: WOOD, stroke: WOODD, r: 4 }) + nut(490, 205, true) +
      arrow(360, 205, 455, 205) + tick(470, 300, 1) +
      text(500, 340, 'bolt can reach the thread', { size: 13, fill: 'var(--good)', w: 700 }) +
      plate(320, 100, 'turn the slot with a flat-head screwdriver', { size: 16, fill: ACC, w: 750 }) +
      caption('sight down the bolt hole — you should see daylight through the nut');
  }
  if (v === 'support') return ends() +
    rect(131, 180, 389, 90, { fill: 'none', stroke: METD, sw: 5, r: 5 }) +
    Array.from({ length: 7 }, (_, i) => path(`M${160 + i * 55} 190 q8 18 0 36 q-8 18 0 34`,
      { stroke: MET, sw: 3 })).join('') +
    [[136, 186], [136, 264], [514, 186], [514, 264]].map(([x, y]) =>
      circle(x, y, 8, { fill: ACC, stroke: 'none', cls: 'pulse' })).join('') +
    rect(280, 282, 80, 26, { fill: '#d8cfc0', stroke: LINE, r: 4 }) +
    text(320, 300, 'POUCH', { size: 11, fill: '#3f3123', w: 800 }) +
    plate(320, 136, 'springs up · pouch up · four corner bolts', { size: 16, fill: ACC, w: 750 }) +
    caption('these four are the bolts you will never see again');
  if (v === 'height') return ends() + slats(131, 120, 389, 180, 9) +
    [[150, 'highest — newborn only'], [210, 'middle — once sitting'], [268, 'lowest — before standing']]
      .map(([y, t], i) => line(131, y, 520, y, { stroke: i === 2 ? ACC : FAINT, sw: i === 2 ? 4 : 2, dash: i === 2 ? '' : '7 6' }) +
        text(534, y + 5, String(i + 1), { size: 14, fill: i === 2 ? ACC : FAINT, w: 800, a: 'start' })).join('') +
    plate(320, 344, 'drop it before they can pull to standing, not after', { size: 15, fill: SOFT, w: 700 }) +
    caption('3 inches of rail above the mattress at the highest setting, minimum');
  if (v === 'remove') return ends() + slats(131, 124, 389, 162, 9, 'nudge') +
    arrow(320, 70, 320, 110) + plate(320, 50, 'four bolts, then lift straight out', { size: 15, fill: ACC, w: 700 }) +
    caption('bag the bolts and barrel nuts with the panel — you will want them again');
  if (v === 'stabilizer') return ends() +
    rect(131, 110, 389, 14, { fill: WOOD, stroke: WOODD, r: 4 }) +
    rect(131, 272, 389, 20, { fill: ACC, stroke: 'none', r: 5, cls: 'pulse' }) +
    plate(320, 200, 'the stabilizer bar replaces the side you removed', { size: 16, fill: ACC, w: 750 }) +
    caption('it is not optional — it stops the frame racking');
  if (v === 'rail') return ends() +
    rect(131, 180, 389, 100, { fill: '#e9e3d7', stroke: LINE, r: 6 }) +
    rect(131, 120, 240, 60, { fill: WOOD, stroke: WOODD, r: 4 }) +
    slats(131, 120, 240, 60, 5) +
    arrow(300, 210, 240, 210) +
    plate(430, 212, 'no gap here', { size: 15, fill: ACC, w: 750 }) +
    caption('push the mattress hard against the rail, then two-finger test the whole length');
  if (v === 'slatcheck') return ends() + slats(131, 124, 389, 162, 9) +
    rect(236, 170, 30, 70, { fill: ACC, stroke: 'none', r: 8, op: .9 }) +
    text(251, 262, 'can', { size: 12, fill: ACC, w: 700 }) + cross(251, 150) +
    plate(320, 330, 'a soda can must NOT fit between two slats', { size: 16, fill: ACC, w: 750 }) +
    caption('maximum spacing is 2 3/8 inches');
  if (v === 'empty') return ends() + slats(131, 124, 389, 162, 9) +
    rect(150, 230, 350, 56, { fill: '#e9e3d7', stroke: LINE, r: 6 }) +
    text(325, 264, 'mattress + fitted sheet', { size: 14, fill: '#4a4238', w: 700 }) +
    [[200, 170], [320, 160], [440, 172]].map(([x, y]) => cross(x, y, .8)).join('') +
    plate(320, 344, 'no bumpers, pillows, quilts, positioners or toys', { size: 15, fill: 'var(--warn)', w: 750 }) +
    caption('padded crib bumpers are banned from sale in the US');
  if (v === 'bare') return ends() +
    rect(150, 210, 350, 60, { fill: '#e9e3d7', stroke: LINE, r: 6 }) +
    path('M150 190 q140 -34 300 -6', { stroke: FAINT, sw: 2, dash: '8 6' }) +
    arrow(470, 160, 520, 130) +
    plate(320, 330, 'strip it back — bedding hides the gap you are looking for', { size: 15, fill: SOFT, w: 700 });
  if (v === 'changing') return rect(110, 190, 420, 150, { fill: WOOD, stroke: WOODD, r: 5 }) +
    rect(120, 120, 400, 70, { fill: '#cfc6b6', stroke: LINE, r: 6 }) +
    [120, 512].map(x => rect(x, 100, 8, 60, { fill: WOODD, stroke: 'none', r: 3 })).join('') +
    [[200, 186], [440, 186]].map(([x, y]) => circle(x, y, 7, { fill: ACC, stroke: 'none', cls: 'pulse' })).join('') +
    path('M250 140 l0 -22 l140 0 l0 22', { stroke: ACC, sw: 4 }) +
    plate(320, 366, 'topper screwed down · guard rails · restraint strap', { size: 15, fill: ACC, w: 700 });
  return ends() + slats(131, 124, 389, 162);
};

D.check = v => {
  if (v === 'recall') return rect(170, 90, 300, 190, { fill: RAISED, stroke: LINE, sw: 2, r: 12 }) +
    circle(320, 160, 40, { fill: 'none', stroke: ACC, sw: 5 }) +
    line(348, 188, 376, 216, { stroke: ACC, sw: 6 }) +
    text(320, 240, 'cpsc.gov/recalls', { size: 17, fill: ACC, w: 800 }) +
    plate(320, 322, 'check the model number before you build it', { size: 16, fill: SOFT, w: 700 }) +
    caption('two minutes, and it matters most for anything second-hand');
  if (v === 'age') return rect(190, 110, 260, 150, { fill: RAISED, stroke: LINE, sw: 2, r: 12 }) +
    text(320, 182, '15', { size: 60, fill: ACC, w: 800 }) +
    text(320, 222, 'months minimum', { size: 16, fill: SOFT, w: 700 }) +
    plate(320, 312, 'this is a safety limit, not a suggestion', { size: 15, fill: 'var(--warn)', w: 750 }) +
    caption('infants have been entrapped in toddler beds');
  if (v === 'torque') return bolt(180, 180, 110, { washer: 1 }) + hexKey(360, 140, 'spin') +
    path('M180 250 q110 0 220 0', { stroke: FAINT, sw: 2, dash: '6 5' }) +
    plate(320, 300, 'firm, then stop — you are pulling steel into wood', { size: 16, fill: ACC, w: 750 }) +
    caption('CPSC testing: half a turn loose is enough to lose the clamping force');
  if (v === 'twofinger') return rect(100, 120, 440, 180, { fill: 'none', stroke: WOODD, sw: 6, r: 5 }) +
    rect(112, 132, 380, 156, { fill: '#e9e3d7', stroke: LINE, r: 6 }) +
    rect(492, 132, 42, 156, { fill: 'var(--warn-bg)', stroke: 'var(--warn)', sw: 2, r: 4 }) +
    [504, 522].map(x => rect(x - 5, 180, 10, 60, { fill: ACC, stroke: 'none', r: 5 })).join('') +
    arrow(300, 90, 160, 90) + text(400, 86, 'push tight to one side', { size: 14, fill: SOFT, w: 650 }) +
    plate(320, 338, 'more than two fingers of gap = wrong mattress', { size: 16, fill: ACC, w: 750 }) +
    caption('the single most recalled failure in the whole nursery category');
  if (v === 'measure') return rect(120, 140, 400, 130, { fill: '#e9e3d7', stroke: LINE, sw: 2, r: 8 }) +
    line(120, 300, 520, 300, { stroke: ACC, sw: 2 }) + arrow(120, 300, 140, 300) + arrow(520, 300, 500, 300) +
    text(320, 322, '51 5/8 in minimum', { size: 15, fill: ACC, w: 750 }) +
    line(560, 140, 560, 270, { stroke: ACC, sw: 2 }) +
    text(560, 128, 'max 6 in thick', { size: 13, fill: ACC, w: 700 }) +
    text(320, 212, '27 1/4 in wide minimum', { size: 15, fill: '#4a4238', w: 750 }) +
    caption('a full-size crib mattress is a regulated size');
  if (v === 'firm') return rect(120, 170, 400, 90, { fill: '#e9e3d7', stroke: LINE, sw: 2, r: 8 }) +
    path('M280 170 q40 26 80 0', { stroke: FAINT, sw: 2, dash: '5 5' }) +
    arrow(320, 120, 320, 162) +
    plate(320, 310, 'press hard — it must spring straight back', { size: 16, fill: ACC, w: 750 }) +
    caption('if it feels comfortable to an adult, it is too soft for an infant');
  if (v === 'sheet') return rect(130, 160, 380, 110, { fill: '#e9e3d7', stroke: LINE, sw: 2, r: 8 }) +
    path('M130 160 q-18 18 0 36 M510 160 q18 18 0 36 M130 270 q-18 -18 0 -36 M510 270 q18 -18 0 -36',
      { stroke: ACC, sw: 4 }) +
    [[130, 160], [510, 160], [130, 270], [510, 270]].map(([x, y]) => ring(x, y, 18)).join('') +
    plate(320, 330, 'it must grip all four corners and not pull off', { size: 16, fill: SOFT, w: 700 }) +
    caption('a sheet that balls up is a suffocation risk, not an annoyance');
  return D.shake('');
};

D.bassinet = v => {
  const legs = path('M180 300 L230 200 M460 300 L410 200 M180 300 L460 300', { stroke: METD, sw: 8 });
  if (v === 'lock') return legs +
    [[230, 200], [410, 200]].map(([x, y]) => ring(x, y, 22)).join('') +
    tick(300, 248, 1.2) +
    plate(320, 134, 'every hinge must click into its lock', { size: 17, fill: ACC, w: 750 }) +
    caption('an unlocked joint folds under load — a documented bassinet failure');
  if (v === 'basket') return legs +
    rect(190, 150, 260, 70, { fill: '#cfc6b6', stroke: LINE, sw: 2, r: 10, cls: 'drop' }) +
    arrow(320, 110, 320, 142) +
    plate(320, 300, 'press until every clip engages, then lift-test it', { size: 15, fill: SOFT, w: 700 });
  if (v === 'pad') return rect(150, 180, 340, 70, { fill: '#cfc6b6', stroke: LINE, sw: 2, r: 8 }) +
    rect(160, 196, 320, 42, { fill: '#e9e3d7', stroke: LINE, r: 4 }) +
    cross(560, 160, .8) + text(560, 200, 'nothing', { size: 12, fill: 'var(--warn)', w: 700 }) +
    text(560, 218, 'added', { size: 12, fill: 'var(--warn)', w: 700 }) +
    plate(320, 310, 'the supplied pad only — flat, firm, edge to edge', { size: 16, fill: ACC, w: 750 }) +
    caption('adding padding to make it softer is how infants suffocate');
  if (v === 'level') return rect(150, 190, 340, 24, { fill: '#e9e3d7', stroke: LINE, sw: 2, r: 4 }) +
    rect(250, 140, 140, 44, { fill: METD, stroke: 'none', r: 8 }) +
    circle(320, 162, 11, { fill: 'var(--good)', stroke: 'none' }) +
    line(150, 240, 490, 240, { stroke: FAINT, sw: 2, dash: '7 6' }) +
    plate(320, 310, 'flat. 10 degrees is the legal ceiling, not a target.', { size: 16, fill: ACC, w: 750 }) +
    caption("inclined sleep is the hazard behind this category's worst recalls");
  if (v === 'bedside') return rect(60, 180, 260, 110, { fill: '#9c8d7a', stroke: '#5f5447', r: 8 }) +
    text(190, 240, 'your bed', { size: 15, fill: '#fff', w: 700 }) +
    rect(330, 180, 250, 110, { fill: '#cfc6b6', stroke: LINE, sw: 2, r: 8 }) +
    line(320, 174, 320, 296, { stroke: ACC, sw: 4 }) +
    path('M110 300 q200 40 420 0', { stroke: ACC, sw: 4, dash: '9 7' }) +
    plate(320, 136, 'surfaces level · straps tight · no gap', { size: 16, fill: ACC, w: 750 }) +
    caption('strap under your mattress and re-check every few days');
  if (v === 'rocklock') return legs +
    rect(190, 150, 260, 70, { fill: '#cfc6b6', stroke: LINE, sw: 2, r: 10 }) +
    path('M150 190 q-24 -20 0 -40 M490 190 q24 -20 0 -40', { stroke: FAINT, sw: 2, dash: '5 5' }) +
    [[200, 215], [440, 215]].map(([x, y]) => circle(x, y, 10, { fill: ACC, stroke: 'none', cls: 'pulse' })).join('') +
    plate(320, 300, 'lock it for unattended sleep', { size: 16, fill: ACC, w: 750 });
  return legs;
};

D.gate = v => {
  const wall = (x) => rect(x, 60, 26, 280, { fill: SUNK, stroke: LINE });
  const bars = (x, w) => Array.from({ length: 7 }, (_, i) =>
    rect(x + 10 + i * ((w - 20) / 7), 110, 7, 200, { fill: MET, stroke: METD, r: 3 })).join('');
  if (v === 'type') return wall(60) + bars(90, 200) +
    [120, 270].map(x => rect(x, 96, 20, 20, { fill: ACC, stroke: 'none', r: 10 })).join('') +
    text(190, 346, 'pressure: threaded cups', { size: 13, fill: SOFT, w: 700 }) +
    wall(350) + bars(380, 200) +
    [[378, 120], [378, 290]].map(([x, y]) => rect(x, y, 22, 16, { fill: METD, stroke: 'none', r: 3 })).join('') +
    text(480, 346, 'hardware: brackets + screws', { size: 13, fill: ACC, w: 750 }) +
    caption('the label on the gate states where it may be used');
  if (v === 'stairs') return path('M80 320 L180 320 L180 280 L280 280 L280 240 L380 240 L380 200 L480 200 L480 160 L580 160',
    { stroke: WOODD, sw: 6 }) +
    rect(470, 70, 14, 92, { fill: METD, stroke: 'none', r: 3 }) +
    rect(484, 86, 90, 8, { fill: MET, stroke: METD, r: 3 }) +
    rect(484, 122, 90, 8, { fill: MET, stroke: METD, r: 3 }) +
    plate(300, 110, 'top of stairs = hardware-mounted only', { size: 17, fill: ACC, w: 800 }) +
    caption('a pressure gate is held by friction and can go down the stairs with the child');
  if (v === 'measure') return wall(80) + wall(534) +
    [120, 205, 290].map(y => line(106, y, 534, y, { stroke: ACC, sw: 2, dash: '8 6' }) +
      text(320, y - 8, '', { size: 12 })).join('') +
    text(320, 340, 'measure top, middle and bottom — use the narrowest', { size: 15, fill: SOFT, w: 700 });
  if (v === 'mount') return wall(60) +
    rect(126, 60, 28, 280, { fill: 'none', stroke: ACC, sw: 2.5, dash: '9 7' }) +
    plate(140, 374, 'stud', { size: 13, fill: ACC, w: 700 }) +
    bars(190, 330) +
    [[166, 130], [166, 290]].map(([x, y]) => rect(x, y, 26, 18, { fill: METD, stroke: 'none', r: 3 })).join('') +
    caption('drywall alone will not hold a child throwing their weight at a gate');
  if (v === 'level') return wall(60) + wall(534) + bars(100, 434) +
    rect(240, 70, 160, 26, { fill: METD, stroke: 'none', r: 6 }) +
    circle(320, 83, 8, { fill: 'var(--good)', stroke: 'none' }) +
    [[92, 140], [526, 140]].map(([x, y]) => circle(x, y, 7, { fill: ACC, stroke: 'none' })).join('') +
    line(92, 140, 526, 140, { stroke: ACC, sw: 2, dash: '7 6' }) +
    plate(320, 348, 'identical bracket heights, measured from the floor', { size: 15, fill: ACC, w: 750 }) +
    caption('a gate that is not plumb will not latch reliably');
  if (v === 'fix') return wall(60) + wall(534) + bars(100, 434) +
    [[86, 130], [86, 290], [526, 130], [526, 290]].map(([x, y]) =>
      circle(x, y, 8, { fill: METD, stroke: 'none' })).join('') + driver(320, 20, 'nudge') +
    caption('finish the last turn by hand — better feel, no stripped holes');
  if (v === 'gaps') return wall(60) + wall(534) + bars(100, 434) +
    rect(100, 310, 434, 30, { fill: 'var(--warn-bg)', stroke: 'var(--warn)', sw: 2, r: 4 }) +
    text(320, 331, 'under 3 inches', { size: 14, fill: 'var(--warn)', w: 750 }) +
    ring(96, 200, 20) + ring(530, 200, 20) +
    plate(320, 84, 'check the side gaps through the full swing', { size: 15, fill: ACC, w: 750 });
  if (v === 'latch') return wall(60) + wall(534) + bars(100, 434) +
    rect(290, 180, 60, 44, { fill: ACC, stroke: 'none', r: 8 }) +
    text(320, 210, '20×', { size: 20, fill: '#fff', w: 800 }) +
    plate(320, 300, 'close it twenty times — it must latch every time', { size: 16, fill: ACC, w: 750 }) +
    caption('nineteen out of twenty is a failure, not a quirk');
  if (v === 'pressure') return wall(60) + wall(534) + bars(100, 434) +
    [130, 290].map(y => arrow(200, y, 110, y) + arrow(434, y, 524, y)).join('') +
    plate(320, 348, 'wind all four cups out evenly, and re-tighten weekly', { size: 15, fill: SOFT, w: 700 }) +
    caption('bar on the side away from the child');
  return wall(60) + wall(534) + bars(100, 434);
};

D.highchair = v => {
  const chair = path('M250 300 L230 150 M390 300 L410 150 M200 340 L250 300 M440 340 L390 300', { stroke: METD, sw: 9 }) +
    rect(220, 140, 200, 36, { fill: '#8d7f6e', stroke: '#5f5447', r: 8 }) +
    rect(236, 50, 168, 92, { fill: '#9c8d7a', stroke: '#5f5447', r: 10 });
  if (v === 'harness') return chair +
    path('M280 70 L300 140 M360 70 L340 140', { stroke: ACC, sw: 6 }) +
    path('M250 150 L300 150 M390 150 L340 150', { stroke: ACC, sw: 6 }) +
    path('M320 176 L320 150', { stroke: ACC, sw: 7 }) +
    circle(320, 148, 13, { fill: ACC, stroke: 'none' }) +
    text(430, 184, 'crotch strap', { size: 14, fill: ACC, w: 750, a: 'start' }) +
    arrow(426, 180, 338, 170) +
    plate(320, 330, 'five points meeting at one buckle', { size: 16, fill: ACC, w: 750 }) +
    caption('without the crotch strap a child slides straight out underneath');
  if (v === 'tray') return chair +
    rect(190, 150, 260, 26, { fill: '#cfc6b6', stroke: LINE, sw: 2, r: 6, cls: 'nudge' }) +
    [210, 430].map(x => circle(x, 163, 9, { fill: ACC, stroke: 'none', cls: 'pulse' })).join('') +
    plate(320, 310, 'it must click on BOTH sides', { size: 16, fill: ACC, w: 750 }) +
    caption('the tray is a table, never a restraint');
  if (v === 'position') return rect(40, 180, 150, 20, { fill: WOOD, stroke: WOODD, r: 4 }) +
    text(110, 160, 'table', { size: 14, fill: SOFT, w: 700 }) + chair +
    arrow(230, 300, 196, 300) + cross(196, 262, .8) +
    line(190, 330, 250, 330, { stroke: ACC, sw: 3, dash: '7 6' }) +
    plate(360, 356, 'feet must not reach a push-off surface', { size: 15, fill: ACC, w: 750 }) +
    caption('pushing off a table is the classic high chair tip-over');
  if (v === 'fit') return chair +
    path('M280 70 L300 140 M360 70 L340 140', { stroke: ACC, sw: 6 }) +
    [500, 516].map(x => rect(x, 120, 11, 48, { fill: MET, stroke: METD, r: 5 })).join('') +
    text(508, 190, 'two fingers', { size: 13, fill: ACC, w: 700 }) +
    plate(320, 330, 'shoulder straps at or just below the shoulders', { size: 15, fill: SOFT, w: 700 }) +
    caption('two flat fingers under the strap — no more');
  return chair;
};

D.playard = v => {
  const posts = [120, 520].map(x => rect(x - 10, 110, 20, 210, { fill: METD, stroke: 'none', r: 4 })).join('');
  const mesh = rect(130, 120, 380, 190, { fill: 'none', stroke: MET, sw: 2, dash: '3 5' });
  if (v === 'unfold') return posts + mesh +
    path('M130 120 q190 -34 380 0', { stroke: ACC, sw: 6 }) +
    rect(280, 280, 80, 20, { fill: ACC, stroke: 'none', r: 6, cls: 'pulse' }) +
    arrow(320, 350, 320, 310) +
    plate(320, 84, 'rails up FIRST — leave the center raised', { size: 17, fill: ACC, w: 800 }) +
    caption('pushing the center down early is why a rail then refuses to lock');
  if (v === 'rail') return posts + mesh +
    rect(130, 112, 380, 16, { fill: MET, stroke: METD, r: 6 }) +
    arrow(320, 70, 320, 104) +
    ring(320, 120, 26) +
    plate(320, 300, 'push down and outward until it clicks straight', { size: 16, fill: ACC, w: 750 }) +
    caption('sight along it — any sag in the middle means it has not locked');
  if (v === 'center') return posts + mesh +
    rect(130, 112, 380, 16, { fill: MET, stroke: METD, r: 6 }) +
    rect(270, 290, 100, 26, { fill: ACC, stroke: 'none', r: 6, cls: 'drop' }) +
    arrow(320, 230, 320, 284) +
    plate(320, 356, 'now press the center straight down, hard', { size: 16, fill: SOFT, w: 750 });
  if (v === 'check') return posts + mesh +
    rect(130, 112, 380, 16, { fill: MET, stroke: METD, r: 6 }) +
    [200, 320, 440].map(x => arrow(x, 70, x, 104)).join('') +
    plate(320, 220, 'press the midpoint of all four rails', { size: 17, fill: ACC, w: 800 }) +
    caption('do this at every setup, not just the first one');
  if (v === 'fold') return posts + mesh +
    rect(290, 200, 60, 20, { fill: ACC, stroke: 'none', r: 6 }) +
    arrow(320, 196, 320, 130) +
    plate(320, 300, 'center strap UP first, then release the rails', { size: 16, fill: ACC, w: 750 }) +
    caption('nearly every play yard that "will not fold" has this backwards');
  return posts + mesh;
};

D.glider = v => {
  const seat = rect(170, 200, 300, 60, { fill: '#8d7f6e', stroke: '#5f5447', r: 10 });
  const back = (cls = '') => rect(200, 90, 240, 112, { fill: '#9c8d7a', stroke: '#5f5447', r: 12, cls });
  const base = rect(190, 290, 260, 22, { fill: METD, stroke: 'none', r: 5 });
  if (v === 'base') return base + seat +
    path('M210 262 l0 28 M430 262 l0 28', { stroke: MET, sw: 7 }) +
    arrow(150, 300, 100, 300) + arrow(490, 300, 540, 300) +
    plate(320, 150, 'check it glides before you add the back', { size: 16, fill: SOFT, w: 700 }) +
    caption('look underneath for a transit lock that was never removed');
  if (v === 'back') return base + seat + back('drop') +
    [200, 430].map(x => rect(x - 7, 196, 14, 36, { fill: METD, stroke: 'none', r: 3 })).join('') +
    arrow(320, 50, 320, 84) +
    plate(320, 344, 'both sides lined up, then push straight down', { size: 15, fill: SOFT, w: 700 }) +
    caption('forcing one side in at an angle bends the channel permanently');
  if (v === 'lock') return base + seat + back() +
    [200, 430].map(x => circle(x, 210, 11, { fill: ACC, stroke: 'none', cls: 'pulse' })).join('') +
    arrow(320, 70, 320, 40) +
    plate(320, 330, 'levers down, then pull UP hard on the back', { size: 16, fill: ACC, w: 750 }) +
    caption('a seated-but-unlocked back feels completely normal until it does not');
  if (v === 'pinch') return base + seat +
    path('M230 262 L280 292 M280 262 L230 292 M390 262 L440 292 M440 262 L390 292', { stroke: MET, sw: 7 }) +
    ring(255, 277, 28) + ring(415, 277, 28) +
    plate(320, 150, 'pinch point — fingers and toes fit in here', { size: 17, fill: 'var(--warn)', w: 800 }) +
    caption("it closes with an adult's full weight behind it");
  if (v === 'recline') return base + rect(170, 210, 300, 56, { fill: '#8d7f6e', stroke: '#5f5447', r: 10 }) +
    rect(206, 96, 240, 112, { fill: '#9c8d7a', stroke: '#5f5447', r: 12, t: 'rotate(-13 206 208)' }) +
    rect(470, 250, 90, 18, { fill: '#8d7f6e', stroke: '#5f5447', r: 6 }) +
    plate(320, 344, 'find the glide lock — use it when you stand up', { size: 15, fill: ACC, w: 750 });
  return base + seat + back();
};

D.railstrap = () => rect(100, 180, 440, 90, { fill: '#e9e3d7', stroke: LINE, sw: 2, r: 8 }) +
  rect(110, 110, 16, 76, { fill: METD, stroke: 'none', r: 4 }) +
  rect(110, 104, 320, 14, { fill: MET, stroke: METD, r: 6 }) +
  path('M160 270 q0 40 60 40 l200 0 q60 0 60 -40', { stroke: ACC, sw: 5, dash: '10 7' }) +
  text(320, 338, 'straps under the mattress, pulled tight', { size: 15, fill: ACC, w: 750 }) +
  ring(118, 176, 22) +
  plate(320, 72, 'no gap between rail and mattress', { size: 16, fill: 'var(--warn)', w: 800 }) +
  caption('a child rolling into that gap is the fatal mechanism');

/* ------------------------------------------------------------------ */
/* scene id -> routine + variant                                       */
/* ------------------------------------------------------------------ */
const SCENES = {
  'crib-frame': ['crib', 'frame'], 'crib-barrel-nut': ['crib', 'barrel'],
  'mattress-support': ['crib', 'support'], 'mattress-height': ['crib', 'height'],
  'crib-side-remove': ['crib', 'remove'], 'stabilizer-bar': ['crib', 'stabilizer'],
  'toddler-rail': ['crib', 'rail'], 'slat-check': ['crib', 'slatcheck'],
  'crib-empty': ['crib', 'empty'], 'mattress-bare': ['crib', 'bare'],
  'changing-top': ['crib', 'changing'],
  'recall-check': ['check', 'recall'], 'age-check': ['check', 'age'],
  'torque-feel': ['check', 'torque'], 'two-finger-gap': ['check', 'twofinger'],
  'mattress-measure': ['check', 'measure'], 'mattress-firm': ['check', 'firm'],
  'sheet-fit': ['check', 'sheet'],
  'frame-lock': ['bassinet', 'lock'], 'bassinet-basket': ['bassinet', 'basket'],
  'bassinet-pad': ['bassinet', 'pad'], 'bassinet-level': ['bassinet', 'level'],
  'bedside-gap': ['bassinet', 'bedside'], 'rock-lock': ['bassinet', 'rocklock'],
  'gate-type': ['gate', 'type'], 'gate-stairs': ['gate', 'stairs'],
  'gate-measure': ['gate', 'measure'], 'gate-mount': ['gate', 'mount'],
  'gate-level': ['gate', 'level'], 'gate-fix': ['gate', 'fix'],
  'gate-gaps': ['gate', 'gaps'], 'gate-latch': ['gate', 'latch'],
  'gate-pressure': ['gate', 'pressure'],
  'harness-thread': ['highchair', 'harness'], 'tray-fit': ['highchair', 'tray'],
  'chair-position': ['highchair', 'position'], 'harness-fit': ['highchair', 'fit'],
  'playard-unfold': ['playard', 'unfold'], 'playard-rail': ['playard', 'rail'],
  'playard-center': ['playard', 'center'], 'playard-check': ['playard', 'check'],
  'playard-fold': ['playard', 'fold'],
  'glider-base': ['glider', 'base'], 'glider-back': ['glider', 'back'],
  'glider-lock': ['glider', 'lock'], 'glider-pinch': ['glider', 'pinch'],
  'glider-recline': ['glider', 'recline'],
  'bed-rail-strap': ['railstrap', ''],
  'cardboard-floor': ['workspace', ''], 'box-carry': ['workspace', 'carry'],
  'unwrap': ['workspace', 'unwrap'], 'floor-protect': ['workspace', 'protect'],
  'cover-protect': ['workspace', 'protect'],
  'read-parts-list': ['partslist', ''], 'repeat-build': ['partslist', 'repeat'],
  'sort-hardware': ['hardware', ''], 'screw-length': ['hardware', 'lengths'],
  'grease-threads': ['hardware', 'grease'], 'slide-sort': ['hardware', 'slides'],
  'panel-identify': ['panels', 'identify'], 'dowel-tap': ['panels', 'dowel'],
  'cam-bolt-screw': ['panels', 'cambolt'], 'cam-insert': ['panels', 'caminsert'],
  'cam-twist': ['panels', 'camtwist'], 'panel-join': ['panels', 'join'],
  'back-panel-nail': ['panels', 'back'], 'find-holes': ['panels', 'holes'],
  'headboard-flat': ['panels', 'flat'],
  'square-check': ['frame', 'square'], 'square-corner': ['frame', 'corner'],
  'frame-layout': ['frame', 'layout'], 'center-support': ['frame', 'center'],
  'l-layout': ['frame', 'ldesk'], 'frame-center': ['frame', 'centered'],
  'wall-fit': ['frame', 'wallfit'], 'grid-layout': ['grid', 'layout'],
  'bolt-hex': ['bolts', ''], 'tighten-sequence': ['bolts', 'sequence'],
  'crossbar': ['bolts', 'crossbar'], 'corner-plate': ['bolts', 'plate'],
  'side-rail-bolt': ['bolts', 'rail'], 'guard-rail': ['bolts', 'guard'],
  'screw-drive': ['bolts', 'drive'],
  'slat-lay': ['bed', 'slats'], 'mattress-place': ['bed', 'mattress'],
  'shake-test': ['shake', ''], 'ladder-fit': ['bed', 'ladder'],
  'caster-press': ['chair', 'caster'], 'gas-lift': ['chair', 'gaslift'],
  'seat-mech': ['chair', 'mech'], 'chair-back-bracket': ['chair', 'back'],
  'armrest': ['chair', 'arm'], 'cover-snap': ['chair', 'cover'],
  'seat-drop': ['chair', 'drop'], 'chair-adjust': ['chair', 'adjust'],
  'drawer-box': ['cabinet', 'box'], 'drawer-slide': ['cabinet', 'slide'],
  'slide-mark': ['cabinet', 'mark'], 'slide-mount': ['cabinet', 'mount'],
  'drawer-test': ['cabinet', 'test'], 'drawer-front-adjust': ['cabinet', 'front'],
  'drawer-stop': ['cabinet', 'stop'], 'handle-fit': ['cabinet', 'handle'],
  'hinge-door': ['cabinet', 'hinge'],
  'shelf-pin': ['shelfunit', 'pin'], 'shelf-place': ['shelfunit', 'place'],
  'load-shelves': ['shelfunit', 'load'],
  'sleeve-explain': ['rack', 'explain'], 'sleeve-clip': ['rack', 'clip'],
  'shelf-wedge': ['rack', 'wedge'], 'rack-stand': ['rack', 'stand'],
  'shelf-stack': ['rack', 'stack'],
  'grid-build': ['grid', 'build'], 'clip-snap': ['grid', 'clip'],
  'mallet-tap': ['grid', 'tap'], 'tube-pressfit': ['grid', 'tube'],
  'rail-fit': ['grid', 'rail'], 'fabric-cover': ['grid', 'cover'],
  'sofa-back': ['sofa', 'back'], 'sofa-layout': ['sofa', 'layout'],
  'sofa-clip': ['sofa', 'clip'], 'sofa-align': ['sofa', 'align'],
  'cushion-fit': ['sofa', 'cushion'], 'cushion-clip': ['sofa', 'strap'],
  'leg-screw': ['desk', 'leg'], 'leg-angle': ['desk', 'angle'],
  'flip-over': ['desk', 'flip'], 'leveling-feet': ['desk', 'level'],
  'cable-channel': ['desk', 'cable'], 'control-box': ['desk', 'control'],
  'desk-reset': ['desk', 'reset'], 'desk-adjust': ['desk', 'adjust'],
  'antitip-strap': ['wall', ''],
  'mattress-unroll': ['mattress', 'unroll'], 'mattress-cut': ['mattress', 'cut'],
  'mattress-expand': ['mattress', 'expand'], 'mattress-rest': ['mattress', 'rest'],
  'glass-set': ['glass', ''], 'umbrella-hole': ['glass', 'umbrella'],
  'hinge-mech': ['hinge', ''], 'futon-fold': ['hinge', 'fold'],
  'calendar-recheck': ['calendar', ''], 'tv-mount': ['tv', ''],
};

export function drawScene(sceneId) {
  const [fn, variant] = SCENES[sceneId] || ['shake', ''];
  let body;
  try { body = D[fn](variant); } catch (e) { body = D.shake(''); }
  return `<svg class="dg" viewBox="0 0 ${W} ${H}" role="img" aria-label="assembly step diagram"
    preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

export const sceneCount = Object.keys(SCENES).length;
