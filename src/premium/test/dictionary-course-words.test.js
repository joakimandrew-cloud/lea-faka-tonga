import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer } from 'vite'
import {
  APP_ROOT, COURSE_WORDS_FILE, chapterFile, evidenceStrings, lessonHoldsWord, loadDictionaryIndex, readDictionaryEvidence, readDictionarySources,
} from '../../../scripts/lib/dictionary-data.mjs'
import { buildDictionary, searchDictionary } from '../lib/course-dictionary.js'
import { COURSE_WORD_FOUND_IN, COURSE_WORD_LABEL, buildCourseWordSearchEntries, courseWordFoundInNote, courseWordRows } from '../lib/dictionary-course-words.js'
import { buildDictionaryIndex } from '../lib/dictionary-pages.js'
import { dictionaryPageMeta } from '../../seo/meta.js'

// Course words (plan 2026-11-18-dictionary-course-words): words the lessons use
// that the course word list leaves out, in a data file of their own. Nothing
// here depends on how many words the file holds or which ones.

const read = file => fs.readFileSync(path.join(APP_ROOT, file), 'utf8')
const { vocabulary, wordLists, courseWords, additions } = readDictionarySources()
const evidence = readDictionaryEvidence()
const index = loadDictionaryIndex()
const storedExamples = JSON.parse(read('src/premium/data/dictionary-examples.json')).examples
const rows = courseWords.entries
const lessonRows = rows.filter(row => !row.found_in)
const foundInRows = rows.filter(row => row.found_in)

test('the loader keeps a word with a lesson of the course and drops the rest, and reads no other field', () => {
  const good = { id: 'cw-1', tongan: 'ika', english: 'fish', part_of_speech: 'noun', lesson: 3 }
  const kept = courseWordRows({ entries: [
    good,
    { ...good, id: 'cw-2', tongan: '   ' },
    { ...good, id: 'cw-3', lesson: 0 },
    { ...good, id: 'cw-4', lesson: 53 },
    { ...good, id: 'cw-5', lesson: '3' },
    { ...good, id: 'cw-6', lesson: 2.5 },
    { ...good, id: 'cw-7', lesson: null },
    null,
    { ...good, id: 'cw-8', tongan: 7 },
  ] })
  assert.deepEqual(kept.map(row => row.id), ['cw-1'])
  // found_in is kept when it is "workbook" or "quiz" and dropped otherwise.
  const found = courseWordRows({ entries: [
    { ...good, id: 'cw-1', found_in: 'workbook' },
    { ...good, id: 'cw-2', found_in: 'quiz' },
    { ...good, id: 'cw-3', found_in: 'lesson' },
    { ...good, id: 'cw-4', found_in: '' },
    { ...good, id: 'cw-5', found_in: null },
    { ...good, id: 'cw-6', found_in: 'Workbook' },
    { ...good, id: 'cw-7' },
  ] })
  assert.deepEqual(found.map(row => row.found_in), ['workbook', 'quiz', undefined, undefined, undefined, undefined, undefined])
  assert.equal(found.some((row, at) => at >= 2 && 'found_in' in row), false)
  assert.deepEqual(COURSE_WORD_FOUND_IN, ['workbook', 'quiz'])
  assert.equal(courseWordFoundInNote('workbook'), ' (in the workbook)')
  assert.equal(courseWordFoundInNote('quiz'), ' (in the quiz)')
  assert.equal(courseWordFoundInNote(null), '')
  assert.equal(courseWordFoundInNote('lesson'), '')
  assert.deepEqual(courseWordRows(null), [])
  assert.deepEqual(courseWordRows({}), [])
  assert.deepEqual(courseWordRows({ entries: 'no' }), [])
})

test('the data file holds only what a page shows, with unique ids, and every row can be shown', () => {
  assert.deepEqual(Object.keys(courseWords).sort(), ['entries', 'note'])
  assert.ok(rows.length > 0, 'the file holds words to check')
  assert.equal(courseWordRows(courseWords).length, rows.length, 'every row has a word and a lesson of the course')
  const taken = new Set([...vocabulary, ...wordLists.entries, ...additions.entries].map(row => row.id))
  for (const row of rows) {
    assert.match(row.id, /^cw-\d{4}$/)
    assert.equal(taken.has(row.id), false, `${row.id} is not an id of another data file`)
    assert.deepEqual(Object.keys(row).sort(), ['english', ...('found_in' in row ? ['found_in'] : []), 'id', 'lesson', 'part_of_speech', 'tongan'], `${row.id} holds only what its page shows`)
    if ('found_in' in row) assert.ok(COURSE_WORD_FOUND_IN.includes(row.found_in), `${row.id}: found_in is workbook or quiz`)
    assert.ok(row.english && row.part_of_speech && row.tongan, `${row.id} has a word, a meaning and a part of speech`)
  }
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length)
  // The note and the rows name no source.
  const text = read(COURSE_WORDS_FILE)
  for (const needle of evidenceStrings(evidence)) assert.equal(text.includes(needle), false, `${COURSE_WORDS_FILE} holds "${needle.slice(0, 50)}"`)
  assert.doesNotMatch(text, /Churchward|Shumway|EALD|audits\/|"sources"|"source"|"location"/)
})

