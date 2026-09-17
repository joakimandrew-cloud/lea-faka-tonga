import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import coverImage from '../assets/course-entrance-cover.png'
import {
  ENTRANCE_DURATION,
  entranceGeometry,
  markEntranceSeen,
  readEntranceSeen,
  shouldShowEntrance,
} from '../lib/course-entrance'
import '../styles/course-entrance.css'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function initialPhase() {
  if (typeof window === 'undefined') return 'complete'
  const show = shouldShowEntrance({
    seen: readEntranceSeen(),
    hash: window.location.hash,
  })
  return show ? 'intro' : 'complete'
}

function currentViewport() {
  if (typeof window === 'undefined') return { width: 1280, height: 800 }
  return { width: window.innerWidth, height: window.innerHeight }
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export default function CourseEntrance({ children }) {
  const [phase, setPhase] = useState(initialPhase)
  const [viewport, setViewport] = useState(currentViewport)
  const entranceRef = useRef(null)
  const finishTimerRef = useRef(null)
  const focusHomeRef = useRef(false)
  const active = phase !== 'complete'

  const geometry = useMemo(
    () => entranceGeometry(viewport),
    [viewport],
  )

  const clearFinishTimer = useCallback(() => {
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current)
      finishTimerRef.current = null
    }
  }, [])

  const finishEntrance = useCallback(() => {
    if (phase === 'complete') return
    clearFinishTimer()
    markEntranceSeen()
    focusHomeRef.current = true
    setPhase('complete')
  }, [clearFinishTimer, phase])

  const enterCourse = useCallback(() => {
    if (phase !== 'intro') return
    if (prefersReducedMotion()) {
      finishEntrance()
      return
    }

    setPhase('entering')
    clearFinishTimer()
    finishTimerRef.current = window.setTimeout(
      finishEntrance,
      ENTRANCE_DURATION + 350,
    )
  }, [clearFinishTimer, finishEntrance, phase])

  const replayEntrance = useCallback(() => {
    if (phase !== 'complete') return

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    // Move focus before the next render makes the homepage inert.
    const entrance = document.querySelector('.course-entrance')
    entrance?.removeAttribute('inert')
    entrance?.removeAttribute('aria-hidden')
    entrance?.focus({ preventScroll: true })

    setViewport(currentViewport())
    setPhase('intro')
  }, [phase])

  useEffect(() => {
    function updateViewport() {
      setViewport(currentViewport())
    }

    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    if (!active) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [active])

  useEffect(() => {
    if (phase !== 'intro') return
    entranceRef.current?.focus({ preventScroll: true })
  }, [phase])

  useEffect(() => {
    if (phase !== 'complete' || !focusHomeRef.current) return undefined
    focusHomeRef.current = false
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    const frame = window.requestAnimationFrame(() => {
      document.querySelector('#learning-desk-main')?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [phase])

  useEffect(() => {
    if (!active) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') finishEntrance()
      if (event.key !== 'Tab') return

      const buttons = [...(entranceRef.current?.querySelectorAll('button') ?? [])]
      if (buttons.length === 0) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      const focusIsOnControl = buttons.includes(document.activeElement)

      if (event.shiftKey && (!focusIsOnControl || document.activeElement === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!focusIsOnControl || document.activeElement === last)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, finishEntrance])

  useEffect(() => {
    if (phase !== 'entering' || typeof window.matchMedia !== 'function') return undefined
    const motionPreference = window.matchMedia(REDUCED_MOTION_QUERY)

    function handleMotionChange(event) {
      if (event.matches) finishEntrance()
    }

    motionPreference.addEventListener?.('change', handleMotionChange)
    return () => motionPreference.removeEventListener?.('change', handleMotionChange)
  }, [finishEntrance, phase])

  useEffect(() => () => clearFinishTimer(), [clearFinishTimer])

  function handleTransitionEnd(event) {
    if (
      phase === 'entering'
      && event.propertyName === 'transform'
      && event.target.classList.contains('course-entrance-art')
    ) finishEntrance()
  }

  const gatewayPoints = geometry.gateway.split(' ').map(point => point.split(',').map(Number))
  const gatewayCenter = gatewayPoints.reduce(
    (center, [x, y]) => ({ x: center.x + x / gatewayPoints.length, y: center.y + y / gatewayPoints.length }),
    { x: 0, y: 0 },
  )
  const rootStyle = {
    '--ce-duration': `${ENTRANCE_DURATION}ms`,
    '--ce-scale': geometry.transform.scale,
    '--ce-translate-x': geometry.transform.translateX,
    '--ce-translate-y': geometry.transform.translateY,
    '--ce-gateway-x': `${gatewayCenter.x}px`,
    '--ce-gateway-y': `${gatewayCenter.y}px`,
    '--ce-gateway-width': `${Math.max(48, Math.max(...gatewayPoints.map(([x]) => x)) - Math.min(...gatewayPoints.map(([x]) => x)))}px`,
    '--ce-gateway-height': `${Math.max(48, Math.max(...gatewayPoints.map(([, y]) => y)) - Math.min(...gatewayPoints.map(([, y]) => y)))}px`,
  }
  const maskId = 'course-entrance-gateway-mask'

  return (
    <div className="course-entrance-shell">
      <div
        className="course-entrance-home"
        inert={active ? true : undefined}
        aria-hidden={active ? 'true' : undefined}
      >
        {children(replayEntrance)}
      </div>

      <section
        className="course-entrance"
        data-phase={phase}
        data-layout={geometry.layout}
        ref={entranceRef}
        tabIndex="-1"
        style={rootStyle}
        role="dialog"
        aria-modal={active ? 'true' : undefined}
        aria-labelledby="course-entrance-title"
        aria-hidden={active ? undefined : 'true'}
        inert={active ? undefined : true}
        onTransitionEnd={handleTransitionEnd}
      >
        <svg
          className="course-entrance-visual"
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
          preserveAspectRatio="none"
          role="img"
          aria-labelledby="course-entrance-art-title"
        >
          <title id="course-entrance-art-title">Lea Faka-Tonga course cover with a stone gateway</title>
          <defs>
            <mask
              id={maskId}
              className="course-entrance-mask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={viewport.width}
              height={viewport.height}
            >
              <rect width={viewport.width} height={viewport.height} fill="white" />
              <polygon className="course-entrance-gateway" points={geometry.gateway} fill="black" />
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <rect className="course-entrance-backdrop" width={viewport.width} height={viewport.height} />
            <image
              className="course-entrance-art"
              href={coverImage}
              x={geometry.image.x}
              y={geometry.image.y}
              width={geometry.image.width}
              height={geometry.image.height}
              preserveAspectRatio="none"
              onError={finishEntrance}
            />
          </g>
        </svg>

        <h1 className="course-entrance-sr-only" id="course-entrance-title" lang="to">Lea Faka-Tonga</h1>
        <button
          className="course-entrance-start"
          type="button"
          onClick={phase === 'entering' ? finishEntrance : enterCourse}
          aria-labelledby="course-entrance-invitation"
          aria-describedby="course-entrance-hint"
        >
          <span className="course-entrance-gateway-cue" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="course-entrance-invitation">
            <span id="course-entrance-invitation">Begin your journey</span>
            <span className="course-entrance-hint" aria-hidden="true">Click or tap the gateway</span>
          </span>
        </button>
        <p className="course-entrance-sr-only" id="course-entrance-hint">
          Open the course through the stone gateway. Press Escape to go straight to the homepage.
        </p>
      </section>
    </div>
  )
}
