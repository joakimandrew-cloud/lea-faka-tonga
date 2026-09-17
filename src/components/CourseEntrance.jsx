import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import coverImage from '../assets/course-entrance-cover.png'
import {
  ENTRANCE_BOX,
  ENTRANCE_DURATION,
  ENTRANCE_POSTS,
  ENTRANCE_SOURCE,
  entranceCamera,
  entranceFrame,
  entranceGeometry,
  landingVisual,
  markEntranceSeen,
  polygonBounds,
  postLanding,
  postTravelProgress,
  readEntranceSeen,
  rectOnScreen,
  shouldShowEntrance,
  shrinkPolygon,
} from '../lib/course-entrance'
import '../styles/course-entrance.css'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
// Clicks this soon after the start belong to the same gesture (a double
// click), so they do not skip the animation.
const SKIP_GUARD_MS = 400
const POST_KEYS = ['site', 'book']
// The real homepage door cards each stone lands on.
const DOOR_SELECTORS = { book: '.ld-door-book', site: '.ld-door-site' }
const toPoints = points => points.map(point => point.join(',')).join(' ')

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

function rectOf(element) {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
}

function setBox(element, rect) {
  element.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
}

// Draws one moment of the entrance. Everything is measured before anything is
// written, so each frame costs at most one layout.
function paintEntrance(scene, elapsed) {
  if (!scene.root || !scene.camera) return
  const frame = entranceFrame(elapsed)
  const viewport = currentViewport()
  const camera = entranceCamera(entranceGeometry(viewport), frame.push)

  const targets = {}
  for (const key of POST_KEYS) {
    const doorEl = frame.travel > 0 ? document.querySelector(DOOR_SELECTORS[key]) : null
    const doorRect = rectOf(doorEl)
    // A door card the layout has pushed off screen (a landscape phone before
    // any scroll) is not a real landing target, so the post fades in place
    // instead of flying off the visible screen.
    const reachable = doorRect && rectOnScreen(doorRect, viewport)
    let visual = null
    if (reachable) {
      const explicit = rectOf(doorEl?.querySelector('[data-entrance-visual]'))
      const explicitTarget = landingVisual({ explicit, legacy: null, door: null, viewport })
      const legacy = explicitTarget
        ? null
        : rectOf(doorEl?.querySelector('.ld-door-visual'))
      visual = landingVisual({ explicit, legacy, door: doorRect, viewport })
    }
    targets[key] = {
      door: reachable ? doorRect : null,
      visual,
    }
  }

  scene.root.dataset.controls = frame.controls > 0.5 ? 'shown' : 'hidden'
  scene.start.style.opacity = frame.controls
  scene.stage.style.opacity = frame.stage
  scene.dusk.style.opacity = frame.dusk
  scene.camera.setAttribute('transform', `matrix(${camera.scale} 0 0 ${camera.scale} ${camera.x} ${camera.y})`)
  scene.surround.style.opacity = frame.surround
  scene.scenery.style.opacity = frame.scenery

  for (const key of POST_KEYS) {
    const nodes = scene.posts[key]
    if (!nodes.layer || !nodes.stone) continue
    const { door, visual } = targets[key]
    const travel = postTravelProgress(elapsed, key)
    const { layer, stone } = postLanding({ camera, post: ENTRANCE_POSTS[key], door, visual, travel })
    setBox(nodes.layer, layer)
    setBox(nodes.stone, stone)
    nodes.layer.style.opacity = frame.posts
    nodes.layer.style.setProperty('--ce-chrome', door ? frame.chrome : 0)
  }
}

