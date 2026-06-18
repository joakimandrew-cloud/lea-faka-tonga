import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'
import '../styles/v11-components.css'
import '../styles/offer.css'

// ─────────────────────────────────────────────────────────────────────────
// "Spot a mistake? Tell us" — a report-a-problem form. Static site, no
// backend (honors DECISIONS.md D7: no accounts, no PII stored on-site).
//
// Delivery is built to work the instant it ships, with a one-line upgrade:
//   • CORRECTION_ENDPOINT empty (default): submit hands a pre-filled email to
//     the visitor's mail app, addressed to CONTACT_EMAIL. No third party.
//   • CORRECTION_ENDPOINT set: the form POSTs in-page instead (a true
//     one-click send). A bare key (no "http") is treated as a Web3Forms
//     access key; a URL is treated as a direct POST endpoint (Formspree /
//     Formsubmit). Mirrors the emailAction pattern in Offer.jsx.
// ─────────────────────────────────────────────────────────────────────────
const CONTACT_EMAIL = 'andrew@montedesign.com'
const CORRECTION_ENDPOINT = 'ce1f8abf-810e-4362-b811-710f307a78a1' // Web3Forms access key (public by design; delivers to the hidden inbox)

const EMPTY = { where: '', issue: '', fix: '', name: '', email: '', website: '' }

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

export default function ReportIssue() {
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const mailtoHref = () => {
    const body = [
      `Where is it: ${form.where.trim() || '(not given)'}`,
      '',
      "What's wrong:",
      form.issue.trim(),
      '',
      'Suggested fix:',
      form.fix.trim() || '(none given)',
      '',
      `From: ${form.name.trim() || '(anonymous)'}${form.email.trim() ? ` <${form.email.trim()}>` : ''}`,
    ].join('\n')
    const subject = 'Lea Faka-Tonga correction' + (form.where.trim() ? `: ${form.where.trim()}` : '')
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.website) return            // honeypot: silently drop bots
    if (!form.issue.trim()) return      // required

    if (CORRECTION_ENDPOINT) {
      const isKey = !/^https?:\/\//i.test(CORRECTION_ENDPOINT)
      const url = isKey ? 'https://api.web3forms.com/submit' : CORRECTION_ENDPOINT
      const payload = {
        ...(isKey ? { access_key: CORRECTION_ENDPOINT } : {}),
        subject: 'Lea Faka-Tonga correction' + (form.where.trim() ? `: ${form.where.trim()}` : ''),
        from_name: form.name.trim() || 'Anonymous reader',
        name: form.name.trim(),
        email: form.email.trim(),
        where: form.where.trim(),
        issue: form.issue.trim(),
        suggested_fix: form.fix.trim(),
      }
      try {
        setSending(true)
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
        setSent(true)
      } catch {
        window.location.href = mailtoHref() // fall back to the visitor's mail app
        setSent(true)
      } finally {
        setSending(false)
      }
      return
    }

    // Default path: open a pre-filled email in the visitor's mail app.
    window.location.href = mailtoHref()
    setSent(true)
  }

  return (
    <div className="v11-landing offer-page">

      {/* ── Top band ── */}
      <div className="top-band">
        <Link to="/" className="top-brand" style={{ textDecoration: 'none' }}>
          <Logo />
          <span className="wordmark">Lea Faka-Tonga</span>
        </Link>
        <div className="top-sub">Spot a mistake? Tell us · the course is corrected in the open</div>
      </div>

      {/* ── Hero ── */}
      <section className="offer-hero">
        <span className="offer-eyebrow">Better every month, with your help</span>
        <h1 className="offer-headline">
          See something off?<br /><span className="accent">Tell us.</span>
        </h1>
        <p className="offer-lede">
          This course is built and corrected in the open, so every report makes it more accurate for the
          next family. A typo, a wrong example, a rule that reads strangely, anything that seems off:
          tell us where it is and what you would change. It comes straight to us.
        </p>
      </section>

      {/* ── The form ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="offer-sec-bar">
            <span>§ Report a problem</span>
            <span className="right">Goes straight to us</span>
          </div>

          {!sent ? (
            <form className="report-form" onSubmit={handleSubmit}>
              {/* honeypot, hidden from people */}
              <input
                type="text" name="website" tabIndex={-1} autoComplete="off"
                value={form.website} onChange={update('website')}
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                aria-hidden="true"
              />

              <label className="report-field">
                <span className="report-label">Where is it? <em>optional</em></span>
                <input
                  type="text" value={form.where} onChange={update('where')}
                  placeholder="e.g. Chapter 12, the second drill, or the quiz on page 3"
                />
              </label>

              <label className="report-field">
                <span className="report-label">What is wrong? <em>required</em></span>
                <textarea
                  required rows={4} value={form.issue} onChange={update('issue')}
                  placeholder="Describe what you believe is a mistake or problem."
                />
              </label>

              <label className="report-field">
                <span className="report-label">Your suggested fix <em>optional</em></span>
                <textarea
                  rows={3} value={form.fix} onChange={update('fix')}
                  placeholder="What should it say instead? How would you fix it?"
                />
              </label>

              <div className="report-row">
                <label className="report-field">
                  <span className="report-label">Your name <em>optional</em></span>
                  <input
                    type="text" value={form.name} onChange={update('name')}
                    placeholder="So we can thank you"
                  />
                </label>
                <label className="report-field">
                  <span className="report-label">Your email <em>optional</em></span>
                  <input
                    type="email" value={form.email} onChange={update('email')}
                    placeholder="If you would like a reply"
                  />
                </label>
              </div>

              <button type="submit" className="cta-btn" disabled={sending}>
                {sending ? 'Sending…' : 'Send it to us →'}
              </button>
              <p className="report-fineprint">
                No account, no sign-in. Your report goes straight to us by email.
              </p>
            </form>
          ) : (
            <div className="report-thanks">
              <span className="report-thanks-mark">ʻ</span>
              <h2 className="report-thanks-title">Mālō ʻaupito.</h2>
              <p className="report-thanks-body">
                {CORRECTION_ENDPOINT
                  ? <>We have your report and we will take a look. Every correction makes the course better for the next family.</>
                  : <>Your email app should have opened with your report ready to send. Just hit send. If it did not, write to us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will sort it.</>}
              </p>
              <div className="offer-keepers-link">
                <button
                  type="button" className="cta-secondary"
                  onClick={() => { setForm(EMPTY); setSent(false) }}
                >
                  Report another →
                </button>
                <Link to="/" className="cta-secondary">Back to the course →</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Colophon ── */}
      <div className="offer-sec">
        <div className="panel-frame">
          <div className="colophon">
            <div><strong>Lea Faka-Tonga</strong> · Corrected in the open · Thank you for helping</div>
            <Link to="/" style={{ color: 'var(--red)', textDecoration: 'none' }}>← Back to the course</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
