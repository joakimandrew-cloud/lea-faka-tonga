import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { practiceTabIndex } from '../lib/practice-film.js'

const PracticeFilm = lazy(() => import('./practice/PracticeFilm.jsx'))
const SURFACES = [
  { id: 'drills', name: 'Drills', description: 'Find the missing words.', to: '/drill/tense-swap', source: 'Tense-swap drill · Lesson 2' },
  { id: 'quizzes', name: 'Quizzes', description: 'An answer, with an explanation.', to: '/quizzes/6', source: 'Lesson 6 quiz · Question 3' },
  { id: 'cards', name: 'Flip cards', description: 'Turn it. Remember it. Keep going.', to: '/cards?lesson=1', source: 'Flip cards · Lesson 1 vocabulary' },
]

export default function HomePracticePreview() {
  const [active, setActive] = useState(0)
  const [autoCycle, setAutoCycle] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [run, setRun] = useState(0)
  const tabs = useRef([])
  const advance = useCallback(() => setActive(index => (index + 1) % SURFACES.length), [])
  const choose = index => {
    setActive(index)
    setAutoCycle(false)
    setPlaying(true)
    setRun(value => value + 1)
  }
  const hold = () => { setAutoCycle(false); setPlaying(false) }
  return (
    <div className="practice-showcase" onFocusCapture={event => {
      setAutoCycle(false)
      if (!event.target.closest('[data-practice-playback]')) setPlaying(false)
    }}>
      <div className="practice-tabs" role="tablist" aria-label="Preview a practice activity">
        {SURFACES.map((surface, i) => (
          <button key={surface.id} ref={el => { tabs.current[i] = el }} id={`practice-tab-${surface.id}`} type="button" role="tab" aria-selected={i === active} aria-controls="practice-film-panel" tabIndex={i === active ? 0 : -1} onClick={() => choose(i)} onKeyDown={event => {
            if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const next = practiceTabIndex(i, event.key)
            tabs.current[next]?.focus()
            choose(next)
          }}>
            <span className="practice-tabs__number" aria-hidden="true">0{i + 1}</span>{surface.name}
          </button>
        ))}
      </div>
      <div id="practice-film-panel" role="tabpanel" aria-labelledby={`practice-tab-${SURFACES[active].id}`} tabIndex={0}>
        <Suspense fallback={<div className="practice-loading" role="status">Loading the practice preview…</div>}>
          <PracticeFilm key={`${SURFACES[active].id}-${run}`} surface={SURFACES[active]} autoCycle={autoCycle} playing={playing} setPlaying={setPlaying} onComplete={advance} onHold={hold} onReplay={() => { setAutoCycle(true); setPlaying(true) }} />
        </Suspense>
      </div>
    </div>
  )
}
