// The lesson-course models (reviews/lesson-course-2026-10-24/Direction.md):
// the learn block, the lesson path stations and the figure. Pure: no React and
// no @app/ imports, so plain node runs it in the test and the check script.
//
// Every Tongan string a model returns sits in a field named `to` and is copied
// from a chapters.json field. English composed here sits in `en`, `label` or
// `detail`. Section titles, drill titles and quick-practice topics are not in
// any model; the components read them at render. No model holds an empty
// string; a dash cell is `{ dash: true }`.
import { okinafy } from '../../lib/okinafy.js'
import { plainInline } from './lesson-content.js'

export function groupSections(blocks) {
  const sections = []
  let cur = null
  for (const b of blocks) {
    if (b.type === 'h2') { cur = { id: b.id, title: b.text, blocks: [] }; sections.push(cur); continue }
    if (b.type === 'exercises-slot') { sections.push({ id: 'exercises', title: 'Exercises', exercises: true, blocks: [] }); continue }
    if (b.type === 'hr') continue
    if (cur) cur.blocks.push(b)
  }
  return sections
}

export const isWordsSection = section => /^words-to-learn/.test(section.id)

/** The rendered sections minus Exercises and any Words to Learn section. */
export function teachingSections(sections) {
  return sections.filter(section => !section.exercises && !isWordsSection(section))
}

const sectionNumber = (sections, id) => sections.findIndex(section => section.id === id) + 1

