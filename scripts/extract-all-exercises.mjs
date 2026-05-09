#!/usr/bin/env node
// Extract every prompt/answer pair from the four markdown exercise surfaces:
//
//   book-exercise   — book/Chapter-NN.md "### Exercises" + "### (Exercise) Answers"
//   quick-practice  — book/Chapter-NN.md "### Quick Practice X: ..." with inline "**Answers:** ..."
//   workbook        — workbook/Chapter-NN-Workbook.md "## Section M: ..." > "### Exercise M.N — ..."
//                     paired against "## Answer Key" > "### Exercise M.N"
//   quiz            — quizzes/tongan_grammar_quiz_chNN.md "## Question K of 10" with options A-D
//
// Drill prompts (lea-faka-tonga-app/src/drills/*Core.jsx) are not extracted here;
// they are scanned in source by validate-drill-map.mjs for forward-grammar.
//
// Output: audits/all-exercises.json
//   { summary: { totalItems, bySurface, byChapter }, items: [...] }
//
// Each item: { id, chapter, surface, exerciseId, itemIndex, prompt, answer,
//              exerciseMeta?, options?, surfaceLocation, parseFlags? }
//
// Run:  node lea-faka-tonga-app/scripts/extract-all-exercises.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')
const BOOK_DIR = path.join(REPO_ROOT, 'book')
const WORKBOOK_DIR = path.join(REPO_ROOT, 'workbook')
const QUIZ_DIR = path.join(REPO_ROOT, 'quizzes')
const OUT_FILE = path.join(REPO_ROOT, 'audits', 'all-exercises.json')

const CHAPTER_RANGE = { min: 1, max: 55 }

// ── Shared helpers ─────────────────────────────────────────────────────────

function readIfExists(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null
}

function paddedChapter(n) {
  return String(n).padStart(2, '0')
}

function lineNumberOf(src, idx) {
  let n = 1
  for (let i = 0; i < idx && i < src.length; i++) if (src[i] === '\n') n++
  return n
}

// Numbered-list splitter that handles continuation lines.
// Input: a block of markdown that contains "1. foo\n2. bar\n  bar continued\n".
// Output: [{ num: 1, text: "foo" }, { num: 2, text: "bar bar continued" }]
function splitNumberedItems(block) {
  const out = []
  let cur = null
  for (const raw of block.split(/\n/)) {
    const m = raw.match(/^(\d+)\.\s+(.*)$/)
    if (m) {
      if (cur) out.push(cur)
      cur = { num: parseInt(m[1], 10), text: m[2].trim() }
    } else if (cur && raw.trim() !== '' && !raw.startsWith('#') && !raw.startsWith('---')) {
      cur.text += ' ' + raw.trim()
    } else if (raw.trim() === '' || raw.startsWith('---') || raw.startsWith('#')) {
      // Blank or boundary — current item ends at next item or EOF.
    }
  }
  if (cur) out.push(cur)
  return out
}

// Inline answer parser for "**Answers:** 1. foo — 2. bar — 3. baz".
// Splits on the em-dash separator; if a numbered piece is missing a number,
// preserves the position by inferring it from the previous one.
function splitInlineAnswers(line) {
  const after = line.replace(/^\*\*Answers?:\*\*\s*/, '')
  const pieces = after.split(/\s+[—–-]\s+/) // em-dash, en-dash, or hyphen
  const out = []
  for (const piece of pieces) {
    const m = piece.match(/^(\d+)\.\s*(.*)$/)
    if (m) {
      out.push({ num: parseInt(m[1], 10), text: m[2].trim() })
    } else if (out.length) {
      // Continuation of the previous answer (rare).
      out[out.length - 1].text += ' — ' + piece.trim()
    }
  }
  return out
}

// ── 1. Book exercises ──────────────────────────────────────────────────────
//
// Mirrors extract-book-exercises.mjs, but emits flat items rather than the
// nested per-chapter shape. Kept in lockstep with the existing extractor's
// regex so any drift surfaces here too.

