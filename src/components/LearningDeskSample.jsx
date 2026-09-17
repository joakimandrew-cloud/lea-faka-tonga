import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { renderPromptText } from './exercise-widgets'
import { learningDeskSample as sample } from '../lib/learning-desk-sample'

export default function LearningDeskSample() {
  const [selected, setSelected] = useState(null)
  const firstOption = useRef(null)
  const answered = selected !== null
  const correct = answered && selected === sample.item.correct

  function reset() {
    setSelected(null)
    firstOption.current?.focus({ preventScroll: true })
  }

  return (
    <section className="ld-sample" aria-labelledby="ld-sample-title">
      <div className="ld-sample-head">
        <div><p className="ld-eyebrow">Try Lesson 1</p><h2 id="ld-sample-title">The basic sentence</h2></div>
        <span className="ld-lesson-number" aria-hidden="true">01</span>
      </div>

      <div className="ld-sample-body">
        <p className="ld-teaching">{sample.introduction}</p>
        <dl className="ld-pronouns">
          {sample.pronouns.map(pronoun => (
            <div key={pronoun.word}><dt>{renderPromptText(pronoun.word)}</dt><dd>{pronoun.meaning}</dd></div>
          ))}
        </dl>

        <fieldset className="ld-exercise" aria-describedby="ld-exercise-instructions">
          <legend>Fill in the blank</legend>
          <p id="ld-exercise-instructions" className="ld-instruction">{renderPromptText(sample.instructions)}</p>
          <p className="ld-prompt">{renderPromptText(sample.item.prompt)}</p>
          <div className="ld-choices">
            {sample.item.options.map((option, index) => {
              const picked = option === selected
              return (
                <button
                  key={option}
                  ref={index === 0 ? firstOption : undefined}
                  type="button"
                  className={picked ? 'is-selected' : ''}
                  aria-pressed={picked}
                  aria-disabled={answered}
                  onClick={() => { if (!answered) setSelected(option) }}
                >
                  {renderPromptText(option)}
                  {picked && <span className="ld-choice-mark" aria-hidden="true">{correct ? '✓' : '×'}</span>}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className={`ld-feedback${answered ? (correct ? ' is-correct' : ' is-incorrect') : ''}`} role="status" aria-live="polite" aria-atomic="true">
          {answered ? (
            <div>
              <p className="ld-verdict">{correct ? 'Correct.' : 'Not quite.'} {renderPromptText(sample.item.answer)} = I.</p>
              <p className="ld-completed">{renderPromptText(sample.completed)} <span>{sample.translation}</span></p>
              <p className="ld-why">{sample.explanation}</p>
            </div>
          ) : <p className="ld-hint">Choose an answer to see the explanation.</p>}
        </div>

        {answered && <button className="ld-reset" type="button" onClick={reset}>{correct ? 'Reset the example' : 'Try again'}</button>}
      </div>

      <div className="ld-sample-foot">
        <span>From the course, ready to try.</span>
        <Link to="/lessons/1" state={{ fromStart: true }}>Read Lesson 1</Link>
      </div>
    </section>
  )
}
