// The Grid's beats: each row lights and lands its tag, then one cell fills.
export function gridTimeline(def) {
  let at = 400
  const beats = def.rows.map((row, i) => {
    const b = { kind: 'row', row: i, start: at, travelEnd: at + 550, end: at + 900 }
    at = b.end
    return b
  })
  const sel = { kind: 'select', start: at, travelEnd: at + 700, end: at + 1000 }
  at = sel.end
  beats.push(sel)
  return { beats, duration: at, rests: beats.map(b => b.end) }
}
