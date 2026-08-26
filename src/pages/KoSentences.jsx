/**
 * /grammar/ko-sentences: the Tongan ko pattern.
 *
 * Content lives in src/seo/pages/ko-sentences.js so the build-time prerenderer
 * can emit the same words as static HTML for a crawler that runs no JS.
 */

import ArticlePage from '../components/ArticlePage'
import doc from '../seo/pages/ko-sentences'

export default function KoSentences() {
  return <ArticlePage doc={doc} />
}
