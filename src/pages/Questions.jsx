/**
 * /questions: four questions people ask before they start learning Tongan.
 *
 * Content lives in src/seo/pages/questions.js so the build-time prerenderer
 * can emit the same words as static HTML for a crawler that runs no JS.
 */

import ArticlePage from '../components/ArticlePage'
import doc from '../seo/pages/questions'

export default function Questions() {
  return <ArticlePage doc={doc} />
}
