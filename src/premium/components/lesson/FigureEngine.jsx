/**
 * One generated figure per lesson (reviews/lesson-course-2026-10-24/Direction.md,
 * "The figure engine"). It draws the figure model from lib/lesson-plan.js:
 * every Tongan string comes from the lesson's chapters.json paradigm or key
 * rules; only the English control labels and captions are written here.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion, useInView, useReducedMotion } from 'motion/react'
import { okinafy } from '@app/lib/okinafy.js'
import { splitMixedTonganText } from '@app/lib/lesson-browser.js'
import T from '../T.jsx'
import { droppedWords, norm } from '../../lib/lesson-plan.js'
import { markPattern } from '../../lib/lesson-path-store.js'

const EASE = [.16, 1, .3, 1]
const TICK = 2600

/** A string that may mix English and Tongan, set as Lessons.jsx sets it. */
export function Mixed({ text }) {
  return splitMixedTonganText(okinafy(String(text ?? '')), 'mixed').map((seg, i) =>
    seg.tongan ? <T key={i}>{seg.text}</T> : <span key={i}>{seg.text}</span>)
}

/** A copy of Figures1.jsx's private Frame, plus the id and data attributes. */
export function FigureFrame({ id, k, title, caption, attrs, children, onClickCapture, onPointerDownCapture, onKeyDownCapture, onMouseEnter, onMouseLeave, frameRef }) {
  return (
    <Motion.figure
      ref={frameRef}
      id={id}
      className="fig fe"
      {...attrs}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: .8, ease: EASE }}
      onClickCapture={onClickCapture}
      onPointerDownCapture={onPointerDownCapture}
      onKeyDownCapture={onKeyDownCapture}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="fig-head">
        <span className="fig-k">{k}</span>
        <span className="fig-t"><Mixed text={title} /></span>
      </div>
      {children}
      {caption && <figcaption>{caption}</figcaption>}
    </Motion.figure>
  )
}

function Dash() {
  return <span className="fe-dash" role="img" aria-label="No form in this column">{'\u2013'}</span>
}

