/**
 * The lesson's own exercises, from book-exercises.json. Tap-only (DECISIONS
 * 2026-06-16): multiple choice where the book supplies a closed option set,
 * tap-to-reveal everywhere else, with an honest self-check after the reveal.
 */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'motion/react'
import AnswerFeedback from '@app/components/AnswerFeedback.jsx'
import { Md } from './Blocks.jsx'
import { plainInline } from '../../lib/lesson-content.js'
import {
  exerciseProgressFromSnapshot,
  initialExerciseSnapshot,
  writeExerciseSnapshot,
} from '../../lib/exercise-progress.js'
import { activeSourceFeedbackFor, genericMcqHint } from '../../lib/exercise-feedback.js'
import '../../styles/exercise-feedback.css'

function shuffle(items) {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[other]] = [next[other], next[index]]
  }
  return next
}

function BlankSlot({ fill }) {
  return (
    <span className={`slot ${fill ? 'is-filled' : ''}`} data-blank="">
      <AnimatePresence mode="wait">
        {fill
          ? <Motion.span key="f" initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 26 }}><Md text={fill} /></Motion.span>
          : <Motion.span key="e" className="slot-e" exit={{ opacity: 0 }}>&nbsp;</Motion.span>}
      </AnimatePresence>
    </span>
  )
}

export function Prompt({ text, fill }) {
  // Mark each source blank before parsing inline Markdown, so emphasis and
  // Tongan glyph normalization remain intact around every interactive slot.
  const blank = /(?:\\?_){3,}/g
  const firstBlank = text.search(blank)
  if (firstBlank < 0) return <Md text={text} />
  const marked = text.replace(blank, (_, offset) => `\uE000${offset}\uE001`)
  return <Md text={marked} renderSlot={(offset, key) => <BlankSlot key={key} fill={offset === firstBlank ? fill : null} />} />
}

export function SourceFeedback({ feedback }) {
  if (!feedback) return null
  return (
    <Motion.div
      className="exercise-source-feedback"
      data-source-feedback=""
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="exercise-source-feedback-k">From this lesson</p>
      <p className="exercise-source-feedback-state">
        {feedback.kind === 'correct'
          ? <><span>Correct: </span><Md text={feedback.correct} /></>
          : feedback.message}
      </p>
      <dl className="exercise-source-feedback-map">
        {feedback.mapping.flatMap(row => [
          <dt key={`${row.tongan}-term`}><Md text={row.tongan} /></dt>,
          <dd key={`${row.tongan}-meaning`} lang="en">{row.english}</dd>,
        ])}
      </dl>
    </Motion.div>
  )
}

