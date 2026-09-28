export const PREMIUM_PROGRESS_KEY = 'lft-premium-progress'
export const LEGACY_CHAPTER_KEY = 'currentChapter'
export const LEGACY_QUIZ_KEY = 'lft-quiz-scores-v1'
export const LEGACY_PROGRESS_MIGRATION = 1

const MIGRATIONS_KEY = '_migrations'
const LEGACY_PROGRESS_KEY = 'releasedProgress'

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)

export function validLesson(value) {
  const lesson = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value
  return Number.isInteger(lesson) && lesson >= 1 && lesson <= 52 ? lesson : null
}

export function validScore(value, rightKey = 'right', totalKey = 'total') {
  if (!record(value)) return null
  const right = value[rightKey]
  const total = value[totalKey]
  if (!Number.isInteger(right) || !Number.isInteger(total) || total < 1 || right < 0 || right > total) return null
  return { right, total }
}

function normalizeQuiz(value) {
  if (!record(value)) return {}
  const quiz = {}
  for (const [key, score] of Object.entries(value)) {
    const lesson = validLesson(key)
    const valid = validScore(score)
    if (lesson && valid) quiz[lesson] = valid
  }
  return quiz
}

export function normalizeProgress(value) {
  const source = record(value) ? value : {}
  const progress = { ...source }
  progress.done = Array.isArray(source.done)
    ? [...new Set(source.done.map(validLesson).filter(Boolean))]
    : []
  progress.quiz = normalizeQuiz(source.quiz)
  const last = validLesson(source.last)
  if (last) progress.last = last
  else delete progress.last
  progress[MIGRATIONS_KEY] = record(source[MIGRATIONS_KEY]) ? { ...source[MIGRATIONS_KEY] } : {}
  return progress
}

function parseStored(storage, key) {
  try {
    const raw = storage?.getItem(key)
    if (raw == null) return { readable: true, value: null }
    return { readable: true, value: JSON.parse(raw) }
  } catch {
    return { readable: false, value: null }
  }
}

function readLegacyChapter(storage) {
  try { return validLesson(storage?.getItem(LEGACY_CHAPTER_KEY)) } catch { return null }
}

function readLegacyQuiz(storage) {
  const parsed = parseStored(storage, LEGACY_QUIZ_KEY)
  if (!parsed.readable || !record(parsed.value)) return {}
  const quiz = {}
  for (const [key, score] of Object.entries(parsed.value)) {
    const lesson = validLesson(key)
    const valid = validScore(score, 'best', 'of')
    if (lesson && valid) quiz[lesson] = valid
  }
  return quiz
}

export function migrateLegacyProgress(storage) {
  const premium = parseStored(storage, PREMIUM_PROGRESS_KEY)
  const progress = normalizeProgress(premium.value)
  if (progress[MIGRATIONS_KEY][LEGACY_PROGRESS_KEY] === LEGACY_PROGRESS_MIGRATION) return progress

  if (!progress.last) {
    const chapter = readLegacyChapter(storage)
    if (chapter) progress.last = chapter
  }

  const legacyQuiz = readLegacyQuiz(storage)
  for (const [lesson, score] of Object.entries(legacyQuiz)) {
    const existing = progress.quiz[lesson]
    if (!existing || score.right > existing.right) progress.quiz[lesson] = score
  }

  progress[MIGRATIONS_KEY][LEGACY_PROGRESS_KEY] = LEGACY_PROGRESS_MIGRATION
  try { storage?.setItem(PREMIUM_PROGRESS_KEY, JSON.stringify(progress)) } catch { /* blocked or full storage */ }
  return progress
}

export function readProgress(storage) {
  return migrateLegacyProgress(storage)
}
