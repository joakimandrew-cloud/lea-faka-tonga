#!/usr/bin/env node
/**
 * Parse the mid-chapter "Quick Practice" blocks out of book/Chapter-NN.md into
 * lea-faka-tonga-app/src/data/quick-practice.json, shaped for interactive
 * rendering by <QuickPractice> (the same shared widgets as <BookExercises>).
 *
 * Block shape in the markdown:
 *
 *   ### Quick Practice A: Topic           (multi-block chapters keep A/B/C)
 *   ### Quick Practice: Topic             (single-block chapters drop the letter)
 *
 *   [optional instruction line]
 *
 *   1. prompt
 *   2. prompt
 *   ...
 *
 *   **Answers:** 1. *a*. 2. *b*. ...      (digit-keyed; or "a. 4; b. 3; ..." for matching)
 *
 *   ---
 *
 * Each block is classified into the same three interaction types the
 * end-of-chapter exercises use:
 *   matching → tap-to-match   (a clean a–f ↔ 1–6 bijection: only Ch14 A)
 *   mcq      → tap-an-option  (a closed option set recoverable from the
 *              title/instructions as italic tokens, every answer hitting one)
 *   reveal   → tap-to-reveal  (everything else: translate / fill-pronoun / transform)
 *
 * No Tongan is authored here and no MCQ distractor is invented — every option
 * comes from the block's own title/instructions. The parsing/classification
 * helpers mirror extract-book-exercises.mjs (kept in sync by hand; both are
 * small and the block format is fixed).
 *
 * Keyed by chapter, then a slug of the heading (so <remark-quick-practice> can
 * look the block up by the same slug it computes from the rendered heading —
 * no fragile array-index alignment).
 *
 * Run with:  node scripts/extract-quick-practice.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BOOK_DIR = path.resolve(__dirname, '..', '..', 'book')
const OUT_FILE = path.resolve(__dirname, '..', 'src', 'data', 'quick-practice.json')

// ---------------------------------------------------------------------------
// Parsing helpers (mirror extract-book-exercises.mjs)
// ---------------------------------------------------------------------------

function cleanText(s) {
  return s.replace(/\\([_*])/g, '$1').replace(/\s+$/g, '').replace(/^\s+/g, '')
}

// Same slug rule as src/lib/remark-drill-anchors.js so the plugin and this
// script agree on the key.
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʻ'`]/g, '')
    .replace(/[\/.:,;—–]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Split a block's numbered prompts into [{num, text}]. */
function splitNumberedItems(block) {
  const out = []
  let cur = null
  for (const raw of block.split(/\n/)) {
    const m = raw.match(/^(\d+)\.\s+(.*)$/)
    if (m) {
      if (cur) out.push(cur)
      cur = { num: parseInt(m[1], 10), text: cleanText(m[2]) }
    } else if (cur && raw.trim() !== '' && !raw.startsWith('#') && !raw.startsWith('---')) {
      cur.text = cleanText(cur.text + ' ' + raw.trim())
    }
  }
  if (cur) out.push(cur)
  return out
}

/**
 * Parse a "**Answers:** 1. x. 2. y; 3. z" line into [{num, text}]. The
 * separators between answers vary (". ", "; ", ".; "), so we capture each
 * "N. <text>" lazily up to the next " N. " or end, then trim a trailing
 * separator (";" always; a bare "." only when the answer is a short/italic
 * token, never when it is a full sentence whose period is real punctuation).
 * Returns [] for letter-keyed matching answers ("a. 4; b. 3") — those go
 * through parseLetteredMatching instead.
 */
function splitInlineAnswers(line) {
  const body = line.replace(/^\*\*Answers?:\*\*\s*/, '').trim()
  const out = []
  const re = /(\d+)\.\s*([\s\S]*?)(?=\s+\d+\.\s|\s*$)/g
  let m
  while ((m = re.exec(body)) !== null) {
    let text = m[2].trim().replace(/;\s*$/, '').trim()
    const bare = text.replace(/\*/g, '')
    if (/^\*[^*]+\*\.$/.test(text) || !/\s/.test(bare)) {
      text = text.replace(/\.\s*$/, '').trim()
    }
    out.push({ num: parseInt(m[1], 10), text })
  }
  return out
}

/**
 * Parse a lettered matching block (questions a–f, options 1–6, key "a. 4")
 * into [{prompt, answer}] or null. `ansLine` is the raw **Answers:** line.
 */
function parseLetteredMatching(body, ansLine) {
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
  while ((km = keyRe.exec(ansLine || '')) !== null) key[km[1]] = km[2]
  if (Object.keys(key).length < 2) return null
  const pairs = questions.map((q) => ({
    prompt: q.text,
    answer: key[q.letter] && options[key[q.letter]] ? options[key[q.letter]] : null,
  }))
  if (!pairs.every((p) => p.answer)) return null
  // Right-hand options must be distinct for a clean tap-to-match.
  const rights = pairs.map((p) => p.answer)
  if (new Set(rights).size !== rights.length) return null
  return pairs
}

// MCQ: shared option set drawn from the title/instructions as italic tokens.
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

