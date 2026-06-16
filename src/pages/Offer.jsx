import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'
import '../styles/v11-components.css'
import '../styles/offer.css'

// ─────────────────────────────────────────────────────────────────────────
// Model (ruled 2026-06-12, DECISIONS.md): the BOOK is free — PDF/EPUB, whole,
// forever. The web practice machine is Membership. Ch 1–3 fully open; Ch 4–53
// go members-only when the member tools ship. No on-site accounts EVER —
// checkout lives on a third party (Gumroad/BMC), access via a member token.
//
// Swap-in links. Until checkout/email are live these point at safe fallbacks
// (the email form captures founding-list intent with no backend). Replace in
// ONE place when the Gumroad products / Buttondown form are set up.
// ─────────────────────────────────────────────────────────────────────────
const LINKS = {
  foundingAnnual: '#notify',   // TODO: Gumroad "Founding Membership" $59/yr subscription URL
  foundingLifetime: '#notify', // TODO: Gumroad "Founding Lifetime" $149 one-time URL
  bookPdf: `${import.meta.env.BASE_URL}downloads/Lea-Faka-Tonga.pdf`,   // the complete book, free
  bookEpub: `${import.meta.env.BASE_URL}downloads/Lea-Faka-Tonga.epub`, // the complete book, free
  bundle: '#notify',           // TODO: Payhip/Gumroad Heirloom Bundle checkout
  donor: 'mailto:andrew@montedesign.com?subject=Tauhi%20Fonua',
  institutional: 'mailto:andrew@montedesign.com?subject=Tongan%20course%20licensing',
  emailAction: '',             // TODO: Buttondown/Formspree POST endpoint; empty = local thank-you
}

// Honest founding counter. Bump `claimed` as real members join — never fake it.
const FOUNDERS = { claimed: 0, cap: 250 }

// The course contents — proof of substance, each row marked free or members.
const STACK = [
  { title: 'The Grammar Book', detail: '53 chapters · 110,651 words · beginner → advanced', badge: 'FREE · PDF + EPUB below',
    blurb: 'From your first three-word sentence to the language of respect. The complete arc, every rule explained, yours to download, whole, forever.' },
  { title: 'The Interactive Practice Machine', detail: '62 drills · 4 builders · embedded exercises, every chapter', badge: 'Ch 1–3 free · then members',
    blurb: 'Build real Tongan sentences and watch the translation update as you go. The whole grammar, playable.' },
  { title: 'The Quiz Bank', detail: '530 questions · every answer explained', badge: 'Ch 1–3 free · then members',
    blurb: 'Every wrong answer names the rule it broke, and every right answer shows why the others missed.' },
  { title: 'The Flip-Card Deck', detail: '628 cards · filter by tier and category', badge: 'Starter deck free · full deck members',
    blurb: 'Build your vocabulary one card at a time, keyboard-fast and phone-friendly.' },
  { title: 'The Workbook', detail: '218,636 words · 283 exercises · full answer keys', badge: 'Members',
    blurb: 'Twice the length of the book. Practice for every pattern, chapter by chapter, included as PDFs.' },
  { title: 'The Video Course', detail: '~9 hours · 52 segments', badge: 'In production · members',
    blurb: 'The full course, narrated, chapter by chapter. Members get it as it ships.' },
  { title: 'Charts & Real-Text Archive', detail: 'Reference charts + authentic Tongan documents', badge: 'Charts free · archive members',
    blurb: 'Quick-lookup charts for everyone. Real Tongan texts to read once you are ready for the wild.' },
]

// What membership includes — one line per inclusion.
const MEMBER_STACK = [
  { name: 'Every drill, every chapter', value: 'included', note: '62 drill engines and 4 sentence builders across all 53 chapters' },
  { name: 'The full 628-card deck + 530-question quiz bank', value: 'included', note: 'every wrong answer names the rule it broke' },
  { name: 'The Workbook, 218,636 words, as PDFs', value: 'included', note: 'twice the book; practice for every pattern with answer keys' },
  { name: 'The course on your phone', value: 'shipping with the member tools', note: 'installable and offline-ready, the whole course in your pocket' },
  { name: 'Elder Voices, native-speaker audio', value: 'free for members', note: 'members get it the day it lands, so you never mispronounce a word to your elders' },
  { name: 'The video course, in the app, as it ships', value: 'included', note: '~9 hours, 52 segments, narrated' },
  { name: 'Your name on the Roll of Keepers', value: 'standing', note: 'membership keeps the language alive, and says so, permanently, in your own community' },
]

