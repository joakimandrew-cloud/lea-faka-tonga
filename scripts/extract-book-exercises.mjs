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

// Judge-verified interaction decisions (2026-06-16 owner ruling: chapter
// exercises are tap-an-option mcq or tap-to-reveal, never type-the-answer).
// Built by scripts/build-interaction-decisions.mjs from the Opus judge pass.
// Maps exercise id -> { interaction:'mcq', mode:'shared'|'inline', options?, labels? }.
const DECISIONS = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'exercise-interaction-decisions.json'), 'utf8')
)

// ---------------------------------------------------------------------------
// Markdown parsing
// ---------------------------------------------------------------------------

/**
 * Strip markdown italics (*...*) for display while preserving the text.
 * We keep the asterisks in the source but the UI component will render them.
 * Also unescape markdown-escaped underscores/asterisks (the book writes
 * blanks as \_\_\_) so the UI never shows literal backslashes.
 */
function cleanText(s) {
  return s.replace(/\\([_*])/g, '$1').replace(/\s+$/g, '').replace(/^\s+/g, '')
}

/** A markdown horizontal rule (---) — never part of an item's text. */
const HR_RE = /^\s*-{3,}\s*$/

/**
 * Split a markdown exercise section into numbered items.
 * Handles both "1. ..." and "1\\. ..." and multi-line items.
 * A horizontal rule (---) terminates the current item instead of being
 * absorbed into it.
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
    } else if (HR_RE.test(line)) {
      // Horizontal rule: end of the items run — never a continuation.
      if (current) {
        items.push(cleanText(current.text))
        current = null
      }
    } else if (current && line.trim() !== '') {
      // Continuation of the previous item
      current.text += ' ' + line.trim()
    }
  }
  if (current) items.push(cleanText(current.text))
  return items
}

/**
 * Capture the instruction text between the exercise heading and the first
 * item (numbered line, lettered line, or table row). Returns '' if none.
 */
function extractInstructions(block) {
  const lines = block.split(/\n/)
  const out = []
  for (const line of lines) {
    const t = line.trim()
    if (/^\d+\.\s+/.test(t) || /^[a-h]\.\s+/.test(t) || t.startsWith('|')) break
    if (t === '' || HR_RE.test(t)) continue
    out.push(t)
  }
  return cleanText(out.join(' '))
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
 * Classify a single piece of text (title or instructions) into a type.
 * Returns null when the text gives no signal.
 */
function classifyText(s) {
  if (!s) return null
  // Assemble / transform tasks first: "Build the sentence", "Arrange the
  // words …", "Transform sentences", "Change the direction …". These often
  // also say "translate to English", which used to send them down the
  // italic-sniff translate fallback and mislabel them translate_to_english.
  if (
    /\barrange\b/.test(s) ||
    /\brearrange\b/.test(s) ||
    /\bunscramble\b/.test(s) ||
    /\bbuild the sentence\b/.test(s) ||
    /\bassemble\b/.test(s) ||
    /\btransform\b/.test(s) ||
    /\bchange the direction\b/.test(s)
  ) {
    return 'transform'
  }
  if (
    /translate.*\btongan\b.*\benglish\b/.test(s) ||
    /translation.*\btongan\s+to\s+english\b/.test(s) ||
    /\binto\s+english\b/.test(s)
  ) {
    return 'translate_to_english'
  }
  if (
    /translate.*\benglish\b.*\btongan\b/.test(s) ||
    /translation.*\benglish\s+to\s+tongan\b/.test(s) ||
    /\binto\s+tongan\b/.test(s)
  ) {
    return 'translate_to_tongan'
  }
  if (/fill\s+in/.test(s) || /complete\s+each/.test(s) || /complete\s+the/.test(s)) {
    return 'fill_blank'
  }
  return null
}

/**
 * Classify an exercise into a type based on its title, then its
 * instructions, then body heuristics. Direction-less "translate" titles
 * fall back to a content sniff: mostly-italic (Tongan) prompts mean the
 * student translates into English, plain English prompts mean into Tongan.
 */
function classify(title, body, instructions, prompts) {
  const t = (title || '').toLowerCase()
  const instr = (instructions || '').toLowerCase()
  const byTitle = classifyText(t)
  if (byTitle) return byTitle
  const byInstr = classifyText(instr)
  if (byInstr) return byInstr
  if (/translat/.test(t) || /translat/.test(instr)) {
    const list = prompts || []
    const italic = list.filter((p) => /^\*/.test(p)).length
    return italic > list.length / 2 ? 'translate_to_english' : 'translate_to_tongan'
  }
  // Heuristic: if any prompt contains ___ treat as fill_blank
  if (/___/.test(body || '')) return 'fill_blank'
  // Otherwise generic
  return 'free'
}

// ---------------------------------------------------------------------------
// Accepted-answer variants (lenient checking data for the app)
// ---------------------------------------------------------------------------

/**
 * Expand an answer key into the set of strings a student should be allowed
 * to type. The keys often carry annotations that are not part of the answer:
 *
 *   *te* (pronoun *u* follows)            → *te*
 *   *ha*. I want some water. (indefinite) → *ha*
 *   *Te mau nofo heni.* (or *Te mau nofo 'i heni.*) → either sentence
 *   He/she has fallen asleep.             → He … / She …
 *
 * Returns an array of variants (always includes the raw key).
 */
function expandAnswerVariants(raw) {
  const out = new Set()
  const visit = (input) => {
    const s = input.trim()
    if (!s || out.has(s)) return
    out.add(s)
    // "(or ...)" alternates: accept both the base and the alternate.
    const orM = s.match(/\(\s*or:?\s+([^)]+)\)/i)
    if (orM) {
      visit(s.replace(orM[0], '').trim())
      visit(orM[1])
    }
    // Trailing parenthetical annotation.
    const parM = s.match(/^(.*\S)\s*\([^()]*\)$/)
    if (parM) visit(parM[1])
    // Parenthetical annotations anywhere ("We (exclusive) drank."):
    // accept the sentence without them.
    const noParens = s.replace(/\s*\([^()]*\)/g, ' ').replace(/\s+/g, ' ').trim()
    if (noParens !== s) visit(noParens)
    // Leading italic chunk followed by a prose gloss/explanation. Skipped
    // when the remainder itself starts with another italic segment — that
    // shape is a multi-part answer, not an annotation.
    const chunkM = s.match(/^(\*[^*]+\*)[.,;:]?\s+(\S[\s\S]*)$/)
    if (chunkM && !chunkM[2].startsWith('*')) visit(chunkM[1])
    // " / " separated alternates.
    if (s.includes(' / ')) s.split(' / ').forEach(visit)
    // Word-level slash alternates (He/she, him/her, ...).
    const slashM = s.match(/\b([A-Za-z]+)\/([A-Za-z]+)\b/)
    if (slashM) {
      visit(s.replace(slashM[0], slashM[1]))
      visit(s.replace(slashM[0], slashM[2]))
    }
  }
  visit(raw)
  return [...out]
}