// Finding only; strips markup, acute and macron, case and punctuation.
// Display text is never changed.
export const norm = s => okinafy(plainInline(String(s ?? ''))).replace(/<[^>]+>|\*/g, ' ')
  .normalize('NFD').replace(/[́̄]/g, '').normalize('NFC')
  .toLowerCase().replace(/[.,!?…:;"“”()]/g, ' ').split(/\s+/).filter(Boolean)

/** True when norm(needle) is a contiguous run of norm(haystack). */
export function contains(haystack, needle) {
  const hay = Array.isArray(haystack) ? haystack : norm(haystack)
  const words = Array.isArray(needle) ? needle : norm(needle)
  if (!words.length || words.length > hay.length) return false
  outer: for (let i = 0; i + words.length <= hay.length; i += 1) {
    for (let j = 0; j < words.length; j += 1) if (hay[i + j] !== words[j]) continue outer
    return true
  }
  return false
}

const DASH = /^[–—-]$/

/** Splits a K, F, E or t cell into Tongan and gloss: a trailing " (...)", else " = ", else ": ". */
export function parseCell(cell) {
  const text = String(cell ?? '').trim()
  if (!text) return null
  if (DASH.test(text)) return { dash: true }
  const paren = text.match(/^(.+?)\s+\(([^()]+)\)$/)
  if (paren) return { to: paren[1].trim(), gloss: paren[2].trim() }
  for (const sep of [' = ', ': ']) {
    const at = text.indexOf(sep)
    if (at > 0 && at + sep.length < text.length) return { to: text.slice(0, at).trim(), gloss: text.slice(at + sep.length).trim() }
  }
  return { to: text }
}

function listText(items) {
  return items.flatMap(item => [item.text, ...item.children.flatMap(child => listText(child.items))])
}

/** The reading text of one block, joined, for finding only. */
export function blockText(block) {
  if (block.type === 'p') return block.text
  if (block.type === 'note') return [block.label, block.text].filter(Boolean).join(' ')
  if (block.type === 'examples' || block.type === 'pairs') {
    return block.pairs.map(pair => [pair.tongan, pair.english, pair.line].filter(Boolean).join(' ')).join(' ')
  }
  if (block.type === 'table') return [block.head, ...block.body].flat().join(' ')
  if (block.type === 'list') return listText(block.items).join(' ')
  return ''
}

const FINDABLE = new Set(['p', 'examples', 'pairs', 'table', 'list', 'note'])

/** The first teaching section whose text blocks contain the example, or null. */
export function findExampleSection(sections, example) {
  const words = norm(example)
  if (!words.length) return null
  for (const section of teachingSections(sections)) {
    if (section.blocks.some(block => FINDABLE.has(block.type) && contains(blockText(block), words))) {
      return { sectionId: section.id, sectionNumber: sectionNumber(sections, section.id) }
    }
  }
  return null
}

/** Every quick-practice block and embedded drill, in page order. */
export function practiceBlocks(sections) {
  return sections.flatMap(section => section.blocks.flatMap(block => {
    const base = { sectionId: section.id, sectionNumber: sectionNumber(sections, section.id) }
    if (block.type === 'drill') return [{ ...base, key: `drill:${block.drillId}`, kind: 'drill', drillId: block.drillId, anchor: `practice-drill-${block.drillId}` }]
    if (block.type === 'quick-practice') return [{ ...base, key: `qp:${block.index}`, kind: 'qp', qpIndex: block.index, anchor: `practice-qp-${block.index}` }]
    return []
  }))
}

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`

/** The figure variant for a lesson, after run-time validation of its paradigm. */
export function figureVariant(n, meta, plan) {
  const entry = plan?.[n]
  if (!entry) return 'rules'
  if (entry.v === 'bespoke' || entry.v === 'rules') return entry.v
  return validFigure(meta, entry) ? entry.v : 'rules'
}

function primaryColumn(entry) {
  const roles = entry.roles
  if (Number.isInteger(entry.primary)) return entry.primary
  for (const role of ['F', 'K', 'E']) if (roles.includes(role)) return roles.indexOf(role)
  return -1
}

function validFigure(meta, entry) {
  const paradigm = meta?.teaching?.paradigm
  if (!paradigm?.rows?.length || !Array.isArray(paradigm.headers)) return false
  const roles = entry.roles || ''
  if (roles.length !== paradigm.headers.length) return false
  if (paradigm.rows.some(row => row.length !== roles.length)) return false
  if (entry.v === 'switch') {
    const forms = [...roles].flatMap((role, i) => (role === 'F' ? [i] : []))
    if (forms.length < 2) return false
    if (paradigm.rows.some(row => forms.every(i => !parseCell(row[i])?.to))) return false
    return true
  }
  const primary = primaryColumn(entry)
  if (primary < 0) return false
  return paradigm.rows.every(row => Boolean(parseCell(row[primary])?.to))
}

/** The learn block: one row per key rule, with its example and the section that shows it. */
export function learnModel({ n, meta, sections, plan }) {
  const variant = figureVariant(n, meta, plan)
  const items = (meta.teaching?.key_rules || []).map((rule, i) => {
    const found = findExampleSection(sections, rule.example_tongan)
    return {
      i,
      text: rule.rule,
      ...(rule.example_tongan ? { to: rule.example_tongan } : {}),
      ...(rule.example_english ? { en: rule.example_english } : {}),
      ...(found ? { section: found } : {}),
    }
  })
  const figure = {
    href: `#fig-${n}-1`,
    label: variant === 'rules' ? `See the examples: Figure ${n}.1 ↓` : `See the pattern: Figure ${n}.1 ↓`,
  }
  return { n, items, figure }
}

/**
 * The lesson path. Each station says where it goes, how it reads completion
 * (`reads`, the storage key and field) and its state: todo, part or done.
 * Inputs are read by the caller from existing storage: `path` from
 * lft-premium-lesson-path-v1, `exStats` from lft-premium-exercises-v1, `quiz`
 * and `done` from lft-premium-progress, `deck` from lft-premium-cards-v1.
 */
