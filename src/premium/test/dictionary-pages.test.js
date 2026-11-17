import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  APP_ROOT, ENGLISH_TSV_FILE, EXAMPLES_FILE, chapterFile, drawExamples, englishTsvText, examplesFileText, loadDictionaryIndex, readDictionarySources,
} from '../../../scripts/lib/dictionary-data.mjs'
import { lessonExampleLines, meaningShowsIn, plainSenses, rowWords, selectExamples } from '../lib/dictionary-examples.js'
import { buildDictionaryIndex, deriveEnglishHeadwords, dictionaryPageForPath } from '../lib/dictionary-pages.js'
import { normaliseSense, RESERVED_SLUGS, splitSenses, wordSlug } from '../lib/dictionary-text.js'
import { DICTIONARY_PAGE_PATH, DICTIONARY_TITLE_MAX, dictionaryPageMeta, metaForPath, STATIC_META } from '../../seo/meta.js'

// The dictionary's word pages and English pages (plan 2026-11-18-dictionary-
// search-and-word-pages), checked against the real data files and the app's
// own copy of the book.

const read = file => fs.readFileSync(path.join(APP_ROOT, file), 'utf8')
const { vocabulary, wordLists } = readDictionarySources()
const index = loadDictionaryIndex()
const storedExamples = JSON.parse(read(EXAMPLES_FILE)).examples
const courseById = new Map(vocabulary.map(row => [row.id, row]))

