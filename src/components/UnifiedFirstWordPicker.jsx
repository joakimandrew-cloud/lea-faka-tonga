import { useState } from 'react'
import { getFirstWords, getRoadPreviews } from '../engine/graph-walker'

// Visual grouping for the flat list — not drill-down, just labels
function getGroupLabel(item) {
  const ep = item.entryPoints[0]
  const node = ep?.startNodeId || ep?.start_node || ''
  if (node.startsWith('tense_marker')) return 'Tense Markers'
  if (node === 'suggestion_pronoun') return 'Suggestions'
  if (node === 'command_verb' || node === 'imperative_mou') return 'Commands'
  if (node === 'prohibition_marker') return 'Prohibition'
  if (node.startsWith('ko_')) return 'Ko Patterns'
  return 'Other'
}

const groupOrder = ['Tense Markers', 'Suggestions', 'Commands', 'Prohibition', 'Ko Patterns', 'Other']

export default function UnifiedFirstWordPicker({ onSelectWord }) {
  const [hoveredKey, setHoveredKey] = useState(null)
  const items = getFirstWords(999)

  // Group items for visual labels
  const groups = {}
  for (const item of items) {
    const group = getGroupLabel(item)
    if (!groups[group]) groups[group] = []
    groups[group].push(item)
  }
  const orderedGroups = groupOrder.filter(g => groups[g])

  // Road previews for hovered/selected word
  const previews = hoveredKey ? getRoadPreviews(hoveredKey) : []

  return (
    <div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Pick any word to start your sentence. Only grammatically valid options will appear next.
      </p>

      <div className="space-y-4">
        {orderedGroups.map(group => (
          <div key={group}>
            <div className="text-xs text-[var(--text-faint)] uppercase tracking-wider mb-2">{group}</div>
            <div className="flex flex-wrap gap-2">
              {groups[group].map(item => {
                const isAmbiguous = item.entryPoints.length > 1
                return (
                  <button
                    key={item.word.tongan}
                    onClick={() => onSelectWord(item)}
                    onMouseEnter={() => setHoveredKey(item.word.tongan.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'"))}
                    onMouseLeave={() => setHoveredKey(null)}
                    className="px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] text-left transition-colors cursor-pointer group"
                  >
                    <span className="font-tongan">{item.word.tongan}</span>
                    <span className="text-sm text-[var(--text-muted)] ml-2">({item.word.english})</span>
                    {isAmbiguous && (
                      <span className="text-xs text-[var(--text-faint)] ml-2" title={`Can start ${item.entryPoints.length} sentence types`}>
                        +{item.entryPoints.length - 1}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Road previews */}
      {previews.length > 0 && (
        <div className="mt-4 border border-[var(--bg-med)] px-4 py-3">
          <div className="text-xs text-[var(--text-faint)] uppercase tracking-wider mb-2">Example sentences</div>
          {previews.slice(0, 3).map((p, i) => (
            <div key={i} className="text-sm mb-1">
              <span className="text-[var(--text)] font-tongan">{p.path.join(' ')}</span>
              <span className="text-[var(--text-muted)] ml-2">– {p.english}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
