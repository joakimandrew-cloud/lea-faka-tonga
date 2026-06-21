import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'
import '../styles/v11-components.css'
import '../styles/offer.css'

// ─────────────────────────────────────────────────────────────────────────
// Model (softened 2026-06-17, DECISIONS.md): the BOOK is free (PDF/EPUB,
// whole, forever) and the ENTIRE website reads open, no paywall. Income is
// patronage: a Gumroad pay-what-you-want ($0+) "Founding Supporter" product
// ($25+ locks lifetime access if the site is ever gated later) + Buy Me a
// Coffee. No on-site accounts EVER; grandfathering tracked by email.
//
// Swap-in links. Until the Gumroad product / email endpoint are live these
// point at safe fallbacks (the email form captures intent with no backend).
// Replace in ONE place (LINKS) when they are set up.
// ─────────────────────────────────────────────────────────────────────────
const LINKS = {
  foundingSupporter: '#notify', // TODO: Gumroad "Founding Supporter" pay-what-you-want ($0+) URL
  bookPdf: `${import.meta.env.BASE_URL}downloads/Lea-Faka-Tonga.pdf`,   // the complete book, free
  bookEpub: `${import.meta.env.BASE_URL}downloads/Lea-Faka-Tonga.epub`, // the complete book, free
  bundle: '#notify',           // TODO: Payhip/Gumroad Heirloom Bundle checkout
  donor: 'mailto:andrew@montedesign.com?subject=Tauhi%20Fonua',
  institutional: 'mailto:andrew@montedesign.com?subject=Tongan%20course%20licensing',
  correction: 'mailto:andrew@montedesign.com?subject=Lea%20Faka-Tonga%20correction',
  emailAction: '',             // TODO: Buttondown/Formspree POST endpoint; empty = local thank-you
}

// Honest founding counter. Bump `claimed` as real supporters join, never fake it.
const FOUNDERS = { claimed: 0, cap: 250 }

// The course contents — proof of substance. Everything below is free and open.
const STACK = [
  { title: 'The Grammar Book', detail: '52 lessons · 110,651 words · beginner → advanced', badge: 'FREE · PDF + EPUB below',
    blurb: 'From your first three-word sentence to real conversations. The complete arc, every rule explained, yours to download, whole, forever.' },
  { title: 'The Interactive Practice Machine', detail: '62 drills · 4 builders · embedded exercises, every lesson', badge: 'Free · open',
    blurb: 'Build real Tongan sentences and watch the translation update as you go. The whole grammar, playable.' },
  { title: 'The Quiz Bank', detail: '520 questions · every answer explained', badge: 'Free · open',
    blurb: 'Every wrong answer names the rule it broke, and every right answer shows why the others missed.' },
  { title: 'The Flip-Card Deck', detail: '649 cards · filter by tier and category', badge: 'Free · open',
    blurb: 'Build your vocabulary one card at a time, keyboard-fast and phone-friendly.' },
  { title: 'The Workbook', detail: '218,636 words · 283 exercises · full answer keys', badge: 'Free · open',
    blurb: 'Twice the length of the book. Practice for every pattern, lesson by lesson.' },
  { title: 'The Video Course', detail: '~9 hours · 52 segments', badge: 'In production · free',
    blurb: 'The full course, narrated, lesson by lesson. Shared as it ships.' },
  { title: 'Charts & Real-Text Archive', detail: 'Reference charts + authentic Tongan documents', badge: 'Free · open',
    blurb: 'Quick-lookup charts for everyone. Real Tongan texts to read once you are ready for the wild.' },
]

// What your support pays for — one line per goal. The site itself is already free.
const MEMBER_STACK = [
  { name: 'Fixing the mistakes', value: 'ongoing', note: 'a course still being polished, corrected in the open; every report makes it better' },
  { name: 'Elder Voices, native-speaker audio', value: 'the big one', note: 'recording every example so you never mispronounce a word to your elders' },
  { name: 'Keeping it free and online', value: 'forever', note: 'no ads, no investors, no selling your attention; hosting and tools cost real money' },
  { name: 'The course on your phone', value: 'next', note: 'installable and offline-ready, the whole course in your pocket' },
  { name: 'The video course, ~9 hours', value: 'in production', note: '52 segments, narrated, lesson by lesson' },
  { name: 'Your name on the Roll of Keepers', value: 'standing', note: 'support keeps the language alive, and says so, in your own community' },
]

