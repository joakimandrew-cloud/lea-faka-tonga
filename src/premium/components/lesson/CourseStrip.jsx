/**
 * The course strip (reviews/lesson-course-2026-10-24/Direction.md): 52 ticks in
 * the six group runs of chapters.json, filled for each lesson this browser has
 * marked done. Read-only decoration with a text label. With `fill`, this
 * lesson's tick grows in after the finish check mark.
 */
import { motion as Motion } from 'motion/react'
import chapters from '@app/data/chapters.json'
import { useProgress } from '../../lib/progress.js'

const RUNS = chapters.reduce((runs, meta) => {
  const last = runs.at(-1)
  if (last && last.group === meta.group) last.lessons.push(meta.chapter)
  else runs.push({ group: meta.group, lessons: [meta.chapter] })
  return runs
}, [])

export default function CourseStrip({ n, fill = false }) {
  const { done } = useProgress()
  const count = done.size
  return (
    <div className={`cs ${fill ? 'is-fill' : ''}`} data-course-strip="">
      <div className="cs-ticks" role="img" aria-label={`Course progress: ${count} of 52 lessons done. This is Lesson ${n}.`}>
        {RUNS.map(run => (
          <span key={run.group} className="cs-run" style={{ '--run': run.lessons.length }}>
            {run.lessons.map(lesson => (
              <span key={lesson} className={`cs-tick ${lesson === n ? 'is-here' : ''}`}>
                {fill && lesson === n ? (
                  <Motion.i
                    className="cs-fill"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: .6, delay: .5, ease: [.16, 1, .3, 1] }}
                  />
                ) : done.has(lesson) ? <i className="cs-fill" /> : null}
              </span>
            ))}
          </span>
        ))}
      </div>
      <p className="cs-label">{`${count} of 52 done`}</p>
    </div>
  )
}
