import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../styles/home-tour.css'

/**
 * The homepage body below the hero.
 *
 * Ported from design-concepts/apple-scroll/ per DECISIONS 2026-08-11 (option E),
 * then REWORKED the same day on Andrew's taste pass:
 *
 *   1. No scroll-pinning. The Apple pattern held the page still while the scroll
 *      wheel scrubbed a demo's frames. Andrew's ruling: "sections that as you
 *      scroll down, scrolling is required to show more elements while the page
 *      is actually not scrolling down" is the page's biggest problem. So every
 *      stage is now an ordinary-height section, the page scrolls at its normal
 *      speed, and each demo PLAYS ITSELF once when it enters the viewport.
 *   2. No arrow affordances on links. Andrew: "I do not like the appearance of
 *      arrows to click on something to go somewhere new." Every doorway is a
 *      plain bordered button.
 *   3. The Remember section was cut as redundant (the Read section's third demo
 *      already flips the lesson's vocabulary into cards). Its /cards doorway
 *      moved to the closing strip.
 *
 * Every Tongan string here is read from the app's own data, never typed fresh:
 * the grandmother question is verbatim question 1 of src/pages/GrandmotherQuiz.jsx;
 * "Naʻa ku ʻalu" is the sentence the builder screenshots actually build.
 */

const BMC_URL = 'https://buymeacoffee.com/leafakatonga'

/* Order matters: the demos play once through and REST on the last one, so the
   richest frame goes last. The vocab-to-cards flip is the sparsest (a single
   small card on a wide white field), so it sits in the middle rather than
   being what the section is left showing. */
const READ_CAPS = [
  'Tap an answer and it sharpens into view.',
  'Flip the lesson’s words from a table to cards.',
  'Answer a question and check it against the book.',
]

const BUILD_CAPS = [
  'Pick a tense…',
  'Naʻa, the past tense.',
  '…then who: Naʻa ku.',
  '…then the verb: Naʻa ku ʻalu.',
  'Finished, and translated back: “I went.”',
  'And here is exactly why it’s right.',
]

/** Verbatim question 1 of the Grandmother Quiz — not new content. */
const GM_OPTIONS = ['Have you eaten?', 'Where are you going?', 'Did you sleep well?', 'Are you cold?']
const GM_ANSWER = 0

/* Play timings, in ms. Slow enough to read, short enough that a section has
   finished saying its piece by the time you have scrolled past it. */
const READ_HOLD = 2600   // per micro-demo, including its crossfade
const XF_MS = 700        // one crossfade
const BUILD_STEP = 950   // per sentence-builder frame
const FILL_MS = 900      // the Practice headline's colour fill

/* Below this width the tour serves PHONE-SHAPED captures of the same app views
   from /tour/mobile/. The originals were shot at a 1280px desktop viewport, so
   on a phone they scale into a ~330px column and the app's own UI text inside
   the picture lands at roughly 5px — decoration instead of evidence. The phone
   set is the same states re-shot at a 430px viewport, where the app lays itself
   out narrow and the text stays readable. Regenerate with
   `node scripts/capture-tour-mobile.mjs`.

   This is art direction (a different crop), not the same image at another size,
   which is why it switches the source rather than using srcset/`sizes`.
   Must match the `max-width: 980px` block in home-tour.css. */
const PHONE_Q = '(max-width: 980px)'

