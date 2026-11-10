// The sentence seed: the homepage's "Every lesson adds a piece." piece, redone 2026-11-10 (plans/2026-11-10-sentence-seed-homepage.md).
// It replaces the sentence journey of 2026-10-24 (src/premium/lib/blueprint/sentence-journey.js, kept in place, unused) in
// src/premium/components/HomeBlueprint.jsx. Every Tongan string comes from src/data/sentence-bloom-data.js (book rows found
// pair-level in both books, atlas-grammar labels with sources); lesson titles, topics and parts come from the site's chapters.json
// through that file, verbatim. The course view at the end (the six parts, the road, the preview card and its keyboard handling),
// the controls, the in-view start and the reduced-motion ending are the 2026-10-08 ones, carried over from the journey line for line;
// the changing sentence is the journey's own engine. What is new is everything that grows.
//
// One red line does all the growing, and it changes form four times. The film, 38.8 s, a pure function of time (render(t)):
//   0.0 to 2.4 s    Seed. Naʻá ku kai. from Lesson 1 stands large with its three part labels, a red seed under it.
//   2.4 to 14.6 s   Shoot. One word changes at a time on a steady beat: the verb (Lesson 1), then the pronoun and the four tense
//                   markers (Lesson 2). Each sentence that is replaced drops to the stem and stays there as a leaf, with its English
//                   and its changed word marked: changing the sentence and multiplying it are one motion.
//   14.6 to 21.2 s  Stem. Lesson 3 adds an object and a modifier, Lesson 4 a time word, Lesson 9 turns it negative, and the stem
//                   grows a node each time. Twelve sentences are on the stage, all grown from the first.
//   21.2 to 34.5 s  Vine. The view pulls back: the stem is the start of a vine through all 52 lessons. A leaf (one printed sentence)
//                   opens at each lesson the tip passes, and five times one sentence opens large with its English.
//   34.5 to 36.7 s  The whole plant holds: 52 lessons on one vine, a sentence from each.
//   36.7 to 38.8 s  Map. The leaves fold into their lessons, the ground turns blueprint blue, and the vine is the road of the course
//                   view.
// On a wide stage the vine lies on the course map's own geometry from the pull-back on, so nothing moves at the end. Where readable
// leaves do not fit that map (a phone, a narrow window) the vine grows down the stage as a list, the view follows its tip, and the
// lessons travel to the map at the end.
// Contract for the capture and check tools: every sentence on screen is an element with data-row, its Tongan in [data-to], its
// English in [data-en], any part label in [data-label]; the stage carries data-stage; controller.shown() lists what is on screen.
// Self-contained ES module, no dependencies. mount(element, options) returns a controller; unmount() removes it.
// Look: the homepage's own tokens (--wr-*, --f-*, base.css); the blueprint keeps its ruled palette (#0d375c, #c4deff, #deecff).
import DATA from '@app/data/sentence-bloom-data.js'
import { okinafy } from '@app/lib/okinafy.js'

const DEV = (() => { try { if (import.meta.env) return !!import.meta.env.DEV } catch { /* not bundled */ } return typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) })()
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v) } return o }
if (DEV) deepFreeze(DATA)

const ROWS = DATA.rows, LESSONS = DATA.lessons, COURSE = DATA.course
const BP = '#0d375c', RING = '#c4deff', BPINK = '#deecff'
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const lerp = (a, b, e) => a + (b - a) * e
const smooth = u => { u = clamp(u); return u * u * (3 - 2 * u) }
const out3 = u => 1 - Math.pow(1 - clamp(u), 3)
const span = (a, b, t) => clamp((t - a) / (b - a))
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e }
const mixC = (a, b, k) => (k <= 0.001 ? a : k >= 0.999 ? b : `color-mix(in srgb, ${b} ${(k * 100).toFixed(1)}%, ${a})`)
const GROUP = Object.fromEntries(COURSE.groups.map(g => [g.key, okinafy(g.name)]))
const partOf = n => COURSE.groups.findIndex(g => g.lessons.includes(n))

// Topics: Tongan words marked lang="to" as the site's Mixed component does (src/premium/pages/Lessons.jsx), with the
// term list and pattern of splitMixedTonganText in src/lib/lesson-browser.js at the same commit (ported from the bloom).
const MIXED_TONGAN_TERMS = [
  'fe-...-ʻaki', 'lolotonga', 'faka-', 'taʻe-', '-ʻanga', 'ngaahi', 'totonu',
  'ʻaʻaku', 'ʻoʻoku', 'ʻanefe', 'kapau', 'hingoā', 'mou', 'ʻikai', 'pehē',
  'ʻaupito', 'ʻofa', 'ʻosi', 'ʻeni', 'ʻena', 'ʻafe', 'ʻaki', 'lava', 'tuku',
  'kiate', 'meiate', 'fie', 'kuo', 'naʻa', 'naʻe', 'ʻoku', 'siʻi', 'siʻa',
  'fuʻu', 'kiʻi', 'meia', 'taha', 'ange', 'lolotonga', 'taʻu', 'fiha', 'nga',
  '-ʻi', '-nga', 'fe-', 'ʻia', 'faka-Tonga', 'ko', 'mo', 'ki', 'mei', 'ha',
  'ʻe', 'ʻa', 'ʻi', 'ʻo', 'ke', 'ku', 'te', 'e', 'he', 'ho', 'fie', 'kei',
  'pea', 'kau', 'mai', 'atu', 'ai', 'hai', 'fe', 'pau', 'ʻanga', 'loto', 'lalo', 'kia', 'ka', 'kita',
]
const MIXED_PATTERN = new RegExp(`(?<![\\p{L}\\p{M}])(${[...new Set(MIXED_TONGAN_TERMS)].sort((a, b) => b.length - a.length).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('ʻ', "[ʻ'‘’ʼ`]")).join('|')})(?![\\p{L}\\p{M}])`, 'giu')
const mixedHtml = text => {
  const t = okinafy(String(text ?? '')); let out = '', end = 0
  for (const m of t.matchAll(MIXED_PATTERN)) { out += esc(t.slice(end, m.index)) + `<span lang="to">${esc(m[0])}</span>`; end = m.index + m[0].length }
  return out + esc(t.slice(end))
}
const backOut = u => { u = clamp(u); const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2) }
const bump = u => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u))

// ---------- the script ----------
// The sentence that changes and grows is the journey's own ladder (Lessons 1, 2, 3, 4 and 9), on its timings. Each step shows one
// row of the data; a step's slots name the grammatical slot each word fills, so the step before it can be matched word by word:
// the same slot with a new word rolls, a new slot unfolds, a slot that is gone folds away.
const SLOTS = {
  'ch03-l144-0': ['T', 'P', 'V', 'O', 'M'],
  'ch04-l036-0': ['T', 'P', 'V', 'O', 'M', 'W'],
  'ch09-l078-0': ['T', 'N', 'P', 'V', 'O', 'W'],
}
// a row's words: the labelled ones as the data gives them; an unlabelled row split on its spaces, its punctuation set aside
const wordsOf = r => r.words || (r.punct ? r.to.slice(0, -r.punct.length) : r.to).split(' ').map(w => [w, null, null])
const slotsOf = id => SLOTS[id] || wordsOf(ROWS[id]).map((_, i) => 'TPVOMWXYZ'[i])
const ROLL = 0.42
export const SCRIPT = Object.freeze([
  { t: 0.0, row: 'ch01-l012-0', lesson: 1, kind: 'open', dur: 0.6 },
  { t: 2.4, row: 'ch01-l092-0', lesson: 1, kind: 'roll', dur: ROLL },
  { t: 3.6, row: 'ch01-l112-0', lesson: 1, kind: 'roll', dur: ROLL },
  { t: 4.8, row: 'ch02-l102-0', lesson: 2, kind: 'roll', dur: ROLL },
  { t: 6.0, row: 'ch02-l087-0', lesson: 2, kind: 'roll', dur: ROLL },
  { t: 7.2, row: 'ch02-l088-0', lesson: 2, kind: 'roll', dur: ROLL },
  { t: 8.4, row: 'ch02-l089-0', lesson: 2, kind: 'roll', dur: ROLL },
  { t: 9.6, row: 'ch02-l090-0', lesson: 2, kind: 'roll', dur: ROLL },
  { t: 10.8, row: 'ch02-l087-0', lesson: 2, kind: 'roll', dur: ROLL },
  { t: 12.0, row: 'ch02-l122-0', lesson: 2, kind: 'roll', dur: ROLL },
  { t: 13.2, row: 'ch02-l136-0', lesson: 2, kind: 'roll', dur: ROLL },
  { t: 14.6, row: 'ch03-l144-0', lesson: 3, kind: 'grow', dur: 0.7 },
  { t: 16.6, row: 'ch04-l036-0', lesson: 4, kind: 'grow', dur: 0.7 },
  { t: 18.6, row: 'ch09-l078-0', lesson: 9, kind: 'grow', dur: 0.8 },
].map(Object.freeze))
for (const s of SCRIPT) if (!ROWS[s.row] || ROWS[s.row].lesson !== s.lesson) throw new Error('script row missing or in another lesson: ' + s.row)
const OPEN_LAG = 0.35                                          // the seed lands first, then the sentence comes up
const PULL = Object.freeze({ start: 21.2, end: 22.5 })         // the view pulls back: the stem is the start of a vine
const LEAVE = PULL.start                                       // the big sentence closes into Lesson 9's leaf
const REGROW = 0.6                                             // into the pull-back, when the stem sets off again from Lesson 4
// one stop in each later part of the course, where a sentence opens large at the growing tip
export const STOPS = Object.freeze([
  { t: 22.5, lesson: 15, row: 'ch15-l033-1' },
  { t: 24.9, lesson: 21, row: 'ch21-l014-0' },
  { t: 27.3, lesson: 30, row: 'ch30-l012-0' },
  { t: 29.7, lesson: 36, row: 'ch36-l145-0' },
  { t: 32.1, lesson: 52, row: 'ch52-l092-0' },
].map(Object.freeze))
for (const s of STOPS) if (!ROWS[s.row] || ROWS[s.row].lesson !== s.lesson) throw new Error('stop row missing or in another lesson: ' + s.row)
const WHOLE = Object.freeze({ start: 34.5, end: 36.7 })        // the whole plant holds still
const FOLD = Object.freeze({ start: 36.7, end: 38.2 })         // the leaves fold in; the lessons take their places on the map
const TURN = Object.freeze({ start: 37.2, end: 37.9 })         // the ground turns blueprint blue
const COURSE_BEAT = Object.freeze({ start: 38.2, end: 38.8 })  // titles, hint and heading come up
const END = COURSE_BEAT.end
// The beat table, for the capture and check tools: one beat per step of the sentence, the pull-back, the five stops, the whole
// plant, the fold and the course view (the ids are the storyboard's, reviews/sentence-seed-2026-11-10/Storyboard.json).
export const TIMELINE = Object.freeze((() => {
  const id = i => 'b' + String(i).padStart(2, '0')
  const out = SCRIPT.map((s, i) => ({ id: id(i + 1), start: s.t, end: i + 1 < SCRIPT.length ? SCRIPT[i + 1].t : PULL.start }))
  out.push({ id: id(15), start: PULL.start, end: PULL.end })
  STOPS.forEach((s, i) => out.push({ id: id(16 + i), start: s.t, end: i + 1 < STOPS.length ? STOPS[i + 1].t : WHOLE.start }))
  out.push({ id: id(21), start: WHOLE.start, end: WHOLE.end }, { id: id(22), start: FOLD.start, end: FOLD.end }, { id: id(23), start: COURSE_BEAT.start, end: COURSE_BEAT.end })
  return out.map(Object.freeze)
})())

