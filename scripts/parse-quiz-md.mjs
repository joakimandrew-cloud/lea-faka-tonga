#!/usr/bin/env node
/**
 * Parse a Notebook LM-format quiz markdown file into src/data/quizzes.json.
 *
 * Input format (per question block, separated by `---`):
 *
 *   ## Question N of 10
 *
 *   **The question prompt?**
 *
 *   - A. option text
 *     - *explanation for A*
 *   - B. option text
 *     - *explanation for B*
 *   - **C. option text ✓ — That's right!**
 *     - *explanation for C (the correct one)*
 *   - D. option text
 *     - *explanation for D*
 *
 * The correct option is wrapped in `**...**` and contains `✓ — That's right!`,
 * which we strip when extracting the visible text.
 *
 * Usage:
 *   node scripts/parse-quiz-md.mjs <chapterNum> <inputMdPath> [--title "..."]
 *
 * Merges into src/data/quizzes.json under the given chapter number, preserving
 * other chapters' quizzes.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const QUIZ_JSON_PATH = resolve(__dirname, '..', 'src', 'data', 'quizzes.json')

function parseArgs(argv) {
  const args = { chapter: null, input: null, title: null }
  const rest = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--title') {
      args.title = argv[++i]
    } else {
      rest.push(a)
    }
  }
  args.chapter = rest[0]
  args.input = rest[1]
  return args
}

function stripCorrectMarkers(text) {
  // Remove trailing "✓ — That's right!" (and small variations) and surrounding
  // bold markers if the whole thing was wrapped in **...**
  let t = text
  t = t.replace(/\*\*/g, '')
  t = t.replace(/\s*✓\s*[—–-]\s*That'?s right!?\s*$/u, '')
  t = t.replace(/\s*✓\s*$/, '')
  return t.trim()
}

function stripEmphasisMarkers(text) {
  return text.replace(/^\*+|\*+$/g, '').trim()
}

function parseBlock(block, qIndex) {
  const lines = block.split('\n')
  let prompt = null
  const options = []
  let pendingOption = null

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')

    // Prompt line: the first paragraph that is **bolded text** (and not an option)
    if (!prompt) {
      const m = line.match(/^\*\*(.+)\*\*\s*$/)
      if (m) {
        prompt = m[1].trim()
        continue
      }
    }

    // Option line: "- A. text" or "- **A. text ✓ — That's right!**"
    const optMatch = line.match(/^-\s+(?:\*\*)?([A-D])\.\s+(.+?)\s*$/)
    if (optMatch) {
      if (pendingOption) options.push(pendingOption)
      const label = optMatch[1]
      let rawText = optMatch[2]
      const correct = /✓/.test(rawText) || /\*\*[A-D]\.\s/.test(line)
      const text = stripCorrectMarkers(rawText)
      pendingOption = { label, text, correct, explanation: '' }
      continue
    }

    // Explanation line: "  - *explanation text*" (nested under the current option)
    const explMatch = line.match(/^\s{2,}-\s+(.+?)\s*$/)
    if (explMatch && pendingOption) {
      const expl = stripEmphasisMarkers(explMatch[1])
      pendingOption.explanation = pendingOption.explanation
        ? `${pendingOption.explanation} ${expl}`
        : expl
      continue
    }
  }

  if (pendingOption) options.push(pendingOption)

  if (!prompt) throw new Error(`Question ${qIndex + 1}: could not find prompt`)
  if (options.length !== 4) {
    throw new Error(
      `Question ${qIndex + 1}: expected 4 options, got ${options.length}`
    )
  }
  const correctCount = options.filter(o => o.correct).length
  if (correctCount !== 1) {
    throw new Error(
      `Question ${qIndex + 1}: expected exactly 1 correct option, got ${correctCount}`
    )
  }

  return {
    id: `q${qIndex + 1}`,
    prompt,
    options,
  }
}

function parseQuizMarkdown(md) {
  // Split on horizontal rules, drop any block that doesn't contain "## Question"
  const blocks = md.split(/\n---+\n/).filter(b => /##\s*Question/i.test(b))
  return blocks.map((block, i) => parseBlock(block, i))
}

function main() {
  const { chapter, input, title } = parseArgs(process.argv.slice(2))
  if (!chapter || !input) {
    console.error(
      'Usage: node scripts/parse-quiz-md.mjs <chapterNum> <inputMdPath> [--title "..."]'
    )
    process.exit(1)
  }

  const chapterNum = parseInt(chapter, 10)
  if (Number.isNaN(chapterNum)) {
    console.error(`Invalid chapter number: ${chapter}`)
    process.exit(1)
  }

  const inputPath = resolve(process.cwd(), input)
  if (!existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    process.exit(1)
  }

  const md = readFileSync(inputPath, 'utf8')
  const questions = parseQuizMarkdown(md)

  const existing = existsSync(QUIZ_JSON_PATH)
    ? JSON.parse(readFileSync(QUIZ_JSON_PATH, 'utf8'))
    : {}

  existing[String(chapterNum)] = {
    chapter: chapterNum,
    title: title || existing[String(chapterNum)]?.title || `Chapter ${chapterNum} Quiz`,
    questions,
  }

  writeFileSync(QUIZ_JSON_PATH, JSON.stringify(existing, null, 2) + '\n', 'utf8')

  console.log(
    `Wrote ${questions.length} questions for chapter ${chapterNum} → ${QUIZ_JSON_PATH}`
  )
}

main()
