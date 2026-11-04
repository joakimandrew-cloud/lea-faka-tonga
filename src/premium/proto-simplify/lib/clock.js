// The figure clock. A figure holds only (scene, t); every pixel comes from a pure
// frame function of those two. This module decides when t moves:
//   - auto-play once, when at least half the figure is in view and no other figure
//     is moving (one moving thing per screen, a page-wide lock);
//   - the first tap anywhere in the figure stops auto-play for good;
//   - with reduced motion the figure opens on its rest state and steps jump.
// It also hangs a seek handle on the element so the /scrub hub and the capture
// tools can render an exact frame.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

const entries = new Map()
let runner = null

function pump() {
  if (runner) return
  let best = null
  for (const entry of entries.values()) {
    if (!entry.wantsRun()) continue
    if (!best || entry.ratio > best.ratio) best = entry
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

/** ?still=1 keeps every figure from auto-playing, for the capture tools only. */
function stillPage() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('still')
}

export function useFigureClock({ id, rootRef, timelines, external = null, autoplay = true, scenes = 1, onFrame }) {
  const reduced = useMemo(reducedMotion, [])
  const [scene, setScene] = useState(0)
  const [t, setT] = useState(() => (reduced ? timelines[0].duration : 0))
  const [running, setRunning] = useState(false)
  const raf = useRef(0)
  const clock = useRef({ t: reduced ? timelines[0].duration : 0, scene: 0 })
  const flags = useRef({ stopped: false, ran: false })
  const entryRef = useRef(null)

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

  // Auto-play registration.
  useEffect(() => {
    if (external !== null || !autoplay || reduced || stillPage() || !rootRef.current) return undefined
    const node = rootRef.current
    const entry = {
      ratio: 0,
      wantsRun: () => !flags.current.stopped && !flags.current.ran && entry.ratio >= 0.5,
      start: () => {
        flags.current.ran = true
        node.dataset.running = 'true'
        playTo(timelines[clock.current.scene].duration, () => {
          delete node.dataset.running
          release(entry)
        })
      },
      halt: () => {
        delete node.dataset.running
        release(entry)
      },
    }
    entryRef.current = entry
    entries.set(id, entry)
    const io = new IntersectionObserver(([e]) => {
      entry.ratio = e.isIntersecting ? e.intersectionRatio : 0
      if (runner === entry && entry.ratio < 0.1) {
        // Scrolled away while running: rest now so it reads as a still on return.
        cancel()
        setRunning(false)
        write(timelines[clock.current.scene].duration)
        entry.halt()
        return
      }
      pump()
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] })
    io.observe(node)
    return () => {
      io.disconnect()
      entries.delete(id)
      if (runner === entry) entry.halt()
      cancel()
    }
  }, [autoplay, cancel, external, id, playTo, reduced, rootRef, timelines, write])

  // A held clock: Structure C drives t from the scroll position.
  useEffect(() => {
    if (external === null) return
    clock.current.t = external
  }, [external])

  const stopAuto = useCallback(() => {
    flags.current.stopped = true
    if (runner === entryRef.current && runner) {
      cancel()
      setRunning(false)
      entryRef.current.halt()
      const rests = timelines[clock.current.scene].rests
      const rest = rests.find(ms => ms > clock.current.t + 1)
      if (rest !== undefined) playTo(rest)
    }
  }, [cancel, playTo, timelines])

  /** Next change: run to the next rest; at the end, back to the start. */
  const next = useCallback(() => {
    flags.current.stopped = true
    flags.current.ran = true
    const tl = timelines[clock.current.scene]
    const now = clock.current.t
    if (now >= tl.duration - 1) {
      cancel()
      write(0)
      if (!reduced) playTo(tl.duration)
      return
    }
    const rest = tl.rests.find(ms => ms > now + 1) ?? tl.duration
    playTo(rest)
  }, [cancel, playTo, reduced, timelines, write])

  /** Another example: the next scene, played once as the answer to the tap. */
  const another = useCallback(() => {
    flags.current.stopped = true
    flags.current.ran = true
    cancel()
    const nextScene = (clock.current.scene + 1) % scenes
    clock.current.scene = nextScene
    setScene(nextScene)
    const tl = timelines[nextScene]
    if (reduced) {
      write(tl.duration)
      return
    }
    write(0)
    playTo(tl.duration)
  }, [cancel, playTo, reduced, scenes, timelines, write])

  /** Jump to a span of the timeline and play it: a lane tap in a Fork. */
  const playSpan = useCallback((from, to) => {
    flags.current.stopped = true
    flags.current.ran = true
    cancel()
    if (reduced) {
      write(to)
      return
    }
    write(from)
    playTo(to)
  }, [cancel, playTo, reduced, write])

  /** Exact frame, for /scrub and the capture tools. */
  const seek = useCallback((ms, sceneIndex) => {
    flags.current.stopped = true
    flags.current.ran = true
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
  }, [cancel, rootRef])

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
    window.__protoFigures = window.__protoFigures || {}
    window.__protoFigures[id] = api
    return () => {
      if (window.__protoFigures?.[id] === api) delete window.__protoFigures[id]
    }
  }, [id, rootRef, scenes, seek, timelines])

  const atRest = shown >= duration - 0.5
  return { scene, t: shown, running, atRest, duration, timeline, next, another, playSpan, stopAuto, seek, reduced }
}
