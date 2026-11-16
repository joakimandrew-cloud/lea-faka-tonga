import { Link } from 'react-router-dom'
import { AUDIO_PROGRESS, BEGINNER_PATH } from '@app/seo/learning-paths.js'
import '../styles/learning-paths.css'

export default function LearningPaths({ children }) {
  return (
    <section className="learning-paths" aria-labelledby="learning-paths-heading">
      <div className="wr-home__col">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">{BEGINNER_PATH.eyebrow}</p>
          <h2 id="learning-paths-heading">{BEGINNER_PATH.heading}</h2>
          <p>{BEGINNER_PATH.lead}</p>
        </div>

        <ol className="learning-paths__steps">
          {BEGINNER_PATH.steps.map(step => (
            <li key={step.number} className="learning-paths__step">
              <span className="learning-paths__number" aria-hidden="true">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <div className="learning-paths__links">
                {step.links.map(item => (
                  <Link key={item.to} to={item.to}>
                    {item.label} <span aria-hidden="true">›</span>
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <p className="learning-paths__audio">{AUDIO_PROGRESS}</p>
        {children}
      </div>
    </section>
  )
}
