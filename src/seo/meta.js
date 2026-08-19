// Per-route titles and descriptions: the single source of truth shared by the
// client-side chrome (src/components/RouteChrome.jsx) and the build-time
// prerenderer (scripts/prerender.mjs).
//
// Plain JS on purpose. No JSX, no React, no data imports, so `node` can import
// this file directly during the build. The two lookup tables it needs (lesson
// titles and summaries, drill titles) are passed in by the caller, which keeps
// this module free of anything Vite would have to transform.
//
// Nothing here changes visible page copy. These strings are the <title>, the
// meta description, and the social card only.

export const SITE_NAME = 'Lea Faka-Tonga'
export const SITE_URL = 'https://leafakatonga.org'
export const OG_IMAGE = `${SITE_URL}/og-image.png`
export const SUPPORT_URL = 'https://buymeacoffee.com/leafakatonga'

export const DEFAULT_DESCRIPTION =
  'Learn Tongan free: 52 lessons from the basic sentence to advanced grammar, with 30 practice drills, a quiz for every lesson, vocabulary cards, and the whole book as a free PDF or EPUB.'

// Trim to a word boundary so a description never ends mid-word.
export function clamp(text, max) {
  const plain = String(text || '').replace(/\s+/g, ' ').trim()
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > 40 ? cut.slice(0, space) : cut).replace(/[,;:.]$/, '')}…`
}

// Static routes. Hidden routes (/hero-lab, /scrub, /hero-scrub, /r/:slug) are
// absent from this map on purpose: they are never prerendered, never listed in
// the sitemap, and robots.txt disallows them.
export const STATIC_META = {
  '/': {
    title: `Learn Tongan Free | ${SITE_NAME}: 52 Lessons, Drills and Quizzes`,
    description: DEFAULT_DESCRIPTION,
  },
  '/lessons': {
    title: `All 52 Tongan Lessons | Learn Tongan Free`,
    description:
      'The complete free Tongan course in order: 52 lessons from the basic sentence to advanced grammar, each with worked examples, vocabulary, and practice built into the page.',
  },
  '/quizzes': {
    title: `Tongan Quizzes, One for Every Lesson | ${SITE_NAME}`,
    description:
      'Fifty-two ten-question Tongan quizzes, one per lesson. Every wrong answer explains the rule instead of just marking you down.',
  },
  '/drills': {
    title: `Tongan Grammar Drills, Free Online Practice | ${SITE_NAME}`,
    description:
      'Thirty tap-only Tongan practice drills grouped by skill: tense markers, pronouns, possessives, articles, prepositions, question words, and more. Each one is tied to the lesson that teaches it.',
  },
  '/cards': {
    title: `Tongan Vocabulary Flash Cards | ${SITE_NAME}`,
    description:
      'Flip cards for every Tongan word taught in the course. Filter by lesson tier and category, and flip Tongan to English or English to Tongan.',
  },
  '/charts': {
    title: `Tongan Grammar Charts | ${SITE_NAME}`,
    description:
      'Tongan grammar at a glance: tense markers, the full pronoun table, a-class and o-class possessives, articles, prepositions, and the small words that hold a sentence together.',
  },
  '/quiz': {
    title: `How Much Tongan Do You Already Know? | ${SITE_NAME}`,
    description:
      'A short Tongan comprehension check. Read a few real sentences and find out how much you already understand before lesson one.',
  },
  '/sentence-builder': {
    title: `Tongan Sentence Builder, Word by Word | ${SITE_NAME}`,
    description:
      'Build a Tongan sentence one word at a time. Pick a sentence type, choose each next word from what the grammar actually allows, then read the translation back.',
  },
  '/terminal-build': {
    title: `Tongan Sentence Sandbox | ${SITE_NAME}`,
    description:
      'An open Tongan sentence sandbox with every structure unlocked. Pick each word from what the grammar allows and watch the sentence assemble.',
  },
  '/tense-swap': {
    title: `Tongan Tense Markers: Past, Present, Perfect, Future | ${SITE_NAME}`,
    description:
      'Tongan marks tense with a particle in front of the verb, and the verb itself stays put. Swap the marker and watch the meaning change.',
  },
  '/first-word': {
    title: `Tongan Sentence Types from the First Word | ${SITE_NAME}`,
    description:
      'The opening word of a Tongan sentence already tells you what kind of sentence it is: statement, command, negation, or an equation. Practice calling it.',
  },
  '/possessive-sort': {
    title: `Tongan Possessives: ʻeku or hoku | ${SITE_NAME}`,
    description:
      'Tongan has two possessive classes. Practice choosing the a-class or o-class form of "my", one noun at a time, until the rule feels obvious.',
  },
  '/adjective-flip': {
    title: `Tongan Adjective Order | ${SITE_NAME}`,
    description:
      'Most Tongan adjectives follow the noun, and a short list of them comes first. Practice placing each one on the right side.',
  },
  '/skeleton-filler': {
    title: `Build a Tongan Sentence: Marker, Pronoun, Verb | ${SITE_NAME}`,
    description:
      'Every Tongan sentence starts with a tense marker, then the pronoun, then the verb. Practice putting the three in order.',
  },
  '/clusivity': {
    title: `The Four Tongan Words for "We" | ${SITE_NAME}`,
    description:
      'Tongan splits "we" four ways, by whether the listener is included and whether the group is two people or more. Practice picking the right one.',
  },
  '/faka-sort': {
    title: `The Tongan Prefix faka-, Sorted by Job | ${SITE_NAME}`,
    description:
      'One Tongan prefix, four jobs: manner, cause, every-X, and one-particular. Read the word and sort it by what faka- is doing.',
  },
  '/cleft-builder': {
    title: `Tongan Cleft Sentences with Ko | ${SITE_NAME}`,
    description:
      'Front the doer with Ko to say "it was Sione who ate it", and watch the rest of the Tongan sentence rearrange around it.',
  },
  '/accent-placement': {
    title: `The Tongan Definitive Accent | ${SITE_NAME}`,
    description:
      'The definitive accent lands on the last word of a definite noun phrase. Practice finding the word that carries it.',
  },
  '/verbal-noun': {
    title: `Tongan Verbal Nouns | ${SITE_NAME}`,
    description:
      'Turn a Tongan verb into a verbal noun and give it the possessive it needs. Practice the conversion sentence by sentence.',
  },
  // '/community' is deliberately absent. The route itself is not committed yet:
  // it lives in the working tree of the paused 2026-07-24 plan and is held at
  // that plan's own publish gate. Prerendering it here would put the page live,
  // in the sitemap, with no React route behind it. Add this entry back on the
  // same commit that ships the route.
  '/report': {
    title: `Report a Mistake in the Tongan Course | ${SITE_NAME}`,
    description:
      'Found something off in the Tongan? Tell us what is wrong and make the course more accurate for the next family.',
  },
  '/keepers': {
    title: `Keepers, the People Keeping This Free | ${SITE_NAME}`,
    description:
      'The people whose support keeps the Tongan course free to read. The book is free and stays free.',
  },
  '/support': {
    title: `Support the Work | ${SITE_NAME}`,
    description:
      'The book is free and stays free. If it is worth something to you, a one-off contribution keeps the site free for you, for life.',
  },
}

export function lessonTitle(num, chapterTitle) {
  return chapterTitle ? `Lesson ${num}: ${chapterTitle} | Learn Tongan` : `Lesson ${num} | Learn Tongan`
}

export function lessonDescription(num, chapterTitle, summary) {
  const lead = `Lesson ${num} of the free Tongan course.`
  if (summary) return `${lead} ${clamp(summary, 118)}`
  if (chapterTitle) return `${lead} ${chapterTitle}, explained with examples, vocabulary, and practice built into the page.`
  return lead
}

export function quizTitle(num, chapterTitle) {
  return chapterTitle
    ? `Lesson ${num} Quiz: ${chapterTitle} | Learn Tongan`
    : `Lesson ${num} Quiz | Learn Tongan`
}

export function quizDescription(num, chapterTitle) {
  const on = chapterTitle ? `, ${chapterTitle}` : ''
  return `Ten questions on lesson ${num} of the free Tongan course${on}. Every wrong answer explains the rule instead of just marking you down.`
}

export function drillTitle(catalogTitle) {
  return catalogTitle ? `${catalogTitle} | Tongan Practice Drill` : `Tongan Practice Drill | ${SITE_NAME}`
}

export function drillDescription(catalogTitle, blurb) {
  if (blurb) return clamp(`${blurb} A free tap-only drill from the 52-lesson Tongan course.`, 200)
  if (catalogTitle) return clamp(`${catalogTitle}. A free tap-only drill from the 52-lesson Tongan course.`, 200)
  return DEFAULT_DESCRIPTION
}

// Normalise a pathname the way both the router and the prerenderer see it.
export function normalisePath(pathname) {
  return (pathname || '/').replace(/\/+$/, '') || '/'
}

// Resolve a pathname to { title, description }. `tables` supplies the two
// lookups this module deliberately does not import:
//   chapters: { [num]: { title, summary } }
//   drills:   { [id]: { title, blurb } }
export function metaForPath(pathname, tables = {}) {
  const path = normalisePath(pathname)
  const chapters = tables.chapters || {}
  const drills = tables.drills || {}

  if (STATIC_META[path]) {
    const { title, description } = STATIC_META[path]
    return { title, description }
  }

  let m = path.match(/^\/lessons\/(\d+)$/)
  if (m) {
    const n = Number(m[1])
    const ch = chapters[n] || {}
    return { title: lessonTitle(n, ch.title), description: lessonDescription(n, ch.title, ch.summary) }
  }

  m = path.match(/^\/quizzes\/(\d+)$/)
  if (m) {
    const n = Number(m[1])
    const ch = chapters[n] || {}
    return { title: quizTitle(n, ch.title), description: quizDescription(n, ch.title) }
  }

  m = path.match(/^\/drill\/([a-z0-9-]+)$/)
  if (m) {
    const d = drills[m[1]] || {}
    return { title: drillTitle(d.title), description: drillDescription(d.title, d.blurb) }
  }

  return { title: STATIC_META['/'].title, description: DEFAULT_DESCRIPTION }
}

export function titleForPath(pathname, tables) {
  return metaForPath(pathname, tables).title
}
