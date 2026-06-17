import { useChapter } from '../contexts/ChapterContext'

export default function ChapterSelector() {
  const { chapter, setChapter } = useChapter()

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Ch.</label>
      <button
        onClick={() => setChapter(chapter - 1)}
        disabled={chapter <= 1}
        className="w-6 h-6 flex items-center justify-center text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        -
      </button>
      <span className="text-[var(--accent)] text-sm w-6 text-center font-bold">{chapter}</span>
      <button
        onClick={() => setChapter(chapter + 1)}
        disabled={chapter >= 52}
        className="w-6 h-6 flex items-center justify-center text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        +
      </button>
    </div>
  )
}