function splitExercisesAndAnswers(md) {
  const exMatch = md.match(/###\s+Exercises\s*\n([\s\S]*?)(?=###\s+(?:Exercise\s+)?Answers|$)/)
  if (!exMatch) return null
  const ansMatch = md.match(/###\s+(?:Exercise\s+)?Answers\s*\n([\s\S]*)$/)
  return {
    exercisesBlock: exMatch[1],
    exercisesStart: exMatch.index + exMatch[0].indexOf(exMatch[1]),
    answersBlock: ansMatch ? ansMatch[1] : '',
  }
}

function splitByExercise(block) {
  const out = {}
  const headingRe = /(?:\*\*Exercise\s+(\d+)(?::\s*(.*?))?\*\*:?|####\s+Exercise\s+(\d+)(?::\s*(.*?))?(?=\n))/g
  const markers = []
  let m
  while ((m = headingRe.exec(block)) !== null) {
    markers.push({
      num: parseInt(m[1] || m[3], 10),
      title: (m[2] || m[4] || '').trim(),
      start: m.index,
      end: m.index + m[0].length,
    })
  }
  for (let i = 0; i < markers.length; i++) {
    const mk = markers[i]
    const nextStart = i + 1 < markers.length ? markers[i + 1].start : block.length
    const body = block.slice(mk.end, nextStart)
    if (!out[mk.num] || (mk.title && !out[mk.num].title)) {
      out[mk.num] = { title: mk.title || (out[mk.num]?.title || ''), body }
    } else {
      out[mk.num] = { title: out[mk.num].title, body }
    }
  }
  return out
}

function classifyBookExercise(title, body) {
  const t = (title || '').toLowerCase()
  if (/translate.*\btongan\b.*\benglish\b/.test(t) || /translate\s+into\s+english/.test(t)) return 'translate_to_english'
  if (/translate.*\benglish\b.*\btongan\b/.test(t) || /translate\s+into\s+tongan/.test(t)) return 'translate_to_tongan'
  if (/fill\s+in/.test(t) || /complete\s+each/.test(t) || /complete\s+the/.test(t)) return 'fill_blank'
  if (/___/.test(body || '')) return 'fill_blank'
  return 'free'
}

function extractBookExercises(chapter, md, file) {
  const split = splitExercisesAndAnswers(md)
  if (!split) return []
  const exercises = splitByExercise(split.exercisesBlock)
  const answers = splitByExercise(split.answersBlock)
  const items = []
  for (const [numStr, ex] of Object.entries(exercises)) {
    const num = parseInt(numStr, 10)
    const prompts = splitNumberedItems(ex.body)
    const answerEntry = answers[num]
    const answerBody = answerEntry ? answerEntry.body : ''
    const answerItems = answerEntry ? splitNumberedItems(answerBody) : []
    // "Match a-e to 1-5" exercises encode answers as "a: 3", "b. 1", etc.
    // splitNumberedItems can't see those, so without this branch every prompt
    // gets a spurious missing-answer flag. Mirror Quick Practice's
    // matching-format treatment: store the full answer body on each prompt
    // and tag the items so validators know it's not a 1-to-1 numbered match.
    const isLetterKeyed = answerEntry &&
      answerItems.length === 0 &&
      /^[a-z][.:]\s*\d/m.test(answerBody)
    const type = classifyBookExercise(ex.title, ex.body)
    const exerciseId = `ch${chapter}-bx-${num}`
    for (const p of prompts) {
      const a = answerItems.find(x => x.num === p.num)
      const flags = []
      let ansText = null
      if (a) {
        ansText = a.text
      } else if (isLetterKeyed) {
        ansText = answerBody.trim().slice(0, 400)
        flags.push('matching-format')
      } else {
        flags.push('missing-answer')
      }
      items.push({
        id: `${exerciseId}-${p.num}`,
        chapter,
        surface: 'book-exercise',
        exerciseId,
        itemIndex: p.num,
        prompt: p.text,
        answer: ansText,
        exerciseMeta: { type, title: ex.title },
        surfaceLocation: `${path.relative(REPO_ROOT, file)}#exercise-${num}`,
        parseFlags: flags,
      })
    }
  }
  return items
}

// ── 2. Quick Practice blocks ───────────────────────────────────────────────
//
// Block shape:
//   ### Quick Practice A: Topic
//   [optional instruction line(s)]
//   1. item
//   2. item
//   ...
//   **Answers:** 1. ans — 2. ans — ...
//
// The "Answers:" line ends the block. The numbered list lives between the
// instruction text and the answers line.

function extractQuickPractice(chapter, md, file) {
  const items = []
  const re = /^###\s+Quick Practice\s+([A-Z]):\s*(.+)$/gm
  const matches = []
  let m
  while ((m = re.exec(md)) !== null) {
    matches.push({ letter: m[1], topic: m[2].trim(), start: m.index, headerEnd: m.index + m[0].length })
  }
  for (let i = 0; i < matches.length; i++) {
    const mk = matches[i]
    // Block ends at next QP, next H3 of any kind, or chapter section divider.
    const tailRe = /\n(?:###\s+|---\s*\n)/g
    tailRe.lastIndex = mk.headerEnd
    const next = tailRe.exec(md)
    const blockEnd = next ? next.index : md.length
    const body = md.slice(mk.headerEnd, blockEnd)

    // Find the answers line.
    const ansLineMatch = body.match(/^\*\*Answers?:\*\*\s+(.*)$/m)
    const beforeAnswers = ansLineMatch ? body.slice(0, ansLineMatch.index) : body
    const prompts = splitNumberedItems(beforeAnswers)
    const ansLineRaw = ansLineMatch ? ansLineMatch[0].replace(/^\*\*Answers?:\*\*\s+/, '') : ''
    const answers = ansLineMatch ? splitInlineAnswers(ansLineMatch[0]) : []
    // Matching exercises encode answers as letter→number ("a. 4 — b. 3 — ...").
    // splitInlineAnswers only finds digit-keyed entries, so for those blocks
    // it returns nothing usable. Store the full answer line on each prompt
    // and tag with `matching-format` so validators know it's not a 1-to-1 map.
    const isLetterKeyed = !!ansLineMatch && /^[a-z]\.\s+\d/.test(ansLineRaw)

    const exerciseId = `ch${chapter}-qp-${mk.letter}`
    for (const p of prompts) {
      const a = answers.find(x => x.num === p.num)
      const flags = []
      let ansText = a ? a.text : null
      if (!a && isLetterKeyed) {
        ansText = ansLineRaw
        flags.push('matching-format')
      } else if (!a) {
        flags.push('missing-answer')
      }
      items.push({
        id: `${exerciseId}-${p.num}`,
        chapter,
        surface: 'quick-practice',
        exerciseId,
        itemIndex: p.num,
        prompt: p.text,
        answer: ansText,
        exerciseMeta: { letter: mk.letter, topic: mk.topic },
        surfaceLocation: `${path.relative(REPO_ROOT, file)}:${lineNumberOf(md, mk.start)}`,
        parseFlags: flags,
      })
    }
  }
  return items
}

// ── 3. Workbook exercises ──────────────────────────────────────────────────
//
// Workbook structure:
//   # Chapter N Workbook: Title
//   ## Section M: ...
//   ### Exercise M.N — Description
//     [optional instruction text]
//     1. item
//     ...
//   ## Answer Key
//   ### Exercise M.N
//     [answer items in any of: numbered list, inline "1. a — 2. b", or prose]

function splitWorkbookExercises(block) {
  // Accept all four heading shapes seen in the corpus:
  //   "### Exercise 1.1 — Translate ..."   (most common)
  //   "### Exercise 8"                     (no sub-number, short title)
  //   "### Exercise 10 (Self-Check Quiz)"  (parenthesized title)
  //   "### Exercise 9.2 - Read aloud"      (ASCII-dash variant)
  // The trailing `[ \t]*$` (not `\s*$`) is critical: JavaScript's `\s`
  // includes `\n`, so a `\s*$` would let the title-capture group span into
  // the next line and silently swallow the first answer-list row. That bug
  // showed up as ~8,500 spurious missing-answer flags.
  //
  // We also accept "## Section N: ..." H2 markers as virtual exercises with
  // number=0, but only when that section has NO `### Exercise N.M` sub-marker
  // inside it. Section 10 (Cumulative Review) and Section 11 (Self-Check Quiz)
  // routinely contain bare numbered lists with no sub-exercise heading; those
  // items used to bundle into the previous Exercise X.Y, generating ~250
  // spurious missing-answer flags. The Answer Key block already uses
  // "### Exercise N (Cumulative Review)" / "### Exercise N (Self-Check Quiz)"
  // (which the regex above captures with section=N, number=0), so a virtual
  // section entry on the exercise side now lines up with its real answer.
  const out = []
  // Most workbook chapters use "### Exercise N(.M)" headings, but Chapters
  // 18–21 use "### Section 10 (Cumulative Review)" / "### Section 11 (Self-Check Quiz)"
  // in their Answer Key blocks for sections that have no `### Exercise N.M`
  // sub-marker. Treat both keywords identically.
  const headingRe = /^###[ \t]+(?:Exercise|Section)[ \t]+(\d+)(?:\.(\d+))?(?:[ \t]+([^\n]*?))?[ \t]*$/gm
  let m
  while ((m = headingRe.exec(block)) !== null) {
    let title = (m[3] || '').trim()
    // Strip leading dash/em-dash separator if present.
    title = title.replace(/^[—–-]\s*/, '').trim()
    // If the title is bare parens "(text)", keep the inner text.
    const parenMatch = title.match(/^\(([^)]+)\)\s*$/)
    if (parenMatch) title = parenMatch[1].trim()
    out.push({
      kind: 'exercise',
      section: parseInt(m[1], 10),
      number: m[2] === undefined ? 0 : parseInt(m[2], 10),
      title,
      start: m.index,
      headerEnd: m.index + m[0].length,
    })
  }
  const sectionRe = /^##[ \t]+Section[ \t]+(\d+):[ \t]*([^\n]*?)[ \t]*$/gm
  while ((m = sectionRe.exec(block)) !== null) {
    out.push({
      kind: 'section',
      section: parseInt(m[1], 10),
      number: 0,
      title: (m[2] || '').trim(),
      start: m.index,
      headerEnd: m.index + m[0].length,
    })
  }
  out.sort((a, b) => a.start - b.start)
  for (let i = 0; i < out.length; i++) {
    const cur = out[i]
    const nextStart = i + 1 < out.length ? out[i + 1].start : block.length
    cur.body = block.slice(cur.headerEnd, nextStart)
  }
  // Drop section markers whose section already has a `### Exercise N.M`
  // sub-heading — those sections are handled by their sub-exercises and the
  // section-level body would just be the prose intro.
  const sectionsWithExercises = new Set(
    out.filter(x => x.kind === 'exercise').map(x => x.section)
  )
  return out
    .filter(x => x.kind === 'exercise' || !sectionsWithExercises.has(x.section))
    .map(({ kind, ...rest }) => rest)
}

function classifyWorkbookExercise(title, body) {
  const t = (title || '').toLowerCase()
  if (/translate.*tongan.*english/i.test(t) || /tongan\s+→\s+english/i.test(t)) return 'translate_to_english'
  if (/translate.*english.*tongan/i.test(t) || /english\s+→\s+tongan/i.test(t)) return 'translate_to_tongan'
  // fill_blank requires an explicit title cue — body-only inference
  // misclassifies mixed exercises (e.g. Self-Check Quiz where one item has
  // a blank and the rest are translation prompts). "complete" must lead the
  // title — a parenthetical "(completed state)" inside a translate exercise
  // (Ch 30 Ex 3.5: "Translate with kae'oua kuo (completed state)") used to
  // fire fill_blank and produced 4 fill-blank-missing false positives.
  if (/^fill\s+in/.test(t) || /^complete/.test(t)) return 'fill_blank'
  if (/match/i.test(t)) return 'matching'
  if (/spot the error/i.test(t) || /correct/.test(t)) return 'error_correction'
  if (/dialogue/i.test(t)) return 'dialogue'
  if (/build|substitut|swap/i.test(t)) return 'pattern_drill'
  if (/pronunciation/i.test(t)) return 'pronunciation'
  return 'free'
}

function parseWorkbookAnswerBody(body) {
  // Inline-dash answer lines look like "1. eat — 2. drink — 3. go" on a
  // single line. Detect those before falling back to multi-line numbered
  // parsing — otherwise splitNumberedItems collapses the whole thing into
  // a single item with the rest as continuation text.
  const lines = body.split(/\n/).map(s => s.trim()).filter(Boolean)
  for (const line of lines) {
    if (/^1\.\s/.test(line) && /\s+[—–-]\s+\d+\.\s/.test(line)) {
      return splitInlineAnswers('**Answers:** ' + line)
    }
  }
  const numbered = splitNumberedItems(body)
  if (numbered.length) return numbered
  return []
}

function extractWorkbook(chapter, md, file) {
  const items = []
  // Split on "## Answer Key" — anything before is exercises, after is answers.
  const splitAt = md.search(/^##\s+Answer\s+Key\s*$/m)
  if (splitAt === -1) return items // no answer key — emit nothing for this chapter
  const exercisesBlock = md.slice(0, splitAt)
  const answersBlock = md.slice(splitAt)

  const exercises = splitWorkbookExercises(exercisesBlock)
  const answers = splitWorkbookExercises(answersBlock)
  const answerByKey = new Map(answers.map(a => [`${a.section}.${a.number}`, a]))

  for (const ex of exercises) {
    const key = `${ex.section}.${ex.number}`
    const prompts = splitNumberedItems(ex.body)
    const ansEntry = answerByKey.get(key)
    const answers = ansEntry ? parseWorkbookAnswerBody(ansEntry.body) : []
    // Some exercises (dialogues, pronunciation drills, "Spot the error") have
    // prose answer keys rather than numbered lists. The answer block exists
    // but parseWorkbookAnswerBody returns []. Treat those as "answered with
    // prose" rather than "missing answer" so they don't flood the major-
    // severity flag count.
    const ansBlockPresent = !!ansEntry
    // Pronunciation drills use "### Exercise 9.1 — No written answer." with
    // an empty body; the title carries the explanation. Falling back to the
    // title when the body is empty turns those into prose-answer entries
    // (filtered out as parser sentinels) instead of spurious missing-answer
    // findings.
    const proseAnswer = ansBlockPresent && answers.length === 0
      ? (ansEntry.body.trim() || (ansEntry.title || '').trim()).slice(0, 400)
      : null
    const type = classifyWorkbookExercise(ex.title, ex.body)
    const exerciseId = `ch${chapter}-wb-${ex.section}-${ex.number}`

    if (prompts.length === 0) {
      // No numbered items — could be a matching table or prose-only exercise.
      items.push({
        id: `${exerciseId}-0`,
        chapter,
        surface: 'workbook',
        exerciseId,
        itemIndex: 0,
        prompt: ex.body.trim().slice(0, 400),
        answer: ansEntry ? ansEntry.body.trim().slice(0, 400) : null,
        exerciseMeta: { type, title: ex.title, section: ex.section, number: ex.number },
        surfaceLocation: `${path.relative(REPO_ROOT, file)}:${lineNumberOf(md, ex.start)}`,
        parseFlags: ['no-numbered-items'],
      })
      continue
    }

    for (const p of prompts) {
      const a = answers.find(x => x.num === p.num)
      const flags = []
      let ansText = null
      if (a) {
        ansText = a.text
      } else if (proseAnswer) {
        ansText = proseAnswer
        flags.push('prose-answer')
      } else if (ex.section === 9) {
        // Section 9 is "Pronunciation Drill" across every chapter. These are
        // oral exercises that intentionally have no written answer; some
        // chapters write "No written answer." in the answer key (handled
        // above via the title fallback), but Ch 19/21 just omit the answer
        // entry entirely. Treat the prompt as answered with prose so it
        // doesn't surface as a missing-answer finding.
        ansText = 'No written answer (pronunciation drill).'
        flags.push('prose-answer')
      } else {
        flags.push('missing-answer')
      }
      items.push({
        id: `${exerciseId}-${p.num}`,
        chapter,
        surface: 'workbook',
        exerciseId,
        itemIndex: p.num,
        prompt: p.text,
        answer: ansText,
        exerciseMeta: { type, title: ex.title, section: ex.section, number: ex.number },
        surfaceLocation: `${path.relative(REPO_ROOT, file)}:${lineNumberOf(md, ex.start)}`,
        parseFlags: flags,
      })
    }
  }
  return items
}

// ── 4. Quizzes ─────────────────────────────────────────────────────────────
//
// Quiz format:
//   ## Question K of 10
//   **Question text**
//   - A. option
//     - *rationale*
//   - **B. option ✓ — That's right!**
//     - *rationale*
//   - C. option
//     - *rationale*
//   - D. option
//     - *rationale*

function extractQuiz(chapter, md, file) {
  const items = []
  const qRe = /^##\s+Question\s+(\d+)\s+of\s+\d+\s*$/gm
  const markers = []
  let m
  while ((m = qRe.exec(md)) !== null) {
    markers.push({ num: parseInt(m[1], 10), start: m.index, headerEnd: m.index + m[0].length })
  }
  for (let i = 0; i < markers.length; i++) {
    const mk = markers[i]
    const next = i + 1 < markers.length ? markers[i + 1].start : md.length
    const block = md.slice(mk.headerEnd, next)

    // Question text: the next bold line (** ... **) before option list.
    const qTextMatch = block.match(/^\s*\*\*([^*]+(?:\*[^*]+)*?)\*\*\s*$/m)
    const questionText = qTextMatch ? qTextMatch[1].trim() : ''

    // Options: "- A. ..." or "- **A. ...** "
    const optionRe = /^-\s+(?:\*\*)?([A-D])\.\s+(.+?)(?:\*\*)?\s*$/gm
    const options = []
    let om
    while ((om = optionRe.exec(block)) !== null) {
      const letter = om[1]
      let text = om[2]
      const isCorrect = /✓/.test(text) || /\*\*[A-D]\.\s/.test(om[0])
      // Strip "✓ — That's right!" tail.
      text = text.replace(/\s*✓\s*[—–-]\s*That'?s right!?\*?\*?\s*$/, '').replace(/\s*\*+\s*$/, '').trim()
      // Find the rationale in the line that follows (starts with "  - *")
      const afterOption = block.slice(om.index + om[0].length)
      const ratMatch = afterOption.match(/^\s*-\s*\*([^\n]+?)\*\s*$/m)
      const rationale = ratMatch ? ratMatch[1].trim() : null
      options.push({ letter, text, isCorrect, rationale })
    }

    const correct = options.find(o => o.isCorrect)
    const exerciseId = `ch${chapter}-qz-${mk.num}`
    items.push({
      id: `${exerciseId}-1`,
      chapter,
      surface: 'quiz',
      exerciseId,
      itemIndex: 1,
      prompt: questionText,
      answer: correct ? correct.text : null,
      options,
      exerciseMeta: { type: 'mcq' },
      surfaceLocation: `${path.relative(REPO_ROOT, file)}:${lineNumberOf(md, mk.start)}`,
      parseFlags: correct ? [] : ['no-correct-marked'],
    })
  }
  return items
}

// ── Main ──────────────────────────────────────────────────────────────────

function main() {
  const allItems = []
  const surfaceCounts = {}
  const chapterCounts = {}

  for (let n = CHAPTER_RANGE.min; n <= CHAPTER_RANGE.max; n++) {
    const padded = paddedChapter(n)

    // Book chapter (book exercises + quick practice).
    const bookFile = path.join(BOOK_DIR, `Chapter-${padded}.md`)
    const bookMd = readIfExists(bookFile)
    if (bookMd) {
      const bx = extractBookExercises(n, bookMd, bookFile)
      const qp = extractQuickPractice(n, bookMd, bookFile)
      allItems.push(...bx, ...qp)
    }

    // Workbook.
    const wbFile = path.join(WORKBOOK_DIR, `Chapter-${padded}-Workbook.md`)
    const wbMd = readIfExists(wbFile)
    if (wbMd) allItems.push(...extractWorkbook(n, wbMd, wbFile))

    // Quiz.
    const qzFile = path.join(QUIZ_DIR, `tongan_grammar_quiz_ch${padded}.md`)
    const qzMd = readIfExists(qzFile)
    if (qzMd) allItems.push(...extractQuiz(n, qzMd, qzFile))
  }

  for (const it of allItems) {
    surfaceCounts[it.surface] = (surfaceCounts[it.surface] || 0) + 1
    chapterCounts[it.chapter] = (chapterCounts[it.chapter] || 0) + 1
  }

  const exerciseIds = new Set(allItems.map(it => it.exerciseId))

  const out = {
    summary: {
      generatedAt: new Date().toISOString(),
      totalItems: allItems.length,
      totalExercises: exerciseIds.size,
      bySurface: surfaceCounts,
      byChapter: chapterCounts,
    },
    items: allItems,
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8')

  console.log(`Wrote ${path.relative(REPO_ROOT, OUT_FILE)}`)
  console.log(`Total items: ${allItems.length}`)
  console.log(`Total exercises: ${exerciseIds.size}`)
  console.log('By surface:', surfaceCounts)
  console.log('Chapters covered:', Object.keys(chapterCounts).length)

  // Quick sanity-check on parse flags.
  const flagged = allItems.filter(it => it.parseFlags && it.parseFlags.length).length
  if (flagged) console.log(`Items with parse flags: ${flagged}`)
}

main()
