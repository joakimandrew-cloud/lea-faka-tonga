/**
 * Shared game code: safe localStorage (no React).
 *
 * Every read and write survives a browser that refuses storage (private
 * mode, blocked site data): a read gives null, a write is dropped and the
 * value lasts this visit only. Moved out of pages/WordRain.jsx unchanged.
 */
export function readStore(key) {
  try { return window.localStorage.getItem(key) } catch { return null }
}

export function writeStore(key, value) {
  try { window.localStorage.setItem(key, value) } catch { /* private mode: lasts this visit */ }
}
