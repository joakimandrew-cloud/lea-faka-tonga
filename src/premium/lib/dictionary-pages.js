// The dictionary's pages as plain data (plan 2026-11-18-dictionary-search-and-
// word-pages): one word page per plain spelling at /dictionary/<slug>, and one
// English page per English headword at /dictionary/english/<slug>.
//
// Pure: no React and no data imports, so the React pages, the tests, the data
// script and the prerender all build the same pages from the same files:
//   vocabulary  src/data/book-vocabulary.json            (the 649 course rows)
//   wordLists   src/premium/data/word-lists.json         (the 92 word-list rows)
//   chapters    src/data/chapters.json                   (lesson titles)
//   examples    src/premium/data/dictionary-examples.json (printed lesson pairs)
//
// Rules that bind (DECISIONS.md 2026-09-27 and 2026-09-29): every Tongan string
// and every meaning is the data's own, shown as the data has it. Nothing is
// written here: no gloss, no example, no pronunciation. `display` is the
// stored Tongan passed through okinafy and nothing else.

import { okinafy } from '../../lib/okinafy.js'
import { entryLesson } from './course-dictionary.js'
import { ENGLISH_HEADWORD_MAX_WORDS, englishPagePath, englishSlug, plainKey, plainTyping, RESERVED_SLUGS, senseDropReason, splitSenses, withoutNotes, wordPagePath, wordSlug } from './dictionary-text.js'
import { themeHref, wordListSearchLabel } from './word-lists.js'

export { ENGLISH_HEADWORD_MAX_WORDS }

const byPlain = (a, b) => a.sortKey.localeCompare(b.sortKey) || a.slug.localeCompare(b.slug)

function lessonInfo(number, titles) {
  if (!number) return null
  const title = titles.get(number) || ''
  return { number, title, label: title ? `Lesson ${number}: ${title}` : `Lesson ${number}`, href: `/lessons/${number}` }
}

// The typing shown beside a marked word ("also typed ulu"), or '' when the
// word has no marks to drop.
function alsoTyped(tongan) {
  const plain = plainTyping(tongan)
  return plain !== String(tongan).trim() ? plain : ''
}

