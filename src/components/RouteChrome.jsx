// Route-level chrome that must live inside the Router. Two jobs:
//
//   1. Analytics. SPA page-views go to GoatCounter. The initial page load is
//      counted by count.js itself (the index.html snippet), so the first
//      location is skipped here.
//   2. Head sync. The prerendered HTML carries the right <title> and meta
//      description for the URL the visitor landed on (scripts/prerender.mjs);
//      this keeps both correct across client-side navigations. Strings come
//      from src/seo/meta.js, the same module the prerenderer reads.
//
// Both lookup tables are modules the bundle already contains (Layout imports
// chapters.json, DrillsMenu imports drills-catalog), so this adds no payload
// beyond the meta strings themselves.
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import chapters from '../data/chapters.json'
import { GROUPS } from '../data/drills-catalog'
import { metaForPath } from '../seo/meta'

const chapterMeta = {}
for (const ch of chapters) {
  chapterMeta[ch.chapter] = { title: ch.title, summary: ch.teaching?.summary }
}

const drills = {}
for (const g of GROUPS) {
  for (const d of g.drills) drills[d.id] = { title: d.title, blurb: d.blurb }
  for (const d of g.inChapters || []) if (!drills[d.id]) drills[d.id] = { title: d.label }
}

function setDescription(text) {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', text)
}

export default function RouteChrome() {
  const location = useLocation()
  const firstLoad = useRef(true)

  useEffect(() => {
    const { title, description } = metaForPath(location.pathname, { chapters: chapterMeta, drills })
    document.title = title
    setDescription(description)

    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    window.goatcounter?.count?.({ path: location.pathname })
  }, [location.pathname])

  return null
}
