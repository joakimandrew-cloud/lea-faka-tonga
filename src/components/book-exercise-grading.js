// ---------------------------------------------------------------------------
// Pure grading helpers for the interactive Book Exercises (fill-blank and
// transform type-and-check). Extracted from BookExercises.jsx so the semantics
// can be unit-tested without rendering.
//
// Semantics (owner ruling 2026-06-13, DECISIONS.md): ʻokina is PHONEMIC — it is
// kept (only unified across apostrophe variants), so "ʻalu" ≠ "alu". Accents
// are LENIENT — combining diacritics are stripped, so "naʻá" === "na'a".
// Markdown emphasis, case, and outer punctuation are ignored.
// ---------------------------------------------------------------------------

// Answer normalization — tolerate apostrophe variants, markdown, and case.
export function normalize(s) {
  if (!s) return ''
  return s
    .replace(/\*+/g, '')                                // strip markdown emphasis
    .replace(/[‘’ʻ'`]/g, "'")            // unify glottal/apostrophe
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip combining diacritics
    .replace(/\s+/g, ' ')                               // collapse whitespace
    .replace(/^[\s".,?!]+|[\s".,?!]+$/g, '')            // trim outer punctuation (NOT ʻokina)
    .toLowerCase()
    .trim()
}

export function isCorrect(userInput, item) {
  if (!item.answer) return false
  const u = normalize(userInput)
  if (u === normalize(item.answer)) return true
  return (item.accept || []).some((variant) => u === normalize(variant))
}
