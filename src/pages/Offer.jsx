import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'
import '../styles/v11-components.css'
import '../styles/offer.css'

// ─────────────────────────────────────────────────────────────────────────
// Swap-in links + config. Until checkout/email are live these point at safe
// fallbacks (the email form captures intent with no backend). Replace in ONE
// place when GitHub Sponsors / Ko-fi / Payhip / Buttondown are set up.
// ─────────────────────────────────────────────────────────────────────────
const LINKS = {
  patron: '#notify',   // TODO: Ko-fi / GitHub Sponsors recurring-tier URL (placeholder captures email intent)
  book: '#join',       // TODO: Payhip/Gumroad EPUB+PDF (pay-what-you-want)
  bundle: '#join',     // TODO: Payhip Heirloom Bundle checkout
  institutional: 'mailto:andrew@montedesign.com?subject=Tongan%20course%20licensing', // TODO: partner form
  emailAction: '',     // TODO: Buttondown/Formspree POST endpoint; empty = local thank-you
}

// Honest founders counter. Bump `claimed` as real Founders join — never fake it.
const FOUNDERS = { claimed: 0, cap: 250 }

// The value stack — proof of substance (Most-Aware believability, kept below the offer).
const STACK = [
  { title: 'The Grammar Book', detail: '53 chapters · 110,651 words · A1 → B2', worth: '$30–50',
    blurb: 'From your first three-word sentence to the language of respect. The complete arc, every rule explained.' },
  { title: 'The Workbook', detail: '218,636 words · 283 exercises', worth: '$20–30',
    blurb: 'Twice the length of the book. Practice for every pattern, chapter by chapter, with full answer keys.' },
  { title: 'The Quiz Bank', detail: '530 questions · every answer explained', worth: '$10–20',
    blurb: 'Told why, not just whether. Each wrong answer tells you the rule it broke.' },
  { title: 'The Interactive App', detail: '62 drills · 4 builders · 628 flip cards · live translator', worth: '$79–149',
    blurb: 'Build real Tongan sentences and watch the translation update as you go. The whole grammar, playable.' },
  { title: 'The Video Course', detail: '~9 hours · 52 segments', worth: '$40–150', soon: 'In production · Founders get it free',
    blurb: 'The full course, narrated. The most complete Tongan video course ever made.' },
  { title: 'Charts & Real-Text Archive', detail: 'Reference charts + authentic Tongan documents', worth: '$10–20',
    blurb: 'Quick-lookup charts, and real Tongan texts to read once you are ready for the wild.' },
]

// The Founding Keeper bonus stack — each named, dollar-tagged, killing one fear.
const BONUSES = [
  { name: 'Elder Voices — Native-Speaker Audio', value: '$39', kills: 'so you never mispronounce a word to your elders' },
  { name: 'The Heirloom Edition — Printed Book', value: '$49', kills: 'the book your children inherit' },
  { name: 'The Grandmother Sprint — 7-Day Path', value: 'free bonus', kills: 'your first real conversation, in a week' },
  { name: 'The Respect-Language Field Guide', value: '$29', kills: 'lea fakaʻapaʻapa for funerals, church and chiefs — the part every phrasebook skips' },
  { name: 'Your name on the Roll of Keepers', value: 'priceless', kills: 'permanent, public, in your own community' },
]

// Patronage tiers — lead with the STANDING, price second (Most-Aware surface).
const TIERS = [
  { ton: 'Kau Tokoni', en: 'Helper', confers: 'Your name on the Roll of Keepers',
    once: '$25', monthly: '$5 / mo',
    perks: ['Name on the Roll of Keepers', 'You keep the course free for the next learner'] },
  { ton: 'Kau Poupou', en: 'Patron', confers: 'A founding patron of the language', featured: true,
    once: '$100', monthly: '$15 / mo',
    perks: ['Everything in Helper', 'A dated Founding-Edition badge', 'Elder Voices audio — free, the day it lands'] },
  { ton: 'Tauhi Lea', en: 'Language-Keeper', confers: 'A keeper of the living language',
    once: '$250', monthly: '$40 / mo',
    perks: ['Everything in Patron', 'The Heirloom Edition + an enamel flag pin', 'Early access to new chapters', 'Dedicate your gift in an elder’s name'] },
  { ton: 'Tauhi Fonua', en: 'Keeper of the Homeland', confers: 'Your name cast into the work itself',
    once: '$1,000', monthly: 'or more',
    perks: ['Everything in Language-Keeper', 'Your name engraved in every printed copy', 'A dedication line you write', 'Top of the Roll of Keepers'] },
]

