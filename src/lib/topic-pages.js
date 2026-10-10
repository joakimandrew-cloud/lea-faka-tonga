// The seven standalone topic pages, in one list.
//
// Each one answers a single common question about Tongan in full, outside the
// lesson order, and ends by pointing into the lessons that cover it. They are
// real routes (src/App.jsx) with their own prerendered HTML, but until
// 2026-08-26 five of them had no internal link at all: only the sitemap knew
// they existed. This list is what the hub page (/topics), the footer strip
// under <Layout />, and the homepage strip all read from, so a new topic page
// is added in one place and appears in all three.
//
// Lifted out for the same reason lib/nav-links.js was: the homepage renders
// <Landing /> outside <Layout />, so it cannot reach anything Layout owns.
//
// `label` is the card title on /topics and matches the breadcrumb Layout shows
// on the page itself. `strip` is the short form the uppercase footer strip
// uses. `blurb` is one card-sized line, shortened from that page's own meta
// description in src/seo/meta.js. Nothing here asserts anything about Tongan
// that those descriptions do not already say.
export const TOPIC_PAGES = [
  {
    to: '/alphabet',
    label: 'Alphabet & Pronunciation',
    strip: 'Alphabet & pronunciation',
    group: 'sounds',
    blurb: '17 letters, how each one sounds, and where the stress falls.',
  },
  {
    to: '/greetings',
    label: 'Greetings',
    strip: 'Greetings',
    group: 'sounds',
    blurb: 'Mālō e lelei and what it means, how to answer it, and which of the two goodbyes to use.',
  },
  {
    to: '/grammar/tense-markers',
    label: 'Tense Markers',
    strip: 'Tense markers',
    group: 'grammar',
    blurb: 'One word in front of the verb marks tense. The four markers, and how the negative works.',
  },
  {
    to: '/grammar/word-order',
    label: 'Word Order',
    strip: 'Word order',
    group: 'grammar',
    blurb: 'The tense marker and the verb come first, and the subject follows. Where a pronoun goes instead.',
  },
  {
    to: '/grammar/negation',
    label: 'The Negative',
    strip: 'The negative',
    group: 'grammar',
    blurb: 'ʻikai sits between the tense marker and what follows, with te before a pronoun and ke before a verb.',
  },
  {
    to: '/grammar/possessives',
    label: 'Possessives',
    strip: 'Possessives',
    group: 'grammar',
    blurb: 'Two sets, chosen by your relationship to the thing rather than by the thing itself.',
  },
  {
    to: '/grammar/ko-sentences',
    label: 'The Ko Pattern',
    strip: 'The ko pattern',
    group: 'grammar',
    blurb: 'Ko e hele ʻeni, a sentence with no verb and no tense marker, for saying what something is.',
  },
]

// The questions page (2026-10-10). It renders through the same article
// adapter as the seven above and is linked from /topics and the homepage
// pathway, but it is not a topic page: it answers four questions about
// starting, not one question about Tongan, so it stays out of TOPIC_PAGES
// and out of the strips and cards that list reads into.
export const QUESTIONS_PAGE = {
  to: '/questions',
  label: 'Questions',
  link: 'questions about learning Tongan',
}

export default TOPIC_PAGES
