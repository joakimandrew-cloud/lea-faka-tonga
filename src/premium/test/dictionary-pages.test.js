import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  ADDITIONS_FILE, APP_ROOT, ENGLISH_KEYS_FILE, ENGLISH_TSV_FILE, EVIDENCE_FILE, EXAMPLES_FILE, chapterFile, drawExamples, englishTsvText, evidenceStrings, examplesFileText, loadDictionaryIndex, readDictionaryEvidence, readDictionarySources,
} from '../../../scripts/lib/dictionary-data.mjs'
import { lessonExampleLines, meaningShowsIn, plainSenses, rowWords, selectExamples } from '../lib/dictionary-examples.js'
import { ADDED_WORD_LABEL, englishKeyList } from '../lib/dictionary-additions.js'
import { buildDictionaryIndex, deriveEnglishHeadwords, dictionaryPageForPath, ENGLISH_FROM_MEANING, ENGLISH_FROM_SEARCH_WORD, englishPageLead } from '../lib/dictionary-pages.js'
import { normaliseSense, RESERVED_SLUGS, splitSenses, wordSlug } from '../lib/dictionary-text.js'
import { DICTIONARY_PAGE_PATH, DICTIONARY_TITLE_MAX, dictionaryPageMeta, metaForPath, STATIC_META } from '../../seo/meta.js'

// The dictionary's word pages and English pages (plan 2026-11-18-dictionary-
// search-and-word-pages), checked against the real data files and the app's
// own copy of the book.

const read = file => fs.readFileSync(path.join(APP_ROOT, file), 'utf8')
const { vocabulary, wordLists, courseWords, additions, englishKeys } = readDictionarySources()
// Why each added word and each English search word is there: read by scripts
// and tests only, never by the app.
const evidence = readDictionaryEvidence()
const index = loadDictionaryIndex()
const storedExamples = JSON.parse(read(EXAMPLES_FILE)).examples
const courseById = new Map(vocabulary.map(row => [row.id, row]))
// Rows that stand in a lesson: the course rows, and the course words (whose lesson is `lesson`).
const lessonRowById = new Map([...vocabulary, ...courseWords.entries.map(row => ({ ...row, chapter: row.lesson }))].map(row => [row.id, row]))

test('all 649 course rows, all 92 word-list rows, every course word and every added word land on exactly one word page', () => {
  assert.equal(vocabulary.length, 649)
  assert.equal(wordLists.entries.length, 92)
  assert.equal(wordLists.entries.filter(row => !row.course_id).length, 71)
  assert.equal(additions.entries.length, 2)
  assert.ok(courseWords.entries.length > 0)
  const landings = new Map()
  for (const page of index.pages) for (const id of page.rowIds) landings.set(id, [...(landings.get(id) || []), page.slug])
  for (const row of [...vocabulary, ...wordLists.entries, ...courseWords.entries, ...additions.entries]) {
    assert.deepEqual(landings.get(row.id)?.length, 1, `${row.id} (${row.tongan}) lands on exactly one page`)
    assert.equal(landings.get(row.id)[0], wordSlug(row.tongan), `${row.id} lands on the page of its own plain spelling`)
    assert.equal(index.rowPage.get(row.id), landings.get(row.id)[0])
  }
  assert.equal(landings.size, 649 + 92 + courseWords.entries.length + 2, 'no page holds a row the data does not have')
  // Shown entries: every course row, every word-list row that is not a course word, every added word.
  const shown = index.pages.flatMap(page => page.entries)
  assert.equal(shown.length, 649 + 71 + courseWords.entries.length + 2)
  assert.equal(new Set(shown.map(entry => entry.id)).size, shown.length)
  // The 21 word-list rows that are course words are a note on the course row.
  const notes = shown.flatMap(entry => entry.alsoInWordLists.map(list => list.id))
  assert.equal(notes.length, 21)
  for (const row of wordLists.entries.filter(item => item.course_id)) {
    assert.ok(index.pageBySlug.get(index.rowPage.get(row.id)).entries.some(entry => entry.id === row.course_id && entry.alsoInWordLists.some(list => list.id === row.id)))
  }
})

test('slugs are plain typing, never a reserved segment, and rows typed the same share a page', () => {
  assert.ok(index.pages.length > 600)
  for (const page of index.pages) {
    assert.match(page.slug, /^[a-z0-9-]+$/, `${page.slug} is a plain address`)
    assert.doesNotMatch(page.slug, /^-|-$|--/, `${page.slug} has no stray hyphen`)
    assert.equal(RESERVED_SLUGS.includes(page.slug), false, `${page.slug} is not reserved`)
    assert.notEqual(page.slug, 'english')
    assert.equal(page.path, `/dictionary/${page.slug}`)
    assert.match(page.path, DICTIONARY_PAGE_PATH)
  }
  assert.equal(new Set(index.pages.map(page => page.slug)).size, index.pages.length)
  assert.equal(wordSlug("'ulu"), 'ulu')
  assert.equal(wordSlug('ʻulu'), 'ulu')
  assert.equal(wordSlug('mālō e lelei'), 'malo-e-lelei')
  assert.equal(wordSlug("-'aki"), 'aki', 'the leading hyphen of a bound form is dropped')
  assert.equal(wordSlug('faka-Tonga'), 'faka-tonga')
  assert.equal(wordSlug('ai (in relative clauses)'), 'ai', 'a bracketed note is not part of the address')
  assert.equal(wordSlug('English'), 'english-tongan', 'a word spelled like the reserved segment gets another address')
  // Rows that share a page, each shown separately as the data has it.
  const a = index.pageBySlug.get('a')
  assert.deepEqual(a.entries.map(entry => entry.tongan), ["'a", 'ā', "'ā", '-a'])
  assert.deepEqual(a.words, ['ʻa', 'ā', 'ʻā', '-a'])
  const hiva = index.pageBySlug.get('hiva')
  assert.deepEqual(hiva.entries.map(entry => entry.english).sort(), ['nine', 'sing'])
  const kia = index.pageBySlug.get('kia')
  assert.deepEqual(kia.entries.map(entry => entry.kind), ['course', 'word-list'])
  assert.ok(index.pages.filter(page => page.entries.length > 1).length >= 25)
})