// À-la-carte artifacts — provenance names, emotional function first.
const ARTIFACTS = [
  { title: 'The Heirloom Bundle', sub: 'Printed book + Elder Voices audio + certificate', price: '$79', note: 'Would be $117 apart · we name you in the book', href: LINKS.bundle, hero: true },
  { title: 'The Book — EPUB + PDF', sub: 'Read it anywhere, keep it forever', price: 'Pay what you want', note: 'Suggested $30 · floor $0', href: LINKS.book },
  { title: 'Elder Voices — Audio', sub: 'Every example, spoken by a native voice', price: '$39', note: 'Coming · Founders get it free', soon: true },
  { title: 'The Heirloom Edition — Print', sub: 'Flag-geometry cover · the one your kids inherit', price: '$49', note: 'Coming soon', soon: true },
]

const FAQ = [
  { q: 'Wait — isn’t this free?',
    a: 'Yes. All 53 chapters, every drill, every quiz, forever. No login, no paywall, no streaks. You only pay if you want to keep it free for the next person, or you want the artifacts (audio, print, certificate).' },
  { q: 'Then why would I pay?',
    a: 'Because someone has to. Recording a native speaker, pressing a book, keeping it online — that costs money. Founders carry that cost so every learner who comes after pays nothing. And their name goes on the Roll of Keepers.' },
  { q: 'You could charge for this. Why don’t you?',
    a: 'Because Tongan is not ours to sell — it belongs to everyone it came from. Schools and congregations license it for thousands. For a family learning at home, the price is, and always will be, nothing. That is not a discount. It is a refusal.' },
  { q: 'Is this really all the way to B2?',
    a: 'Yes — from “I ate” to lea fakaʻapaʻapa, the language of respect for chiefs and royalty. No other Tongan course goes there. Most never leave the tourist phrasebook.' },
  { q: 'I can’t afford it right now.',
    a: 'Then this is exactly who it is for. Learn everything, free, with our blessing. The book is pay-what-you-want with a floor of zero. Tauhi ʻa e lea — keep the language.' },
]

