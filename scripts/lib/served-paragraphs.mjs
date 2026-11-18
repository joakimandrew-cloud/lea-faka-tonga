/**
 * served-paragraphs.mjs: the static blocks the prerender writes into #root for
 * the two sentence builders, /cards and the 52 quiz pages (SEO plan 2026-08-20,
 * FIX-01 to FIX-03).
 *
 * A crawler that never runs JavaScript reads these; React replaces them when it
 * mounts, so nothing here is seen by a visitor with JavaScript on. The markup
 * and the inline styles follow lessonRootHtml and drillRootHtml in
 * scripts/prerender.mjs, which is where the other ten practice tools get their
 * block (each shares the one its /drill/<id> twin already serves).
 *
 * Pure functions: data in, HTML out. Every number is counted from the data
 * handed in, and every Tongan string comes from that data, with the fakauʻa
 * normalised the way the app's own display layer does it. The sentences that
 * say what a page does describe src/pages/FlipCards.jsx, SentenceBuilder.jsx,
 * TerminalBuilder.jsx and src/components/QuizRunner.jsx as they stand; the
 * tests in scripts/tests/served-paragraphs.test.mjs hold the cards copy to the
 * page's own filter rules.
 */
import { SITE_NAME } from '../../src/seo/meta.js'
import { okinafy } from '../../src/lib/okinafy.js'

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

// The same values as the lesson and drill blocks in prerender.mjs.
const BLOCK_STYLE =
  'max-width:44rem;margin:0 auto;padding:3rem 1.25rem;' +
  'color:var(--text,#2a1f14);background:var(--bg,#fff);' +
  // Single quotes inside: this string lands in an HTML style attribute.
  "font-family:Georgia,'Source Serif 4',serif;line-height:1.65;font-size:1.05rem"
const H1_STYLE = 'font-size:2rem;line-height:1.2;margin:0 0 1.25rem;font-weight:700'
const P_STYLE = 'margin:0 0 1rem'
const link = (href, text) =>
  `<a href="${escapeHtml(href)}" style="color:#c24a1f;text-decoration:underline">${escapeHtml(text)}</a>`
const para = (html) => `<p style="${P_STYLE}">${html}</p>`
const links = (items) => para(items.join(' &middot; '))

