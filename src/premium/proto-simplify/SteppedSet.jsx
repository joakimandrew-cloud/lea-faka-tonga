/**
 * Practice, one step at a time (Direction.md, "the reading stays a single scroll;
 * anything the student does is stepped"). Same data, same saved progress and same
 * reveal, self-check and multiple-choice behaviour as Exercises.jsx; every prompt
 * stays on the page, and only the current one carries its button. Interface text
 * that is not the book's sits in CSS content or on a button, so the page's reading
 * text stays identical to the live lesson.
 */
import { useEffect, useMemo, useState } from 'react'
import { Md } from '../components/lesson/Blocks.jsx'
import { McqPresentation, Prompt } from '../components/lesson/Exercises.jsx'
import { exerciseProgressFromSnapshot, initialExerciseSnapshot, writeExerciseSnapshot } from '../lib/exercise-progress.js'
import { activeSourceFeedbackFor } from '../lib/exercise-feedback.js'
import { MatchingItems } from './MatchingItems.jsx'

function RevealRow({ item, n, record, current, onChange, onSkip }) {
  const open = record?.open === true
  const self = record?.self ?? null
  const grade = value => onChange({ kind: 'reveal', open: true, self: value })
  return (
    <li className={`xi ${current ? 'is-current' : ''} ${self === true ? 'is-right' : self === false ? 'is-late' : ''} ${open ? 'is-open' : ''}`}>
      <span className="xi-n">{n}</span>
      <div className="xi-main">
        <p className="xi-prompt"><Prompt text={item.prompt} /></p>
        {!open && current && (
          <div className="xi-now">
            <button type="button" className="fx-b is-main xi-go" onClick={() => onChange({ kind: 'reveal', open: true, self: null })}>Say it, then show the answer</button>
            <button type="button" className="xi-skip" onClick={onSkip}>Skip this one</button>
          </div>
        )}
        {open && (
          <div className="reveal-a">
            <span className="reveal-ans"><Md text={item.answer} /></span>
            {self === null ? (
              <span className="self">
                <button type="button" onClick={() => grade(true)} className="self-b ok">I had it</button>
                <button type="button" onClick={() => grade(false)} className="self-b no">Not yet</button>
              </span>
            ) : (
              <span className="self-done">{self ? 'Nice.' : 'It will come. Try it again later.'}</span>
            )}
          </div>
        )}
      </div>
      <span className="xi-mark" aria-hidden="true">{self === true ? '✓' : ''}</span>
    </li>
  )
}

function isAnswered(item, record) {
  if (!record) return false
  if (record.kind === 'reveal') return record.self !== null && record.self !== undefined
  if (record.kind === 'mcq') return (record.tries || []).includes(item.correct)
  return false
}

/** The body of one set: its items, with one current. */
function SetItems({ ex, snapshot, setSnapshot, compact, onDone, onNext, hasNext }) {
  const [skipped, setSkipped] = useState(() => new Set())
  const [activeFeedbackId, setActiveFeedbackId] = useState(null)
  const isMcq = ex.type === 'mcq' && ex.items.every(it => it.options?.length)
  const isMatching = ex.type === 'matching'
  const update = (id, record) => setSnapshot(current => ({ ...current, items: { ...current.items, [id]: record } }))
  const currentId = ex.items.find(it => !isAnswered(it, snapshot.items[it.id]) && !skipped.has(it.id))?.id ?? null
  const finished = currentId === null

  useEffect(() => { if (finished) onDone?.() }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isMatching) {
    const matchedIds = ex.items.filter(item => snapshot.items[item.id]?.matched === true).map(item => item.id)
    return (
      <MatchingItems
        items={ex.items}
        matchedIds={matchedIds}
        onChange={ids => setSnapshot(current => ({ ...current, items: Object.fromEntries(ids.map(id => [id, { kind: 'matching', matched: true }])) }))}
      />
    )
  }
  return (
    <>
      <ol className="xs-items">
        {ex.items.map((it, i) => (isMcq ? (
          <McqRow
            key={it.id}
            ex={ex}
            item={it}
            n={i + 1}
            current={it.id === currentId}
            tries={snapshot.items[it.id]?.tries || []}
            activeItemId={activeFeedbackId}
            onInteract={setActiveFeedbackId}
            onTriesChange={tries => update(it.id, { kind: 'mcq', tries })}
            onSkip={() => setSkipped(s => new Set(s).add(it.id))}
          />
        ) : (
          <RevealRow
            key={it.id}
            item={it}
            n={i + 1}
            current={it.id === currentId}
            record={snapshot.items[it.id]}
            onChange={record => update(it.id, record)}
            onSkip={() => setSkipped(s => new Set(s).add(it.id))}
          />
        )))}
      </ol>
      {finished && hasNext && !compact && (
        <button type="button" className="fx-b is-main xs-next" onClick={onNext}>Next exercise</button>
      )}
    </>
  )
}

