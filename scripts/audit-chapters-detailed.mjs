#!/usr/bin/env node
/**
 * Detailed per-chapter audit of the SlotBuilder.
 *
 * For each of the 30 grammar chapters that have taught patterns,
 * reports exactly what the student sees: which patterns, which slots,
 * which vocabulary options — and flags problems.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(__dirname, '../src/data')

const sentencePatterns = JSON.parse(readFileSync(resolve(dataDir, 'sentence-patterns.json'), 'utf-8'))
const vocabBySlot = JSON.parse(readFileSync(resolve(dataDir, 'vocabulary-by-slot.json'), 'utf-8'))
const chapters = JSON.parse(readFileSync(resolve(dataDir, 'chapters.json'), 'utf-8'))

// ---------------------------------------------------------------------------
// Helpers (mirroring slot-engine.js)
// ---------------------------------------------------------------------------

function normalize(s) {
  return s.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'")
}

function makePronounOption(shortForm, data, code) {
  return { tongan: shortForm, english: data.subject_english, person: data.person, number: data.number, min_chapter: data.min_chapter, pronoun_code: code }
}

function flattenPronouns(hasDeps) {
  const pronouns = vocabBySlot.pronouns
  const result = []
  for (const [code, data] of Object.entries(pronouns)) {
    if (code === '1sg') {
      if (hasDeps) {
        const seen = new Set()
        for (const form of Object.values(data.short_forms)) {
          if (!seen.has(form)) { seen.add(form); result.push(makePronounOption(form, data, code)) }
        }
      } else {
        result.push(makePronounOption('u', data, code))
      }
    } else {
      result.push(makePronounOption(data.short, data, code))
    }
  }
  return result
}

function getVocabularyOptions(source, hasPronounDeps) {
  if (!source) return []
  if (typeof source === 'string') {
    if (source === 'pronouns') return flattenPronouns(hasPronounDeps)
    return vocabBySlot[source] || []
  }
  if (Array.isArray(source)) return source.flatMap(key => vocabBySlot[key] || [])
  return []
}

function getOptionsForSlot(pattern, slot, filledSlots, maxChapter) {
  if (slot.locked) return slot.locked_value ? [slot.locked_value] : []
  const hasDeps = !!pattern.pronoun_dependencies
  let options = getVocabularyOptions(slot.options_source, hasDeps)
  options = options.filter(opt => !opt.min_chapter || opt.min_chapter <= maxChapter)

  if (slot.depends_on === 'tense_marker' && slot.type === 'pronoun' && pattern.pronoun_dependencies) {
    const tm = filledSlots.tense_marker
    if (tm) {
      const tmKey = normalize(tm.tongan)
      for (const [key, values] of Object.entries(pattern.pronoun_dependencies)) {
        if (normalize(key) === tmKey) {
          options = options.filter(opt => values.includes(opt.tongan))
          break
        }
      }
    }
  }

  if (slot.condition) {
    if (slot.condition.type === 'verb_has_tag') {
      const verb = filledSlots.verb
      if (!verb || !verb.tags || !verb.tags.includes(slot.condition.tag)) return []
    }
  }

  return options
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

const patterns = sentencePatterns.patterns
const issues = []

for (const ch of chapters) {
  const taught = patterns.filter(p => p.book_chapters && p.book_chapters.includes(ch.chapter))
  if (taught.length === 0) continue // skip chapters with no taught patterns

  console.log(`\n${'='.repeat(72)}`)
  console.log(`CHAPTER ${ch.chapter}: ${ch.title}`)
  console.log(`Type: ${ch.type || 'grammar'} | Topics: ${ch.topics.join(', ')}`)
  console.log(`Taught patterns: ${taught.map(p => p.id).join(', ')}`)
  console.log(`${'='.repeat(72)}`)

  for (const pattern of taught) {
    console.log(`\n  --- ${pattern.id}: ${pattern.title} ---`)
    console.log(`  label: ${pattern.label_to}`)

    for (const slot of pattern.slots) {
      if (slot.locked) {
        console.log(`  [${slot.id}] LOCKED = "${slot.locked_value.tongan}" (${slot.locked_value.english})`)
        continue
      }

      const required = slot.required ? 'REQUIRED' : 'optional'

      // For pronoun slots with dependencies, check per tense marker
      if (slot.depends_on === 'tense_marker' && slot.type === 'pronoun' && pattern.pronoun_dependencies) {
        const tmSlot = pattern.slots.find(s => s.id === 'tense_marker')
        if (tmSlot) {
          const tmOptions = tmSlot.locked
            ? [tmSlot.locked_value]
            : getVocabularyOptions(tmSlot.options_source, false).filter(t => !t.min_chapter || t.min_chapter <= ch.chapter)

          console.log(`  [${slot.id}] ${required} — pronouns per tense marker:`)
          for (const tm of tmOptions) {
            const pronounOpts = getOptionsForSlot(pattern, slot, { tense_marker: tm }, ch.chapter)
            const forms = pronounOpts.map(o => o.tongan).join(', ')
            const marker = pronounOpts.length === 0 ? ' *** EMPTY ***' : ''
            console.log(`    after "${tm.tongan}": [${pronounOpts.length}] ${forms}${marker}`)
            if (pronounOpts.length === 0) {
              issues.push(`Ch ${ch.chapter}, ${pattern.id}.${slot.id}: 0 pronouns after "${tm.tongan}"`)
            }
          }
        }
        continue
      }

      // For conditional slots
      if (slot.condition) {
        if (slot.condition.type === 'verb_has_tag') {
          // Check: does at least one verb at this chapter have the required tag?
          const verbSlot = pattern.slots.find(s => s.type === 'verb')
          if (verbSlot) {
            const verbOpts = getVocabularyOptions(verbSlot.options_source, false).filter(v => v.min_chapter <= ch.chapter)
            const tagged = verbOpts.filter(v => v.tags && v.tags.includes(slot.condition.tag))
            const condOpts = getOptionsForSlot(pattern, slot, { verb: tagged[0] || null }, ch.chapter)
            console.log(`  [${slot.id}] ${required} (condition: verb_has_tag="${slot.condition.tag}", ${tagged.length} matching verbs) — [${condOpts.length}] options`)
            if (condOpts.length > 0) {
              console.log(`    ${condOpts.map(o => o.tongan + ' (' + o.english + ')').join(', ')}`)
            }
            if (tagged.length === 0) {
              console.log(`    *** No verbs with tag "${slot.condition.tag}" at ch ${ch.chapter} ***`)
            }
          }
          continue
        }
      }

      // Standard slot
      const opts = getOptionsForSlot(pattern, slot, {}, ch.chapter)
      const marker = (opts.length === 0 && slot.required) ? ' *** EMPTY ***' : ''
      console.log(`  [${slot.id}] ${required} — [${opts.length}] options${marker}`)

      // Show items (compact for small sets, summary for large)
      if (opts.length <= 15) {
        console.log(`    ${opts.map(o => o.tongan + ' (' + o.english + ')').join(', ')}`)
      } else {
        // Show first 10 and last 3
        const shown = opts.slice(0, 10).map(o => o.tongan + ' (' + o.english + ')')
        shown.push(`... +${opts.length - 10} more`)
        console.log(`    ${shown.join(', ')}`)
      }

      if (opts.length === 0 && slot.required) {
        issues.push(`Ch ${ch.chapter}, ${pattern.id}.${slot.id}: 0 options`)
      }

      // Check for new vocabulary introduced in this chapter
      const newInChapter = opts.filter(o => o.min_chapter === ch.chapter)
      if (newInChapter.length > 0) {
        console.log(`    NEW in ch ${ch.chapter}: ${newInChapter.map(o => o.tongan).join(', ')}`)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${'='.repeat(72)}`)
console.log('ISSUE SUMMARY')
console.log(`${'='.repeat(72)}`)
if (issues.length === 0) {
  console.log('No issues found — all chapters clean.')
} else {
  issues.forEach(msg => console.log(`  ISSUE: ${msg}`))
}