export function stationsModel({
  n, meta, sections, plan, exercises = [], exStats = { total: 0, answered: 0 },
  firstUnfinishedHref = null, quizQuestions = 0, quizBest = null, deck = null,
  deckSize = 0, done = false, path = {},
}) {
  const steps = []
  const teaching = teachingSections(sections)
  const k = teaching.length
  if (k > 0) {
    const read = Number.isInteger(path.read) ? Math.min(path.read + 1, k) : 0
    const state = read >= k ? 'done' : read > 0 ? 'part' : 'todo'
    steps.push({
      key: 'learn', label: 'Learn', href: `#${teaching[0].id}`, state,
      detail: state === 'done' ? 'Read' : state === 'part' ? `${read} of ${k} read` : plural(k, 'section to read', 'sections to read'),
      count: { x: read, of: k },
      reads: 'lft-premium-lesson-path-v1 lessons[n].read',
      sections: teaching.map(section => ({ id: section.id, number: sectionNumber(sections, section.id) })),
    })
  }

  const variant = figureVariant(n, meta, plan)
  const patternDone = path.pattern === true
  steps.push({
    key: 'pattern', label: 'Pattern', href: `#fig-${n}-1`, state: patternDone ? 'done' : 'todo',
    detail: patternDone ? 'Tried' : variant === 'bespoke' ? 'Figures 1.1 to 1.4' : `Figure ${n}.1`,
    ...(!patternDone && variant !== 'bespoke' && variant !== 'rules' && meta.teaching?.paradigm?.caption ? { caption: meta.teaching.paradigm.caption } : {}),
    ...(!patternDone && variant === 'rules' ? { caption: 'The rules, by example' } : {}),
    reads: 'lft-premium-lesson-path-v1 lessons[n].pattern',
  })

  const blocks = practiceBlocks(sections)
  if (blocks.length) {
    const tried = new Set(Array.isArray(path.tried) ? path.tried : [])
    const rows = blocks.map(block => ({ ...block, tried: tried.has(block.key) }))
    const x = rows.filter(row => row.tried).length
    const state = x >= rows.length ? 'done' : x > 0 ? 'part' : 'todo'
    const firstOpen = rows.find(row => !row.tried) || rows[0]
    steps.push({
      key: 'practise', label: 'Practise', href: `#${firstOpen.anchor}`, state,
      detail: state === 'done' ? 'All tried' : state === 'part' ? `${x} of ${rows.length} tried` : plural(rows.length, 'practice block in the reading', 'practice blocks in the reading'),
      count: { x, of: rows.length },
      reads: 'lft-premium-lesson-path-v1 lessons[n].tried',
      rows,
    })
  }

  if (exercises.length && exStats.total > 0) {
    const { total, answered } = exStats
    const state = answered >= total ? 'done' : answered > 0 ? 'part' : 'todo'
    steps.push({
      key: 'exercises', label: 'Exercises', href: firstUnfinishedHref || '#exercises', state,
      detail: state === 'done' ? 'All answered' : state === 'part' ? `${answered} of ${total} answered` : `${plural(exercises.length, 'set', 'sets')} · ${plural(total, 'item', 'items')}`,
      count: { x: answered, of: total },
      reads: 'lft-premium-exercises-v1',
    })
  }

  if (quizQuestions > 0) {
    const best = quizBest && Number.isInteger(quizBest.right) ? quizBest : null
    steps.push({
      key: 'quiz', label: 'Quiz', href: `/quizzes/${n}`, route: true, state: best ? 'done' : 'todo',
      detail: best ? `Best ${best.right} of ${best.total}` : plural(quizQuestions, 'question', 'questions'),
      reads: 'lft-premium-progress quiz[n]',
    })
  }

  const words = sections.find(isWordsSection)
  if (words && deckSize > 0) {
    const known = Array.isArray(deck?.known) ? deck.known.length : 0
    const started = known > 0 || (deck?.position || 0) > 0
    const state = deck?.finished || known >= deckSize ? 'done' : started ? 'part' : 'todo'
    steps.push({
      key: 'words', label: 'Words', href: `#${words.id}`, state,
      detail: state === 'todo' ? plural(deckSize, 'word to keep', 'words to keep') : `${known} of ${deckSize} known`,
      count: { x: known, of: deckSize },
      reads: 'lft-premium-cards-v1 decks[lesson-n]',
    })
  }

  steps.push({
    key: 'finish', label: 'Finish', href: '#finish', state: done ? 'done' : 'todo',
    detail: done ? 'Done' : `Mark Lesson ${n} done`,
    reads: 'lft-premium-progress done',
  })

  const next = steps.find(step => step.state !== 'done')
  if (next) next.next = true
  return { n, steps, total: steps.length, doneCount: steps.filter(step => step.state === 'done').length }
}