// ---------------------------------------------------------------------------
// Matching exercises (lettered lists and tables)
// ---------------------------------------------------------------------------

/**
 * Parse a table-based matching exercise:
 *
 *   | 1. *ne* | a. we (inclusive, three+) |          (2-col, combined cells)
 *   | 1 | *talu mei ai* | a. the past |              (3-col)
 *   | 1. | *Ko e fale 'o Pita.* | a. | His knife. |  (4-col, split cells)
 *
 * with a number→letter key in the answers body ("1. d", "1: b", "1-c, 2-a").
 * Returns [{ prompt, answer }] or null if the body is not such a table.
 */
function parseTableMatching(body, ansBody) {
  const numToPrompt = {}
  const letterToOption = {}
  const order = []
  for (const line of body.split(/\n/)) {
    const t = line.trim()
    if (!t.startsWith('|')) continue
    const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
    if (cells.every((c) => c === '' || /^:?-{2,}:?$/.test(c))) continue // separator row
    let pendingNum = null
    let pendingLetter = null
    for (const cell of cells) {
      if (!cell) continue
      let m
      if (pendingNum !== null) {
        order.push(pendingNum)
        numToPrompt[pendingNum] = cleanText(cell)
        pendingNum = null
      } else if (pendingLetter !== null) {
        letterToOption[pendingLetter] = cleanText(cell)
        pendingLetter = null
      } else if ((m = cell.match(/^(\d+)[.)]?$/))) {
        pendingNum = m[1]
      } else if ((m = cell.match(/^([a-h])[.)]?$/))) {
        pendingLetter = m[1]
      } else if ((m = cell.match(/^(\d+)[.)]\s+(.+)$/))) {
        order.push(m[1])
        numToPrompt[m[1]] = cleanText(m[2])
      } else if ((m = cell.match(/^([a-h])[.)]\s+(.+)$/))) {
        letterToOption[m[1]] = cleanText(m[2])
      }
    }
  }
  if (order.length < 2 || Object.keys(letterToOption).length < 2) return null

  // Key: pairs like "1. d", "1: b (...)", "1-c"
  const key = {}
  const keyRe = /\b(\d+)\s*[-:.]\s*([a-h])\b/g
  let km
  while ((km = keyRe.exec(ansBody || '')) !== null) key[km[1]] = km[2]

  return order
    .filter((n) => numToPrompt[n])
    .map((n) => ({
      prompt: numToPrompt[n],
      answer: key[n] && letterToOption[key[n]] ? letterToOption[key[n]] : null,
    }))
}

