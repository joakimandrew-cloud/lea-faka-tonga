// Per-browser progress (UX law 11: save progress, make it easy to resume).
// localStorage only; every access is guarded so private windows still render.
import { useEffect, useState } from 'react'
import { PREMIUM_PROGRESS_KEY, normalizeProgress, readProgress } from './progress-migration.js'

const EVT = 'lft-progress'

function browserStorage() {
  try { return globalThis.window?.localStorage ?? null } catch { return null }
}
function read() {
  return readProgress(browserStorage())
}
function write(next) {
  const progress = normalizeProgress(next)
  try { browserStorage()?.setItem(PREMIUM_PROGRESS_KEY, JSON.stringify(progress)) } catch { /* storage blocked */ }
  try { globalThis.window?.dispatchEvent(new Event(EVT)) } catch { /* server render */ }
}

export function markLessonDone(n) {
  if (!Number.isInteger(n) || n < 1 || n > 52) return
  const p = read()
  const done = new Set(p.done || [])
  done.add(n)
  write({ ...p, done: [...done], last: n })
}
export function markLessonOpened(n) {
  if (!Number.isInteger(n) || n < 1 || n > 52) return
  const p = read()
  write({ ...p, last: n })
}
export function saveQuizScore(n, right, total) {
  if (!Number.isInteger(n) || n < 1 || n > 52 || !Number.isInteger(right) || !Number.isInteger(total) || total < 1 || right < 0 || right > total) return
  const p = read()
  const best = p.quiz?.[n]
  const keep = !best || right > best.right ? { right, total } : best
  write({ ...p, quiz: { ...(p.quiz || {}), [n]: keep } })
}

export function useProgress() {
  const [p, setP] = useState(read)
  useEffect(() => {
    const on = () => setP(read())
    window.addEventListener(EVT, on)
    window.addEventListener('storage', on)
    return () => { window.removeEventListener(EVT, on); window.removeEventListener('storage', on) }
  }, [])
  return { done: new Set(p.done || []), last: p.last || null, quiz: p.quiz || {} }
}
