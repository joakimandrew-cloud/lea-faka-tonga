import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// The homepage's "Every lesson adds a piece." piece. The module (src/premium/lib/blueprint/sentence-bloom.js, with its data in
// src/data/sentence-bloom-data.js) is loaded with a dynamic import only when this section is within one screen of the viewport,
// mounted once, and destroyed on cleanup. React StrictMode runs effects twice in development (mount, cleanup, mount): each run
// owns its own `cancelled` flag, so a module that arrives after its run was cleaned up never mounts, and only the live run does.
const NEAR = '200px 0px'

export default function HomeBlueprint() {
  const hostRef = useRef(null)
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  useEffect(() => { navigateRef.current = navigate }, [navigate])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    let cancelled = false
    let controller = null
    let observer = null

    const load = () => {
      import('../lib/blueprint/sentence-bloom.js').then(mod => {
        if (cancelled) return
        controller = mod.mount(host, {
          // Start Lesson N stays a client-side route (a modified click keeps the browser's own behaviour, in the module).
          onNavigate: href => navigateRef.current(href),
        })
        // The live controller is reachable from the host element: the test-site check (reviews/sentence-bloom-web-2026-10-07/tools/check-test-site.mjs) drives it.
        host.__sentenceBloom = controller
      }).catch(() => { /* the section keeps its heading and the Start Lesson 1 button if the chunk fails to load */ })
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
      if (controller) controller.destroy()
      if (host.__sentenceBloom === controller) delete host.__sentenceBloom
    }
  }, [])

  return <div className="wr-home__blueprint" ref={hostRef} />
}
