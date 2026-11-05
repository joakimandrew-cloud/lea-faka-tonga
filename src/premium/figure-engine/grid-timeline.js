// The Grid's beats: each row (or, with lightColumns, each column) lights in turn, then one
// cell fills and its sentence appears.
export function gridTimeline(def) {
  let at = 400
  const lit = def.lightColumns
    ? def.head.slice(1).map((_, i) => ({ kind: 'col', col: i }))
    : def.rows.map((_, i) => ({ kind: 'row', row: i }))
  const beats = lit.map(item => {
    const b = { ...item, start: at, travelEnd: at + 550, end: at + 900 }
    at = b.end
    return b
  })
  const sel = { kind: 'select', start: at, travelEnd: at + 700, end: at + 1000 }
  at = sel.end
  beats.push(sel)
  return { beats, duration: at, rests: beats.map(b => b.end) }
}
