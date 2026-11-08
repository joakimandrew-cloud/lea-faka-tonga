// The figure clock. A figure holds only (scene, t); every pixel comes from a pure
// frame function of those two. This module decides when t moves:
//   - auto-play in a loop while at least half the figure is in view: one example
//     plays, its finished frame holds long enough to read, then the next example
//     (or, with one example, the same again) starts from the top;
//   - one moving thing per screen, a page-wide queue: the figure most in view has
//     the turn, and two figures both in view take one example each in turn;
//   - scrolled away mid-example, a figure rests on that example's finished frame
//     and picks up with the next example when it comes back;
//   - the first tap anywhere in the figure stops auto-play for good;
//   - with reduced motion the figure opens on its rest state and steps jump.
// It also hangs a seek handle on the element so the /scrub hub and the capture
// tools can render an exact frame.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

/** How long a finished example stays before the next one starts. */
export const LOOP_HOLD_MS = 3200
/** The next example's first frame shows this long before it moves, so the cut reads as a new start. */
export const LOOP_LEAD_MS = 600

const entries = new Map()
let runner = null

// Two figures both nearly whole in view count as level, so they share the turns.
const score = entry => Math.min(entry.ratio, 0.9)

function pump() {
  if (runner) return
  let best = null
  for (const entry of entries.values()) {
    if (!entry.wantsRun()) continue
    if (!best || score(entry) > score(best) || (score(entry) === score(best) && entry.lastRun < best.lastRun)) best = entry
  }
  if (best) {
    runner = best
    best.start()
  }
}

function release(entry) {
  if (runner === entry) {
    runner = null
    pump()
  }
}

export function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** ?still=1 keeps every figure from auto-playing, for the capture tools only: a production build
 *  folds __TEST_BUILD__ to false, so the flag does nothing there. */
export function stillPage() {
  return __TEST_BUILD__ && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('still')
}

/**
 * A place in the page-wide queue of moving figures. While `enabled`, the figure is
 * offered a turn whenever at least half of it is in view and no other figure is
 * moving. `play(turn)` runs one pass and calls `turn.done()` when it is over;
 * `turn.later(fn, ms)` is a timer the queue cancels if the turn is cut short.
 * `away()` runs when the figure is scrolled off mid-turn, `interrupt()` when a tap
 * stops it. Returns `stop`, which ends auto-play for good.
 */
export function useAutoTurn({ id, rootRef, enabled, play, away, interrupt }) {
  // The latest handlers, so a turn always runs with this render's state.
  const handlers = useRef(null)
  useLayoutEffect(() => {
    handlers.current = { play, away, interrupt }
  })
  const stopRef = useRef(null)

  useEffect(() => {
    const node = rootRef.current
    if (!enabled || !node || typeof IntersectionObserver === 'undefined') return undefined
    const timers = new Set()
    const clear = () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
    const entry = { ratio: 0, lastRun: 0, stopped: false }
    entry.wantsRun = () => !entry.stopped && entry.ratio >= 0.5
    const end = () => {
      clear()
      delete node.dataset.running
      release(entry)
    }
    entry.start = () => {
      entry.lastRun = performance.now()
      node.dataset.running = 'true'
      handlers.current.play({
        later: (fn, ms) => {
          const timer = setTimeout(() => {
            timers.delete(timer)
            if (runner === entry) fn()
          }, ms)
          timers.add(timer)
        },
        done: () => {
          if (runner === entry) end()
        },
      })
    }
    entries.set(id, entry)
    const io = new IntersectionObserver(([e]) => {
      entry.ratio = e.isIntersecting ? e.intersectionRatio : 0
      if (runner === entry && entry.ratio < 0.1) {
        // Scrolled away mid-turn: rest now so it reads as a still on return.
        clear()
        handlers.current.away?.()
        end()
        return
      }
      pump()
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1] })
    io.observe(node)
    stopRef.current = () => {
      if (entry.stopped) return
      entry.stopped = true
      if (runner === entry) {
        clear()
        handlers.current.interrupt?.()
        end()
      }
    }
    return () => {
      io.disconnect()
      if (entries.get(id) === entry) entries.delete(id)
      stopRef.current = null
      if (runner === entry) end()
      clear()
    }
  }, [enabled, id, rootRef])

  return useCallback(() => stopRef.current?.(), [])
}

