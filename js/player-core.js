// The walkthrough's clock arithmetic, kept separate from the DOM so it can be
// tested without a browser. `secs` is the duration of each step in order.
// Returns where the playhead lands after `dt` seconds have passed.
export function advance(secs, idx, into, dt) {
  into += dt;
  while (into >= secs[idx]) {
    if (idx >= secs.length - 1) return { idx, into: secs[idx], ended: true };
    into -= secs[idx];
    idx += 1;
  }
  return { idx, into, ended: false };
}

// Cumulative time before each step, so the clock can show a running total.
export function offsets(secs) {
  const out = [0];
  for (const s of secs) out.push(out[out.length - 1] + s);
  return out;
}
