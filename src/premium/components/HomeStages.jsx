import { Link } from 'react-router-dom'
import { HOME_STAGES } from '../lib/home-stages.js'

// A six-row list in place of the 52-lesson course map (2026-11-17).
export default function HomeStages() {
  return (
    <div className="home-stages">
      <ol className="home-stages__list">
        {HOME_STAGES.map((stage, index) => (
          <li key={stage.name} className="home-stages__row">
            <span className="home-stages__number" aria-hidden="true">{index + 1}</span>
            <span className="home-stages__name">{stage.name}</span>
            <span className="home-stages__range">Lessons {stage.first} to {stage.last}</span>
          </li>
        ))}
      </ol>
      <Link className="wr-home__more" to="/lessons">Browse all 52 lessons <span aria-hidden="true">›</span></Link>
    </div>
  )
}
