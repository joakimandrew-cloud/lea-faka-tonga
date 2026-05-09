import { useState } from 'react'
import grammarGraph from '../data/grammar-graph.json'
import { getRoadPreviews } from '../engine/graph-walker'

// Map start node names to part-of-speech group labels
function getPartOfSpeech(startNode) {
  if (startNode.startsWith('tense_marker')) return 'Tense Marker'
  if (startNode === 'suggestion_pronoun') return 'Suggestion'
  if (startNode === 'command_verb') return 'Command (one person)'
  if (startNode === 'imperative_mou') return 'Command (group)'
  if (startNode === 'prohibition_marker') return 'Prohibition'
  if (startNode.startsWith('ko_')) return 'Ko Pattern'
  return 'Other'
}

const groupOrder = [
  'Tense Marker',
  'Suggestion',
  'Command (one person)',
  'Command (group)',
  'Prohibition',
  'Ko Pattern'
]

const groupDescriptions = {
  'Tense Marker': 'Start a statement, question, negation, or other sentence with a tense marker',
  'Suggestion': 'Suggest doing something together',
  'Command (one person)': 'Tell one person to do something',
  'Command (group)': 'Tell a group to do something',
  'Prohibition': 'Tell someone not to do something',
  'Ko Pattern': 'Identify things, ask what/who/where'
}

export default function FirstWordPicker({ onSelectWord, onSelectRoad }) {
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [expandedPurpose, setExpandedPurpose] = useState(null)

  // Build: part of speech → entry points → words
  const groups = {}
  for (const ep of grammarGraph.entry_points) {
    const pos = getPartOfSpeech(ep.start_node)
    if (!groups[pos]) groups[pos] = []
    // Get the words available at this entry point's start node
    const node = grammarGraph.nodes[ep.start_node]
    if (!node) continue
    groups[pos].push({
      entryPoint: { ...ep, startNodeId: ep.start_node },
      words: node.words
    })
  }

  const orderedGroups = groupOrder.filter(g => groups[g])
  for (const g of Object.keys(groups)) {
    if (!orderedGroups.includes(g)) orderedGroups.push(g)
  }

  const handleSelectWord = (word, ep) => {
    const item = { word, entryPoints: [{ ...ep, startNodeId: ep.start_node }] }
    onSelectRoad(item, { ...ep, startNodeId: ep.start_node })
  }

  return (
    <div>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Choose how to start your sentence.
      </p>

      <div className="space-y-2">
        {orderedGroups.map(group => {
          const isGroupExpanded = expandedGroup === group
          const purposes = groups[group]

          return (
            <div key={group} className="border border-[var(--border)]">
              {/* Level 1: Part of speech */}
              <button
                onClick={() => {
                  setExpandedGroup(isGroupExpanded ? null : group)
                  setExpandedPurpose(null)
                }}
                className="w-full text-left px-5 py-4 hover:bg-[var(--bg-tone)] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-[var(--accent)] text-sm uppercase tracking-wider">{group}</div>
                  <div className="text-xs text-[var(--text-faint)] mt-1">{groupDescriptions[group]}</div>
                </div>
                <span className="text-[var(--text-faint)] text-sm">{isGroupExpanded ? '\u25BC' : '\u25B6'}</span>
              </button>

              {/* Level 2: Purpose / sentence type */}
              {isGroupExpanded && (
                <div className="border-t border-[var(--border)]">
                  {purposes.map(({ entryPoint: ep, words }) => {
                    const isPurposeExpanded = expandedPurpose === ep.id
                    const preview = getRoadPreviews(words[0]?.tongan)
                      .find(p => p.leads_to === ep.id)

                    // If only one word in this purpose, skip Level 3 and go directly
                    const singleWord = words.length === 1

                    return (
                      <div key={ep.id} className="border-t border-[var(--bg-med)]">
                        <button
                          onClick={() => {
                            if (singleWord) {
                              handleSelectWord(words[0], ep)
                            } else {
                              setExpandedPurpose(isPurposeExpanded ? null : ep.id)
                            }
                          }}
                          className="w-full text-left px-6 py-3 hover:bg-[var(--bg-tone)] transition-colors cursor-pointer"
                        >
                          <div className="text-[var(--text)] text-sm">{ep.label}</div>
                          <div className="text-xs text-[var(--text-faint)]">{ep.description}</div>
                          {preview && (
                            <div className="text-xs text-[var(--text-faint)] font-tongan mt-1">
                              e.g. {preview.path.join(' ')} — {preview.english}
                            </div>
                          )}
                        </button>

                        {/* Level 3: Individual words */}
                        {isPurposeExpanded && !singleWord && (
                          <div className="bg-[var(--bg-tone)] px-6 py-2 space-y-1">
                            {words.map(word => (
                              <button
                                key={word.tongan}
                                onClick={() => handleSelectWord(word, ep)}
                                className="block w-full text-left px-4 py-2 hover:bg-[var(--bg-tone)] border-l-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                              >
                                <span className="font-tongan">{word.tongan}</span>
                                <span className="text-sm text-[var(--text-muted)] ml-3">{word.english}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
