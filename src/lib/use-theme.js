// One source of truth for Light / Dark (UX-03, 2026-09-03).
//
// The theme used to be read, applied and stored entirely inside
// components/Layout.jsx. Every route that renders outside the layout, and
// /lessons is the one a learner passes through most, therefore never saw the
// saved theme at all: a reader in dark mode got a white index every time, with
// no toggle in reach to change it.
//
// The class is now applied once in App, above the router, so every route gets
// it. The tiny store below is what lets the toggle in the layout header and the
// one in the /lessons brand band read and write the same value without either
// page owning it.
import { useEffect, useState } from 'react'

const KEY = 'theme'
const listeners = new Set()

function readStored() {
  try {
    return localStorage.getItem(KEY) === 'dark'
  } catch {
    // Private windows and blocked site data throw on access, not on read.
    return false
  }
}

let dark = readStored()

export function setDarkTheme(next) {
  dark = next
  try {
    localStorage.setItem(KEY, next ? 'dark' : 'light')
  } catch {
    // The choice still holds for this visit; it just will not be remembered.
  }
  for (const notify of listeners) notify(next)
}

// Read the current theme and a setter. Any number of components can hold this
// at once and they all stay in step.
export function useTheme() {
  const [value, setValue] = useState(dark)
  useEffect(() => {
    listeners.add(setValue)
    // A toggle elsewhere may have moved it between render and effect.
    setValue(dark)
    return () => {
      listeners.delete(setValue)
    }
  }, [])
  return [value, setDarkTheme]
}

// Mounted once, above every route, so the saved theme reaches the pages that
// render outside <Layout /> as well as the ones inside it.
export function useThemeEffect() {
  const [value] = useTheme()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', value)
  }, [value])
}
