// Route-level chrome that must live inside the Router. For now it reports SPA
// page-views to GoatCounter — the initial page load is counted by count.js
// itself (index.html snippet), so the first location is skipped here.
// Step 2 of the staged redo (plans/site-analysis-fixes.md) extends this with
// per-route document.title sync from src/seo/meta.js.
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteChrome() {
  const location = useLocation()
  const firstLoad = useRef(true)

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    window.goatcounter?.count?.({ path: location.pathname })
  }, [location.pathname])

  return null
}
