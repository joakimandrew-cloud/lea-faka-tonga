// Per-browser record of a student's path through a lesson
// (reviews/lesson-course-2026-10-24/Direction.md, "The new key, and why").
// Nothing saved before this key records reading position, figure use,
// in-flow practice or the end-of-lesson check. Only true flags, indexes and
// ids are written; nothing is deleted. Every access is guarded as in
// progress.js, so private windows and the server render still work.
//
// { version: 1, lessons: { "15": { read: 3, at: "<section id>", pattern: true,
//   tried: ["drill:<id>", "qp:0"], known: [0, 2] } } }
export const LESSON_PATH_KEY = 'lft-premium-lesson-path-v1'
export const LESSON_PATH_EVENT = 'lft-lesson-path'
const VERSION = 1

function browserStorage() {
  try { return globalThis.window?.localStorage ?? null } catch { return null }
}

function readRoot(storage = browserStorage()) {
  try {
    const value = JSON.parse(storage?.getItem(LESSON_PATH_KEY) || '{}')
    return value?.version === VERSION && value.lessons && typeof value.lessons === 'object'
      ? value
      : { version: VERSION, lessons: {} }
  } catch {
    return { version: VERSION, lessons: {} }
  }
}

function clean(entry) {
  const out = {}
  if (!entry || typeof entry !== 'object') return out
  if (Number.isInteger(entry.read) && entry.read >= 0) out.read = entry.read
  if (typeof entry.at === 'string' && entry.at) out.at = entry.at
  if (entry.pattern === true) out.pattern = true
  if (Array.isArray(entry.tried)) out.tried = [...new Set(entry.tried.filter(key => typeof key === 'string' && key))]
  if (Array.isArray(entry.known)) out.known = [...new Set(entry.known.filter(i => Number.isInteger(i) && i >= 0))]
  return out
}

const validLesson = n => Number.isInteger(n) && n >= 1 && n <= 52

/** The saved path of lesson n, cleaned; {} when nothing is saved. */
export function readPath(n, storage = browserStorage()) {
  if (!validLesson(n)) return {}
  return clean(readRoot(storage).lessons[String(n)])
}

function update(n, change, storage = browserStorage()) {
  if (!validLesson(n)) return {}
  const root = readRoot(storage)
  const before = clean(root.lessons[String(n)])
  const after = clean(change(before))
  if (JSON.stringify(before) === JSON.stringify(after)) return before
  try { storage?.setItem(LESSON_PATH_KEY, JSON.stringify({ ...root, lessons: { ...root.lessons, [String(n)]: after } })) } catch { /* storage blocked */ }
  try { if (storage === browserStorage()) globalThis.window?.dispatchEvent(new Event(LESSON_PATH_EVENT)) } catch { /* server render */ }
  return after
}

/** Records the highest teaching-section index reached and the last section id. */
export function markRead(n, index, id, storage) {
  return update(n, entry => ({
    ...entry,
    ...(Number.isInteger(index) && index >= 0 ? { read: Math.max(index, entry.read ?? -1) } : {}),
    ...(typeof id === 'string' && id ? { at: id } : {}),
  }), storage)
}

export function markPattern(n, storage) {
  return update(n, entry => ({ ...entry, pattern: true }), storage)
}

export function markTried(n, key, storage) {
  if (typeof key !== 'string' || !key) return readPath(n, storage)
  return update(n, entry => ({ ...entry, tried: [...(entry.tried || []), key] }), storage)
}

export function markKnown(n, i, storage) {
  if (!Number.isInteger(i) || i < 0) return readPath(n, storage)
  return update(n, entry => ({ ...entry, known: [...(entry.known || []), i] }), storage)
}
