// Best quiz score per lesson, kept in the browser (UX-11, 2026-09-03).
//
// QuizRunner reset itself on every mount and wrote nothing, so the quiz index
// showed fifty-two identical rows however many a learner had finished. This is
// the whole of the memory: one localStorage key, an object keyed by lesson
// number, the best attempt only.
//
//   { "7": { best: 8, of: 10, at: "2026-09-03T…" } }
//
// No accounts and no server, per the D7 ruling. Every read and write is
// guarded, because a private window or blocked site data throws on access
// rather than returning nothing.

const KEY = 'lft-quiz-scores-v1'

export function readQuizScores() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

// Never lowers a stored score: a second, worse run leaves the best one standing.
export function recordQuizScore(chapter, score, of) {
  if (!Number.isFinite(chapter) || !Number.isFinite(score) || !Number.isFinite(of)) return
  try {
    const scores = readQuizScores()
    const key = String(chapter)
    const prev = scores[key]
    if (prev && Number.isFinite(prev.best) && prev.best >= score) return
    scores[key] = { best: score, of, at: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(scores))
  } catch {
    // The score is lost, the quiz still works. Nothing else depends on it.
  }
}

// One row's entry, or null. Guards against a hand-edited or half-written key.
export function bestQuizScore(scores, chapter) {
  const entry = scores?.[String(chapter)]
  if (!entry || !Number.isFinite(entry.best) || !Number.isFinite(entry.of)) return null
  return entry
}