// The leaf each lesson keeps on the vine: the row the film features for that lesson; otherwise the lesson's card row; otherwise
// (a card longer than 27 characters, or one whose English carries a bracketed note) the lesson's shortest row with no note.
const noted = s => /[([]/.test(s)
const FEATURED = Object.freeze({ 1: 'ch01-l012-0', 2: 'ch02-l087-0', 3: 'ch03-l144-0', 4: 'ch04-l036-0', 9: 'ch09-l078-0', ...Object.fromEntries(STOPS.map(s => [s.lesson, s.row])) })
export const LEAF = Object.freeze(Object.fromEntries(LESSONS.map(L => {
  if (FEATURED[L.n]) return [L.n, FEATURED[L.n]]
  const card = ROWS[L.card]
  if (card.to.length <= 27 && !noted(card.en)) return [L.n, card.id]
  const pool = Object.values(ROWS).filter(r => r.lesson === L.n && !noted(r.en)).sort((a, b) => a.to.length - b.to.length)
  return [L.n, pool.length && pool[0].to.length < card.to.length ? pool[0].id : card.id]
})))
// The sentences the changing line leaves behind, in order: each is hung as a leaf at the moment it is replaced. A sentence that is
// already hanging is not hung twice; its leaf lights up when the line comes back to it.
const FAMILY = Object.freeze((() => {
  const out = []
  SCRIPT.forEach((s, i) => {
    if (!i) return
    const prev = SCRIPT[i - 1]
    const twin = out.find(f => ROWS[f.row].to === ROWS[prev.row].to)
    if (twin) { twin.pulses.push(prev.t + 0.3); return }
    // the words that made this sentence new: those whose slot is new, or holds another word than in the step before it
    const before = SCRIPT[i - 2], ks = slotsOf(prev.row), ws = wordsOf(ROWS[prev.row])
    const kb = before ? slotsOf(before.row) : [], wb = before ? wordsOf(ROWS[before.row]) : []
    const hot = ws.map((w, j) => { if (!before) return false; const at = kb.indexOf(ks[j]); return at < 0 || wb[at][0] !== w[0] })
    out.push({ row: prev.row, lesson: prev.lesson, shed: s.t, step: i - 1, pulses: [], hot })
  })
  return out
})())
// the growing tip, as a lesson number that eases from lesson to lesson: through the sentence's own lessons first, then stop to stop
const TRAVEL = Object.freeze([
  ...SCRIPT.flatMap((s, i) => { const p = SCRIPT[i - 1]; return p && p.lesson !== s.lesson ? [{ t0: s.t, t1: s.t + (s.lesson - p.lesson > 1 ? 1.1 : 0.6), from: p.lesson, to: s.lesson, road: false }] : [] }),
  // at the pull-back the stem draws back to Lesson 4 while the view widens, then grows on along the road itself to Lesson 9
  { t0: PULL.start, t1: PULL.start + 0.25, from: 9, to: 4, road: false },
  { t0: PULL.start + REGROW, t1: PULL.end - 0.2, from: 4, to: 9, road: true },
  ...STOPS.map((s, i) => { const from = i ? STOPS[i - 1].lesson : SCRIPT[SCRIPT.length - 1].lesson; return { t0: s.t, t1: s.t + clamp(0.5 + (s.lesson - from) * 0.028, 0.7, 0.95), from, to: s.lesson, road: true } }),
])
// the header's lesson: the sentence's own lessons, then each stop as the tip sets off for it
const FLAGS = Object.freeze((() => {
  const out = [{ t: 0, lesson: 1 }]
  for (const s of SCRIPT) if (s.lesson !== out[out.length - 1].lesson) out.push({ t: s.t, lesson: s.lesson })
  for (const s of STOPS) out.push({ t: s.t + 0.3, lesson: s.lesson })
  return out
})())

const CSS = `
.sb{position:relative;font-family:var(--f-ui);color:var(--wr-ink)}
.sb *{box-sizing:border-box}
.sb [lang="to"]{font-family:var(--f-serif);font-style:italic;font-weight:450}
.sb-panel{position:relative;border-radius:2px;padding:18px 24px 22px}
.sb-ground{position:absolute;inset:0;border-radius:2px;background-color:${BP};background-image:linear-gradient(rgba(196,222,255,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(196,222,255,.16) 1px,transparent 1px),linear-gradient(rgba(196,222,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(196,222,255,.07) 1px,transparent 1px);background-size:120px 120px,120px 120px,24px 24px,24px 24px;opacity:0;pointer-events:none}
.sb-top{position:relative;z-index:3;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px 16px;padding:0 0 6px}
.sb-hd{display:grid;flex:1 1 auto;min-width:0;min-height:62px;align-items:end}
.sb-hd>*{grid-area:1/1}
.sb-hd>[hidden]{display:none}
.sj-flag{position:relative;display:grid;min-width:0}
.sj-flag>span{grid-area:1/1;display:block;min-width:0}
.sj-flag .e{display:block;font:800 13px/1 var(--f-display);letter-spacing:.16em;text-transform:uppercase;color:var(--wr-red)}
.sj-flag .e b{font-weight:800}
.sj-flag .ttl{display:block;margin-top:7px;font:800 32px/.92 var(--f-display);letter-spacing:-.005em;text-transform:uppercase;color:var(--wr-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-bphead .eb{margin:0 0 6px;color:${RING};font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.sb-bphead h3{margin:0;font:800 40px/.92 var(--f-display);letter-spacing:-.005em;text-transform:uppercase;color:#fff}
.sb-ctl{display:flex;flex-wrap:wrap;gap:8px;flex-shrink:0}
.sb-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 14px;border:1px solid var(--home-rule,#cfcfcf);border-radius:2px;background:#fff;color:var(--wr-ink);font:600 13px/1.1 var(--f-ui);cursor:pointer;white-space:nowrap}
.sb-btn:hover{border-color:var(--wr-red);color:var(--wr-red-deep)}
.sb-btn[hidden]{display:none}
.sb :focus-visible{outline:3px solid var(--wr-red-deep);outline-offset:3px;border-radius:2px}
.sb.is-dark .sb-top .sb-btn{background:transparent;color:${BPINK};border-color:rgba(196,222,255,.5)}
.sb.is-dark .sb-top .sb-btn:hover{color:#fff;border-color:#fff}
.sb.is-dark .sb-top :focus-visible,.sb.is-dark .sb-course :focus-visible{outline-color:#fff}
.sb.is-dark .sb-course .sb-ls:focus-visible{box-shadow:0 0 0 6px ${BP}}
.sb-stage{position:relative;z-index:1;overflow:hidden}
.sj-sent{position:absolute;inset:0;pointer-events:none}
.sj-line,.sj-ghost{position:absolute;left:0;top:0;width:100%}
.sj-w{position:absolute;left:0;top:0;display:block;white-space:nowrap}
.sj-lab{position:absolute;left:0;right:0;top:0;text-align:center;color:var(--wr-muted);font:750 12px/1.1 var(--f-display);letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;opacity:0}
.sj-lab.on{color:var(--wr-red)}
.sj-t{position:absolute;left:0;top:0;display:grid;font-size:60px;line-height:1.15}
.sj-t>span{display:block;grid-area:1/1;will-change:transform,opacity}
.sj-u{position:absolute;left:0;right:0;height:3px;border-radius:2px;background:var(--wr-red);opacity:0;transform-origin:50% 50%}
.sj-wash{position:absolute;left:-.14em;right:-.14em;border-radius:3px;background:var(--wr-red-pale,#ffe2e0);opacity:0}
.sj-en{position:absolute;left:0;right:0;top:0;margin:0;display:grid}
.sj-en p{grid-area:1/1;margin:0 auto;padding:0 8px;text-align:center;font-size:24px;line-height:1.3;color:var(--wr-muted);will-change:transform,opacity}
.sb-course{position:relative;padding:10px 8px 14px;visibility:hidden;opacity:0;color:${BPINK}}
.sb-croad{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.sb-croad path{fill:none;stroke:${RING};stroke-width:2;stroke-opacity:.7}
.sb .sb-hintc{position:relative;margin:0 0 14px;font:700 13px/1.2 var(--f-display);letter-spacing:.14em;text-transform:uppercase;color:${BPINK}}
.sb-grp{position:relative;display:grid;grid-template-columns:120px 1fr;column-gap:16px;align-items:start;margin:0 0 20px}
.sb-grp:last-child{margin-bottom:0}
.sb .sb-gname{margin:6px 0 0;font:700 13px/1.1 var(--f-display);letter-spacing:.12em;text-transform:uppercase;color:${BPINK}}
.sb-row{position:relative;display:flex;justify-content:space-between;align-items:flex-start}
.sb:not(.is-sheet) .sb-rows{padding-right:26px}
.sb-ls{position:relative;display:flex;flex-direction:column;align-items:center;min-width:44px;min-height:44px;margin:0;padding:0;border:0;background:none;color:${BPINK};font:inherit;cursor:pointer}
.sb-chip{display:block;width:28px;height:28px;border-radius:50%;border:1.5px solid ${RING};background:${BP};font:800 14px/25px var(--f-display);text-align:center;color:${BPINK}}
.sb-ttl{display:block;margin-top:5px;font:400 10.5px/1.15 var(--f-ui);text-align:center;hyphens:auto;-webkit-hyphens:auto}
.sb-ls:hover .sb-chip{border-color:#fff;color:#fff}
.sb-ls:hover .sb-ttl{color:#fff;text-decoration:underline}
.sb-ls[aria-expanded="true"] .sb-chip{background:#fff;color:${BP};border-color:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.25)}
.sb.has-pv.is-docked .sb-ls:not([aria-expanded="true"]),.sb.has-pv.is-docked .sb-gname,.sb.has-pv.is-docked .sb-hintc{opacity:.65}
.sb.is-sheet .sb-grp{display:block;margin-bottom:14px}
.sb.is-sheet .sb-gname{margin:0 0 6px;padding-left:30px}
.sb.is-sheet .sb-row{justify-content:flex-start;margin-bottom:8px}
.sb.is-sheet .sb-ls{width:44px;height:44px;justify-content:center}
.sb.is-sheet .sb-chip{width:36px;height:36px;font-size:15px;line-height:33px}
.sb-pv{position:absolute;z-index:4;width:460px;background:#fff;color:var(--wr-ink);border-top:6px solid var(--wr-red);padding:18px 22px 16px;box-shadow:var(--shadow-3,0 30px 70px -20px rgba(0,0,0,.5));border-radius:2px}
.sb-pv[hidden]{display:none}
.sb .sb-pv-h{margin:0 44px 0 0;outline-offset:4px}
.sb-pv-e{display:flex;flex-wrap:wrap;gap:4px 10px;font:700 15px/1.1 var(--f-display);letter-spacing:.14em;text-transform:uppercase;color:var(--wr-red)}
.sb-pv-g{color:var(--wr-muted)}
.sb-pv-t{display:block;margin-top:5px;font:800 32px/1 var(--f-display);color:var(--wr-ink)}
.sb .sb-pv-sec{margin:13px 0 0;font:700 12px/1.1 var(--f-display);letter-spacing:.16em;text-transform:uppercase;color:var(--wr-muted)}
.sb .sb-pv ul{list-style:none;margin:6px 0 0;padding:0}
.sb-pv li{position:relative;padding-left:16px;font-size:14.5px;line-height:1.3}
.sb-pv li::before{content:'';position:absolute;left:0;top:.62em;width:8px;height:2px;background:var(--wr-red)}
.sb .sb-pv-by{margin:13px 0 0;font-size:14.5px;font-weight:600;line-height:1.3}
.sb .sb-pv-ex{margin:7px 0 0}
.sb-pv-ex [lang="to"]{display:block;font-size:20px;line-height:1.15}
.sb-pv-ex .e{display:block;margin-top:1px;font-size:13.5px;line-height:1.3;color:var(--wr-muted)}
.sb-close{position:absolute;right:8px;top:8px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:0;background:transparent;color:var(--wr-ink);font:400 26px/1 var(--f-ui);cursor:pointer;border-radius:2px}
.sb-close:hover{color:var(--wr-red-deep)}
.sb-nav{display:flex;align-items:stretch;gap:8px;margin:14px 0 0}
.sb-nav .sb-start{flex:1}
.sb-nav .sb-btn{background:#fff;color:var(--wr-ink);border-color:var(--home-rule,#cfcfcf)}
.sb-nav .sb-btn[hidden]{display:inline-flex;visibility:hidden}
.sb-start{display:flex;align-items:center;justify-content:center;min-height:48px;padding:0 10px;text-align:center;color:#fff;background:var(--wr-red);font-size:16px;font-weight:800;letter-spacing:.02em;border-radius:2px;text-decoration:none}
.sb-start:hover{background:var(--wr-red-deep)}
.sb .sb-pv :focus-visible,.sb.is-dark .sb-course .sb-pv :focus-visible{outline-color:var(--wr-red-deep)}
.sb .sb-keys{margin:8px 0 0;font-size:12px;color:var(--wr-muted);text-align:center}
.sb-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.sb-measure{position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap}
.sb.is-sheet .sb-pv{position:relative;width:auto;margin:2px 0 16px;padding:16px 16px 14px;box-shadow:0 18px 40px -18px rgba(0,0,0,.6)}
.sb.is-sheet .sb-pv-t{font-size:28px}
.sb.is-sheet .sb-pv li{font-size:14px}
.sb.is-sheet .sb-pv-by{font-size:14px}
.sb.is-sheet .sb-pv-ex [lang="to"]{font-size:19px}
.sb.is-sheet .sb-nav{flex-wrap:wrap}
.sb.is-sheet .sb-nav .sb-start{order:3;flex-basis:100%}
.sb.is-sheet .sb-nav [data-go="1"]{margin-left:auto}
.sb.is-narrow .sb-nav .sb-btn{padding:0 8px;font-size:12px}
.sb.is-narrow .sb-start{font-size:14px}
.sb.is-sheet .sb-keys{display:none}
.sb.is-mid .sj-t{font-size:48px}
.sb.is-mid .sj-en p{font-size:21px}
.sb.is-mid .sj-flag .ttl{font-size:30px}
.sb.is-narrow .sb-panel{padding:12px 6px 14px}
.sb.is-narrow .sb-hd{min-height:68px}
.sb.is-narrow .sb-ctl{width:100%}
.sb.is-narrow .sj-flag .e{font-size:11px}
.sb.is-narrow .sj-flag .ttl{margin-top:5px;font-size:24px;white-space:normal;line-height:.95}
.sb.is-narrow .sb-btn{padding:0 10px;font-size:12.5px}
.sb.is-narrow .sb-bphead h3{font-size:25px}
.sb.is-narrow .sj-t{font-size:32px}
.sb.is-narrow .sj-lab{font-size:9.5px;letter-spacing:.08em}
.sb.is-narrow .sj-en p{font-size:17px;line-height:1.35}
.sb.is-narrow .sb-course{padding:8px 4px 10px}
.sb.is-tiny .sj-t{font-size:27px}
.sb.is-tiny .sj-lab{font-size:8.5px;letter-spacing:.06em}
.sb.is-tiny .sb-btn{padding:0 8px;font-size:12px}
@media (hover:none){.sb-keys{display:none}}
@media (prefers-reduced-motion:reduce){.sb *{transition:none!important;animation:none!important}}
.sj-t>span{text-align:center}
.sb:not(.is-narrow) .sb-top{flex-wrap:nowrap}
.sb .sj-flag .ttl{white-space:normal;overflow:visible}
.sd-plant{position:absolute;inset:0;pointer-events:none}
.sd-stem{position:absolute;left:0;top:0;overflow:visible}
.sd-stem line,.sd-stem path{fill:none;stroke:var(--wr-red);stroke-width:2;stroke-linecap:round}
.sd-ring{position:absolute;left:0;top:0;width:28px;height:28px;border-radius:50%;border:2px solid var(--wr-red);opacity:0}
.sd-tip{position:absolute;left:0;top:0;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--wr-red);box-shadow:0 0 0 5px color-mix(in srgb,var(--wr-red) 18%,transparent)}
.sd-node{position:absolute;left:0;top:0;width:28px;height:28px;border-radius:50%;border:1.5px solid var(--wr-red);background:var(--wr-red);color:#fff;font:800 14px/25px var(--f-display);font-style:normal;text-align:center;will-change:transform,opacity}
.sd-node>span{display:block}
.sd-plant.is-list .sd-node{font-size:11.7px}
.sd-leaf{position:absolute;left:0;top:0;display:flex;flex-wrap:wrap;align-items:baseline;column-gap:10px;transform-origin:0 0;will-change:transform,opacity}
.sd-leaf>span{white-space:nowrap}
.sd-leaf .t{font-size:17px;line-height:1.3;color:var(--wr-ink)}
.sd-leaf .t b{font-weight:inherit;color:var(--wr-red-deep)}
.sd-leaf .e{font-size:14px;line-height:1.3;color:var(--wr-muted)}
.sd-leaf .w{position:absolute;inset:-1px -6px;z-index:-1;border-radius:3px;background:var(--wr-red-pale,#ffe2e0);opacity:0}
.sd-leaf.run{max-width:none!important}
.sd-leaf.run .t{font-size:13.5px;line-height:1.1}
.sd-leaf.run .t b{color:inherit}
.sd-leaf.run .e{display:none}
.sb.is-narrow .sd-leaf .t{font-size:15px}
.sb.is-narrow .sd-leaf .e{font-size:12.5px}
.sb.is-narrow .sd-leaf.run .t{font-size:13.5px}
.sd-bloom{position:absolute;left:0;top:0;z-index:2;padding:11px 20px 13px;border-top:4px solid var(--wr-red);border-radius:2px;background:#fff;box-shadow:0 20px 46px -20px rgba(0,0,0,.5),0 0 0 1px rgba(0,0,0,.07);text-align:center;transform-origin:0 0;will-change:transform,opacity}
.sd-bloom .k{display:block;font:800 12px/1 var(--f-display);letter-spacing:.16em;text-transform:uppercase;color:var(--wr-red)}
.sd-bloom .t{margin:7px 0 0;font-size:34px;line-height:1.15;color:var(--wr-ink);white-space:nowrap}
.sd-bloom .e{margin:5px 0 0;font-size:17px;line-height:1.3;color:var(--wr-muted)}
.sb.is-mid .sd-bloom .t{font-size:28px}
.sb.is-narrow .sd-bloom{padding:10px 14px 12px}
.sb.is-narrow .sd-bloom .t{font-size:23px;white-space:normal}
.sb.is-narrow .sd-bloom .e{font-size:15px}
.sd-bench{display:inline-flex;align-items:center;gap:8px;font:600 12px/1 var(--f-ui);color:var(--wr-muted)}
.sd-bench input{width:220px}
`

let styleEl = null, styleRefs = 0, uid = 0
const instances = new Set()

export function mount(el, options = {}) {
  if (!el) throw new Error('mount needs an element')
  for (const inst of instances) if (inst.el === el) inst.destroy()
  const opt = { lessonHref: n => `/lessons/${n}`, onNavigate: null, startRatio: 0.6, ...options }
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
  const reduced = opt.reducedMotion ?? (mq ? mq.matches : false)

  if (!styleEl) { styleEl = document.createElement('style'); styleEl.setAttribute('data-sentence-seed', ''); styleEl.textContent = CSS; document.head.appendChild(styleEl) }
  styleRefs++

  // ---------- DOM ----------
  const root = h('div', 'sb')
  root.setAttribute('role', 'group')
  root.setAttribute('aria-label', 'A preview of the course: one sentence changes and grows lesson by lesson, the sentences it leaves behind hang as leaves, a vine grows on through the 52 lessons with a sentence at each, then the course map, each lesson open to preview')
  const panel = h('div', 'sb-panel')
  const ground = h('div', 'sb-ground'); ground.setAttribute('aria-hidden', 'true')
  const top = h('div', 'sb-top')
  const hd = h('div', 'sb-hd')
  const flag = h('div', 'sj-flag', '<span class="fa"><span class="e"></span><span class="ttl"></span></span><span class="fb"><span class="e"></span><span class="ttl"></span></span>')
  flag.setAttribute('aria-hidden', 'true')
  const flagA = flag.children[0], flagB = flag.children[1]
  const chead = h('div', 'sb-bphead', '<p class="eb">The course</p><h3>Lessons 1 to 52, in order.</h3>')
  hd.append(flag, chead)
  const ctl = h('div', 'sb-ctl')
  const bPause = h('button', 'sb-btn', 'Pause'); bPause.type = 'button'
  const bReplay = h('button', 'sb-btn', 'Replay'); bReplay.type = 'button'
  const bSkip = h('button', 'sb-btn', 'Skip to the course view'); bSkip.type = 'button'
  ctl.append(bPause, bReplay, bSkip)
  top.append(hd, ctl)
  const stage = h('div', 'sb-stage'); stage.setAttribute('data-stage', '')
  // the sentence that changes and grows
  const sent = h('div', 'sj-sent'); sent.setAttribute('aria-hidden', 'true')
  const ghost = h('div', 'sj-ghost'), line = h('div', 'sj-line'), enBox = h('div', 'sj-en', '<p class="ea"></p><p class="eb" data-en></p>')
  line.setAttribute('data-to', ''); line.setAttribute('lang', 'to')
  const enA = enBox.children[0], enB = enBox.children[1]
  sent.append(ghost, line, enBox)
  // the plant: the stem, a node for each lesson, the growing tip, the leaves, and the sentence that opens large at a stop
  const plant = h('div', 'sd-plant'); plant.setAttribute('aria-hidden', 'true')
  const stemSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); stemSvg.setAttribute('class', 'sd-stem')
  const svgEl = tag => document.createElementNS('http://www.w3.org/2000/svg', tag)
  const segs = []
  for (let k = 1; k <= 51; k++) { const ln = svgEl('line'), pa = svgEl('path'); stemSvg.append(ln, pa); segs[k] = { ln, pa } }
  const stalk = svgEl('line'), shoot = svgEl('path'); stemSvg.append(stalk, shoot)
  const ring = h('i', 'sd-ring'), tip = h('i', 'sd-tip')
  plant.append(stemSvg, ring, tip)
  const nodes = []
  for (let n = 1; n <= 52; n++) { const nd = h('i', 'sd-node', `<span>${n}</span>`); nd.dataset.n = n; plant.append(nd); nodes[n] = nd }
  const leafHtml = (r, hot) => {
    const ws = wordsOf(r)
    return `<span class="w"></span><span class="t" data-to lang="to">${ws.map((w, j) => (hot && hot[j] ? `<b>${esc(w[0])}</b>` : esc(w[0]))).join(' ')}${esc(r.punct || '')}</span><span class="e" data-en>${esc(r.en)}</span>`
  }
  const leaves = [], runLeaf = []
  for (const f of FAMILY) {
    const r = ROWS[f.row], e = h('div', 'sd-leaf', leafHtml(r, f.hot)); e.dataset.row = r.id
    const L = { id: r.id, lesson: f.lesson, el: e, tEl: e.children[1], enEl: e.children[2], washEl: e.children[0], fam: f, run: null, op: 0, isRun: null }
    if (LEAF[f.lesson] === r.id) runLeaf[f.lesson] = L
    leaves.push(L); plant.append(e)
  }
  for (const Ls of LESSONS) {
    if (runLeaf[Ls.n]) continue
    const r = ROWS[LEAF[Ls.n]], e = h('div', 'sd-leaf run', leafHtml(r, null)); e.dataset.row = r.id
    const L = { id: r.id, lesson: Ls.n, el: e, tEl: e.children[1], enEl: e.children[2], washEl: e.children[0], fam: null, run: null, op: 0, isRun: true, stop: STOPS.findIndex(s => s.lesson === Ls.n) }
    runLeaf[Ls.n] = L; leaves.push(L); plant.append(e)
  }
  for (const L of leaves) if (L.tEl.textContent !== ROWS[L.id].to || L.enEl.textContent !== ROWS[L.id].en) throw new Error('a leaf does not carry its row whole: ' + L.id)
  const bloom = h('div', 'sd-bloom', '<span class="k"></span><p class="t"><span data-to lang="to"></span></p><p class="e" data-en></p>')
  const bloomK = bloom.children[0], bloomTo = bloom.children[1].firstChild, bloomEn = bloom.children[2]
  plant.append(bloom)
  const course = h('div', 'sb-course'); course.setAttribute('role', 'group'); course.setAttribute('aria-label', 'The 52 lessons, in six parts')
  stage.append(sent, plant, course)
  panel.append(ground, top, stage)
  const pv = h('aside', 'sb-pv')
  pv.setAttribute('aria-labelledby', 'sb-pv-h-' + (++uid))
  pv.hidden = true
  const live = h('div', 'sb-sr'); live.setAttribute('aria-live', 'polite')
  const measure = h('div', 'sb-measure'); measure.setAttribute('aria-hidden', 'true')
  root.append(panel, pv, live, measure)
  el.append(root)
  const pvId = pv.getAttribute('aria-labelledby')
  // a scrub bar for timing work, only when the address carries ?bench
  let benchIn = null, benchOut = null
  if (typeof location !== 'undefined' && /[?&]bench(=|&|$)/.test(location.search)) {
    const b = h('label', 'sd-bench', `<input type="range" min="0" max="${END}" step="0.05" value="0" aria-label="Time in the film"><output>0.0 s</output>`)
    benchIn = b.firstChild; benchOut = b.lastChild; ctl.append(b)
  }

  // ---------- state ----------
  let t = 0, mode = reduced ? 'end' : 'play', playing = false, userPaused = false, autoPaused = false, inView = false
  let raf = 0, last = 0, W = 0, geo = null, stepIdx = -1, step = null, selected = 0, pvOpen = false, destroyed = false
  let chips = [], courseKey = '', chipPos = [], flagN = -1, enKey = '', lastY0 = 0, sentOp = 0, bloomOp = 0, panX = 0, sentFoot = 0, regrown = false
  const rafReq = cb => (raf = requestAnimationFrame(cb))

  // ---------- geometry ----------
  function classify() {
    W = stage.clientWidth || root.clientWidth || 1
    const c = W >= 900 ? 'wide' : W >= 600 ? 'mid' : 'narrow'
    root.classList.toggle('is-narrow', c === 'narrow')
    root.classList.toggle('is-mid', c === 'mid')
    root.classList.toggle('is-tiny', W < 340)
    const narrow = c === 'narrow', courseWide = c === 'wide'
    root.classList.toggle('is-sheet', !courseWide)
    const perRow = Math.max(4, Math.floor((W - 8 + 10) / (44 + 10)))
    geo = { c, narrow, courseWide, perRow, playH: c === 'wide' ? 560 : c === 'mid' ? 520 : 470 }
    geo.fs = parseFloat(getComputedStyle(measureSpan()).fontSize) || 60
    geo.labH = narrow ? 16 : 18
    // the gap between words is the font's own word space, so the line reads as set type
    widthCache.clear()
    geo.gap = Math.max(Math.round(geo.fs * 0.2), wordWidth(' ') + (narrow ? 2 : 4))
    geo.spaceW = wordWidth(' ')
    geo.maxW = W - (narrow ? 20 : 72)
    geo.lineH = Math.round(geo.fs * 1.15)
    geo.pitch = geo.labH + 6 + geo.lineH + (narrow ? 10 : 14)
    // the header is as tall as the longest title the film shows needs, so the stage never moves when the lesson changes
    hd.style.minHeight = ''
    let flagH = 0
    for (const n of new Set(FLAGS.map(f => f.lesson))) { flagB.innerHTML = flagHtml(n); flagH = Math.max(flagH, flag.offsetHeight) }
    flagB.innerHTML = ''; flagN = -1
    if (flagH) hd.style.minHeight = flagH + 'px'
    buildCourse()
    layoutCourse()
    if (courseWide) geo.playH = Math.max(geo.playH, geo.courseH, measurePvMax() + 16)
    geo.H = geo.playH
    layoutPlant()
    if (pvOpen) renderPv(false)
  }
  let measureSpanEl = null
  function measureSpan() {
    if (!measureSpanEl) { measureSpanEl = h('span', 'sj-t'); measureSpanEl.setAttribute('lang', 'to'); measureSpanEl.style.position = 'static'; measureSpanEl.style.display = 'inline-block'; measure.append(measureSpanEl) }
    return measureSpanEl
  }
  const widthCache = new Map()
  function wordWidth(text) {
    const key = geo.c + (W < 340 ? 't' : '') + '|' + text
    if (widthCache.has(key)) return widthCache.get(key)
    const s = measureSpan(); s.textContent = text
    const w = Math.ceil(s.getBoundingClientRect().width)
    widthCache.set(key, w); return w
  }
  // a part label's width, and a slot's width: its word's, or its label's when the label is the wider of the two
  let measureLabEl = null
  function labWidth(text) {
    const key = geo.c + (W < 340 ? 't' : '') + '|lab|' + text
    if (widthCache.has(key)) return widthCache.get(key)
    if (!measureLabEl) { measureLabEl = h('span', 'sj-lab'); measureLabEl.style.position = 'static'; measureLabEl.style.display = 'inline-block'; measure.append(measureLabEl) }
    measureLabEl.textContent = text
    const w = Math.ceil(measureLabEl.getBoundingClientRect().width)
    widthCache.set(key, w); return w
  }
  const slotW = (text, lab) => (text ? Math.max(wordWidth(text), lab ? labWidth(lab) - 4 : 0) : 0)
  const rowWidths = r => { const ws = wordsOf(r); return displayWords(r).map((w, i) => slotW(w, ws[i][1])) }
  // the English line's height at this width: the same box as the live one (a grid as wide as the stage, the text centred in it)
  function enHeight(text) {
    const box = h('div', 'sj-en'); box.style.position = 'static'; box.style.width = W + 'px'
    box.innerHTML = `<p style="white-space:normal">${esc(text)}</p>`
    measure.append(box); const hh = box.firstChild.offsetHeight; box.remove(); return hh
  }
  function measurePvMax() {
    if (!geo.courseWide) return 0
    const keep = { sel: selected, open: pvOpen, hidden: pv.hidden, vis: pv.style.visibility }
    pv.hidden = false; pv.style.visibility = 'hidden'
    let mx = 0
    for (const L of LESSONS) { pv.innerHTML = pvHtml(L.n); mx = Math.max(mx, pv.offsetHeight) }
    pv.style.visibility = keep.vis; pv.hidden = keep.hidden
    if (keep.open) pv.innerHTML = pvHtml(keep.sel)
    return mx
  }

  // ---------- the plant's geometry: where each lesson's node and each leaf sits, close up and pulled back ----------
  // On the map (plate): the lessons sit where the course view's own chips sit, and each keeps its leaf under it, at one of two
  // depths so neighbours never touch. Returns false when the leaves do not fit this width.
  function platePlan() {
    const rows = geo.rowsOf
    for (let ri = 0; ri < rows.length; ri++) {
      const ns = rows[ri], lastN = ns[ns.length - 1]
      // the road turns down just right of a row's last lesson: that lesson's leaf stays clear of the turn
      const xr = ri < rows.length - 1 ? geo.courseOff.x + chipPos[lastN - 1].x + chips[lastN - 1].offsetWidth / 2 + 6 : W - 4
      for (const lvl of [0, 1]) {
        // the leaves at one depth, each centred under its lesson, then eased apart where two would touch
        const reach = ns.length > 1 ? Math.max(16, 0.45 * (chipPos[ns[1] - 1].x - chipPos[ns[0] - 1].x)) : 40
        const it = ns.filter((n, i) => i % 2 === lvl).map(n => {
          const L = runLeaf[n], w = L.runW, nx = geo.courseOff.x + chipPos[n - 1].x, edgeLo = w / 2 + 4, edgeHi = Math.min(W - 4, xr) - w / 2
          const home = clamp(nx, edgeLo, Math.max(edgeLo, edgeHi))
          return { L, w, y: geo.courseOff.y + chipPos[n - 1].y, lo: Math.max(edgeLo, Math.min(home, nx - reach)), hi: Math.min(Math.max(edgeLo, edgeHi), Math.max(home, nx + reach)), cx: home }
        })
        const gap = (a, b) => (a.w + b.w) / 2 + 8
        for (const a of it) a.cx = clamp(a.cx, a.lo, a.hi)
        for (let i = 1; i < it.length; i++) it[i].cx = Math.min(it[i].hi, Math.max(it[i].cx, it[i - 1].cx + gap(it[i - 1], it[i])))
        for (let i = it.length - 2; i >= 0; i--) it[i].cx = Math.max(it[i].lo, Math.min(it[i].cx, it[i + 1].cx - gap(it[i], it[i + 1])))
        for (let i = 1; i < it.length; i++) if (it[i].cx - it[i - 1].cx < gap(it[i - 1], it[i]) - 0.5) return false
        for (const a of it) a.L.plate = { x: a.cx - a.w / 2, y: a.y + geo.chipR + 3 + lvl * 15 }
      }
    }
    return true
  }
  // the road's own turn from the last lesson of a row to the first of the next, in stage coordinates (as layoutCourse draws it)
  function connector(k, rowBottom) {
    const o = geo.courseOff, b = { x: o.x + chipPos[k - 1].x, y: o.y + chipPos[k - 1].y }, c = { x: o.x + chipPos[k].x, y: o.y + chipPos[k].y }
    const gy = o.y + rowBottom + 9, bend = 18, xr = b.x + chips[k - 1].offsetWidth / 2 + 12
    return `M${b.x.toFixed(1)} ${b.y.toFixed(1)} L${(xr - 10).toFixed(1)} ${b.y.toFixed(1)} Q${xr.toFixed(1)} ${b.y.toFixed(1)} ${xr.toFixed(1)} ${(b.y + 10).toFixed(1)} L${xr.toFixed(1)} ${(gy - 10).toFixed(1)} Q${xr.toFixed(1)} ${gy.toFixed(1)} ${(xr - 10).toFixed(1)} ${gy.toFixed(1)} L${c.x.toFixed(1)} ${gy.toFixed(1)} C${(c.x - bend).toFixed(1)} ${gy.toFixed(1)} ${(c.x - bend).toFixed(1)} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`
  }
  function layoutPlant() {
    const g = geo, H = g.playH
    g.leafRun = 13.5
    g.minPx = (window.innerWidth || W) < 360 ? 12 : 13
    // each leaf's own size: as it hangs close up (Tongan and English) and as it sits on the vine (Tongan alone)
    for (const L of leaves) {
      const e = L.el
      e.style.transform = ''; e.style.maxWidth = ''
      e.classList.add('run'); L.runW = e.offsetWidth; L.runH = e.offsetHeight
      e.classList.toggle('run', !L.fam); L.isRun = !L.fam
    }
    g.leafRead = leaves[0] ? parseFloat(getComputedStyle(leaves[0].tEl).fontSize) || 17 : 17
    g.plate = g.courseWide && platePlan()
    plant.classList.toggle('is-list', !g.plate)
    // the sentence's own zone at the top of the stage, tall enough for the longest line the film shows
    const enGap = g.narrow ? 14 : 20
    let block = 0
    const blocks = SCRIPT.map(s => {
      const r = ROWS[s.row], LB = layoutWords(rowWidths(r)), enH = enHeight(r.en)
      block = Math.max(block, LB.h + enGap + enH)
      return { LB, enH, hLab: wordsOf(r).some(w => w[1]) ? g.labH + 6 : 0 }
    })
    g.zoneH = g.plate ? Math.round(Math.max(block + 56, H * 0.5)) : Math.round(block + (g.narrow ? 26 : 44))
    // where each step's sentence stands on the line at rest: a leaf leaves from there, at the line's own size
    g.mainAt = blocks.map(b => { const y0 = Math.max(8, (g.zoneH - (b.LB.h + enGap + b.enH)) / 2 - (g.narrow ? 2 : 10)); return { x: b.LB.pos[0].x, y: y0 + b.hLab - g.fs * 0.075 } })
    const read = g.read = [], run = g.run = []
    const famOf = n => leaves.filter(L => L.fam && L.lesson === n)
    if (g.plate) {
      for (let n = 1; n <= 52; n++) run[n] = { x: g.courseOff.x + chipPos[n - 1].x, y: g.courseOff.y + chipPos[n - 1].y }
      // close up: Lessons 1 to 4 along one line, four buds, then Lesson 9
      const sy = g.zoneH + 36, fx = [0, 0.062, 0.292, 0.538, 0.752]
      for (let n = 1; n <= 4; n++) read[n] = { x: W * fx[n], y: sy }
      for (let n = 5; n <= 9; n++) read[n] = { x: lerp(read[4].x, W * 0.945, (n - 4) / 5), y: sy }
      for (let n = 10; n <= 52; n++) read[n] = run[n]
      for (let n = 1; n <= 4; n++) {
        const x = read[n].x - 13, nextX = n < 4 ? read[n + 1].x - 13 : W - 6
        let y = sy + 27
        for (const L of famOf(n)) { L.el.style.maxWidth = Math.max(120, nextX - x - 16) + 'px'; L.read = { x, y, h: L.el.offsetHeight, w: L.el.offsetWidth }; y += L.read.h + 5 }
      }
      // close up, the view keeps what has grown so far in the middle of the stage: Lesson 1 alone, then 1 and 2, then 1 to 3, then all
      const left = read[1].x - 14, right = n => Math.max(read[n].x + 14, ...famOf(n).map(L => L.read.x + L.read.w))
      const centre = n => W / 2 - (left + right(n)) / 2
      g.pan = [{ t: 0, dx: centre(1) }, ...[2, 3, 4].map(n => ({ t: SCRIPT.find(s => s.lesson === n).t, dx: n < 4 ? centre(n) : 0 }))]
      for (const L of leaves) if (L.plate) L.run = L.plate
      g.nodeRead = 1; g.nodeRun = 1; g.budK = 0.36; g.S1 = SCRIPT.map(() => 0)
    } else {
      // a list: the stem runs down the left of the stage, each lesson a row, its leaf to the right of its node
      const sx = g.narrow ? 20 : 34, leafX = sx + 24, pitch = g.narrow ? 22 : 24
      for (let n = 1; n <= 52; n++) run[n] = { x: sx, y: 20 + (n - 1) * pitch }
      let y = g.zoneH + 14
      for (let n = 1; n <= 4; n++) {
        const col = famOf(n)
        read[n] = { x: sx, y: y + 10 }
        for (const L of col) { L.el.style.maxWidth = (W - leafX - 6) + 'px'; L.read = { x: leafX, y, h: L.el.offsetHeight }; y += L.read.h + 3 }
        y += 9
      }
      for (let n = 5; n <= 8; n++) { read[n] = { x: sx, y: y + 3 }; y += 10 }
      read[9] = { x: sx, y: y + 14 }
      for (let n = 10; n <= 52; n++) read[n] = run[n]
      for (const L of leaves) if (runLeaf[L.lesson] === L) L.run = { x: leafX, y: run[L.lesson].y - L.runH / 2 }
      g.nodeRead = 22 / 28; g.nodeRun = 20 / 28; g.budK = 0.3; g.pan = [{ t: 0, dx: 0 }]
      // close up, the view follows the tip down: for each step, how far the plant has slid up under the sentence
      let s1 = 0
      g.S1 = SCRIPT.map((s, i) => {
        let bottom = read[s.lesson].y + 16
        for (const L of famOf(s.lesson)) if (L.fam.step <= i) bottom = Math.max(bottom, L.read.y + L.read.h + 4)
        s1 = Math.max(s1, bottom - (H - 10)); return s1
      })
    }
    // the stem: straight from lesson to lesson; on the map, the road's own turn at the end of each row
    const rowOf = []; g.rowsOf.forEach((ns, ri) => ns.forEach(n => { rowOf[n] = ri }))
    const cr = course.getBoundingClientRect(), bottoms = [...course.querySelectorAll('.sb-row')].map(r => r.getBoundingClientRect().bottom - cr.top)
    g.cum = [0, 0]
    for (let k = 1; k <= 51; k++) {
      const S = segs[k]
      S.d = g.plate && rowOf[k] !== rowOf[k + 1] ? connector(k, bottoms[rowOf[k]]) : ''
      S.pa.setAttribute('d', S.d)
      S.len = S.d ? S.pa.getTotalLength() : Math.hypot(run[k + 1].x - run[k].x, run[k + 1].y - run[k].y)
      if (S.d) S.pa.style.strokeDasharray = `${S.len.toFixed(1)} ${S.len.toFixed(1)}`
      g.cum[k + 1] = g.cum[k] + S.len
    }
    // when the tip reaches each lesson
    g.arrive = new Array(53).fill(0)
    for (let tt = 0, was = 1; tt <= WHOLE.start; tt += 1 / 120) { const v = tipAt(tt); for (let n = Math.max(2, Math.ceil(was + 0.02)); n <= 52 && v >= n - 0.02; n++) if (was < n - 0.02) g.arrive[n] = tt; was = v }
    // the sentence that opens large at each stop: when it opens and closes, and its size
    g.bloom = STOPS.map((s, i) => {
      const end = STOPS[i + 1] ? STOPS[i + 1].t : WHOLE.start, open0 = g.arrive[s.lesson] - 0.08
      fillBloom(i)
      bloom.style.transform = ''; bloom.style.maxWidth = g.plate ? '' : (W - 12) + 'px'
      const tr = bloomTo.getBoundingClientRect(), br = bloom.getBoundingClientRect()
      return { open0, open1: open0 + 0.42, close0: end - 0.3, close1: end + 0.1, w: bloom.offsetWidth, h: bloom.offsetHeight, tx: tr.left - br.left, ty: tr.top - br.top, fs: parseFloat(getComputedStyle(bloomTo).fontSize) || 34 }
    })
    bloom.dataset.row = ''; bloom.dataset.i = ''
    // where each lesson's node stands when the fold begins: the course view's chips start from there
    panX = 0; regrown = true
    const Sf = scrollAt(FOLD.start, 1, 52)
    g.foldFrom = []; for (let n = 1; n <= 52; n++) g.foldFrom[n] = nodeXY(n, 1, Sf)
    g.foldK = g.plate ? 1 : 28 * g.nodeRun / (chips[0].firstChild.offsetWidth || 36)
  }
  function fillBloom(i) {
    if (bloom.dataset.i === String(i)) return
    const s = STOPS[i], r = ROWS[s.row]
    bloom.dataset.i = i; bloom.dataset.row = r.id
    bloomK.textContent = 'Lesson ' + s.lesson; bloomTo.textContent = r.to; bloomEn.textContent = r.en
  }

  // ---------- the plant in time ----------
  const pullAt = tt => smooth(span(PULL.start, PULL.start + REGROW, tt))
  // the tip as a lesson number; on the road it moves by distance, so a long turn between rows takes its share of the time
  function tipAt(tt) {
    let v = 1
    for (const tr of TRAVEL) {
      if (tt < tr.t0) break
      const u = smooth(span(tr.t0, tr.t1, tt))
      if (!tr.road) { v = lerp(tr.from, tr.to, u); continue }
      const D = lerp(geo.cum[tr.from], geo.cum[tr.to], u)
      let k = tr.from; while (k < tr.to - 1 && geo.cum[k + 1] <= D) k++
      v = k + clamp((D - geo.cum[k]) / Math.max(1e-6, geo.cum[k + 1] - geo.cum[k]))
    }
    return v
  }
  // a list slides up as it grows, so the tip stays in view (on the map nothing slides)
  function scrollAt(tt, p, v) {
    const g = geo
    if (g.plate) return 0
    const i = stepAt(tt), s = SCRIPT[i]
    const s1 = lerp(i ? g.S1[i - 1] : 0, g.S1[i], smooth(span(s.t, s.t + 0.6, tt)))
    if (p <= 0) return s1
    const k = clamp(Math.floor(v), 1, 51), ty = lerp(g.run[k].y, g.run[k + 1].y, clamp(v - k))
    const anchor = lerp(g.playH * 0.5, g.playH - 34, smooth(span(WHOLE.start, WHOLE.start + 0.8, tt)))
    return lerp(s1, Math.max(0, ty - anchor), p)
  }
  function panAt(tt) { const P = geo.pan; let dx = P[0].dx; for (let i = 1; i < P.length; i++) dx = lerp(dx, P[i].dx, smooth(span(P[i].t, P[i].t + 0.9, tt))); return dx }
  // Lessons 5 to 9 are buds on the close-up line until the stem draws back; after that they stand in their own places on the vine
  const nodeXY = (n, p, S) => { const q = regrown && n >= 5 ? 1 : p; return { x: lerp(geo.read[n].x + (n <= 9 ? panX : 0), geo.run[n].x, q), y: lerp(geo.read[n].y, geo.run[n].y, q) - S } }
  // in a list, what slides up under the sentence fades at the zone's edge
  // (close up the edge is the foot of the sentence's zone; pulled back it is the top of the stage, where a row is gone before it is cut)
  const edgeFade = (y, p) => (geo.plate ? 1 : smooth(span(lerp(geo.zoneH - 4, -6, p), lerp(geo.zoneH + 12, 12, p), y)))
  function leafFrame(L, tt, p, S) {
    const g = geo
    let op, x, y, k = 1, enOp = 0, run = false, wash = 0, ws = 0
    if (L.fam && p < 0.999) {
      // hung close up: it leaves the line where the sentence stood, at the line's size, and settles under its lesson
      const f = L.fam
      if (tt < f.shed) return null
      const u = span(f.shed, f.shed + 0.62, tt), e = out3(u), from = g.mainAt[f.step]
      x = lerp(from.x, L.read.x + panX, e); y = lerp(from.y, L.read.y - S, e); k = lerp(g.fs / g.leafRead, 1, e)
      // it shows once it has dropped clear of the line, so the line is never doubled
      op = smooth(span(0.04, 0.28, u)); enOp = smooth(span(0.45, 0.9, u)); ws = (g.gap - g.spaceW) * (1 - e) / k
      wash = 0.85 * smooth(span(0.35, 0.7, u)) * (1 - smooth(span(f.shed + 0.7, f.shed + 1.7, tt)))
      for (const pt of f.pulses) wash = Math.max(wash, 0.9 * bump(span(pt, pt + 0.9, tt)))
      if (p > 0) {
        if (L.run) { x = lerp(x, L.run.x, p); y = lerp(y, L.run.y - S - (g.leafRun * 1.3 - L.runH) / 2, p); k = lerp(1, g.leafRun / g.leafRead, p); enOp *= 1 - smooth(span(0, 0.5, p)) }
        else { const nd = nodeXY(L.lesson, p, S), q = smooth(span(0, 0.75, p)); x = lerp(x, nd.x, q); y = lerp(y, nd.y - 6, q); k = lerp(1, 0.5, q); op *= 1 - smooth(span(0.05, 0.6, p)); enOp *= 1 - smooth(span(0, 0.4, p)) }
      }
    } else if (L.run) {
      // the one leaf a lesson keeps on the vine
      run = true; x = L.run.x; y = L.run.y - S
      const n = L.lesson
      if (L.fam) op = 1
      else if (n === 9) {
        // the big sentence closes into this leaf
        // it shrinks first, where it stands, then glides to its place as the stem grows on to meet it
        const u = span(PULL.start, g.arrive[9] + 0.05, tt), e = smooth(u), es = out3(u * 2.2), from = g.mainAt[SCRIPT.length - 1]
        x = lerp(from.x, x, e); y = lerp(from.y + g.fs * 0.1, y, e); k = lerp(g.fs / g.leafRun, 1, es); op = smooth(span(0.03, 0.2, u)); ws = (g.gap - g.spaceW) * (1 - es) / k
      } else if (n < 9) op = smooth(span(g.arrive[n] + 0.02, g.arrive[n] + 0.2, tt))
      else if (L.stop >= 0) { const B = g.bloom[L.stop]; op = smooth(span(B.close0 + 0.14, B.close1, tt)) }
      else { op = smooth(span(g.arrive[n], g.arrive[n] + 0.3, tt)); y -= 5 * (1 - op) }
      if (tt >= FOLD.start) { const q = smooth(span(FOLD.start + partOf(n) * 0.03, FOLD.start + partOf(n) * 0.03 + 0.42, tt)); op *= 1 - q; y -= 7 * q }
    } else return null
    op *= edgeFade(y + 8, p)
    return { op, x, y, k, enOp, run, wash, ws }
  }
  function renderPlant(tt) {
    const g = geo
    if (tt >= FOLD.start + 0.62) { plant.style.visibility = 'hidden'; plant.style.opacity = 0; bloomOp = 0; for (const L of leaves) L.op = 0; return }
    plant.style.visibility = 'visible'; plant.style.opacity = 1
    panX = panAt(tt); regrown = tt >= PULL.start + 0.3
    const p = pullAt(tt), v = tipAt(tt), S = scrollAt(tt, p, v), folding = tt >= FOLD.start
    // the lessons' nodes: the seed first, then each as the stem reaches it; a bud has no number until the view pulls back
    for (let n = 1; n <= 52; n++) {
      const e = nodes[n], st = e.style
      let op = n === 1 ? out3(span(0.08, 0.45, tt)) : smooth(span(n - 0.3, n - 0.02, v))
      if (folding) op = 0
      const pos = nodeXY(n, p, S)
      op *= edgeFade(pos.y, p)
      if (op <= 0.003) { st.visibility = 'hidden'; continue }
      const bud = n >= 5 && n <= 8 && !regrown
      let k = n >= 5 && n <= 9 ? (regrown ? g.nodeRun : bud ? g.budK : g.nodeRead) : lerp(g.nodeRead, g.nodeRun, p)
      k *= n === 1 ? lerp(0.2, 1, backOut(span(0.08, 0.62, tt))) : lerp(0.5, 1, smooth(span(n - 0.3, n, v)))
      st.visibility = 'visible'; st.opacity = op.toFixed(3)
      st.transform = `translate(${(pos.x - 14).toFixed(1)}px,${(pos.y - 14).toFixed(1)}px) scale(${k.toFixed(3)})`
      e.firstChild.style.opacity = bud ? '0' : ''
    }
    // the seed's ring, once
    const rg = span(0.3, 1.35, tt)
    if (rg > 0 && rg < 1) { const s1 = nodeXY(1, 0, S); ring.style.visibility = 'visible'; ring.style.opacity = (0.55 * (1 - rg)).toFixed(3); ring.style.transform = `translate(${(s1.x - 14).toFixed(1)}px,${(s1.y - 14).toFixed(1)}px) scale(${lerp(0.8, 2.8, out3(rg)).toFixed(3)})` } else ring.style.visibility = 'hidden'
    // the stem, drawn as far as the tip has grown
    const stemOp = g.plate ? (folding ? 0 : 0.9) : 0.9 * (1 - smooth(span(FOLD.start, FOLD.start + 0.3, tt)))
    stemSvg.style.opacity = stemOp.toFixed(3)
    // in a list the stem stops at the foot of the sentence's zone, as the nodes and leaves do
    const cut = g.plate ? 0 : Math.max(0, lerp(g.zoneH + 4, -40, p))
    stemSvg.setAttribute('width', W); stemSvg.setAttribute('height', Math.ceil(stage.clientHeight || g.H)); stemSvg.style.clipPath = cut > 0 ? `inset(${cut.toFixed(1)}px 0px 0px 0px)` : ''
    const q = g.plate ? smooth(span(0.7, 1, p)) : 0
    let tipXY = nodeXY(1, p, S)
    for (let k = 1; k <= 51; k++) {
      const sg = segs[k], r = clamp(v - k)
      if (r <= 0.0005) { sg.ln.style.visibility = 'hidden'; sg.pa.style.visibility = 'hidden'; continue }
      const A = nodeXY(k, p, S), B = nodeXY(k + 1, p, S), turn = !!sg.d && q > 0.001
      const end = { x: lerp(A.x, B.x, r), y: lerp(A.y, B.y, r) }
      if (!turn || q < 0.999) {
        sg.ln.style.visibility = 'visible'; sg.ln.style.opacity = turn ? (1 - q).toFixed(3) : ''
        sg.ln.setAttribute('x1', A.x.toFixed(1)); sg.ln.setAttribute('y1', A.y.toFixed(1)); sg.ln.setAttribute('x2', end.x.toFixed(1)); sg.ln.setAttribute('y2', end.y.toFixed(1))
      } else sg.ln.style.visibility = 'hidden'
      if (turn) { sg.pa.style.visibility = 'visible'; sg.pa.style.opacity = q.toFixed(3); sg.pa.style.strokeDashoffset = (sg.len * (1 - r)).toFixed(1) } else sg.pa.style.visibility = 'hidden'
      if (r < 1 || k === 51) { if (turn && q >= 0.999) { const pt = sg.pa.getPointAtLength(sg.len * r); tipXY = { x: pt.x, y: pt.y } } else tipXY = end }
      else tipXY = B
    }
    // the growing tip
    const tipOp = (g.plate ? 1 : edgeFade(tipXY.y, p)) * smooth(span(0.5, 0.8, tt)) * (1 - smooth(span(WHOLE.start - 0.2, WHOLE.start + 0.2, tt)))
    tip.style.visibility = tipOp > 0.003 ? 'visible' : 'hidden'; tip.style.opacity = tipOp.toFixed(3)
    tip.style.transform = `translate(${tipXY.x.toFixed(1)}px,${tipXY.y.toFixed(1)}px)`
    // close up, a thin shoot joins the growing tip to the sentence above it: the sentence is what the tip is growing
    // (in a list it would cross the leaves, so there it shows for the seed alone)
    const shootOp = 0.5 * smooth(span(1.0, 1.6, tt)) * (1 - smooth(span(PULL.start - 0.15, PULL.start + 0.15, tt))) * (g.plate ? 1 : 1 - smooth(span(SCRIPT[1].t - 0.2, SCRIPT[1].t + 0.2, tt)))
    if (shootOp > 0.003 && sentFoot > 0) {
      const fx = W / 2, fy = sentFoot + 10, d = Math.max(18, Math.min(80, (tipXY.y - fy) * 0.55))
      shoot.style.visibility = 'visible'; shoot.style.opacity = shootOp.toFixed(3); shoot.style.strokeWidth = '1.5'
      shoot.setAttribute('d', `M${tipXY.x.toFixed(1)} ${tipXY.y.toFixed(1)} C${tipXY.x.toFixed(1)} ${(tipXY.y - d).toFixed(1)} ${fx.toFixed(1)} ${(fy + d).toFixed(1)} ${fx.toFixed(1)} ${fy.toFixed(1)}`)
    } else shoot.style.visibility = 'hidden'
    // the leaves
    for (const L of leaves) {
      const fr = leafFrame(L, tt, p, S), st = L.el.style
      if (!fr || fr.op <= 0.003) { st.visibility = 'hidden'; L.op = 0; continue }
      if (L.isRun !== fr.run) { L.el.classList.toggle('run', fr.run); L.isRun = fr.run }
      st.visibility = 'visible'; st.opacity = fr.op.toFixed(3)
      st.transform = `translate(${fr.x.toFixed(1)}px,${fr.y.toFixed(1)}px) scale(${fr.k.toFixed(4)})`
      L.enEl.style.opacity = fr.enOp.toFixed(3); L.washEl.style.opacity = fr.wash.toFixed(3); L.tEl.style.wordSpacing = fr.ws > 0.001 ? fr.ws.toFixed(3) + 'px' : ''
      L.op = fr.op
    }
    renderBloom(tt, S)
  }
  // at a stop one sentence opens large beside the tip, on a short stalk, then closes into that lesson's leaf
  function renderBloom(tt, S) {
    const g = geo
    let i = -1
    for (let k = 0; k < STOPS.length; k++) if (tt >= g.bloom[k].open0) i = k
    const B = i >= 0 ? g.bloom[i] : null
    if (!B || tt >= B.close1) { bloom.style.visibility = 'hidden'; stalk.style.visibility = 'hidden'; bloomOp = 0; return }
    fillBloom(i)
    bloom.style.maxWidth = g.plate ? '' : (W - 12) + 'px'
    const n = STOPS[i].lesson, nd = nodeXY(n, 1, S), L = runLeaf[n]
    const o = out3(span(B.open0, B.open1, tt)), c = smooth(span(B.close0, B.close1, tt))
    // open: above the lesson on the map, below the tip's row in a list
    let X = g.plate ? clamp(nd.x - B.w / 2, 8, W - B.w - 8) : clamp(L.run.x - 8, 6, Math.max(6, W - B.w - 6))
    let Y = g.plate ? nd.y + g.chipR + 39 : nd.y + 18
    if (g.plate && Y + B.h > g.H - 6) Y = nd.y - g.chipR - 14 - B.h
    const above = Y < nd.y
    let x, y, k
    if (c > 0) { const kc = g.leafRun / B.fs; k = lerp(1, kc, c); x = lerp(X, L.run.x - B.tx * kc, c); y = lerp(Y, L.run.y - S - B.ty * kc, c) }
    else { k = lerp(0.6, 1, o); x = nd.x + (X - nd.x) * k; y = nd.y + (Y - nd.y) * k }
    bloomOp = o * (1 - smooth(span(0.5, 1, c)))
    bloom.style.visibility = bloomOp > 0.003 ? 'visible' : 'hidden'; bloom.style.opacity = bloomOp.toFixed(3)
    bloom.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${k.toFixed(4)})`
    const so = o * (1 - smooth(span(0, 0.5, c)))
    stalk.style.visibility = so > 0.003 ? 'visible' : 'hidden'; stalk.style.opacity = so.toFixed(3)
    stalk.setAttribute('x1', nd.x.toFixed(1)); stalk.setAttribute('y1', nd.y.toFixed(1)); stalk.setAttribute('x2', clamp(nd.x, X + 14, X + B.w - 14).toFixed(1)); stalk.setAttribute('y2', (above ? Y + B.h : Y).toFixed(1))
  }

  // ---------- the header: lesson number and title ----------
  function flagHtml(n) { return `<span class="e">Lesson <b>${n}</b> of 52</span><span class="ttl" lang="en">${esc(LESSONS[n - 1].title)}</span>` }
  function renderFlag(tt) {
    let i = 0; while (i + 1 < FLAGS.length && tt >= FLAGS[i + 1].t) i++
    const s = FLAGS[i], p = FLAGS[i - 1]
    if (flagN !== s.lesson) { flagB.innerHTML = flagHtml(s.lesson); flagA.innerHTML = p ? flagHtml(p.lesson) : ''; flagN = s.lesson }
    // a lesson change: the old lines go up and out, then the new come up into their place; the header leaves before the turn
    const ua = p ? smooth(span(s.t, s.t + 0.22, tt)) : 1
    const ub = p ? smooth(span(s.t + 0.18, s.t + 0.5, tt)) : 1
    const uo = p ? 1 : out3(span(0.1, 0.6, tt))
    const gone = 1 - smooth(span(TURN.start, TURN.start + 0.25, tt))
    flagA.style.opacity = ((1 - ua) * gone).toFixed(3); flagA.style.visibility = ua < 0.997 && gone > 0.003 ? 'visible' : 'hidden'; flagA.style.transform = `translateY(${(-10 * ua).toFixed(1)}px)`
    flagB.style.opacity = (ub * uo * gone).toFixed(3); flagB.style.visibility = ub * uo * gone > 0.003 ? 'visible' : 'hidden'; flagB.style.transform = `translateY(${(10 * (1 - ub) + 8 * (1 - uo)).toFixed(1)}px)`
  }

  // ---------- the sentence (the journey's engine; it stands in its own zone at the top of the stage) ----------
  function stepAt(tt) { let i = 0; while (i + 1 < SCRIPT.length && tt >= SCRIPT[i + 1].t) i++; return i }
  const wordHtml = (text, label) => `<span class="sj-wash"></span>${label ? `<span class="sj-lab" data-label>${esc(label)}</span>` : ''}<span class="sj-t" lang="to"><span class="ta"></span><span class="tb"></span></span><i class="sj-u"></i>`
  // the words of a row as display strings: the row's punctuation rides on its last word
  const displayWords = r => { const ws = wordsOf(r); return ws.map((w, i) => (i === ws.length - 1 ? w[0] + r.punct : w[0])) }
  // a line layout for the given widths: greedy wrap into geo.maxW, each line centred on the stage
  function layoutWords(ws) {
    const lines = [[]]; let x = 0
    ws.forEach((w, i) => { if (w > 0 && x > 0 && x + w > geo.maxW) { lines.push([]); x = 0 } lines[lines.length - 1].push(i); if (w > 0) x += w + geo.gap })
    const pos = new Array(ws.length)
    lines.forEach((ln, li) => {
      const live = ln.filter(i => ws[i] > 0)
      const tot = live.reduce((a, i, k) => a + ws[i] + (k < live.length - 1 ? geo.gap : 0), 0)
      let xx = (W - tot) / 2
      ln.forEach(i => { pos[i] = { x: xx, y: li * geo.pitch }; if (ws[i] > 0) xx += ws[i] + geo.gap })
    })
    return { pos, h: lines.length * geo.pitch - (geo.narrow ? 10 : 14) }
  }
  // build the cells for step i: the union of its slots and the previous step's, typed by what happens to each
  function buildStep(i) {
    const s = SCRIPT[i], p = SCRIPT[i - 1]
    const B = ROWS[s.row], A = p ? ROWS[p.row] : null
    const KB = slotsOf(s.row), KA = A ? slotsOf(p.row) : []
    const wb = displayWords(B), wa = A ? displayWords(A) : []
    const sample = s.kind === 'sample' || s.kind === 'open'
    if (sample && p && +line.dataset.step === i - 1) {
      // the previous sentence (the line as the step before built it) leaves as a ghost; the new one is built on its own
      ghost.innerHTML = ''; for (const c of [...line.children]) ghost.append(c)
      ghost.dataset.from = s.t; ghost.dataset.y0 = lastY0
    }
    line.innerHTML = ''
    line.dataset.step = i
    const cells = []
    const order = sample ? KB.slice() : (() => { const o = KB.slice(); KA.forEach((k, j) => { if (!o.includes(k)) { const prev = KA[j - 1]; o.splice(prev ? o.indexOf(prev) + 1 : 0, 0, k) } }); return o })()
    for (const key of order) {
      const ia = sample ? -1 : KA.indexOf(key), ib = KB.indexOf(key)
      const ta = ia >= 0 ? wa[ia] : '', tb = ib >= 0 ? wb[ib] : ''
      const type = ia >= 0 && ib >= 0 ? (ta === tb ? 'static' : 'roll') : ib >= 0 ? (sample ? 'in' : 'grow') : 'shrink'
      const lab = ib >= 0 ? wordsOf(B)[ib][1] : wordsOf(A)[ia][1]
      const c = h('span', 'sj-w', wordHtml(tb || ta, lab))
      c.dataset.key = key
      c._type = type; c._wA = slotW(ta, ia >= 0 ? wordsOf(A)[ia][1] : null); c._wB = slotW(tb, ib >= 0 ? wordsOf(B)[ib][1] : null)
      c._ta = c.querySelector('.ta'); c._tb = c.querySelector('.tb'); c._lab = c.querySelector('.sj-lab'); c._u = c.querySelector('.sj-u'); c._wash = c.querySelector('.sj-wash')
      c._taText = ta; c._ta.textContent = ''; c._tb.textContent = tb
      c._t = c.querySelector('.sj-t')
      cells.push(c); line.append(c, ' ')
    }
    // a sentence that enters whole (the opening, a sample) is laid out once at its full widths; the others morph between two layouts
    const LB = layoutWords(cells.map(c => c._wB)), LA = sample ? LB : layoutWords(cells.map(c => c._wA))
    if (sample) for (const c of cells) c._wA = c._wB
    const enH = enHeight(B.en)
    step = { i, s, p, cells, LA, LB, enH, hasLab: cells.some(c => c._lab), sample }
    stepIdx = i
    if (enKey !== B.en) { enA.textContent = A ? A.en : ''; enB.textContent = B.en; enKey = B.en }
  }
  function renderSentence(tt) {
    const i = stepAt(tt)
    if (i !== stepIdx) buildStep(i)
    const { s, p, cells, LA, LB, enH } = step
    // a sample enters once the sentence before it has left (0.26 s); a change or growth morphs over its own duration
    const e = s.kind === 'open' ? out3(span(s.t + OPEN_LAG, s.t + OPEN_LAG + s.dur, tt)) : s.kind === 'sample' ? out3(span(s.t + 0.26, s.t + 0.26 + s.dur, tt)) : smooth(span(s.t, s.t + s.dur, tt))
    const hLab = step.hasLab ? geo.labH + 6 : 0
    const blockH = lerp(LA.h, LB.h, e)
    const area = geo.zoneH
    const enGap = geo.narrow ? 14 : 20
    const total = blockH + enGap + enH
    const y0 = Math.max(8, (area - total) / 2 - (geo.narrow ? 2 : 10))
    line.style.transform = `translateY(${y0.toFixed(1)}px)`
    // the whole sentence leaves at the end
    const leave = smooth(span(LEAVE, LEAVE + 0.3, tt))
    sent.style.opacity = (1 - leave).toFixed(3); sent.style.visibility = leave < 0.997 ? 'visible' : 'hidden'
    // for the tools: which row the line is showing, how strongly, and a real height for the line's box
    sentOp = (1 - leave) * (s.kind === 'open' ? e : 1); sent.dataset.row = !p || e >= 0.5 ? s.row : p.row; line.style.height = blockH.toFixed(1) + 'px'
    cells.forEach((c, ci) => {
      // the outgoing word is in the line only while it is leaving, so the line's text is the sentence and nothing more
      const taT = (c._type === 'roll' || c._type === 'shrink') && e < 0.997 ? c._taText : ''; if (c._ta.textContent !== taT) c._ta.textContent = taT
      const a = LA.pos[ci], b = LB.pos[ci]
      const w = lerp(c._wA, c._wB, e)
      let x = lerp(a.x, b.x, e), y = lerp(a.y, b.y, e), op = 1, dx = 0
      if (c._type === 'in') { x = b.x; y = b.y; op = e; dx = 36 * (1 - e) }
      if (s.kind === 'open') { x = b.x; y = b.y; op = e; dx = 0; y += 16 * (1 - e) }
      c.style.transform = `translate(${(x + dx).toFixed(1)}px,${y.toFixed(1)}px)`
      c.style.width = Math.max(0, w).toFixed(1) + 'px'
      c.style.height = (hLab + geo.lineH) + 'px'
      c.style.opacity = op.toFixed(3)
      const full = Math.max(c._wA, c._wB)
      c._t.style.top = hLab + 'px'
      c._t.style.width = full + 'px'
      // a word that unfolds or folds is revealed from its left edge as its slot widens, never painted over its neighbours
      const reveal = c._type === 'grow' || c._type === 'shrink'
      c._t.style.left = reveal ? '0px' : ((w - full) / 2).toFixed(1) + 'px'
      c._t.style.clipPath = reveal ? `inset(-0.4em ${Math.max(0, full - w).toFixed(1)}px -0.4em -0.1em)` : ''
      c._u.style.top = (hLab + geo.lineH - (geo.narrow ? 2 : 4)) + 'px'
      c._wash.style.top = (hLab - 2) + 'px'; c._wash.style.height = (geo.lineH + 4) + 'px'
      // the two texts: the old rolls up and out, the new rolls in from below
      const ta = c._ta, tb = c._tb
      const rise = geo.fs * 0.55
      if (c._type === 'roll') {
        ta.style.opacity = (1 - smooth(span(0, 0.55, e))).toFixed(3); ta.style.transform = `translateY(${(-rise * e).toFixed(1)}px)`; ta.style.visibility = e < 0.997 ? 'visible' : 'hidden'
        tb.style.opacity = smooth(span(0.3, 1, e)).toFixed(3); tb.style.transform = `translateY(${(rise * (1 - e)).toFixed(1)}px)`; tb.style.visibility = e > 0.003 ? 'visible' : 'hidden'
      } else if (c._type === 'shrink') {
        ta.style.opacity = (1 - smooth(span(0, 0.6, e))).toFixed(3); ta.style.transform = `translateY(${(-rise * 0.5 * e).toFixed(1)}px)`; ta.style.visibility = e < 0.997 ? 'visible' : 'hidden'
        tb.style.visibility = 'hidden'; tb.style.opacity = 0
      } else if (c._type === 'grow') {
        ta.style.visibility = 'hidden'; ta.style.opacity = 0
        const g = smooth(span(0.35, 1, e))
        tb.style.opacity = g.toFixed(3); tb.style.transform = `translateY(${(rise * 0.5 * (1 - g)).toFixed(1)}px)`; tb.style.visibility = g > 0.003 ? 'visible' : 'hidden'
      } else {
        ta.style.visibility = 'hidden'; ta.style.opacity = 0
        tb.style.opacity = 1; tb.style.transform = ''; tb.style.visibility = 'visible'
      }
      // the part label: all labels come up one by one in the opening; a changing slot's label turns red for the change
      if (c._lab) {
        let lo = 1
        if (s.kind === 'open') lo = out3(span(1.1 + ci * 0.26, 1.4 + ci * 0.26, tt))
        else if (c._type === 'grow') lo = smooth(span(0.5, 1, e))
        else if (c._type === 'shrink') lo = 1 - smooth(span(0, 0.5, e))
        c._lab.style.opacity = lo.toFixed(3)
        const hot = (c._type === 'roll' || c._type === 'grow') && tt < s.t + s.dur + 0.5
        c._lab.classList.toggle('on', hot)
      }
      // the red mark under a changing word: present through the change, then gone
      const mk = c._type === 'roll' ? smooth(span(s.t - 0.08, s.t + 0.12, tt)) * (1 - smooth(span(s.t + s.dur + 0.25, s.t + s.dur + 0.7, tt))) : 0
      c._u.style.opacity = mk.toFixed(3); c._u.style.transform = `scaleX(${lerp(0.3, 1, mk).toFixed(3)})`
      // a new word's wash fades over a second
      const wash = c._type === 'grow' ? smooth(span(0.3, 0.9, e)) * (1 - smooth(span(s.t + s.dur + 0.3, s.t + s.dur + 1.3, tt))) : 0
      c._wash.style.opacity = (wash * 0.9).toFixed(3)
    })
    // the sentence that left (a sample step): slides out to the left from where it stood, before the next comes in
    if (ghost.children.length) {
      const from = +ghost.dataset.from, g = out3(span(from, from + 0.3, tt))
      if (g >= 1 || tt < from) ghost.innerHTML = ''
      else { ghost.style.opacity = (1 - g).toFixed(3); ghost.style.transform = `translate(${(-36 * g).toFixed(1)}px,${(+ghost.dataset.y0 || y0).toFixed(1)}px)`; ghost.style.visibility = 'visible' }
    }
    if (!ghost.children.length) ghost.style.visibility = 'hidden'
    lastY0 = y0
    // the English under the sentence
    enBox.style.transform = `translateY(${(y0 + blockH + enGap).toFixed(1)}px)`
    enBox.style.height = enH + 'px'
    sentFoot = y0 + blockH + enGap + enH
    // the old English goes up and out, then the new comes up into its place (a sample waits for its sentence)
    const lag = s.kind === 'sample' ? 0.26 : 0
    const ua = s.kind === 'open' ? 1 : smooth(span(s.t, s.t + 0.2 + lag * 0.5, tt))
    const ub = s.kind === 'open' ? out3(span(0.6, 1.2, tt)) : smooth(span(s.t + 0.16 + lag, s.t + 0.5 + lag, tt))
    const same = p && ROWS[p.row].en === ROWS[s.row].en
    enA.style.opacity = (same ? 0 : 1 - ua).toFixed(3); enA.style.visibility = !same && ua < 0.997 ? 'visible' : 'hidden'; enA.style.transform = `translateY(${(-8 * ua).toFixed(1)}px)`
    enB.style.opacity = (same ? 1 : ub).toFixed(3); enB.style.visibility = same || ub > 0.003 ? 'visible' : 'hidden'; enB.style.transform = same ? '' : `translateY(${(8 * (1 - ub)).toFixed(1)}px)`
  }

  // ---------- the course view: the site's six named parts, every row left to right (ported from the bloom) ----------
  function buildCourse() {
    const key = geo.courseWide ? 'w' : 'n' + geo.perRow
    if (courseKey === key) return
    courseKey = key
    if (pv.parentNode !== root) root.insertBefore(pv, live)
    course.innerHTML = ''
    const roadSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); roadSvg.setAttribute('class', 'sb-croad'); roadSvg.setAttribute('aria-hidden', 'true')
    const hint = h('p', 'sb-hintc', geo.courseWide ? 'Click a lesson to see what it teaches.' : 'Tap a lesson to see what it teaches.')
    course.append(roadSvg, hint)
    chips = []
    for (const G of COURSE.groups) {
      const grp = h('div', 'sb-grp'); grp.setAttribute('role', 'group'); grp.setAttribute('aria-label', okinafy(G.name)); grp.dataset.group = G.key
      const nm = h('p', 'sb-gname', esc(okinafy(G.name))); nm.setAttribute('aria-hidden', 'true')
      const box = h('div', 'sb-rows')
      const per = geo.courseWide ? G.lessons.length : geo.perRow
      for (let i = 0; i < G.lessons.length; i += per) {
        const row = h('div', 'sb-row')
        for (const n of G.lessons.slice(i, i + per)) {
          const L = LESSONS[n - 1]
          const b = h('button', 'sb-ls', `<span class="sb-chip" aria-hidden="true">${n}</span>${geo.courseWide ? `<span class="sb-ttl" lang="en" aria-hidden="true">${esc(L.title)}</span>` : ''}`)
          b.type = 'button'; b.dataset.n = n
          b.setAttribute('aria-label', `Lesson ${n}: ${L.title}`)
          b.setAttribute('aria-expanded', 'false')
          row.append(b); chips[n - 1] = b
        }
        box.append(row)
      }
      grp.append(nm, box); course.append(grp)
    }
    course._road = roadSvg
  }
  // measured once per width: where each chip sits, the road through them, and the course view's height
  function layoutCourse() {
    const wasOpen = pv.parentNode === course || (pv.parentNode && pv.parentNode.closest && pv.parentNode.closest('.sb-course'))
    if (wasOpen) root.insertBefore(pv, live)
    const keepVis = course.style.visibility, keepOp = course.style.opacity
    course.style.visibility = 'hidden'; course.style.opacity = 0
    chips.forEach(b => { b.firstChild.style.transform = ''; b.firstChild.style.opacity = '' })
    for (const e of course.querySelectorAll('.sb-gname')) { e.style.transform = ''; e.style.opacity = '' }
    const rowsEls = [...course.querySelectorAll('.sb-row')]
    if (geo.courseWide) {
      const trackW = course.clientWidth - 16 - 120 - 16 - 26
      for (const row of rowsEls) { const n = row.children.length, tw = Math.max(44, Math.min(112, Math.floor(trackW / n) - 4)); for (const b of row.children) b.style.width = tw + 'px'; row.style.gap = '' }
    } else {
      const cw = course.clientWidth - 8, per = geo.perRow, g = per > 1 ? Math.min(14, Math.floor((cw - per * 44) / (per - 1))) : 0
      for (const row of rowsEls) { row.style.gap = g + 'px'; for (const b of row.children) b.style.width = '' }
    }
    const cr = course.getBoundingClientRect(), sr = stage.getBoundingClientRect()
    geo.courseOff = { x: cr.left - sr.left, y: cr.top - sr.top }
    chipPos = chips.map(b => { const r = b.firstChild.getBoundingClientRect(); return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top } })
    // the road: along each row, then back under it to the next row's first lesson, like a line of text
    let d = ''
    const rows = rowsEls.map(row => { const ns = [...row.children].map(b => +b.dataset.n); const rr = row.getBoundingClientRect(); return { ns, bottom: rr.bottom - cr.top } })
    rows.forEach((r, i) => {
      const a = chipPos[r.ns[0] - 1], b = chipPos[r.ns[r.ns.length - 1] - 1]
      d += `${i ? '' : `M${a.x.toFixed(1)} ${a.y.toFixed(1)} `}L${b.x.toFixed(1)} ${b.y.toFixed(1)} `
      const nx = rows[i + 1]
      if (nx) {
        const c = chipPos[nx.ns[0] - 1], gy = r.bottom + (geo.courseWide ? 9 : 4), bend = geo.courseWide ? 18 : 12
        const lastB = chips[r.ns[r.ns.length - 1] - 1], xr = geo.courseWide ? b.x + lastB.offsetWidth / 2 + 12 : b.x + bend
        d += `L${(xr - 10).toFixed(1)} ${b.y.toFixed(1)} Q${xr.toFixed(1)} ${b.y.toFixed(1)} ${xr.toFixed(1)} ${(b.y + 10).toFixed(1)} L${xr.toFixed(1)} ${(gy - 10).toFixed(1)} Q${xr.toFixed(1)} ${gy.toFixed(1)} ${(xr - 10).toFixed(1)} ${gy.toFixed(1)} L${c.x.toFixed(1)} ${gy.toFixed(1)} C${(c.x - bend).toFixed(1)} ${gy.toFixed(1)} ${(c.x - bend).toFixed(1)} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)} `
      }
    })
    const rs = course._road
    rs.setAttribute('width', Math.ceil(cr.width)); rs.setAttribute('height', Math.ceil(cr.height))
    rs.innerHTML = `<path d="${d}"/>`
    geo.roadLen = rs.firstChild.getTotalLength ? rs.firstChild.getTotalLength() : 4000
    geo.chipR = chips[0].firstChild.offsetWidth / 2
    geo.nameBox = [...course.querySelectorAll('.sb-gname')].map(e => { const rg = document.createRange(); rg.selectNodeContents(e); const b = rg.getBoundingClientRect(); return { x: b.left - cr.left + b.width / 2, y: b.top - cr.top + b.height / 2 } })
    geo.courseH = Math.ceil(course.offsetHeight)
    geo.rowsOf = rows.map(r => r.ns)
    course.style.visibility = keepVis; course.style.opacity = keepOp
    if (wasOpen && pvOpen) placePv()
  }
  // the ending: the course view takes over from the plant where it stands. On the map each lesson is already in its place; from a
  // list the lessons travel to theirs. The ground turns blue in place; from the course beat's end it is exactly the course view,
  // with nothing inline left on it
  const LOOK = { ahead: ['#fff', 'var(--line-strong,#d3cdc4)', 'var(--wr-muted)'], done: ['var(--wr-red)', 'var(--wr-red)', '#fff'] }
  function clearInline() {
    if (course.inert) course.inert = false
    for (const b of chips) { const s = b.firstChild.style; s.transform = s.backgroundColor = s.borderColor = s.color = s.opacity = s.visibility = '' }
    for (const e of course.querySelectorAll('.sb-gname')) { e.style.color = e.style.transform = e.style.opacity = e.style.visibility = '' }
    const rp = course._road.firstChild; if (rp) rp.style.stroke = rp.style.strokeOpacity = rp.style.strokeDasharray = rp.style.strokeDashoffset = ''
  }
  function renderCourse(tt) {
    if (tt < FOLD.start) { clearInline(); course.inert = true; course.style.visibility = 'hidden'; course.style.opacity = 0; return }
    course.style.visibility = 'visible'; course.style.opacity = 1
    const rest = smooth(span(COURSE_BEAT.start, COURSE_BEAT.end - 0.1, tt))
    for (const b of chips) { const ttl = b.children[1]; if (ttl) { ttl.style.opacity = rest.toFixed(3); ttl.style.visibility = rest > 0.003 ? 'visible' : 'hidden' } }
    for (const e of course.querySelectorAll('.sb-hintc')) { e.style.opacity = rest.toFixed(3); e.style.visibility = rest > 0.003 ? 'visible' : 'hidden' }
    if (tt >= COURSE_BEAT.end) { clearInline(); return }
    // the lessons take no click or Tab until every one is in its place
    const settled = tt >= FOLD.end
    if (course.inert !== !settled) course.inert = !settled
    const g = geo, m = smooth(span(TURN.start, TURN.start + 0.5, tt))
    const dur = 1.0, stagger = 0.07
    chips.forEach((b, i) => {
      const n = i + 1, gi = partOf(n), u = g.plate ? 1 : smooth(span(FOLD.start + gi * stagger, FOLD.start + gi * stagger + dur, tt))
      const s = b.firstChild.style
      // from the lesson's node in the plant (stage coordinates) to the chip's own place
      const tx = g.foldFrom[n].x - (g.courseOff.x + chipPos[i].x), ty = g.foldFrom[n].y - (g.courseOff.y + chipPos[i].y)
      s.transform = u >= 0.9995 ? '' : `translate(${(tx * (1 - u)).toFixed(2)}px,${(ty * (1 - u)).toFixed(2)}px) scale(${lerp(g.foldK, 1, u).toFixed(4)})`
      s.backgroundColor = mixC(LOOK.done[0], BP, m); s.borderColor = mixC(LOOK.done[1], RING, m); s.color = mixC(LOOK.done[2], BPINK, m)
      s.opacity = 1; s.visibility = 'visible'
    })
    course.querySelectorAll('.sb-gname').forEach((e, gi) => {
      e.style.transform = ''
      e.style.color = mixC('var(--wr-muted)', BPINK, m)
      const op = smooth(span(FOLD.start + 0.35 + gi * stagger, FOLD.start + 0.8 + gi * stagger, tt))
      e.style.opacity = op.toFixed(3); e.style.visibility = op > 0.003 ? 'visible' : 'hidden'
    })
    const rp = course._road.firstChild
    if (rp) {
      // on the map the road is the vine, already drawn; from a list it draws itself as the lessons arrive
      const draw = g.plate ? 1 : out3(span(FOLD.start + 0.45, FOLD.start + 1.45, tt))
      rp.style.stroke = mixC('var(--wr-red)', RING, m); rp.style.strokeOpacity = lerp(0.9, 0.7, m).toFixed(3)
      rp.style.strokeDasharray = `${g.roadLen.toFixed(1)} ${g.roadLen.toFixed(1)}`; rp.style.strokeDashoffset = (g.roadLen * (1 - draw)).toFixed(1)
    }
  }
  function courseAtRest() {
    clearInline()
    course.style.visibility = 'visible'; course.style.opacity = 1
    chips.forEach(b => { const ttl = b.children[1]; if (ttl) { ttl.style.opacity = 1; ttl.style.visibility = 'visible' } })
    for (const e of course.querySelectorAll('.sb-gname, .sb-hintc')) { e.style.opacity = 1; e.style.visibility = 'visible' }
  }

  // ---------- the preview card (ported from the bloom) ----------
  function pvHtml(n) {
    const L = LESSONS[n - 1]
    let s = `<button type="button" class="sb-close" aria-label="Close">×</button>`
    s += `<h3 class="sb-pv-h" id="${pvId}" tabindex="-1"><span class="sb-pv-e"><span class="sb-pv-k">Lesson ${n}</span><span class="sb-pv-g" data-group="${L.group}">${esc(GROUP[L.group])}</span></span><span class="sb-pv-t">${esc(L.title)}</span></h3>`
    s += `<p class="sb-pv-sec">What this lesson teaches</p><ul class="sb-pv-topics">${L.topics.map(x => `<li>${mixedHtml(x)}</li>`).join('')}</ul>`
    s += `<p class="sb-pv-by">By the end of it you will be able to make sentences such as</p>`
    s += L.preview.map(id => { const r = ROWS[id]; return `<p class="sb-pv-ex"><span lang="to" data-row="${r.id}">${esc(r.to)}</span><span class="e" data-row="${r.id}">${esc(r.en)}</span></p>` }).join('')
    s += `<div class="sb-nav"><button type="button" class="sb-btn" data-go="-1"${n === 1 ? ' hidden' : ''}>← Lesson ${n - 1}</button><a class="sb-start" href="${esc(opt.lessonHref(n))}" data-lesson-link="${n}">Start Lesson ${n}</a><button type="button" class="sb-btn" data-go="1"${n === 52 ? ' hidden' : ''}>Lesson ${n + 1} →</button></div>`
    s += `<p class="sb-keys">Use ← and → to move between lessons.</p>`
    return s
  }
  function renderPv(announce) {
    if (!pvOpen) {
      pv.hidden = true
      if (pv.parentNode !== root) root.insertBefore(pv, live)
      chips.forEach(b => b.setAttribute('aria-expanded', 'false'))
      root.classList.remove('has-pv', 'is-docked')
      return
    }
    const L = LESSONS[selected - 1]
    pv.innerHTML = pvHtml(selected)
    pv.hidden = false
    chips.forEach(b => b.setAttribute('aria-expanded', +b.dataset.n === selected ? 'true' : 'false'))
    root.classList.add('has-pv')
    if (announce) live.textContent = `Lesson ${L.n}: ${L.title}. ${L.topics.length} topics and ${L.preview.length} example sentences.`
    placePv()
  }
  function placePv() {
    if (!pvOpen) return
    if (!geo.courseWide) {
      root.classList.remove('is-docked')
      pv.style.left = pv.style.right = pv.style.top = ''
      const row = chips[selected - 1].parentNode
      if (pv.previousSibling !== row || pv.parentNode !== row.parentNode) row.after(pv)
      return
    }
    root.classList.add('is-docked')
    if (pv.parentNode !== root) root.insertBefore(pv, live)
    const x = chipPos[selected - 1].x + geo.courseOff.x
    const right = x < W / 2
    const pad = parseFloat(getComputedStyle(panel).paddingRight) || 0
    pv.style.top = (panel.offsetTop + stage.offsetTop + 8) + 'px'
    pv.style.left = right ? '' : pad + 'px'
    pv.style.right = right ? pad + 'px' : ''
  }
  function revealPv() {
    const r = pv.getBoundingClientRect(), vh = window.innerHeight || 800
    if (r.top < 0 || r.bottom > vh) {
      const dy = r.height > vh - 16 ? r.top - 8 : (r.top < 0 ? r.top - 8 : r.bottom - vh + 8)
      window.scrollBy({ top: dy, behavior: 'instant' })
    }
  }
  function select(n, how = {}) {
    n = clamp(n, 1, 52)
    if (mode !== 'end') finish(false)
    selected = n; pvOpen = true
    renderPv(how.announce !== false)
    if (how.focusChip) chips[n - 1].focus({ preventScroll: true })
    if (how.focusPv) pv.querySelector('.sb-pv-h').focus({ preventScroll: true })
    if (how.reveal !== false) revealPv()
  }
  function closePv(focusChip = true) {
    pvOpen = false
    renderPv(false)
    if (focusChip && selected) { chips[selected - 1].focus({ preventScroll: true }); const r = chips[selected - 1].getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) chips[selected - 1].scrollIntoView({ block: 'center' }) }
  }

  // ---------- frame ----------
  function renderEndLayout() {
    root.classList.add('is-end', 'is-dark')
    ground.style.opacity = 1
    flag.hidden = true; chead.hidden = false; chead.style.opacity = 1
    sent.style.visibility = 'hidden'; sent.style.opacity = 0
    plant.style.visibility = 'hidden'; plant.style.opacity = 0; sentOp = 0; bloomOp = 0
    stage.style.height = geo.courseWide ? geo.H + 'px' : ''
    courseAtRest()
    bPause.hidden = true; bSkip.hidden = true; bReplay.hidden = false
    renderPv(false)
  }
  function render(tt) {
    if (destroyed) return
    t = clamp(tt, 0, END)
    if (benchIn) { if (document.activeElement !== benchIn) benchIn.value = t; benchOut.textContent = t.toFixed(1) + ' s' }
    if (mode === 'end') { renderEndLayout(); return }
    root.classList.remove('is-end')
    const g = geo
    // chrome: white through the film, blueprint blue from the turn on
    ground.style.opacity = smooth(span(TURN.start, TURN.start + 0.42, t))
    root.classList.toggle('is-dark', t >= TURN.start + 0.25)
    flag.hidden = t >= TURN.start + 0.25
    chead.hidden = !(t >= COURSE_BEAT.start)
    chead.style.opacity = clamp((t - COURSE_BEAT.start) / 0.3)
    bPause.hidden = false; bSkip.hidden = false; bReplay.hidden = false
    // stage height: one height on desktop; a phone grows to the course view as the fold starts
    const H = g.courseWide ? g.H : lerp(g.playH, Math.max(g.playH, g.courseH), smooth(span(FOLD.start - 0.45, FOLD.start, t)))
    stage.style.height = H + 'px'
    renderFlag(t)
    if (t < LEAVE + 0.3) renderSentence(t)
    else { sent.style.visibility = 'hidden'; sent.style.opacity = 0; sentOp = 0 }
    renderPlant(t)
    renderCourse(t)
    pv.hidden = true
  }
  // what is on screen now, for the capture and check tools: each sentence drawn at half strength or more, wholly inside the stage and not under the open card, with
  // 'read' when its Tongan is at or above the smallest size counted as readable at this width, 'far' when it is smaller
  function shown() {
    const out = new Map()
    if (mode === 'end' || destroyed) return []
    const sr = stage.getBoundingClientRect()
    // the card that opens at a stop is drawn over the leaves behind it: a leaf it covers, even in part, is not reported
    const card = bloomOp >= 0.5 ? bloom.getBoundingClientRect() : null
    const add = (id, rowEl, toEl, op, under) => {
      if (!id || op < 0.5) return
      const b = rowEl.getBoundingClientRect(), r = toEl.getBoundingClientRect()
      if (r.width < 1 || r.height < 1 || b.top < sr.top - 0.5 || b.bottom > sr.bottom + 0.5 || b.left < sr.left - 0.5 || b.right > sr.right + 0.5) return
      if (under && card && b.right > card.left && b.left < card.right && b.bottom > card.top && b.top < card.bottom) return
      const px = (parseFloat(getComputedStyle(toEl).fontSize) || 0) * (toEl.offsetHeight ? r.height / toEl.offsetHeight : 1)
      if (out.get(id) !== 'read') out.set(id, px >= geo.minPx ? 'read' : 'far')
    }
    add(sent.dataset.row, sent, line, sentOp, false)
    for (const L of leaves) add(L.id, L.el, L.tEl, L.op, true)
    add(bloom.dataset.row, bloom, bloomTo, bloomOp, false)
    return [...out].map(([id, state]) => ({ id, state }))
  }

  // ---------- clock ----------
  function tick(now) {
    raf = 0
    if (!playing || destroyed) return
    const dt = Math.min(0.1, (now - last) / 1000); last = now
    t += dt
    if (t >= END) { finish(false); return }
    render(t)
    rafReq(tick)
  }
  function play() {
    if (mode === 'end' || playing || destroyed) return
    playing = true; userPaused = false; autoPaused = false
    bPause.textContent = 'Pause'
    last = performance.now(); rafReq(tick)
  }
  function pause(byUser, auto) {
    if (byUser) userPaused = true
    if (auto && playing) autoPaused = true
    playing = false; if (raf) { cancelAnimationFrame(raf); raf = 0 }
    bPause.textContent = 'Play'
  }
  function finish() {
    pause(false); mode = 'end'; t = END
    render(END)
  }
  function replay() {
    pvOpen = false; renderPv(false)
    mode = 'play'; t = 0; stepIdx = -1; flagN = -1; enKey = ''; ghost.innerHTML = ''
    root.classList.remove('is-end', 'is-dark')
    render(0); play()
  }

  // ---------- events (ported from the bloom) ----------
  const on = (target, type, fn, o) => { target.addEventListener(type, fn, o); cleanups.push(() => target.removeEventListener(type, fn, o)) }
  const cleanups = []
  on(bPause, 'click', () => { if (playing) pause(true); else play() })
  on(bReplay, 'click', () => replay())
  on(bSkip, 'click', () => { finish(); bReplay.focus({ preventScroll: true }) })
  on(course, 'click', ev => {
    const b = ev.target.closest('.sb-ls'); if (!b) return
    const n = +b.dataset.n
    if (pvOpen && n === selected && mode === 'end') { closePv(true); return }
    select(n, { announce: true })
  })
  on(course, 'focusin', ev => {
    const b = ev.target.closest('.sb-ls'); if (!b) return
    if (mode !== 'end') { finish(); const r = b.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) b.scrollIntoView({ block: 'nearest' }) }
    if (pvOpen && +b.dataset.n !== selected) select(+b.dataset.n, { announce: false, reveal: false })
  })
  function rowStep(n, d) {
    const rows = geo.rowsOf, ri = rows.findIndex(r => r.includes(n)), to = rows[ri + d]
    if (!to) return null
    const x = chipPos[n - 1].x
    return to.reduce((best, m) => Math.abs(chipPos[m - 1].x - x) < Math.abs(chipPos[best - 1].x - x) ? m : best, to[0])
  }
  on(course, 'keydown', ev => {
    const b = ev.target.closest('.sb-ls'); if (!b) return
    if (ev.key === 'Escape' && pvOpen) { ev.preventDefault(); closePv(true); return }
    const n = +b.dataset.n
    const go = { ArrowLeft: n - 1, ArrowRight: n + 1, ArrowUp: rowStep(n, -1), ArrowDown: rowStep(n, 1), Home: 1, End: 52 }[ev.key]
    if (ev.key in { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Home: 1, End: 1 }) {
      ev.preventDefault()
      if (go != null && go >= 1 && go <= 52) { if (pvOpen) select(go, { focusChip: true, reveal: false }); else chips[go - 1].focus({ preventScroll: true }); const r = chips[go - 1].getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) chips[go - 1].scrollIntoView({ block: 'center' }) }
      return
    }
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(n, { focusPv: true, announce: true }) }
  })
  on(pv, 'click', ev => {
    const b = ev.target.closest('button, a'); if (!b) return
    if (b.classList.contains('sb-close')) { closePv(true); return }
    if (b.dataset.go) { const d = b.dataset.go; select(selected + +d, { announce: true }); const nb = pv.querySelector(`[data-go="${d}"]`); (nb && !nb.hidden ? nb : pv.querySelector('.sb-pv-h')).focus({ preventScroll: true }); return }
    if (b.dataset.lessonLink && opt.onNavigate && !(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey)) { ev.preventDefault(); opt.onNavigate(b.getAttribute('href'), ev) }
  })
  let lastPointer = -1e9
  on(root, 'pointerdown', () => { lastPointer = performance.now() }, true)
  on(pv, 'focusout', ev => {
    const to = ev.relatedTarget
    if (!pvOpen || !to || pv.contains(to) || !to.closest || !to.closest('.sb-ls') || !root.contains(to) || performance.now() - lastPointer < 500) return
    if (to.compareDocumentPosition(pv) & Node.DOCUMENT_POSITION_FOLLOWING) closePv(false)
  })
  on(document, 'keydown', ev => {
    if (ev.key !== 'Escape' || !pvOpen || ev.defaultPrevented) return
    const a = document.activeElement
    if (a && a !== document.body && a !== document.documentElement && !root.contains(a)) return
    ev.preventDefault(); closePv(true)
  })
  on(pv, 'keydown', ev => {
    if (ev.key === 'Escape') { ev.preventDefault(); closePv(true); return }
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault(); const d = ev.key === 'ArrowLeft' ? -1 : 1
      if (selected + d >= 1 && selected + d <= 52) select(selected + d, { focusPv: true, announce: true })
    }
  })
  // start when the section is mostly in view; pause when it leaves
  let io = null
  if (!reduced && typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver(entries => {
      for (const en of entries) {
        const vh = window.innerHeight || 1
        const mostly = en.intersectionRatio >= opt.startRatio || en.intersectionRect.height >= vh * 0.6
        inView = mostly || (inView && en.intersectionRatio >= 0.2)
        if (mostly && mode === 'play' && !playing && !userPaused && !document.hidden) play()
        else if (en.intersectionRatio < 0.2 && playing) pause(false, true)
      }
    }, { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] })
    io.observe(panel)
  }
  on(document, 'visibilitychange', () => {
    if (document.hidden) { if (playing) pause(false, true) }
    else if (autoPaused && inView && !userPaused && mode === 'play' && !playing) play()
  })
  let ro = null
  const relayout = () => { if (destroyed) return; const w = stage.clientWidth; if (Math.abs(w - W) < 1 && geo) return; widthCache.clear(); classify(); stepIdx = -1; flagN = -1; enKey = ''; render(t) }
  if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => relayout()); ro.observe(root) }

  if (benchIn) on(benchIn, 'input', () => controller.seek(+benchIn.value))

  // ---------- start ----------
  classify()
  if (mode === 'end') { finish() } else render(0)
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => { if (!destroyed) { widthCache.clear(); courseKey = ''; classify(); stepIdx = -1; flagN = -1; enKey = ''; render(t) } })

  const controller = {
    el, root,
    get time() { return t }, get mode() { return mode }, get playing() { return playing }, get selected() { return pvOpen ? selected : 0 }, get reduced() { return reduced },
    get cardOpen() { return pvOpen }, get timeline() { return TIMELINE }, get script() { return SCRIPT },
    get geometry() { return { ...geo, width: W } },
    seek(tt, o = {}) { if (mode === 'end') { mode = 'play'; pvOpen = false; renderPv(false); root.classList.remove('is-end', 'is-dark') } pause(false); stepIdx = -1; flagN = -1; enKey = ''; ghost.innerHTML = ''; render(tt); if (o.asPlaying) bPause.textContent = 'Pause'; return t },
    play, pause: () => pause(true), replay, skip: () => finish(), select: n => select(n, { announce: true }), close: () => closePv(false),
    shown,
    destroy() {
      if (destroyed) return
      destroyed = true; pause(false)
      cleanups.forEach(f => f()); if (io) io.disconnect(); if (ro) ro.disconnect()
      root.remove(); instances.delete(controller)
      if (--styleRefs <= 0 && styleEl) { styleEl.remove(); styleEl = null; styleRefs = 0 }
    },
  }
  instances.add(controller)
  return controller
}

export function unmount(el) {
  for (const inst of [...instances]) if (!el || inst.el === el) inst.destroy()
}

export const data = DATA
export default { mount, unmount, TIMELINE, SCRIPT, STOPS, LEAF }
