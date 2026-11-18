import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import chapters from '../../src/data/chapters.json' with { type: 'json' }
import quizzes from '../../src/data/quizzes.json' with { type: 'json' }
import vocabulary from '../../src/data/book-vocabulary.json' with { type: 'json' }
import { okinafy } from '../../src/lib/okinafy.js'
import {
  cardsFacts,
  escapeHtml,
  numberWord,
  renderCardsBlock,
  renderQuizBlock,
  renderSandboxBlock,
  renderSentenceBuilderBlock,
} from '../lib/served-paragraphs.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const lessonCount = chapters.length
const count = (html, pattern) => (html.match(pattern) || []).length
const decode = (s) =>
  s.replaceAll('&middot;', '·').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&amp;', '&')
const plain = (html) => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
// The paragraphs that carry prose: each <p> with its links taken out whole.
const prose = (html) =>
  [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => plain(m[1].replace(/<a\b[\s\S]*?<\/a>/g, '')).replace(/[·\s]+/g, ' ').trim())
    .filter(Boolean)
const words = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
const norm = (s) => String(s).toLowerCase().replace(/['‘’ʼ`ʻ]/g, 'ʻ').replace(/\s+/g, ' ').trim()
const hasWhole = (hay, needle) =>
  new RegExp(`(?<![\\p{L}\\p{N}ʻ])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}ʻ])`, 'u').test(hay)

const quizBlock = (ch) =>
  renderQuizBlock({
    num: ch.chapter,
    title: ch.title,
    topics: ch.topics,
    questionCount: quizzes[String(ch.chapter)].questions.length,
    lessonCount,
  })

const fixedBlocks = () => ({
  '/sentence-builder': renderSentenceBuilderBlock({ lessonCount }),
  '/terminal-build': renderSandboxBlock({ lessonCount }),
  '/cards': renderCardsBlock({ vocabulary, lessonCount }),
})
const allBlocks = () => ({
  ...fixedBlocks(),
  ...Object.fromEntries(chapters.map((ch) => [`/quizzes/${ch.chapter}`, quizBlock(ch)])),
})

test('every block has one H1, a paragraph of 25 to 90 words, and none of the banned marks or words', () => {
  const blocks = allBlocks()
  assert.equal(Object.keys(blocks).length, 3 + 52)
  for (const [route, html] of Object.entries(blocks)) {
    assert.equal(count(html, /<h1\b/g), 1, `${route} has one H1`)
    const paragraphs = prose(html)
    assert.ok(paragraphs.length >= 1, `${route} has a prose paragraph`)
    for (const p of paragraphs) {
      const n = words(p)
      assert.ok(n >= 25 && n <= 90, `${route}: a paragraph of ${n} words`)
    }
    const text = plain(html)
    assert.ok(!html.includes('—'), `${route} has no em dash`)
    assert.ok(!/ - /.test(text), `${route} has no spaced hyphen standing in for a dash`)
    assert.ok(!text.includes('!'), `${route} has no exclamation mark`)
    assert.doesNotMatch(text, /unlock|master|journey|dive in|seamless|\bbest\b|chapter/iu, route)
  }
})

test('content is escaped, and the lesson count is the one handed in', () => {
  assert.equal(escapeHtml('<script data-x="1">&'), '&lt;script data-x=&quot;1&quot;&gt;&amp;')
  const html = renderQuizBlock({
    num: 3,
    title: '<b>Tom & "Jerry"</b>',
    topics: ['<i>one</i>', 'two & three'],
    questionCount: 10,
    lessonCount: 7,
  })
  assert.ok(!html.includes('<b>') && !html.includes('<i>'), 'no markup from the data survives')
  assert.ok(html.includes('&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;'))
  assert.ok(html.includes('&lt;i&gt;one&lt;/i&gt;; two &amp; three.'))
  for (const block of [html, renderSentenceBuilderBlock({ lessonCount: 7 }), renderSandboxBlock({ lessonCount: 7 })]) {
    assert.ok(plain(block).includes('free 7-lesson Tongan course'))
    assert.ok(!plain(block).includes(String(lessonCount)))
  }
  assert.equal(numberWord(10), 'ten')
  assert.equal(numberWord(13), '13')
})

test('the two sentence builders point at each other and at the drills menu', () => {
  const guided = renderSentenceBuilderBlock({ lessonCount })
  const sandbox = renderSandboxBlock({ lessonCount })
  assert.ok(guided.includes('href="/terminal-build"') && guided.includes('href="/drills"'))
  assert.ok(sandbox.includes('href="/sentence-builder"') && sandbox.includes('href="/drills"'))
  assert.ok(!guided.includes('href="/sentence-builder"'), 'the guided builder does not link to itself')
  assert.ok(!sandbox.includes('href="/terminal-build"'), 'the sandbox does not link to itself')
  assert.match(plain(sandbox), /The sentence builder is the guided version of this page\./)
  assert.equal(prose(guided).length, 2)
  assert.equal(prose(sandbox).length, 2)
})

test('/cards counts its deck from the data and says what the page really does', () => {
  const f = cardsFacts(vocabulary)
  const html = renderCardsBlock({ vocabulary, lessonCount })
  const text = prose(html).join(' ')
  const numbers = new Set(text.match(/\d+/g))
  assert.equal(f.total, vocabulary.length)
  for (const n of [f.total, f.essential, f.useful, ...f.categories.map((c) => c.count)]) {
    assert.ok(numbers.has(String(n)), `${n} is in the text`)
  }
  assert.equal(f.categories.reduce((sum, c) => sum + c.count, 0), f.total)
  for (const c of f.categories) assert.ok(text.includes(`${c.label} (${c.count})`), c.label)
  assert.ok(text.includes(`${numberWord(f.tiers.length)} tiers`))
  assert.ok(text.includes(`${numberWord(f.categories.length)} categories`))
  assert.ok(html.includes('href="/lessons"') && html.includes('href="/drills"'))

  // Nothing is typed in: a different deck gives different numbers.
  const small = [
    { tier: 1, category: 'nouns' },
    { tier: 2, category: 'nouns' },
    { tier: 3, category: 'verbs' },
    { tier: 3, category: 'verbs' },
    { tier: 3, category: 'verbs' },
  ]
  const smallText = prose(renderCardsBlock({ vocabulary: small, lessonCount })).join(' ')
  assert.ok(smallText.includes('This deck holds 5 Tongan words'))
  assert.ok(smallText.includes('keeps to 1 of them') && smallText.includes('widens it to 2') && smallText.includes('the full 5'))
  assert.ok(smallText.includes('one of two categories: verbs (3) and nouns (2)'))
  assert.ok(!smallText.includes(String(vocabulary.length)))
  assert.throws(() => renderCardsBlock({ vocabulary: [{ tier: 1, category: 'nouns' }], lessonCount }), /tiers/)

  // The sentences name the page's own controls, so hold them to its source.
  const page = fs.readFileSync(path.join(root, 'src/pages/FlipCards.jsx'), 'utf8')
  for (const needle of [
    "essential: 'Essential', useful: 'Useful', all: 'All'",
    "useState('essential')",
    "tier === 'essential') base = base.filter(v => v.tier === 1)",
    "tier === 'useful') base = base.filter(v => v.tier <= 2)",
    'setReversed(r => !r)',
    'Shuffle',
    'setFinished(true)',
    'pos={card.part_of_speech}',
  ]) {
    assert.ok(page.includes(needle), `FlipCards.jsx still has: ${needle}`)
  }
  for (const label of ['Essential', 'Useful', 'All', 'Shuffle']) assert.ok(text.includes(label), label)
})

test('each quiz block names its lesson, its title and its topics, with the fakauʻa set', () => {
  assert.equal(chapters.length, 52)
  for (const ch of chapters) {
    const num = ch.chapter
    const quiz = quizzes[String(num)]
    assert.ok(quiz, `quiz ${num} exists`)
    const html = quizBlock(ch)
    const [paragraph, ...more] = prose(html)
    assert.equal(more.length, 0, `quiz ${num} has one prose paragraph`)
    assert.ok(html.includes(`>Lesson ${num} quiz: ${escapeHtml(ch.title)}</h1>`))
    assert.match(paragraph, new RegExp(`\\blesson ${num}\\b`))
    assert.ok(paragraph.includes(`The lesson is called ${ch.title}.`), `quiz ${num} names the title`)
    assert.ok(paragraph.includes(`${numberWord(quiz.questions.length)} multiple-choice questions`))
    for (const topic of ch.topics) assert.ok(paragraph.includes(okinafy(topic)), `quiz ${num}: ${topic}`)
    assert.doesNotMatch(paragraph, /['‘’](?=[aeiouāēīōū])/iu, `quiz ${num}: an apostrophe left before a vowel`)
    assert.ok(html.includes(`href="/lessons/${num}"`) && html.includes('href="/quizzes"'))
    assert.ok(plain(html).includes(`Read lesson ${num} first`))
  }
})

test('no quiz block carries a prompt, an option or an explanation from its quiz', () => {
  let options = 0
  for (const ch of chapters) {
    const num = ch.chapter
    const quiz = quizzes[String(num)]
    const full = norm(plain(quizBlock(ch)))
    // The block with the lesson's own title and topics left out: every word
    // the renderer itself supplies. Option texts are tested against this, as
    // whole words, because a lesson's title or topic can share a plain word
    // ("until", "tonight") with an option without coming from the quiz.
    const frame = norm(
      prose(renderQuizBlock({ num, title: '', topics: [], questionCount: quiz.questions.length, lessonCount })).join(' ')
    )
    for (const q of quiz.questions) {
      assert.ok(!full.includes(norm(q.prompt)), `quiz ${num} ${q.id}: prompt`)
      for (const o of q.options) {
        if (o.explanation) assert.ok(!full.includes(norm(o.explanation)), `quiz ${num} ${q.id}${o.label}: explanation`)
        const t = norm(o.text)
        if (t.length < 4) continue
        options += 1
        assert.ok(!hasWhole(frame, t), `quiz ${num} ${q.id}${o.label}: option text "${o.text}"`)
      }
    }
  }
  assert.ok(options > 1000, `${options} option texts were tested`)
})