test('a word page shows only what the data has: marks, meaning, part of speech, lesson, label', () => {
  for (const page of index.pages) {
    for (const entry of page.entries) {
      if (entry.kind === 'course') {
        const row = courseById.get(entry.id)
        assert.equal(entry.tongan, row.tongan)
        assert.equal(entry.english, row.english)
        assert.equal(entry.partOfSpeech, row.part_of_speech)
        if (row.chapter >= 1 && row.chapter <= 52) {
          assert.equal(entry.lesson.number, row.chapter)
          assert.equal(entry.lesson.href, `/lessons/${row.chapter}`)
          assert.match(entry.lesson.label, new RegExp(`^Lesson ${row.chapter}: .+`))
          assert.equal(entry.supplemental, false)
        } else {
          assert.equal(entry.lesson, null, `${entry.id} is supplemental and links nowhere`)
          assert.equal(entry.supplemental, true)
        }
      } else if (entry.kind === 'course-word') {
        const row = courseWords.entries.find(item => item.id === entry.id)
        assert.equal(entry.tongan, row.tongan)
        assert.equal(entry.english, row.english)
        assert.equal(entry.partOfSpeech, row.part_of_speech)
        assert.equal(entry.lesson.number, row.lesson)
        assert.equal(entry.lesson.href, `/lessons/${row.lesson}`)
        assert.match(entry.lesson.label, new RegExp(`^Lesson ${row.lesson}: .+`))
        assert.equal(entry.supplemental, false)
        assert.equal(entry.wordList, null)
        assert.equal(entry.added, null)
      } else if (entry.kind === 'added') {
        const row = additions.entries.find(item => item.id === entry.id)
        assert.equal(entry.tongan, row.tongan)
        assert.equal(entry.english, row.english)
        assert.equal(entry.partOfSpeech, row.part_of_speech)
        assert.equal(entry.added.note, ADDED_WORD_LABEL)
        assert.equal(entry.lesson, null, 'an added word links to no lesson')
        assert.equal(entry.supplemental, false)
        assert.equal(entry.wordList, null)
        assert.equal(entry.examples.length, 0, 'an added word shows no sentence')
      } else {
        const row = wordLists.entries.find(item => item.id === entry.id)
        assert.equal(entry.tongan, row.tongan)
        assert.equal(entry.english, row.english)
        assert.equal(entry.register, row.register || '')
        assert.equal(entry.wordList.href, `/word-lists#${row.theme}`)
        assert.match(entry.wordList.note, /^Word list: .+, not taught in the lessons$/)
        assert.equal(entry.lesson, null)
        assert.equal(entry.examples.length, 0, 'a word-list word has no lesson to draw a sentence from')
      }
      assert.ok(!/['‘’ʼ`](?=[aeiouāēīōū])/i.test(entry.display), `${entry.id} display has passed through okinafy`)
    }
  }
  const ulu = index.pageBySlug.get('ulu').entries[0]
  assert.equal(ulu.display, 'ʻulu')
  assert.equal(ulu.alsoTyped, 'ulu')
  assert.equal(index.pageBySlug.get('ika').entries[0].alsoTyped, '', 'a word with no marks has no second typing')
  assert.deepEqual(index.pageBySlug.get('ulu').entries[0].alsoInWordLists.map(list => list.label), ['Parts of body'])
  // The register labels of the word lists are kept.
  assert.deepEqual(index.entries.filter(entry => entry.register).map(entry => entry.register).sort(), ['noble word', 'polite', 'polite'])
})

test('each page links to the other words of its lessons and to the words before and after it', () => {
  const fale = index.pageBySlug.get('fale')
  assert.deepEqual(fale.sameLesson.map(group => group.lesson.number), [6, 44])
  for (const page of index.pages) {
    for (const group of page.sameLesson) {
      assert.ok(group.words.length > 0)
      assert.equal(group.words.some(word => word.path === page.path), false, 'a page does not link to itself')
      assert.equal(new Set(group.words.map(word => word.path)).size, group.words.length)
      for (const word of group.words) assert.ok(dictionaryPageForPath(index, word.path), `${word.path} exists`)
    }
  }
  assert.equal(index.pages[0].previous, null)
  assert.equal(index.pages.at(-1).next, null)
  for (let i = 1; i < index.pages.length; i += 1) {
    assert.equal(index.pages[i].previous.path, index.pages[i - 1].path)
    assert.equal(index.pages[i - 1].next.path, index.pages[i].path)
    assert.ok(index.pages[i - 1].sortKey.localeCompare(index.pages[i].sortKey) <= 0, 'pages run in dictionary order')
  }
})

// Every stored pair against the book: the printed line, in the lesson that
// teaches the row, with the row's word standing in it as whole words.
function exampleFailures(examples, readChapter) {
  const failures = []
  let pairs = 0
  for (const [id, list] of Object.entries(examples)) {
    const row = lessonRowById.get(id)
    if (!row) { failures.push(`${id}: not a course row`); continue }
    if (!(row.chapter >= 1 && row.chapter <= 52)) { failures.push(`${id}: has no teaching lesson`); continue }
    if (!list.length || list.length > 3) failures.push(`${id}: ${list.length} pairs`)
    const lines = readChapter(row.chapter).split('\n')
    const body = lines.findIndex(line => /^###\s+Words to Learn\s*$/.test(line))
    for (const pair of list) {
      pairs += 1
      const printed = (lines[pair.line - 1] || '').trim()
      const expected = pair.kind === 'sentence' ? `*${pair.tongan}* ${pair.english}` : `*${pair.tongan}*. ${pair.english}`
      if (printed !== expected) failures.push(`${id}: ${chapterFile(row.chapter)}:${pair.line} does not print the pair "${expected}"`)
      if (body >= 0 && pair.line > body) failures.push(`${id}: line ${pair.line} is outside the lesson body`)
      const word = pair.tongan.slice(pair.at[0], pair.at[1])
      const spelled = word.replace(/['‘’ʼ`ʻ]/g, "'")
      const stored = row.tongan.replace(/\([^)]*\)/g, '').trim()
      const sentenceStart = pair.at[0] === 0 || /[.?!]["”)]*\s+$/.test(pair.tongan.slice(0, pair.at[0]))
      const lowered = spelled.replace(/^('?)(.)/, (all, mark, letter) => mark + letter.toLowerCase())
      if (spelled !== stored && !(sentenceStart && lowered === stored)) failures.push(`${id}: "${word}" is not the printed spelling of ${row.tongan}`)
      const before = pair.tongan[pair.at[0] - 1]
      const after = pair.tongan[pair.at[1]]
      if ((before && !/[\s"“(]/.test(before)) || (after && !/[\s.,?!;:"”)]/.test(after))) failures.push(`${id}: "${word}" is not a whole word in "${pair.tongan}"`)
    }
  }
  return { failures, pairs }
}

test('every example sentence is printed, with its English, in the lesson that teaches the row', () => {
  const chapters = new Map()
  const readChapter = number => chapters.get(number) || chapters.set(number, read(chapterFile(number))).get(number)
  const { failures, pairs } = exampleFailures(storedExamples, readChapter)
  assert.ok(pairs > 300, `the generated file holds pairs to check (${pairs})`)
  assert.deepEqual(failures, [])

  // The check can fail: a changed letter, a changed translation and a pair moved
  // to another row are each caught.
  const [someId, someList] = Object.entries(storedExamples).find(([, list]) => list[0].kind === 'sentence')
  const tamper = change => exampleFailures({ [someId]: [change(structuredClone(someList[0]))] }, readChapter).failures
  assert.ok(tamper(pair => ({ ...pair, tongan: pair.tongan.replace(/a/, 'e') })).length > 0)
  assert.ok(tamper(pair => ({ ...pair, english: `${pair.english} Indeed.` })).length > 0)
  const otherId = Object.keys(storedExamples).find(id => lessonRowById.get(id).chapter !== lessonRowById.get(someId).chapter)
  assert.ok(exampleFailures({ [otherId]: someList }, readChapter).failures.length > 0)
})

test('the generated files are what the generator makes from the data and the book today', () => {
  const fresh = drawExamples()
  assert.equal(read(EXAMPLES_FILE), examplesFileText(fresh), `${EXAMPLES_FILE} is stale: run npm run build:dictionary-data`)
  assert.equal(read(ENGLISH_TSV_FILE), englishTsvText(index), `${ENGLISH_TSV_FILE} is stale: run npm run build:dictionary-data`)
  const withExamples = index.entries.filter(entry => entry.examples.length)
  assert.equal(withExamples.length, Object.keys(storedExamples).length)
  assert.ok(withExamples.length > 200)
  for (const entry of withExamples) {
    assert.ok(entry.lesson, `${entry.id} draws only from its teaching lesson`)
    for (const pair of entry.examples) assert.ok(!/['‘’ʼ`](?=[aeiouāēīōū])/i.test(pair.display), 'the sentence has passed through okinafy')
  }
})

// The selection rules, tried on small lessons put together from lines the book
// really prints (no Tongan is written for a test; the first assertion below
// finds every line in book/). The rows are real rows of the data.
const PRINTED = {
  fale: "*'Oku 'i ai ha fo'i moli 'i fale?* Is there an orange in the house?",
  faleAccent: "*Na'á ke langa fēfee'i 'a e falé?* How did you build the house? (Lit. You built how the house?)",
  hiva: "*'Oku tau hiva.* We sing. (All of us, including you.)",
  faleMohe: "*Na'á ku mohe 'i fale mohe.* I slept in the dormitory.",
  faleMohePhrase: '*fale mohe*. dormitory (lit. "house sleep," a building for sleeping)',
  koIaAll: '*Ko ia pē.* That is all.',
  koIaTherefore: "*Ko ia, 'oku totonu ke ke nofo 'i 'api.* Therefore, you should stay at home.",
  uha: "*'Oku 'ikai ke 'uha.* It is not raining.",
  tone: "*Na'á ke kai?* ↗ Did you eat?",
  inlineGloss: "*'Okú ke ngāue 'i ngoue* *(plantation)?* Do you work in the plantation?",
  arrow: '*fále* → *falé na* ("that house, near you")',
  ika1: "*Na'á ku kai ika pē.* I just ate fish.",
  ika2: "*Na'a nau kai ika lahi.* They ate a lot of fish.",
  ika3: "*'Oku ou fiema'u ha ika.* I want some fish.",
  ika4: "*Na'e 'ikai te mau kai ika 'anepō.* We did not eat fish last night.",
  toluPhrase: "*ha tohi 'e tolu*. three books",
  toluSentence: "*Ko e tamaiki 'e toko tolu.* Three children.",
  bareWord: "*tu'unga*. stand, ladder, or (figuratively) rank, status",
}

test('no sentence beats a wrong one: the selection rules, on lines the book prints', () => {
  const book = Array.from({ length: 52 }, (unused, at) => read(chapterFile(at + 1))).join('\n').split('\n').map(line => line.trim())
  for (const [name, line] of Object.entries(PRINTED)) assert.ok(book.includes(line), `the line "${name}" is printed in the book`)
  const rowOf = (tongan, english, lesson = 3) => {
    const row = vocabulary.find(item => item.tongan === tongan && item.english === english)
    assert.ok(row, `${tongan} "${english}" is a row of the data`)
    return { id: row.id, tongan: row.tongan, english: row.english, lesson }
  }
  const lesson = (lines, afterBody = []) => `# Lesson\n\n::: {.examples}\n${lines.join('\n\n')}\n:::\n\n### Words to Learn\n\n::: {.examples}\n${afterBody.join('\n\n')}\n:::\n`
  const pick = (rows, lines, afterBody) => selectExamples({ rows, lessons: { 3: lesson(lines, afterBody) } })
  const tonganOf = line => /^\*([^*]+)\*/.exec(line)[1]

  // Exactly the printed spelling: the accented form is another spelling.
  const fale = rowOf('fale', 'house, building')
  const faleAccent = rowOf('falé', 'house (accent example)')
  const spelled = pick([fale, faleAccent], [PRINTED.fale, PRINTED.faleAccent])
  assert.deepEqual(spelled[fale.id].map(pair => pair.tongan), [tonganOf(PRINTED.fale)])
  assert.deepEqual(spelled[faleAccent.id].map(pair => pair.tongan), [tonganOf(PRINTED.faleAccent)])
  assert.equal(spelled[fale.id][0].tongan.slice(...spelled[fale.id][0].at), 'fale', 'the place of the word is recorded')

  // Two rows of one page spelled in the same line: nobody gets it, even when one has no lesson.
  const sing = rowOf('hiva', 'sing')
  assert.deepEqual(pick([sing, rowOf('hiva', 'nine', null)], [PRINTED.hiva]), {})
  assert.deepEqual(Object.keys(pick([sing], [PRINTED.hiva])), [sing.id], 'alone on its page, the row takes the line')

  // A word inside a longer entry belongs to the longer entry.
  const faleMohe = rowOf('fale mohe', 'dormitory')
  assert.deepEqual(Object.keys(pick([fale], [PRINTED.faleMohePhrase])), [fale.id], 'with no longer entry, fale takes the phrase')
  assert.deepEqual(pick([fale, faleMohe], [PRINTED.faleMohePhrase]), {}, 'the longer entry takes the word; the bare phrase is its own gloss')
  assert.deepEqual(Object.keys(pick([fale, faleMohe], [PRINTED.faleMohe])), [faleMohe.id])
  const sleep = rowOf('mohe', 'sleep')
  assert.deepEqual(Object.keys(pick([sleep, faleMohe], [PRINTED.faleMohe])).sort(), [sleep.id, faleMohe.id].sort(), 'mohe also stands free in that line')

  // The meaning must stand in the printed English when the row has a plain sense.
  const koIa = rowOf('ko ia', 'therefore, that is why')
  assert.deepEqual(pick([koIa], [PRINTED.koIaAll, PRINTED.koIaTherefore])[koIa.id].map(pair => pair.english), ['Therefore, you should stay at home.'])

  // Another lesson's row, a pair after Words to Learn and a line that is not a plain pair are never drawn.
  assert.deepEqual(selectExamples({ rows: [{ ...fale, lesson: 4 }], lessons: { 3: lesson([PRINTED.fale]) } }), {})
  const rain = rowOf("'uha", 'rain')
  assert.deepEqual(Object.keys(pick([rain], [PRINTED.uha])), [rain.id])
  assert.deepEqual(pick([rain], [PRINTED.hiva], [PRINTED.uha]), {}, 'nothing after Words to Learn is read')
  assert.equal(lessonExampleLines(`${PRINTED.fale}\n`).length, 0, 'a line outside an examples block is not a pair')
  assert.equal(lessonExampleLines(`::: {.examples}\n${PRINTED.tone}\n${PRINTED.inlineGloss}\n${PRINTED.arrow}\n:::\n`).length, 0)

  // At most three, whole sentences before phrases, in the lesson's order.
  const fish = rowOf('ika', 'fish')
  assert.deepEqual(pick([fish], [PRINTED.ika1, PRINTED.ika2, PRINTED.ika3, PRINTED.ika4])[fish.id].map(pair => pair.tongan), [PRINTED.ika1, PRINTED.ika2, PRINTED.ika3].map(tonganOf))
  const three = rowOf('tolu', 'three')
  assert.deepEqual(pick([three], [PRINTED.toluPhrase, PRINTED.toluSentence])[three.id].map(pair => pair.kind), ['sentence', 'phrase'])

  // A phrase line that is only the word itself is a gloss, not a use.
  assert.deepEqual(pick([rowOf("tu'unga", 'stand, ladder; rank, status')], [PRINTED.bareWord]), {})

  assert.equal(rowWords("-'aki"), null, 'a bound form cannot stand as a whole word')
  assert.equal(rowWords("fe-...-'aki"), null)
  assert.deepEqual(plainSenses("'oku", 'marks a present action/state'), [], 'a meaning that describes a job has nothing to look for')
  assert.equal(meaningShowsIn(['eat'], 'You ate.'), true)
  assert.equal(meaningShowsIn(['therefore', 'that is why'], 'That is all.'), false)
})

test('English headwords come only from the meanings in the data, and the TSV lists every one', () => {
  const lines = read(ENGLISH_TSV_FILE).trim().split('\n')
  assert.equal(lines[0], 'headword\tslug\trows\tsense_text\torigin')
  const tied = new Set(englishKeyList(englishKeys).map(key => `${key.english.toLowerCase()} ${key.rowId}`))
  let fromSearchWords = 0
  const rows = lines.slice(1).map(line => line.split('\t'))
  assert.ok(rows.length > 500, `the TSV holds headwords to check (${rows.length})`)
  assert.equal(rows.length, index.english.length)
  const meaningOf = id => (courseById.get(id) || wordLists.entries.find(row => row.id === id) || courseWords.entries.find(row => row.id === id) || additions.entries.find(row => row.id === id))?.english
  for (const [headword, slug, ids, senses, origins] of rows) {
    assert.match(slug, /^[a-z0-9-]+$/)
    assert.match(headword, /^[A-Za-z]+(?:['-][A-Za-z]+)*(?: [A-Za-z]+(?:['-][A-Za-z]+)*){0,2}$/, `${headword} is one to three plain words`)
    const idList = ids.split(' | ')
    const senseList = senses.split(' | ')
    const originList = origins.split(' | ')
    assert.ok(idList.length > 0 && idList.length === senseList.length && idList.length === originList.length)
    idList.forEach((id, at) => {
      const meaning = meaningOf(id)
      assert.ok(meaning, `${headword}: ${id} is a row of the data`)
      if (originList[at] === ENGLISH_FROM_SEARCH_WORD) {
        // An English search word: tied to the row in dictionary-english-keys.json,
        // and shown beside the row's meaning in full, which does not hold the word.
        fromSearchWords += 1
        assert.ok(tied.has(`${headword.toLowerCase()} ${id}`), `${headword}: ${id} is tied to it in the search-words file`)
        assert.equal(senseList[at], meaning, `${headword}: the row's meaning is given in full`)
        assert.equal(splitSenses(meaning).some(item => item.sense.toLowerCase() === headword.toLowerCase()), false, `${headword}: a word the meaning already has needs no tie`)
        return
      }
      assert.equal(originList[at], ENGLISH_FROM_MEANING)
      assert.ok(splitSenses(meaning).some(item => item.text === senseList[at]), `${headword}: "${senseList[at]}" is a sense of ${id} ("${meaning}")`)
      assert.equal(normaliseSense(senseList[at]).toLowerCase(), headword.toLowerCase(), `${headword} is the sense "${senseList[at]}" without "to", article or note`)
      assert.ok(meaning.includes(senseList[at]), `${headword}: the sense text is in the meaning as the data has it`)
    })
    const page = index.englishBySlug.get(slug)
    assert.deepEqual(page.entries.map(entry => entry.id), idList)
    assert.equal(page.path, `/dictionary/english/${slug}`)
    for (const entry of page.entries) assert.ok(index.pageBySlug.get(entry.slug), `${headword} links to a real word page`)
  }
  assert.equal(fromSearchWords, tied.size, 'every tie of the search-words file is in the TSV, marked as one')
  // Real rows: house is fale; "to box" and "box, chest" meet on one page; a
  // bracketed note, a grammatical note and a bound form give no headword.
  assert.deepEqual(index.englishBySlug.get('house').entries.map(entry => entry.tongan), ['fale', 'falé'])
  assert.deepEqual(index.englishBySlug.get('box').entries.map(entry => entry.tongan).sort(), ['fuhu', 'puha', 'puhá'])
  assert.equal(index.englishBySlug.get('hurry-up').entries[0].tongan, 'fai mo ke')
  assert.equal(index.englishBySlug.has('marks-the-object'), false)
  assert.equal(index.englishBySlug.has('state-or-condition'), false)
  assert.equal(index.englishBySlug.has('to-person-leaving'), false)
  assert.ok(index.englishDropped.some(item => item.reason === 'grammatical note'))
  assert.ok(index.englishDropped.some(item => item.reason.startsWith('bound form')))
  const derived = deriveEnglishHeadwords([{ id: 'x', tongan: 'x', english: 'to make heavy, a ... tree; the big house of the chief (note), marks the object' }])
  assert.deepEqual(derived.headwords.map(item => item.headword), ['make heavy'])
  assert.deepEqual(derived.dropped.map(item => item.reason).sort(), ['grammatical note', 'more than three words', 'not plain words'])
})

test('titles and descriptions come from one function, hold the word, and are unique', () => {
  const titles = new Map()
  for (const page of [...index.pages, ...index.english]) {
    const meta = dictionaryPageMeta(page)
    assert.ok(meta.title && meta.description, `${page.path} has a title and a description`)
    assert.equal(titles.has(meta.title), false, `${page.path} and ${titles.get(meta.title)} share the title "${meta.title}"`)
    titles.set(meta.title, page.path)
    assert.doesNotMatch(`${meta.title} ${meta.description}`, /—|undefined|\bchapter\b/i)
    assert.ok(meta.description.length <= 222, `${page.path} description is short`)
    assert.deepEqual(metaForPath(page.path, { dictionary: at => dictionaryPageForPath(index, at) }), meta, 'the prerender gets the same strings')
    if (page.kind === 'english') {
      assert.equal(meta.title, `How to say ${page.headword} in Tongan | Lea Faka-Tonga`)
    } else {
      for (const word of page.words) assert.ok(meta.title.includes(word), `${page.path} title holds the word with its marks`)
      assert.match(meta.title, / meaning(?:: .+)? \| Tongan Dictionary$/)
      if (meta.title.includes(' meaning: ')) assert.ok(meta.title.length <= DICTIONARY_TITLE_MAX)
    }
  }
  for (const title of Object.values(STATIC_META).map(item => item.title)) assert.equal(titles.has(title), false)
  assert.equal(dictionaryPageMeta(index.pageBySlug.get('ulu')).title, 'ʻulu meaning: head | Tongan Dictionary')
  assert.equal(dictionaryPageMeta(index.pageBySlug.get('a')).title, 'ʻa, ā, ʻā, -a meaning | Tongan Dictionary')
  assert.equal(dictionaryPageMeta(index.pageBySlug.get('faifekau')).description, 'faifekau in Tongan: minister. Part of speech: noun. Taught in Lesson 25: Plural Markers.')
  // In the browser the word data is not in the first bundle: the page owns its title.
  assert.equal(metaForPath('/dictionary/ulu').pageOwned, true)
  assert.equal(metaForPath('/dictionary/english/house').pageOwned, true)
  assert.equal(metaForPath('/dictionary').pageOwned, undefined)
  assert.equal(metaForPath('/dictionary').title, STATIC_META['/dictionary'].title)
})

// DECISIONS.md 2026-11-18, point 1: fakahela and fefeka. The sources of each are
// cited in scripts/dictionary-evidence.json; one row per source is in
// audits/dictionary-search-2026-11-18/additions-evidence.tsv in the project folder.
test('the added words: their own data file, their own pages, a label, no lesson and no sentence', () => {
  assert.deepEqual(additions.entries.map(row => [row.id, row.tongan]), [['add-0001', 'fakahela'], ['add-0002', 'fefeka']])
  const labels = new Set(vocabulary.map(row => row.part_of_speech))
  const taken = new Set([...vocabulary, ...wordLists.entries].map(row => row.id))
  const spelled = new Set([...vocabulary, ...wordLists.entries].map(row => row.tongan.replace(/['‘’ʼ`ʻ]/g, "'").toLowerCase()))
  for (const row of additions.entries) {
    assert.match(row.id, /^add-\d{4}$/)
    assert.equal(taken.has(row.id), false)
    assert.equal(spelled.has(row.tongan.toLowerCase()), false, `${row.tongan} is not already a row of the course list or a word list`)
    assert.ok(labels.has(row.part_of_speech), `${row.id}: "${row.part_of_speech}" is a label the course data already uses`)
    assert.ok(row.english && row.english.length <= 40, `${row.id} has a short meaning`)
    assert.deepEqual(Object.keys(row).sort(), ['english', 'id', 'part_of_speech', 'tongan'], `${row.id} holds only what its page shows`)
    const cited = evidence.additions.filter(item => item.id === row.id)
    assert.equal(cited.length, 1, `${row.id} has one record in the evidence file`)
    const { sources } = cited[0]
    assert.ok(Array.isArray(sources) && sources.length >= 2, `${row.id} cites at least two sources`)
    for (const cite of sources) assert.ok(cite.endsWith(` ${row.tongan}`) || cite.includes(', adjectives, entries '), `${row.id}: "${cite}" names the word or the entries`)
    for (const cite of sources) assert.match(cite, /^(?:Churchward, Tongan Dictionary \(1959\), p\. \d+|Shumway, Intensive Course in Tongan, Glossary, p\. \d+|EALD Bilingual Dictionary for ESL Beginners \(NSW Dept of Education, 2001\), )/, `${row.id}: a citation names the source and the place`)
    assert.equal(vocabulary.some(item => item.id === row.id || item.tongan === row.tongan), false, 'an added word is never in book-vocabulary.json')
  }
  const fakahela = index.pageBySlug.get('fakahela')
  assert.deepEqual([fakahela.path, fakahela.words, fakahela.entries.length, fakahela.rowIds], ['/dictionary/fakahela', ['fakahela'], 1, ['add-0001']])
  assert.deepEqual([fakahela.entries[0].kind, fakahela.entries[0].english, fakahela.entries[0].partOfSpeech], ['added', 'tiring, wearying', 'adjective'])
  assert.deepEqual([fakahela.sameLesson, fakahela.sameWordList], [[], []])
  const fefeka = index.pageBySlug.get('fefeka')
  assert.deepEqual([fefeka.entries[0].kind, fefeka.entries[0].english, fefeka.entries[0].alsoTyped], ['added', 'hard (physically), stiff', ''])
  assert.equal(dictionaryPageMeta(fefeka).title, 'fefeka meaning: hard (physically), stiff | Tongan Dictionary')
  assert.deepEqual(evidence.additions.map(item => item.id), additions.entries.map(row => row.id), 'the evidence file has a record for every added word and no other')
  // Their English pages, from the meanings as written: the bracketed note gives none.
  assert.deepEqual(fakahela.entries[0].englishPages.map(page => page.headword), ['tiring', 'wearying'])
  assert.deepEqual(fefeka.entries[0].englishPages.map(page => page.headword), ['hard', 'stiff'])
  assert.deepEqual(index.englishBySlug.get('hard').entries.map(entry => entry.id), ['book-v0079', 'add-0002'], 'fefeka joins the page mālohi already gave')
  // Nothing indexes the bracket: no English page of its own, alone or with a word beside it.
  assert.equal(index.english.some(page => page.entries.some(entry => entry.id === 'add-0002') && !['hard', 'stiff'].includes(page.slug)), false)
  assert.equal(index.english.some(page => /physical/i.test(page.headword)), false)
  assert.equal(fefeka.entries[0].added.sources, undefined, 'an entry of the index carries no citation')
  // The label is in the description, and the page sits in dictionary order.
  assert.equal(dictionaryPageMeta(fakahela).title, 'fakahela meaning: tiring, wearying | Tongan Dictionary')
  assert.equal(dictionaryPageMeta(fakahela).description, 'fakahela in Tongan: tiring, wearying. Part of speech: adjective. Added word, not taught in the lessons.')
  assert.equal(ADDED_WORD_LABEL, 'Added word, not taught in the lessons')
  assert.doesNotMatch(ADDED_WORD_LABEL, /\u2014/)
  assert.ok(fakahela.previous && fakahela.next && fefeka.previous && fefeka.next)
  // Without the file the index is the dictionary without the added words: each is a row and a page of its own.
  const { additions: unused, ...rest } = readDictionarySources()
  assert.ok(unused)
  const without = buildDictionaryIndex({ ...rest, examples: storedExamples })
  assert.deepEqual([index.rowPage.size - without.rowPage.size, index.pages.length - without.pages.length], [additions.entries.length, additions.entries.length])
  // An id the dictionary already has is refused.
  assert.throws(() => buildDictionaryIndex({ ...rest, additions: { entries: [{ id: 'book-v0003', tongan: 'fakahela', english: 'x', part_of_speech: 'adjective' }] }, examples: storedExamples }), /already has/)
})

// DECISIONS.md 2026-11-18, point 2: "hi" and "greeting" for book-v0025, "bye"
// for book-v0002 and book-v0035.
test('English search words are tied to rows the dictionary already has, each with its support, and change no meaning', () => {
  const list = englishKeyList(englishKeys)
  assert.deepEqual(list.map(key => `${key.english} ${key.rowId}`), ['hi book-v0025', 'greeting book-v0025', 'bye book-v0002', 'bye book-v0035'])
  // The app's file holds the word and its row ids; the support of each tie is in the evidence file.
  assert.deepEqual(Object.keys(englishKeys), ['keys'])
  for (const key of englishKeys.keys) assert.deepEqual([Object.keys(key).sort(), key.rows.every(id => typeof id === 'string')], [['english', 'rows'], true])
  assert.deepEqual(evidence.englishKeys.map(item => `${item.english} ${item.row}`), list.map(key => `${key.english} ${key.rowId}`), 'every tie has its support recorded, and no other tie is recorded')
  for (const { english, rowId } of list) {
    const { support } = evidence.englishKeys.find(item => item.english === english && item.row === rowId)
    const row = courseById.get(rowId)
    assert.ok(row, `${english}: ${rowId} is a row of the course list`)
    assert.match(english, /^[a-z]+(?: [a-z]+){0,2}$/, `${english} is one to three plain words`)
    // The support: the row's own meaning, quoted exactly from the data, or a source and a place in it.
    if (support.meaning !== undefined) {
      assert.equal(support.meaning, row.english, `${english}: the quoted meaning of ${rowId} is the data's own`)
      if (support.part_of_speech !== undefined) assert.equal(support.part_of_speech, row.part_of_speech)
    } else {
      assert.ok(support.source && support.location, `${english}: ${rowId} has a source and a place`)
    }
    const page = index.englishBySlug.get(english)
    assert.equal(page.headword, english)
    const entry = page.entries.find(item => item.id === rowId)
    assert.ok(entry, `${english} lists ${rowId}`)
    assert.equal(entry.english, row.english, 'the row shows its meaning as the data has it')
    assert.ok(entry.englishPages.some(item => item.path === page.path), `${rowId} links to the page for ${english}`)
    assert.equal(page.sources.find(source => source.rowId === rowId).origin, ENGLISH_FROM_SEARCH_WORD)
  }
  // "greeting" and "bye" stand on the row's own printed meaning: the plural, and the long form.
  assert.match(courseById.get('book-v0025').english, /\bgreetings\b/)
  assert.equal(courseById.get('book-v0025').part_of_speech, 'greeting phrase')
  for (const id of ['book-v0002', 'book-v0035']) assert.match(courseById.get(id).english, /^goodbye\b/)
  assert.deepEqual(index.englishBySlug.get('bye').entries.map(entry => entry.tongan), ["'alu ā", 'nofo ā'])
  assert.deepEqual(index.englishBySlug.get('hi').entries.map(entry => entry.tongan), ['mālō e lelei'])
  // A page that lists a row by a search word does not say the word is in the meaning.
  assert.equal(englishPageLead(index.englishBySlug.get('hi')), 'One word in the dictionary is given for “hi”. Its meaning is shown in full.')
  assert.equal(englishPageLead(index.englishBySlug.get('bye')), '2 words in the dictionary are given for “bye”. Each meaning is shown in full, so you can pick the word that fits.')
  assert.equal(englishPageLead(index.englishBySlug.get('hello')), 'One word in the dictionary has “hello” in its meaning.')
  assert.equal(dictionaryPageMeta(index.englishBySlug.get('hi')).title, 'How to say hi in Tongan | Lea Faka-Tonga')
  // Without the file: no such pages, and six fewer than with the additions too.
  const { englishKeys: unused, ...rest } = readDictionarySources()
  assert.ok(unused)
  const without = buildDictionaryIndex({ ...rest, examples: storedExamples })
  assert.deepEqual(['hi', 'greeting', 'bye'].map(word => without.englishBySlug.has(word)), [false, false, false])
  assert.equal(index.english.length - without.english.length, 3)
  // A tie to a row that is not there is refused.
  assert.throws(() => buildDictionaryIndex({ ...rest, englishKeys: { keys: [{ english: 'hi', rows: ['book-v9999'] }] }, examples: storedExamples }), /not an entry/)
  assert.equal(vocabulary.some(row => /\bhi\b|\bbye\b/i.test(row.english)), false, 'book-vocabulary.json is not edited: no row has "hi" or "bye" as a word')
})

test('nothing about sources is in the files the app loads; it is in a file only scripts and tests read', () => {
  // The strings that name a source or a place in one: the note, each citation, each support's source and location.
  const strings = evidenceStrings(evidence)
  assert.ok(strings.length >= 8, `there are strings to look for (${strings.length})`)
  assert.ok(strings.includes(evidence.note) && strings.some(text => text.startsWith('Churchward, Tongan Dictionary (1959), p. 43')) && strings.includes('interjections, entry 9 counting from 1'))
  assert.equal(strings.includes('hello, greetings'), false, 'a row\'s own meaning is the site\'s data, not evidence to keep out')
  // The two data files the app imports, as they are on disk.
  for (const file of [ADDITIONS_FILE, ENGLISH_KEYS_FILE]) {
    const text = read(file)
    for (const needle of strings) assert.equal(text.includes(needle), false, `${file} holds "${needle.slice(0, 50)}"`)
    assert.doesNotMatch(text, /Churchward|Shumway|EALD|audits\/|"note"|"sources"|"support"|"source"|"location"/, `${file} names no source and carries no note`)
  }
  assert.deepEqual(Object.keys(additions), ['entries'])
  // No file under src/ reads the evidence file: only scripts/ and the tests do.
  const srcFiles = fs.readdirSync(path.join(APP_ROOT, 'src'), { recursive: true }).filter(name => /\.(?:jsx?|mjs|tsx?)$/.test(name) && !/\.test\.js$/.test(name))
  assert.ok(srcFiles.length > 100)
  const readers = srcFiles.filter(name => read(path.join('src', name)).split('\n').some(line => line.includes('dictionary-evidence') && !/^\s*(?:\/\/|\*|\/\*)/.test(line)))
  assert.deepEqual(readers, [], 'the app never imports the evidence file')
  assert.equal(EVIDENCE_FILE, 'scripts/dictionary-evidence.json')
  // The check can fail: a citation put back into the app's data would be found.
  assert.equal(JSON.stringify({ ...additions.entries[0], sources: evidence.additions[0].sources }).includes(strings[1]), true)
})

test('the index is the same whether a script or the site builds it, and changes no data', () => {
  const before = JSON.stringify([vocabulary, wordLists, courseWords, additions, englishKeys])
  const again = buildDictionaryIndex({ ...readDictionarySources(), examples: storedExamples })
  assert.equal(JSON.stringify([vocabulary, wordLists, courseWords, additions, englishKeys]), before)
  assert.deepEqual(again.pages.map(page => page.slug), index.pages.map(page => page.slug))
  assert.equal(dictionaryPageForPath(index, '/dictionary/ulu/').slug, 'ulu')
  assert.equal(dictionaryPageForPath(index, '/dictionary/english/house').headword, 'house')
  assert.equal(dictionaryPageForPath(index, '/dictionary/no-such-word'), null)
  assert.equal(dictionaryPageForPath(index, '/dictionary'), null)
})
