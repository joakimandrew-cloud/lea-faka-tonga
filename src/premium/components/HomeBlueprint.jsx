import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// The homepage's "Every lesson adds a piece." piece. Since 2026-11-13 it is the frame film (src/premium/lib/blueprint/sentence-frame.js,
// data in src/data/sentence-frame-data.js) with the course map under it (src/premium/lib/blueprint/course-map.js). Both are loaded with
// a dynamic import only when this section is within one screen of the viewport, mounted once, and destroyed on cleanup. React StrictMode
// runs effects twice in development (mount, cleanup, mount): each run owns its own `cancelled` flag, so modules that arrive after their
// run was cleaned up never mount, and only the live run does.
// To put the sentence seed back: import '../lib/blueprint/sentence-seed.js' here and mount it on the outer element alone, as this file
// did at app commit fc75e93; the seed's files are kept beside the film's, unchanged.
const NEAR = '200px 0px'

// Only in a build made with `vite build --mode frametest` (the check harness's flagged copy, which is never deployed) may the address
// name a broken copy of the film, ?break=<name>. In the production build this is the empty string and the code behind it is dropped.
const brokenCopy = () => (import.meta.env.MODE === 'frametest' ? new URLSearchParams(location.search).get('break') || '' : '')

export default function HomeBlueprint() {
  const hostRef = useRef(null)
  const filmRef = useRef(null)
  const mapRef = useRef(null)
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  useEffect(() => { navigateRef.current = navigate }, [navigate])

  useEffect(() => {
    const host = hostRef.current, filmHost = filmRef.current, mapHost = mapRef.current
    if (!host || !filmHost || !mapHost) return undefined
    let cancelled = false
    let film = null
    let map = null
    let observer = null
    const broken = brokenCopy()

    const load = () => {
      Promise.all([import('../lib/blueprint/sentence-frame.js'), import('../lib/blueprint/course-map.js')]).then(([filmMod, mapMod]) => {
        if (cancelled) return
        // Start Lesson N stays a client-side route (a modified click keeps the browser's own behaviour, in the modules).
        const onNavigate = href => navigateRef.current(href)
        film = filmMod.mount(filmHost, broken ? { onNavigate, break: broken } : { onNavigate })
        map = mapMod.mount(mapHost, { onNavigate })
        // The live controllers are reachable from the host element: the checks (reviews/frame-film-homepage-2026-11-13/tools/) drive them.
        host.__frameFilm = film
        host.__courseMap = map
      }).catch(() => { /* the section keeps its heading and the Start Lesson 1 button if the chunks fail to load */ })
    }

    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); observer = null; load() }
      }, { rootMargin: NEAR })
      observer.observe(host)
    } else {
      load()
    }

    return () => {
      cancelled = true
      if (observer) observer.disconnect()
      if (film) film.destroy()
      if (map) map.destroy()
      if (host.__frameFilm === film) delete host.__frameFilm
      if (host.__courseMap === map) delete host.__courseMap
    }
  }, [])

  return (
    <div className="wr-home__blueprint" ref={hostRef}>
      <div className="wr-home__film" ref={filmRef} />
      <div className="wr-home__coursemap" ref={mapRef} />
    </div>
  )
}
