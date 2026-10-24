// The sentence journey: the homepage's "Every lesson adds a piece." piece, redone 2026-10-24.
// It replaces the sentence bloom of 2026-10-08/09 (src/premium/lib/blueprint/sentence-bloom.js, kept in place, unused) in
// src/premium/components/HomeBlueprint.jsx. Every Tongan string still comes from src/data/sentence-bloom-data.js (book rows found
// pair-level in both books, atlas-grammar labels with sources); lesson titles, topics and parts come from the site's chapters.json
// through that file, verbatim. The course view at the end (the six parts, the road, the preview card and its keyboard handling)
// is the 2026-10-08 course view, ported as it was; only the film in front of it is new.
//
// The film, 37.6 s, a pure function of time (render(t)):
//   0.0 to 14.6 s   One sentence. Naʻá ku kai. from Lesson 1 stands large with its three part labels. One word changes at a time on a
//                   steady beat: the verb (Lesson 1), then the pronoun and the four tense markers (Lesson 2). No drums, no boxes:
//                   the changing word rolls up out of the line and the next rolls in under a red mark.
//   14.6 to 21.2 s  The sentence grows. Lesson 3 adds an object and a modifier, Lesson 4 a time word, Lesson 9 turns it negative.
//                   New words unfold into the line with a red wash that fades.
//   21.2 to 34.9 s  Across the course. One printed sentence from each later part slides through: Lessons 15, 21, 30, 36 and 52,
//                   each with its lesson number and title in the header.
//   The whole way   A rail of 52 ticks in six parts sits at the foot of the stage. A red marker rides it from lesson to lesson, the
//                   ticks it has passed turn red, and the part names stand over their groups.
//   34.9 to 37.6 s  The rail unfolds into the course map: each tick travels to its place as a lesson in the six rows, the road draws
//                   itself between them, the ground turns blueprint blue in place, and the titles come up. That is the course view.
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

