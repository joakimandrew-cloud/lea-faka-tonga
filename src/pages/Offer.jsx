import { useEffect } from 'react'
import { supportUrl } from '../lib/partner-link'

// ─────────────────────────────────────────────────────────────────────────
// /support is PARKED (2026-06-25). Per the owner's launch decision, support
// goes through Buy Me a Coffee, linked from the homepage Founding Supporter
// button — there is no on-site support page for now. This route redirects to
// BMC so any old internal links, bookmarks, or typed URLs land in the right
// place instead of a dead page.
//
// To restore the full Offer page later: recover this file's previous version
// from git history (the commit before 2026-06-25) and export it as default.
// ─────────────────────────────────────────────────────────────────────────
// The URL comes from src/lib/partner-link.js: the ordinary Buy Me a Coffee
// page, or a remembered partner's dedicated item. Same page, same copy.

export default function Offer() {
  const BMC_URL = supportUrl()
  useEffect(() => {
    window.location.replace(BMC_URL)
  }, [BMC_URL])
  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <p style={{ fontSize: '1.05rem', color: '#222' }}>
        Taking you to Buy Me a Coffee…{' '}
        <a href={BMC_URL} style={{ color: '#c1272d', fontWeight: 600 }}>Continue&nbsp;→</a>
      </p>
    </main>
  )
}