function McqRow({ ex, item, n, current, tries, activeItemId, onInteract, onTriesChange, onSkip }) {
  const solved = tries.includes(item.correct)
  const pick = option => {
    if (solved || tries.includes(option)) return
    onInteract(item.id)
    onTriesChange([...tries, option])
  }
  const feedback = activeSourceFeedbackFor(activeItemId, ex, item, tries)
  if (!current && !tries.length) {
    return (
      <li className="xi">
        <span className="xi-n">{n}</span>
        <div className="xi-main"><p className="xi-prompt"><Prompt text={item.prompt} /></p></div>
        <span className="xi-mark" aria-hidden="true" />
      </li>
    )
  }
  return (
    <>
      <McqPresentation item={item} n={n} tries={tries} onPick={pick} feedback={feedback} announce={activeItemId === item.id} />
      {current && !solved && <li className="xi-skip-row"><button type="button" className="xi-skip" onClick={onSkip}>Skip this one</button></li>}
    </>
  )
}

function useSetProgress(ex, compact, onProgress) {
  const [snapshot, setSnapshot] = useState(() => initialExerciseSnapshot(ex, compact))
  const progress = useMemo(() => exerciseProgressFromSnapshot(ex, snapshot), [ex, snapshot])
  useEffect(() => { if (!compact) writeExerciseSnapshot(ex, snapshot) }, [compact, ex, snapshot])
  useEffect(() => { onProgress?.(ex.id, progress.state, progress.total) }, [ex.id, progress.state, progress.total]) // eslint-disable-line react-hooks/exhaustive-deps
  return { snapshot, setSnapshot, progress }
}

/** One closed-or-open row in the Exercises section. */
function ExerciseRow({ ex, total, open, onToggle, onNext, hasNext, onProgress }) {
  const { snapshot, setSnapshot, progress } = useSetProgress(ex, false, onProgress)
  const answered = Object.keys(progress.state).length
  return (
    <details
      className="px-row"
      id={`ex-${ex.number}`}
      open={open}
      onToggle={event => { if (event.currentTarget.open !== open) onToggle(event.currentTarget.open) }}
    >
      <summary className="px-sum" onClick={event => { event.preventDefault(); onToggle(!open) }}>
        <span className="px-sum-main">
          <span className="xs-k" data-of={`of ${total}`}>{`Exercise ${ex.number}`}</span>
          <h3 className="xs-t"><Md text={ex.title} /></h3>
          {ex.instructions && <p className="xs-i"><Md text={ex.instructions} /></p>}
        </span>
        <span className="px-sum-c" data-count={`${answered} of ${ex.items.length} done`} aria-hidden="true" />
        <span className="px-chev" aria-hidden="true" />
      </summary>
      <div className="px-body">
        <SetItems ex={ex} snapshot={snapshot} setSnapshot={setSnapshot} onNext={onNext} hasNext={hasNext} />
      </div>
    </details>
  )
}

export function SteppedExercises({ exercises, onProgress, stored }) {
  // The set a link points at, or the first unfinished one.
  const [openId, setOpenId] = useState(() => {
    const m = window.location.hash.match(/^#ex-(\d+)$/)
    const linked = m && exercises.find(ex => String(ex.number) === m[1])
    const unfinished = exercises.find(ex => Object.keys(stored[ex.id]?.state || {}).length < ex.items.length)
    return (linked || unfinished || exercises[0])?.id ?? null
  })

  // A link to #ex-3 on this same page opens that set.
  useEffect(() => {
    const onHash = () => {
      const m = window.location.hash.match(/^#ex-(\d+)$/)
      const hit = m && exercises.find(ex => String(ex.number) === m[1])
      if (hit) setOpenId(hit.id)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [exercises])

  return (
    <div className="px-list">
      {exercises.map((ex, i) => {
        const nextEx = exercises[i + 1]
        return (
          <ExerciseRow
            key={ex.id}
            ex={ex}
            total={exercises.length}
            open={openId === ex.id}
            onToggle={isOpen => setOpenId(isOpen ? ex.id : null)}
            hasNext={Boolean(nextEx)}
            onNext={() => {
              setOpenId(nextEx.id)
              requestAnimationFrame(() => document.getElementById(`ex-${nextEx.number}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
            }}
            onProgress={onProgress}
          />
        )
      })}
    </div>
  )
}

/** Quick Practice in the reading: every prompt shows, one button at a time. */
export function SteppedQuick({ ex }) {
  const { snapshot, setSnapshot } = useSetProgress(ex, true)
  return (
    <div className="lesson-practice qp">
      <section className="xs is-quick px-quick" id={ex.slug}>
        <header className="xs-head">
          <div>
            <span className="xs-k">{`Quick Practice${ex.letter ? ` ${ex.letter}` : ''}`}</span>
            <h3 className="xs-t"><Md text={ex.topic || ex.title} /></h3>
            {ex.instructions && <p className="xs-i"><Md text={ex.instructions} /></p>}
          </div>
        </header>
        <SetItems ex={ex} snapshot={snapshot} setSnapshot={setSnapshot} compact />
      </section>
    </div>
  )
}
