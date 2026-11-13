// The frame film: the homepage's "Every lesson adds a piece." piece from 2026-11-13 (plans/2026-11-13-frame-film-homepage.md).
// It is the local film Andrew approved on 13 November (reviews/sentence-frame-2026-11-13/preview/film.js and film.css in the
// backup repo), rebuilt as a module of the site. It takes the place of the sentence seed (sentence-seed.js, kept beside this
// file, unused) in src/premium/components/HomeBlueprint.jsx; the course map the seed ended on is now course-map.js, under it.
//
// One sentence, Naʻá ke kai., is shown in its three named parts; each part turns through the printed sentences that differ in
// that part alone; the sentence becomes row 1 of a frame that gains a row for each of Lessons 2 to 4 and 6 to 11, with what
// the lesson adds shaded; commands (Lesson 5) and the ko sentences (Lesson 12) get tables of their own; Lessons 13 to 52 pass
// as a road of whole sentences; it ends on the first sentence and Start Lesson 1.
//
// Every element is text placed by one function of time, render(t), so seek(t) shows exactly what play shows at t. Every
// sentence, part, heading, count and line of copy comes from src/data/sentence-frame-data.js, which is generated from the
// approved film's own data; nothing is typed here. Rulings it carries (DECISIONS.md, 2026-11-13): navy; "over 1,000 sentences"
// with 1,041 as a floor; the road's 12.4 s.
//
// The film lives in a shadow root on its host, so the page's styles cannot reach its type and its own cannot reach the page.
// It has no top bar of its own (Andrew, 2026-11-13): the strip that bar took stays as empty navy at the film's top, at the
// height that bar was (64 px; 56 px on a phone), so the film keeps the room it was approved in and the site's bar (70 px; 62 px)
// can slide away and return over the strip without reaching the film's headline.
// Under the film is the approved film's own link, "Read the film as text", which opens the film's content as tables on the page.
// It starts by itself when at least half of it is in view, pauses when it leaves and carries on from the same place when it
// returns (Andrew, 2026-11-13); a pause by the visitor is never undone by the page. With reduced motion asked for it does not
// start by itself: it holds on the finished frame until Resume is pressed.
// The approved film was laid out, and checked, for one room: 836 px tall and at least 1,120 px wide (788 px tall on a phone),
// its 1440x900 and 390x844 windows less its own top bar.
// A browser window is often shorter, and a tablet narrower. So the film is always laid out in at least that room and, where
// the box the page gives it is smaller, drawn smaller to fit, as a video would be (ruled for the phone, 2026-11-14). The controls
// keep their size. It plays whole, 80.65 s (ruled 2026-11-14).
// Self-contained ES module, no dependencies. mount(element, options) returns a controller; unmount() removes it.
// Contract for the check tools: controller.state() reads every text and opacity back from the page itself.
import DATA from '@app/data/sentence-frame-data.js'

// Broken copies and address switches exist only in a build made with `vite build --mode frametest`; in the production build
// this is the literal false and everything behind it is dropped.
const TEST = import.meta.env.MODE === 'frametest'

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const ramp = (t, a, b) => (b === Infinity ? 0 : clamp((t - a) / (b - a)))      // a fade that never comes is 0, not NaN
const lerp = (a, b, p) => a + (b - a) * p
const eo = p => 1 - Math.pow(1 - p, 3)
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
const ap = (t, t0, d = .35) => eo(ramp(t, t0, t0 + d))
const fmt = (s, v = {}) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m))
const nf = n => n.toLocaleString('en-US')
const bare = w => w.normalize('NFD').replace(/́/g, '').normalize('NFC').toLowerCase()

