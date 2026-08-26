/**
 * /grammar/possessives: the two Tongan possessive classes.
 *
 * Content lives in src/seo/pages/possessives.js so the build-time prerenderer
 * can emit the same words as static HTML for a crawler that runs no JS.
 */

import ArticlePage from '../components/ArticlePage'
import doc from '../seo/pages/possessives'

export default function Possessives() {
  return <ArticlePage doc={doc} />
}
