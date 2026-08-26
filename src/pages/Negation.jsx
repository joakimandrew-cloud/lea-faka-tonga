/**
 * /grammar/negation: saying "not" in Tongan.
 *
 * Content lives in src/seo/pages/negation.js so the build-time prerenderer
 * can emit the same words as static HTML for a crawler that runs no JS.
 */

import ArticlePage from '../components/ArticlePage'
import doc from '../seo/pages/negation'

export default function Negation() {
  return <ArticlePage doc={doc} />
}
