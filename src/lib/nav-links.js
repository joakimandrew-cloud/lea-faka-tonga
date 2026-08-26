// The in-app surfaces the site nav advertises (SSR-01).
// Lifted out of Layout.jsx 2026-08-12 so the homepage can render the SAME list:
// "/" renders <Landing /> bare (outside <Layout />), so it has its own header
// band and needs the links without importing the whole Layout module.
//
// Topics joined the row 2026-08-26: it is the hub for the seven standalone
// topic pages, five of which had no internal link pointing at them at all.
// The seven themselves stay out of this row (that would be twelve links) and
// are reached from /topics and from the footer strip.
export const NAV_LINKS = [
  { label: 'Lessons', to: '/lessons' },
  { label: 'Drills', to: '/drills' },
  { label: 'Quizzes', to: '/quizzes' },
  { label: 'Cards', to: '/cards' },
  { label: 'Charts', to: '/charts' },
  { label: 'Topics', to: '/topics' },
]

export default NAV_LINKS
