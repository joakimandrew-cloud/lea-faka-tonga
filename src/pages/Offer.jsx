import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'
import '../styles/v11-components.css'
import '../styles/offer.css'

// ─────────────────────────────────────────────────────────────────────────
// Swap-in links. Until checkout/email are live these point at safe fallbacks
// (the email form below captures intent with no backend). Replace the URLs in
// ONE place when GitHub Sponsors / Payhip / Buttondown are set up.
// ─────────────────────────────────────────────────────────────────────────
const LINKS = {
  sponsors: '#join',   // TODO: GitHub Sponsors / Ko-fi tier URL
  book: '#join',       // TODO: Payhip/Gumroad EPUB+PDF (pay-what-you-want)
  emailAction: '',     // TODO: Buttondown/Formspree POST endpoint; empty = local thank-you
}

// What's inside — the value stack. Counts measured from the repo.
const STACK = [
  {
    title: 'The Grammar Book',
    detail: '53 chapters · 110,651 words · A1 → B2',
    blurb: 'From your first three-word sentence to the language of respect. The complete arc, written in plain English, every rule explained.',
    worth: '$30–50',
  },
  {
    title: 'The Workbook',
    detail: '218,636 words · 283 exercises',
    blurb: 'Twice the length of the book. Practice for every pattern, chapter by chapter, with full answer keys.',
    worth: '$20–30',
  },
  {
    title: 'The Quiz Bank',
    detail: '530 questions · every answer explained',
    blurb: 'Told why, not just whether. Each wrong answer tells you the rule it broke; each right one shows why the others failed.',
    worth: '$10–20',
  },
  {
    title: 'The Interactive App',
    detail: '62 drills · 4 sentence builders · 628 flip cards · 8 reference charts',
    blurb: 'Build real Tongan sentences and watch the translation update as you go. The whole grammar, playable.',
    worth: '$79–149',
  },
  {
    title: 'The Video Course',
    detail: '~9 hours · 52 segments',
    blurb: 'The full course, narrated. The most complete Tongan video course ever made.',
    worth: '$40–150',
    soon: 'In production — Founders get it free',
  },
  {
    title: 'Charts & Real-Text Archive',
    detail: 'Reference charts + authentic Tongan documents',
    blurb: 'Quick-lookup grammar charts, and real Tongan texts to read once you are ready for the wild.',
    worth: '$10–20',
  },
]

// Patronage tiers — Tongan-named. You buy standing, never access.
const TIERS = [
  {
    ton: 'Kau Tokoni',
    en: 'Helper',
    once: '$25',
    monthly: '$5 / mo',
    perks: ['Your name on the Founders wall', 'Keeps the course free for the next learner'],
  },
  {
    ton: 'Kau Poupou',
    en: 'Patron',
    once: '$100',
    monthly: '$15 / mo',
    featured: true,
    perks: [
      'Everything in Helper',
      'A dated Founding-Edition badge',
      'The native-speaker audio pack, free, the day it lands',
    ],
  },
  {
    ton: 'Tauhi Lea',
    en: 'Language-Keeper',
    once: '$250',
    monthly: '$40 / mo',
    perks: [
      'Everything in Patron',
      'The printed heirloom book + an enamel flag pin',
      'Early access to new chapters',
      'Your name etched larger on the wall',
    ],
  },
]

// À-la-carte artifacts.
const ARTIFACTS = [
  { title: 'The Book (EPUB + PDF)', price: 'Pay what you want', note: 'Suggested $30 · floor $0', href: LINKS.book },
  { title: 'Native-Speaker Audio Pack', price: '$39', note: 'Coming — Founders get it free', soon: true },
  { title: 'Printed Heirloom Book', price: '$49', note: 'Coming — flag-geometry cover', soon: true },
  { title: 'Certificate of Completion', price: '$29', note: 'When you finish the arc', soon: true },
]

const FAQ = [
  {
    q: 'Wait — isn’t this free?',
    a: 'Yes. All 53 chapters, every drill, every quiz, forever. No login, no paywall, no streaks. You only pay if you want to keep it free for the next person, or you want the extras (audio, print, certificate).',
  },
  {
    q: 'Then why would I pay?',
    a: 'Because someone has to. Recording a native speaker, pressing a book, keeping it online — that costs money. Founders carry that cost so every learner who comes after pays nothing. And they get their name on it.',
  },
  {
    q: 'What do I actually get for paying?',
    a: 'Three things: standing (your name on the Founders wall, in your own community), artifacts (the audio pack, the printed book, a certificate), and the plain fact that you helped a language survive.',
  },
  {
    q: 'Is this really all the way to B2?',
    a: 'Yes — from “I ate” to lea fakaʻapaʻapa, the language of respect for chiefs and royalty. No other Tongan course goes there. Most never leave the tourist phrasebook.',
  },
  {
    q: 'I can’t afford it right now.',
    a: 'Then this is exactly for you. Learn everything, free, with our blessing. The book is pay-what-you-want with a floor of zero. Tauhi ʻa e lea — keep the language.',
  },
]

