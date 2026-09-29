import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDictionary, searchDictionary } from '../lib/course-dictionary.js'
import { buildWordListSearchEntries, buildWordLists, wordListSearchLabel } from '../lib/word-lists.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const vocabulary = JSON.parse(fs.readFileSync(path.join(here, '../../data/book-vocabulary.json'), 'utf8'))
const data = JSON.parse(fs.readFileSync(path.join(here, '../data/word-lists.json'), 'utf8'))
const courseById = new Map(vocabulary.map(row => [row.id, row]))

// The evidence file lives in the private project folder beside this app
// (reviews/dictionary-word-lists-2026-09-29/word-lists-evidence.tsv). Walk up
// from the app until it is found; a clone without it skips only that check.
const EVIDENCE = path.join('reviews', 'dictionary-word-lists-2026-09-29', 'word-lists-evidence.tsv')
function findEvidence() {
  let dir = here
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, EVIDENCE)
    if (fs.existsSync(candidate)) return candidate
    dir = path.dirname(dir)
  }
  return null
}

function readEvidence(file) {
  const [header, ...lines] = fs.readFileSync(file, 'utf8').trim().split('\n')
  const columns = header.split('\t')
  return lines.map(line => Object.fromEntries(line.split('\t').map((value, i) => [columns[i], value])))
}

const evidenceFile = findEvidence()

test('every word-list row has an evidence row marked publish, and only publish rows are on the site', { skip: evidenceFile ? false : `evidence file not found (${EVIDENCE})` }, () => {
  const evidence = readEvidence(evidenceFile)
  const byId = new Map(evidence.map(row => [row.evidence_id, row]))
  for (const row of data.entries) {
    const found = byId.get(row.id)
    assert.ok(found, `${row.id} has an evidence row`)
    assert.equal(found.decision, 'publish', `${row.id} is marked publish`)
    assert.equal(found.tongan_display, row.tongan, `${row.id} shows the evidenced spelling`)
    assert.equal(found.english_gloss, row.english, `${row.id} shows the evidenced gloss`)
    assert.equal(found.register, row.register || '', `${row.id} keeps its register label`)
    assert.equal(data.themes.find(theme => theme.id === row.theme)?.label, found.theme, `${row.id} is in its evidenced theme`)
  }
  const published = evidence.filter(row => row.decision === 'publish')
  assert.equal(data.entries.length, published.length, 'the JSON holds exactly the publish rows')
  for (const row of evidence.filter(item => item.decision !== 'publish')) {
    assert.equal(row.decision, 'queue', `${row.evidence_id} is either publish or queue`)
    assert.equal(data.entries.some(entry => entry.id === row.evidence_id), false, `${row.evidence_id} (queued) stays off the site`)
  }
})

test('the 649 course entries are unchanged, and course words in a list keep the course spelling and gloss', () => {
  const entries = buildDictionary(vocabulary)
  assert.equal(vocabulary.length, 649)
  assert.equal(entries.length, 649)
  const before = JSON.stringify(entries)
  const extra = buildWordListSearchEntries(data)
  const combined = [...entries, ...extra]
  assert.equal(JSON.stringify(combined.slice(0, 649)), before, 'course rows come first and are untouched')
  assert.equal(JSON.stringify(buildDictionary(vocabulary)), before)
  for (const entry of extra) {
    assert.equal(courseById.has(entry.id), false, `${entry.id} does not reuse a course id`)
    assert.equal(entry.wordList, true)
    assert.equal(entry.href, `/word-lists#${data.entries.find(row => row.id === entry.id).theme}`)
  }
  const courseRows = data.entries.filter(row => row.course_id)
  assert.equal(extra.length, data.entries.length - courseRows.length, 'course words are never added to search twice')
  for (const row of courseRows) {
    const course = courseById.get(row.course_id)
    assert.ok(course, `${row.id} points at a real course row`)
    assert.equal(row.tongan, course.tongan, `${row.id} keeps the course spelling`)
    assert.equal(row.english, course.english, `${row.id} keeps the course gloss`)
  }
  for (const row of data.entries.filter(item => item.other_sense_course_id)) {
    assert.ok(courseById.has(row.other_sense_course_id), `${row.id} other-sense link is a real course row`)
  }
})

test('an English body word finds its word-list row, labelled and linked to its section', () => {
  const combined = [...buildDictionary(vocabulary), ...buildWordListSearchEntries(data)]
  const knee = searchDictionary(combined, 'knee')
  const tui = knee.find(entry => entry.tongan === 'tui')
  assert.ok(tui, 'a search for "knee" returns tui')
  assert.equal(tui.label, wordListSearchLabel('Parts of body'))
  assert.equal(tui.label, 'Word list: Parts of body, not taught in the lessons')
  assert.equal(tui.href, '/word-lists#parts-of-body')
  const mata = searchDictionary(combined, 'mata')
  const courseMata = mata.findIndex(entry => entry.id === 'book-v0498')
  const listMata = mata.findIndex(entry => entry.wordList && entry.english === 'face, eyes')
  assert.ok(courseMata >= 0 && listMata > courseMata, 'the course row for mata ranks ahead of the word-list sense')
})

test('the /word-lists page groups every row under its theme', () => {
  const themes = buildWordLists(data, vocabulary)
  assert.deepEqual(themes.map(theme => theme.id), ['parts-of-body', 'colours', 'land-animals'])
  const allRows = themes.flatMap(theme => theme.rows)
  assert.equal(allRows.length, data.entries.length)
  assert.equal(allRows.filter(row => row.taught).length, data.entries.filter(row => row.course_id).length)
  const body = themes.find(theme => theme.id === 'parts-of-body').rows
  assert.ok(body.find(row => row.tongan === 'nima').taught.href === '/lessons/17')
  assert.ok(allRows.filter(row => row.otherSense).every(row => row.otherSense.href?.startsWith('/lessons/')))
})
