import { useState, useEffect } from 'react'

function normalize(s) {
  return s.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'")
}

function getValidPronouns(section, selectedTM) {
  if (!section.pronoun_dependencies || !selectedTM) return null
  const normalizedTM = normalize(selectedTM)
  for (const [key, pronouns] of Object.entries(section.pronoun_dependencies)) {
    if (normalize(key) === normalizedTM) return pronouns
  }
  return null
}

function getValidObjects(section, selectedVerb) {
  if (!section.verb_object_dependencies || !selectedVerb) return null
  const normalizedVerb = normalize(selectedVerb)
  for (const [key, objects] of Object.entries(section.verb_object_dependencies)) {
    if (normalize(key) === normalizedVerb) return objects
  }
  return null
}

function getValidPrepositions(section, selectedVerb) {
  if (!section.verb_preposition_dependencies || !selectedVerb) return null
  const normalizedVerb = normalize(selectedVerb)
  for (const [key, preps] of Object.entries(section.verb_preposition_dependencies)) {
    if (normalize(key) === normalizedVerb) return preps
  }
  return null
}

function getValidVerbs(section, selectedPronoun) {
  if (!section.pronoun_verb_dependencies || !selectedPronoun) return null
  const normalizedPronoun = normalize(selectedPronoun)
  for (const [key, verbs] of Object.entries(section.pronoun_verb_dependencies)) {
    if (normalize(key) === normalizedPronoun) return verbs
  }
  return null
}

export default function DropdownBuilder({ section }) {
  const { pattern, slots, translations, pronoun_dependencies, grammar_note } = section
  const slotKeys = pattern.structure

  const [selections, setSelections] = useState(() => {
    const init = {}
    for (const key of slotKeys) {
      const slot = slots[key]
      init[key] = slot.fixed ? slot.options[0].tongan : ''
    }
    return init
  })

  useEffect(() => {
    const init = {}
    for (const key of slotKeys) {
      const slot = slots[key]
      init[key] = slot.fixed ? slot.options[0].tongan : ''
    }
    setSelections(init)
  }, [section.id])

  const handleChange = (slotKey, value) => {
    setSelections(prev => {
      const next = { ...prev, [slotKey]: value }

      if (slotKey === 'tense_marker' && pronoun_dependencies && prev.pronoun) {
        const validPronouns = getValidPronouns(section, value)
        if (validPronouns && !validPronouns.includes(prev.pronoun)) {
          next.pronoun = ''
        }
      }

      if (slotKey === 'verb' && section.verb_object_dependencies && prev.object) {
        const validObjects = getValidObjects(section, value)
        if (validObjects && !validObjects.includes(prev.object)) {
          next.object = ''
        }
      }

      if (slotKey === 'verb' && section.verb_preposition_dependencies && prev.preposition) {
        const validPreps = getValidPrepositions(section, value)
        if (validPreps && !validPreps.includes(prev.preposition)) {
          next.preposition = ''
        }
      }

      if (slotKey === 'pronoun' && section.pronoun_verb_dependencies && prev.verb) {
        const validVerbs = getValidVerbs(section, value)
        if (validVerbs && !validVerbs.includes(prev.verb)) {
          next.verb = ''
        }
      }

      return next
    })
  }

  const allSelected = slotKeys.every(key => selections[key] !== '')
  const translationKey = slotKeys.map(key => selections[key]).join('|')
  const translation = allSelected ? translations[translationKey] : null

  const selectedTM = selections.tense_marker
  const validPronouns = pronoun_dependencies ? getValidPronouns(section, selectedTM) : null
  const selectedVerb = selections.verb
  const validObjects = section.verb_object_dependencies ? getValidObjects(section, selectedVerb) : null
  const validPrepositions = section.verb_preposition_dependencies ? getValidPrepositions(section, selectedVerb) : null
  const selectedPronoun = selections.pronoun
  const validVerbs = section.pronoun_verb_dependencies ? getValidVerbs(section, selectedPronoun) : null

  return (
    <div>
      <div className="text-[var(--accent)] text-sm mb-6 tracking-wide">
        {pattern.display}
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {slotKeys.map(key => {
          const slot = slots[key]

          if (slot.fixed) {
            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  {slot.label}
                </label>
                <div className="px-4 py-2 bg-[var(--bg-tone)] border border-[var(--border)] font-tongan">
                  {slot.options[0].tongan}
                  <span className="text-[var(--text-muted)] text-sm ml-2">({slot.options[0].english})</span>
                </div>
              </div>
            )
          }

          let filteredOptions = slot.options
          if (key === 'pronoun' && validPronouns) {
            filteredOptions = slot.options.filter(opt =>
              validPronouns.includes(opt.tongan)
            )
          }
          if (key === 'object' && validObjects) {
            filteredOptions = slot.options.filter(opt =>
              validObjects.includes(opt.tongan)
            )
          }
          if (key === 'preposition' && validPrepositions) {
            filteredOptions = slot.options.filter(opt =>
              validPrepositions.includes(opt.tongan)
            )
          }
          if (key === 'verb' && validVerbs) {
            filteredOptions = slot.options.filter(opt =>
              validVerbs.includes(opt.tongan)
            )
          }

          const isDisabled =
            (key === 'pronoun' && pronoun_dependencies && !selectedTM) ||
            (key === 'object' && section.verb_object_dependencies && !selectedVerb) ||
            (key === 'preposition' && section.verb_preposition_dependencies && !selectedVerb) ||
            (key === 'verb' && section.pronoun_verb_dependencies && !selectedPronoun)

          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {slot.label}
              </label>
              <select
                value={selections[key]}
                onChange={e => handleChange(key, e.target.value)}
                disabled={isDisabled}
                className="px-4 py-2 bg-[var(--bg-tone)] border border-[var(--border)] text-[var(--text)] font-tongan appearance-none cursor-pointer hover:border-[var(--accent)] transition-colors focus:outline-none focus:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed min-w-[180px]"
              >
                <option value="">Select...</option>
                {filteredOptions.map(opt => (
                  <option key={opt.tongan} value={opt.tongan}>
                    {opt.tongan} ({opt.english})
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {allSelected && (
        <div className="border border-[var(--border)] px-6 py-4 mb-8">
          <div className="font-tongan text-lg text-[var(--text)] mb-2">
            {slotKeys.filter(key => selections[key] !== '-').map(key => selections[key]).join(' ')}
          </div>
          {translation ? (
            <div className="text-[var(--accent)]">{translation}</div>
          ) : (
            <div className="text-[var(--text-muted)] italic">Translation not available for this combination</div>
          )}
        </div>
      )}

      {grammar_note && (
        <div className="border-t border-[var(--border)] pt-4 mt-8">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Grammar Note</div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed font-tongan">{grammar_note}</p>
        </div>
      )}
    </div>
  )
}