const Logo = () => (
  <svg className="logo-mark" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
    <polygon points="0,0 50,0 0,50" />
    <polygon points="100,0 50,0 100,50" />
    <polygon points="100,100 50,100 100,50" />
    <polygon points="0,100 50,100 0,50" />
    <polygon points="25,25 50,25 25,50" />
    <polygon points="75,25 50,25 75,50" />
    <polygon points="75,75 50,75 75,50" />
    <polygon points="25,75 50,75 25,50" />
    <polygon points="37.5,37.5 50,37.5 37.5,50" />
    <polygon points="62.5,37.5 50,37.5 62.5,50" />
    <polygon points="62.5,62.5 50,62.5 62.5,50" />
    <polygon points="37.5,62.5 50,62.5 37.5,50" />
  </svg>
)

export default function Offer() {
  const [email, setEmail] = useState('')
  const [reviewer, setReviewer] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) }
      }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.v11-landing .scroll-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleSubmit = (e) => {
    if (LINKS.emailAction) return // real endpoint handles it via native POST
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="v11-landing offer-page">

      {/* ── Top band (clickable brand back home) ── */}
      <div className="top-band">
        <Link to="/" className="top-brand" style={{ textDecoration: 'none' }}>
          <Logo />
          <span className="wordmark">Lea Faka-Tonga</span>
        </Link>
        <div className="top-sub">The Most Complete Tongan Course Ever Made · A1–B2 · Free to Learn</div>
      </div>

      {/* ── Promise / hero ── */}
      <section className="offer-hero">
        <span className="offer-eyebrow">For the words that connect you home</span>
        <h1 className="offer-headline">
          Speak your family’s language.<br /><span className="accent">All of it.</span>
        </h1>
        <p className="offer-lede">
          From your very first sentence to the language of respect spoken to chiefs and elders.
          53 chapters, A1 to B2 — the only complete, modern course for a language that has almost
          nothing online. <strong>Free to learn, forever. Yours to keep alive.</strong>
        </p>
        <div className="offer-hero-cta">
          <a href="#join" className="cta-btn">Become a Founding Keeper <span style={{ marginLeft: 8 }}>→</span></a>
          <Link to="/chapters/1" className="cta-secondary">Start Chapter 01 — free</Link>
        </div>
        <p className="offer-hero-meta">No paywall · No streaks · No login · 187,000 people speak it — almost no one teaches it</p>
      </section>

      {/* ── § What's inside (the value stack) ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 01 · Everything you get</span>
            <span className="right">Free to learn — worth far more</span>
          </div>

          <div className="offer-stack">
            {STACK.map((s, i) => (
              <div className="offer-stack-row scroll-reveal" key={s.title} style={{ transitionDelay: `${i * 0.05}s` }}>
                <div className="osr-main">
                  <div className="osr-head">
                    <span className="osr-title">{s.title}</span>
                    {s.soon && <span className="osr-soon">{s.soon}</span>}
                  </div>
                  <span className="osr-detail">{s.detail}</span>
                  <p className="osr-blurb">{s.blurb}</p>
                </div>
                <div className="osr-worth">
                  <span className="osr-worth-label">Sold alone</span>
                  <span className="osr-worth-val">{s.worth}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="offer-anchor scroll-reveal">
            <div className="offer-anchor-line">
              <span className="oa-label">If you bought it piece by piece</span>
              <span className="oa-strike">$300–600</span>
            </div>
            <div className="offer-anchor-line big">
              <span className="oa-label">What it costs you to learn all of it</span>
              <span className="oa-free">$0</span>
            </div>
            <p className="offer-anchor-note">
              We will never put a chapter behind a checkout. The price is zero, and it stays zero.
              The only thing money buys here is the chance to <em>keep</em> it that way.
            </p>
          </div>
        </div>
      </div>

      {/* ── § Why it's different ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 02 · Why it works when apps don’t</span>
            <span className="right">Built like a book, not a game</span>
          </div>
          <div className="offer-why">
            {[
              ['Told why, not just whether', 'Every wrong answer explains the rule it broke. You are never left guessing. That is how grammar actually sticks.'],
              ['The whole language, in order', 'One grammar, built one slot per chapter, A1 to B2. Nothing skipped, nothing stranded — the arc no other Tongan resource finishes.'],
              ['The writing system, done right', 'The fakauʻa and the toloi, the definitive accent — set in a font built for the Pacific. The detail that tells your elders we did our homework.'],
              ['No streaks. No nagging.', 'No dopamine traps, no notifications, no losing a week’s “progress.” It respects you as an adult who wants to speak to their family.'],
            ].map(([t, d], i) => (
              <div className="offer-why-card scroll-reveal" key={t} style={{ transitionDelay: `${i * 0.06}s` }}>
                <span className="owc-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="owc-title">{t}</span>
                <p className="owc-desc">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── § Join — patronage tiers ── */}
      <div className="offer-sec" id="join">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 03 · Keep it free for the next learner</span>
            <span className="right">Free to learn · funded by those who can</span>
          </div>
          <p className="offer-join-lede">
            This course will never have a paywall — not a chapter, not a drill, not a quiz. It stays
            free because Tongan should never sit behind a checkout. But free still costs <em>someone</em>.
            If the language is yours and you’re able to give, you can keep it free for the learner who
            comes after you — and put your name on it.
          </p>

          <div className="offer-tiers">
            {TIERS.map(t => (
              <div className={`offer-tier${t.featured ? ' featured' : ''}`} key={t.ton}>
                {t.featured && <span className="ot-flag">Most chosen</span>}
                <span className="ot-ton">{t.ton}</span>
                <span className="ot-en">{t.en}</span>
                <div className="ot-price">
                  <span className="ot-once">{t.once}</span>
                  <span className="ot-or">once · or {t.monthly}</span>
                </div>
                <ul className="ot-perks">
                  {t.perks.map(p => <li key={p}>{p}</li>)}
                </ul>
                <a href={LINKS.sponsors} className={t.featured ? 'cta-btn' : 'cta-secondary'} style={{ marginTop: 'auto' }}>
                  Become a {t.en}
                </a>
              </div>
            ))}
          </div>

          <p className="offer-guardrail">
            Can’t give right now? That’s exactly who this is for. Learn everything, free, with our
            blessing. <em>Tauhi ʻa e lea — keep the language.</em>
          </p>
        </div>
      </div>

      {/* ── § Artifacts ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 04 · Or take home the artifacts</span>
            <span className="right">One-time · no subscription</span>
          </div>
          <div className="offer-artifacts">
            {ARTIFACTS.map(a => (
              <div className={`offer-artifact${a.soon ? ' soon' : ''}`} key={a.title}>
                <div className="oa-art-top">
                  <span className="oa-art-title">{a.title}</span>
                  <span className="oa-art-price">{a.price}</span>
                </div>
                <span className="oa-art-note">{a.note}</span>
                {!a.soon && (
                  <a href={a.href} className="oa-art-link">Get it →</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Guarantee ── */}
      <section className="offer-guarantee">
        <span className="og-seal">Our promise</span>
        <p className="og-text">
          We explain <em>every</em> answer. If a rule ever stumps you, ask — and we’ll explain it,
          or refund any artifact within 30 days. No quibble. The point was never to take your money;
          it was to make sure the language outlives all of us.
        </p>
      </section>

      {/* ── Email capture ── */}
      <section className="offer-signup" id="notify">
        {!sent ? (
          <form
            className="offer-signup-form"
            {...(LINKS.emailAction ? { action: LINKS.emailAction, method: 'post', target: '_blank' } : {})}
            onSubmit={handleSubmit}
          >
            <h2 className="offer-signup-title">Get the next chapter in your inbox.</h2>
            <p className="offer-signup-sub">
              New chapters, the audio pack the day it lands, and a spot on the Founding Reviewers page.
              No streaks, no spam — a note when there’s something worth your time.
            </p>
            <div className="offer-signup-row">
              <input
                type="email" name="email" required placeholder="your@email"
                value={email} onChange={e => setEmail(e.target.value)} aria-label="Email"
              />
              <button type="submit" className="cta-btn">Keep me posted →</button>
            </div>
            <label className="offer-signup-check">
              <input type="checkbox" name="tag" value="reviewer" checked={reviewer} onChange={e => setReviewer(e.target.checked)} />
              I’m a fluent speaker and can help review chapters
            </label>
          </form>
        ) : (
          <div className="offer-signup-form">
            <h2 className="offer-signup-title">Mālō ʻaupito.</h2>
            <p className="offer-signup-sub">
              You’re on the list{reviewer ? ', and we’ve noted you can help review' : ''}. We’ll be in touch
              the moment there’s something worth your time.
            </p>
          </div>
        )}
      </section>

      {/* ── FAQ ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 05 · The honest questions</span>
            <span className="right">Yes, it’s really free</span>
          </div>
          <div className="offer-faq">
            {FAQ.map(f => (
              <details className="offer-faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom band (matches landing) ── */}
      <div className="bottom-band">
        <div>
          <div className="bottom-title">Lea Faka-Tonga <span className="dot">·</span> Keep the Language</div>
          <div className="bottom-spec">
            53 Chapters · Full Grammar Arc · Reviewed in the open
            <span className="counter"> · Free to learn. Funded by its founders.</span>
          </div>
        </div>
        <div className="cefr-badge">
          <div className="level">A1–B2</div>
          <div className="scope">Beginner → Advanced</div>
        </div>
        <div className="free-note">Free, always</div>
      </div>

      <div className="offer-sec">
        <div className="panel-frame">
          <div className="colophon">
            <div><strong>Lea Faka-Tonga</strong> · A living edition · 2026 · Growing in the open</div>
            <Link to="/" style={{ color: 'var(--red)', textDecoration: 'none' }}>← Back to the course</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
