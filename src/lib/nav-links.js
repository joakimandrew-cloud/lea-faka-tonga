// The five in-app surfaces the site nav advertises (SSR-01).
// Lifted out of Layout.jsx 2026-08-12 so the homepage can render the SAME list:
// "/" renders <Landing /> bare (outside <Layout />), so it has its own header
// band and needs the links without importing the whole Layout module.
export const NAV_LINKS = [
  { label: 'Lessons', to: '/lessons' },
  { label: 'Drills', to: '/drills' },
  { label: 'Quizzes', to: '/quizzes' },
  { label: 'Cards', to: '/cards' },
  { label: 'Charts', to: '/charts' },
]

export default NAV_LINKS
