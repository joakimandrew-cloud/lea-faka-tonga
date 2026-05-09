import { createContext, useContext, useState } from 'react'

const ChapterContext = createContext()

export function ChapterProvider({ children }) {
  const [chapter, setChapter] = useState(() => {
    const saved = localStorage.getItem('currentChapter')
    return saved ? parseInt(saved, 10) : 1
  })

  const updateChapter = (n) => {
    const clamped = Math.max(1, Math.min(53, n))
    setChapter(clamped)
    localStorage.setItem('currentChapter', String(clamped))
  }

  return (
    <ChapterContext.Provider value={{ chapter, setChapter: updateChapter }}>
      {children}
    </ChapterContext.Provider>
  )
}

export function useChapter() {
  const ctx = useContext(ChapterContext)
  if (!ctx) throw new Error('useChapter must be used within ChapterProvider')
  return ctx
}
