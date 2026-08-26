/**
 * /grammar/word-order: how a Tongan sentence is ordered.
 *
 * Content lives in src/seo/pages/word-order.js so the build-time prerenderer
 * can emit the same words as static HTML for a crawler that runs no JS.
 */

import ArticlePage from '../components/ArticlePage'
import doc from '../seo/pages/word-order'

export default function WordOrder() {
  return <ArticlePage doc={doc} />
}