// The approved film's film.css, line for line where the film is concerned. What differs: the page rules (html, body) sit on
// the wrapper; the film's own top bar (.masthead) is gone; the film is as tall as the window, up to 940 px, with an empty
// strip at its top (--ff-inset) as tall as the film's bar was, 64 px (56 px on a phone).
const CSS = `
:host{all:initial;display:block;position:relative}
*{box-sizing:border-box;margin:0;padding:0}
.ff{font-family:'Inter Variable',system-ui,sans-serif;font-synthesis:none;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;color:#171b1e;-webkit-text-size-adjust:100%;text-align:left;line-height:normal}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.meas{position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:nowrap}
a{color:inherit}
button{font:inherit;color:inherit}

.navy{--bg:radial-gradient(120% 95% at 80% 22%,#143750 0%,#0c2434 44%,#081720 100%);--flat:#0a1d2a;--ink:#f4f7f9;--soft:#b3c5d0;--faint:#7890a0;--rule:rgba(190,210,222,.2);--slot:rgba(190,210,222,.3);--tint:18%;
  --tense:#e1b660;--pron:#55c8dd;--verb:#f4818d;--mark:#abaddf;--other:#72c8ae;--accent:#e1b660;--btn:rgba(255,255,255,.07)}
.tense{--c:var(--tense)}.pron{--c:var(--pron)}.verb{--c:var(--verb)}.mark{--c:var(--mark)}.other{--c:var(--other)}

/* ---------- the film ---------- */
.watch{position:relative;height:min(100vh,940px);height:min(100svh,940px);min-height:650px;overflow:hidden;background:var(--bg);color:var(--ink);isolation:isolate;--m:clamp(22px,5.28vw,76px);--bar:72px}
/* everything but the controls: the film's room, under the strip kept for the site's bar; laid out at the film's own size and scaled to the box (see build()) */
.canvas{position:absolute;left:0;top:var(--ff-inset);width:100%;height:calc(100% - var(--ff-inset));transform-origin:0 0}
/* The film's own bar is gone; the room it took at the top (64 px, 56 px on a phone) stays empty, so the film keeps the room it was approved in and the site's bar (70 px, 62 px) can come and go over that strip without reaching the headline. */
.ff{--ff-inset:64px}
.hud{position:absolute;left:var(--m);right:var(--m);top:40px;z-index:3;pointer-events:none}
.hud>*,.side{will-change:opacity}   /* always their own layers, so a fade leaves the same pixels behind every time */
.eyebrow{display:flex;align-items:center;gap:10px;font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--soft);white-space:nowrap}
.eyebrow i{flex:none;width:6px;height:6px;border-radius:50%;background:var(--accent)}
.hud h2{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:62px;line-height:.93;text-transform:uppercase;margin-top:13px;text-wrap:balance}
.hud .sub{margin-top:13px;font-size:15.5px;line-height:1.5;color:var(--soft);max-width:46em;min-height:1.5em;text-wrap:pretty}
.side{position:absolute;right:var(--m);top:44px;z-index:3;text-align:right;pointer-events:none}
.side .num{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:66px;line-height:.86;font-variant-numeric:tabular-nums}
.side .cap{margin-top:9px;font-weight:700;font-size:9.5px;line-height:1.45;letter-spacing:.16em;text-transform:uppercase;color:var(--soft)}

.stage{position:absolute;inset:0;z-index:1}
.stage>*{position:absolute;left:0;top:0;visibility:hidden}
.w{white-space:nowrap;font:italic 500 27px/1.15 'Source Serif 4 Variable',serif;padding-bottom:.3em;color:var(--ink);isolation:isolate}
.w .u{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--c);transform-origin:0 50%}
.slotline{height:0;border-bottom:1px dotted var(--slot)}
.rrow{display:grid;grid-template-columns:44px 230px minmax(0,1.45fr) minmax(0,1fr);column-gap:24px;align-items:baseline;padding:12px 0 11px;border-bottom:1px solid var(--rule)}
.w .shade{position:absolute;left:-.27em;right:-.27em;top:-.2em;bottom:-.14em;border-radius:2px;background:color-mix(in srgb,var(--c) var(--tint),transparent);z-index:-1;opacity:0}
.w .t{display:block}
.w.hero{perspective:900px;padding-bottom:.1em}
.w.big{padding-bottom:.1em}
.w.hero .shade,.w.big .shade{left:-.15em;right:-.15em;top:-.1em;bottom:-.1em}
.w.hero .t{transform-origin:50% 58%;backface-visibility:hidden}
.w.hero .t.b{position:absolute;left:0;top:0}
.lab{font-weight:700;font-size:9.5px;line-height:1.35;letter-spacing:.14em;text-transform:uppercase;color:var(--c);white-space:nowrap}
.lab small{display:block;margin-top:4px;font-weight:600;font-size:8.5px;letter-spacing:.12em;color:var(--faint)}
.lab.wrap{white-space:normal}
.rule{height:1px;background:var(--rule)}
.en{font-size:14px;line-height:1.35;color:var(--soft)}
.en.hero{font-size:18px}
.tag b{display:block;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:17px;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap}
.tag span{display:block;margin-top:2px;font-size:11.5px;line-height:1.3;color:var(--faint)}
.tag.inline b,.tag.inline span{display:inline}
.tag.inline span{margin-left:9px}
.ask{font-weight:700;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--c);white-space:nowrap}
.item{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:12px 0 11px;border-bottom:1px solid var(--rule)}
.item .s{font:italic 500 24px/1.2 'Source Serif 4 Variable',serif;white-space:nowrap;color:var(--soft)}
.item .s b{font-weight:500;color:var(--ink);border-bottom:2px solid var(--c);padding-bottom:2px}
.item .e{font-size:13px;line-height:1.3;color:var(--soft);text-align:right}
.ttl{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:24px;line-height:1;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap}
.ttl small{margin-left:12px;font-family:'Inter Variable',sans-serif;font-weight:700;font-size:9.5px;letter-spacing:.18em;color:var(--faint);vertical-align:middle}
.rnum{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:22px;line-height:1;font-variant-numeric:tabular-nums;color:var(--ink)}
.rtitle{font-weight:700;font-size:9.5px;line-height:1.4;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.rs{font:italic 500 25px/1.22 'Source Serif 4 Variable',serif;color:var(--ink)}
.ren{font-size:13.5px;line-height:1.35;color:var(--soft)}
.cta{display:inline-flex;align-items:center;gap:12px;padding:15px 24px;border-radius:999px;background:var(--ink);color:var(--flat);font-weight:700;font-size:15px;text-decoration:none;white-space:nowrap}
.cta .arrow{font-size:20px;line-height:1}

.bar{position:absolute;left:var(--m);right:var(--m);bottom:0;height:var(--bar);display:flex;align-items:center;gap:20px;z-index:4}
.bar .buttons{display:flex;gap:8px}
.bar button{display:flex;align-items:center;gap:8px;height:34px;padding:0 15px;border-radius:999px;border:1px solid var(--rule);background:var(--btn);color:var(--ink);font-weight:600;font-size:12px;cursor:pointer}
.bar button .glyph{font-size:12px;line-height:1;width:12px;text-align:center}
.bar button:focus-visible,.rail:focus-visible,.cta:focus-visible,.bar a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.rail{position:relative;flex:1;height:40px;cursor:pointer;touch-action:none}
.rail .ticks{position:absolute;left:0;right:0;top:6px;height:16px;display:flex;justify-content:space-between;align-items:flex-end}
.rail .ticks b{width:1px;height:7px;background:var(--slot)}
.rail .ticks b.on{width:2px;height:11px;background:var(--accent)}
.rail .ticks b.now{height:16px}
.rail .track{position:absolute;left:0;right:0;top:29px;height:1px;background:var(--rule)}
.bar .where{min-width:112px;text-align:right;font-weight:700;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);white-space:nowrap}
.under{display:flex;justify-content:flex-end;gap:24px;padding:14px clamp(18px,5.28vw,76px);font-size:13px;color:#55636c;border-bottom:1px solid #e7e9eb;background:#fff}
.under button{border:0;background:none;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.under button:focus-visible{outline:2px solid #b92e0e;outline-offset:3px}

/* ---------- phone ---------- */
@media (max-width:719px){
  .ff{--ff-inset:56px}
  .watch{min-height:675px;--bar:60px}
  .hud{top:26px}
  .eyebrow{font-size:9.5px;letter-spacing:.17em}
  .hud h2{font-size:36px;margin-top:10px}
  .hud .sub{margin-top:9px;font-size:13.5px;line-height:1.42}
  .side{right:auto;left:var(--m);text-align:left;display:flex;align-items:baseline;gap:10px}
  .side .num{font-size:34px}.side .cap{margin-top:0;font-size:8.5px}
  .bar{gap:12px}.bar button{height:32px;padding:0 11px}.bar button .txt{display:none}.bar .where{display:none}
  .lab{font-size:8px;letter-spacing:.11em}.lab small{font-size:7.5px;margin-top:3px}
  .en{font-size:13.5px}.en.hero{font-size:15.5px}
  .tag b{font-size:15px}.tag span{font-size:11px}
  .item{padding:10px 0 9px}.item .s{font-size:21px}.item .e{font-size:12px}
  .ttl{font-size:20px}.ttl small{display:block;margin:6px 0 0}
  .rs{font-size:20px}.ren{font-size:13px}.rnum{font-size:19px}.rtitle{font-size:8.5px}
  .side .num{line-height:1}
  .eyebrow{white-space:normal;align-items:baseline}
  .rrow{grid-template-columns:30px 1fr;column-gap:12px;row-gap:3px;padding:11px 0 10px}.rrow .rnum{grid-row:1/4}.rrow>*:not(.rnum){grid-column:2}
}

/* ---------- the film as a page ---------- */
.still{padding:64px clamp(18px,5.28vw,76px) 96px;background:var(--bg);color:var(--ink)}
.still h2{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:54px;line-height:.95;text-transform:uppercase;text-wrap:balance}
.still h3{margin:64px 0 6px;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:28px;line-height:1;text-transform:uppercase;letter-spacing:.01em}
.still .lead{margin-top:14px;font-size:15.5px;line-height:1.5;color:var(--soft);max-width:34em;text-wrap:pretty}
.still .w{position:relative;display:inline-block}
.still .w.new .shade{opacity:1}
.still .role{display:block;margin-top:8px;font-weight:700;font-size:9px;line-height:1.45;letter-spacing:.12em;text-transform:uppercase;color:var(--soft)}
.s-seed{display:flex;flex-wrap:wrap;gap:22px;margin-top:30px}
.s-seed .w{font-size:54px}.s-seed .w .u{height:3px}
.s-en{margin-top:14px;font-size:17px;color:var(--soft)}
.s-swaps{display:grid;grid-template-columns:repeat(3,1fr);column-gap:44px;margin-top:14px}
.s-swaps .ask{margin-top:18px}
.s-swaps ul{list-style:none;margin-top:6px}
.s-grid{display:grid;column-gap:22px;align-items:end;margin-top:20px;overflow-x:auto}
.s-grid .fh{padding-bottom:11px;border-bottom:1px solid var(--rule);font-weight:700;font-size:9.5px;line-height:1.35;letter-spacing:.14em;text-transform:uppercase;color:var(--c);white-space:nowrap}
.s-grid .fh small{display:block;margin-top:4px;font-weight:600;font-size:8.5px;letter-spacing:.12em;color:var(--faint)}
.s-grid .fh.blank{border-bottom-color:transparent}
.s-grid .lt{padding-top:16px}
.s-grid .cell{display:flex;align-items:flex-end;gap:20px;padding-top:16px}
.s-grid .cell.empty{height:0;padding:0;border-bottom:2px dotted var(--slot);min-width:28px}
.s-grid .gen{grid-column:2/-1;margin-top:8px;font-size:14px;color:var(--soft)}
.s-rows{display:none}
.s-rows .prow{margin-top:24px;padding-top:15px;border-top:1px solid var(--rule)}
.s-rows .parts{display:flex;flex-wrap:wrap;column-gap:19px;row-gap:14px;margin-top:13px}
.s-rows .w{font-size:24px}
.s-rows .pen{margin-top:11px;font-size:13.5px;color:var(--soft)}
.s-two{display:grid;grid-template-columns:1fr 1fr;column-gap:64px}
.s-two>div{min-width:0}
.s-grid{max-width:100%}
.s-road{margin-top:18px;display:grid;grid-template-columns:44px minmax(150px,250px) minmax(0,1.5fr) minmax(0,1fr);column-gap:22px;row-gap:0;align-items:baseline}
.s-road .sen>*{padding:13px 0;border-bottom:1px solid var(--rule)}
.s-end{margin-top:72px}
.s-end .cta{margin-top:26px}
@media (max-width:899px){
  .still h2{font-size:40px}.still h3{font-size:24px;margin-top:52px}
  .s-seed .w{font-size:40px}.s-swaps{grid-template-columns:1fr}.s-two{grid-template-columns:1fr}
  .s-grid.wide{display:none}.s-rows{display:block}
  .s-two .s-grid{column-gap:12px}.s-two .s-grid .w{font-size:21px}.s-two .s-grid .fh{white-space:normal;font-size:8px;letter-spacing:.1em}.s-two .s-grid .cell{gap:10px}
  .s-road{grid-template-columns:34px 1fr}.s-road .rtitle{padding-bottom:0;border-bottom:0}.s-road .rs{grid-column:2;padding:4px 0 0;border-bottom:0}.s-road .ren{grid-column:2;padding-top:4px}.s-road .rnum{grid-row:span 3;border-bottom:0}
}
`

const instances = new Set()

