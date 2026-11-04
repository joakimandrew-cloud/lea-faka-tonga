// The prototype's figures as /scrub scenes (src/lib/scrub-registry.jsx holds the
// contract). A figure is already a pure function of time, so its seek only hands the
// time to the figure's own clock. One scene per lesson, one variant per figure.
import { useEffect } from 'react'
import Figure from './Figure.jsx'
import { rowTimeline } from './row.js'
import { forkTimeline } from './fork.js'
import { gridTimeline } from './grid-timeline.js'
import { pathTimeline } from './path.js'
import { FIGURES_15 } from './lesson15.js'
import { FIGURES_2 } from './lesson2.js'
import { FIGURES_28 } from './lesson28.js'

const COLOURS = ['#b92e0e', '#121212', '#0f5c63', '#8c867f', '#d98a3a', '#3a7ca5']

function timelineOf(def) {
  const scene = def.scenes[0]
  if (def.kind === 'row') return rowTimeline(scene)
  if (def.kind === 'fork') return forkTimeline(scene)
  if (def.kind === 'path') return pathTimeline(scene)
  return gridTimeline(def)
}

function sceneFor(id, label, figures) {
  const Stage = ({ variantIndex }) => {
    const def = figures[variantIndex]
    useEffect(() => { document.documentElement.dataset.scrubFigure = def.id }, [def])
    return (
      <div className="pl" style={{ background: 'white', padding: 16, maxWidth: 760, margin: '0 auto' }}>
        <Figure key={def.id} def={def} autoplay={false} />
      </div>
    )
  }
  return {
    id,
    label,
    variants: figures.map(def => ({ id: def.id, label: `Figure ${def.id}. ${def.title.replace(/\*/g, '')}` })),
    defaults: () => ({ speed: { label: 'Speed', min: 0.5, max: 1.5, step: 0.05, unit: '×', value: 1 } }),
    duration: (vals, vi) => Math.round(timelineOf(figures[vi]).duration / vals.speed),
    parts: (vals, vi) => timelineOf(figures[vi]).beats.map((beat, i) => ({
      name: beat.kind + (beat.mark ? ` ${beat.mark}` : ''),
      color: COLOURS[i % COLOURS.length],
      end: Math.round(beat.end / vals.speed),
    })),
    readout: (vals, vi, env, t) => `figure ${((t * vals.speed) / 1000).toFixed(2)} s`,
    Stage,
    seek(root, t, { vals }) {
      root.querySelector('[data-figure]')?.__figure?.seek(t * vals.speed)
    },
  }
}

export const PROTO_FIGURE_SCENES = [
  sceneFor('lesson-15-figures', 'Lesson 15 figures (prototype)', FIGURES_15),
  sceneFor('lesson-2-figures', 'Lesson 2 figures (prototype)', FIGURES_2),
  sceneFor('lesson-28-figures', 'Lesson 28 figures (prototype)', FIGURES_28),
]
