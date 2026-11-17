import { useEffect } from 'react'

// RouteChrome owns the production title and description using the same metadata
// as prerendering. Keep this presentation-layer hook compatible with the approved
// page components without overriding that metadata after a lazy page mounts.
export function useTitle() {}

// The one exception: a page whose title depends on data the first bundle does
// not carry (the dictionary's word pages). metaForPath() marks those paths
// pageOwned, RouteChrome leaves them alone, and the page sets the same title
// and description the prerenderer writes, from the same function
// (dictionaryPageMeta in src/seo/meta.js).
export function usePageMeta(meta) {
  const title = meta?.title
  const description = meta?.description
  useEffect(() => {
    if (!title) return
    document.title = title
    if (!description) return
    let tag = document.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', description)
  }, [title, description])
}