test('each course word has sources in the evidence file, and the evidence names no other id', () => {
  const records = evidence.courseWords
  assert.ok(Array.isArray(records))
  assert.deepEqual(records.map(item => item.id), rows.map(row => row.id), 'one record per course word, in the data file\'s order')
  for (const item of records) {
    assert.deepEqual(Object.keys(item).sort(), ['id', 'sources'])
    assert.ok(item.sources.length >= 1, `${item.id} has a source`)
    for (const cite of item.sources) {
      // One of the four sources by name, then a place in it: a printed page, an
      // entry counted from 1, or a line of the source's file.
      assert.match(cite, /^(?:Churchward, Tongan Dictionary \(1959\), |Shumway, Intensive Course in Tongan, |EALD Bilingual Dictionary for ESL Beginners \(NSW Dept of Education, 2001\), |Churchward, Tongan Grammar)/, `${item.id}: a citation names the source`)
      assert.match(cite, /\bp\. \d+|\bentr(?:y|ies) \d+|\.md:\d+/, `${item.id}: a citation names the place`)
    }
  }
  // The evidence file's strings include the course words' citations, so the proof that none is in dist/ covers them.
  const strings = evidenceStrings(evidence)
  for (const item of records) for (const cite of item.sources) assert.ok(strings.includes(cite.trim()), `${item.id}: "${cite.slice(0, 40)}" is among the strings kept out of dist/`)
})

test('the label is "Used in", and the page meta says it where a course row says "Taught in"', () => {
  assert.equal(COURSE_WORD_LABEL, 'Used in')
  assert.doesNotMatch(COURSE_WORD_LABEL, /—/)
  const course = index.entries.find(entry => entry.kind === 'course' && entry.lesson)
  const word = index.entries.find(entry => entry.kind === 'course-word' && !entry.foundIn)
  assert.match(dictionaryPageMeta(index.pageBySlug.get(course.slug)).description, /Taught in Lesson \d+/)
  const description = dictionaryPageMeta(index.pageBySlug.get(word.slug)).description
  assert.ok(description.includes(`${COURSE_WORD_LABEL} ${word.lesson.label}.`), description)
  assert.equal(description.includes('Taught in'), false)
})

test('search entries are shaped as a course row is, with its lesson link, and sorted in dictionary order', () => {
  const entries = buildCourseWordSearchEntries(courseWords)
  assert.equal(entries.length, rows.length)
  const courseEntry = buildDictionary(vocabulary).find(entry => entry.lesson)
  for (const entry of entries) {
    const row = rows.find(item => item.id === entry.id)
    assert.deepEqual([entry.tongan, entry.english, entry.partOfSpeech, entry.lesson], [row.tongan, row.english, row.part_of_speech, row.lesson])
    assert.equal(entry.label, `Lesson ${row.lesson}`)
    assert.equal(entry.href, `/lessons/${row.lesson}`)
    assert.equal(entry.wordHref, `/dictionary/${index.rowPage.get(row.id)}`)
    assert.equal(entry.courseWord, true)
    assert.equal(entry.added, undefined)
    assert.equal(entry.foundIn, row.found_in || null)
    assert.deepEqual(Object.keys(entry).filter(key => key !== 'courseWord' && key !== 'foundIn').sort(), Object.keys(courseEntry).sort(), 'the same fields as a course row')
  }
  for (let i = 1; i < entries.length; i += 1) assert.ok(entries[i - 1].tonganKey.localeCompare(entries[i].tonganKey) <= 0)
  // Search finds each one by its word and shows the lesson link a course row shows.
  for (const entry of entries) {
    const found = searchDictionary(entries, entry.tongan)
    assert.ok(found.some(item => item.id === entry.id), `${entry.tongan} is found`)
  }
  assert.deepEqual(buildCourseWordSearchEntries({ entries: [{ id: 'cw-1', tongan: 'x', english: 'y', part_of_speech: 'noun', lesson: 99 }] }), [])
})