export function mount(el, options = {}) {
  if (!el) throw new Error('mount needs an element')
  for (const inst of instances) if (inst.el === el) inst.destroy()
  const opt = { lessonHref: n => `/lessons/${n}`, onNavigate: null, ...options }

  // ---------- the data, and (in a test build only) a broken copy of it ----------
  const BRK = {}
  let D = DATA
  if (TEST && opt.break) {
    D = JSON.parse(JSON.stringify(DATA))
    const name = opt.break, row = D.frame.rows[2]                 // the Lesson 3 row
    if (name === 'wrongtext') { row.parts[2].text = 'inu'; row.text = row.parts.map(p => p.text).join(' ') }
    if (name === 'wrongenglish') row.english = 'They ate a lot of bread.'
    if (name === 'wronglabel') { const p = D.frame.rows[3].parts[5]; p.col = 'place'; p.family = 'other' }
    if (name === 'wrongcount') { D.counts.cumulative[52] += 3; D.road[D.road.length - 1].count += 3 }
    if (name === 'wrongtag') D.titles[6] = D.titles[9]
    for (const k of ['mixed', 'overlap', 'ghostend', 'frozen', 'noenglish', 'squeeze']) if (name === k) BRK[k] = true
  }
  const C = D.copy

  // ---------- DOM: a shadow root on the host, the film's own markup inside it ----------
  const shadow = el.shadowRoot || el.attachShadow({ mode: 'open' })
  shadow.textContent = ''
  const style = document.createElement('style'); style.textContent = CSS
  const root = document.createElement('div')
  root.className = 'ff'
  root.innerHTML = `
    <section id="watch" class="watch navy">
      <div class="canvas" id="canvas">
        <div class="hud" id="hud" aria-hidden="true">
          <p class="eyebrow" id="eyebrow"><i></i><span id="eyebrow-text"></span></p>
          <h2 id="head"></h2>
          <p class="sub" id="sub"></p>
        </div>
        <div class="side" id="side" aria-hidden="true"><div class="num" id="side-num"></div><div class="cap" id="side-cap"></div></div>
        <div class="stage" id="stage" role="img"></div>
      </div>
      <div class="bar" id="bar">
        <div class="buttons">
          <button id="pause" type="button"><span class="glyph" id="pause-glyph" aria-hidden="true">Ⅱ</span><span class="txt" id="pause-label"></span></button>
          <button id="replay" type="button"><span class="glyph" aria-hidden="true">↻</span><span class="txt" id="replay-label"></span></button>
        </div>
        <div class="rail" id="rail" role="slider" tabindex="0" aria-valuemin="1" aria-valuemax="52" aria-valuenow="1"><div class="ticks" id="ticks"></div><div class="track"></div></div>
        <p class="where" id="where"></p>
      </div>
    </section>
    <div class="under" id="under"><button type="button" id="still-link" aria-expanded="false"></button></div>
    <section id="still" class="still navy" hidden></section>`
  shadow.append(style, root)
  const $ = id => root.querySelector('#' + id)
  const watch = $('watch'), canvas = $('canvas'), stage = $('stage'), hud = $('hud'), bar = $('bar'), eyebrowP = $('eyebrow'), eyebrowEl = $('eyebrow-text'), headEl = $('head'), subEl = $('sub')
  const side = $('side'), sideNum = $('side-num'), sideCap = $('side-cap'), ticksEl = $('ticks'), whereEl = $('where'), rail = $('rail')
  stage.setAttribute('aria-label', C['stage.aria'])
  rail.setAttribute('aria-label', fmt(C['rail.aria'], { n: 1 }))
  $('replay-label').textContent = C['ctl.replay']
  $('replay').setAttribute('aria-label', C['ctl.replay'])
  const cleanups = []
  const on = (target, type, fn, o) => { target.addEventListener(type, fn, o); cleanups.push(() => target.removeEventListener(type, fn, o)) }
  const go = (ev, href) => { if (opt.onNavigate && !(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button)) { ev.preventDefault(); opt.onNavigate(href, ev) } }
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
  const reduce = opt.reducedMotion ?? (mq ? mq.matches : false)

  // ---------- the timeline: times only, the same at every width ----------
  const TL = (() => {
    const sen = s => ({ id: s.id, words: s.words || s.parts.map(p => p.text), english: s.english, lesson: s.lesson })
    const S0 = sen(D.seed), groups = D.swaps
    const a2 = 6.4, steps = [], lands = [], win = []
    let t = a2 + 1.0
    const turn = (to, dur, hold, g, i) => { steps.push({ t, dur, to, from: steps.length ? steps[steps.length - 1].to : S0, g }); if (i != null) lands.push({ t: t + dur, g, i, lesson: to.lesson }); t += dur + hold }
    let gone = a2 + .5
    groups.forEach((g, gi) => {
      const from = gone
      g.items.forEach((s, i) => turn(sen(s), gi === 0 ? (i ? .7 : .8) : gi === 1 ? .6 : .65, gi === 0 ? (i ? 1.4 : 1.0) : gi === 1 ? (i ? .7 : .85) : .8, gi, i))
      turn(S0, .6, gi === 2 ? .3 : .35, gi)
      win.push([from, t - .25]); gone = t - .23
    })
    const count2 = t, a3 = t + 1.9
    const rows = D.frame.rows.map((r, i) => i === 0 ? a3 : a3 + 2.4 + (i - 1) * 2.65)
    const a4 = rows[rows.length - 1] + 2.65 + .8
    const tab = [a4 + .5, a4 + 4.7]            // the second table waits until the first has been read
    const a5 = a4 + (TEST && BRK.frozen ? 12.2 : 9.2), road0 = a5 + .9, road1 = a5 + 13.3, end = a5 + 13.8, total = a5 + 17.4
    const roadEase = p => lerp(p, eio(p), .25)
    const roadU = t => (D.road.length - 1) * roadEase(ramp(t, road0, road1))
    // when each lesson is first on screen
    const lessonT = { 1: .35 }
    for (const l of lands) if (!(l.lesson in lessonT)) lessonT[l.lesson] = l.t
    D.frame.rows.forEach((r, i) => { if (i) lessonT[r.lesson] = rows[i] })
    D.tables.forEach((tb, i) => { lessonT[tb.lesson] = tab[i] })
    D.road.forEach((r, i) => { let tt = a5 + .5; if (i) for (tt = road0; tt < road1 && roadU(tt) < i - .5; tt += .01); lessonT[r.lesson] = tt })
    const stops = Object.entries(lessonT).map(([l, tt]) => ({ lesson: +l, t: tt })).sort((x, y) => x.t - y.t)
    // when a sentence of each lesson is first on screen at all (Lesson 2's first is a neighbour in act 2)
    const seen = { ...lessonT }
    for (const l of lands) seen[l.lesson] = Math.min(seen[l.lesson], l.t)
    return { S0, groups, a1: 0, seedIn: .35, part: [1.5, 2.3, 3.1], en1: 4.1, a2, steps, lands, win, count2, a3, rows, a4, tab, a5, road0, road1, end, total, roadU, lessonT, stops, seen }
  })()

  // ---------- small DOM helpers ----------
  const meas = document.createElement('span'); meas.className = 'meas'; root.appendChild(meas)
  const mcache = new Map()
  const DPR = Math.max(1, Math.round(window.devicePixelRatio || 1))
  function textW(text, cls, px) {
    const k = cls + '|' + px + '|' + text
    if (!mcache.has(k)) { meas.className = 'meas ' + cls; meas.style.fontSize = px + 'px'; meas.textContent = text; mcache.set(k, meas.getBoundingClientRect().width) }
    return mcache.get(k)
  }
  function mk(tag, cls, text) { const e = document.createElement(tag); e.className = cls; if (text != null) e.textContent = text; stage.appendChild(e); return e }
  function word(text, fam, hero) {
    const e = mk('span', 'w ' + fam + (hero ? ' hero' : ''))
    e.innerHTML = '<i class="shade"></i><i class="u"></i><span class="t a"></span>' + (hero ? '<span class="t b"></span>' : '')
    e._shade = e.children[0]; e._u = e.children[1]; e._a = e.children[2]; e._b = e.children[3]
    e._a.textContent = text
    return e
  }
  const ERRORS = []
  function put(e, x, y, o) {
    if (!(o >= 0 && o <= 1.0001) || !isFinite(x) || !isFinite(y)) { ERRORS.push('put ' + [x, y, o].join(',') + ' on ' + e.className); o = 0 }
    if (o < .004) { if (e._v !== 0) { e.style.visibility = 'hidden'; e._v = 0 } return false }
    if (e._v !== 1) { e.style.visibility = 'visible'; e._v = 1 }
    e.style.transform = 'translate(' + Math.round(x * DPR) / DPR + 'px,' + Math.round(y * DPR) / DPR + 'px)'   // whole device pixels: crisp type, the same raster every time
    e.style.opacity = o > .996 ? '1' : o.toFixed(3)
    return o > .05
  }
  const setText = (e, s) => { if (e._s !== s) { e.textContent = s; e._s = s } }
  const setO = (e, o) => { if (!(o >= 0 && o <= 1)) { ERRORS.push('opacity ' + o + ' on ' + (e.id || e.className)); o = 0 } const v = o > .996 ? '1' : o < .004 ? '0' : o.toFixed(3); if (e._o !== v) { e.style.opacity = v; e._o = v } }

  // what is drawn at this instant, for state()
  const rep = { s: [], p: [], l: [], n: [], c: [], g: [] }
  const cur = { t: 0, lesson: 1, act: 1 }

  // ---------- the scene: built for a width, rebuilt on resize ----------
  let scene = null
  function build() {
    stage.textContent = ''
    // The box the page gives the film, and the film's room inside it: the box less the strip at its top. The film is laid out
    // in a room at least as tall (and, off a phone, as wide) as the one it was built and checked for; where the box gives less,
    // the whole canvas is scaled to fit. At a scale of 1 the room is the box's own, and the layout is the approved film's.
    const box = watch.getBoundingClientRect()
    const inset = canvas.offsetTop
    const roomW = box.width, roomH = box.height - inset
    const PH = roomW < 720
    const NEED_H = PH ? 788 : 836, NEED_W = PH ? 0 : 1120
    const fit = Math.min(roomH / NEED_H, NEED_W ? roomW / NEED_W : 1)
    const SC = fit >= .9995 ? 1 : fit
    canvas.style.width = (roomW / SC).toFixed(3) + 'px'; canvas.style.height = (roomH / SC).toFixed(3) + 'px'
    canvas.style.transform = SC < 1 ? 'scale(' + SC + ')' : ''
    canvas.style.setProperty('--m', ((parseFloat(getComputedStyle(bar).left) || 0) / SC) + 'px')      // the film's side margin meets the controls' own
    const R = { left: box.left, top: box.top + inset }
    const W = roomW / SC, H = roomH / SC
    const M = (hud.getBoundingClientRect().left - R.left) / SC
    const bottom = H - bar.getBoundingClientRect().height / SC - (PH ? 6 : 14)
    const availW = W - 2 * M
    const fams = D.seed.parts.map(p => p.family)
    const headOf = (cols, key) => cols.find(c => c.key === key).heading

    // the headline block, state by state
    const lessonLine = n => fmt(C['eyebrow.lesson'], { n, title: D.titles[n] })
    const HUDS = []
    const add = (t, eyebrow, head, sub, eid, hid, sid, lesson = null) => HUDS.push({ t, eyebrow, head, sub, eid, hid, sid, lesson })
    add(0, lessonLine(1), C['a1.head'], C['a1.sub'], 'eyebrow.lesson', 'a1.head', 'a1.sub', 1)
    add(TL.a2, C['eyebrow.swaps'], C['a2.head'], C['a2.sub'], 'eyebrow.swaps', 'a2.head', 'a2.sub')
    if (PH) add(TL.count2, C['eyebrow.swaps'], C['a2.head'], fmt(C['a2.count'], { n: D.counts.neighbours }), 'eyebrow.swaps', 'a2.head', 'a2.count')
    D.frame.rows.forEach((r, i) => add(TL.rows[i], lessonLine(r.lesson), C['a3.head'], C['a3.sub'], 'eyebrow.lesson', 'a3.head', 'a3.sub', r.lesson))
    D.tables.forEach((tb, i) => add(i ? TL.tab[i] : TL.a4, lessonLine(tb.lesson), C['a4.head'], C['a4.sub'], 'eyebrow.lesson', 'a4.head', 'a4.sub', tb.lesson))
    add(TL.a5, C['eyebrow.road'], fmt(C['a5.head'], { total: nf(D.counts.sentences) }), fmt(C['a5.sub'], { total: nf(D.counts.sentences) }), 'eyebrow.road', 'a5.head', 'a5.sub')
    add(TL.end, C['end.eyebrow'], C['end.heading'], '', 'end.eyebrow', 'end.heading', '', 52)
    const hb = HUDS.map(st => { eyebrowEl.textContent = st.eyebrow; headEl.textContent = st.head; subEl.textContent = st.sub || ' '; return (hud.getBoundingClientRect().bottom - R.top) / SC })
    eyebrowEl._s = headEl._s = subEl._s = null
    const topOf = (from, to) => Math.max(...HUDS.map((st, i) => (st.t >= from - 1e-6 && st.t < to ? hb[i] : 0))) + (PH ? 20 : 34)
    // An act never starts above where the next act's headline block ends: at each handover the old act's words are still in
    // place, fading, while the new headline fades in, and a taller headline would land on them. At the sizes the approved film
    // was checked at these blocks are the same height, so nothing moves there; at other widths the headlines wrap differently.
    const top4 = topOf(TL.a4, TL.a5), top3 = Math.max(topOf(TL.a3, TL.a4), top4), top12 = Math.max(topOf(0, TL.a3), top3), top5 = topOf(TL.a5, TL.end) + (PH ? 46 : 0), topE = topOf(TL.end, 1e9)
    if (PH) side.style.top = (top5 - 46 - 8) + 'px'; else side.style.top = ''

    function renderHud(t) {
      let i = 0
      for (let j = 0; j < HUDS.length; j++) if (HUDS[j].t <= t) i = j
      const st = HUDS[i]
      cur.hudLesson = st.lesson
      for (const [key, node, wrap, idk] of [['eyebrow', eyebrowEl, eyebrowP, 'eid'], ['head', headEl, headEl, 'hid'], ['sub', subEl, subEl, 'sid']]) {
        let a = i, b = i
        while (a > 0 && HUDS[a - 1][key] === st[key]) a--
        while (b < HUDS.length - 1 && HUDS[b + 1][key] === st[key]) b++
        const tin = HUDS[a].t, tout = b < HUDS.length - 1 ? HUDS[b + 1].t : Infinity
        const o = Math.min(a === 0 ? ramp(t, .05, .5) : ramp(t, tin + .1, tin + .42), 1 - ramp(t, tout - .22, tout))
        setText(node, st[key] || ' '); setO(wrap, o * (TEST && BRK.ghostend && t >= TL.end ? .02 : 1))
        if (o > .05 && st[key]) { rep.c.push(st[idk]); rep.l.push({ text: st[key], el: node, hud: true }) }
      }
      if (t >= TL.a5 && t < TL.end && HUDS[i].sid === 'a5.sub') rep.n.push({ id: 'total', value: D.counts.sentences })
    }

    // each act's elements, so an act that is off screen can be hidden in one go
    const groups = {}
    const grp = (name, fn) => { const a = stage.children.length, r = fn(); groups[name] = [...stage.children].slice(a); return r }

    // ----- the first sentence: acts 1 and 2, then row 1 of the frame -----
    let frame = null
    const hero = grp('hero', () => {
      const S0 = TL.S0, all = [S0, ...TL.steps.map(s => s.to)]
      let FSH = PH ? 46 : clamp(Math.round(W * .058), 56, 92)
      const widthOf = (s, fs) => s.words.reduce((a, w) => a + textW(w, 'w', fs), 0) + fs * .42 * (s.words.length - 1)
      while (FSH > 26 && Math.max(...all.map(s => widthOf(s, FSH))) > availW) FSH -= 2
      const wordH = FSH * 1.25, enFs = PH ? 15.5 : 18
      const slots = S0.words.map((w, k) => word(w, fams[k], true))
      const labs = D.seed.parts.map((p, k) => {
        const c = D.frame.columns.find(c => c.key === p.col), e = mk('div', 'lab ' + fams[k])
        e.innerHTML = '<span></span><small></small>'; e.firstChild.textContent = c.heading; e.lastChild.textContent = fmt(C['col.from'], { n: c.first })
        e._small = e.lastChild; e._small.style.opacity = '0'; e._text = c.heading; e._w = textW(c.heading, 'lab', PH ? 8 : 9.5)
        return e
      })
      const en = mk('div', 'en hero'); if (PH) en.style.width = availW + 'px'; else en.style.whiteSpace = 'nowrap'
      const y0 = top12, yA = Math.max(top12, H * (PH ? .27 : .33)), labOff = wordH + (PH ? 7 : 10), enOff = labOff + (PH ? 24 : 34)
      function render(t) {
        let from = S0, to = S0, p = 1, step = null
        for (const s of TL.steps) { if (s.t <= t) step = s; else break }
        if (step) { from = step.from; to = step.to; p = ramp(t, step.t, step.t + step.dur) }
        const half = p >= .5, shown = half ? to : from
        cur.heroLesson = shown.lesson
        const morph = eio(ramp(t, TL.a3 + .1, TL.a3 + 1.6))
        const tg = t >= TL.a3 ? frame.row0(t) : null
        const fs = tg ? lerp(FSH, tg.fs, morph) : FSH, gap = fs * .42
        const yh = lerp(yA, y0, eio(ramp(t, TL.a2 - .1, TL.a2 + .8)))
        const ws = S0.words.map((_, k) => { const a = textW(from.words[k], 'w', fs), b = textW(to.words[k], 'w', fs); return a === b ? a : TEST && BRK.squeeze ? lerp(a, b, eio(p)) : b > a ? lerp(a, b, eio(ramp(p, 0, .5))) : lerp(a, b, eio(ramp(p, .5, 1))) })
        let x = M, any = false
        const labW = labs.map(l => l._w)
        const els = []
        slots.forEach((slot, k) => {
          const intro = ap(t, TL.seedIn, .7)
          const hx = x, hy = yh + (1 - intro) * 16
          const px = tg ? lerp(hx, tg.slots[k].x, morph) : hx, py = tg ? lerp(yh, tg.slots[k].y, morph) : hy
          slot.style.fontSize = fs.toFixed(2) + 'px'; slot.style.width = ws[k].toFixed(2) + 'px'; slot.style.paddingBottom = lerp(.1, .3, morph).toFixed(3) + 'em'
          const A = slot._a, B = slot._b, wa = from.words[k], wb = to.words[k]
          if (wa === wb || p >= 1) { setText(A, wb); A.style.transform = ''; setO(A, 1); setO(B, 0) }
          else if (bare(wa) === bare(wb)) { setText(A, half ? wb : wa); A.style.transform = ''; setO(A, 1); setO(B, 0) }
          else {
            setText(A, wa); setText(B, wb)
            const r1 = ramp(p, 0, .5), r2 = ramp(p, .5, 1)
            A.style.transform = 'rotateX(' + (r1 * r1 * 88).toFixed(1) + 'deg)'; setO(A, half ? 0 : 1)
            B.style.transform = 'rotateX(' + (-(1 - eo(r2)) * 88).toFixed(1) + 'deg)'; setO(B, half ? 1 : 0)
          }
          slot._u.style.transform = 'scaleX(' + ap(t, TL.part[k], .5).toFixed(3) + ')'
          slot._u.style.height = lerp(3, 2, morph).toFixed(2) + 'px'
          let glow = 0
          if (step && step.to !== S0 && bare(wa) !== bare(wb)) { const land = step.t + step.dur; glow = p < .5 ? 0 : p < 1 ? eo(ramp(p, .5, 1)) : 1 - ramp(t, land + .3, land + 1.0) }
          if (t >= TL.a3) glow = Math.max(glow, ap(t, TL.a3 + 1.3, .6))
          setO(slot._shade, glow)
          const o = intro * (tg ? tg.o : 1)
          if (put(slot, px, py, o)) { any = true; els.push(slot) }
          // its label: under the word, then the column's heading
          // the label fades out under the word and in again as the column's heading; it never travels across the word
          const there = !!tg && morph >= .5
          const lo = ap(t, TL.part[k] + .15, .45) * (tg ? (frame.wrapped ? tg.o : tg.vis) * (there ? ramp(morph, .65, 1) : 1 - ramp(morph, 0, .35)) : 1)
          const lx = there ? tg.labs[k].x : hx, ly = there ? tg.labs[k].y : yh + labOff
          setO(labs[k]._small, tg && !frame.wrapped ? ap(t, TL.a3 + 1.4, .5) : 0)
          if (put(labs[k], lx, ly, lo)) rep.l.push({ text: labs[k]._text, el: labs[k].firstChild, sub: labs[k]._small })
          x += Math.max(ws[k], labW[k] - gap * .45) + gap
        })
        const enShown = TEST && BRK.mixed ? (p >= .2 ? to : from) : shown
        setText(en, enShown.english)
        en.style.fontSize = (tg ? lerp(enFs, tg.enFs, morph) : enFs).toFixed(2) + 'px'
        const eno = ap(t, TL.en1, .5) * (p >= 1 ? 1 : Math.abs(2 * p - 1)) * (tg ? tg.o : 1)
        const enOn = put(en, tg ? lerp(M, tg.en.x, morph) : M, tg ? lerp(yh + enOff, tg.en.y, morph) : yh + enOff, eno)
        if (any) {
          rep.s.push({ id: shown.id, text: shown.words.join(' '), english: enOn ? enShown.english : null, where: t < TL.a3 ? 'hero' : 'frame', els, enEl: enOn ? en : null })
          if (shown.id === S0.id) D.seed.parts.forEach((q, k) => rep.p.push({ sentence: S0.id, text: q.text, column: q.col, label: q.label, shaded: t >= TL.a3 + 1.6, el: slots[k] }))
        }
      }
      return { FSH, wordH, slots, labs, en, bottom: y0 + enOff + (PH ? 44 : 26), render }
    })

    // ----- act 2: the lists under the parts -----
    const lists = grp('lists', () => {
      const top = hero.bottom + (PH ? 14 : 34), colGap = 44, colW = PH ? availW : (availW - 2 * colGap) / 3
      const G = TL.groups.map((g, gi) => {
        const x = PH ? M : M + (2 - gi) * (colW + colGap)
        const ask = mk('div', 'ask ' + g.family, C[g.ask])
        const rule = mk('div', 'rule'); rule.style.width = colW + 'px'
        let y = top + 24
        const items = g.items.map((s, i) => {
          const e = mk('div', 'item ' + g.family); e.style.width = colW + 'px'
          const sp = document.createElement('span'); sp.className = 's'
          s.words.forEach((w, k) => { if (k) sp.append(' '); if (k === g.at) { const b = document.createElement('b'); b.textContent = w; sp.append(b) } else sp.append(w) })
          const ee = document.createElement('span'); ee.className = 'e'; ee.textContent = s.english
          e.append(sp, ee)
          const it = { e, sp, ee, s, y, t: TL.lands.find(l => l.g === gi && l.i === i).t }
          y += e.offsetHeight
          return it
        })
        return { g, gi, x, ask, rule, items }
      })
      function render(t) {
        const out = 1 - ramp(t, TL.a3, TL.a3 + .45)
        for (const L of G) {
          const w = TL.win[L.gi]
          const vis = out * (PH ? Math.min(ramp(t, w[0], w[0] + .25), L.gi === 2 ? 1 : 1 - ramp(t, w[1] - .25, w[1])) : 1)
          const a = PH ? vis : vis * ap(t, TL.a2 + .5 + .12 * (2 - L.gi), .5)
          if (put(L.ask, L.x, top, a)) { rep.c.push(L.g.ask); rep.l.push({ text: C[L.g.ask], el: L.ask }) }
          put(L.rule, L.x, top + 20, a)
          for (const it of L.items) {
            const k = ap(t, it.t, .4)
            if (put(it.e, L.x, it.y - (1 - k) * 10, vis * k)) rep.s.push({ id: it.s.id, text: it.s.text, english: it.s.english, where: 'list', els: [it.sp], enEl: it.ee })
          }
        }
      }
      return { render }
    })

    // ----- act 3: the frame -----
    frame = grp('frame', () => {
      const rows = D.frame.rows, cols = D.frame.columns
      const WR = PH || W < 1120           // wrapped rows: a phone, or a screen too narrow for ten columns
      let FS = PH ? 24 : WR ? 26 : W >= 1280 ? 27 : 24
      const G = WR ? 13 : 20, IN = 18, tagW = WR ? 0 : 158, enFs = WR ? 13.5 : 14
      const cell = rows.map(r => cols.map(c => r.parts.filter(p => p.col === c.key)))
      const measure = fs => cols.map((c, k) => Math.max(34, textW(c.heading, 'lab', 9.5), textW(fmt(C['col.from'], { n: c.first }), 'lab', 8.6),
        ...rows.map((r, i) => cell[i][k].reduce((a, p) => a + textW(p.text, 'w', fs), 0) + IN * Math.max(0, cell[i][k].length - 1))))
      let wCol = measure(FS)
      const total = w => w.reduce((a, b) => a + b, 0) + G * (cols.length - 1)
      while (!WR && FS > 18 && total(wCol) > availW - tagW - G) { FS -= 1; wCol = measure(FS) }
      const wordH = FS * 1.45, fy = top3, rowsTop = fy + (WR ? 0 : 50), availH = bottom - rowsTop
      const fx = M + (WR ? 0 : tagW + G)
      const openT = cols.map(c => TL.rows[rows.findIndex(r => r.parts.some(p => p.col === c.key))])
      // elements
      const E = rows.map((r, i) => ({
        tag: (() => { const e = mk('div', 'tag' + (WR ? ' inline' : '')); e.innerHTML = '<b></b><span></span>'; e.firstChild.textContent = fmt(C['row.lesson'], { n: r.lesson }); e.lastChild.textContent = D.titles[r.lesson]; if (!WR) e.style.width = tagW + 'px'; return e })(),
        en: i ? (() => { const e = mk('div', 'en', r.english); if (WR) e.style.width = availW + 'px'; else e.style.whiteSpace = 'nowrap'; return e })() : null,
        parts: i ? r.parts.map(p => { const e = word(p.text, p.family); e.style.fontSize = FS + 'px'; return e }) : null,
        labs: WR && i ? r.parts.map(p => (p.shaded ? mk('div', 'lab ' + p.family, headOf(cols, p.col)) : null)) : null,
      }))
      const heads = cols.map(c => {
        if (WR) return null
        const hk = D.seed.parts.findIndex(p => p.col === c.key)
        if (hk >= 0) return null                                   // the first sentence's own labels become these headings
        const e = mk('div', 'lab ' + c.family); e.innerHTML = '<span></span><small></small>'; e.firstChild.textContent = c.heading; e.lastChild.textContent = fmt(C['col.from'], { n: c.first }); e._text = c.heading
        return e
      })
      const rules = cols.map((c, k) => { if (WR) return null; const e = mk('div', 'rule'); e.style.width = wCol[k] + 'px'; return e })
      const slotsE = rows.map((r, i) => cols.map((c, k) => { if (WR || cell[i][k].length) return null; const e = mk('div', 'slotline'); e.style.width = wCol[k] + 'px'; return e }))
      // layout
      let L, tgt, pitch = 0
      if (!WR) {
        const VIS = clamp(Math.floor(availH / 72), 3, rows.length)
        pitch = Math.min(88, availH / VIS)
        if (TEST && BRK.overlap) pitch = wordH + 4
        L = rows.map((r, i) => {
          const parts = []
          cols.forEach((c, k) => { let dx = 0; for (const p of cell[i][k]) { const w = textW(p.text, 'w', FS); parts.push({ p, k, dx, w, y: 10 }); dx += w + IN } })
          return { top: i * pitch, bottom: (i + 1) * pitch, tagy: 13, eny: 10 + wordH + 7, parts }
        })
        tgt = rows.map((r, i) => Math.max(0, (i + 1 - VIS) * pitch))
      } else {
        let y = 0
        L = rows.map((r, i) => {
          const top = y, parts = []
          let ly = 28, x = 0, lab = false
          for (const p of r.parts) {
            const w = textW(p.text, 'w', FS), lw = p.shaded ? textW(headOf(cols, p.col), 'lab', 8) : 0
            if (x > 0 && x + Math.max(w, lw) > availW) { ly += wordH + (lab ? 22 : 9); x = 0; lab = false }
            parts.push({ p, x, w, y: ly, laby: ly + wordH + 5 })
            if (p.shaded) lab = true
            x += Math.max(w, lw) + G
          }
          const eny = ly + wordH + (lab ? 24 : 8)
          const enH = (i ? E[i].en : hero.en).offsetHeight || 20
          y = top + eny + (i ? enH : 20) + 26
          return { top, bottom: y - 8, tagy: 0, eny, parts }
        })
        tgt = rows.map((r, i) => Math.max(0, L[i].bottom - availH))
      }
      void tgt
      // the camera: while the frame is small it is drawn large, and it pulls back as slots open (wide screens only)
      const availF = availW - tagW - G
      const ZMAX = WR ? 1 : clamp(availH / (4 * pitch), 1, 1.7)
      const open = (k, t) => (openT[k] <= TL.a3 ? 1 : eio(ramp(t, openT[k], openT[k] + .6)))
      const exitOf = t => eio(ramp(t, TL.a4, TL.a4 + .6))
      // rows keep to the top of the frame; when one more would not fit, whole rows leave at the top
      const zAfter = i => { let x = 0; cols.forEach((c, k) => { if (openT[k] <= TL.rows[i]) x += wCol[k] + G }); return WR ? 1 : clamp(availF / Math.max(1, x - G), 1, ZMAX) }
      const nOut = []
      rows.forEach((r, i) => {
        let n = 0
        if (WR) { while (n < i && L[i].bottom - L[n].top > availH) n++ } else n = Math.max(0, i + 1 - Math.floor((availH + 2) / (pitch * zAfter(i))))
        nOut[i] = Math.max(n, i ? nOut[i - 1] : 0)
      })
      const outAt = t => { let n = 0; for (let i = 1; i < rows.length; i++) n += (nOut[i] - nOut[i - 1]) * eio(ramp(t, TL.rows[i], TL.rows[i] + .6)); return n }
      const topAt = n => { const a = Math.min(rows.length - 1, Math.floor(n)), b = Math.min(rows.length - 1, a + 1); return lerp(L[a].top, L[b].top, n - a) }
      function geo(t) {
        const X = []; let x = 0
        cols.forEach((c, k) => { X[k] = x; x += open(k, t) * (wCol[k] + G) })
        const z = WR ? 1 : clamp(availF / Math.max(1, x - G), 1, ZMAX)
        const top = topAt(outAt(t))
        return { X, z, top, sc: top * z, dy: -28 * exitOf(t) }
      }
      const rowO = (i, t, g) => {
        const fadeTop = clamp(1 + (L[i].top - g.top) * g.z / (WR ? 20 : 14))
        const dim = i === rows.length - 1 ? 1 : lerp(1, .66, ramp(t, TL.rows[i + 1], TL.rows[i + 1] + .4))
        return (1 - exitOf(t)) * fadeTop * dim
      }
      const enScale = z => 1 + (z - 1) * .6
      function row0(t) {
        const g = geo(t), z = g.z, y = rowsTop + L[0].top * z - g.sc + g.dy, q = L[0].parts
        return {
          fs: FS * z, enFs: enFs * enScale(z), o: rowO(0, t, g), vis: 1 - exitOf(t),
          slots: q.map(a => ({ x: WR ? M + a.x : fx + z * (g.X[a.k] + a.dx), y: y + a.y * z })),
          labs: q.map(a => (WR ? { x: M + a.x, y: y + a.laby } : { x: fx + z * g.X[a.k], y: fy + g.dy })),
          en: { x: WR ? M : fx, y: y + L[0].eny * z },
        }
      }
      function render(t) {
        const g = geo(t), z = g.z, vis = 1 - exitOf(t), dy = g.dy
        const fsz = (FS * z).toFixed(2) + 'px', enz = (enFs * enScale(z)).toFixed(2) + 'px', zk = z.toFixed(4)
        if (!WR) cols.forEach((c, k) => {
          const hx = fx + z * g.X[k], inHero = !heads[k]
          const ho = vis * (inHero ? ap(t, TL.a3 + 1.0, .5) : ap(t, openT[k] + .45, .4))
          if (!inHero) { if (put(heads[k], hx, fy + dy, ho)) rep.l.push({ text: heads[k]._text, el: heads[k].firstChild, sub: heads[k].lastChild }) }
          if (rules[k]._z !== zk) { rules[k].style.width = (wCol[k] * z).toFixed(1) + 'px'; rules[k]._z = zk }
          put(rules[k], hx, fy + 38 + dy, ho)
        })
        rows.forEach((r, i) => {
          const tr = TL.rows[i], y = rowsTop + L[i].top * z - g.sc + dy, ro = rowO(i, t, g)
          if (put(E[i].tag, M, y + L[i].tagy * z, ro * ap(t, i ? tr + .45 : TL.a3 + 1.55, .35))) rep.g.push({ kind: 'row', sentence: r.id, lesson: E[i].tag.firstChild, title: E[i].tag.lastChild })
          if (!WR) cols.forEach((c, k) => {
            const e = slotsE[i][k]; if (!e) return
            if (e._z !== zk) { e.style.width = (wCol[k] * z).toFixed(1) + 'px'; e._z = zk }
            put(e, fx + z * g.X[k], y + z * (10 + wordH) - 2, ro * .75 * open(k, t) * ap(t, Math.max(i ? tr + .5 : TL.a3 + 1.1, openT[k] + .45), .4))
          })
          if (!i) return
          let nNew = 0
          const els = []
          L[i].parts.forEach((q, j) => {
            // the whole sentence arrives together; then the shade blooms on what the lesson adds
            const sh = q.p.shaded, a = ap(t, tr + .45, .45), ts = tr + 1.0 + .14 * (sh ? nNew++ : 0)
            const px = WR ? M + q.x : fx + z * (g.X[q.k] + q.dx), py = y + q.y * z + (1 - a) * 10
            const e = E[i].parts[j]
            if (!WR && e._fs !== fsz) { e.style.fontSize = fsz; e._fs = fsz }
            setO(e._shade, sh ? ap(t, ts, .55) : 0)
            if (put(e, px, py, ro * a)) { els.push(e); rep.p.push({ sentence: r.id, text: q.p.text, column: q.p.col, label: q.p.label, shaded: sh, el: e }) }
            if (WR && sh) { const lb = E[i].labs[j]; if (put(lb, px, y + q.laby, ro * ap(t, ts + .1, .4))) rep.l.push({ text: lb.textContent, el: lb }) }
          })
          if (!WR && E[i].en._fs !== enz) { E[i].en.style.fontSize = enz; E[i].en._fs = enz }
          const enOn = put(E[i].en, WR ? M : fx, y + L[i].eny * z, ro * ap(t, tr + 1.35, .4) * (TEST && BRK.noenglish && i === 4 ? .1 : 1))
          if (els.length) rep.s.push({ id: r.id, text: r.text, english: enOn ? r.english : null, where: 'frame', els, enEl: enOn ? E[i].en : null, whole: els.length === r.parts.length })
        })
      }
      return { FS, row0, render, wrapped: WR }
    })

    // ----- act 4: two new tables -----
    const tables = grp('tables', () => {
      const FS4 = PH ? 22 : W >= 1280 ? 30 : 24, G4 = PH ? 12 : 24, IN = 16, wordH = FS4 * 1.45
      const headH = PH ? 32 : 46, titleH = PH ? 58 : 48
      const pitch = PH ? 64 : Math.min(84, (bottom - top4 - titleH - headH) / Math.max(...D.tables.map(tb => tb.rows.length)))
      const T = D.tables.map((tb, ti) => {
        const cols = tb.columns, cell = tb.rows.map(r => cols.map(c => r.parts.filter(p => p.col === c.key)))
        const labW = c => (PH ? Math.max(...c.heading.split(' ').map(x => textW(x, 'lab', 8))) : textW(c.heading, 'lab', 9.5))
        const wCol = cols.map((c, k) => Math.max(PH ? 30 : 40, labW(c), ...tb.rows.map((r, i) => cell[i][k].reduce((a, p) => a + textW(p.text, 'w', FS4), 0) + IN * Math.max(0, cell[i][k].length - 1))))
        const X = []; let x = 0
        wCol.forEach((w, k) => { X[k] = x; x += w + G4 })
        const title = mk('div', 'ttl'); title.innerHTML = '<span></span><small></small>'; title.firstChild.textContent = tb.title; title.lastChild.textContent = fmt(C['row.lesson'], { n: tb.lesson })
        const heads = cols.map((c, k) => { const e = mk('div', 'lab ' + c.family + (PH ? ' wrap' : ''), c.heading); if (PH) e.style.width = wCol[k] + 'px'; return e })
        const rules = cols.map((c, k) => { const e = mk('div', 'rule'); e.style.width = wCol[k] + 'px'; return e })
        const rws = tb.rows.map((r, i) => ({
          r, en: mk('div', 'en', r.english),
          parts: r.parts.map(p => { const e = word(p.text, p.family); e.style.fontSize = FS4 + 'px'; return e }),
          pos: (() => { const out = []; cols.forEach((c, k) => { let dx = 0; for (const p of cell[i][k]) { out.push({ k, dx }); dx += textW(p.text, 'w', FS4) + IN } }); return out })(),
          slots: cols.map((c, k) => { if (cell[i][k].length) return null; const e = mk('div', 'slotline'); e.style.width = wCol[k] + 'px'; return e }),
        }))
        return { tb, ti, cols, wCol, X, width: x - G4, height: titleH + headH + tb.rows.length * pitch, title, heads, rules, rws }
      })
      const x0 = [M, PH ? M : Math.max(M + T[0].width + 110, M + availW * .5)]
      const y0 = [top4, top4]                                       // on a phone the two tables take turns in the same place
      function render(t) {
        const enter = ap(t, TL.a4 + .55, .6), ex = eio(ramp(t, TL.a5 - .3, TL.a5 + .05)), vis = 1 - ex     // gone before the next headline, which is taller, arrives
        const dy = (1 - enter) * 40 + ex * 12
        for (const tt of T) {
          const t0 = TL.tab[tt.ti], bx = x0[tt.ti], by = y0[tt.ti] + dy
          const v = vis * (PH && tt.ti === 0 ? 1 - ramp(t, TL.tab[1] - .55, TL.tab[1] - .1) : 1)
          if (put(tt.title, bx, by, v * ap(t, t0, .45))) rep.g.push({ kind: 'table', table: tt.tb.id, lesson: tt.title.lastChild, title: tt.title.firstChild })
          tt.cols.forEach((c, k) => {
            const ho = v * ap(t, t0 + .3 + .05 * k, .4)
            if (put(tt.heads[k], bx + tt.X[k], by + titleH, ho)) rep.l.push({ text: c.heading, el: tt.heads[k] })
            put(tt.rules[k], bx + tt.X[k], by + titleH + headH - 8, ho)
          })
          tt.rws.forEach((rw, i) => {
            const tr = t0 + .7 + i * .4, y = by + titleH + headH + i * pitch
            const els = []
            rw.parts.forEach((e, j) => {
              const a = ap(t, tr, .4), q = rw.pos[j], p = rw.r.parts[j]
              if (put(e, bx + tt.X[q.k] + q.dx, y + 8 + (1 - a) * 9, v * a)) { els.push(e); rep.p.push({ sentence: rw.r.id, text: p.text, column: p.col, label: p.label, shaded: false, el: e }) }
            })
            rw.slots.forEach((e, k) => { if (e) put(e, bx + tt.X[k], y + 8 + wordH - 2, v * .75 * ap(t, tr + .2, .4)) })
            const enOn = put(rw.en, bx + tt.X[rw.pos[0].k], y + 8 + wordH + 6, v * ap(t, tr + .35, .4))
            if (els.length) rep.s.push({ id: rw.r.id, text: rw.r.text, english: enOn ? rw.r.english : null, where: 'table', els, enEl: enOn ? rw.en : null, whole: els.length === rw.r.parts.length })
          })
        }
      }
      return { render }
    })

    // ----- act 5: the road, then the end -----
    const road = grp('road', () => {
      const rowsTop = top5 + (PH ? 0 : 6)
      const els = D.road.map(r => {
        const e = mk('div', 'rrow'); e.style.width = availW + 'px'
        e.innerHTML = '<div class="rnum"></div><div class="rtitle"></div><div class="rs"></div><div class="ren"></div>'
        e.children[0].textContent = r.lesson; e.children[1].textContent = r.title; e.children[2].textContent = r.sentence.text; e.children[3].textContent = r.sentence.english
        return e
      })
      const tops = [], hs = []
      let y = 0
      els.forEach(e => { tops.push(y); const h = e.offsetHeight; hs.push(h); y += h })
      const center = i => tops[i] + hs[i] / 2
      const focusY = rowsTop + (bottom - rowsTop) * (PH ? .3 : .38)
      function render(t) {
        const uu = TL.roadU(t), i0 = Math.floor(uu), cy = lerp(center(i0), center(Math.min(i0 + 1, els.length - 1)), uu - i0)
        const base = focusY - cy, vis = ap(t, TL.a5 + .45, .6) * (1 - ramp(t, TL.end, TL.end + .5))
        const now = D.road[Math.round(uu)]
        cur.roadLesson = now.lesson
        els.forEach((e, i) => {
          const yy = base + tops[i]
          if (vis < .004 || yy + hs[i] < rowsTop - 30 || yy > bottom + 10) { put(e, 0, 0, 0); return }
          const d = i - uu, near = clamp(1 - Math.abs(d) * 1.25)
          const away = d < 0 ? .5 * clamp(1 + (d + .5) / 4) : .5
          const edge = clamp((yy - (rowsTop - 16)) / 26) * clamp((bottom - (yy + hs[i]) + 22) / 26)
          if (put(e, M, yy, vis * lerp(away, 1, near) * edge)) rep.s.push({ id: D.road[i].sentence.id, text: D.road[i].sentence.text, english: D.road[i].sentence.english, where: 'road', els: [e.children[2]], enEl: e.children[3], extra: [e.children[0], e.children[1]] })
        })
        // the running count
        const so = ap(t, TL.a5 + .6, .5) * (PH ? 1 - ramp(t, TL.end - .1, TL.end + .3) : 1)
        if (so > .004) { setText(sideNum, nf(now.count)); setText(sideCap, fmt(C['road.count'], { n: now.lesson })); rep.n.push({ id: 'count', value: now.count, lesson: now.lesson }); rep.c.push('road.count') }
        return so
      }
      return { render }
    })

    const endc = grp('end', () => {
      const S0 = TL.S0, FSe = PH ? 40 : Math.min(72, hero.FSH), gap = FSe * .42, wordH = FSe * 1.25
      const slots = S0.words.map((w, k) => { const e = word(w, fams[k]); e.classList.add('big'); e.style.fontSize = FSe + 'px'; e._u.style.height = '3px'; return e })
      const labs = D.seed.parts.map((p, k) => mk('div', 'lab ' + fams[k], headOf(D.frame.columns, p.col)))
      const en = mk('div', 'en hero', D.seed.english); if (PH) en.style.width = availW + 'px'; else en.style.whiteSpace = 'nowrap'
      const cta = mk('a', 'cta'); cta.href = opt.lessonHref(1); cta.innerHTML = '<span></span><span class="arrow" aria-hidden="true">↗</span>'; cta.firstChild.textContent = C['mast.cta']
      cta.addEventListener('click', ev => go(ev, opt.lessonHref(1)))
      const y0 = Math.max(topE + (PH ? 4 : 10), H * (PH ? .27 : .33))
      function render(t) {
        let x = M
        const els = []
        slots.forEach((e, k) => {
          const a = ap(t, TL.end + .45, .7)
          if (put(e, x, y0 + (1 - a) * 14, a)) { els.push(e); rep.p.push({ sentence: S0.id, text: D.seed.parts[k].text, column: D.seed.parts[k].col, label: D.seed.parts[k].label, shaded: false, el: e }) }
          if (put(labs[k], x, y0 + wordH + (PH ? 7 : 10), ap(t, TL.end + .8 + .14 * k, .5))) rep.l.push({ text: labs[k].textContent, el: labs[k] })
          x += textW(S0.words[k], 'w', FSe) + gap
        })
        const enOn = put(en, M, y0 + wordH + (PH ? 30 : 42), ap(t, TL.end + 1.3, .5))
        const co = ap(t, TL.end + 1.75, .55)
        put(cta, M, y0 + wordH + (PH ? 78 : 96) + (1 - co) * 10, co)
        cta.tabIndex = co > .5 ? 0 : -1
        if (co > .05) rep.c.push('mast.cta')
        if (els.length) rep.s.push({ id: S0.id, text: S0.words.join(' '), english: enOn ? D.seed.english : null, where: 'end', els, enEl: enOn ? en : null })
      }
      return { render }
    })

    // ----- everything at time t -----
    let litKey = ''
    function render(t) {
      rep.s.length = rep.p.length = rep.l.length = rep.n.length = rep.c.length = rep.g.length = 0
      renderHud(t)
      const inA = (a, b) => t >= a - .05 && t <= b + .05
      const hide = set => { for (const e of set) if (e._v !== 0) { e.style.visibility = 'hidden'; e._v = 0 } }
      if (t <= TL.a4 + 1) hero.render(t); else hide(groups.hero)
      if (inA(TL.a2, TL.a3 + .5)) lists.render(t); else hide(groups.lists)
      if (inA(TL.a3, TL.a4 + 1)) frame.render(t); else hide(groups.frame)
      if (inA(TL.a4, TL.a5 + .8)) tables.render(t); else hide(groups.tables)
      let so = 0
      if (inA(TL.a5, TL.total)) so = road.render(t); else hide(groups.road)
      if (inA(TL.end, TL.total)) endc.render(t); else hide(groups.end)
      // the side number: the ten neighbours in act 2 (wide screens), the running count on the road
      if (!PH && t >= TL.count2 && t < TL.a3 + .5) {
        so = ap(t, TL.count2, .5) * (1 - ramp(t, TL.a3, TL.a3 + .4))
        setText(sideNum, nf(D.counts.neighbours)); setText(sideCap, C['a2.count'].replace('{n} ', ''))
        if (so > .05) { rep.n.push({ id: 'neighbours', value: D.counts.neighbours }); rep.c.push('a2.count') }
      }
      if (PH && t >= TL.count2 && t < TL.a3) rep.n.push({ id: 'neighbours', value: D.counts.neighbours })
      setO(side, so)
      // the rail: a tick is lit once a sentence of its lesson has been on screen; the label names the lesson on screen now
      const now = cur.hudLesson != null ? cur.hudLesson : t < TL.a3 ? cur.heroLesson : cur.roadLesson
      let key = now + ':'
      for (let l = 1; l <= 52; l++) if (TL.seen[l] <= t) key += l + ','
      if (key !== litKey) {
        litKey = key
        const lit = new Set(key.split(':')[1].split(',').filter(Boolean).map(Number))
        ;[...ticksEl.children].forEach((b, i) => { b.className = (lit.has(i + 1) ? 'on' : '') + (i + 1 === now ? ' now' : '') })
        whereEl.textContent = fmt(C['rail.label'], { n: now })
        rail.setAttribute('aria-valuenow', now); rail.setAttribute('aria-valuetext', whereEl.textContent); rail.setAttribute('aria-label', fmt(C['rail.aria'], { n: now }))
      }
      cur.lesson = now
      cur.act = t < TL.a2 ? 1 : t < TL.a3 ? 2 : t < TL.a4 ? 3 : t < TL.a5 ? 4 : 5
    }
    return { render, PH, W, H, frameFS: frame.FS, scale: SC, boxW: box.width, boxH: box.height }
  }

  // ---------- the clock, the controls, the contract ----------
  let playing = false, last = 0, raf = 0, destroyed = false
  // userPaused: the visitor stopped it, so the page never starts it again; autoPaused: the page stopped it (out of view, a hidden tab)
  let userPaused = false, autoPaused = false, inView = false
  const atEnd = () => cur.t >= TL.total - .01
  function draw() { if (scene) scene.render(cur.t) }
  function setPlaying(p) {
    if (destroyed) return
    playing = p
    $('pause-glyph').textContent = p ? 'Ⅱ' : '▶'
    $('pause-label').textContent = p ? C['ctl.pause'] : C['ctl.resume']
    $('pause').setAttribute('aria-label', p ? C['ctl.pause'] : C['ctl.resume'])
    cancelAnimationFrame(raf)
    if (p) { last = performance.now(); raf = requestAnimationFrame(tick) }
  }
  function tick(now) {
    if (!playing || destroyed) return
    cur.t = Math.min(TL.total, cur.t + Math.min(.1, (now - last) / 1000)); last = now
    draw()
    if (cur.t >= TL.total) setPlaying(false); else raf = requestAnimationFrame(tick)
  }
  function seek(t) { cur.t = clamp(+t || 0, 0, TL.total); draw() }
  function userPlay() { if (atEnd()) seek(0); userPaused = false; autoPaused = false; setPlaying(true) }
  function userPause() { userPaused = true; autoPaused = false; setPlaying(false) }
  function toggle() { if (playing) userPause(); else userPlay() }
  function replay() { userPaused = false; autoPaused = false; seek(0); setPlaying(true) }
  // the page starting and stopping the film: never against the visitor's own pause, never when reduced motion is asked for
  function pageMay() { return !reduce && !userPaused && !document.hidden && !destroyed }
  function comeIntoView() { inView = true; if (pageMay() && !playing && !atEnd()) { autoPaused = false; setPlaying(true) } }
  function leaveView() { inView = false; if (playing) { autoPaused = true; setPlaying(false) } }
  function toLesson(n) { const s = TL.stops.find(s => s.lesson === n); if (s) seek(s.t + .02) }
  function stepLesson(dir) {
    const i = TL.stops.findIndex(s => s.lesson === cur.lesson), j = clamp(i + dir, 0, TL.stops.length - 1)
    seek(TL.stops[j].t + .02)
  }

  // What is on screen at this instant. The film says which elements carry which sentence, part or label; every
  // text and opacity below is then read back from the page itself, so a wrong word on screen cannot hide behind right data.
  function state() {
    const box = e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } }
    const face = e => (e._a ? (e._b && +e._b.style.opacity > .5 ? e._b : e._a) : e)       // a turning word: the side that shows
    const text = e => face(e).textContent
    const range = document.createRange()
    const ink = e => { range.selectNodeContents(e); const r = range.getBoundingClientRect(); return r.width || r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : box(e) }   // the letters, not the element's box
    const union = els => { const b = els.map(e => ink(face(e))), x = Math.min(...b.map(r => r.x)), y = Math.min(...b.map(r => r.y)); return { x, y, w: Math.max(...b.map(r => r.x + r.w)) - x, h: Math.max(...b.map(r => r.y + r.h)) - y } }
    const seen = e => { let o = 1; for (let n = e; n && n !== watch; n = n.parentElement) { const c = getComputedStyle(n); if (c.visibility === 'hidden' || c.display === 'none') return 0; o *= +c.opacity } return o }
    const hudOf = (node, wrap) => ({ text: node.textContent === ' ' ? '' : node.textContent, opacity: +seen(wrap).toFixed(3) })
    return {
      t: cur.t, act: cur.act, lesson: cur.lesson, playing, viewport: { w: innerWidth, h: innerHeight },
      sentences: rep.s.map(s => ({ id: s.id, text: s.els.map(text).join(' '), english: s.enEl ? s.enEl.textContent : null, where: s.where, whole: s.whole !== false, opacity: +seen(s.els[0]).toFixed(3), enOpacity: s.enEl ? +seen(s.enEl).toFixed(3) : 0, box: union(s.els), words: s.els.length > 1 ? s.els.map(e => ink(face(e))) : [], enBox: s.enEl ? ink(s.enEl) : null,
        extra: (s.extra || []).map(e => ({ text: e.textContent, box: ink(e) })) })),
      parts: rep.p.map(p => ({ sentence: p.sentence, text: text(p.el), column: p.column, label: p.label, shaded: p.shaded, shade: p.el._shade ? +p.el._shade.style.opacity : 0, box: ink(face(p.el)) })),
      labels: rep.l.map(l => ({ text: l.el.textContent, hud: !!l.hud, sub: l.sub && seen(l.sub) > .05 ? l.sub.textContent : null, box: box(l.el) })),
      tags: rep.g.map(g => ({ kind: g.kind, sentence: g.sentence || null, table: g.table || null, lesson: g.lesson.textContent, title: g.title.textContent, boxes: [box(g.lesson), box(g.title)] })),
      numbers: rep.n.map(n => ({ id: n.id, value: n.value, lesson: n.lesson || null })),
      copy: [...new Set(rep.c.filter(Boolean))],
      hud: { eyebrow: hudOf(eyebrowEl, eyebrowP), head: hudOf(headEl, headEl), sub: hudOf(subEl, subEl) },
      drawn: { sideNum: seen(side) > .05 ? sideNum.textContent : null, sideCap: seen(side) > .05 ? sideCap.textContent : null, where: whereEl.textContent },
      errors: ERRORS.slice(0, 5),
      keepOut: [box(hud), box(bar)], stage: box(watch),
    }
  }

  // ---------- the film as a page (the link under the film) ----------
  const stillEl = $('still'), stillLink = $('still-link')
  let stillBuilt = false
  function buildStill() {
    const S = stillEl
    const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
    const w = (p, withRole, heading) => {
      const o = h('span'), e = h('span', 'w ' + p.family + (p.shaded ? ' new' : ''))
      e.innerHTML = '<i class="shade"></i><i class="u"></i><span class="t"></span>'; e.lastChild.textContent = p.text
      o.append(e); if (withRole) { const r = h('span', 'role', heading); r.setAttribute('aria-hidden', 'true'); o.append(r) }
      return o
    }
    const sen = (s, where) => { const e = h('div', 'sen'); e.dataset.sid = s.id; e.dataset.text = s.text; e.dataset.en = s.english; e.dataset.where = where; return e }
    const grid = (cols, rows, tagged) => {
      const g = h('div', 's-grid wide'); g.style.gridTemplateColumns = (tagged ? '172px ' : '') + cols.map(() => 'max-content').join(' ') + ' 1fr'
      if (tagged) g.append(h('div', 'fh blank'))
      for (const c of cols) { const f = h('div', 'fh ' + c.family, c.heading); if (c.first) f.append(h('small', '', fmt(C['col.from'], { n: c.first }))); g.append(f) }
      g.append(h('div', 'fh blank'))
      for (const r of rows) {
        const mark = sen(r, 'page'); mark.style.display = 'contents'      // one sentence: its tag, its cells, its English
        if (tagged) { const t = h('div', 'lt tag'); t.append(h('b', '', fmt(C['row.lesson'], { n: r.lesson })), h('span', '', D.titles[r.lesson])); mark.append(t) }
        for (const c of cols) { const ps = r.parts.filter(p => p.col === c.key), cell = h('div', 'cell' + (ps.length ? '' : ' empty')); for (const p of ps) cell.append(w(p).firstChild); mark.append(cell) }
        mark.append(h('div'))
        const en = h('p', 'gen', r.english); if (!tagged) en.style.gridColumn = '1/-1'
        mark.append(en); g.append(mark)
      }
      return g
    }
    const wrapped = (cols, rows) => {
      const box = h('div', 's-rows')
      for (const r of rows) {
        const b = sen(r, 'page'), t = h('div', 'tag inline'); b.className = 'prow sen'; t.append(h('b', '', fmt(C['row.lesson'], { n: r.lesson })), h('span', '', D.titles[r.lesson]))
        const ps = h('div', 'parts'); for (const p of r.parts) ps.append(w(p, true, cols.find(c => c.key === p.col).heading))
        b.append(t, ps, h('p', 'pen', r.english)); box.append(b)
      }
      return box
    }
    S.append(h('p', 'eyebrow', fmt(C['eyebrow.lesson'], { n: 1, title: D.titles[1] })), h('h2', '', C['still.heading']))
    S.firstChild.prepend(h('i'))
    const seedBox = sen(D.seed, 'page'), sp = h('div', 's-seed')
    for (const p of D.seed.parts) sp.append(w({ ...p, shaded: false }, true, D.frame.columns.find(c => c.key === p.col).heading))
    seedBox.append(sp, h('p', 's-en', D.seed.english)); S.append(seedBox)
    S.append(h('h3', '', C['still.swaps']), h('p', 'lead', fmt(C['a2.count'], { n: D.counts.neighbours }) + '. ' + C['a2.sub']))
    const sw = h('div', 's-swaps')
    for (const g of [...D.swaps].reverse()) {
      const col = h('div', g.family); col.append(h('p', 'ask ' + g.family, C[g.ask]))
      const ul = h('ul')
      for (const s of g.items) {
        const li = h('li', 'item ' + g.family), a = h('span', 's'), mark = sen(s, 'page'); mark.style.display = 'contents'
        s.words.forEach((x, k) => { if (k) a.append(' '); if (k === g.at) a.append(h('b', '', x)); else a.append(x) })
        mark.append(a, h('span', 'e', s.english)); li.append(mark); ul.append(li)
      }
      col.append(ul); sw.append(col)
    }
    S.append(sw)
    S.append(h('h3', '', C['still.frame']), h('p', 'lead', C['a3.sub']), grid(D.frame.columns, D.frame.rows, true), wrapped(D.frame.columns, D.frame.rows))
    const two = h('div', 's-two')
    for (const tb of D.tables) { const d = h('div'); d.append(h('h3', '', fmt(C['row.lesson'], { n: tb.lesson }) + ' · ' + tb.title), grid(tb.columns, tb.rows, false).cloneNode(true)); d.lastChild.classList.remove('wide'); two.append(d) }
    S.append(two)
    S.append(h('h3', '', C['still.road']), h('p', 'lead', fmt(C['a5.sub'], { total: nf(D.counts.sentences) })))
    const rd = h('div', 's-road')
    for (const r of D.road) { const mark = sen(r.sentence, 'page'); mark.style.display = 'contents'; mark.append(h('div', 'rnum', r.lesson), h('div', 'rtitle', r.title), h('div', 'rs', r.sentence.text), h('div', 'ren', r.sentence.english)); rd.append(mark) }
    S.append(rd)
    const end = h('div', 's-end'); end.append(h('p', 'eyebrow', C['end.eyebrow']), h('h2', '', C['end.heading']))
    end.firstChild.prepend(h('i'))
    const a = h('a', 'cta'); a.href = opt.lessonHref(1); a.append(h('span', '', C['mast.cta']), h('span', 'arrow', '↗')); a.lastChild.setAttribute('aria-hidden', 'true'); end.append(a); S.append(end)
    a.addEventListener('click', ev => go(ev, opt.lessonHref(1)))
  }
  function showPage(open) {
    if (open && !stillBuilt) { buildStill(); stillBuilt = true }
    stillEl.hidden = !open
    stillLink.textContent = open ? C['still.back'] : C['still.link']
    stillLink.setAttribute('aria-expanded', open ? 'true' : 'false')
    if (open && playing) userPause()
    if (!open) window.scrollTo({ top: Math.round(window.scrollY + watch.getBoundingClientRect().top), behavior: 'instant' })   // the film's own top, where its strip takes the site's bar
  }
  stillLink.textContent = C['still.link']
  on(stillLink, 'click', () => showPage(stillEl.hidden))

  // ---------- start ----------
  for (let i = 1; i <= 52; i++) ticksEl.appendChild(document.createElement('b'))
  let ro = null, rz = 0, io = null
  const ready = (async () => {
    const sample = 'Naʻá ʻOkú ōēāīū'
    if (document.fonts && document.fonts.load) {
      await Promise.all(['italic 500 27px "Source Serif 4 Variable"', '800 40px "Barlow Condensed"', '700 10px "Inter Variable"', '400 14px "Inter Variable"'].map(f => document.fonts.load(f, sample).catch(() => null)))
      await document.fonts.ready
    }
    if (destroyed) return false
    scene = build()
    // what the film shows before anything starts it: its first instant, or, with reduced motion asked for, the finished frame of act 3
    seek(reduce ? TL.a4 - .4 : 0)
    setPlaying(false)
    if (typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver(entries => {
        for (const en of entries) {
          const vh = window.innerHeight || 1
          const mostly = en.intersectionRatio >= .5 || en.intersectionRect.height >= vh * .5
          if (mostly) comeIntoView()
          else if (en.intersectionRatio < .2 && inView) leaveView()
        }
      }, { threshold: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1] })
      io.observe(watch)
    } else if (pageMay()) setPlaying(true)
    const rebuildIfResized = () => { if (destroyed) return; const r = watch.getBoundingClientRect(); if (Math.abs(r.width - scene.boxW) > 1 || Math.abs(r.height - scene.boxH) > 1) { mcache.clear(); scene = build(); draw() } }
    if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(rebuildIfResized, 120) }); ro.observe(watch) }
    else on(window, 'resize', () => { clearTimeout(rz); rz = setTimeout(rebuildIfResized, 120) })
    return true
  })()

  on($('pause'), 'click', toggle)
  on($('replay'), 'click', replay)
  on(document, 'visibilitychange', () => {
    if (document.hidden) { if (playing) { autoPaused = true; setPlaying(false) } }
    else if (autoPaused && inView && pageMay() && !atEnd()) { autoPaused = false; setPlaying(true) }
  })
  const railAt = ev => { const r = ticksEl.getBoundingClientRect(); return clamp(Math.round(1 + 51 * (ev.clientX - r.left) / r.width), 1, 52) }
  let dragging = false
  on(rail, 'pointerdown', ev => { dragging = true; rail.setPointerCapture(ev.pointerId); toLesson(railAt(ev)) })
  on(rail, 'pointermove', ev => { if (dragging) toLesson(railAt(ev)) })
  on(rail, 'pointerup', () => { dragging = false })
  on(rail, 'pointercancel', () => { dragging = false })
  on(rail, 'keydown', ev => { if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { stepLesson(1); ev.preventDefault(); ev.stopPropagation() } if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { stepLesson(-1); ev.preventDefault(); ev.stopPropagation() } })

  const controller = {
    version: 'home-3', el, root, box: watch, ready, total: TL.total, timeline: TL,
    get time() { return cur.t }, get playing() { return playing }, get reduced() { return reduce },
    get inView() { return inView }, get pageOpen() { return !stillEl.hidden },
    seek, play: userPlay, pause: userPause, replay, toLesson, state,
    openPage: () => showPage(true), closePage: () => showPage(false),
    rebuild: () => { mcache.clear(); scene = build(); draw() },
    scene: () => scene && { W: scene.W, H: scene.H, phone: scene.PH, frameFS: scene.frameFS, scale: scene.scale, boxW: scene.boxW, boxH: scene.boxH },
    destroy() {
      if (destroyed) return
      destroyed = true; playing = false; cancelAnimationFrame(raf); clearTimeout(rz)
      cleanups.forEach(f => f()); if (ro) ro.disconnect(); if (io) io.disconnect()
      shadow.textContent = ''
      instances.delete(controller)
    },
  }
  instances.add(controller)
  return controller
}

export function unmount(el) {
  for (const inst of [...instances]) if (!el || inst.el === el) inst.destroy()
}

export const data = DATA
export default { mount, unmount }
