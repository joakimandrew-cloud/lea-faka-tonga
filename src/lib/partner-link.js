import partners from '../data/partners.json'

// Partner attribution is retained for 60 days. All lesson access is free;
// optional support uses the general donation page.

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

/** Optional support never purchases access. Attribution is retained separately. */
export function supportUrl() {
  return DEFAULT_SUPPORT_URL
}

/** Forget the remembered partner. Exported for tests and manual clean-up. */
export function forgetPartner() {
  clearStored()
}
