import { Link, useParams } from 'react-router-dom'
import { drillRegistry } from '@app/drills/registry.js'
import DrillFrame from '@app/drills/DrillFrame.jsx'
import { drillEyebrow, drillLesson } from '@app/drills/drill-eyebrow.js'
import { useTitle } from '../lib/title.js'
import TenseSwapper from '@app/pages/TenseSwapper.jsx'
import FirstWordQuiz from '@app/pages/FirstWordQuiz.jsx'
import SkeletonFiller from '@app/pages/SkeletonFiller.jsx'
import PossessiveSorter from '@app/pages/PossessiveSorter.jsx'
import ClusivityCorner from '@app/pages/ClusivityCorner.jsx'
import AdjectiveFlip from '@app/pages/AdjectiveFlip.jsx'
import FakaSorter from '@app/pages/FakaSorter.jsx'
import CleftBuilder from '@app/pages/CleftBuilder.jsx'
import AccentPlacementPicker from '@app/pages/AccentPlacementPicker.jsx'
import VerbalNounConverter from '@app/pages/VerbalNounConverter.jsx'
import '../styles/source-core.css'

// These source pages supply their own exact title, introduction and lesson aside.
const BESPOKE_PAGES = {
  'tense-swapper': TenseSwapper,
  'first-word-quiz': FirstWordQuiz,
  'skeleton-filler': SkeletonFiller,
  'possessive-sorter': PossessiveSorter,
  'clusivity-corner': ClusivityCorner,
  'adjective-flip': AdjectiveFlip,
  'faka-pattern-sorter': FakaSorter,
  'cleft-builder': CleftBuilder,
  'accent-placement-picker': AccentPlacementPicker,
  'verbal-noun-converter': VerbalNounConverter,
}

function keepControlKeysLocal(event) {
  const control = event.target.closest?.('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')
  const consumed = event.key === 'Enter' || event.key === ' ' || /^[1-9]$/.test(event.key)
  if (control && consumed) {
    event.stopPropagation()
  }
}

export default function SourceDrill({ bespokeId }) {
  const { id: routeId } = useParams()
  const id = bespokeId || routeId
  const entry = drillRegistry[id]
  useTitle(entry?.meta?.title || 'Drill not found')

  if (!entry) {
    return (
      <section className="source-missing band grain">
        <div className="wrap">
          <p className="eyebrow">Drill not found</p>
          <h1 className="display">That practice<br />isn’t here.</h1>
          <p>The drill address may have changed. The complete practice catalogue is one step back.</p>
          <Link className="btn btn-primary" to="/drills">All drills <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    )
  }

  const BespokePage = BESPOKE_PAGES[bespokeId]
  if (BespokePage) {
    return (
      <section className="source-drill-shell" data-drill-id={id}>
        <div className="premium-core" onKeyDownCapture={keepControlKeysLocal}>
          <BespokePage />
        </div>
      </section>
    )
  }

  const { Core, meta } = entry
  return (
    <section className="source-drill-shell" data-drill-id={id}>
      <div className="premium-core" onKeyDownCapture={keepControlKeysLocal}>
        <DrillFrame
          backTo="/drills"
          lessonNum={drillLesson(id)}
          eyebrow={drillEyebrow(id)}
          title={meta.title}
          blurb={meta.blurb}
        >
          <Core key={id} />
        </DrillFrame>
      </div>
    </section>
  )
}