/**
 * Parse a lettered matching exercise (questions a–g, options 1–7, key
 * "a: 3" / "a. 3" in the answers). Returns [{ prompt, answer }] or null.
 */
function parseLetteredMatching(body, ansBody) {
  const questions = []
  const options = {}
  for (const line of body.split(/\n/)) {
    let m
    if ((m = line.match(/^([a-h])\.\s+(.+)$/))) {
      questions.push({ letter: m[1], text: cleanText(m[2]) })
    } else if ((m = line.match(/^(\d+)\.\s+(.+)$/))) {
      options[m[1]] = cleanText(m[2])
    }
  }
  if (questions.length < 2 || Object.keys(options).length < 2) return null

  const key = {}
  const keyRe = /\b([a-h])\s*[:.]\s*(\d+)\b/g
  let km
  while ((km = keyRe.exec(ansBody || '')) !== null) key[km[1]] = km[2]
  if (Object.keys(key).length < 2) return null

  return questions.map((q) => ({
    prompt: q.text,
    answer: key[q.letter] && options[key[q.letter]] ? options[key[q.letter]] : null,
  }))
}

// ---------------------------------------------------------------------------
// Interactive-type classification: matching (tap-to-match) and MCQ
// (tap-an-option). Both must be reconstructable FROM THE BOOK — never invent a
// pair or a distractor. Anything that doesn't cleanly classify stays reveal.
// ---------------------------------------------------------------------------

/** Compare-normalize: strip markdown, unify ʻokina, drop accents, lowercase. */
function normForCmp(s) {
  if (!s) return ''
  return String(s)
    .replace(/\*+/g, '')
    .replace(/[‘’ʻ'`]/g, "'")
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s".,?!]+|[\s".,?!]+$/g, '')
    .toLowerCase()
    .trim()
}

/** Collect distinct italic (*...*) tokens from a string, in order. */
function collectItalics(s) {
  const out = []
  // Drop **bold** first so it can't desync single-* italic pairing (e.g. a
  // "**Word bank:** *a*, *b*, ..." instruction).
  const cleaned = (s || '').replace(/\*\*([^*]+)\*\*/g, '$1')
  const re = /\*([^*]+)\*/g
  let m
  while ((m = re.exec(cleaned)) !== null) {
    const t = m[1].trim()
    if (t && !out.includes(t)) out.push(t)
  }
  return out
}

/**
 * A matching exercise is interactive (tap-to-match) only if its pairs form a
 * clean bijection: >=2 items, every item answered, the right-hand options are
 * distinct, and the answer is not just an echo of the prompt (the ch53
 * "identify the respect level" categorization, whose answer restates the word).
 */
function isInteractiveMatching(pairs) {
  if (!pairs || pairs.length < 2) return false
  if (!pairs.every((p) => p.answer)) return false
  const rights = pairs.map((p) => normForCmp(p.answer))
  if (new Set(rights).size !== rights.length) return false
  const echo = pairs.filter(
    (p) => normForCmp(p.prompt) && normForCmp(p.answer).startsWith(normForCmp(p.prompt))
  ).length
  if (echo > pairs.length / 2) return false
  return true
}

/**
 * Shape A - inline options: a prompt that carries its own "(a) ... (b) ..."
 * choices, with the answer naming the correct letter. Returns the augmented
 * pairs ({prompt: stem, answer, options, correct}) or null.
 */
function tryInlineMcq(pairs) {
  const out = []
  for (const p of pairs) {
    if (!/\(a\)/i.test(p.prompt) || !/\(b\)/i.test(p.prompt)) return null
    const parts = p.prompt.split(/\(([a-d])\)/i)
    const stem = cleanText(parts[0].replace(/\s*\/\s*$/, '').trim())
    const options = []
    for (let i = 1; i < parts.length; i += 2) {
      const label = (parts[i] || '').toLowerCase()
      const text = cleanText((parts[i + 1] || '').replace(/\s*\/\s*$/, '').trim())
      if (text) options.push({ label, text })
    }
    if (options.length < 2) return null
    const lm = (p.answer || '').match(/^\s*\(([a-d])\)/i)
    if (!lm) return null
    const correct = options.find((o) => o.label === lm[1].toLowerCase())
    if (!correct) return null
    out.push({ prompt: stem, answer: p.answer, options: options.map((o) => o.text), correct: correct.text })
  }
  return out.length >= 1 ? out : null
}