const Logo = () => (
  <svg className="logo-mark" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
    <polygon points="0,0 50,0 0,50" /><polygon points="100,0 50,0 100,50" />
    <polygon points="100,100 50,100 100,50" /><polygon points="0,100 50,100 0,50" />
    <polygon points="25,25 50,25 25,50" /><polygon points="75,25 50,25 75,50" />
    <polygon points="75,75 50,75 75,50" /><polygon points="25,75 50,75 25,50" />
    <polygon points="37.5,37.5 50,37.5 37.5,50" /><polygon points="62.5,37.5 50,37.5 62.5,50" />
    <polygon points="62.5,62.5 50,62.5 62.5,50" /><polygon points="37.5,62.5 50,62.5 37.5,50" />
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
    if (LINKS.emailAction) return
    e.preventDefault()
    setSent(true)
  }

  const spotsLeft = FOUNDERS.cap - FOUNDERS.claimed

  return (
    <div className="v11-landing offer-page">

      {/* ── Top band ── */}
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

      {/* ── The refused price (high anchor, set immediately) ── */}
      <section className="offer-refused">
        <div className="panel-frame">
          <div className="orf-grid">
            <div className="orf-block">
              <span className="orf-label">A school or congregation licenses this for</span>
              <span className="orf-big">$2,500–$25,000</span>
            </div>
            <div className="orf-block">
              <span className="orf-label">A family learning at home pays</span>
              <span className="orf-big free">Nothing</span>
            </div>
          </div>
          <p className="orf-line">
            We could charge $400 for what’s inside. <strong>We never will.</strong> Not because it isn’t worth it —
            because Tongan is not ours to sell. That isn’t a discount. It’s a refusal.
          </p>
        </div>
      </section>

      {/* ── § Everything you get (proof) ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 01 · Everything you get</span>
            <span className="right">All of it · free</span>
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

      {/* ── § The Founding Keepers (the offer) ── */}
      <div className="offer-sec" id="join">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 03 · The Founding Keepers</span>
            <span className="right">Free to learn · funded by those who can</span>
          </div>

          {/* honest scarcity counter */}
          <div className="offer-counter">
            <div className="ocnt-text">
              {FOUNDERS.claimed === 0
                ? <>The wall is open. Be among the <strong>first {FOUNDERS.cap}</strong> Founding Keepers — names cast into the work, then the charter closes.</>
                : <><strong>{FOUNDERS.claimed} of {FOUNDERS.cap}</strong> Founding Keepers claimed · {spotsLeft} places left before the charter closes.</>}
            </div>
            <div className="ocnt-bar"><span style={{ width: `${Math.max(2, (FOUNDERS.claimed / FOUNDERS.cap) * 100)}%` }} /></div>
            <div className="ocnt-note">Founding tiers close the day the audio is recorded. After that the audio is paid, and the Founder price is gone.</div>
          </div>

          <p className="offer-join-lede">
            This course will never have a paywall — not a chapter, not a drill, not a quiz. But free still costs
            <em> someone</em>. Founders carry that cost so the next family doesn’t have to. Become one, and here is
            everything that comes with it:
          </p>

          {/* the named bonus stack */}
          <div className="offer-bonuses">
            {BONUSES.map(b => (
              <div className="offer-bonus" key={b.name}>
                <span className="obn-check">✦</span>
                <span className="obn-name">{b.name}</span>
                <span className="obn-kill">{b.kills}</span>
                <span className="obn-value">{b.value}</span>
              </div>
            ))}
            <div className="offer-bonus total">
              <span className="obn-name">Everything above, when you become a Founding Keeper</span>
              <span className="obn-value">$117+ value</span>
            </div>
          </div>

          {/* tiers */}
          <div className="offer-tiers four">
            {TIERS.map(t => (
              <div className={`offer-tier${t.featured ? ' featured' : ''}`} key={t.ton}>
                {t.featured && <span className="ot-flag">Most chosen</span>}
                <span className="ot-ton">{t.ton}</span>
                <span className="ot-en">{t.en}</span>
                <span className="ot-confers">{t.confers}</span>
                <div className="ot-price">
                  <span className="ot-once">{t.once}</span>
                  <span className="ot-or">{t.monthly === 'or more' ? 'or more' : `once · or ${t.monthly}`}</span>
                </div>
                <ul className="ot-perks">
                  {t.perks.map(p => <li key={p}>{p}</li>)}
                </ul>
                <a href={LINKS.patron} className={t.featured ? 'cta-btn' : 'cta-secondary'} style={{ marginTop: 'auto' }}>
                  Become a {t.en}
                </a>
              </div>
            ))}
          </div>

          <div className="offer-keepers-link">
            <Link to="/keepers" className="cta-secondary">See the Roll of Keepers →</Link>
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
              <div className={`offer-artifact${a.soon ? ' soon' : ''}${a.hero ? ' hero' : ''}`} key={a.title}>
                <div className="oa-art-top">
                  <span className="oa-art-title">{a.title}</span>
                  <span className="oa-art-price">{a.price}</span>
                </div>
                <span className="oa-art-sub">{a.sub}</span>
                <span className="oa-art-note">{a.note}</span>
                {!a.soon && <a href={a.href} className="oa-art-link">Get it →</a>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── § Institutional licensing (the anchor, detailed) ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 05 · For schools, churches & wards</span>
            <span className="right">The license that keeps it free for everyone else</span>
          </div>
          <div className="offer-inst">
            <div className="oin-main">
              <p>
                If you run a Tongan-language program, a Pasifika studies department, a ward, or a community
                school, you can license the complete course — book, workbook, app, and the forthcoming audio —
                for your learners. Your fee is what funds the native-speaker recordings and keeps the course
                <em> free</em> for every family learning at home.
              </p>
              <p className="oin-sub">One license records the Elder Voices audio outright. That’s the deal: institutions pay so a grandchild never has to.</p>
            </div>
            <div className="oin-card">
              <span className="oin-range">$2,500–$25,000</span>
              <span className="oin-range-label">per year · scaled to your size</span>
              <a href={LINKS.institutional} className="cta-btn" style={{ justifyContent: 'center' }}>Enquire about licensing</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── The Tauhi Lea Promise (guarantee) ── */}
      <section className="offer-guarantee">
        <span className="og-seal">The Tauhi Lea Promise</span>
        <p className="og-text">
          We took the risk out by making it <em>free</em> — you learn the whole thing before you ever pay a cent.
          And every artifact carries a 30-day, no-quibble refund. If a rule ever stumps you, ask, and we’ll
          explain it. The point was never to take your money; it was to make sure the language outlives all of us.
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
            <h2 className="offer-signup-title">Not ready? Take the 60-second test.</h2>
            <p className="offer-signup-sub">
              <Link to="/quiz" style={{ color: 'var(--red-light)' }}>Can you still understand your grandmother?</Link> Find out,
              then get the next chapter and the audio pack the day it lands. No streaks, no spam.
            </p>
            <div className="offer-signup-row">
              <input type="email" name="email" required placeholder="your@email"
                value={email} onChange={e => setEmail(e.target.value)} aria-label="Email" />
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
            <span>§ 06 · The honest questions</span>
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

      {/* ── Bottom band ── */}
      <div className="bottom-band">
        <div>
          <div className="bottom-title">Lea Faka-Tonga <span className="dot">·</span> Keep the Language</div>
          <div className="bottom-spec">
            53 Chapters · Full Grammar Arc · Reviewed in the open
            <span className="counter"> · Free to learn. Funded by its Keepers.</span>
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