// Three ways to take part. Everything on the site is free; these are how you
// help, or just take the book, or give big. Only the supporter link needs wiring.
const TIERS = [
  { name: 'Founding Supporter', price: '$0+', per: 'name your price · $25+ locks lifetime', featured: true, active: true,
    confers: 'Fund the work; lock lifetime access',
    perks: ['Give whatever it’s worth to you, even nothing', '$25+ = access locked for life, free, if the site is ever gated', 'Your name on the Roll of Keepers'],
    href: LINKS.foundingSupporter, cta: 'Become a Founding Supporter' },
  { name: 'Just the book', price: 'Free', per: 'PDF + EPUB · forever', active: true,
    confers: 'The whole course in book form',
    perks: ['All 52 lessons, every rule explained', 'No email wall, no catch', 'Yours to print and send to your cousins'],
    href: '#book', cta: 'Download the book' },
  { name: 'Tauhi Fonua', price: '$1,000+', per: 'one gift · permanent', active: true,
    confers: 'For the family that wants to do more',
    perks: ['Your family’s name in every printed copy', 'A dedication line you write', 'Top of the Roll of Keepers'],
    href: LINKS.donor, cta: 'Talk to us' },
]

const FAQ = [
  { q: 'So what’s actually free?',
    a: 'Everything. The whole book, all 52 lessons, as PDF and EPUB, free forever, no email wall. And the entire website: every lesson, every drill, every flip card and quiz, open to anyone. There is no paywall.' },
  { q: 'Why ask for money at all?',
    a: 'Because this stays alive on support instead of ads. No banners, no investors, no selling your attention or your data. Fixing the mistakes, recording native speakers, building the tools, keeping it online: that costs real money. Supporters carry it, their names go on the Roll of Keepers, and it stays free for everyone, forever.' },
  { q: 'What does “$25 locks lifetime access” mean if it’s all free now?',
    a: 'It’s a promise for later. Right now nothing is walled, so $25 buys you no special access today. But if the site ever does add a paid members area, anyone who gave $25 or more during the founding window keeps full access for life, free, no questions. We keep your spot by your email, so you can never lose it.' },
  { q: 'Do I need an account?',
    a: 'No, and you never will. There are no logins here. If you choose to support, you do it at our checkout partner; there is nothing to sign into, and nothing of yours for anyone to store or breach.' },
  { q: 'Does it really go all the way to advanced?',
    a: 'Yes. From “I ate” to real conversations, across 52 lessons, beginner to advanced. No other Tongan course finishes the arc; most never leave the tourist phrasebook.' },
  { q: 'I can’t afford anything.',
    a: 'Then take it all for free, that’s the whole point. The book is yours, the website is open, nothing is held back. Give nothing, or give $0 at the supporter link just to join the founders list. Tauhi ʻa e lea, keep the language.' },
  { q: 'I found a mistake.',
    a: 'Good, tell us. The site is built in the open and still being polished, and every correction makes it better for the next family. There is a “Spot a mistake? Tell us” page with a short form for exactly this: where it is, what is wrong, and how you would fix it. The link is on the support card just below, and it comes straight to us.' },
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
          Speak <span className="accent">Tongan</span>.<br />All of it.
        </h1>
        <p className="offer-lede">
          From your very first sentence to real conversations: 52 lessons, beginner to advanced,
          the only complete, modern course for a language that has almost nothing online.
          <strong> The whole book is free to download, forever, and the entire website is open.
          If it helps you, help keep it going, and growing.</strong>
        </p>
        <div className="offer-hero-cta">
          <a href="#join" className="cta-btn">Become a Founding Supporter <span style={{ marginLeft: 8 }}>→</span></a>
          <a href="#book" className="cta-secondary">Download the book, free</a>
          <Link to="/lessons/1" className="cta-secondary">Start Lesson 01, free</Link>
        </div>
        <p className="offer-hero-meta">Every lesson open · No ads · No streaks · No accounts, ever</p>
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
              <span className="orf-label">The complete book, all 52 lessons, costs</span>
              <span className="orf-big free">Nothing</span>
            </div>
          </div>
          <p className="orf-line">
            The language is not ours to sell, so the book never costs a cent, and the website is open to
            everyone. What your support pays for is the <strong>work</strong>: fixing the mistakes, recording
            the native-speaker audio, keeping it all free. Name your price. <strong>$25 or more locks lifetime access.</strong>
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
                Every lesson, every rule, every example: 110,651 words, all the way to real
                conversations. Download it, print it, send it to your cousins. It is the
                whole course in book form, and it will never cost anything. Judge us by it first;
                support it only if it helps you.
              </p>
              <p className="oin-sub">The entire website is open too (prose, drills, cards and quizzes, every lesson), so you can feel the whole thing working before you give a cent.</p>
            </div>
            <div className="oin-card">
              <span className="oin-range">600+ pages</span>
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
            <span className="right">The book free · the website open</span>
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
              ['The whole language, in order', 'One grammar, built one slot per lesson, beginner to advanced. Nothing skipped, nothing stranded: the arc no other Tongan resource finishes.'],
              ['The writing system, done right', 'The fakauʻa and the toloi, the definitive accent, set in a font built for the Pacific. The detail that tells your elders we did our homework.'],
              ['Funded by the people who use it', 'No banners, no data harvesting, no accounts to breach. Support, not ads, is why this exists and stays independent.'],
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

      {/* ── § Support the work (the offer) ── */}
      <div className="offer-sec" id="join">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ 04 · Support the work</span>
            <span className="right">Free for all · funded by those who can</span>
          </div>

          {/* honest founding counter */}
          <div className="offer-counter">
            <div className="ocnt-text">
              {FOUNDERS.claimed === 0
                ? <>The founding window is open. The first <strong>{FOUNDERS.cap}</strong> supporters who give <strong>$25 or more</strong> lock <strong>lifetime access</strong>, with their names on the Roll of Keepers.</>
                : <><strong>{FOUNDERS.claimed} of {FOUNDERS.cap}</strong> founding supporters · {spotsLeft} lifetime places left.</>}
            </div>
            <div className="ocnt-bar"><span style={{ width: `${Math.max(2, (FOUNDERS.claimed / FOUNDERS.cap) * 100)}%` }} /></div>
            <div className="ocnt-note">Checkout opens shortly. Leave your email below and the supporter link reaches you first. The lifetime lock is for the founding window only.</div>
          </div>

          <p className="offer-join-lede">
            Plainly: the book is free because the language is not ours to sell, and the website is open
            because a half-finished course should not hide behind a wall. So there is no paywall, and there
            may never be one. If Lea Faka-Tonga is worth something to you, name your price and help it grow:
            fix the mistakes, record the native-speaker audio, keep it free for every family that needs it.
          </p>

          {/* what your support funds */}
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
              <span className="obn-name">All of it, carried by supporters</span>
              <span className="obn-value">name your price</span>
            </div>
          </div>

          {/* tiers */}
          <div className="offer-tiers">
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
            <Link to="/report" className="cta-secondary">Spot a mistake? Tell us →</Link>
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
              { title: 'Elder Voices', sub: 'Every example, spoken by a native voice', price: '$39', note: 'In production · free for everyone', soon: true },
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
          If you support this and feel it wasn’t worth it, email us and we’ll refund every cent, no quibble,
          and the book and the site are yours either way; they always were. And if a rule ever stumps you,
          ask, and we’ll explain it until it clicks. The point was never to take your money; it’s that the
          language outlives all of us.
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
              Leave your email and the supporter link reaches you the moment it’s live; give $25 or more in
              the founding window and your access is locked for life. Not sure yet? Take the 60-second test:{' '}
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
              I’m a fluent speaker and can help review lessons
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
            52 Lessons · Full Grammar Arc · Reviewed in the open
            <span className="counter"> · The book free, forever. The website, open to all.</span>
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
