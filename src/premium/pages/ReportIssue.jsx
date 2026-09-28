import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTitle } from '../lib/title.js'
import '../styles/services.css'

const CONTACT_EMAIL = 'joakimandrew@gmail.com'
const CORRECTION_ENDPOINT = 'ce1f8abf-810e-4362-b811-710f307a78a1'

const EMPTY = { where: '', issue: '', fix: '', name: '', email: '', website: '' }

export default function ReportIssue() {
  useTitle('Report a problem')
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    const params = new URLSearchParams(location.search)
    return { ...EMPTY, where: location.state?.where || params.get('where') || '' }
  })
  const [sent, setSent] = useState(false)
  const [sentVia, setSentVia] = useState(null)
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const thanksRef = useRef(null)
  const errorRef = useRef(null)

  useEffect(() => {
    if (failed && errorRef.current) {
      errorRef.current.focus()
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [failed])

  useEffect(() => {
    if (sent && thanksRef.current) {
      thanksRef.current.focus()
      thanksRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [sent])

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
    if (form.website) return
    if (!form.issue.trim()) return

    if (CORRECTION_ENDPOINT) {
      const isKey = !/^https?:\/\//i.test(CORRECTION_ENDPOINT)
      const url = isKey ? 'https://api.web3forms.com/submit' : CORRECTION_ENDPOINT
      const fd = new FormData()
      if (isKey) fd.append('access_key', CORRECTION_ENDPOINT)
      fd.append('subject', 'Lea Faka-Tonga correction' + (form.where.trim() ? `: ${form.where.trim()}` : ''))
      fd.append('from_name', form.name.trim() || 'Anonymous reader')
      fd.append('name', form.name.trim())
      fd.append('email', form.email.trim())
      fd.append('where', form.where.trim())
      fd.append('issue', form.issue.trim())
      fd.append('suggested_fix', form.fix.trim())
      try {
        setSending(true)
        setFailed(false)
        const res = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data.success === false) throw new Error('submit rejected')
        setSentVia('endpoint')
        setSent(true)
      } catch {
        setFailed(true)
      } finally {
        setSending(false)
      }
      return
    }

    window.location.href = mailtoHref()
    setSentVia('mailto')
    setSent(true)
  }

  return (
    <div className="service-page service-report">
      <header className="service-hero">
        <div className="wrap service-hero-inner">
          <button
            type="button"
            className="service-back"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          >
            <span aria-hidden="true">←</span> Back
          </button>
          <p className="eyebrow">Better every month, with your help</p>
          <h1 className="display">See something off?<br /><span>Tell us.</span></h1>
          <p className="service-lead">
            This course is built and corrected in the open, so every report makes it more accurate for the
            next family. A typo, a wrong example, a rule that reads strangely, anything that seems off:
            tell us where it is and what you would change. It comes straight to us.
          </p>
        </div>
      </header>

      <div className="wrap service-body">
        <section className="service-panel" aria-labelledby="report-section-title">
          <header className="service-panel-head">
            <h2 id="report-section-title">Report a problem</h2>
            <span>Goes straight to us</span>
          </header>

          {!sent ? (
            <form className="report-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={update('website')}
                className="report-honeypot"
                aria-hidden="true"
              />

              <label className="report-field">
                <span className="report-label">Where is it? <em>optional</em></span>
                <input
                  type="text"
                  value={form.where}
                  onChange={update('where')}
                  placeholder="e.g. Lesson 12, the second drill, or the quiz on page 3"
                />
              </label>

              <label className="report-field">
                <span className="report-label">What is wrong? <em>required</em></span>
                <textarea
                  required
                  rows={4}
                  value={form.issue}
                  onChange={update('issue')}
                  placeholder="Describe what you believe is a mistake or problem."
                />
              </label>

              <label className="report-field">
                <span className="report-label">Your suggested fix <em>optional</em></span>
                <textarea
                  rows={3}
                  value={form.fix}
                  onChange={update('fix')}
                  placeholder="What should it say instead? How would you fix it?"
                />
              </label>

              <div className="report-row">
                <label className="report-field">
                  <span className="report-label">Your name <em>optional</em></span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={update('name')}
                    placeholder="So we can thank you"
                  />
                </label>
                <label className="report-field">
                  <span className="report-label">Your email <em>optional</em></span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="If you would like a reply"
                  />
                </label>
              </div>

              <p className="report-fineprint">
                Leave your name if you like, and contributors can be thanked on the <Link to="/keepers">Roll of Keepers</Link>.
              </p>

              {failed && (
                <div className="report-error" role="alert" tabIndex={-1} ref={errorRef}>
                  <p>We could not send that. Your text is still here. Try again, or open it in your mail app.</p>
                  <a href={mailtoHref()}>Open it in my mail app →</a>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? 'Sending…' : failed ? 'Try again →' : 'Send it to us →'}
              </button>
              <p className="report-fineprint">
                No account, no sign-in. Your report comes straight to us and we read every one. Your email,
                if you leave one, is only used to reply and never shared.
              </p>
            </form>
          ) : (
            <div className="report-thanks" role="status" aria-live="polite">
              <span className="report-thanks-mark" aria-hidden="true">ʻ</span>
              <h2 tabIndex={-1} ref={thanksRef}>Mālō ʻaupito.</h2>
              <p>
                {sentVia === 'endpoint'
                  ? <>We have your report and we will take a look. Every correction makes the course better for the next family, and contributors are thanked on the <Link to="/keepers">Roll of Keepers</Link>.</>
                  : <>Your email app should have opened with your report ready to send. Just press send to finish. If it did not open, write to us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will sort it.</>}
              </p>
              <div className="service-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setForm(EMPTY); setSent(false); setSentVia(null) }}
                >
                  Report another →
                </button>
                <Link to="/" className="btn btn-primary">Back to the course →</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