// ---------- the script ----------
// Each step shows one row of the data at its time. A step's slots name the grammatical slot each word fills, so the step before it
// can be matched word by word: the same slot with a new word rolls, a new slot unfolds, a slot that is gone folds away.
// Rows of three words are tense marker, pronoun, verb (T P V); the longer rows name their slots here.
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
  { t: 21.2, row: 'ch15-l033-1', lesson: 15, kind: 'sample', dur: 0.5 },
  { t: 23.9, row: 'ch21-l014-0', lesson: 21, kind: 'sample', dur: 0.5 },
  { t: 26.6, row: 'ch30-l012-0', lesson: 30, kind: 'sample', dur: 0.5 },
  { t: 29.3, row: 'ch36-l028-0', lesson: 36, kind: 'sample', dur: 0.5 },
  { t: 32.0, row: 'ch52-l092-0', lesson: 52, kind: 'sample', dur: 0.5 },
].map(Object.freeze))
for (const s of SCRIPT) if (!ROWS[s.row] || ROWS[s.row].lesson !== s.lesson) throw new Error('script row missing or in another lesson: ' + s.row)
const LEAVE = 34.9                               // the last sentence goes
const UNFOLD = Object.freeze({ start: 35.2, end: 36.6 })   // the rail's ticks travel to their places in the map
const TURN = Object.freeze({ start: 36.3, end: 37.0 })     // the ground turns blueprint blue
const COURSE_BEAT = Object.freeze({ start: 36.9, end: 37.6 }) // titles, hint and heading come up
const END = COURSE_BEAT.end
const LESSONS_SHOWN = [...new Set(SCRIPT.map(s => s.lesson))]
// The beat table, for the capture and check tools: one beat per lesson shown, then the ending.
export const TIMELINE = Object.freeze((() => {
  const out = []
  for (const s of SCRIPT) { const l = out[out.length - 1]; if (l && l.id === 'lesson-' + s.lesson) continue; if (l) l.end = s.t; out.push({ id: 'lesson-' + s.lesson, start: s.t, end: LEAVE }) }
  out.push({ id: 'leave', start: LEAVE, end: UNFOLD.start }, { id: 'unfold', start: UNFOLD.start, end: UNFOLD.end }, { id: 'turn', start: TURN.start, end: TURN.end }, { id: 'course', start: COURSE_BEAT.start, end: COURSE_BEAT.end })
  return out.map(Object.freeze)
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
.sj-rail{position:absolute;left:0;right:0;bottom:0;pointer-events:none}
.sj-rail svg{position:absolute;left:0;top:0;overflow:visible}
.sj-rail .ln{fill:none;stroke:var(--line-strong,#d3cdc4);stroke-width:2}
.sj-rail .fl{fill:none;stroke:var(--wr-red);stroke-width:2}
.sj-tick{position:absolute;width:2px;height:10px;margin-left:-1px;border-radius:1px;background:var(--line-strong,#d3cdc4)}
.sj-tick.done{background:var(--wr-red)}
.sj-mark{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;border:4px solid var(--wr-red);box-shadow:0 0 0 3px #fff}
.sj-num{position:absolute;transform:translateX(-50%);font:800 15px/1 var(--f-display);color:var(--wr-red-deep);white-space:nowrap}
.sj-pname{position:absolute;transform:translateX(-50%);font:700 10.5px/1.1 var(--f-display);letter-spacing:.12em;text-transform:uppercase;color:var(--wr-muted);white-space:nowrap}
.sj-pname.on{color:var(--wr-red)}
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
.sb.is-narrow .sj-num{font-size:13px}
.sb.is-narrow .sj-mark{width:12px;height:12px;margin:-6px 0 0 -6px;border-width:3px}
.sb.is-narrow .sj-tick{height:8px}
.sb.is-narrow .sb-course{padding:8px 4px 10px}
.sb.is-tiny .sj-t{font-size:27px}
.sb.is-tiny .sj-lab{font-size:8.5px;letter-spacing:.06em}
.sb.is-tiny .sb-btn{padding:0 8px;font-size:12px}
@media (hover:none){.sb-keys{display:none}}
@media (prefers-reduced-motion:reduce){.sb *{transition:none!important;animation:none!important}}
`

let styleEl = null, styleRefs = 0, uid = 0
const instances = new Set()

export function mount(el, options = {}) {
  if (!el) throw new Error('mount needs an element')
  for (const inst of instances) if (inst.el === el) inst.destroy()
  const opt = { lessonHref: n => `/lessons/${n}`, onNavigate: null, startRatio: 0.6, ...options }
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
  const reduced = opt.reducedMotion ?? (mq ? mq.matches : false)

  if (!styleEl) { styleEl = document.createElement('style'); styleEl.setAttribute('data-sentence-journey', ''); styleEl.textContent = CSS; document.head.appendChild(styleEl) }
  styleRefs++

  // ---------- DOM ----------
  const root = h('div', 'sb')
  root.setAttribute('role', 'group')
  root.setAttribute('aria-label', 'A preview of the course: one sentence changes and grows lesson by lesson, a sentence from each later part, then all 52 lessons, each one open to preview')
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
  const stage = h('div', 'sb-stage')
  const sent = h('div', 'sj-sent'); sent.setAttribute('aria-hidden', 'true')
  const ghost = h('div', 'sj-ghost'), line = h('div', 'sj-line'), enBox = h('div', 'sj-en', '<p class="ea"></p><p class="eb"></p>')
  const enA = enBox.children[0], enB = enBox.children[1]
  sent.append(ghost, line, enBox)
  const rail = h('div', 'sj-rail'); rail.setAttribute('aria-hidden', 'true')
  const railSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  railSvg.innerHTML = '<path class="ln"/><path class="fl"/>'
  const railLn = railSvg.children[0], railFl = railSvg.children[1]
  rail.append(railSvg)
  const ticks = []
  for (let n = 1; n <= 52; n++) { const k = h('i', 'sj-tick'); k.dataset.n = n; rail.append(k); ticks.push(k) }
  const pnames = COURSE.groups.map(g => { const e = h('span', 'sj-pname', esc(okinafy(g.name))); rail.append(e); return e })
  const mark = h('i', 'sj-mark'), num = h('b', 'sj-num', '1')
  rail.append(mark, num)
  const course = h('div', 'sb-course'); course.setAttribute('role', 'group'); course.setAttribute('aria-label', 'The 52 lessons, in six parts')
  stage.append(sent, rail, course)
  panel.append(ground, top, stage)
  const pv = h('aside', 'sb-pv')
  pv.setAttribute('aria-labelledby', 'sb-pv-h-' + (++uid))
  pv.hidden = true
  const live = h('div', 'sb-sr'); live.setAttribute('aria-live', 'polite')
  const measure = h('div', 'sb-measure'); measure.setAttribute('aria-hidden', 'true')
  root.append(panel, pv, live, measure)
  el.append(root)
  const pvId = pv.getAttribute('aria-labelledby')

  // ---------- state ----------
  let t = 0, mode = reduced ? 'end' : 'play', playing = false, userPaused = false, autoPaused = false, inView = false
  let raf = 0, last = 0, W = 0, geo = null, stepIdx = -1, step = null, selected = 0, pvOpen = false, destroyed = false
  let chips = [], courseKey = '', chipPos = [], flagN = -1, enKey = '', lastY0 = 0
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
    geo = { c, narrow, courseWide, perRow, playH: c === 'wide' ? 560 : c === 'mid' ? 520 : 470, railH: narrow ? 58 : 76 }
    geo.fs = parseFloat(getComputedStyle(measureSpan()).fontSize) || 60
    geo.labH = narrow ? 16 : 18
    // the gap between words is the font's own word space, so the line reads as set type
    widthCache.clear()
    geo.gap = Math.max(Math.round(geo.fs * 0.2), wordWidth(' ') + (narrow ? 2 : 4))
    geo.maxW = W - (narrow ? 20 : 72)
    geo.lineH = Math.round(geo.fs * 1.15)
    geo.pitch = geo.labH + 6 + geo.lineH + (narrow ? 10 : 14)
    buildCourse()
    layoutCourse()
    layoutRail()
    if (courseWide) geo.playH = Math.max(geo.playH, geo.courseH, measurePvMax() + 16)
    geo.H = geo.playH
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

  // ---------- the rail: 52 ticks in six parts at the foot of the stage ----------
  function layoutRail() {
    const pad = geo.narrow ? 10 : 24, partGap = geo.narrow ? 8 : 18
    const railW = W - 2 * pad, cell = (railW - 5 * partGap) / 52
    const y = geo.narrow ? 24 : 30
    geo.railPad = pad; geo.railY = y
    geo.tickX = []
    let x = pad
    for (const [gi, g] of COURSE.groups.entries()) {
      if (gi) x += partGap
      for (const n of g.lessons) { geo.tickX[n - 1] = x + cell / 2; x += cell }
    }
    geo.partX = COURSE.groups.map(g => (geo.tickX[g.lessons[0] - 1] + geo.tickX[g.lessons[g.lessons.length - 1] - 1]) / 2)
    rail.style.height = geo.railH + 'px'
    railSvg.setAttribute('width', W); railSvg.setAttribute('height', geo.railH)
    railLn.setAttribute('d', COURSE.groups.map(g => `M${geo.tickX[g.lessons[0] - 1].toFixed(1)} ${y} L${geo.tickX[g.lessons[g.lessons.length - 1] - 1].toFixed(1)} ${y}`).join(' '))
    ticks.forEach((k, i) => { k.style.left = geo.tickX[i].toFixed(1) + 'px'; k.style.top = (y - (geo.narrow ? 4 : 5)) + 'px' })
    pnames.forEach((e, gi) => { e.style.left = geo.partX[gi].toFixed(1) + 'px'; e.style.top = (y - 24) + 'px'; e.style.display = geo.narrow ? 'none' : '' })
    num.style.top = (y + 14) + 'px'
  }
  // the marker's lesson as a number that eases between lessons, and its x on the rail
  function markerAt(tt) {
    const i = stepAt(tt), s = SCRIPT[i], p = SCRIPT[i - 1]
    if (!p || p.lesson === s.lesson) return s.lesson
    return lerp(p.lesson, s.lesson, smooth(span(s.t, s.t + 0.45, tt)))
  }
  const railX = v => { const i = clamp(Math.floor(v), 1, 52), f = v - i; const a = geo.tickX[i - 1], b = geo.tickX[Math.min(52, i + 1) - 1]; return i >= 52 ? a : lerp(a, b, clamp(f)) }
  function renderRail(tt) {
    const op = 1 - smooth(span(UNFOLD.start - 0.05, UNFOLD.start + 0.25, tt))
    rail.style.opacity = op.toFixed(3); rail.style.visibility = op > 0.003 ? 'visible' : 'hidden'
    if (op <= 0.003) return
    const v = markerAt(tt), n = Math.round(v), x = railX(v), y = geo.railY
    mark.style.left = x.toFixed(1) + 'px'; mark.style.top = y + 'px'
    num.style.left = x.toFixed(1) + 'px'; num.textContent = n
    const gi = partOf(n)
    pnames.forEach((e, k) => e.classList.toggle('on', k === gi))
    // the red fill runs along the rail to the marker, part by part
    let d = ''
    for (const g of COURSE.groups) {
      const a = geo.tickX[g.lessons[0] - 1], b = geo.tickX[g.lessons[g.lessons.length - 1] - 1]
      if (x <= a) break
      d += `M${a.toFixed(1)} ${y} L${Math.min(b, x).toFixed(1)} ${y} `
    }
    railFl.setAttribute('d', d)
    const shown = LESSONS_SHOWN
    ticks.forEach((k, i) => k.classList.toggle('done', shown.includes(i + 1) && i + 1 <= v + 0.001))
  }

  // ---------- the header: lesson number and title ----------
  function flagHtml(n) { return `<span class="e">Lesson <b>${n}</b> of 52</span><span class="ttl" lang="en">${esc(LESSONS[n - 1].title)}</span>` }
  function renderFlag(tt) {
    const i = stepAt(tt), s = SCRIPT[i], p = SCRIPT[i - 1]
    if (flagN !== s.lesson) { flagB.innerHTML = flagHtml(s.lesson); flagA.innerHTML = p && p.lesson !== s.lesson ? flagHtml(p.lesson) : ''; flagN = s.lesson }
    // a lesson change: the old lines go up and out, then the new come up into their place; the header leaves before the turn
    const change = p && p.lesson !== s.lesson
    const ua = change ? smooth(span(s.t, s.t + 0.22, tt)) : 1
    const ub = change ? smooth(span(s.t + 0.18, s.t + 0.5, tt)) : 1
    const uo = s.kind === 'open' ? out3(span(0.1, 0.6, tt)) : 1
    const gone = 1 - smooth(span(TURN.start, TURN.start + 0.25, tt))
    flagA.style.opacity = ((1 - ua) * gone).toFixed(3); flagA.style.visibility = ua < 0.997 && gone > 0.003 ? 'visible' : 'hidden'; flagA.style.transform = `translateY(${(-10 * ua).toFixed(1)}px)`
    flagB.style.opacity = (ub * uo * gone).toFixed(3); flagB.style.visibility = ub * uo * gone > 0.003 ? 'visible' : 'hidden'; flagB.style.transform = `translateY(${(10 * (1 - ub) + 8 * (1 - uo)).toFixed(1)}px)`
  }

  // ---------- the sentence ----------
  function stepAt(tt) { let i = 0; while (i + 1 < SCRIPT.length && tt >= SCRIPT[i + 1].t) i++; return i }
  const wordHtml = (text, label) => `<span class="sj-wash"></span>${label ? `<span class="sj-lab">${esc(label)}</span>` : ''}<span class="sj-t" lang="to"><span class="ta"></span><span class="tb"></span></span><i class="sj-u"></i>`
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
      c._type = type; c._wA = ta ? wordWidth(ta) : 0; c._wB = tb ? wordWidth(tb) : 0
      c._ta = c.querySelector('.ta'); c._tb = c.querySelector('.tb'); c._lab = c.querySelector('.sj-lab'); c._u = c.querySelector('.sj-u'); c._wash = c.querySelector('.sj-wash')
      c._ta.textContent = ta; c._tb.textContent = tb
      c._t = c.querySelector('.sj-t')
      cells.push(c); line.append(c)
    }
    // a sentence that enters whole (the opening, a sample) is laid out once at its full widths; the others morph between two layouts
    const LB = layoutWords(cells.map(c => c._wB)), LA = sample ? LB : layoutWords(cells.map(c => c._wA))
    if (sample) for (const c of cells) c._wA = c._wB
    const enH = enHeight(B.en)
    step = { i, s, p, cells, LA, LB, enH, hasLab: cells.some(c => c._lab), sample }
    stepIdx = i
    if (enKey !== B.en) { enA.textContent = A ? A.en : ''; enB.textContent = B.en; enKey = B.en }
  }
  function renderSentence(tt, H) {
    const i = stepAt(tt)
    if (i !== stepIdx) buildStep(i)
    const { s, p, cells, LA, LB, enH } = step
    // a sample enters once the sentence before it has left (0.26 s); a change or growth morphs over its own duration
    const e = s.kind === 'open' ? out3(span(s.t, s.t + s.dur, tt)) : s.kind === 'sample' ? out3(span(s.t + 0.26, s.t + 0.26 + s.dur, tt)) : smooth(span(s.t, s.t + s.dur, tt))
    const hLab = step.hasLab ? geo.labH + 6 : 0
    const blockH = lerp(LA.h, LB.h, e)
    const area = H - geo.railH
    const enGap = geo.narrow ? 14 : 20
    const total = blockH + enGap + enH
    const y0 = Math.max(8, (area - total) / 2 - (geo.narrow ? 2 : 10))
    line.style.transform = `translateY(${y0.toFixed(1)}px)`
    // the whole sentence leaves at the end
    const leave = smooth(span(LEAVE, LEAVE + 0.5, tt))
    sent.style.opacity = (1 - leave).toFixed(3); sent.style.visibility = leave < 0.997 ? 'visible' : 'hidden'
    sent.style.transform = `translateY(${(-12 * leave).toFixed(1)}px)`
    cells.forEach((c, ci) => {
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
        if (s.kind === 'open') lo = out3(span(0.9 + ci * 0.28, 1.2 + ci * 0.28, tt))
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
    // the old English goes up and out, then the new comes up into its place (a sample waits for its sentence)
    const lag = s.kind === 'sample' ? 0.26 : 0
    const ua = s.kind === 'open' ? 1 : smooth(span(s.t, s.t + 0.2 + lag * 0.5, tt))
    const ub = s.kind === 'open' ? out3(span(0.35, 0.95, tt)) : smooth(span(s.t + 0.16 + lag, s.t + 0.5 + lag, tt))
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
  // the ending: the course view hidden until the unfold; each lesson travels from its tick on the rail to its place; the road draws
  // itself; the ground turns blue in place; from the course beat's end exactly the course view, with nothing inline left on it
  const LOOK = { ahead: ['#fff', 'var(--line-strong,#d3cdc4)', 'var(--wr-muted)'], done: ['var(--wr-red)', 'var(--wr-red)', '#fff'] }
  function clearInline() {
    if (course.inert) course.inert = false
    for (const b of chips) { const s = b.firstChild.style; s.transform = s.backgroundColor = s.borderColor = s.color = s.opacity = s.visibility = '' }
    for (const e of course.querySelectorAll('.sb-gname')) { e.style.color = e.style.transform = e.style.opacity = e.style.visibility = '' }
    const rp = course._road.firstChild; if (rp) rp.style.stroke = rp.style.strokeOpacity = rp.style.strokeDasharray = rp.style.strokeDashoffset = ''
  }
  function renderCourse(tt) {
    if (tt < UNFOLD.start - 0.05) { clearInline(); course.inert = true; course.style.visibility = 'hidden'; course.style.opacity = 0; return }
    course.style.visibility = 'visible'; course.style.opacity = 1
    const rest = smooth(span(COURSE_BEAT.start, COURSE_BEAT.end - 0.1, tt))
    for (const b of chips) { const ttl = b.children[1]; if (ttl) { ttl.style.opacity = rest.toFixed(3); ttl.style.visibility = rest > 0.003 ? 'visible' : 'hidden' } }
    for (const e of course.querySelectorAll('.sb-hintc')) { e.style.opacity = rest.toFixed(3); e.style.visibility = rest > 0.003 ? 'visible' : 'hidden' }
    if (tt >= COURSE_BEAT.end) { clearInline(); return }
    // the lessons take no click or Tab until every one is in its place
    const settled = tt >= UNFOLD.end
    if (course.inert !== !settled) course.inert = !settled
    const m = smooth(span(TURN.start, TURN.start + 0.5, tt))
    const dur = 1.0, stagger = 0.07
    chips.forEach((b, i) => {
      const n = i + 1, gi = partOf(n), u = smooth(span(UNFOLD.start + gi * stagger, UNFOLD.start + gi * stagger + dur, tt))
      const s = b.firstChild.style
      // from the tick on the rail (stage coordinates) to the chip's own place
      const tx = geo.tickX[i] - (geo.courseOff.x + chipPos[i].x), ty = (geo.railTop + geo.railY) - (geo.courseOff.y + chipPos[i].y)
      const k = lerp(0.3, 1, u)
      s.transform = u >= 0.9995 ? '' : `translate(${(tx * (1 - u)).toFixed(2)}px,${(ty * (1 - u)).toFixed(2)}px) scale(${k.toFixed(4)})`
      const L = LESSONS_SHOWN.includes(n) ? LOOK.done : LOOK.ahead
      s.backgroundColor = mixC(L[0], BP, m); s.borderColor = mixC(L[1], RING, m); s.color = mixC(L[2], BPINK, m)
      const op = smooth(span(UNFOLD.start + gi * stagger, UNFOLD.start + gi * stagger + 0.25, tt))
      s.opacity = op.toFixed(3); s.visibility = op > 0.003 ? 'visible' : 'hidden'
    })
    course.querySelectorAll('.sb-gname').forEach((e, gi) => {
      const u = smooth(span(UNFOLD.start + gi * stagger, UNFOLD.start + gi * stagger + dur, tt))
      const nb = geo.nameBox[gi]
      const tx = geo.partX[gi] - (geo.courseOff.x + nb.x), ty = (geo.railTop + geo.railY - 18) - (geo.courseOff.y + nb.y)
      e.style.transform = u >= 0.9995 || geo.narrow ? '' : `translate(${(tx * (1 - u)).toFixed(2)}px,${(ty * (1 - u)).toFixed(2)}px) scale(${lerp(0.8, 1, u).toFixed(4)})`
      e.style.color = mixC('var(--wr-muted)', BPINK, m)
      const op = geo.narrow ? smooth(span(UNFOLD.start + 0.5, UNFOLD.start + 1.0, tt)) : smooth(span(UNFOLD.start + gi * stagger, UNFOLD.start + gi * stagger + 0.3, tt))
      e.style.opacity = op.toFixed(3); e.style.visibility = op > 0.003 ? 'visible' : 'hidden'
    })
    const rp = course._road.firstChild
    if (rp) {
      const draw = out3(span(UNFOLD.start + 0.45, UNFOLD.start + 1.45, tt))
      rp.style.stroke = mixC('var(--wr-red)', RING, m); rp.style.strokeOpacity = lerp(0.9, 0.7, m).toFixed(3)
      rp.style.strokeDasharray = `${geo.roadLen.toFixed(1)} ${geo.roadLen.toFixed(1)}`; rp.style.strokeDashoffset = (geo.roadLen * (1 - draw)).toFixed(1)
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
    rail.style.visibility = 'hidden'; rail.style.opacity = 0
    stage.style.height = geo.courseWide ? geo.H + 'px' : ''
    courseAtRest()
    bPause.hidden = true; bSkip.hidden = true; bReplay.hidden = false
    renderPv(false)
  }
  function render(tt) {
    if (destroyed) return
    t = clamp(tt, 0, END)
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
    // stage height: one height on desktop; a phone grows to the course view as the unfold starts
    const H = g.courseWide ? g.H : lerp(g.playH, Math.max(g.playH, g.courseH), smooth(span(UNFOLD.start - 0.45, UNFOLD.start, t)))
    stage.style.height = H + 'px'
    g.railTop = H - g.railH
    renderFlag(t)
    if (t < LEAVE + 0.5) renderSentence(t, H)
    else { sent.style.visibility = 'hidden'; sent.style.opacity = 0 }
    renderRail(t)
    renderCourse(t)
    pv.hidden = true
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
export default { mount, unmount, TIMELINE, SCRIPT }