function collectItalics(s) {
  const out = []
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
 * Shared-option MCQ: the choices live once in the title/instructions as italic
 * tokens, and every answer must name exactly one of them. Returns augmented
 * pairs ({prompt, answer, options, correct}) or null. Unlike the book-exercises
 * gate, no "choose/select" keyword is required — a closed "fill in with X or Y"
 * option set is equally a tap-an-option here, as long as every answer resolves.
 */
function trySharedMcq(head, pairs) {
  const opts = collectItalics(head)
  if (opts.length < 2) return null
  const optNorm = opts.map(normForCmp)
  const out = []
  for (const p of pairs) {
    if (!p.answer) return null
    const ansNorm = collectItalics(p.answer).map(normForCmp)
    // Fall back to the whole answer when it carries no italics.
    if (ansNorm.length === 0) ansNorm.push(normForCmp(p.answer))
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

// ---------------------------------------------------------------------------
// Per-chapter extraction
// ---------------------------------------------------------------------------

// Heading: the letter is optional (single-block chapters drop it).
const QP_HEADING = /^###\s+Quick Practice(?:\s+([A-Z]))?:\s*(.+)$/gm

function extractChapter(chapter, md) {
  const blocks = []
  const heads = []
  let m
  QP_HEADING.lastIndex = 0
  while ((m = QP_HEADING.exec(md)) !== null) {
    heads.push({ letter: m[1] || null, topic: m[2].trim(), full: m[0].replace(/^###\s+/, '').trim(), start: m.index, headerEnd: m.index + m[0].length })
  }

  for (const h of heads) {
    // Block ends at the next H3, the next thematic break, or EOF.
    const tailRe = /\n(?:###\s+|---\s*(?:\n|$))/g
    tailRe.lastIndex = h.headerEnd
    const next = tailRe.exec(md)
    const blockEnd = next ? next.index : md.length
    const body = md.slice(h.headerEnd, blockEnd)

    const ansMatch = body.match(/^\*\*Answers?:\*\*\s+(.*)$/m)
    const beforeAnswers = ansMatch ? body.slice(0, ansMatch.index) : body
    const ansLine = ansMatch ? ansMatch[0] : ''

    // Instruction = the prose between the heading and the first numbered/lettered item.
    const instrLines = []
    for (const line of beforeAnswers.split(/\n/)) {
      const t = line.trim()
      if (/^\d+\.\s+/.test(t) || /^[a-h]\.\s+/.test(t)) break
      if (t === '' || /^-{3,}$/.test(t)) continue
      instrLines.push(t)
    }
    const instructions = cleanText(instrLines.join(' '))

    const head = `${h.topic} ${instructions}`
    let type = 'reveal'
    let items = null

    // 1) Matching (tap-to-match): "Match …" + a clean lettered bijection.
    if (/\bmatch\b/i.test(head)) {
      const pairs = parseLetteredMatching(beforeAnswers, ansLine)
      if (pairs) { type = 'matching'; items = pairs }
    }

    // 2) MCQ (tap-an-option): a recoverable shared option set.
    if (!items) {
      const prompts = splitNumberedItems(beforeAnswers)
      const answers = splitInlineAnswers(ansLine)
      const pairs = prompts.map((p) => ({
        prompt: p.text,
        answer: (answers.find((a) => a.num === p.num) || {}).text || null,
      }))
      const mcq = trySharedMcq(head, pairs)
      if (mcq) { type = 'mcq'; items = mcq }
      else { type = 'reveal'; items = pairs }
    }

    const slug = slugify(h.full)
    blocks.push({
      slug,
      letter: h.letter,
      title: h.full,        // e.g. "Quick Practice A: Commands, …"
      topic: h.topic,
      instructions,
      type,
      items: items.map((it, i) => {
        const out = { id: `ch${chapter}-qp-${slug}-${i + 1}`, prompt: it.prompt, answer: it.answer }
        if (it.options) { out.options = it.options; out.correct = it.correct }
        return out
      }),
    })
  }
  return blocks
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const all = {}
for (let n = 1; n <= 55; n++) {
  const file = path.join(BOOK_DIR, `Chapter-${String(n).padStart(2, '0')}.md`)
  if (!fs.existsSync(file)) continue
  const md = fs.readFileSync(file, 'utf8')
  const blocks = extractChapter(n, md)
  if (blocks.length) all[n] = blocks
}

fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2) + '\n', 'utf8')

// Summary
let totalBlocks = 0
let totalItems = 0
const typeCounts = {}
for (const [ch, blocks] of Object.entries(all)) {
  for (const b of blocks) {
    totalBlocks++
    totalItems += b.items.length
    typeCounts[b.type] = (typeCounts[b.type] || 0) + 1
    const missing = b.items.filter((it) => !it.answer).length
    if (missing) console.warn(`[qp] ch${ch} "${b.title}": ${missing} item(s) missing an answer`)
  }
}
console.log(`Wrote ${OUT_FILE}`)
console.log(`Chapters: ${Object.keys(all).length}`)
console.log(`Quick Practice blocks: ${totalBlocks}`)
console.log(`Items: ${totalItems}`)
console.log('Types:', typeCounts)
for (const [ch, blocks] of Object.entries(all)) {
  console.log(`  ch${ch}: ${blocks.map((b) => `${b.slug.replace(/^quick-practice-?/, '') || 'qp'}[${b.type}/${b.items.length}]`).join(', ')}`)
}
