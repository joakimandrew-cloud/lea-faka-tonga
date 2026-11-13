// The course map: the 2026-10-08 course view (the six named parts, Lessons 1 to 52 on one road, a preview card for each
// lesson, its keyboard handling), standing on its own under the frame film on the homepage since 2026-11-13
// (plans/2026-11-13-frame-film-homepage.md). Until then it was the last frame of the sentence seed. Its markup, its styles
// and its behaviour are lifted from src/premium/lib/blueprint/sentence-seed.js line for line (buildCourse, layoutCourse,
// courseAtRest, the preview card and the events), with the same class names, so the two can be read side by side; the seed's
// file is left as it is. What is gone is what belonged to the seed's film: the Play, Replay and Skip buttons and the fold of
// the plant into the map. The map is at rest from the start.
// Lesson titles, topics, parts and the preview sentences come from src/data/sentence-bloom-data.js, as before.
// Self-contained ES module, no dependencies. mount(element, options) returns a controller; unmount() removes it.
import DATA from '@app/data/sentence-bloom-data.js'
import { okinafy } from '@app/lib/okinafy.js'

const ROWS = DATA.rows, LESSONS = DATA.lessons, COURSE = DATA.course
const BP = '#0d375c', RING = '#c4deff', BPINK = '#deecff'
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e }
const GROUP = Object.fromEntries(COURSE.groups.map(g => [g.key, okinafy(g.name)]))

// Topics: Tongan words marked lang="to" as the site's Mixed component does (src/premium/pages/Lessons.jsx), with the
// term list and pattern of splitMixedTonganText in src/lib/lesson-browser.js (as in the seed).
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

// The seed's rules for the course view and its card, unchanged.
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
.sb-bphead .eb{margin:0 0 6px;color:${RING};font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.sb-bphead h3{margin:0;font:800 40px/.92 var(--f-display);letter-spacing:-.005em;text-transform:uppercase;color:#fff}
.sb-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 14px;border:1px solid var(--home-rule,#cfcfcf);border-radius:2px;background:#fff;color:var(--wr-ink);font:600 13px/1.1 var(--f-ui);cursor:pointer;white-space:nowrap}
.sb-btn:hover{border-color:var(--wr-red);color:var(--wr-red-deep)}
.sb-btn[hidden]{display:none}
.sb :focus-visible{outline:3px solid var(--wr-red-deep);outline-offset:3px;border-radius:2px}
.sb.is-dark .sb-top :focus-visible,.sb.is-dark .sb-course :focus-visible{outline-color:#fff}
.sb.is-dark .sb-course .sb-ls:focus-visible{box-shadow:0 0 0 6px ${BP}}
.sb-stage{position:relative;z-index:1;overflow:hidden}
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
.sb.is-narrow .sb-panel{padding:12px 6px 14px}
.sb.is-narrow .sb-hd{min-height:68px}
.sb.is-narrow .sb-btn{padding:0 10px;font-size:12.5px}
.sb.is-narrow .sb-bphead h3{font-size:25px}
.sb.is-narrow .sb-course{padding:8px 4px 10px}
.sb.is-tiny .sb-btn{padding:0 8px;font-size:12px}
@media (hover:none){.sb-keys{display:none}}
@media (prefers-reduced-motion:reduce){.sb *{transition:none!important;animation:none!important}}
.sb:not(.is-narrow) .sb-top{flex-wrap:nowrap}
`

let styleEl = null, styleRefs = 0, uid = 0
const instances = new Set()

export function mount(el, options = {}) {
  if (!el) throw new Error('mount needs an element')
  for (const inst of instances) if (inst.el === el) inst.destroy()
  const opt = { lessonHref: n => `/lessons/${n}`, onNavigate: null, ...options }

  if (!styleEl) { styleEl = document.createElement('style'); styleEl.setAttribute('data-course-map', ''); styleEl.textContent = CSS; document.head.appendChild(styleEl) }
  styleRefs++

  // ---------- DOM ----------
  const root = h('div', 'sb is-end is-dark')
  root.setAttribute('role', 'group')
  root.setAttribute('aria-label', 'The course map: Lessons 1 to 52 in six parts, each lesson open to preview')
  const panel = h('div', 'sb-panel')
  const ground = h('div', 'sb-ground'); ground.setAttribute('aria-hidden', 'true'); ground.style.opacity = 1
  const top = h('div', 'sb-top')
  const hd = h('div', 'sb-hd')
  const chead = h('div', 'sb-bphead', '<p class="eb">The course</p><h3>Lessons 1 to 52, in order.</h3>')
  hd.append(chead)
  top.append(hd)
  const stage = h('div', 'sb-stage'); stage.setAttribute('data-stage', '')
  const course = h('div', 'sb-course'); course.setAttribute('role', 'group'); course.setAttribute('aria-label', 'The 52 lessons, in six parts')
  stage.append(course)
  panel.append(ground, top, stage)
  const pv = h('aside', 'sb-pv')
  pv.setAttribute('aria-labelledby', 'cm-pv-h-' + (++uid))
  pv.hidden = true
  const live = h('div', 'sb-sr'); live.setAttribute('aria-live', 'polite')
  root.append(panel, pv, live)
  el.append(root)
  const pvId = pv.getAttribute('aria-labelledby')

  // ---------- state ----------
  let W = 0, geo = null, selected = 0, pvOpen = false, destroyed = false
  let chips = [], courseKey = '', chipPos = []

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
    stage.style.height = ''
    buildCourse()
    layoutCourse()
    if (courseWide) geo.playH = Math.max(geo.playH, geo.courseH, measurePvMax() + 16)
    geo.H = geo.playH
    stage.style.height = geo.courseWide ? geo.H + 'px' : ''
    courseAtRest()
    renderPv(false)
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

  // ---------- the course view: the site's six named parts, every row left to right ----------
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
    geo.courseH = Math.ceil(course.offsetHeight)
    geo.rowsOf = rows.map(r => r.ns)
    course.style.visibility = keepVis; course.style.opacity = keepOp
    if (wasOpen && pvOpen) placePv()
  }
  function courseAtRest() {
    course.style.visibility = 'visible'; course.style.opacity = 1
  }

  // ---------- the preview card ----------
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

  // ---------- events ----------
  const cleanups = []
  const on = (target, type, fn, o) => { target.addEventListener(type, fn, o); cleanups.push(() => target.removeEventListener(type, fn, o)) }
  on(course, 'click', ev => {
    const b = ev.target.closest('.sb-ls'); if (!b) return
    const n = +b.dataset.n
    if (pvOpen && n === selected) { closePv(true); return }
    select(n, { announce: true })
  })
  on(course, 'focusin', ev => {
    const b = ev.target.closest('.sb-ls'); if (!b) return
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
  let ro = null
  const relayout = () => { if (destroyed) return; const w = stage.clientWidth; if (Math.abs(w - W) < 1 && geo) return; classify(); if (pvOpen) renderPv(false) }
  if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => relayout()); ro.observe(root) }

  // ---------- start ----------
  classify()
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => { if (!destroyed) { courseKey = ''; classify(); if (pvOpen) renderPv(false) } })

  const controller = {
    el, root,
    get selected() { return pvOpen ? selected : 0 }, get cardOpen() { return pvOpen },
    get geometry() { return { ...geo, width: W } },
    select: n => select(n, { announce: true }), close: () => closePv(false),
    destroy() {
      if (destroyed) return
      destroyed = true
      cleanups.forEach(f => f()); if (ro) ro.disconnect()
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

export default { mount, unmount }
