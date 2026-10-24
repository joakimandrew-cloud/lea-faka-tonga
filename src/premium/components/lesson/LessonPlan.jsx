/**
 * The lesson plan card (reviews/lesson-course-2026-10-24/Direction.md, "The
 * learn block"): what the lesson teaches as its key rules with their examples,
 * a link to where each example appears, the figure link, the resume button on
 * a return visit and, at 1080 px and below, the lesson path.
 */
import { useEffect, useState } from 'react'
import { Md } from './Blocks.jsx'
import { Mixed } from './FigureEngine.jsx'
import LessonPath from './LessonPath.jsx'
import T from '../T.jsx'

const nn = number => String(number).padStart(2, '0')

// A local copy of MobileCompass's focusSection (it is not exported).
function focusSection(id) {
  const section = document.getElementById(id)
  if (!section) return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  const heading = section.querySelector('h2')
  heading?.focus({ preventScroll: true })
}

export default function LessonPlan({ n, learn, sections, path, stations, prev, next, activeStep, activeSection }) {
  const [hashAtMount, setHashAtMount] = useState(null)
  useEffect(() => {
    const id = setTimeout(() => setHashAtMount(window.location.hash || ''), 0)
    return () => clearTimeout(id)
  }, [])
  const resumeIndex = path.at ? sections.findIndex(section => section.id === path.at) : -1
  const resume = hashAtMount === '' && resumeIndex > 0 && !sections[resumeIndex].exercises ? sections[resumeIndex] : null

  return (
    <section className="xs lp" id="lesson-plan" data-lesson-plan="" aria-labelledby="lesson-plan-t">
      {resume && (
        <button type="button" className="btn btn-primary lp-resume" onClick={() => focusSection(resume.id)}>
          <span className="lp-resume-k">Pick up where you left off</span>
          <span className="lp-resume-t">{nn(resumeIndex + 1)} {'\u00b7'} <Md text={resume.title} /></span>
        </button>
      )}
      <p className="xs-k">Lesson plan</p>
      <h2 className="xs-t lp-t" id="lesson-plan-t">What you will learn</h2>
      <ol className="lp-rules">
        {learn.items.map(item => (
          <li key={item.i} className="lp-rule">
            <span className="lp-n" aria-hidden="true">{item.i + 1}</span>
            <div className="lp-body">
              <p className="lp-text"><Mixed text={item.text} /></p>
              {(item.to || item.en) && (
                <div className="lp-ex">
                  {item.to && <T className="lp-ex-to">{item.to}</T>}
                  {item.en && <span className="lp-ex-en">{item.en}</span>}
                </div>
              )}
              {item.section && (
                <a className="lp-link" href={`#${item.section.sectionId}`}>{`See it in section ${nn(item.section.sectionNumber)} \u2193`}</a>
              )}
            </div>
          </li>
        ))}
      </ol>
      <a className="lp-link lp-fig" href={learn.figure.href}>{learn.figure.label}</a>
      <div className="lp-path">
        <LessonPath n={n} model={stations} sections={sections} density="plan" prev={prev} next={next} activeStep={activeStep} activeSection={activeSection} />
      </div>
    </section>
  )
}