export function McqPresentation({ item, n, tries = [], onPick = () => {}, feedback = null, announce = false }) {
  const solved = tries.includes(item.correct)
  const showAnswer = solved && item.answer && plainInline(item.answer) !== plainInline(item.correct)
  const wrongDetail = feedback?.message || genericMcqHint(item)
  const verdictAnnouncement = solved
    ? (feedback?.correct ? `Correct: ${plainInline(feedback.correct)}.` : 'Correct.')
    : `Not quite. ${wrongDetail}`
  const sourceAnnouncement = feedback
    ? ` From this lesson. ${feedback.mapping.map(row => `${plainInline(row.tongan)}: ${row.english}.`).join(' ')}`
    : ''
  return (
    <li className={`xi ${solved ? (tries.length === 1 ? 'is-right' : 'is-late') : ''}`}>
      <span className="xi-n">{n}</span>
      <div className="xi-main">
        <p className="xi-prompt"><Prompt text={item.prompt} fill={solved ? item.correct : null} /></p>
        <div className="xi-opts">
          {item.options.map(o => {
            const wrong = tries.includes(o) && o !== item.correct
            const right = solved && o === item.correct
            return (
              <button key={o} className={`opt ${wrong ? 'is-wrong' : ''} ${right ? 'is-right' : ''}`} onClick={() => onPick(o)} disabled={solved && !right} aria-pressed={right || wrong}>
                <Md text={o} />
                <span className="opt-verdict" aria-hidden="true">{right ? '✓' : wrong ? '×' : ''}</span>
              </button>
            )
          })}
        </div>
        <AnswerFeedback
          outcome={tries.length ? (solved ? 'correct' : 'wrong') : null}
          announce={announce}
          announcement={`Question ${n}. Attempt ${tries.length}. ${verdictAnnouncement}${sourceAnnouncement}`}
        >
          {!solved && !feedback ? genericMcqHint(item) : null}
        </AnswerFeedback>
        <AnimatePresence>{feedback && <SourceFeedback feedback={feedback} />}</AnimatePresence>
        <AnimatePresence>
          {showAnswer && (
            <Motion.div className="xi-answer" data-mcq-answer="" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              <span className="xi-answer-k">Answer</span>
              <span className="xi-answer-text"><Md text={item.answer} /></span>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="xi-mark" aria-hidden="true">{solved ? '✓' : ''}</span>
    </li>
  )
}

function McqItem({ ex, item, n, tries, activeItemId, onInteract, onTriesChange }) {
  const solved = tries.includes(item.correct)
  const pick = (o) => {
    if (solved || tries.includes(o)) return
    const next = [...tries, o]
    onInteract(item.id)
    onTriesChange(next)
  }
  const feedback = activeSourceFeedbackFor(activeItemId, ex, item, tries)
  return <McqPresentation item={item} n={n} tries={tries} onPick={pick} feedback={feedback} announce={activeItemId === item.id} />
}

function RevealItem({ item, n, record, onChange }) {
  const open = record?.open === true
  const self = record?.self ?? null
  const grade = (value) => onChange({ kind: 'reveal', open: true, self: value })
  return (
    <li className={`xi ${self === true ? 'is-right' : self === false ? 'is-late' : ''}`}>
      <span className="xi-n">{n}</span>
      <div className="xi-main">
        <p className="xi-prompt"><Prompt text={item.prompt} /></p>
        <AnimatePresence mode="wait" initial={false}>
          {!open ? (
            <Motion.button key="b" className="reveal-b" onClick={() => onChange({ kind: 'reveal', open: true, self: null })} exit={{ opacity: 0, y: -4 }}>
              Say it, then show the answer
            </Motion.button>
          ) : (
            <Motion.div key="a" className="reveal-a" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: .5 }}>
              <span className="reveal-ans"><Md text={item.answer} /></span>
              {self === null ? (
                <span className="self">
                  <button onClick={() => grade(true)} className="self-b ok">I had it</button>
                  <button onClick={() => grade(false)} className="self-b no">Not yet</button>
                </span>
              ) : (
                <span className="self-done">{self ? 'Nice.' : 'It will come. Try it again later.'}</span>
              )}
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="xi-mark" aria-hidden="true">{self === true ? '✓' : ''}</span>
    </li>
  )
}

function MatchingItems({ items, matchedIds, onChange }) {
  const [rights, setRights] = useState(() => shuffle(items.map(item => ({ id: item.id, answer: item.answer }))))
  const [selected, setSelected] = useState(null)
  const [wrong, setWrong] = useState(null)
  const matched = useMemo(() => new Set(matchedIds), [matchedIds])

  const chooseLeft = (id) => {
    if (matched.has(id)) return
    setWrong(null)
    setSelected(value => value === id ? null : id)
  }
  const chooseRight = (id) => {
    if (!selected || matched.has(id)) return
    if (selected === id) {
      const next = new Set(matched).add(id)
      setSelected(null)
      setWrong(null)
      onChange([...next])
    } else {
      setWrong(id)
      setSelected(null)
    }
  }
  const reset = () => {
    setSelected(null)
    setWrong(null)
    setRights(shuffle(items.map(item => ({ id: item.id, answer: item.answer }))))
    onChange([])
  }

  return (
    <div className="match">
      <div className="match-head">
        <span role="status">{matched.size} of {items.length} matched</span>
        <button type="button" onClick={reset}>Reset</button>
      </div>
      <div className="match-grid">
        <div>
          {items.map(item => (
            <button
              type="button"
              key={item.id}
              disabled={matched.has(item.id)}
              aria-pressed={selected === item.id}
              className={`match-cell ${selected === item.id ? 'is-selected' : ''} ${matched.has(item.id) ? 'is-matched' : ''}`}
              onClick={() => chooseLeft(item.id)}
            >
              <Md text={item.prompt} />
            </button>
          ))}
        </div>
        <div>
          {rights.map(item => (
            <button
              type="button"
              key={item.id}
              disabled={matched.has(item.id)}
              className={`match-cell ${matched.has(item.id) ? 'is-matched' : ''} ${wrong === item.id ? 'is-wrong' : ''}`}
              onClick={() => chooseRight(item.id)}
              onAnimationEnd={() => { if (wrong === item.id) setWrong(null) }}
            >
              <Md text={item.answer} />
            </button>
          ))}
        </div>
      </div>
      {matched.size === items.length && <p className="match-done">All matched.</p>}
    </div>
  )
}

export function ExerciseSet({ ex, onProgress = () => {}, compact = false }) {
  const [snapshot, setSnapshot] = useState(() => initialExerciseSnapshot(ex, compact))
  const [activeFeedbackId, setActiveFeedbackId] = useState(null)
  const progress = useMemo(() => exerciseProgressFromSnapshot(ex, snapshot), [ex, snapshot])
  const { state, total } = progress

  useEffect(() => {
    if (!compact) writeExerciseSnapshot(ex, snapshot)
  }, [compact, ex, snapshot])
  useEffect(() => { onProgress(ex.id, state, total) }, [ex.id, state, total]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = (id, record) => setSnapshot(current => ({
    ...current,
    items: { ...current.items, [id]: record },
  }))
  const answered = Object.keys(state).length
  const isMcq = ex.type === 'mcq' && ex.items.every(it => it.options?.length)
  const isMatching = ex.type === 'matching'
  const matchedIds = isMatching ? ex.items.filter(item => snapshot.items[item.id]?.matched === true).map(item => item.id) : []
  const updateMatching = ids => setSnapshot(current => ({
    ...current,
    items: Object.fromEntries(ids.map(id => [id, { kind: 'matching', matched: true }])),
  }))

  return (
    <section className={`xs ${compact ? 'is-quick' : ''}`} id={compact ? ex.slug : `ex-${ex.number}`}>
      <header className="xs-head">
        <div>
          <span className="xs-k">{compact ? `Quick Practice${ex.letter ? ` ${ex.letter}` : ''}` : `Exercise ${ex.number}`}</span>
          <h3 className="xs-t"><Md text={compact ? (ex.topic || ex.title) : ex.title} /></h3>
          {ex.instructions && <p className="xs-i"><Md text={ex.instructions} /></p>}
        </div>
        <div className="xs-prog" aria-label={`${answered} of ${ex.items.length} done`}>
          {ex.items.map(it => <i key={it.id} className={it.id in state ? (state[it.id] ? 'ok' : 'late') : ''} />)}
        </div>
      </header>
      {isMatching ? (
        <MatchingItems items={ex.items} matchedIds={matchedIds} onChange={updateMatching} />
      ) : (
        <ol className="xs-items">
          {ex.items.map((it, i) => isMcq
            ? <McqItem
                key={it.id}
                ex={ex}
                item={it}
                n={i + 1}
                tries={snapshot.items[it.id]?.tries || []}
                activeItemId={activeFeedbackId}
                onInteract={setActiveFeedbackId}
                onTriesChange={tries => updateItem(it.id, { kind: 'mcq', tries })}
              />
            : <RevealItem
                key={it.id}
                item={it}
                n={i + 1}
                record={snapshot.items[it.id]}
                onChange={record => updateItem(it.id, record)}
              />)}
        </ol>
      )}
      {answered === ex.items.length && <p className="xs-complete" role="status">Practice complete.</p>}
    </section>
  )
}
