// Route-level chrome that must live inside the Router: keeps document.title in
// sync with the route (the prerendered HTML sets it for the first paint; this
// covers SPA navigations) and reports SPA page-views to GoatCounter (the
// initial load is counted by count.js itself on load, so the first location
// is skipped here).
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { titleForPath } from '../seo/meta'

let chapterTitles = null

export default function RouteChrome() {
  const location = useLocation()
  const firstLoad = useRef(true)

  useEffect(() => {
    const setTitle = () => {
      document.title = titleForPath(location.pathname, chapterTitles || {})
    }
    if (!chapterTitles && /^\/(lessons|quizzes)\/\d+/.test(location.pathname)) {
      import('../data/chapters.json').then((mod) => {
        chapterTitles = {}
        for (const ch of Object.values(mod.default || mod)) {
          if (ch && ch.chapter != null) chapterTitles[ch.chapter] = ch.title
        }
        setTitle()
      })
    }
    setTitle()

    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    window.goatcounter?.count?.({ path: location.pathname })
  }, [location.pathname])

  return null
}