function courseEntry(row, titles, examples) {
  const lesson = lessonInfo(entryLesson(row), titles)
  return {
    id: row.id,
    kind: 'course',
    tongan: row.tongan,
    display: okinafy(row.tongan),
    alsoTyped: alsoTyped(row.tongan),
    english: row.english || '',
    partOfSpeech: row.part_of_speech || '',
    lesson,
    supplemental: !lesson,
    register: '',
    wordList: null,
    alsoInWordLists: [],
    // display: the printed Tongan through okinafy. englishDisplay: the printed
    // English with straight double quotes made curly, as the lesson page shows it.
    examples: (examples[row.id] || []).map(item => ({ ...item, display: okinafy(item.tongan), englishDisplay: item.english.replace(/"([^"]*)"/g, '\u201c$1\u201d') })),
  }
}

function wordListEntry(row, theme) {
  return {
    id: row.id,
    kind: 'word-list',
    tongan: row.tongan,
    display: okinafy(row.tongan),
    alsoTyped: alsoTyped(row.tongan),
    english: row.english || '',
    partOfSpeech: row.part_of_speech || '',
    lesson: null,
    supplemental: false,
    register: row.register || '',
    wordList: { themeId: theme.id, label: theme.label, href: themeHref(theme.id), note: wordListSearchLabel(theme.label) },
    alsoInWordLists: [],
    examples: [],
  }
}

// Why a sense is not an English headword, or '' when it is one.
export function englishDropReason(entry, sense) {
  return senseDropReason(entry.tongan, sense)
}

// English headwords, from the meanings in the data and nowhere else. A meaning
// is split into its senses at commas and semicolons; bracketed notes, a leading
// "to" and a leading article go; a sense is kept when what remains is one to
// three plain words. Returns the kept headwords with the rows and sense text
// each came from, and every sense that was dropped with the reason.
export function deriveEnglishHeadwords(entries) {
  const kept = new Map()
  const dropped = []
  for (const entry of entries) {
    for (const { text, sense } of splitSenses(entry.english)) {
      const reason = englishDropReason(entry, sense)
      if (reason) { dropped.push({ rowId: entry.id, tongan: entry.tongan, senseText: text, reason }); continue }
      const slug = englishSlug(sense)
      if (!kept.has(slug)) kept.set(slug, { slug, headword: sense, sources: [] })
      const page = kept.get(slug)
      if (!page.sources.some(source => source.rowId === entry.id)) page.sources.push({ rowId: entry.id, senseText: text })
    }
  }
  const headwords = [...kept.values()].sort((a, b) => a.slug.localeCompare(b.slug))
  return { headwords, dropped }
}

// Everything the dictionary shows, built once from the data files.
export function buildDictionaryIndex({ vocabulary, wordLists, chapters = [], examples = {} }) {
  const titles = new Map((Array.isArray(chapters) ? chapters : []).map(chapter => [Number(chapter.chapter), chapter.title || '']))
  const themes = new Map((Array.isArray(wordLists?.themes) ? wordLists.themes : []).map(theme => [theme.id, theme]))
  const course = (Array.isArray(vocabulary) ? vocabulary : []).filter(row => row && typeof row.tongan === 'string' && row.tongan.trim())
  const listRows = (Array.isArray(wordLists?.entries) ? wordLists.entries : []).filter(row => row && themes.has(row.theme))

  const entries = course.map(row => courseEntry(row, titles, examples))
  const byId = new Map(entries.map(entry => [entry.id, entry]))
  // rowPage: where each of the data's rows lands. A word-list row that is a
  // course word lands on its course row's page and is shown there as a note.
  const rowPage = new Map()
  for (const row of listRows) {
    const theme = themes.get(row.theme)
    const courseRow = row.course_id ? byId.get(row.course_id) : null
    if (courseRow) {
      courseRow.alsoInWordLists.push({ id: row.id, themeId: theme.id, label: theme.label, href: themeHref(theme.id) })
      rowPage.set(row.id, wordSlug(courseRow.tongan))
    } else if (typeof row.tongan === 'string' && row.tongan.trim()) {
      const entry = wordListEntry(row, theme)
      entries.push(entry)
      byId.set(entry.id, entry)
    }
  }

  const pageMap = new Map()
  for (const entry of entries) {
    const slug = wordSlug(entry.tongan)
    if (!slug) throw new Error(`No web address can be made for ${entry.id} (${entry.tongan})`)
    if (RESERVED_SLUGS.includes(slug)) throw new Error(`${entry.id} would take the reserved address ${slug}`)
    entry.slug = slug
    entry.path = wordPagePath(slug)
    rowPage.set(entry.id, slug)
    if (!pageMap.has(slug)) pageMap.set(slug, { kind: 'word', slug, path: wordPagePath(slug), sortKey: plainKey(withoutNotes(entry.tongan)), entries: [] })
    pageMap.get(slug).entries.push(entry)
  }

  const pages = [...pageMap.values()].sort(byPlain)
  const lessonWords = new Map()
  const themeWords = new Map()
  for (const page of pages) {
    // Course rows in lesson order, supplemental rows after them, word-list rows last.
    page.entries.sort((a, b) => (a.kind === 'course' ? 0 : 1) - (b.kind === 'course' ? 0 : 1)
      || (a.lesson?.number || 99) - (b.lesson?.number || 99) || String(a.id).localeCompare(String(b.id)))
    page.words = [...new Set(page.entries.map(entry => entry.display))]
    page.typed = plainTyping(withoutNotes(page.entries[0].tongan)).toLowerCase()
    page.rowIds = []
    for (const entry of page.entries) {
      const link = { display: entry.display, path: page.path, slug: page.slug }
      if (entry.lesson) lessonWords.set(entry.lesson.number, [...(lessonWords.get(entry.lesson.number) || []), link])
      if (entry.wordList) themeWords.set(entry.wordList.themeId, [...(themeWords.get(entry.wordList.themeId) || []), link])
      for (const also of entry.alsoInWordLists) themeWords.set(also.themeId, [...(themeWords.get(also.themeId) || []), link])
    }
  }
  for (const [id, slug] of rowPage) pageMap.get(slug).rowIds.push(id)

  const others = (links, page) => {
    const seen = new Set([page.slug])
    return (links || []).filter(link => !seen.has(link.slug) && seen.add(link.slug)).map(link => ({ display: link.display, path: link.path }))
  }
  pages.forEach((page, index) => {
    const before = pages[index - 1]
    const after = pages[index + 1]
    page.previous = before ? { display: before.words.join(', '), path: before.path } : null
    page.next = after ? { display: after.words.join(', '), path: after.path } : null
    // Other words of the same lesson, one group per lesson on the page.
    page.sameLesson = []
    for (const entry of page.entries) {
      if (!entry.lesson || page.sameLesson.some(group => group.lesson.number === entry.lesson.number)) continue
      const words = others(lessonWords.get(entry.lesson.number), page)
      if (words.length) page.sameLesson.push({ lesson: entry.lesson, words })
    }
    // Other words of the same word list: for word-list words, and for course
    // words that a word list also holds.
    page.sameWordList = []
    for (const entry of page.entries) {
      const lists = entry.wordList ? [entry.wordList] : entry.alsoInWordLists
      for (const list of lists) {
        if (page.sameWordList.some(group => group.themeId === list.themeId)) continue
        const words = others(themeWords.get(list.themeId), page)
        if (words.length) page.sameWordList.push({ themeId: list.themeId, label: list.label, href: list.href, words })
      }
    }
  })

  const derived = deriveEnglishHeadwords(entries)
  const english = derived.headwords.map(item => ({
    kind: 'english',
    slug: item.slug,
    path: englishPagePath(item.slug),
    headword: item.headword,
    sources: item.sources,
    entries: item.sources.map(source => byId.get(source.rowId)),
  }))

  // English headwords each entry gave, for the links on its word page.
  for (const page of english) for (const entry of page.entries) (entry.englishPages ||= []).push({ headword: page.headword, path: page.path })
  for (const entry of entries) entry.englishPages ||= []

  return {
    entries,
    rowPage,
    pages,
    pageBySlug: new Map(pages.map(page => [page.slug, page])),
    english,
    englishBySlug: new Map(english.map(page => [page.slug, page])),
    englishDropped: derived.dropped,
  }
}

// The page at a path, or null: /dictionary/<slug> or /dictionary/english/<slug>.
export function dictionaryPageForPath(index, pathname) {
  const path = String(pathname || '').replace(/\/+$/, '')
  let found = /^\/dictionary\/english\/([a-z0-9-]+)$/.exec(path)
  if (found) return index.englishBySlug.get(found[1]) || null
  found = /^\/dictionary\/([a-z0-9-]+)$/.exec(path)
  return found ? index.pageBySlug.get(found[1]) || null : null
}
