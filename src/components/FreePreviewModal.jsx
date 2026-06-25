import { useEffect } from 'react'
import '../styles/free-preview-modal.css'

// The one pop-up that explains the model and leads to Buy Me a Coffee.
// Two framings (owner is choosing between them):
//   'plain'   — loss-aversion + price anchor ("this lesson is free, for now")
//   'reframe' — Sutherland: what you're ACTUALLY paying for isn't access (you
//               already have it free), it's keeping the site free for the
//               person who can't pay. No founders list, no scarcity cap.
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

export default function FreePreviewModal({ open, onClose, variant = 'reframe' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const isReframe = variant === 'reframe'
  return (
    <div className="fpp-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="fpp-title">
      <div className="fpp-card" onClick={(e) => e.stopPropagation()}>
        <button className="fpp-close" onClick={onClose} aria-label="Close">&times;</button>
        {isReframe ? <ReframeBody /> : <PlainBody />}
        <a className="fpp-cta" href={BMC_URL} target="_blank" rel="noopener noreferrer" onClick={onClose}>
          {isReframe ? 'Keep it open' : 'Support on Buy Me a Coffee'} <span aria-hidden="true">&rarr;</span>
        </a>
        <button className="fpp-dismiss" onClick={onClose}>Keep reading</button>
      </div>
    </div>
  )
}