test('the index makes each course word an entry of its own kind, as a course row is, with a lesson', () => {
  const entries = index.entries.filter(entry => entry.kind === 'course-word')
  assert.equal(entries.length, rows.length)
  const course = index.entries.find(entry => entry.kind === 'course' && entry.lesson)
  for (const entry of entries) {
    const row = rows.find(item => item.id === entry.id)
    assert.equal(entry.lesson.number, row.lesson)
    assert.equal(entry.lesson.href, `/lessons/${row.lesson}`)
    assert.match(entry.lesson.label, new RegExp(`^Lesson ${row.lesson}: .+`))
    assert.deepEqual(Object.keys(entry.lesson).sort(), Object.keys(course.lesson).sort(), 'the lesson info has the fields a course row has')
    assert.equal(entry.supplemental, false)
    assert.equal(entry.added, null)
    assert.equal(entry.wordList, null)
    assert.deepEqual(Object.keys(entry).filter(key => key !== 'foundIn').sort(), Object.keys(course).sort(), 'the same fields as a course entry')
    assert.equal(entry.foundIn, row.found_in || null)
    assert.equal(index.rowPage.get(entry.id), entry.slug)
    assert.ok(index.pageBySlug.get(entry.slug).rowIds.includes(entry.id))
    // Sentences: the printed pairs of its own lesson, by the same rule, and the same ones the generated file holds.
    assert.deepEqual(entry.examples.map(pair => ({ tongan: pair.tongan, english: pair.english, line: pair.line, kind: pair.kind, at: pair.at })), storedExamples[entry.id] || [])
    for (const pair of entry.examples) assert.ok(read(chapterFile(entry.lesson.number)).split('\n')[pair.line - 1].includes(pair.tongan), `${entry.id}: the pair is printed in its lesson`)
  }
  assert.ok(entries.some(entry => entry.examples.length), 'at least one course word takes a printed sentence (the pilot holds such words)')
  for (const entry of entries.filter(item => item.foundIn)) assert.equal(entry.examples.length, 0, `${entry.id}: a ${entry.foundIn} word takes no sentence`)
})

test('on a page shared with other kinds: course rows, then course words, then word-list rows, then added words; and they join lesson groups and English pages', () => {
  const vocab = [
    { id: 'book-v1', tongan: 'ika', english: 'fish', part_of_speech: 'noun', chapter: 9 },
    { id: 'book-v2', tongan: 'kai', english: 'eat', part_of_speech: 'verb', chapter: 5 },
    { id: 'book-v3', tongan: 'inu', english: 'drink', part_of_speech: 'verb', chapter: 6 },
  ]
  const lists = { themes: [{ id: 'theme-a', label: 'Animals' }], entries: [{ id: 'wl-1', theme: 'theme-a', tongan: 'ika', english: 'fish (list)', part_of_speech: 'noun' }] }
  const cw = { entries: [
    { id: 'cw-0002', tongan: 'ika', english: 'fish (used)', part_of_speech: 'noun', lesson: 2 },
    { id: 'cw-0001', tongan: 'ika', english: 'fish (also)', part_of_speech: 'noun', lesson: 1 },
    { id: 'cw-0003', tongan: 'lolo', english: 'oil', part_of_speech: 'noun', lesson: 5 },
  ] }
  const add = { entries: [{ id: 'add-1', tongan: 'ika', english: 'fish (added)', part_of_speech: 'noun' }] }
  const chapters = [{ chapter: 5, title: 'Five' }, { chapter: 2, title: 'Two' }]
  // The data's arrays are given in the opposite order to the one expected, so the order shown is the index's own.
  const built = buildDictionaryIndex({ vocabulary: [...vocab].reverse(), wordLists: lists, courseWords: cw, additions: add, chapters, examples: {} })
  const page = built.pageBySlug.get('ika')
  assert.deepEqual(page.entries.map(entry => `${entry.kind}:${entry.id}`), ['course:book-v1', 'course-word:cw-0001', 'course-word:cw-0002', 'word-list:wl-1', 'added:add-1'])
  assert.equal(page.entries[1].lesson.label, 'Lesson 1')
  assert.equal(page.entries[2].lesson.label, 'Lesson 2: Two')
  assert.deepEqual(page.rowIds.slice().sort(), ['add-1', 'book-v1', 'cw-0001', 'cw-0002', 'wl-1'])
  // They count in the same-lesson groups, on both sides.
  const lolo = built.pageBySlug.get('lolo')
  assert.deepEqual(lolo.sameLesson.map(group => [group.lesson.number, group.words.map(word => word.path)]), [[5, ['/dictionary/kai']]])
  assert.deepEqual(built.pageBySlug.get('kai').sameLesson.map(group => [group.lesson.number, group.words.map(word => word.path)]), [[5, ['/dictionary/lolo']]])
  assert.deepEqual(built.pageBySlug.get('ika').sameLesson, [], 'no other word stands in lessons 1, 2 or 9')
  // Their meanings give English pages by the rule course rows follow.
  assert.deepEqual(built.englishBySlug.get('oil').entries.map(entry => entry.id), ['cw-0003'])
  assert.equal(built.englishBySlug.get('oil').sources[0].origin, 'meaning')
  // Without the file the pages are those of the course and the lists.
  const without = buildDictionaryIndex({ vocabulary: vocab, wordLists: lists, additions: add, chapters, examples: {} })
  assert.equal(without.pageBySlug.has('lolo'), false)
  assert.deepEqual(without.pageBySlug.get('ika').entries.map(entry => entry.kind), ['course', 'word-list', 'added'])
  // An id the dictionary already has is refused, from the course or from a word list.
  assert.throws(() => buildDictionaryIndex({ vocabulary: vocab, wordLists: lists, courseWords: { entries: [{ ...cw.entries[0], id: 'book-v1' }] }, chapters }), /already has/)
  assert.throws(() => buildDictionaryIndex({ vocabulary: vocab, wordLists: lists, courseWords: { entries: [{ ...cw.entries[0], id: 'wl-1' }] }, chapters }), /already has/)
  // A word that cannot get an address is refused.
  assert.throws(() => buildDictionaryIndex({ vocabulary: vocab, wordLists: lists, courseWords: { entries: [{ ...cw.entries[0], tongan: '...' }] }, chapters }), /No web address/)
})

