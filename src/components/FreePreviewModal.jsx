import { useEffect } from 'react'
import '../styles/free-preview-modal.css'

// The one pop-up that explains the model and leads to Buy Me a Coffee.
// Three framings (owner is choosing between them):
//   'plain'    — loss-aversion + price anchor ("this lesson is free, for now")
//   'reframe'  — Sutherland: what you're ACTUALLY paying for isn't access (you
//                already have it free), it's keeping the site free for someone else.
//   'location' — the /ideate winner ("Not a pitch, a location"): the person on the
//                other end appears AS a UI element (a concrete diaspora community,
//                not a named individual) right above the button, so the $35 reads
//                as delivery to someone else, not access you already have.
// Stateless: the host (a lesson page) decides WHEN to open it; this just renders.
const BMC_URL = 'https://buymeacoffee.com/leafakatonga'

function PlainBody() {
  return (
    <>
      <span className="fpp-eyebrow">Free preview</span>
      <h2 className="fpp-title" id="fpp-title">This lesson is free, for now.</h2>
      <div className="fpp-body">
        <p>The <strong>book</strong> is yours free, forever: the whole course as a PDF or EPUB, no signup, no catch.</p>
        <p>The <strong>website</strong> is free while we build it, then it becomes members-only. We&rsquo;re recording <strong>native speakers</strong> for every example next, so your Tongan family and friends actually understand you when you speak, pronounced the way it&rsquo;s meant to be.</p>
        <p>Schools pay <strong>$2,500 to $25,000</strong> to license this. Give over <strong>$35</strong> now and the site stays <strong>free for you, for life</strong>, even after the wall goes up.</p>
      </div>
    </>
  )
}

function ReframeBody() {
  return (
    <>
      <span className="fpp-eyebrow">Free preview</span>
      <h2 className="fpp-title" id="fpp-title">Would it be crazy to keep this free?</h2>
      <div className="fpp-body">
        <p>It&rsquo;s all free right now. Soon the website won&rsquo;t be.</p>
        <p>Pay <strong>$35</strong> once and it stays free for you, for life. You also keep it here for the next person who needs it:</p>
        <p>the kid in New Zealand whose parents never spoke it, and the adult in California who wants a real conversation on their first trip to Tonga.</p>
      </div>
    </>
  )
}

function LocationBody() {
  return (
    <>
      <span className="fpp-eyebrow">Free preview</span>
      <h2 className="fpp-title" id="fpp-title">Keep it free for the next person.</h2>
      <div className="fpp-body">
        <p>It&rsquo;s all free right now: the <strong>book</strong> is yours forever, the <strong>website</strong> free while we build it. Soon the site won&rsquo;t be.</p>
        <p>Pay <strong>$35</strong> once and it stays free for <strong>you</strong>, for life, and you keep it open for someone you&rsquo;ll never meet:</p>
      </div>
    </>
  )
}

// The beneficiary, rendered AS a UI element (the 'location' winner) — a concrete
// diaspora community, never a fabricated named person.
function Beneficiary() {
  return (
    <div className="fpp-beneficiary">
      <svg className="fpp-pin" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="#c24a1f" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
      </svg>
      <p>Somewhere in South Auckland, a Tongan family is looking for exactly this.</p>
    </div>
  )
}

export default function FreePreviewModal({ open, onClose, variant = 'location' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const Body = variant === 'plain' ? PlainBody : variant === 'reframe' ? ReframeBody : LocationBody
  const ctaLabel = variant === 'plain' ? 'Support on Buy Me a Coffee' : 'Keep it open'
  return (
    <div className="fpp-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="fpp-title">
      <div className="fpp-card" onClick={(e) => e.stopPropagation()}>
        <button className="fpp-close" onClick={onClose} aria-label="Close">&times;</button>
        <Body />
        {variant === 'location' && <Beneficiary />}
        <a className="fpp-cta" href={BMC_URL} target="_blank" rel="noopener noreferrer" onClick={onClose}>
          {ctaLabel} <span aria-hidden="true">&rarr;</span>
        </a>
        <button className="fpp-dismiss" onClick={onClose}>Keep reading</button>
      </div>
    </div>
  )
}