export default function HomeTour() {
  const rootRef = useRef(null)
  const [gmPick, setGmPick] = useState(null)
  // Initialised from the media query rather than defaulting to desktop, so the
  // first paint on a phone already has the right crop and never swaps.
  const [phone, setPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(PHONE_Q).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(PHONE_Q)
    const on = () => setPhone(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  /** Path to a tour screenshot, in the crop that suits the current viewport. */
  const shot = (name) => `/tour/${phone ? 'mobile/' : ''}${name}.png`

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const $ = (s) => root.querySelector(s)
    const $$ = (s, r = root) => [...r.querySelectorAll(s)]

    // Everything scheduled gets tracked so unmount can't leave a timer running.
    const timers = new Set()
    const frames = new Set()
    const after = (fn, ms) => { const t = setTimeout(fn, ms); timers.add(t); return t }

    /* ── Reveals ──────────────────────────────────────────────────────── */
    const observers = []
    const reveals = $$('.reveal')
    if (reduced) {
      reveals.forEach((el) => el.classList.add('is-in'))
      $$('.test-bar').forEach((el) => el.classList.add('is-in'))
    } else {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
        }),
        { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
      )
      reveals.forEach((el) => io.observe(el))
      observers.push(io)

      const barIo = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); barIo.unobserve(e.target) }
      }), { threshold: 0.4 })
      $$('.test-bar').forEach((el) => barIo.observe(el))
      observers.push(barIo)
    }

    /* ── Demos that play themselves on entry ──────────────────────────────
       The old build drove these from window.scrollY against each stage's pinned
       run. Now a demo is armed by an IntersectionObserver and runs on its own
       clock, so the page never has to stop scrolling for it. */

    /** Crossfade an .xf pair: A visible, B fading in over XF_MS. */
    const crossfade = (node) => {
      const b = node.querySelector('.xf-b')
      if (b) b.style.opacity = 1
    }
    const setCap = (node, text) => { if (node) node.textContent = text }

    /** READ — three micro-demos, each crossfading, one after the other. */
    const playRead = (section) => {
      const pairs = $$('.xf', section)
      const cap = $('#tourReadCap')
      pairs.forEach((n, i) => {
        after(() => {
          pairs.forEach((p, j) => p.classList.toggle('is-on', j === i))
          setCap(cap, READ_CAPS[i])
          after(() => crossfade(n), 500)
        }, i * READ_HOLD)
      })
    }

    /** PRACTICE — the headline colour-fills, then the drill shows its "why". */
    const playPractice = (section) => {
      const word = $('#tourFillWord')
      if (word) {
        const t0 = performance.now()
        const step = (now) => {
          const p = Math.min(1, (now - t0) / FILL_MS)
          word.style.setProperty('--fill-stop', `${Math.round(p * 100)}%`)
          if (p < 1) { const f = requestAnimationFrame(step); frames.add(f) }
        }
        const f = requestAnimationFrame(step); frames.add(f)
      }
      const pair = section.querySelector('.xf')
      if (pair) { pair.classList.add('is-on'); after(() => crossfade(pair), FILL_MS + 600) }
    }

    /** BUILD — the sentence assembles frame by frame, holding on the explain panel. */
    const playBuild = (section) => {
      const node = section.querySelector('.seq')
      if (!node) return
      const cap = $('#tourBuildCap')
      const shots = [...node.children]
      shots.forEach((_, i) => {
        after(() => {
          shots.forEach((f, j) => { f.style.opacity = j === i ? 1 : 0 })
          setCap(cap, BUILD_CAPS[i])
        }, i * BUILD_STEP)
      })
    }

    const PLAYERS = { read: playRead, practice: playPractice, build: playBuild }
    const demoSections = $$('[data-demo]')

    if (reduced) {
      // No motion: every demo rests on the state it would have ended on.
      demoSections.forEach((s) => {
        $$('.xf', s).forEach((n) => { n.classList.add('is-on'); crossfade(n) })
        $$('.seq', s).forEach((n) => [...n.children].forEach((f) => { f.style.opacity = 1 }))
      })
      const w = $('#tourFillWord')
      if (w) w.style.setProperty('--fill-stop', '100%')
      setCap($('#tourReadCap'), READ_CAPS[2])
      setCap($('#tourBuildCap'), BUILD_CAPS[5])
    } else {
      const demoIo = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return
        demoIo.unobserve(e.target)          // play once, not on every pass
        PLAYERS[e.target.dataset.demo]?.(e.target)
      }), { threshold: 0.35 })
      demoSections.forEach((s) => demoIo.observe(s))
      observers.push(demoIo)
    }

    return () => {
      timers.forEach(clearTimeout)
      frames.forEach(cancelAnimationFrame)
      observers.forEach((o) => o.disconnect())
    }
  }, [])

  const gmDone = gmPick !== null

  return (
    <div className="home-tour" ref={rootRef}>

      {/* ── The grandmother question — the tour's one live widget ──────── */}
      <section className="gm">
        <div className="gm-in">
          <p className="t-eyebrow light">She says:</p>
          <p className="gm-q t-to" lang="to">Kuo ke kai?</p>
          <p className="gm-ask">What did she just ask you?</p>
          <div className={`gm-opts${gmDone ? ' is-done' : ''}`}>
            {GM_OPTIONS.map((label, i) => {
              let state = ''
              if (gmDone) {
                if (i === GM_ANSWER) state = ' is-right'
                else if (i === gmPick) state = ' is-wrong'
                else state = ' is-dim'
              }
              return (
                <button
                  key={label}
                  type="button"
                  className={`gm-opt${state}`}
                  onClick={() => { if (!gmDone) setGmPick(i) }}
                >
                  <span className="gm-l">{'ABCD'[i]}</span> {label}
                </button>
              )
            })}
          </div>
          {gmDone && (
            <p className="gm-result">
              {gmPick === GM_ANSWER ? 'You still have it.' : 'It comes back faster than you think.'}
            </p>
          )}
          <p className="gm-foot">
            Six questions. See how much you still catch, and how fast it comes back.
          </p>
          <p className="gm-cta">
            <Link className="t-pill on-dark" to="/quiz">Take the test</Link>
          </p>
        </div>
      </section>

      {/* ── Read ───────────────────────────────────────────────────────── */}
      <section className="stage" data-demo="read">
        <div className="stage-in">
          <div className="stage-grid">
            <div className="stage-copy">
              <p className="t-eyebrow">Read</p>
              <h2 className="t-h">A whole book,<br /><em>built in.</em></h2>
              <p className="t-lede">
                The real grammar of Tongan, rewritten in plain language and taught one
                lesson at a time. 52 lessons, beginner to advanced.
              </p>
              <p className="stage-cap" id="tourReadCap">{READ_CAPS[0]}</p>
              <Link className="t-pill ghost" to="/lessons">See all 52 lessons</Link>
            </div>
            <div className="stage-media">
              <div className="xf is-on">
                <img className="xf-a" src={shot('read-reveal-0')} alt="Exercise answers blurred until tapped" />
                <img className="xf-b" src={shot('read-reveal-1')} alt="The first answer revealed after a tap, the rest still blurred" />
              </div>
              <div className="xf">
                <img className="xf-a" src={shot('read-vocab-0')} alt="The lesson's vocabulary as a table" />
                <img className="xf-b" src={shot('read-vocab-1')} alt="The same vocabulary switched to flip cards" />
              </div>
              <div className="xf">
                <img className="xf-a" src={shot('read-mcq-0')} alt="A multiple-choice exercise, unanswered" />
                <img className="xf-b" src={shot('read-mcq-1')} alt="The same exercise answered, marked correct with the book's answer" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Practice ───────────────────────────────────────────────────── */}
      <section className="stage night" data-demo="practice">
        <div className="stage-in">
          <div className="stage-grid">
            <div className="stage-copy">
              <p className="t-eyebrow">Practice</p>
              <h2 className="t-h">Every <span className="fill" id="tourFillWord">wrong answer</span> teaches.</h2>
              <p className="t-lede">
                Drills for every skill, and when you miss, it tells you why. That&rsquo;s the
                difference between practicing and memorizing.
              </p>
              <Link className="t-pill on-dark" to="/drills">Browse the drill board</Link>
            </div>
            <div className="stage-media">
              <div className="xf">
                <img className="xf-a" src={shot('drill-q')} alt="A drill question: read a Tongan sentence and choose its meaning" />
                <img className="xf-b" src={shot('drill-why')} alt="The wrong answer marked, with the correct answer and an explanation of why" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Build ──────────────────────────────────────────────────────── */}
      <section className="stage" data-demo="build">
        <div className="stage-in">
          <div className="tint">
            <div className="stage-grid tight">
              <div className="stage-copy">
                <p className="t-eyebrow light">Build</p>
                <h2 className="t-h light">Don&rsquo;t repeat sentences.<br /><em>Build your own.</em></h2>
                <p className="t-lede light">
                  Choose what you want to say, and the course walks you word by word,
                  then shows you exactly why it&rsquo;s right.
                </p>
                <p className="stage-cap light" id="tourBuildCap">{BUILD_CAPS[0]}</p>
                <Link className="t-pill on-dark" to="/sentence-builder">Build a sentence</Link>
              </div>
              <div className="stage-media">
                <div className="seq" data-seq="sb">
                  <img src={shot('sb-step-0')} alt="The sentence builder, empty, with the word picker open" />
                  <img src={shot('sb-step-1')} alt="The first word chosen: Naʻa" />
                  <img src={shot('sb-step-2')} alt="Two words chosen: Naʻa ku" />
                  <img src={shot('sb-step-4')} alt="Three words chosen: Naʻa ku ʻalu" />
                  <img src={shot('sb-done')} alt="The finished sentence, Naʻa ku ʻalu, translated as I went" />
                  <img src={shot('sb-explain')} alt="The explain panel: the slot template and a word-by-word table with the lesson each word comes from" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Test ───────────────────────────────────────────────────────── */}
      <section className="test t-band">
        <div className="test-in">
          <div className="test-head">
            <p className="t-eyebrow reveal">Test</p>
            <h2 className="t-h reveal d1">A quiz for<br /><em>every lesson.</em></h2>
            <p className="t-lede reveal d2">
              Ten questions after every lesson. Wrong options come with explanations too.
            </p>
            <div className="test-bar reveal d3"><i /></div>
          </div>
          <div className="test-row">
            <figure className="test-card reveal">
              <img src={shot('quiz-answered')} alt="A quiz question answered correctly, with an explanation under the option" loading="lazy" />
              <figcaption>Answer, and the reason comes with it.</figcaption>
            </figure>
            <figure className="test-card reveal d1">
              <img src={shot('quiz-finish')} alt="The quiz finish screen showing the score" loading="lazy" />
              <figcaption>Then see where you stand.</figcaption>
            </figure>
          </div>
          <p className="test-cta reveal d2">
            <Link className="t-pill ghost" to="/quizzes">Take a quiz</Link>
          </p>
        </div>
      </section>

      {/* ── Close — the remaining doorways, and the ask ─────────────────── */}
      <section className="close">
        <h2 className="t-h reveal">Free now. Yours later.</h2>
        <p className="close-sub reveal d1">
          Every lesson is open while the course is being built, and the book stays free
          forever. If it&rsquo;s worth something to you, $35+ keeps the site free for you,
          for life.
        </p>
        {/* No "spot a mistake" link here: the colophon directly below already
            carries it, and two of them a few hundred pixels apart reads as a
            mistake in itself. */}
        <div className="close-links reveal d2">
          <a className="t-pill" href={BMC_URL} target="_blank" rel="noopener noreferrer">Support the work</a>
          <Link className="t-pill ghost" to="/cards">Vocabulary cards</Link>
          <Link className="t-pill ghost" to="/charts">Reference charts</Link>
        </div>
      </section>

    </div>
  )
}