// Membership tiers. Only the founding tiers are buyable now; the standard
// ladder is shown so the founding price visibly means something.
const TIERS = [
  { name: 'Founding Member', price: '$59', per: '/ year · locked for life', featured: true, active: true,
    confers: 'First 250 members · your price locked for life',
    perks: ['Everything members get', '$59/yr for life, even after prices rise', 'Founding badge + top of the Roll of Keepers'],
    href: LINKS.foundingAnnual, cta: 'Become a Founding Member' },
  { name: 'Founding Lifetime', price: '$149', per: 'once · yours forever', active: true,
    confers: 'The Interactive Edition, owned like the book',
    perks: ['Everything members get, for life', 'No renewals, ever', 'Founding badge + the Roll of Keepers'],
    href: LINKS.foundingLifetime, cta: 'Own it for life' },
  { name: 'Membership', price: '$79', per: '/ year · or $12 / mo', active: false,
    confers: 'Opens when the founding window closes',
    perks: ['Everything members get', '$99/yr for new members once the native audio ships', 'Founders never pay this'] },
  { name: 'Lifetime', price: '$199', per: 'once', active: false,
    confers: 'Opens when the founding window closes',
    perks: ['The Interactive Edition, at the standard price', 'The gift that doesn’t expire', 'Founding Lifetime costs $50 less today'] },
]