test('in the real index a course word sorts after the course rows of its page and before the word-list rows', () => {
  const rank = { course: 0, 'course-word': 1, 'word-list': 2, added: 3 }
  for (const page of index.pages) {
    const ranks = page.entries.map(entry => rank[entry.kind])
    assert.deepEqual(ranks, ranks.slice().sort((a, b) => a - b), `${page.path} keeps the order of the kinds`)
  }
  assert.ok(index.pages.some(page => page.entries.some(entry => entry.kind === 'course-word')))
})

test('the course words are the dictionary\'s own: book-vocabulary.json, the cards and the games do not see them', () => {
  // The index changes no data it is given.
  const before = JSON.stringify([vocabulary, wordLists, courseWords, additions])
  buildDictionaryIndex({ ...readDictionarySources(), examples: storedExamples })
  assert.equal(JSON.stringify([vocabulary, wordLists, courseWords, additions]), before)
  // The course word list holds none of them: 649 rows, all its own ids, none of the file's words with its meaning.
  assert.equal(vocabulary.length, 649)
  for (const row of vocabulary) assert.match(row.id, /^book-v\d{4}$/)
  for (const row of rows) assert.equal(vocabulary.some(item => item.id === row.id || (item.tongan === row.tongan && item.english === row.english)), false)
  // The cards, the games, the lessons and every list read book-vocabulary.json; no file outside the dictionary reads the new file.
  const walk = dir => fs.readdirSync(path.join(APP_ROOT, dir), { withFileTypes: true }).flatMap(entry => {
    const rel = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(rel) : /\.(?:jsx?|mjs|json)$/.test(entry.name) ? [rel] : []
  })
  const readers = [...walk('src'), ...walk('scripts')]
    .filter(file => !/\.test\.js$/.test(file) && !file.endsWith('dictionary-course-words.json') && !/data\/dictionary-examples\.json$/.test(file))
    .filter(file => /dictionary-course-words|courseWords|COURSE_WORDS_FILE/.test(read(file)))
    .map(file => file.split(path.sep).join('/'))
    .sort()
  assert.deepEqual(readers, [
    'scripts/build-dictionary-data.mjs',
    'scripts/check-dictionary-pages.mjs',
    'scripts/dictionary-evidence.json',
    'scripts/lib/dictionary-data.mjs',
    'scripts/prerender.mjs',
    'src/premium/lib/dictionary-course-words.js',
    'src/premium/lib/dictionary-data.js',
    'src/premium/lib/dictionary-pages.js',
    'src/premium/pages/DictionaryWord.jsx',
  ])
  // Only one file of the app imports the data file itself.
  const importers = walk('src').filter(file => !/\.test\.js$/.test(file) && /^import .*dictionary-course-words\.json/m.test(read(file))).map(file => file.split(path.sep).join('/'))
  assert.deepEqual(importers, ['src/premium/lib/dictionary-data.js'])
})

