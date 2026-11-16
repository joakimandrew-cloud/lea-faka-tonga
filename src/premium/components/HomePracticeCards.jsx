import { Link } from 'react-router-dom'

// Three still cards in place of the moving practice preview (2026-11-17). Names, lines and destinations are the preview's own.
const SURFACES = [
  { id: 'drills', name: 'Drills', description: 'Find the missing words.', to: '/drill/tense-swap', action: 'Try a drill' },
  { id: 'quizzes', name: 'Quizzes', description: 'An answer, with an explanation.', to: '/quizzes/6', action: 'Try a quiz' },
  { id: 'cards', name: 'Flip cards', description: 'Turn it. Remember it. Keep going.', to: '/cards?lesson=1', action: 'Try the flip cards' },
]

export default function HomePracticeCards() {
  return (
    <ul className="home-practice">
      {SURFACES.map(surface => (
        <li key={surface.id}>
          <Link className="home-practice__card" to={surface.to}>
            <h3>{surface.name}</h3>
            <p>{surface.description}</p>
            <span className="wr-home__more">{surface.action} <span aria-hidden="true">›</span></span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
