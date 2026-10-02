import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { okinafy } from '@app/lib/okinafy.js'
import T from './T.jsx'
import { HOME_SENTENCE_FAMILIES, PHASE_LABELS, sentenceForStep } from '../data/home-sentence-flip.js'
import '../styles/home-sentence-film.css'

const STANDARD_HOLD = 1500
const INTRO_HOLD = 1900
const EXPLANATION_HOLD = 2400
const FLIP_SETTLE = 500
const WAVE_SETTLE = 630
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function partMap(step) {
  return Object.fromEntries(step.parts.map(part => [part.id, part]))
}

function holdFor(step, index) {
  if (step.note || step.change.kind === 'linked') return EXPLANATION_HOLD
  return index === 0 ? INTRO_HOLD : STANDARD_HOLD
}

function changedParts(previous, next) {
  const before = { ...partMap(previous), punctuation: { id: 'punctuation', label: 'MARK', text: previous.punctuation } }
  const after = { ...partMap(next), punctuation: { id: 'punctuation', label: 'MARK', text: next.punctuation } }
  return Object.keys(after).filter(id => !before[id] || before[id].text !== after[id].text || before[id].label !== after[id].label)
}

function subscribeReducedMotion(callback) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}

function reducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => false)
}

function SentenceTile({ part, transition, position, sizes }) {
  const flipping = transition?.ids.includes(part.id) ?? false
  const previous = transition?.previous[part.id]
  const isNew = flipping && !previous
  const style = transition?.familyWave ? { '--wr-flip-delay': `${position * 42}ms` } : undefined

  return (
    <span
      className={`wr-sentence-cycle__tile${isNew ? ' wr-sentence-cycle__tile--new' : ''}${transition?.familyWave ? ' wr-sentence-cycle__tile--wave' : ''}`}
      data-slot-id={part.id}
      data-flipping={flipping ? 'true' : 'false'}
      style={style}
    >
      <span className="wr-sentence-cycle__sizer" aria-hidden="true">
        {sizes.map(size => (
          <span className="wr-sentence-cycle__face" key={`${size.label}:${size.text}`}>
            <span className="wr-sentence-cycle__role">{size.label}</span>
            <T className="wr-sentence-cycle__word">{size.text}</T>
          </span>
        ))}
      </span>
      {flipping ? (
        <span className="wr-sentence-cycle__flip" aria-hidden="true">
          {previous && (
            <span className="wr-sentence-cycle__face wr-sentence-cycle__face--from" data-word-face>
              <span className="wr-sentence-cycle__role">{previous.label}</span>
              <T className="wr-sentence-cycle__word">{previous.text}</T>
            </span>
          )}
          <span className="wr-sentence-cycle__face wr-sentence-cycle__face--to" data-word-face>
            <span className="wr-sentence-cycle__role">{part.label}</span>
            <T className="wr-sentence-cycle__word">{part.text}</T>
          </span>
        </span>
      ) : (
        <span className="wr-sentence-cycle__face" data-word-face aria-hidden="true">
          <span className="wr-sentence-cycle__role">{part.label}</span>
          <T className="wr-sentence-cycle__word">{part.text}</T>
        </span>
      )}
    </span>
  )
}

