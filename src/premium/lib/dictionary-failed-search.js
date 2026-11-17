// Counting searches that find nothing (DECISIONS.md 2026-11-18, point 5).
//
// When a search on /dictionary has settled and found nothing at all (no match,
// no partial, no longer entry, no near spelling), one event goes to the
// GoatCounter the site already runs, so missing words can be added:
//
//   goatcounter.count({ path: 'dictionary-search-none/<text>', title: <fixed>, event: true })
//
// <text> is what was typed, lowercased and trimmed. It is sent only when it
// passes the filter below, at most once for a given text until the site is
// loaded again, never when the search found anything, and never when counting
// is off (the script is absent, or the visitor has switched it off).
//
// The search text itself stays in the fragment of the address
// (dictionary-address.js). This file is the only place that hands typed text
// to the counter, and it refuses to when the address carries a query string,
// so an event never travels with one.
//
// Pure apart from countFailedSearch, which takes the window it acts on.

export const FAILED_SEARCH_EVENT = 'dictionary-search-none'
export const FAILED_SEARCH_TITLE = 'Dictionary search that found nothing'
// How long the box must be still before a search counts as settled.
export const FAILED_SEARCH_SETTLE_MS = 1500
export const FAILED_SEARCH_MIN_LENGTH = 2
export const FAILED_SEARCH_MAX_LENGTH = 40
// The sentence beside the search box. Site copy.
export const FAILED_SEARCH_NOTICE = 'When a search finds nothing, what you typed is counted, with no name and no cookie, so that missing words can be added.'

// Letters (any, with their macrons and accents), combining marks, spaces,
// hyphens, and the apostrophe and fakauʻa characters. Nothing else.
const ALLOWED = /^[\p{L}\p{M} \-'‘’ʼ`ʻ]+$/u
const DIGIT_OR_AT = /[\p{N}@]/u
const A_LETTER = /[\p{Ll}\p{Lo}]/u

// The text an event may carry, or '' when the typed text must not be sent:
// 2 to 40 characters, only the characters above, no digit and no @ sign.
export function failedSearchText(typed) {
  const text = String(typed == null ? '' : typed).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
  const length = [...text].length
  if (length < FAILED_SEARCH_MIN_LENGTH || length > FAILED_SEARCH_MAX_LENGTH) return ''
  if (DIGIT_OR_AT.test(text) || !ALLOWED.test(text) || !A_LETTER.test(text)) return ''
  return text
}

// True when a search (the answer of searchDictionaryDetailed) found nothing at all.
export function foundNothing(found) {
  return Boolean(found && found.query)
    && found.matches.length === 0
    && found.partial.length === 0
    && found.containing.length === 0
    && found.suggestions.length === 0
}

// The event for a settled search, or null when none may be sent.
export function failedSearchEvent(typed, found) {
  if (!foundNothing(found)) return null
  const text = failedSearchText(typed)
  return text ? { path: `${FAILED_SEARCH_EVENT}/${text}`, title: FAILED_SEARCH_TITLE, event: true } : null
}

// Texts already sent since the site was loaded.
const SENT = new Set()

// Sends the event for a settled search, once. Returns true when it was sent.
export function countFailedSearch(typed, found, { win = globalThis.window, sent = SENT } = {}) {
  const event = failedSearchEvent(typed, found)
  if (!event || sent.has(event.path) || !win) return false
  const counter = win.goatcounter
  if (!counter || typeof counter.count !== 'function') return false
  try {
    // A hand-made address with a query string: the script would send it along.
    if (win.location && win.location.search) return false
    // Counting switched off in this browser, or refused by the script's own filter.
    if (win.localStorage && win.localStorage.getItem('skipgc') === 't') return false
    if (typeof counter.filter === 'function' && counter.filter()) return false
  } catch {
    return false
  }
  sent.add(event.path)
  counter.count(event)
  return true
}