function block({ crumbs, h1, paragraphs, nav }) {
  return (
    `<article style="${BLOCK_STYLE}">` +
    links(crumbs) +
    `<h1 style="${H1_STYLE}">${escapeHtml(h1)}</h1>` +
    paragraphs.map((p) => para(p)).join('') +
    links(nav) +
    `</article>`
  )
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
// A count as a reader would write it: a word up to twelve, digits after that.
export const numberWord = (n) => (Number.isInteger(n) && n >= 0 && n < WORDS.length ? WORDS[n] : String(n))

const home = () => link('/', SITE_NAME)
const course = (lessonCount) => `free ${lessonCount}-lesson Tongan course`

/* /sentence-builder and /terminal-build
   ================================================================== */

// The guided builder. It is a page of its own with no /drill/<id> twin: the
// drills menu card that points here (terminal-builder) is not in the registry.
export function renderSentenceBuilderBlock({ lessonCount }) {
  return block({
    crumbs: [home(), link('/drills', 'Drills')],
    h1: 'Build a Tongan sentence, word by word',
    paragraphs: [
      `This is the guided sentence builder from the ${course(lessonCount)}. It opens by asking what you ` +
        `want to say: a statement, a command, a question and so on. Your choice narrows the first words on ` +
        `offer to the ones that begin that kind of sentence, or you can skip the question and start building.`,
      `From there you build the sentence one word at a time. At each step the builder offers only the ` +
        `words the grammar allows next, grouped by part of speech, and delete takes back the last word. ` +
        `When the sentence is finished its English translation appears underneath, and you can open a ` +
        `word-by-word breakdown of how it was built.`,
    ],
    nav: [link('/terminal-build', 'The open sentence sandbox'), link('/drills', 'All practice drills')],
  })
}

// The open sandbox, with the guided builder named as the place to start.
export function renderSandboxBlock({ lessonCount }) {
  return block({
    crumbs: [home(), link('/drills', 'Drills')],
    h1: 'Tongan sentence sandbox',
    paragraphs: [
      `This is the open sentence sandbox from the ${course(lessonCount)}, with every sentence structure ` +
        `in the course available from the start. There is no opening question and no set task. You pick a ` +
        `first word, then choose each next word from what the grammar allows, and the sentence assembles ` +
        `on one line as you go. Its English translation appears when the sentence is finished.`,
      `The sentence builder is the guided version of this page. It first asks what kind of sentence you ` +
        `want to say, then takes you through the same word-by-word build and can show how the finished ` +
        `sentence was put together.`,
    ],
    nav: [link('/sentence-builder', 'The guided sentence builder'), link('/drills', 'All practice drills')],
  })
}

/* /cards
   ================================================================== */

// What the deck holds, counted from book-vocabulary.json the way the page's
// own filters count it: Essential is tier 1, Useful is tiers 1 and 2, All is
// every entry; the category menu lists each category in the data.
export function cardsFacts(vocabulary) {
  const tiers = [...new Set(vocabulary.map((v) => v.tier))].sort((a, b) => a - b)
  const byCategory = {}
  for (const v of vocabulary) byCategory[v.category] = (byCategory[v.category] || 0) + 1
  const categories = Object.entries(byCategory)
    .map(([name, count]) => ({ name, label: name.replace('_', ' '), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  return {
    total: vocabulary.length,
    tiers,
    essential: vocabulary.filter((v) => v.tier === 1).length,
    useful: vocabulary.filter((v) => v.tier <= 2).length,
    categories,
  }
}

function proseList(items) {
  if (items.length < 2) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function renderCardsBlock({ vocabulary, lessonCount }) {
  const f = cardsFacts(vocabulary)
  // The copy below names the page's three tier buttons. If the data ever
  // carries a different set of tiers the build stops here rather than print a
  // sentence the page no longer matches.
  if (f.tiers.join(',') !== '1,2,3') {
    throw new Error(`served-paragraphs: /cards copy expects tiers 1, 2 and 3; the data has ${f.tiers.join(', ')}`)
  }
  const categoryList = proseList(f.categories.map((c) => `${escapeHtml(c.label)} (${c.count})`))
  return block({
    crumbs: [home(), link('/drills', 'Drills')],
    h1: 'Tongan vocabulary flash cards',
    paragraphs: [
      `This deck holds ${f.total} Tongan words and phrases from the ${course(lessonCount)}, one to a ` +
        `card. Each card shows the Tongan with its part of speech, and a tap turns it over to the English. ` +
        `One button flips the direction, so the English comes first and you recall the Tongan.`,
      `The words sit in ${numberWord(f.tiers.length)} tiers. The deck opens on Essential, which keeps to ` +
        `${f.essential} of them. Useful widens it to ${f.useful}, and All shows the full ${f.total}. You ` +
        `can also narrow the deck to one of ${numberWord(f.categories.length)} categories: ${categoryList}. ` +
        `Shuffle mixes the order, and the deck ends when you reach its last card.`,
    ],
    nav: [link('/lessons', `All ${lessonCount} lessons`), link('/drills', 'All practice drills')],
  })
}

/* /quizzes/N
   ================================================================== */

// A quiz page's block. It is handed the lesson (number, title, topics from
// chapters.json) and how many questions the quiz has, and nothing else from
// quizzes.json: no prompt, option or explanation can reach this text.
export function renderQuizBlock({ num, title, topics = [], questionCount, lessonCount }) {
  const covered = topics.map((t) => escapeHtml(okinafy(String(t).trim()))).filter(Boolean)
  const sentences = [
    `This quiz has ${numberWord(questionCount)} multiple-choice questions on lesson ${num} of the ` +
      `${course(lessonCount)}.`,
    `The lesson is called ${escapeHtml(title)}.`,
    `Once you answer a question, every option shows why it is right or wrong.`,
  ]
  if (covered.length) sentences.push(`The questions check what the lesson teaches: ${covered.join('; ')}.`)
  return block({
    crumbs: [home(), link('/quizzes', 'Quizzes')],
    h1: `Lesson ${num} quiz: ${title}`,
    paragraphs: [sentences.join(' ')],
    nav: [link(`/lessons/${num}`, `Read lesson ${num} first`), link('/quizzes', 'All quizzes')],
  })
}