const FAQ = [
  { q: 'So what’s actually free?',
    a: 'The whole book, all 53 chapters, 110,651 words, as PDF and EPUB, free forever, no email wall. On the website, Chapters 1–3 are completely open: the prose, the drills, the flip cards, the quizzes, everything. The Grandmother Quiz and the reference charts are free too. The rest of the practice machine is for members.' },
  { q: 'Why charge at all?',
    a: 'Because this stays alive on membership instead of ads. No banners, no investors, no selling your attention or your data. Recording native speakers, building the tools, keeping it online: that costs real money. Members carry it, their names go on the Roll of Keepers, and the book stays free for everyone, forever.' },
  { q: 'Do I need an account?',
    a: 'No, and you never will. There are no logins here. You buy membership at our checkout partner, they send you a member token, you enter it once and the site unlocks on your device. We never see your card and never store your password or your data. There is nothing here to hack.' },
  { q: 'Does it really go all the way to advanced?',
    a: 'Yes. From “I ate” to lea fakaʻapaʻapa, the language of respect for chiefs and royalty. No other Tongan course goes there; most never leave the tourist phrasebook.' },
  { q: 'What happens when the founding window closes?',
    a: 'The price goes to $79 a year ($12 monthly, $199 lifetime). And when the native-speaker audio ships, new members pay $99 a year, while founders keep $59 for life.' },
  { q: 'I can’t afford it right now.',
    a: 'Then start free: the whole book is yours, and Chapters 1–3 are open with every tool. And if money is the only thing between you and the language, email us; there’s a free year waiting, no questions asked. Tauhi ʻa e lea, keep the language.' },
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
        <div className="top-sub">A complete, modern Tongan course · Beginner to advanced · The book is free</div>
      </div>

      {/* ── Promise / hero ── */}
      <section className="offer-hero">
        <span className="offer-eyebrow">For the words that connect you home</span>
        <h1 className="offer-headline">
          Speak your family’s language.<br /><span className="accent">All of it.</span>
        </h1>
        <p className="offer-lede">
          From your very first sentence to the language of respect spoken to chiefs and elders.
          53 chapters, beginner to advanced. The only complete, modern course for a language that has almost
          nothing online. <strong>The whole book is free to download, forever. Membership runs the
          practice machine.</strong>
        </p>
        <div className="offer-hero-cta">
          <a href="#join" className="cta-btn">Become a Founding Member <span style={{ marginLeft: 8 }}>→</span></a>
          <a href="#book" className="cta-secondary">Download the book, free</a>
          <Link to="/chapters/1" className="cta-secondary">Try Chapter 01, free</Link>
        </div>
        <p className="offer-hero-meta">First 3 chapters fully open · No ads · No streaks · No accounts, ever</p>
      </section>

      {/* ── The anchor: what institutions pay vs what the book costs ── */}
      <section className="offer-refused">
        <div className="panel-frame">
          <div className="orf-grid">
            <div className="orf-block">
              <span className="orf-label">A school or congregation licenses this for</span>
              <span className="orf-big">$2,500–$25,000</span>
            </div>
            <div className="orf-block">
              <span className="orf-label">The complete book, all 53 chapters, costs</span>
              <span className="orf-big free">Nothing</span>
            </div>
          </div>
          <p className="orf-line">
            The language is not ours to sell, so the book never costs a cent. What membership pays for
            is the <strong>machine</strong>: the drills, the cards, the builders, the phone-ready course.
            $79 a year. Founding members: <strong>$59, locked for life.</strong>
          </p>
        </div>
      </section>

      {/* ── § The free book ── */}
      <div className="offer-sec" id="book">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 01 · The book: free, whole, forever</span>
            <span className="right">No email wall · no catch</span>
          </div>
          <div className="offer-inst">
            <div className="oin-main">
              <p>
                Every chapter, every rule, every example: 110,651 words, all the way to
                <em> lea fakaʻapaʻapa</em>. Download it, print it, send it to your cousins. It is the
                whole course in book form, and it will never cost anything. Judge us by it first;
                pay only if you want the machine.
              </p>
              <p className="oin-sub">Chapters 1–3 are also fully open on the website (prose, drills, cards and quizzes), so you can feel the difference the machine makes.</p>
            </div>
            <div className="oin-card">
              <span className="oin-range">619 pages</span>
              <span className="oin-range-label">the complete book · free download</span>
              <a href={LINKS.bookPdf} className="cta-btn" style={{ justifyContent: 'center' }} download>Download PDF, free</a>
              <a href={LINKS.bookEpub} className="cta-secondary" style={{ justifyContent: 'center', marginTop: 8 }} download>EPUB for e-readers</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── § Everything in the course (proof) ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 02 · Everything inside</span>
            <span className="right">The book free · the machine, membership</span>
          </div>
          <div className="offer-stack">
            {STACK.map((s, i) => (
              <div className="offer-stack-row scroll-reveal" key={s.title} style={{ transitionDelay: `${i * 0.05}s` }}>
                <div className="osr-main">
                  <div className="osr-head">
                    <span className="osr-title">{s.title}</span>
                    {s.badge && <span className="osr-soon">{s.badge}</span>}
                  </div>
                  <span className="osr-detail">{s.detail}</span>
                  <p className="osr-blurb">{s.blurb}</p>
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
            <span>§ 03 · Why it works when apps don’t</span>
            <span className="right">Built like a book, not a game</span>
          </div>
          <div className="offer-why">
            {[
              ['Told why, not just whether', 'Every wrong answer explains the rule it broke, and every right answer shows why the others were wrong. You are never left guessing.'],
              ['The whole language, in order', 'One grammar, built one slot per chapter, beginner to advanced. Nothing skipped, nothing stranded: the arc no other Tongan resource finishes.'],
              ['The writing system, done right', 'The fakauʻa and the toloi, the definitive accent, set in a font built for the Pacific. The detail that tells your elders we did our homework.'],
              ['Funded by its members', 'No banners, no data harvesting, no accounts to breach. Membership is why this exists and stays independent.'],
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

      {/* ── § Membership (the offer) ── */}
      <div className="offer-sec" id="join">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 04 · Membership</span>
            <span className="right">The book free · funded by its members</span>
          </div>

          {/* honest founding counter */}
          <div className="offer-counter">
            <div className="ocnt-text">
              {FOUNDERS.claimed === 0
                ? <>The founding window is open. The first <strong>{FOUNDERS.cap}</strong> members lock <strong>$59 a year for life</strong>, with their names on the Roll of Keepers.</>
                : <><strong>{FOUNDERS.claimed} of {FOUNDERS.cap}</strong> Founding Members claimed · {spotsLeft} places left at $59 for life.</>}
            </div>
            <div className="ocnt-bar"><span style={{ width: `${Math.max(2, (FOUNDERS.claimed / FOUNDERS.cap) * 100)}%` }} /></div>
            <div className="ocnt-note">Checkout opens shortly. Leave your email below and the founding link reaches you first. Founding pricing ends at member #{FOUNDERS.cap}.</div>
          </div>

          <p className="offer-join-lede">
            Plainly: the book is free because the language is not ours to sell. The practice machine is
            what membership pays for. Chapters 1–3 are open in full, tools
            and all, so you can judge the machine before you pay a cent. When the member tools ship,
            Chapters 4–53 on the web become members-only. The book stays free, forever.
          </p>

          {/* what members get */}
          <div className="offer-bonuses">
            {MEMBER_STACK.map(b => (
              <div className="offer-bonus" key={b.name}>
                <span className="obn-check">✦</span>
                <span className="obn-name">{b.name}</span>
                <span className="obn-note">{b.note}</span>
                <span className="obn-value">{b.value}</span>
              </div>
            ))}
            <div className="offer-bonus total">
              <span className="obn-name">Everything above</span>
              <span className="obn-value">from $59 a year</span>
            </div>
          </div>

          {/* tiers */}
          <div className="offer-tiers four">
            {TIERS.map(t => (
              <div className={`offer-tier${t.featured ? ' featured' : ''}`} key={t.name}>
                {t.featured && <span className="ot-flag">The founding price</span>}
                <span className="ot-ton">{t.name}</span>
                <span className="ot-en">{t.active ? 'Open now' : 'Later'}</span>
                <span className="ot-confers">{t.confers}</span>
                <div className="ot-price">
                  <span className="ot-once">{t.price}</span>
                  <span className="ot-or">{t.per}</span>
                </div>
                <ul className="ot-perks">
                  {t.perks.map(p => <li key={p}>{p}</li>)}
                </ul>
                {t.active
                  ? <a href={t.href} className={t.featured ? 'cta-btn' : 'cta-secondary'} style={{ marginTop: 'auto' }}>{t.cta}</a>
                  : <span className="ot-or" style={{ marginTop: 'auto' }}>Opens when the founding window closes</span>}
              </div>
            ))}
          </div>

          <div className="offer-keepers-link">
            <Link to="/keepers" className="cta-secondary">See the Roll of Keepers →</Link>
          </div>

          <p className="offer-guardrail">
            If money is the only thing between you and the language, email us; there’s a free year
            waiting. Just ask. <em>Tauhi ʻa e lea, keep the language.</em>
          </p>
        </div>
      </div>

      {/* ── § For the family that wants to do more ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 05 · Tauhi Fonua: for the family that wants to do more</span>
            <span className="right">Standing, not access</span>
          </div>
          <div className="offer-inst">
            <div className="oin-main">
              <p>
                Some families want to put real weight behind the language, the way they would at church,
                or for a funeral, or a wedding. <strong>Tauhi Fonua</strong> (Keeper of the Homeland)
                is for them: your family’s name engraved in every printed copy of the book, a dedication
                line you write, and the top of the Roll of Keepers.
              </p>
              <p className="oin-sub">It funds the native-speaker recordings outright. A name in every copy, for the price of one family feast.</p>
            </div>
            <div className="oin-card">
              <span className="oin-range">$1,000+</span>
              <span className="oin-range-label">one gift · permanent recognition</span>
              <a href={LINKS.donor} className="cta-btn" style={{ justifyContent: 'center' }}>Talk to us</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── § Artifacts ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 06 · Or take home the artifacts</span>
            <span className="right">One-time · physical & recorded</span>
          </div>
          <div className="offer-artifacts">
            {[
              { title: 'The Heirloom Bundle', sub: 'Printed book + Elder Voices audio + certificate', price: '$79', note: 'We name you in the book', href: LINKS.bundle, hero: true },
              { title: 'Elder Voices', sub: 'Every example, spoken by a native voice', price: '$39', note: 'In production · members get it free', soon: true },
              { title: 'The Heirloom Edition', sub: 'Flag-geometry cover · the one your kids inherit', price: '$49', note: 'Coming soon', soon: true },
            ].map(a => (
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
            <span>§ 07 · For schools, churches & wards</span>
            <span className="right">The license that keeps the book free for everyone else</span>
          </div>
          <div className="offer-inst">
            <div className="oin-main">
              <p>
                If you run a Tongan-language program, a Pasifika studies department, a ward, or a community
                school, you can license the complete course (book, workbook, app, and the forthcoming audio)
                for your learners. Your fee is what funds the native-speaker recordings and keeps the book
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
          Annual and founding memberships carry a 60-day promise: if you haven’t said your first real
          sentences to your family, every cent back, and you keep the book; it was always yours.
          Artifacts carry a 30-day, no-quibble refund. And if a rule ever stumps you, ask, and we’ll
          explain it until it clicks. The point was never to take your money; it’s that the language
          outlives all of us.
        </p>
      </section>

      {/* ── Email capture (the founding list) ── */}
      <section className="offer-signup" id="notify">
        {!sent ? (
          <form
            className="offer-signup-form"
            {...(LINKS.emailAction ? { action: LINKS.emailAction, method: 'post', target: '_blank' } : {})}
            onSubmit={handleSubmit}
          >
            <h2 className="offer-signup-title">Checkout opens shortly. Be first through the door.</h2>
            <p className="offer-signup-sub">
              Leave your email and the founding-member link reaches you the moment it’s live; the first 250
              lock $59 a year for life. Not sure yet? Take the 60-second test:{' '}
              <Link to="/quiz" style={{ color: 'var(--red-light)' }}>Can you still understand your grandmother?</Link>{' '}
              No streaks, no spam.
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
            <span>§ 08 · The honest questions</span>
            <span className="right">Straight answers</span>
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
            <span className="counter"> · The book free, forever. The machine, membership.</span>
          </div>
        </div>
        <div className="cefr-badge">
          <div className="level">Full Arc</div>
          <div className="scope">Beginner → Advanced</div>
        </div>
        <a href="#book" className="free-note" style={{ textDecoration: 'none' }}>The book is free</a>
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