export default function CourseEntrance({ children }) {
  const [phase, setPhase] = useState(initialPhase)
  const [viewport, setViewport] = useState(currentViewport)
  const entranceRef = useRef(null)
  const startRef = useRef(null)
  const stageRef = useRef(null)
  const duskRef = useRef(null)
  const cameraRef = useRef(null)
  const surroundRef = useRef(null)
  const sceneryRef = useRef(null)
  const bookLayerRef = useRef(null)
  const bookStoneRef = useRef(null)
  const siteLayerRef = useRef(null)
  const siteStoneRef = useRef(null)
  const startedAtRef = useRef(0)
  const finishTimerRef = useRef(null)
  const focusHomeRef = useRef(false)
  const active = phase !== 'complete'

  const geometry = useMemo(
    () => entranceGeometry(viewport),
    [viewport],
  )

  const sceneNodes = useCallback(() => ({
    root: entranceRef.current,
    start: startRef.current,
    stage: stageRef.current,
    dusk: duskRef.current,
    camera: cameraRef.current,
    surround: surroundRef.current,
    scenery: sceneryRef.current,
    posts: {
      book: { layer: bookLayerRef.current, stone: bookStoneRef.current },
      site: { layer: siteLayerRef.current, stone: siteStoneRef.current },
    },
  }), [])

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

    startedAtRef.current = performance.now()
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

  // A click anywhere on the moving stage skips to the homepage, except the
  // second half of the click that started it.
  function handleStageClick(event) {
    if (phase !== 'entering') return
    if (event.target.closest?.('.course-entrance-start') && event.detail === 0) {
      finishEntrance()
      return
    }
    if (performance.now() - startedAtRef.current >= SKIP_GUARD_MS) finishEntrance()
  }

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

  // The resting cover is frame 0 of the same drawing, so a replay or a resize
  // before the click always starts from a clean picture.
  useLayoutEffect(() => {
    if (phase !== 'intro') return
    paintEntrance(sceneNodes(), 0)
  }, [phase, sceneNodes, viewport])

  useEffect(() => {
    if (phase !== 'entering') return undefined
    const scene = sceneNodes()
    const startedAt = startedAtRef.current || performance.now()
    let frame = 0

    function tick() {
      const elapsed = performance.now() - startedAt
      paintEntrance(scene, elapsed)
      if (elapsed >= ENTRANCE_DURATION) {
        finishEntrance()
        return
      }
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [finishEntrance, phase, sceneNodes])

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

  const gatewayPoints = geometry.gateway.split(' ').map(point => point.split(',').map(Number))
  const gatewayCenter = gatewayPoints.reduce(
    (center, [x, y]) => ({ x: center.x + x / gatewayPoints.length, y: center.y + y / gatewayPoints.length }),
    { x: 0, y: 0 },
  )
  const rootStyle = {
    '--ce-gateway-x': `${gatewayCenter.x}px`,
    '--ce-gateway-y': `${gatewayCenter.y}px`,
    '--ce-gateway-width': `${Math.max(48, Math.max(...gatewayPoints.map(([x]) => x)) - Math.min(...gatewayPoints.map(([x]) => x)))}px`,
    '--ce-gateway-height': `${Math.max(48, Math.max(...gatewayPoints.map(([, y]) => y)) - Math.min(...gatewayPoints.map(([, y]) => y)))}px`,
  }
  const maskId = 'course-entrance-scenery-mask'
  const postRefs = {
    book: { layer: bookLayerRef, stone: bookStoneRef },
    site: { layer: siteLayerRef, stone: siteStoneRef },
  }

  return (
    <div className="course-entrance-shell">
      <div
        className="course-entrance-home"
        inert={active ? true : undefined}
        aria-hidden={active ? 'true' : undefined}
      >
        {children(replayEntrance, !active)}
      </div>

      <section
        className="course-entrance"
        data-phase={phase}
        data-layout={geometry.layout}
        data-controls="shown"
        ref={entranceRef}
        tabIndex="-1"
        style={rootStyle}
        role="dialog"
        aria-modal={active ? 'true' : undefined}
        aria-labelledby="course-entrance-title"
        aria-hidden={active ? undefined : 'true'}
        inert={active ? undefined : true}
        onClick={handleStageClick}
      >
        <svg
          className="course-entrance-visual"
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
              width={ENTRANCE_SOURCE.width}
              height={ENTRANCE_SOURCE.height}
            >
              <polygon points={toPoints(ENTRANCE_BOX)} fill="white" />
              {POST_KEYS.map(key => (
                <polygon key={key} points={toPoints(shrinkPolygon(ENTRANCE_POSTS[key], 0.985))} fill="black" />
              ))}
            </mask>
          </defs>
          <g className="course-entrance-stage" ref={stageRef}>
            <rect className="course-entrance-backdrop" width="100%" height="100%" />
            <rect className="course-entrance-dusk" width="100%" height="100%" ref={duskRef} />
          </g>
          <g ref={cameraRef}>
            <image
              className="course-entrance-art"
              ref={surroundRef}
              href={coverImage}
              width={ENTRANCE_SOURCE.width}
              height={ENTRANCE_SOURCE.height}
              preserveAspectRatio="none"
              onError={finishEntrance}
            />
            <image
              className="course-entrance-scenery"
              ref={sceneryRef}
              href={coverImage}
              width={ENTRANCE_SOURCE.width}
              height={ENTRANCE_SOURCE.height}
              preserveAspectRatio="none"
              mask={`url(#${maskId})`}
            />
          </g>
        </svg>

        {POST_KEYS.map(key => {
          const bounds = polygonBounds(ENTRANCE_POSTS[key])
          const clipId = `course-entrance-post-${key}`
          return (
            <div className="course-entrance-post" data-post={key} ref={postRefs[key].layer} key={key} aria-hidden="true">
              <div className="course-entrance-post-stone" ref={postRefs[key].stone}>
                <svg viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} preserveAspectRatio="xMidYMid meet" focusable="false">
                  <defs>
                    <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                      <polygon points={toPoints(ENTRANCE_POSTS[key])} />
                    </clipPath>
                  </defs>
                  <image
                    href={coverImage}
                    width={ENTRANCE_SOURCE.width}
                    height={ENTRANCE_SOURCE.height}
                    preserveAspectRatio="none"
                    clipPath={`url(#${clipId})`}
                  />
                </svg>
              </div>
            </div>
          )
        })}

        <h1 className="course-entrance-sr-only" id="course-entrance-title" lang="to">Lea Faka-Tonga</h1>
        <button
          className="course-entrance-start"
          type="button"
          ref={startRef}
          onClick={phase === 'intro' ? enterCourse : undefined}
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
