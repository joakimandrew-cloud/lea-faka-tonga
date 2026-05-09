import { useState } from 'react'

export default function TeachingPanel({ teaching }) {
  const [showParadigm, setShowParadigm] = useState(false)

  if (!teaching) return null

  return (
    <div className="mb-8">
      {/* Summary */}
      <p className="text-[var(--text)] leading-relaxed mb-4">{teaching.summary}</p>

      {/* Key Rules */}
      {teaching.key_rules && teaching.key_rules.length > 0 && (
        <div className="space-y-3 mb-4">
          {teaching.key_rules.map((rule, i) => (
            <div key={i} className="border-l-2 border-[var(--accent)]/40 pl-4">
              <div className="text-sm text-[var(--text-muted)] mb-1">{rule.rule}</div>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-tongan">{rule.example_tongan}</span>
                <span className="text-sm text-[var(--text-muted)]">{rule.example_english}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paradigm Table (collapsible) */}
      {teaching.paradigm && (
        <div>
          <button
            onClick={() => setShowParadigm(!showParadigm)}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors cursor-pointer"
          >
            {showParadigm ? '\u25BC' : '\u25B6'} {teaching.paradigm.caption}
          </button>
          {showParadigm && (
            <div className="mt-2 overflow-x-auto">
              <table className="text-sm border-collapse">
                <thead>
                  <tr>
                    {teaching.paradigm.headers.map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-xs text-[var(--text-muted)] uppercase tracking-wider px-3 py-1 border-b border-[var(--border)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teaching.paradigm.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="px-3 py-1 text-[var(--text)] font-tongan border-b border-[var(--bg-med)]"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