test('every course word stands in the lesson its page links to (an acute set aside), and the check can fail', () => {
  for (const row of lessonRows) assert.equal(lessonHoldsWord(read(chapterFile(row.lesson)), row.tongan), true, `${row.id} ${row.tongan} is in lesson ${row.lesson}`)
  // A word with found_in is one its lesson does not print.
  for (const row of foundInRows) assert.equal(lessonHoldsWord(read(chapterFile(row.lesson)), row.tongan), false, `${row.id} ${row.tongan} is not in lesson ${row.lesson}`)
  // A wrong lesson number is caught: for each word, some lesson does not hold it.
  for (const row of lessonRows) {
    const elsewhere = Array.from({ length: 52 }, (unused, at) => at + 1).find(number => !lessonHoldsWord(read(chapterFile(number)), row.tongan))
    assert.ok(elsewhere, `${row.tongan} is missing from at least one lesson`)
    assert.equal(lessonHoldsWord(read(chapterFile(elsewhere)), row.tongan), false)
  }
  // A word that is not in the lesson at all is caught.
  assert.equal(lessonHoldsWord(read(chapterFile(lessonRows[0].lesson)), 'zzqx'), false)
  // An acute is set aside and a macron is not; a longer word does not hold a shorter one.
  assert.equal(lessonHoldsWord("*Na'á ku mohe.*", "na'a"), true)
  assert.equal(lessonHoldsWord('*falé*', 'fale'), true)
  assert.equal(lessonHoldsWord('*mālō*', 'malo'), false)
  assert.equal(lessonHoldsWord("*'ou*", 'ou'), false)
  assert.equal(lessonHoldsWord('*ouou*', 'ou'), false)
})

// ---- words only a workbook or a quiz prints (found_in) -----------------------

test('a word with found_in: no sentences, no same-lesson group, the words after the lesson link, and the description', () => {
  const vocab = [
    { id: 'book-v1', tongan: 'kai', english: 'eat', part_of_speech: 'verb', chapter: 5 },
    { id: 'book-v2', tongan: 'inu', english: 'drink', part_of_speech: 'verb', chapter: 5 },
  ]
  const cw = { entries: [
    { id: 'cw-0001', tongan: 'lolo', english: 'oil', part_of_speech: 'noun', lesson: 5 },
    { id: 'cw-0002', tongan: 'mata', english: 'eye (workbook)', part_of_speech: 'noun', lesson: 5, found_in: 'workbook' },
    { id: 'cw-0003', tongan: 'tuki', english: 'knock (quiz)', part_of_speech: 'verb', lesson: 5, found_in: 'quiz' },
    { id: 'cw-0004', tongan: 'vai', english: 'water', part_of_speech: 'noun', lesson: 5, found_in: 'lesson' },
  ] }
  const chapters = [{ chapter: 5, title: 'Five' }]
  // A pair printed for every row would give each of them a sentence; a found_in row must still take none.
  const pair = { tongan: 'x', english: 'y', line: 3, kind: 'line', at: [0, 1] }
  const examples = Object.fromEntries(['book-v1', 'cw-0001', 'cw-0002', 'cw-0003', 'cw-0004'].map(id => [id, [pair]]))
  const built = buildDictionaryIndex({ vocabulary: vocab, wordLists: { themes: [], entries: [] }, courseWords: cw, chapters, examples })
  const get = id => built.entries.find(entry => entry.id === id)
  assert.equal(get('cw-0001').foundIn, null)
  assert.equal(get('cw-0002').foundIn, 'workbook')
  assert.equal(get('cw-0003').foundIn, 'quiz')
  assert.equal(get('cw-0004').foundIn, null, 'a value other than workbook or quiz is dropped')
  assert.equal(get('cw-0001').examples.length, 1)
  assert.equal(get('cw-0002').examples.length, 0, 'no sentences for a workbook word')
  assert.equal(get('cw-0003').examples.length, 0, 'no sentences for a quiz word')
  for (const id of ['cw-0002', 'cw-0003']) assert.equal(get(id).lesson.href, '/lessons/5', 'it still links to its lesson')
  // It is in no same-lesson group, and its own page has none.
  const groupPaths = slug => built.pageBySlug.get(slug).sameLesson.flatMap(group => group.words.map(word => word.path))
  assert.deepEqual(groupPaths('mata'), [])
  assert.deepEqual(groupPaths('tuki'), [])
  assert.deepEqual(built.pageBySlug.get('mata').sameLesson, [])
  assert.deepEqual(groupPaths('kai').sort(), ['/dictionary/inu', '/dictionary/lolo', '/dictionary/vai'])
  for (const slug of ['kai', 'inu', 'lolo', 'vai']) assert.equal(groupPaths(slug).some(link => /mata|tuki/.test(link)), false, `${slug}'s group leaves out the workbook and quiz words`)
  // The description says where it is found.
  assert.equal(dictionaryPageMeta(built.pageBySlug.get('mata')).description, 'mata in Tongan: eye (workbook). Part of speech: noun. Used in the workbook for Lesson 5: Five.')
  assert.equal(dictionaryPageMeta(built.pageBySlug.get('tuki')).description, 'tuki in Tongan: knock (quiz). Part of speech: verb. Used in the quiz for Lesson 5: Five.')
  assert.equal(dictionaryPageMeta(built.pageBySlug.get('lolo')).description, 'lolo in Tongan: oil. Part of speech: noun. Used in Lesson 5: Five.')
  // They list and search as course words do.
  assert.deepEqual(buildCourseWordSearchEntries(cw).map(entry => [entry.tongan, entry.label, entry.foundIn]), [['lolo', 'Lesson 5', null], ['mata', 'Lesson 5', 'workbook'], ['tuki', 'Lesson 5', 'quiz'], ['vai', 'Lesson 5', null]])
})

