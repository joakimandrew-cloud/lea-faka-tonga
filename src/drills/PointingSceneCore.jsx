import { useEffect, useReducer, useRef } from 'react'
import { okinafy } from '../lib/okinafy'
import {
  POINTING_CUES,
  POINTING_ITEMS,
  createPointingSceneState,
  reducePointingScene,
} from './pointing-scene'
import '../styles/pointing-scene.css'

const CONTINUE_READING = '#koeni-with-days-of-the-week'

function PeopleDiagram({ active }) {
  return (
    <div className="psc-people" aria-hidden="true">
      <div className={`psc-person${active === 'speaker' ? ' is-active' : ''}`}>
        <span className="psc-person-mark">S</span>
        <strong>Speaker</strong>
      </div>
      <span className="psc-between">conversation</span>
      <div className={`psc-person${active === 'listener' ? ' is-active' : ''}`}>
        <span className="psc-person-mark">L</span>
        <strong>Listener</strong>
      </div>
    </div>
  )
}

function CueDiagram({ cue, item }) {
  if (cue === 'mentioned') {
    return (
      <figure
        className="psc-diagram psc-recap"
        role="img"
        aria-label="Ia points back to something previously mentioned in the conversation."
      >
        <span className="psc-recap-before">Previously mentioned</span>
        <span className="psc-recap-arrow" aria-hidden="true">→</span>
        <span className="psc-recap-now font-tongan" lang="to">ia</span>
      </figure>
    )
  }

  if (cue === 'pointing') {
    return (
      <figure
        className="psc-diagram"
        role="img"
        aria-label={`${item.diagramLabel}. A pointing cue can indicate something near either the speaker or the listener.`}
      >
        <PeopleDiagram />
        <div className="psc-pointing-band">
          <span className="psc-pointing-arrow" aria-hidden="true">↗</span>
          <strong>{item.diagramLabel}</strong>
          <span>Could be near either person</span>
        </div>
      </figure>
    )
  }

  const activeLabel = cue === 'speaker' ? 'speaker' : 'listener'
  return (
    <figure
      className="psc-diagram"
      role="img"
      aria-label={`The reference cue is near the ${activeLabel}.`}
    >
      <PeopleDiagram active={cue} />
      <div className="psc-zone-label">Reference near the {activeLabel}</div>
    </figure>
  )
}

export default function PointingSceneCore({ embedded = false }) {
  const continueReading = embedded ? CONTINUE_READING : `/lessons/39/${CONTINUE_READING}`
  const [state, dispatch] = useReducer(reducePointingScene, undefined, createPointingSceneState)
  const cardRef = useRef(null)
  const focusAfterUpdate = useRef(false)
  const item = POINTING_ITEMS[state.index]
  const resolved = state.status === 'resolved'
  const answer = POINTING_CUES.find((cue) => cue.id === item.answer)

  useEffect(() => {
    if (!focusAfterUpdate.current) return
    focusAfterUpdate.current = false
    cardRef.current?.focus({ preventScroll: true })
    cardRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  })

  const choose = (cueId) => dispatch({ type: 'choose', cueId })

  // EmbeddedDrill deliberately stops shortcut keys at its capture boundary so
  // they cannot answer more than one open drill. Listen one level earlier, but
  // only while focus is inside this card, before that boundary sees the event.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || state.finished) return
      const card = cardRef.current
      if (!card) return
      const hasFocus = card.contains(document.activeElement)
      if (!hasFocus) return

      if (/^[1-4]$/.test(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        dispatch({ type: 'choose', cueId: POINTING_CUES[Number(event.key) - 1].id })
        return
      }

      if ((event.key === 'Enter' || event.key === ' ') && hasFocus) {
        const control = document.activeElement?.closest?.('button, a')
        if (control && card.contains(control)) {
          event.preventDefault()
          event.stopPropagation()
          control.click()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [state.finished])

  const dispatchAndFocus = (action) => {
    focusAfterUpdate.current = true
    dispatch(action)
  }

  if (state.finished) {
    return (
      <section
        ref={cardRef}
        tabIndex={-1}
        className="psc-card"
        data-pointing-practice
        aria-labelledby="psc-complete-title"
      >
        <div className="psc-complete">
          <p className="psc-kicker">5 / 5 examples</p>
          <h4 id="psc-complete-title">Pointing words complete</h4>
          <p>You followed each word to its reference cue.</p>
          <div className="psc-end-actions">
            <button type="button" className="psc-secondary" onClick={() => dispatchAndFocus({ type: 'reset' })}>
              Replay all five
            </button>
            <a className="psc-primary" href={continueReading}>Continue reading ↓</a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={cardRef}
      tabIndex={-1}
      className="psc-card"
      data-pointing-practice
      aria-labelledby="psc-prompt-title"
    >
      <div className="psc-topline">
        <div className="psc-progress" aria-label={`Example ${state.index + 1} of ${POINTING_ITEMS.length}`}>
          <span>{state.index + 1} / {POINTING_ITEMS.length}</span>
          <span className="psc-progress-track" aria-hidden="true">
            <span style={{ width: `${((state.index + (resolved ? 1 : 0)) / POINTING_ITEMS.length) * 100}%` }} />
          </span>
        </div>
        <button type="button" className="psc-reset" onClick={() => dispatchAndFocus({ type: 'reset' })}>reset</button>
      </div>

      <div className="psc-prompt">
        <p className="psc-kicker">Printed example</p>
        <h4 id="psc-prompt-title" className="psc-tongan font-tongan" lang="to">{okinafy(item.tongan)}</h4>
      </div>

      <fieldset className="psc-choices">
        <legend>Which reference cue does the pointing word supply?</legend>
        {POINTING_CUES.map((cue, index) => {
          const wrong = state.wrongChoices.includes(cue.id)
          const correct = resolved && cue.id === item.answer
          return (
            <button
              key={cue.id}
              type="button"
              className={`psc-choice${wrong ? ' is-wrong' : ''}${correct ? ' is-correct' : ''}`}
              onClick={() => choose(cue.id)}
              disabled={resolved || wrong}
              aria-pressed={state.selected === cue.id}
              aria-label={`${index + 1}. ${cue.label}`}
            >
              <span className="psc-choice-key" aria-hidden="true">{index + 1}</span>
              <span>{cue.label}</span>
            </button>
          )
        })}
      </fieldset>

      <div className="psc-live" role="status" aria-live="polite" aria-atomic="true">
        {state.status === 'retry' && <p><strong>Not quite.</strong> Try one more cue.</p>}
        {resolved && (
          <div className={`psc-resolution${state.resolution === 'correct' ? ' is-correct' : ' is-revealed'}`}>
            <p className="psc-verdict">
              <strong>{state.resolution === 'correct' ? 'That’s right.' : `The cue is ${answer.label.toLowerCase()}.`}</strong>
            </p>
            <p className="psc-meaning"><span>Meaning</span> {item.english}</p>
            <p className="psc-explanation">{item.why}</p>
            <CueDiagram cue={item.answer} item={item} />
          </div>
        )}
      </div>

      <div className="psc-actions">
        <a className="psc-continue" href={continueReading}>Continue reading</a>
        {resolved && (
          <button type="button" className="psc-primary" onClick={() => dispatchAndFocus({ type: 'next' })}>
            {state.index === POINTING_ITEMS.length - 1 ? 'Finish' : 'Next →'}
          </button>
        )}
      </div>
    </section>
  )
}