/**
 * Shape B - shared option set: the choices live once in the title/instructions
 * (a parenthetical list, an "X or Y", or a word bank), as italic tokens. Each
 * answer must name exactly one of them. Returns augmented pairs or null.
 */
function trySharedMcq(head, pairs) {
  const opts = collectItalics(head)
  if (opts.length < 2) return null
  const optNorm = opts.map(normForCmp)
  const out = []
  for (const p of pairs) {
    const ansNorm = collectItalics(p.answer).map(normForCmp)
    const hit = optNorm.filter((o) => ansNorm.includes(o))
    const uniq = [...new Set(hit)]
    if (uniq.length !== 1) return null
    const correct = opts[optNorm.indexOf(uniq[0])]
    out.push({
      prompt: p.prompt,
      answer: p.answer,
      options: opts.map((o) => `*${o}*`),
      correct: `*${correct}*`,
    })
  }
  return out
}

/**
 * Classify a (currently "free") exercise as MCQ if its options are recoverable
 * from the book: inline (a)/(b) per item, or a shared option set cued by
 * choose/select. Never fabricates distractors - returns null (-> reveal) on any
 * miss.
 */
function tryMcq(title, instructions, pairs) {
  const head = `${title} ${instructions}`
  // Require an explicit choose/select cue first: an exercise that merely shows
  // an (a)/(b) pair to *compare* or *explain* (e.g. ch46-ex5 "explain the
  // difference") is not a pick-one MCQ.
  if (!/\b(choose|select|pick)\b/i.test(head)) return null
  const inline = tryInlineMcq(pairs)
  if (inline) return inline
  return trySharedMcq(head, pairs)
}

// ---------------------------------------------------------------------------
// Apply a judge-verified interaction decision: convert an in-scope exercise to
// tap-an-option mcq with book-sourced options + a per-item correct. The options
// come from the decision file (shared bank) or are parsed per-item from the
// prompt's inline "(*a* / *b* / *c*)" list. No invention. No-op when the id has
// no decision (the prior heuristic mcqs keep their own path).
// ---------------------------------------------------------------------------
const _leadItalic = (s) => { const m = (s || '').match(/^\s*\*([^*]+)\*/); return m ? m[1] : null }
const _stripGloss = (o) => o.replace(/\s*\([^)]*\)\s*$/, '')
const _escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const _spans = (s) => { const out = []; const re = /\*([^*]+)\*/g; let m; while ((m = re.exec(s || '')) !== null) out.push(m[1]); return out }

// Which option an item's answer corresponds to. Tongan: an italic-marked span
// (or clean accept[0]) equals an option. Labels: a word-bounded substring of the
// answer (the label may sit after the stimulus word); slash-options match any
// part. Ties break to the earliest, then longest. Mirrors build-interaction-decisions.mjs.
function decisionCorrect(item, options, isLabel) {
  const full = normForCmp(item.answer)
  const cands = []
  if (isLabel) {
    for (const o of options) {
      for (const sub of normForCmp(_stripGloss(o)).split('/').map((s) => s.trim()).filter(Boolean)) {
        const idx = full.search(new RegExp('\\b' + _escapeRe(sub) + '\\b'))
        if (idx >= 0) cands.push({ o, idx, len: sub.length })
      }
    }
  } else {
    const spans = _spans(item.answer).map(normForCmp)
    const a0 = item.accept && item.accept[0]
    if (a0) spans.push(normForCmp(_leadItalic(a0) || a0))
    for (const o of options) { const on = normForCmp(_stripGloss(o)); if (on && spans.includes(on)) cands.push({ o, idx: 0, len: on.length }) }
  }
  if (!cands.length) return null
  cands.sort((a, b) => (a.idx - b.idx) || (b.len - a.len))
  return cands[0].o
}

