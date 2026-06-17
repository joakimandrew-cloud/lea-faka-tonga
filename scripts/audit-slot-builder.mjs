#!/usr/bin/env node
/**
 * Audit script for the SlotBuilder sentence engine.
 *
 * For each chapter (1-52), for each available sentence pattern, checks:
 *   A. Required non-locked slots have >= 1 vocabulary option
 *   B. Every available tense marker has a key in pronoun_dependencies
 *   C. Tense markers that map to fewer than the full pronoun set
 *   D. Chapters with 0 taught patterns
 *
 * Usage:  node scripts/audit-slot-builder.mjs [--json]
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(__dirname, '../src/data')

const sentencePatterns = JSON.parse(readFileSync(resolve(dataDir, 'sentence-patterns.json'), 'utf-8'))
const vocabBySlot = JSON.parse(readFileSync(resolve(dataDir, 'vocabulary-by-slot.json'), 'utf-8'))
const chapters = JSON.parse(readFileSync(resolve(dataDir, 'chapters.json'), 'utf-8'))

const jsonMode = process.argv.includes('--json')

// ---------------------------------------------------------------------------
// Helpers (mirroring slot-engine.js logic)
// ---------------------------------------------------------------------------

function normalize(s) {
  return s.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'")
}

function makePronounOption(shortForm, data, code) {
  return {
    tongan: shortForm,
    english: data.subject_english,
    person: data.person,
    number: data.number,
    min_chapter: data.min_chapter,
  }
}

function flattenPronouns(hasDependencies) {
  const pronouns = vocabBySlot.pronouns
  const result = []
  for (const [code, data] of Object.entries(pronouns)) {
    if (code === '1sg') {
      if (hasDependencies) {
        const seen = new Set()
        for (const form of Object.values(data.short_forms)) {
          if (!seen.has(form)) {
            seen.add(form)
            result.push(makePronounOption(form, data, code))
          }
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
  if (Array.isArray(source)) {
    return source.flatMap(key => vocabBySlot[key] || [])
  }
  return []
}

function evaluateSlotCondition(condition, filledSlots) {
  if (!condition) return true
  if (condition.type === 'verb_has_tag') {
    const verb = filledSlots.verb
    if (!verb || !verb.tags) return false
    return verb.tags.includes(condition.tag)
  }
  return true
}

function getOptionsForSlot(pattern, slot, filledSlots, maxChapter) {
  if (slot.locked) return slot.locked_value ? [slot.locked_value] : []

  const hasDeps = !!pattern.pronoun_dependencies
  let options = getVocabularyOptions(slot.options_source, hasDeps)

  // Chapter gate
  options = options.filter(opt => !opt.min_chapter || opt.min_chapter <= maxChapter)

  // Pronoun dependency filtering
  if (slot.depends_on === 'tense_marker' && slot.type === 'pronoun' && pattern.pronoun_dependencies) {
    const tm = filledSlots.tense_marker
    if (tm) {
      const tmKey = normalize(tm.tongan)
      let validForms = null
      for (const [key, values] of Object.entries(pattern.pronoun_dependencies)) {
        if (normalize(key) === tmKey) {
          validForms = values
          break
        }
      }
      if (validForms) {
        options = options.filter(opt => validForms.includes(opt.tongan))
      }
    }
  }

  if (slot.condition && !evaluateSlotCondition(slot.condition, filledSlots)) {
    return []
  }

  return options
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

const ALL_PRONOUNS = ['ku', 'ke', 'ne', 'nau', 'mau', 'tau', 'mou', 'na', 'ma', 'ta', 'mo']

const critical = []
const warnings = []
const info = []

const patterns = sentencePatterns.patterns

// Check A & B & C: per-chapter, per-pattern checks
for (let ch = 1; ch <= 52; ch++) {
  const available = patterns.filter(p => p.min_chapter <= ch)

  for (const pattern of available) {
    // Check A: Required non-locked slots with 0 options
    for (const slot of pattern.slots) {
      if (slot.locked || !slot.required) continue

      // For conditional slots, check if the condition CAN be met
      if (slot.condition && slot.condition.type === 'verb_has_tag') {
        // Check if any verb with the required tag exists at this chapter
        const verbSlot = pattern.slots.find(s => s.type === 'verb')
        if (verbSlot) {
          const verbOptions = getVocabularyOptions(verbSlot.options_source, false)
            .filter(v => v.min_chapter <= ch)
          const hasTaggedVerb = verbOptions.some(v => v.tags && v.tags.includes(slot.condition.tag))
          if (!hasTaggedVerb) continue // Condition can't be met, so slot won't appear
        }
      }

      // For pronoun slots with dependencies, check with each available tense marker
      if (slot.depends_on === 'tense_marker' && slot.type === 'pronoun' && pattern.pronoun_dependencies) {
        const tmSlot = pattern.slots.find(s => s.id === 'tense_marker')
        if (tmSlot) {
          const tmOptions = getVocabularyOptions(tmSlot.options_source, false)
            .filter(t => !t.min_chapter || t.min_chapter <= ch)
          for (const tm of tmOptions) {
            const pronounOptions = getOptionsForSlot(pattern, slot, { tense_marker: tm }, ch)
            if (pronounOptions.length === 0) {
              critical.push(`Ch ${ch}, ${pattern.id}.${slot.id}: 0 pronoun options after TM "${tm.tongan}"`)
            }
          }
        }
        continue // Already checked with each TM
      }

      // For slots without dependencies
      if (!slot.depends_on) {
        const options = getOptionsForSlot(pattern, slot, {}, ch)
        if (options.length === 0) {
          critical.push(`Ch ${ch}, ${pattern.id}.${slot.id}: 0 options (source: ${JSON.stringify(slot.options_source)})`)
        }
      }
    }

    // Check B: Missing tense marker keys in pronoun_dependencies
    if (pattern.pronoun_dependencies) {
      const tmSlot = pattern.slots.find(s => s.id === 'tense_marker')
      if (tmSlot) {
        const tmOptions = getVocabularyOptions(tmSlot.options_source, false)
          .filter(t => !t.min_chapter || t.min_chapter <= ch)
        const depKeys = Object.keys(pattern.pronoun_dependencies).map(k => normalize(k))
        for (const tm of tmOptions) {
          const tmKey = normalize(tm.tongan)
          if (!depKeys.includes(tmKey)) {
            // Only report once per pattern (not per chapter)
            if (ch === Math.max(tm.min_chapter || 1, pattern.min_chapter)) {
              warnings.push(`${pattern.id}: missing "${tm.tongan}" from pronoun_dependencies (available from ch ${tm.min_chapter || 1})`)
            }
          }
        }
      }

      // Check C: Tense markers with restricted pronoun sets
      if (ch === pattern.min_chapter) {
        for (const [tmKey, pronouns] of Object.entries(pattern.pronoun_dependencies)) {
          if (pronouns.length < ALL_PRONOUNS.length) {
            const missing = ALL_PRONOUNS.filter(p => !pronouns.includes(p))
            warnings.push(`${pattern.id}: "${tmKey}" maps to ${pronouns.length}/${ALL_PRONOUNS.length} pronouns (missing: ${missing.join(', ')})`)
          }
        }
      }
    }
  }
}

// Check D: Chapters with 0 taught patterns
for (let ch = 1; ch <= 52; ch++) {
  const taught = patterns.filter(p => p.book_chapters && p.book_chapters.includes(ch))
  const cumulative = patterns.filter(p => p.min_chapter <= ch)
  if (taught.length === 0) {
    info.push(`Ch ${ch}: 0 taught patterns (${cumulative.length} cumulative available)`)
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

if (jsonMode) {
  console.log(JSON.stringify({ critical, warnings, info }, null, 2))
} else {
  // Deduplicate critical (same issue across chapters)
  const uniqueCritical = [...new Set(critical)]
  const uniqueWarnings = [...new Set(warnings)]

  console.log('=== CRITICAL BUGS (required slots with 0 options) ===')
  if (uniqueCritical.length === 0) {
    console.log('  None found!')
  } else {
    uniqueCritical.forEach(msg => console.log(`  ${msg}`))
  }

  console.log('\n=== WARNINGS (pronoun dependency issues) ===')
  if (uniqueWarnings.length === 0) {
    console.log('  None found!')
  } else {
    uniqueWarnings.forEach(msg => console.log(`  ${msg}`))
  }

  console.log('\n=== INFO (chapters with no taught patterns) ===')
  info.forEach(msg => console.log(`  ${msg}`))

  console.log('\n=== SUMMARY ===')
  console.log(`  Patterns audited: ${patterns.length}`)
  console.log(`  Chapters audited: 52`)
  console.log(`  Critical issues: ${uniqueCritical.length}`)
  console.log(`  Warnings: ${uniqueWarnings.length}`)
  console.log(`  Chapters with no taught patterns: ${info.length}`)
}