const words = text => String(text).split(/\s+/).filter(Boolean)

/** Marks for one form of a row: a word is marked when another form of the row lacks it. */
export function markedWords(forms, formIndex) {
  const cells = forms.map(form => (form?.to ? words(form.to) : null))
  const shown = cells[formIndex]
  if (!shown) return []
  const others = cells.filter((cell, i) => cell && i !== formIndex).map(cell => new Set(cell.flatMap(word => norm(word))))
  if (!others.length) return shown.map(() => false)
  const shownSet = new Set(shown.flatMap(word => norm(word)))
  const shareOne = others.some(set => [...set].some(word => shownSet.has(word)))
  if (!shareOne) return shown.map(() => false)
  return shown.map(word => {
    const keys = norm(word)
    if (!keys.length) return false
    return others.some(set => keys.some(key => !set.has(key)))
  })
}

/** Words of the previous form that the next form does not hold. */
export function droppedWords(prevCell, nextCell) {
  if (!prevCell?.to || !nextCell?.to) return []
  const next = new Set(norm(nextCell.to))
  return words(prevCell.to).filter(word => norm(word).some(key => !next.has(key)))
}

function line(header, role, cell) {
  const tag = header ? { tag: header } : {}
  if (role === 'X' || role === 'G' || role === 'L') {
    const text = String(cell ?? '').trim()
    if (!text) return null
    return DASH.test(text) ? { ...tag, dash: true } : { ...tag, en: text }
  }
  const parsed = parseCell(cell)
  return parsed ? { ...tag, ...parsed } : null
}

/** Whole-word marks of a short primary word inside an example line. */
function primaryMarks(primary, text) {
  const key = norm(primary)
  if (!key.length || key.length > 2) return null
  const marks = words(text).map(word => {
    const parts = norm(word)
    return parts.length > 0 && parts.every(part => key.includes(part))
  })
  return marks.some(Boolean) ? marks : null
}