test('in the real index a found_in word has no sentences, no same-lesson group and no place in anyone\'s group', () => {
  const entries = index.entries.filter(entry => entry.foundIn)
  assert.equal(entries.length, foundInRows.length)
  const paths = new Set(entries.map(entry => entry.path))
  for (const entry of entries) {
    assert.equal(entry.kind, 'course-word')
    assert.deepEqual(entry.examples, [])
    assert.ok(!(entry.id in storedExamples), `${entry.id} has no stored sentence`)
    const page = index.pageBySlug.get(entry.slug)
    if (page.entries.length === 1) assert.deepEqual(page.sameLesson, [], `${entry.path} has no same-lesson group`)
  }
  for (const page of index.pages) {
    for (const group of page.sameLesson) for (const word of group.words) {
      const target = index.pageBySlug.get(word.path.replace('/dictionary/', ''))
      const onlyFoundIn = paths.has(word.path) && target.entries.every(entry => entry.foundIn)
      assert.equal(onlyFoundIn, false, `${page.path}'s group lists ${word.path}, a workbook or quiz word`)
    }
  }
})

test('the word page says "Used in" with the lesson link and the words after it, and no example block', async () => {
  const server = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
  try {
    const { default: DictionaryWord } = await server.ssrLoadModule('/src/premium/pages/DictionaryWord.jsx')
    const html = slug => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [`/dictionary/${slug}`] },
      React.createElement(Routes, null, React.createElement(Route, { path: '/dictionary/:slug', element: React.createElement(DictionaryWord) }))))
    const show = row => html(index.rowPage.get(row.id))
    assert.ok(foundInRows.length > 0, 'the file holds a workbook or quiz word')
    for (const row of foundInRows) {
      const page = show(row)
      assert.match(page, new RegExp(`<dt>${COURSE_WORD_LABEL}</dt><dd><a href="/lessons/${row.lesson}"[^>]*>[^<]*</a> \\(in the ${row.found_in}\\)</dd>`), `${row.id}: the line names the lesson link and the ${row.found_in}`)
      assert.equal(page.includes('From Lesson'), false, `${row.id}: no sentences`)
      if (index.pageBySlug.get(index.rowPage.get(row.id)).entries.length === 1) assert.equal(page.includes('Taught in the same lesson'), false, `${row.id}: no same-lesson group`)
    }
    // A lesson word reads as before, with nothing after the link.
    const lesson = lessonRows.find(row => index.pageBySlug.get(index.rowPage.get(row.id)).entries.length === 1)
    assert.match(show(lesson), new RegExp(`<dt>${COURSE_WORD_LABEL}</dt><dd><a href="/lessons/${lesson.lesson}"[^>]*>[^<]*</a></dd>`))
  } finally {
    await server.close()
  }
})
