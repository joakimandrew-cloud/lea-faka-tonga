// Per-route titles + descriptions — the single source of truth shared by the
// client-side title manager (src/components/RouteChrome.jsx) and the build-time
// prerenderer (scripts/prerender.mjs). Plain JS on purpose: no JSX, no React,
// so node can import it directly.

export const SITE_NAME = 'Lea Faka-Tonga'
export const SITE_URL = 'https://leafakatonga.org'
export const DEFAULT_DESCRIPTION =
  "Learn Tongan, free. A complete 52-lesson course with drills, quizzes and flip cards. Find your Tongan, whether it's your family's language, you married into it, or you just love Tonga."

export const STATIC_META = {
  '/': {
    title: `${SITE_NAME} · Learn Tongan, free`,
    description: DEFAULT_DESCRIPTION,
  },
  '/lessons': {
    title: `All 52 Lessons · ${SITE_NAME}`,
    description:
      'The complete free Tongan course, in order: 52 lessons from the basic sentence to advanced grammar, each with examples, vocabulary and practice.',
  },
  '/drills': {
    title: `Practice Drills · ${SITE_NAME}`,
    description:
      'Tap-only Tongan practice drills — tense markers, pronouns, possessives, prepositions and more, each tied to a lesson in the free course.',
  },
  '/quizzes': {
    title: `Lesson Quizzes · ${SITE_NAME}`,
    description:
      'A ten-question quiz for every lesson of the free Tongan course. Every wrong answer explains why.',
  },
  '/cards': {
    title: `Vocab Flip Cards · ${SITE_NAME}`,
    description:
      'Flip cards for the Tongan vocabulary taught in the course — filter by chapter tier and category, flip Tongan-to-English or the reverse.',
  },
  '/charts': {
    title: `Reference Charts · ${SITE_NAME}`,
    description:
      'Tongan reference charts at a glance: tense markers, pronouns, possessives, articles and the little words that hold sentences together.',
  },
  '/support': {
    title: `Support the Work · ${SITE_NAME}`,
    description:
      'The book is free. If it is worth something to you, $35+ keeps the site free for you, for life.',
  },
  '/quiz': {
    title: `The Grandmother Quiz · ${SITE_NAME}`,
    description: 'How much Tongan do you already understand? Find out in a few taps.',
  },
  '/keepers': {
    title: `Keepers · ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
  },
  '/report': {
    title: `Report a Mistake · ${SITE_NAME}`,
    description:
      'This course is corrected in the open. Tell us what is off and make it more accurate for the next family.',
  },
}

export function lessonTitle(num, chapterTitle) {
  return chapterTitle
    ? `Lesson ${num}: ${chapterTitle} · ${SITE_NAME}`
    : `Lesson ${num} · ${SITE_NAME}`
}

export function quizTitle(num, chapterTitle) {
  return chapterTitle
    ? `Lesson ${num} Quiz: ${chapterTitle} · ${SITE_NAME}`
    : `Lesson ${num} Quiz · ${SITE_NAME}`
}

// Resolve a pathname to a title using the static map plus the two numbered
// route families. chapterTitles is { [num]: title } (lazy-loaded client-side).
export function titleForPath(pathname, chapterTitles = {}) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (STATIC_META[path]) return STATIC_META[path].title
  let m = path.match(/^\/lessons\/(\d+)$/)
  if (m) return lessonTitle(Number(m[1]), chapterTitles[Number(m[1])])
  m = path.match(/^\/quizzes\/(\d+)$/)
  if (m) return quizTitle(Number(m[1]), chapterTitles[Number(m[1])])
  return `${SITE_NAME} · Learn Tongan, free`
}