/** Each word its own span, keyed by its normalized form and occurrence, so shared words slide and changed words roll. */
function Words({ text, marks = [], className = '' }) {
  const items = useMemo(() => {
    const seen = new Map()
    return String(text).split(/\s+/).filter(Boolean).map((word, i) => {
      const base = norm(word).join('-') || word
      const count = (seen.get(base) || 0) + 1
      seen.set(base, count)
      return { word, key: `${base}#${count}`, mark: Boolean(marks[i]) }
    })
  }, [text, marks])
  return (
    <span className={`fe-words ${className}`} lang="to">
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map(item => (
          <Motion.span
            key={item.key}
            layout="position"
            className={`fe-w to ${item.mark ? 'fe-mark' : ''}`}
            initial={{ y: '70%', opacity: 0, filter: 'blur(6px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: '-70%', opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: .55, ease: EASE }}
          >
            {okinafy(item.word)}
          </Motion.span>
        ))}
      </AnimatePresence>
    </span>
  )
}

function Lines({ lines }) {
  if (!lines?.length) return null
  return (
    <div className="fe-lines">
      {lines.map((item, i) => (
        <p key={i} className="fe-line">
          {item.tag && <span className="fe-tag"><Mixed text={item.tag} /></span>}
          {item.dash ? <Dash /> : item.to ? (
            <span className="fe-line-to">
              {item.marks ? <MarkedLine text={item.to} marks={item.marks} /> : <T>{item.to}</T>}
              {item.gloss && <span className="fe-line-g">{` ${item.gloss}`}</span>}
            </span>
          ) : <span className="fe-line-en"><Mixed text={item.en} /></span>}
        </p>
      ))}
    </div>
  )
}

function MarkedLine({ text, marks }) {
  return String(text).split(/\s+/).filter(Boolean).map((word, i) => (
    <span key={i}>{i > 0 ? ' ' : ''}<T className={marks[i] ? 'fe-mark' : ''}>{word}</T></span>
  ))
}

function Bar({ running, id }) {
  if (!running) return null
  return <span key={id} className="fe-bar" style={{ animationDuration: `${TICK}ms` }} aria-hidden="true" />
}

/**
 * The shown state of a figure. While the figure is at least half in view and
 * reduced motion is off, it advances through `steps` once and rests on the
 * last; the first pointer or key press inside it stops that for good. `prev`
 * is the state shown before the current one, for the Dropped line.
 */
function useFigure(steps, ref) {
  const reduced = useReducedMotion()
  const inView = useInView(ref, { amount: 0.5 })
  const [state, setState] = useState({ at: 0, picked: null, prev: null, stopped: false })
  const [paused, setPaused] = useState(false)
  const shownOf = s => s.picked ?? steps[s.at] ?? steps[0]
  const running = Boolean(inView && !reduced && !state.stopped && !paused && state.at < steps.length - 1 && steps.length > 1)
  useEffect(() => {
    if (!running) return undefined
    const id = setTimeout(() => setState(s => (s.stopped || s.at >= steps.length - 1 ? s : { ...s, at: s.at + 1, prev: shownOf(s) })), TICK)
    return () => clearTimeout(id)
  })
  const stop = () => setState(s => (s.stopped ? s : { ...s, stopped: true }))
  return {
    shown: shownOf(state),
    prev: state.prev,
    running,
    tick: state.at,
    choose: next => setState(s => ({ ...s, picked: next, prev: shownOf(s), stopped: true })),
    handlers: {
      onPointerDownCapture: stop,
      onKeyDownCapture: stop,
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
    },
  }
}

function usePatternMark(n) {
  const marked = useRef(false)
  return event => {
    if (marked.current || !event.target.closest?.('[data-figure-part]')) return
    marked.current = true
    markPattern(n)
  }
}

function ChipLabel({ chip }) {
  if (!chip.to) return <span className="fe-chip-en">{chip.en}</span>
  return chip.gloss ? <><T>{chip.to}</T><span className="fe-chip-gloss">{chip.gloss}</span></> : <T>{chip.to}</T>
}

function SwitchFigure({ model, n }) {
  const ref = useRef(null)
  const steps = useMemo(() => model.rows.flatMap(row => row.cells.flatMap((cell, f) => (cell.dash ? [] : [{ row: row.r, form: f }]))), [model])
  const fig = useFigure(steps, ref)
  const current = fig.shown || { row: 0, form: 0 }
  const prev = fig.prev
  const onPart = usePatternMark(n)
  const choose = fig.choose
  const auto = { running: fig.running, at: fig.tick, handlers: fig.handlers }

  const row = model.rows[current.row]
  const cell = row.cells[current.form]
  const gloss = cell.gloss || cell.glossEn
  const dropped = prev && prev.row === current.row && prev.form !== current.form ? droppedWords(row.cells[prev.form], cell) : []

  return (
    <FigureFrame
      id={model.id} k={`Figure ${n}.1`} title={model.title} caption={model.caption}
      attrs={{ 'data-figure': 'switch' }} frameRef={ref} onClickCapture={onPart} {...auto.handlers}
    >
      <div className="cb fe-body">
        <div className="cb-out fe-out">
          <div className="fe-stage">
            {cell.dash ? <Dash /> : <Words text={cell.to} marks={row.marks[current.form]} />}
          </div>
          <div className="fe-gloss" aria-live="polite">{gloss || '\u00a0'}</div>
          <p className={`fe-dropped ${dropped.length ? '' : 'is-empty'}`} aria-hidden={dropped.length ? undefined : 'true'}>
            <span className="fe-dropped-k">Dropped:</span> {dropped.map((word, i) => <T key={i} className="fe-struck">{word}</T>)}
          </p>
          <Lines lines={row.lines} />
        </div>
        <div className="cb-controls">
          <div className="cb-row">
            <span className="cb-label" id={`${model.id}-form`}>Form</span>
            <div className={`cb-toggle fe-forms is-${model.forms.length}`} role="radiogroup" aria-label="Form">
              {model.forms.map(form => (
                <button
                  key={form.i} type="button" role="radio" aria-checked={current.form === form.i}
                  className={current.form === form.i ? 'is-on' : ''} data-figure-part={`form-${form.i}`}
                  onClick={() => choose({ row: current.row, form: form.i })}
                >
                  <Mixed text={form.label} />
                  {current.form === form.i && <Bar running={auto.running} id={`${current.row}-${current.form}-${auto.at}`} />}
                </button>
              ))}
            </div>
          </div>
          <div className="cb-row">
            <span className="cb-label">Show</span>
            <div className="cb-chips fe-chips" role="group" aria-label="Show">
              {model.rows.map(item => (
                <button
                  key={item.r} type="button" aria-pressed={current.row === item.r}
                  className={`cb-chip ${current.row === item.r ? 'is-on' : ''}`} data-figure-part={`row-${item.r}`}
                  onClick={() => choose({ row: item.r, form: item.cells[current.form]?.dash ? item.cells.findIndex(c => !c.dash) : current.form })}
                >
                  <ChipLabel chip={item.chip} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FigureFrame>
  )
}

function LadderFigure({ model, n }) {
  const ref = useRef(null)
  const steps = useMemo(() => model.rows.map(row => row.r), [model])
  const fig = useFigure(steps, ref)
  const auto = { running: fig.running, at: fig.tick, handlers: fig.handlers }
  const r = fig.shown ?? 0
  const setPicked = fig.choose
  const onPart = usePatternMark(n)
  const row = model.rows[r]
  const gloss = row.cell.gloss || row.cell.glossEn

  return (
    <FigureFrame
      id={model.id} k={`Figure ${n}.1`} title={model.title} caption={model.caption}
      attrs={{ 'data-figure': 'ladder' }} frameRef={ref} onClickCapture={onPart} {...auto.handlers}
    >
      <div className="cb fe-body">
        <div className="cb-out fe-out">
          <div className="fe-stage is-ladder"><Words key={r} text={row.cell.to} /></div>
          <div className="fe-gloss" aria-live="polite">{gloss || '\u00a0'}</div>
          <Lines lines={row.lines} />
        </div>
        <div className="cb-controls">
          <div className="cb-row">
            <span className="cb-label">Show</span>
            <div className="cb-chips fe-chips" role="group" aria-label="Show">
              {model.rows.map(item => (
                <button
                  key={item.r} type="button" aria-pressed={r === item.r}
                  className={`cb-chip ${r === item.r ? 'is-on' : ''}`} data-figure-part={`row-${item.r}`}
                  onClick={() => setPicked(item.r)}
                >
                  <ChipLabel chip={item.chip} />
                  {r === item.r && <Bar running={auto.running} id={`${item.r}-${auto.at}`} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FigureFrame>
  )
}

function RulesFigure({ model, n }) {
  const ref = useRef(null)
  const steps = useMemo(() => model.rules.map(rule => rule.i), [model])
  const fig = useFigure(steps, ref)
  const auto = { running: fig.running, at: fig.tick, handlers: fig.handlers }
  const i = fig.shown ?? 0
  const setPicked = fig.choose
  const onPart = usePatternMark(n)
  const rule = model.rules[i]

  return (
    <FigureFrame
      id={model.id} k={`Figure ${n}.1`} title={model.title} caption={model.caption}
      attrs={{ 'data-figure-fallback': 'rules' }} frameRef={ref} onClickCapture={onPart} {...auto.handlers}
    >
      <div className="cb fe-body">
        <div className="cb-out fe-out">
          <div className="fe-stage">{rule.to ? <Words key={i} text={rule.to} /> : <Dash />}</div>
          <div className="fe-gloss" aria-live="polite">{rule.en || '\u00a0'}</div>
          <div className="fe-lines">
            <p className="fe-line"><span className="fe-tag">Rule</span><span className="fe-line-en"><Mixed text={rule.rule} /></span></p>
          </div>
        </div>
        <div className="cb-controls">
          <div className="cb-row">
            <span className="cb-label">Show</span>
            <div className="cb-chips fe-chips" role="group" aria-label="Show">
              {model.rules.map(item => (
                <button
                  key={item.i} type="button" aria-pressed={i === item.i}
                  className={`cb-chip fe-chip-n ${i === item.i ? 'is-on' : ''}`} data-figure-part={`rule-${item.i}`}
                  onClick={() => setPicked(item.i)}
                >
                  <span className="fe-chip-en">{item.i + 1}</span>
                  {i === item.i && <Bar running={auto.running} id={`${item.i}-${auto.at}`} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FigureFrame>
  )
}

export function LessonFigure({ model, n }) {
  if (!model || model.variant === 'bespoke') return null
  if (model.variant === 'switch') return <SwitchFigure model={model} n={n} />
  if (model.variant === 'ladder') return <LadderFigure model={model} n={n} />
  return <RulesFigure model={model} n={n} />
}
