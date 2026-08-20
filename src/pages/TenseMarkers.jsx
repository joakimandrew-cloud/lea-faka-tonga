/**
 * /grammar/tense-markers: how Tongan marks tense.
 *
 * Covers the whole tense system across the course (lessons 1, 2, 9, 15 and 22)
 * rather than restating lesson 2, which publishes the same four markers at
 * /lessons/2 alongside the full pronoun paradigm.
 *
 * Content lives in src/seo/pages/tense-markers.js so the build-time
 * prerenderer can emit the same words as static HTML.
 */

import ArticlePage from '../components/ArticlePage'
import doc from '../seo/pages/tense-markers'

export default function TenseMarkers() {
  return <ArticlePage doc={doc} />
}
