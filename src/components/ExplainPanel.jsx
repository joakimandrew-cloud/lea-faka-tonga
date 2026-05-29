/**
 * ExplainPanel — "Show how this was built" disclosure for a finished sentence.
 *
 * Turns the builder from grade-only into self-explaining: it renders a six-step-
 * style breakdown derived (purely) from the grammar-graph step path the builder
 * already holds, advancing the site's "told why, not just whether" promise.
 *
 * Collapsed by default so the minimalist finished-sentence view stays clean.
 * When opened it shows:
 *   - the frame name + slot template ("[Tense Marker] + [Pronoun] + [Verb]")
 *   - a word-by-word table: Tongan | English | cited chapter
 *   - the assembled natural translation (+ literal line, when it differs)
 *   - matched grammar notes, if any
 *
 * Citations come ONLY from each word's `min_chapter` (graph data). See
 * walkthrough.js for the rationale — we do not synthesize prose-spec citations.
 *
 * Styling matches the host (OpenBuilderSlot): Tailwind utilities over the
 * shared design tokens in src/index.css. No new global CSS is introduced so the
 * builder pages keep their own look (per way-of-code-design-spec.md, the
 * marketing/.v11-landing styles deliberately don't reach here).
 */

import { useState } from 'react'
import { deriveWalkthrough } from '../engine/walkthrough'

export default function ExplainPanel({ steps, translation, chapter, entryPoint }) {
  const [open, setOpen] = useState(false)

  // Edge case: nothing to explain. A finished sentence always has at least a
  // tense marker + verb, but guard against empty/missing input anyway.
  if (!steps || steps.length === 0 || !translation || !translation.text) {
    return null
  }

  const wt = deriveWalkthrough(steps, translation, { entryPoint, chapter })

  // Edge case: a path so short it produced no meaningful (non-structural) rows.
  // There's nothing worth a breakdown, so render nothing.
  if (wt.rows.length === 0) return null

  const isApproximate = wt.method === 'gloss'
  const showLiteral =
    wt.assembled.literal && wt.assembled.literal !== wt.assembled.text

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--accent-hover)] cursor-pointer transition-colors"
      >
        {open ? '− Hide how this was built' : '+ Show how this was built'}
      </button>

      {open && (
        <div className="mt-4 border-l-2 border-[var(--accent)] pl-4 space-y-5">
          {/* Frame name + slot template */}
          <div>
            {wt.frame.name && (
              <div className="text-xs uppercase tracking-[0.15em] text-[var(--accent)] mb-1">
                {wt.frame.name}
              </div>
            )}
            {wt.frame.template && (
              <div className="text-sm text-[var(--text-muted)] font-tongan leading-relaxed">
                {wt.frame.template}
              </div>
            )}
          </div>

          {/* Word-by-word breakdown */}
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)] mb-2">
              Word by word
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-[0.1em] text-[var(--text-faint)]">
                  <th className="text-left font-normal pb-1 pr-4">Tongan</th>
                  <th className="text-left font-normal pb-1 pr-4">English</th>
                  <th className="text-left font-normal pb-1">Taught in</th>
                </tr>
              </thead>
              <tbody>
                {wt.rows.map((row, i) => (
                  <tr
                    key={`${row.tongan}-${i}`}
                    className="border-t border-[var(--surface-sunken)] align-top"
                  >
                    <td className="py-1.5 pr-4 font-tongan text-[var(--text-strong)]">
                      {row.tongan}
                    </td>
                    <td className="py-1.5 pr-4 text-[var(--text-muted)] italic">
                      {row.english}
                    </td>
                    <td className="py-1.5 text-[var(--text-faint)] whitespace-nowrap">
                      {row.citation || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Assembled sentence */}
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)] mb-2">
              Assembled
            </div>
            <div className="text-sm text-[var(--text)]">
              {wt.assembled.text}
              {isApproximate && (
                <span className="ml-2 text-xs text-[var(--text-faint)] italic">
                  (approximate)
                </span>
              )}
            </div>
            {showLiteral && (
              <div className="text-xs mt-1 text-[var(--text-faint)] italic">
                literally: {wt.assembled.literal}
              </div>
            )}
          </div>

          {/* Grammar notes — best-effort, omitted when none match */}
          {wt.notes.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                Notes
              </div>
              {wt.notes.map(note => (
                <div key={note.id}>
                  <div className="text-xs text-[var(--accent)] uppercase tracking-wider mb-1">
                    {note.title}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed font-tongan">
                    {note.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
