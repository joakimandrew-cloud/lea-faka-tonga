import { Link } from 'react-router-dom'
import EntryMotif from './EntryMotif.jsx'
import { AUDIO_PROGRESS, BEGINNER_PATH } from '@app/seo/learning-paths.js'
import '../styles/learning-paths.css'

export default function LearningPaths() {
  return (
    <section className="learning-paths" aria-labelledby="learning-paths-heading">
      <div className="learning-paths__intro">
        <p className="wr-home__eyebrow">{BEGINNER_PATH.eyebrow}</p>
        <h2 id="learning-paths-heading">{BEGINNER_PATH.heading}</h2>
        <p>{BEGINNER_PATH.lead}</p>
      </div>

      <ol className="learning-paths__steps">
        {BEGINNER_PATH.steps.map((step, index) => (
          <li key={step.number} className="learning-paths__step">
            <span className="learning-paths__number" aria-hidden="true">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <div className="learning-paths__links">
              {step.links.map((item, linkIndex) => (
                <Link key={item.to} to={item.to}>
                  {item.label} <EntryMotif size={16} index={index + linkIndex} />
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <p className="learning-paths__audio">{AUDIO_PROGRESS}</p>
    </section>
  )
}
