import partners from '../data/partners.json'

// ─────────────────────────────────────────────────────────────────────────
// Which Buy Me a Coffee URL do the site's support buttons point at?
//
// Normally: the one shop page everybody sees, DEFAULT_SUPPORT_URL.
//
// After a visitor arrives through a partner link (/r/<slug>, see
// src/pages/PartnerRedirect.jsx), that partner's slug is remembered in this
// browser for PARTNER_TTL_DAYS days, and every support button points at his
// dedicated Buy Me a Coffee item instead. Buy Me a Coffee records which item
// was bought, so a sale through that item is his by definition. Nothing else
// on the site changes: same copy, same buttons, same price.
//
// Rules this module holds to, because it runs on every render of the
// homepage and cannot be allowed to break a page:
//   1. It never throws. Any failure falls back to DEFAULT_SUPPORT_URL.
//   2. localStorage may be missing or blocked (private browsing, an embedded
//      webview, a locked-down browser). Every access is wrapped.
//   3. A partner older than the window is ignored AND cleared.
//   4. A slug that is no longer in partners.json is treated as no partner,
//      and cleared, so retiring a partner is a data edit in that file.
// ─────────────────────────────────────────────────────────────────────────

export const DEFAULT_SUPPORT_URL = 'https://buymeacoffee.com/leafakatonga'

// One key, one JSON value: { slug, ts }. Namespaced so it cannot collide with
// the app's other stored state.
export const PARTNER_STORAGE_KEY = 'lft:partner'

// The attribution window, and it is the same 60 days the partner terms state.
// Change both together or the site and the deal disagree.
export const PARTNER_TTL_DAYS = 60
const PARTNER_TTL_MS = PARTNER_TTL_DAYS * 24 * 60 * 60 * 1000

function storage() {
  try {
    return window.localStorage || null
  } catch {
    // Accessing localStorage itself throws when storage is blocked.
    return null
  }
}

function clearStored() {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(PARTNER_STORAGE_KEY)
  } catch {
    // Nothing to do: an unwritable store is already "not remembering".
  }
}

function lookup(slug) {
  if (typeof slug !== 'string') return null
  const key = slug.trim().toLowerCase()
  if (!key) return null
  if (!Object.prototype.hasOwnProperty.call(partners, key)) return null
  const record = partners[key]
  if (!record || typeof record.destination !== 'string' || !record.destination) return null
  return { slug: key, ...record }
}

/**
 * Remember a partner in this browser. Called once, by the /r/<slug> redirect.
 * Returns true if the slug is a live partner and was stored.
 */
export function rememberPartner(slug) {
  const partner = lookup(slug)
  if (!partner) return false
  const store = storage()
  if (!store) return false
  try {
    store.setItem(PARTNER_STORAGE_KEY, JSON.stringify({ slug: partner.slug, ts: Date.now() }))
    return true
  } catch {
    // A full or read-only store means no attribution in this browser. The
    // visitor still gets the free course, which is the part that matters.
    return false
  }
}

/**
 * The partner remembered in this browser, or null. Expired or unknown slugs
 * are cleared on the way out, so a stale value never lingers.
 * Returns { slug, name, destination, storedAt } when live.
 */
export function readPartner() {
  const store = storage()
  if (!store) return null

  let raw = null
  try {
    raw = store.getItem(PARTNER_STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let parsed = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    clearStored()
    return null
  }
  if (!parsed || typeof parsed !== 'object') {
    clearStored()
    return null
  }

  const ts = Number(parsed.ts)
  if (!Number.isFinite(ts) || ts <= 0) {
    clearStored()
    return null
  }
  // A clock that has moved backwards (or a hand-edited value from the future)
  // should not grant an unlimited window, so the age is taken absolutely.
  if (Math.abs(Date.now() - ts) > PARTNER_TTL_MS) {
    clearStored()
    return null
  }

  const partner = lookup(parsed.slug)
  if (!partner) {
    clearStored()
    return null
  }

  return { ...partner, storedAt: ts }
}

/**
 * The Buy Me a Coffee URL every support button on the site should use.
 * The remembered partner's dedicated item when one is live, otherwise the
 * ordinary page. Never throws.
 */
export function supportUrl() {
  try {
    const partner = readPartner()
    return partner ? partner.destination : DEFAULT_SUPPORT_URL
  } catch {
    return DEFAULT_SUPPORT_URL
  }
}

/** Forget the remembered partner. Exported for tests and manual clean-up. */
export function forgetPartner() {
  clearStored()
}
