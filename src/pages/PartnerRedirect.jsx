import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import partners from '../data/partners.json'
import { rememberPartner } from '../lib/partner-link'

// ─────────────────────────────────────────────────────────────────────────
// /r/:slug is the partner (affiliate) link. A promoter shares
// leafakatonga.org/r/<his-slug>; this page records the click, remembers the
// partner in this browser, and then sends the visitor to the FREE COURSE.
// Adding a partner is a data edit in src/data/partners.json, never a change
// here.
//
// Why the free course and not the payment page (changed 2026-08-17): the
// partner's posts promise a free Tongan course. Dropping his audience onto a
// checkout screen is a different thing from what they were promised, and it
// would cost him more credibility than the commission is worth. So the click
// lands on the homepage, and the partner is remembered for 60 days
// (src/lib/partner-link.js). Every support button on the site points at his
// dedicated Buy Me a Coffee item for as long as he is remembered, so whoever
// does decide to back the work is still provably his.
//
// The destination is the homepage rather than /lessons/1 because that is
// where the offer is explained, where the free book download sits, and where
// the support buttons that carry his attribution actually appear.
//
// Unknown slug: same landing, and nothing stored. A mistyped link in a
// partner's post must not dead-end, and nobody gets credited for it.
//
// Ships unlinked: no nav entry, no footer entry.
// ─────────────────────────────────────────────────────────────────────────

// Where a partner click lands. Internal, so it is an in-app navigation.
const LANDING_PATH = '/'

// Same endpoint as the tag in index.html. Used only as the cold-load fallback
// below, when count.js has not finished loading before we navigate away.
const GOATCOUNTER_ENDPOINT = 'https://leafakatonga.goatcounter.com/count'

const WAIT_FOR_COUNTER_MS = 600 // give async count.js this long to arrive
const POLL_MS = 40
const BEACON_GRACE_MS = 200 // let count.js fire its request before we leave
const PIXEL_TIMEOUT_MS = 500 // hard cap on the fallback pixel

export default function PartnerRedirect() {
  const { slug } = useParams()
  const navigate = useNavigate()
  // One click, one count. React StrictMode runs the effect twice in dev; this
  // keeps the second pass from double-counting while still letting it redirect.
  const counted = useRef(false)

  const key = (slug || '').trim().toLowerCase()
  const partner = Object.prototype.hasOwnProperty.call(partners, key) ? partners[key] : null

  useEffect(() => {
    let cancelled = false
    let waited = 0

    // Store the partner first and synchronously, so the homepage we are about
    // to navigate to already reads him on its very first render. An unknown
    // slug stores nothing.
    if (partner) rememberPartner(key)

    const eventPath = partner ? `partner-link-${key}` : `partner-link-unknown-${key || 'blank'}`
    const eventTitle = partner
      ? `Partner link: ${partner.name}`
      : `Partner link: unknown slug (${key || 'blank'})`

    // replace: true, so the redirect never sits in the back-button history and
    // traps the visitor in a bounce loop.
    const go = () => {
      if (cancelled) return
      navigate(LANDING_PATH, { replace: true })
    }

    // Fallback for the cold load: request GoatCounter's documented pixel
    // endpoint ourselves, so a click still registers even if count.js never
    // arrived. We leave as soon as the request settles, so the count has
    // genuinely reached the server before the browser navigates away.
    const firePixel = () => {
      let done = false
      const finish = () => {
        if (done) return
        done = true
        go()
      }
      try {
        const params = new URLSearchParams({ p: eventPath, t: eventTitle, e: 'true' })
        if (document.referrer) params.set('r', document.referrer)
        const img = new Image()
        img.onload = finish
        img.onerror = finish
        counted.current = true
        img.src = `${GOATCOUNTER_ENDPOINT}?${params.toString()}`
      } catch {
        finish()
        return
      }
      setTimeout(finish, PIXEL_TIMEOUT_MS)
    }

    // Preferred path: the same mechanism RouteChrome uses for SPA navigations,
    // window.goatcounter.count, marked event:true so partner clicks sit in the
    // events table rather than inflating page views.
    const tick = () => {
      if (cancelled) return
      if (counted.current) {
        // A previous pass already sent it; just leave.
        setTimeout(go, BEACON_GRACE_MS)
        return
      }
      const count = window.goatcounter && window.goatcounter.count
      if (typeof count === 'function') {
        counted.current = true
        try {
          count({ path: eventPath, title: eventTitle, event: true })
        } catch {
          // A counter that throws must never hold up the redirect.
        }
        setTimeout(go, BEACON_GRACE_MS)
        return
      }
      waited += POLL_MS
      if (waited >= WAIT_FOR_COUNTER_MS) {
        firePixel()
        return
      }
      setTimeout(tick, POLL_MS)
    }

    tick()
    return () => {
      cancelled = true
    }
  }, [key, navigate, partner])

  const message = 'Taking you to Lea Faka-Tonga…'
  const href = LANDING_PATH

  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <p style={{ fontSize: '1.05rem', color: '#222' }}>
        {message}{' '}
        <a href={href} style={{ color: '#c1272d', fontWeight: 600 }}>Continue&nbsp;→</a>
      </p>
    </main>
  )
}