export default function HomeSentenceDemo() {
  const [familyIndex, setFamilyIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [transition, setTransition] = useState(null)
  const [manualAnnouncement, setManualAnnouncement] = useState('')
  const [followsSequence, setFollowsSequence] = useState(true)
  const root = useRef(null)
  const settleTimer = useRef(null)
  const reduceMotion = usePrefersReducedMotion()
  const family = HOME_SENTENCE_FAMILIES[familyIndex]
  const step = family.steps[stepIndex]
  const sentence = sentenceForStep(step)
  const cue = followsSequence ? step.cue : 'New example'
  const note = followsSequence ? step.note : ''
  const active = playing && !reduceMotion && inView && pageVisible
  const playbackState = reduceMotion
    ? 'reduced-motion'
    : !playing
      ? 'paused'
      : !pageVisible
        ? 'hidden'
        : !inView
          ? 'offscreen'
          : 'playing'

  const phases = useMemo(() => [...new Set(family.steps.map(item => item.phase))], [family])
  const slotSizes = useMemo(() => {
    const sizes = { punctuation: [{ id: 'punctuation', label: 'MARK', text: '?' }] }
    for (const item of family.steps) {
      for (const part of item.parts) {
        sizes[part.id] ??= []
        if (!sizes[part.id].some(size => size.text === part.text && size.label === part.label)) sizes[part.id].push(part)
      }
    }
    return sizes
  }, [family])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .25),
      { threshold: [.25] },
    )
    if (root.current) observer.observe(root.current)
    const visibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  useEffect(() => () => window.clearTimeout(settleTimer.current), [])

  const goTo = useCallback((nextFamilyIndex, nextStepIndex, manual = false) => {
    const previousStep = HOME_SENTENCE_FAMILIES[familyIndex].steps[stepIndex]
    const nextFamily = HOME_SENTENCE_FAMILIES[nextFamilyIndex]
    const nextStep = nextFamily.steps[nextStepIndex]
    const familyWave = nextFamilyIndex !== familyIndex
    const nextParts = [...nextStep.parts, { id: 'punctuation', label: 'MARK', text: nextStep.punctuation }]
    const ids = familyWave ? nextParts.map(part => part.id) : changedParts(previousStep, nextStep)

    window.clearTimeout(settleTimer.current)
    if (reduceMotion) {
      setTransition(null)
    } else {
      setTransition({
        previous: {
          ...partMap(previousStep),
          punctuation: { id: 'punctuation', label: 'MARK', text: previousStep.punctuation },
        },
        ids,
        familyWave,
      })
      settleTimer.current = window.setTimeout(() => setTransition(null), familyWave ? WAVE_SETTLE : FLIP_SETTLE)
    }

    setFamilyIndex(nextFamilyIndex)
    setStepIndex(nextStepIndex)
    setFollowsSequence(
      (nextFamilyIndex === familyIndex && nextStepIndex === stepIndex + 1)
      || (familyWave && nextStepIndex === 0),
    )
    if (manual) {
      setPlaying(false)
      setManualAnnouncement(okinafy(`${sentenceForStep(nextStep)} ${nextStep.english}`))
    }
  }, [familyIndex, reduceMotion, stepIndex])

  const nextChange = useCallback((manual = false) => {
    if (stepIndex + 1 < family.steps.length) {
      goTo(familyIndex, stepIndex + 1, manual)
    } else {
      goTo((familyIndex + 1) % HOME_SENTENCE_FAMILIES.length, 0, manual)
    }
  }, [family.steps.length, familyIndex, goTo, stepIndex])

  useEffect(() => {
    if (!active) return undefined
    const timer = window.setTimeout(() => nextChange(false), holdFor(step, stepIndex))
    return () => window.clearTimeout(timer)
  }, [active, nextChange, step, stepIndex])

  const nextPattern = () => goTo((familyIndex + 1) % HOME_SENTENCE_FAMILIES.length, 0, true)

  const choosePhase = phase => {
    const matches = family.steps
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.phase === phase)
    const current = matches.findIndex(({ index }) => index === stepIndex)
    const target = current >= 0 ? matches[(current + 1) % matches.length] : matches[0]
    goTo(familyIndex, target.index, true)
  }

  const punctuation = { id: 'punctuation', label: 'MARK', text: step.punctuation }
  const tiles = [...step.parts, punctuation]

  return (
    <div
      ref={root}
      className={`wr-sentence-cycle wr-sentence-cycle--${family.theme}`}
      data-family={family.id}
      data-step-id={step.id}
      data-playback-state={playbackState}
    >
      <div className="wr-sentence-cycle__card" onFocusCapture={event => {
        if (!event.target.closest('[data-control="playback"]')) setPlaying(false)
      }}>
        <div className="wr-sentence-cycle__top">
          <div>
            <p className="wr-sentence-cycle__kicker">Sentence workshop</p>
            <p className="wr-sentence-cycle__family"><span aria-hidden="true" />{family.title}</p>
            <p className="wr-sentence-cycle__lesson">{family.lessonLabel}</p>
          </div>
          <div className="wr-sentence-cycle__controls" aria-label="Sentence animation controls">
            <button
              type="button"
              data-control="playback"
              className="wr-sentence-cycle__control wr-sentence-cycle__control--quiet"
              onClick={() => { if (!reduceMotion) setPlaying(current => !current) }}
              aria-pressed={!reduceMotion && playing}
              aria-disabled={reduceMotion}
            >
              {reduceMotion ? 'Motion off' : playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" data-control="next-change" className="wr-sentence-cycle__control" onClick={() => nextChange(true)}>
              Next change <span aria-hidden="true">→</span>
            </button>
            <button type="button" data-control="next-pattern" className="wr-sentence-cycle__control" onClick={nextPattern}>
              Next pattern <span aria-hidden="true">↻</span>
            </button>
          </div>
        </div>

        <div className="wr-sentence-cycle__stage">
          <div className="wr-sentence-cycle__cue" aria-hidden="true">
            <span>{cue}</span>
            <span>{String(familyIndex + 1).padStart(2, '0')} / {String(HOME_SENTENCE_FAMILIES.length).padStart(2, '0')}</span>
          </div>
          <div className="wr-sentence-cycle__words" aria-hidden="true">
            {tiles.map((part, index) => (
              <SentenceTile key={part.id} part={part} transition={transition} position={index} sizes={slotSizes[part.id]} />
            ))}
          </div>
          <T className="wr-sentence-cycle__sr" data-full-sentence>{sentence}</T>
          <p className="wr-sentence-cycle__english" data-english>{step.english}</p>
          <span className="wr-sentence-cycle__sr" aria-live="polite" aria-atomic="true">{manualAnnouncement}</span>
          <div className="wr-sentence-cycle__explanation" aria-hidden={!note}>
            {note ? <p>{okinafy(note)}</p> : <span />}
          </div>
        </div>

        <div className="wr-sentence-cycle__phases" role="group" aria-label={`Choose a stage in ${family.title}`}>
          {phases.map(phase => (
            <button
              key={phase}
              type="button"
              data-phase={phase}
              aria-pressed={step.phase === phase}
              onClick={() => choosePhase(phase)}
            >
              {PHASE_LABELS[phase] ?? phase}
            </button>
          ))}
        </div>
        <p className="wr-sentence-cycle__phase-help">Choose a stage to see its first example. Choose it again to move through that stage.</p>
        {active && <span key={step.id} className="wr-sentence-cycle__timer" style={{ '--wr-hold': `${holdFor(step, stepIndex)}ms` }} aria-hidden="true" />}
      </div>
    </div>
  )
}
