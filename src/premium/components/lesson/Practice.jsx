import quickPractice from '@app/data/quick-practice.json'
import { drillRegistry } from '@app/drills/registry.js'
import DrillFrame from '@app/drills/DrillFrame.jsx'
import { ExerciseSet } from './Exercises.jsx'

function keepControlKeysLocal(event) {
  const isShortcut = event.key === 'Enter' || event.key === ' ' || /^[1-9]$/.test(event.key)
  if (isShortcut && event.target.closest?.('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')) {
    event.stopPropagation()
  }
}

export function QuickPractice({ chapterNum, index }) {
  const practice = quickPractice[String(chapterNum)]?.[index]
  if (!practice?.items?.length) return null
  return (
    <div className="lesson-practice qp">
      <ExerciseSet ex={practice} compact />
    </div>
  )
}

export function EmbeddedDrill({ chapterNum, drillId }) {
  const entry = drillRegistry[drillId]
  if (!entry) {
    return (
      <aside className="lesson-practice drill-missing">
        This lesson’s practice could not be loaded.
      </aside>
    )
  }
  const { Core, meta } = entry
  return (
    <section className="lesson-practice embedded-drill" aria-label={`Interactive practice: ${meta.title}`}>
      <header>
        <span>Interactive practice</span>
        <h3>{meta.title}</h3>
        {meta.blurb && <p>{meta.blurb}</p>}
      </header>
      <div className="premium-core lesson-core" onKeyDownCapture={keepControlKeysLocal}>
        <DrillFrame mode="compact">
          <Core chapterNum={chapterNum} embedded />
        </DrillFrame>
      </div>
    </section>
  )
}
