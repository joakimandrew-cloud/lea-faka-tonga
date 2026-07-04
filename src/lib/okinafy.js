// Render-time fakauʻa normalization.
//
// book/ and the data extracted from it store the glottal stop as an ASCII
// apostrophe on purpose (DECISIONS.md 2026-06-20: storage stays ASCII, display
// layers normalize — the read-along pipeline already does this). This module
// is the website's version of that rule, extended site-wide 2026-07-03
// (site-analysis finding #3, approve-all):
//
//   apostrophe BEFORE A VOWEL  → real fakauʻa ʻ (U+02BB)
//   apostrophe before a consonant → left alone (English don't / it's / Sione's)
//
// Applied ONLY to designated Tongan surfaces (italic/em spans, inline code,
// table cells, Tongan data fields) — never to English narration prose, which
// legitimately quotes words in single quotes ('at' or 'in').

const APOSTROPHE_BEFORE_VOWEL = /['‘’ʼ`](?=[aeiouAEIOUāēīōūĀĒĪŌŪáéíóúÁÉÍÓÚ])/g

export function okinafy(text) {
  if (typeof text !== 'string' || !text) return text
  return text.replace(APOSTROPHE_BEFORE_VOWEL, 'ʻ')
}

// Deep variant for small data objects (e.g. the vocab rows attached to a
// "Words to Learn" table). Safe because the corpus has no consonant-final
// English word followed by '+vowel (verified 2026-07-03).
export function okinafyDeep(value) {
  if (typeof value === 'string') return okinafy(value)
  if (Array.isArray(value)) return value.map(okinafyDeep)
  if (value && typeof value === 'object') {
    const out = {}
    for (const k of Object.keys(value)) out[k] = okinafyDeep(value[k])
    return out
  }
  return value
}

// Loose "is this span Tongan?" test used to decide whether an italic span gets
// lang="to". The book's convention is italics = Tongan, but a few English
// run-in labels are italic too — any letter outside the Tongan alphabet
// (a e f g h i k l m n o p s t u v + fakauʻa + macrons/accents) vetoes it.
const NON_TONGAN_LETTER = /[bcdjqrwxyz]/i

export function looksTongan(text) {
  if (typeof text !== 'string' || !text.trim()) return false
  if (NON_TONGAN_LETTER.test(text)) return false
  return /[a-zāēīōūáéíóúʻ]/i.test(text)
}