export function useFigureClock({ id, rootRef, timelines, external = null, autoplay = true, scenes = 1, onFrame }) {
  const reduced = useMemo(reducedMotion, [])
  const [scene, setScene] = useState(0)
  const [t, setT] = useState(() => (reduced ? timelines[0].duration : 0))
  const [running, setRunning] = useState(false)
  // How many times the loop has started a new example: a one-scene Grid fills a different cell each time.
  const [pass, setPass] = useState(0)
  // The student has played the figure themselves, so its end offers Play again.
  const [driven, setDriven] = useState(false)
  const raf = useRef(0)
  const clock = useRef({ t: reduced ? timelines[0].duration : 0, scene: 0 })

  const timeline = timelines[scene]
  const duration = timeline.duration

  const cancel = useCallback(() => {
    cancelAnimationFrame(raf.current)
    raf.current = 0
  }, [])

  const write = useCallback(value => {
    clock.current.t = value
    setT(value)
  }, [])

  const playTo = useCallback((target, done) => {
    cancel()
    const from = clock.current.t
    if (reduced) {
      write(target)
      setRunning(false)
      done?.()
      return
    }
    if (Math.abs(target - from) < 1) {
      write(target)
      done?.()
      return
    }
    setRunning(true)
    let last = performance.now()
    const dir = target > from ? 1 : -1
    const step = now => {
      const dt = Math.min(64, now - last)
      last = now
      const next = clock.current.t + dt * dir
      if ((dir > 0 && next >= target) || (dir < 0 && next <= target)) {
        write(target)
        raf.current = 0
        setRunning(false)
        done?.()
        return
      }
      write(next)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [cancel, reduced, write])

  const goToScene = useCallback(index => {
    if (index === clock.current.scene) return
    clock.current.scene = index
    setScene(index)
  }, [])

  // The loop: one example per turn in the page-wide queue.
  const stopTurn = useAutoTurn({
    id,
    rootRef,
    enabled: external === null && autoplay && !reduced && !stillPage(),
    play: turn => {
      const begin = () => playTo(timelines[clock.current.scene].duration, () => turn.later(turn.done, LOOP_HOLD_MS))
      if (clock.current.t < timelines[clock.current.scene].duration - 1) {
        begin()
        return
      }
      // The last example's finished frame is showing: the next example, from its first frame.
      goToScene((clock.current.scene + 1) % scenes)
      setPass(n => n + 1)
      write(0)
      turn.later(begin, LOOP_LEAD_MS)
    },
    away: () => {
      cancel()
      setRunning(false)
      write(timelines[clock.current.scene].duration)
    },
    interrupt: () => {
      cancel()
      setRunning(false)
      const rest = timelines[clock.current.scene].rests.find(ms => ms > clock.current.t + 1)
      if (rest !== undefined) playTo(rest)
    },
  })

  // A held clock: Structure C drives t from the scroll position.
  useEffect(() => {
    if (external === null) return
    clock.current.t = external
  }, [external])

  /** The first tap anywhere in the figure: auto-play stops for good, at the next resting frame. */
  const stopAuto = stopTurn

  /** Next change: run to the next rest; at the end, back to the start. */
  const next = useCallback(() => {
    stopTurn()
    // An end the loop reached is stepped through from the top; one the student reached plays again whole.
    const again = driven || reduced
    setDriven(true)
    const tl = timelines[clock.current.scene]
    const now = clock.current.t
    if (now >= tl.duration - 1) {
      cancel()
      write(0)
      if (!reduced) playTo(again ? tl.duration : (tl.rests[0] ?? tl.duration))
      return
    }
    const rest = tl.rests.find(ms => ms > now + 1) ?? tl.duration
    playTo(rest)
  }, [cancel, driven, playTo, reduced, stopTurn, timelines, write])

  /** Another example: the next scene, played once as the answer to the tap. */
  const another = useCallback(() => {
    stopTurn()
    setDriven(true)
    cancel()
    const nextScene = (clock.current.scene + 1) % scenes
    goToScene(nextScene)
    const tl = timelines[nextScene]
    if (reduced) {
      write(tl.duration)
      return
    }
    write(0)
    playTo(tl.duration)
  }, [cancel, goToScene, playTo, reduced, scenes, stopTurn, timelines, write])

  /** Jump to a span of the timeline and play it: a lane tap in a Fork. */
  const playSpan = useCallback((from, to, sceneIndex) => {
    stopTurn()
    setDriven(true)
    cancel()
    if (Number.isInteger(sceneIndex)) goToScene(sceneIndex)
    if (reduced) {
      write(to)
      return
    }
    write(from)
    playTo(to)
  }, [cancel, goToScene, playTo, reduced, stopTurn, write])

  /** Exact frame, for /scrub and the capture tools. */
  const seek = useCallback((ms, sceneIndex) => {
    stopTurn()
    cancel()
    flushSync(() => {
      if (Number.isInteger(sceneIndex) && sceneIndex !== clock.current.scene) {
        clock.current.scene = sceneIndex
        setScene(sceneIndex)
      }
      setRunning(false)
      clock.current.t = ms
      setT(ms)
    })
    if (rootRef.current) delete rootRef.current.dataset.running
  }, [cancel, rootRef, stopTurn])

  const shown = external === null ? t : external

  useEffect(() => {
    onFrame?.(scene, shown, timeline)
  }, [onFrame, scene, shown, timeline])

  useEffect(() => {
    const node = rootRef.current
    if (!node) return undefined
    const api = {
      id,
      seek,
      get scene() { return clock.current.scene },
      get t() { return clock.current.t },
      scenes,
      duration: sceneIndex => timelines[sceneIndex ?? clock.current.scene].duration,
      beats: sceneIndex => timelines[sceneIndex ?? clock.current.scene].beats,
      rests: sceneIndex => timelines[sceneIndex ?? clock.current.scene].rests,
    }
    node.__figure = api
    window.__lessonFigures = window.__lessonFigures || {}
    window.__lessonFigures[id] = api
    return () => {
      if (window.__lessonFigures?.[id] === api) delete window.__lessonFigures[id]
    }
  }, [id, rootRef, scenes, seek, timelines])

  useEffect(() => () => cancel(), [cancel])

  const atRest = shown >= duration - 0.5
  // Play again only where the student brought the figure to its end, or reduced motion opened it there.
  const playAgain = atRest && (driven || reduced)
  return { scene, t: shown, running, atRest, playAgain, pass, duration, timeline, next, another, playSpan, stopAuto, seek, reduced }
}
