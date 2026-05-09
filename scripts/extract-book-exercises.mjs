#!/usr/bin/env node
/**
 * Parse /book/Chapter-NN.md files and extract their Exercises sections into
 * lea-faka-tonga-app/src/data/book-exercises.json.
 *
 * The markdown format across all 55 chapters is reasonably consistent:
 *
 *   ### Exercises
 *
 *   **Exercise 1: <description>**
 *
 *   1. <prompt>
 *   2. <prompt>
 *   ...
 *
 *   **Exercise 2: ...**
 *   ...
 *
 *   ---
 *
 *   ### Exercise Answers
 *
 *   **Exercise 1**
 *
 *   1. <answer>
 *   2. <answer>
 *   ...
 *
 * This script classifies each exercise as one of:
 *   - translate_to_english   (prompt is Tongan, answer is English)
 *   - translate_to_tongan    (prompt is English, answer is Tongan)
 *   - fill_blank             (prompt contains ___ or "Fill in"/"Complete")
 *   - free                   (fallback — prompt is shown as-is, answer is the
 *                             stored answer, user checks themselves)
 *
 * Each exercise item is stored as { id, prompt, answer }. The component
 * decides how to render based on the parent exercise's type.
 *
 * Run with:
 *   node scripts/extract-book-exercises.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BOOK_DIR = path.resolve(__dirname, '..', '..', 'book')
const OUT_FILE = path.resolve(__dirname, '..', 'src', 'data', 'book-exercises.json')

// ---------------------------------------------------------------------------
// Markdown parsing
// ---------------------------------------------------------------------------

/**
 * Strip markdown italics (*...*) for display while preserving the text.
 * We keep the asterisks in the source but the UI component will render them.
 */
function cleanText(s) {
  return s.replace(/\s+$/g, '').replace(/^\s+/g, '')
}

/**
 * Split a markdown exercise section into numbered items.
 * Handles both "1. ..." and "1\\. ..." and multi-line items.
 */
function splitNumberedItems(block) {
  const lines = block.split(/\n/)
  const items = []
  let current = null
  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+(.*)$/)
    if (match) {
      if (current) items.push(cleanText(current.text))
      current = { num: parseInt(match[1], 10), text: match[2] }
    } else if (current && line.trim() !== '') {
      // Continuation of the previous item
      current.text += ' ' + line.trim()
    }
  }
  if (current) items.push(cleanText(current.text))
  return items
}

/**
 * Extract the Exercises section and the (Exercise )Answers section from a
 * chapter's markdown text. Returns { exercisesBlock, answersBlock } or null.
 *
 * Handles both heading styles seen across the 55 chapters:
 *   "### Exercises"         + "### Exercise Answers"
 *   "### Exercises"         + "### Answers"
 */
function splitExercisesAndAnswers(md) {
  const exMatch = md.match(/###\s+Exercises\s*\n([\s\S]*?)(?=###\s+(?:Exercise\s+)?Answers|$)/)
  if (!exMatch) return null
  const exercisesBlock = exMatch[1]

  const ansMatch = md.match(/###\s+(?:Exercise\s+)?Answers\s*\n([\s\S]*)$/)
  const answersBlock = ansMatch ? ansMatch[1] : ''

  return { exercisesBlock, answersBlock }
}

/**
 * Within an Exercises or Answers block, split into per-exercise sub-blocks
 * keyed by exercise number. Handles three heading styles observed across
 * the book:
 *
 *   **Exercise 1: Title**          (bold, used in ~early chapters)
 *   **Exercise 1:**                (bold w/ trailing colon, used in answer sections)
 *   #### Exercise 1: Title         (h4 heading, used in later chapters)
 */
function splitByExercise(block) {
  const result = {}
  const headingRe = /(?:\*\*Exercise\s+(\d+)(?::\s*(.*?))?\*\*:?|####\s+Exercise\s+(\d+)(?::\s*(.*?))?(?=\n))/g
  const markers = []
  let m
  while ((m = headingRe.exec(block)) !== null) {
    const num = parseInt(m[1] || m[3], 10)
    const title = (m[2] || m[4] || '').trim()
    markers.push({ num, title, start: m.index, end: m.index + m[0].length })
  }
  for (let i = 0; i < markers.length; i++) {
    const mk = markers[i]
    const nextStart = i + 1 < markers.length ? markers[i + 1].start : block.length
    const body = block.slice(mk.end, nextStart)
    // Preserve an existing entry's title if the later marker has none
    // (common in answer sections: "**Exercise 1**" bare, no title).
    if (!result[mk.num] || (mk.title && !result[mk.num].title)) {
      result[mk.num] = { title: mk.title || (result[mk.num]?.title || ''), body }
    } else {
      result[mk.num] = { title: result[mk.num].title, body }
    }
  }
  return result
}

/**
 * Classify an exercise into a type based on its title / heading.
 */
function classify(title, body) {
  const t = (title || '').toLowerCase()
  if (/translate.*\btongan\b.*\benglish\b/.test(t) || /translate\s+into\s+english/.test(t)) {
    return 'translate_to_english'
  }
  if (/translate.*\benglish\b.*\btongan\b/.test(t) || /translate\s+into\s+tongan/.test(t)) {
    return 'translate_to_tongan'
  }
  if (/fill\s+in/.test(t) || /complete\s+each/.test(t) || /complete\s+the/.test(t)) {
    return 'fill_blank'
  }
  // Heuristic: if any prompt contains ___ treat as fill_blank
  if (/___/.test(body || '')) return 'fill_blank'
  // Otherwise generic
  return 'free'
}

// ---------------------------------------------------------------------------
// Main extraction per chapter
// ---------------------------------------------------------------------------

function extractChapter(chapterNum, md) {
  const split = splitExercisesAndAnswers(md)
  if (!split) return []
  const exercises = splitByExercise(split.exercisesBlock)
  const answers = splitByExercise(split.answersBlock)

  const output = []
  for (const [num, ex] of Object.entries(exercises)) {
    const prompts = splitNumberedItems(ex.body)
    const ans = answers[num]
    const answerItems = ans ? splitNumberedItems(ans.body) : []
    const type = classify(ex.title, ex.body)

    const items = prompts.map((prompt, i) => ({
      id: `ch${chapterNum}-ex${num}-${i + 1}`,
      prompt,
      answer: answerItems[i] || null,
    }))

    output.push({
      id: `ch${chapterNum}-ex${num}`,
      number: parseInt(num, 10),
      title: ex.title,
      type,
      items,
    })
  }
  return output
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const all = {}
for (let n = 1; n <= 55; n++) {
  const file = path.join(BOOK_DIR, `Chapter-${String(n).padStart(2, '0')}.md`)
  if (!fs.existsSync(file)) {
    console.warn(`[skip] missing: ${file}`)
    continue
  }
  const md = fs.readFileSync(file, 'utf8')
  const exercises = extractChapter(n, md)
  all[n] = exercises
}

fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2) + '\n', 'utf8')

// Summary
let totalExercises = 0
let totalItems = 0
const typeCounts = {}
for (const chExs of Object.values(all)) {
  for (const ex of chExs) {
    totalExercises++
    totalItems += ex.items.length
    typeCounts[ex.type] = (typeCounts[ex.type] || 0) + 1
  }
}
console.log(`Wrote ${OUT_FILE}`)
console.log(`Chapters: ${Object.keys(all).length}`)
console.log(`Exercises: ${totalExercises}`)
console.log(`Items: ${totalItems}`)
console.log('Types:', typeCounts)
