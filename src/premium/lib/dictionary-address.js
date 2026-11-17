// Where the dictionary's search lives in the address (plan 2026-11-18-
// dictionary-search-and-word-pages): in the fragment, the part after #.
//
//   /dictionary#q=faifekau      a search
//   /dictionary#letter=ng       a letter of the browse
//
// Why the fragment and never the query string. The site's analytics script
// (GoatCounter's count.js, loaded in index.html) sends `q: location.search`
// with every count, and builds the counted path from `pathname + search`. A
// search kept in ?q= would send what a visitor typed to an outside service on
// every first load or reload of a search address. A browser never sends the
// fragment to any server, and count.js does not read it. So nothing here reads
// or writes location.search: an old-style ?q= or ?letter= address is ignored.
//
// Pure: no React and no window, so a test can import it.

// The search and the letter held by a fragment. Anything else (an ordinary
// in-page anchor such as #parts-of-body, an unknown letter) is neither.
export function readSearchAddress(hash, letters = []) {
  const text = String(hash || '').replace(/^#/, '')
  if (!text.includes('=')) return { q: '', letter: '' }
  const params = new URLSearchParams(text)
  const q = params.get('q') || ''
  const letter = !q.trim() && letters.includes(params.get('letter')) ? params.get('letter') : ''
  return { q, letter }
}

// The fragment for a search or a letter, with its #, or '' for neither.
export function searchAddressHash(query, letter = '') {
  const params = new URLSearchParams()
  if (String(query || '').trim()) params.set('q', query)
  else if (letter) params.set('letter', letter)
  const text = params.toString()
  return text ? `#${text}` : ''
}

// A link that opens the dictionary on a search.
export function searchAddress(query) {
  return `/dictionary${searchAddressHash(query)}`
}
