// Validate remark-merge-vocab against every chapter: after the transform each
// chapter must hold exactly ONE vocab-list table, its row count = the sum of the
// originals, header = Tongan | Type | English, and no "New grammar words / New
// vocabulary" label paragraphs left behind.
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { toString } from 'mdast-util-to-string'
import remarkMergeVocab from '../src/lib/remark-merge-vocab.js'

const here = dirname(fileURLToPath(import.meta.url))
const bookDir = join(here, '..', '..', 'book')

const cellText = (cell) => toString(cell).trim()
const headerOf = (t) => (t.children?.[0]?.children || []).map(cellText)
function isVocabList(n) {
  if (!n || n.type !== 'table') return false
  const h = headerOf(n)
  if (h.length !== 3) return false
  const lc = h.map((s) => s.toLowerCase())
  return lc[0] === 'tongan' && (lc[1] === 'type' || lc[1] === 'function') && lc[2] === 'english'
}
const isLabel = (n) => n.type === 'paragraph' && /^New (grammar words|vocabulary)\b/i.test(toString(n).trim())
const bodyRows = (t) => t.children.length - 1

const files = readdirSync(bookDir).filter((f) => /^Chapter-\d+\.md$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))

let pass = 0
const fails = []

for (const f of files) {
  const md = readFileSync(join(bookDir, f), 'utf8')
  const ch = f.match(/\d+/)[0]

  // before: sum of vocab-list rows + count of label paras
  const before = unified().use(remarkParse).use(remarkGfm).parse(md)
  const beforeTables = before.children.filter(isVocabList)
  const beforeRows = beforeTables.reduce((s, t) => s + bodyRows(t), 0)

  // after: parse + apply the transform
  const after = unified().use(remarkParse).use(remarkGfm).parse(md)
  remarkMergeVocab()(after)
  const afterTables = after.children.filter(isVocabList)
  const afterRows = afterTables.reduce((s, t) => s + bodyRows(t), 0)
  const labelsLeft = after.children.filter(isLabel).length

  const errs = []
  if (beforeTables.length > 0 && afterTables.length !== 1) errs.push(`tables ${beforeTables.length}→${afterTables.length} (want 1)`)
  if (afterRows !== beforeRows) errs.push(`rows ${beforeRows}→${afterRows} (mismatch)`)
  if (afterTables[0] && headerOf(afterTables[0])[1] !== 'Type') errs.push(`middle header = "${headerOf(afterTables[0])[1]}" (want Type)`)
  if (labelsLeft !== 0) errs.push(`${labelsLeft} label para(s) left`)

  if (errs.length) fails.push(`Ch ${ch}: ${errs.join('; ')}`)
  else { pass++; }
}

console.log(`PASS ${pass}/${files.length}`)
if (fails.length) { console.log('\nFAILURES:'); fails.forEach((x) => console.log('  ' + x)); process.exit(1) }
else console.log('All chapters merge to a single Tongan|Type|English table, rows conserved, labels stripped.')