/** The figure: switch, ladder, rules fallback, or Lesson 1's bespoke figures. */
export function figureModel({ n, meta, plan }) {
  const variant = figureVariant(n, meta, plan)
  const id = `fig-${n}-1`
  if (variant === 'bespoke') {
    const figures = [1, 2, 3, 4].map(k => ({ id: `fig-${n}-${k}` }))
    return { n, id, variant, bespoke: figures.length, parts: figures.map(figure => ({ id: figure.id, kind: 'bespoke' })) }
  }
  if (variant === 'rules') {
    const rules = (meta.teaching?.key_rules || []).map((rule, i) => ({
      i,
      ...(rule.example_tongan ? { to: rule.example_tongan } : {}),
      ...(rule.example_english ? { en: rule.example_english } : {}),
      rule: rule.rule,
    }))
    return {
      n, id, variant, fallback: 'rules', title: 'The rules, by example',
      caption: 'Tap a rule to see its example.',
      rules,
      parts: rules.map(rule => ({ id: `rule-${rule.i}`, label: String(rule.i + 1) })),
    }
  }

  const entry = plan[n]
  const paradigm = meta.teaching.paradigm
  const roles = [...entry.roles]
  const headers = paradigm.headers
  const col = role => roles.flatMap((r, i) => (r === role ? [i] : []))
  const gCols = col('G')
  const labelCol = roles.indexOf('L')
  const keyCol = roles.indexOf('K')

  if (variant === 'switch') {
    const fCols = col('F')
    const forms = fCols.map((c, i) => ({ i, col: c, label: headers[c] }))
    const rows = paradigm.rows.map((row, r) => {
      const cells = fCols.map((c, fi) => {
        const parsed = parseCell(row[c]) || { dash: true }
        if (parsed.dash || parsed.gloss) return parsed
        const nextF = fCols[fi + 1] ?? roles.length
        const near = gCols.find(g => g > c && g < nextF)
        const gloss = near !== undefined ? row[near] : gCols.length === 1 ? row[gCols[0]] : null
        return gloss && String(gloss).trim() && !DASH.test(String(gloss).trim()) ? { ...parsed, glossEn: String(gloss).trim() } : parsed
      })
      const marks = cells.map((_, fi) => markedWords(cells, fi))
      const lines = roles.flatMap((role, c) => (role === 'X' || role === 'E' ? [line(headers[c], role, row[c])] : [])).filter(Boolean)
      const firstForm = cells.find(cell => cell.to)
      const chip = labelCol >= 0 && String(row[labelCol]).trim()
        ? { en: String(row[labelCol]).trim() }
        : keyCol >= 0 && parseCell(row[keyCol])?.to
          ? { to: parseCell(row[keyCol]).to }
          : firstForm?.gloss ? { en: firstForm.gloss } : firstForm?.glossEn ? { en: firstForm.glossEn } : { to: firstForm.to }
      return { r, cells, marks, lines, chip }
    })
    const anyMarks = rows.some(row => row.marks.some(list => list.some(Boolean)))
    return {
      n, id, variant, title: paradigm.caption, forms, rows,
      caption: anyMarks ? 'Tap a form to switch. Marked words differ between the forms of a row.' : 'Tap a form to switch.',
      parts: [...forms.map(form => ({ id: `form-${form.i}` })), ...rows.map(row => ({ id: `row-${row.r}` }))],
    }
  }

  // ladder
  const primary = primaryColumn(entry)
  const oneG = gCols.length === 1 ? gCols[0] : -1
  let anyMarks = false
  const rows = paradigm.rows.map((row, r) => {
    const cell = parseCell(row[primary])
    const glossEn = !cell.gloss && oneG >= 0 && String(row[oneG]).trim() && !DASH.test(String(row[oneG]).trim()) ? String(row[oneG]).trim() : null
    const lines = roles.flatMap((role, c) => {
      if (c === primary || c === labelCol || c === oneG) return []
      if (role === 'K' && c === keyCol && labelCol < 0) return []
      const item = line(headers[c], role, row[c])
      if (!item) return []
      if ((role === 'E' || role === 't') && item.to) {
        const marks = primaryMarks(cell.to, item.to)
        if (marks) { anyMarks = true; return [{ ...item, marks }] }
      }
      return [item]
    })
    const chip = labelCol >= 0 && String(row[labelCol]).trim()
      ? { en: String(row[labelCol]).trim() }
      : keyCol >= 0 && parseCell(row[keyCol])?.to ? { to: parseCell(row[keyCol]).to } : { to: cell.to }
    return { r, cell: glossEn ? { ...cell, glossEn } : cell, lines, chip }
  })
  return {
    n, id, variant, title: paradigm.caption, rows, primary,
    caption: anyMarks ? 'Tap a button to see that row of the table. The marked word is the one shown large.' : 'Tap a button to see that row of the table.',
    parts: rows.map(row => ({ id: `row-${row.r}` })),
  }
}

/** Where the figure goes: after the teaching block holding the most primary strings (at least 2). */
export function figureAnchor({ n, sections, meta, plan }) {
  const model = figureModel({ n, meta, plan })
  if (model.variant === 'bespoke') return null
  const primaries = model.variant === 'switch'
    ? model.rows.flatMap(row => row.cells.filter(cell => cell.to).map(cell => cell.to))
    : model.variant === 'ladder'
      ? model.rows.map(row => row.cell.to)
      : model.rules.filter(rule => rule.to).map(rule => rule.to)
  const keys = primaries.map(text => norm(text)).filter(list => list.length)
  const teaching = teachingSections(sections)
  let best = null
  for (const section of teaching) {
    section.blocks.forEach((block, index) => {
      if (!['table', 'examples', 'pairs'].includes(block.type)) return
      const hay = norm(blockText(block))
      const score = keys.filter(key => contains(hay, key)).length
      if (score >= 2 && (!best || score > best.score)) best = { sectionId: section.id, index, score, blockType: block.type }
    })
  }
  if (!best && teaching.length) {
    const first = teaching[0]
    best = { sectionId: first.id, index: Math.max(0, first.blocks.length - 1), score: 0, blockType: first.blocks.at(-1)?.type || 'none' }
  }
  if (!best) return null
  return { ...best, sectionNumber: sectionNumber(sections, best.sectionId) }
}