test('all 649 course rows and all 92 word-list rows land on exactly one word page', () => {
  assert.equal(vocabulary.length, 649)
  assert.equal(wordLists.entries.length, 92)
  assert.equal(wordLists.entries.filter(row => !row.course_id).length, 71)
  const landings = new Map()
  for (const page of index.pages) for (const id of page.rowIds) landings.set(id, [...(landings.get(id) || []), page.slug])
  for (const row of [...vocabulary, ...wordLists.entries]) {
    assert.deepEqual(landings.get(row.id)?.length, 1, `${row.id} (${row.tongan}) lands on exactly one page`)
    assert.equal(landings.get(row.id)[0], wordSlug(row.tongan), `${row.id} lands on the page of its own plain spelling`)
    assert.equal(index.rowPage.get(row.id), landings.get(row.id)[0])
  }
  assert.equal(landings.size, 741, 'no page holds a row the data does not have')
  // Shown entries: every course row, and every word-list row that is not a course word.
  const shown = index.pages.flatMap(page => page.entries)
  assert.equal(shown.length, 649 + 71)
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
    const row = courseById.get(id)
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
  const otherId = Object.keys(storedExamples).find(id => courseById.get(id).chapter !== courseById.get(someId).chapter)
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

test('no sentence beats a wrong one: the selection rules, on small made-up lessons', () => {
  const lesson = lines => `# Lesson\n\n::: {.examples}\n${lines.join('\n\n')}\n:::\n\n### Words to Learn\n\n::: {.examples}\n*Kuo tō ʻa e ʻuha.* It has rained.\n:::\n`
  const pick = (rows, lines) => selectExamples({ rows, lessons: { 3: lesson(lines) } })
  // Exactly the printed spelling: the accented form is another spelling.
  const rows = [{ id: 'fale', tongan: 'fale', english: 'house', lesson: 3 }, { id: 'fale-accent', tongan: 'falé', english: 'house (accent example)', lesson: 3 }]
  const drawn = pick(rows, ["*Ko e fale 'eni.* This is a house.", "*'Oku ou sio ki he falé.* I see the house.", '*Falekoloa lahi.* A big house of goods.'])
  assert.deepEqual(drawn.fale.map(pair => pair.tongan), ["Ko e fale 'eni."])
  assert.deepEqual(drawn['fale-accent'].map(pair => pair.tongan), ["'Oku ou sio ki he falé."])
  // Two rows of one page spelled in the same line: nobody gets it.
  const twins = [{ id: 'hiva-nine', tongan: 'hiva', english: 'nine', lesson: null }, { id: 'hiva-sing', tongan: 'hiva', english: 'sing', lesson: 3 }]
  assert.deepEqual(pick(twins, ["*Na'á ku hiva.* I sang (sing)."]), {})
  // A word inside a longer entry belongs to the longer entry.
  const compound = [{ id: 'fale', tongan: 'fale', english: 'house', lesson: 3 }, { id: 'fale-mohe', tongan: 'fale mohe', english: 'dormitory', lesson: 3 }]
  const split = pick(compound, ['*Ko e fale mohe.* It is a dormitory, a house for sleeping.'])
  assert.deepEqual(Object.keys(split), ['fale-mohe'])
  // The meaning must stand in the printed English when the row has a plain sense.
  const sense = [{ id: 'ko-ia', tongan: 'ko ia', english: 'therefore, that is why', lesson: 3 }]
  assert.deepEqual(pick(sense, ['*Ko ia pē.* That is all.', "*Ko ia, té u 'alu.* Therefore, I will go."])['ko-ia'].map(pair => pair.english), ['Therefore, I will go.'])
  // A row from another lesson, a pair outside an examples block, and a line that is not a plain pair are never drawn.
  assert.deepEqual(selectExamples({ rows: [{ id: 'x', tongan: 'fale', english: 'house', lesson: 4 }], lessons: { 3: lesson(["*Ko e fale 'eni.* This is a house."]) } }), {})
  assert.deepEqual(pick([{ id: 'uha', tongan: "'uha", english: 'rain', lesson: 3 }], ['*Sai.* Fine.']), {}, 'nothing after Words to Learn is read')
  assert.equal(lessonExampleLines("*Ko e fale.* A house.\n").length, 0, 'a line outside an examples block is not a pair')
  assert.equal(lessonExampleLines("::: {.examples}\n*Na'á ke kai?* ↗ Did you eat?\n*Sio ki he fale* *(house).* Look at the house.\n*fále* → *falé na*\n:::\n").length, 0)
  // At most three, whole sentences before phrases.
  const many = pick([{ id: 'ika', tongan: 'ika', english: 'fish', lesson: 3 }], ['*ha ika*. a fish', '*Ko e ika.* It is a fish.', '*Kai ika!* Eat fish!', '*Ika lahi.* Big fish.', '*Ko e ika lahi.* It is a big fish.'])
  assert.deepEqual(many.ika.map(pair => pair.kind), ['sentence', 'sentence', 'sentence'])
  // A phrase line that is only the word itself is a gloss, not a use.
  assert.deepEqual(pick([{ id: 'ika', tongan: 'ika', english: 'fish', lesson: 3 }], ['*ika*. fish', '*ha ika*. a fish']).ika.map(pair => pair.tongan), ['ha ika'])
  assert.equal(rowWords("-'aki"), null, 'a bound form cannot stand as a whole word')
  assert.equal(rowWords("fe-...-'aki"), null)
  assert.deepEqual(plainSenses("'oku", 'marks a present action/state'), [], 'a meaning that describes a job has nothing to look for')
  assert.equal(meaningShowsIn(['eat'], 'We ate fish.'), true)
  assert.equal(meaningShowsIn(['therefore', 'that is why'], 'That is all.'), false)
})

test('English headwords come only from the meanings in the data, and the TSV lists every one', () => {
  const lines = read(ENGLISH_TSV_FILE).trim().split('\n')
  assert.equal(lines[0], 'headword\tslug\trows\tsense_text')
  const rows = lines.slice(1).map(line => line.split('\t'))
  assert.ok(rows.length > 500, `the TSV holds headwords to check (${rows.length})`)
  assert.equal(rows.length, index.english.length)
  const meaningOf = id => (courseById.get(id) || wordLists.entries.find(row => row.id === id))?.english
  for (const [headword, slug, ids, senses] of rows) {
    assert.match(slug, /^[a-z0-9-]+$/)
    assert.match(headword, /^[A-Za-z]+(?:['-][A-Za-z]+)*(?: [A-Za-z]+(?:['-][A-Za-z]+)*){0,2}$/, `${headword} is one to three plain words`)
    const idList = ids.split(' | ')
    const senseList = senses.split(' | ')
    assert.ok(idList.length > 0 && idList.length === senseList.length)
    idList.forEach((id, at) => {
      const meaning = meaningOf(id)
      assert.ok(meaning, `${headword}: ${id} is a row of the data`)
      assert.ok(splitSenses(meaning).some(item => item.text === senseList[at]), `${headword}: "${senseList[at]}" is a sense of ${id} ("${meaning}")`)
      assert.equal(normaliseSense(senseList[at]).toLowerCase(), headword.toLowerCase(), `${headword} is the sense "${senseList[at]}" without "to", article or note`)
      assert.ok(meaning.includes(senseList[at]), `${headword}: the sense text is in the meaning as the data has it`)
    })
    const page = index.englishBySlug.get(slug)
    assert.deepEqual(page.entries.map(entry => entry.id), idList)
    assert.equal(page.path, `/dictionary/english/${slug}`)
    for (const entry of page.entries) assert.ok(index.pageBySlug.get(entry.slug), `${headword} links to a real word page`)
  }
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

test('the index is the same whether a script or the site builds it, and changes no data', () => {
  const before = JSON.stringify([vocabulary, wordLists])
  const again = buildDictionaryIndex({ ...readDictionarySources(), examples: storedExamples })
  assert.equal(JSON.stringify([vocabulary, wordLists]), before)
  assert.deepEqual(again.pages.map(page => page.slug), index.pages.map(page => page.slug))
  assert.equal(dictionaryPageForPath(index, '/dictionary/ulu/').slug, 'ulu')
  assert.equal(dictionaryPageForPath(index, '/dictionary/english/house').headword, 'house')
  assert.equal(dictionaryPageForPath(index, '/dictionary/no-such-word'), null)
  assert.equal(dictionaryPageForPath(index, '/dictionary'), null)
})
