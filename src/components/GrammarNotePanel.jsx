import { matchNotes } from '../engine/note-matcher'

export default function GrammarNotePanel({ steps, chapter }) {
  const notes = matchNotes(steps, chapter)

  if (notes.length === 0) return null

  return (
    <div className="space-y-3">
      {notes.map(note => (
        <div key={note.id} className="border-l-2 border-[var(--accent)] pl-4 py-2">
          <div className="text-xs text-[var(--accent)] uppercase tracking-wider mb-1">
            {note.title}
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed font-tongan">
            {note.text}
          </p>
        </div>
      ))}
    </div>
  )
}