// Parse a per-item inline option list "(*a* / *b* / *c*)" -> { options, strip }.
function parseInlineList(prompt) {
  const re = /\(([^()]*\/[^()]*)\)/g
  let m
  while ((m = re.exec(prompt)) !== null) {
    const inner = m[1]
    if (!/[A-Za-zʻ’'āēīōū]/.test(inner)) continue
    const toks = inner.split('/').map((s) => s.replace(/\*/g, '').trim()).filter(Boolean)
    if (toks.length >= 2 && toks.every((t) => t.split(/\s+/).length <= 3 && t.length <= 18)) {
      return { options: toks.map((t) => `*${t}*`), strip: m[0] }
    }
  }
  return null
}

function applyInteractionDecision(ex) {
  const d = DECISIONS[ex.id]
  if (!d || d.interaction !== 'mcq') return
  if (d.mode === 'inline') {
    for (const it of ex.items) {
      const p = parseInlineList(it.prompt)
      if (!p) { console.warn(`[mcq] ${it.id}: inline options not found`); return }
      it.options = p.options
      it.correct = decisionCorrect(it, p.options, false)
      it.prompt = cleanText(it.prompt.replace(p.strip, '').replace(/\s{2,}/g, ' ').trim())
      if (!it.correct) console.warn(`[mcq] ${it.id}: no correct match (inline)`)
    }
  } else {
    for (const it of ex.items) {
      it.options = d.options
      it.correct = decisionCorrect(it, d.options, !!d.labels)
      if (it.answer && !it.correct) console.warn(`[mcq] ${it.id}: no correct match (shared)`)
    }
  }
  ex.type = 'mcq'
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
    const ans = answers[num]
    const instructions = extractInstructions(ex.body)
    const isMatch = /\bmatch\b/i.test(`${ex.title} ${instructions}`)

    // Matching exercises (tables, or lettered question lists) need their
    // own pairing logic — the generic numbered split produces orphaned
    // options (lettered) or nothing at all (tables).
    let pairs = null
    let type = null
    if (isMatch) {
      pairs =
        parseTableMatching(ex.body, ans ? ans.body : '') ||
        parseLetteredMatching(ex.body, ans ? ans.body : '')
      // type assigned below, once the pairs are known (see "refine type")
    }

    if (!pairs) {
      const prompts = splitNumberedItems(ex.body)
      const answerItems = ans ? splitNumberedItems(ans.body) : []
      type = classify(ex.title, ex.body, instructions, prompts)
      pairs = prompts.map((prompt, i) => ({
        prompt,
        answer: answerItems[i] || null,
      }))
    }

    // Refine type into the interactive classes. Matching (tap-to-match) wins
    // when the pairs form a clean bijection; otherwise an MCQ (tap-an-option) is
    // taken only when its options are recoverable from the book. Everything else
    // stays reveal. Pair PRODUCTION is unchanged here - this only sets the type
    // (and, for MCQ, attaches the book-sourced options).
    if (isMatch && isInteractiveMatching(pairs)) {
      type = 'matching'
    } else {
      if (type === null) type = 'free'
      // Heuristic mcq detection is the FALLBACK for exercises the judge pass
      // did not review (it owns its decision via DECISIONS below). Skip it when
      // a decision exists so the two paths can never disagree.
      if (type === 'free' && !DECISIONS[`ch${chapterNum}-ex${num}`]) {
        const mcq = tryMcq(ex.title, instructions, pairs)
        if (mcq) {
          type = 'mcq'
          pairs = mcq
        }
      }
    }

    const items = pairs.map((pair, i) => {
      const item = {
        id: `ch${chapterNum}-ex${num}-${i + 1}`,
        prompt: pair.prompt,
        answer: pair.answer,
      }
      if (pair.options) {
        item.options = pair.options
        item.correct = pair.correct
      }
      if (pair.answer) {
        const accept = expandAnswerVariants(pair.answer).filter((v) => v !== pair.answer)
        if (accept.length > 0) item.accept = accept
      }
      return item
    })

    const exObj = {
      id: `ch${chapterNum}-ex${num}`,
      number: parseInt(num, 10),
      title: ex.title,
      type,
      instructions: instructions || '',
      items,
    }
    applyInteractionDecision(exObj)
    output.push(exObj)
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

// Classification report - what became interactive, and what stayed reveal.
const matchingList = []
const mcqList = []
const keptReveal = []
for (const chExs of Object.values(all)) {
  for (const ex of chExs) {
    if (ex.type === 'matching') matchingList.push(`${ex.id}(${ex.items.length})`)
    else if (ex.type === 'mcq') mcqList.push(`${ex.id}(${ex.items.length}i,${ex.items[0]?.options?.length}o)`)
    else if (/\b(choose|select|pick|match)\b/i.test(`${ex.title} ${ex.instructions}`)) {
      keptReveal.push(`${ex.id}[${ex.type}]`)
    }
  }
}
console.log(`\nMATCHING (${matchingList.length}): ${matchingList.join(', ')}`)
console.log(`MCQ (${mcqList.length}): ${mcqList.join(', ')}`)
console.log(`choose/match-titled but kept on REVEAL (${keptReveal.length}): ${keptReveal.join(', ')}`)
