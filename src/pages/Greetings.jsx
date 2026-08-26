/**
 * /greetings: Malo e lelei and the rest of the Tongan greeting exchange.
 *
 * Content lives in src/seo/pages/greetings.js so the build-time prerenderer
 * can emit the same words as static HTML for a crawler that runs no JS.
 */

import ArticlePage from '../components/ArticlePage'
import doc from '../seo/pages/greetings'

export default function Greetings() {
  return <ArticlePage doc={doc} />
}
