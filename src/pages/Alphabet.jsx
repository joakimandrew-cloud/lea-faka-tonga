/**
 * /alphabet: the Tongan alphabet and pronunciation.
 *
 * The material is book/appendix-a-pronunciation.md, which the app has never
 * had a URL for (BookChapterContent only globs Chapter-*.md), so this is the
 * one page on the site whose content is not published anywhere else.
 *
 * Content lives in src/seo/pages/alphabet.js so the build-time prerenderer can
 * emit the same words as static HTML.
 */

import ArticlePage from '../components/ArticlePage'
import doc from '../seo/pages/alphabet'

export default function Alphabet() {
  return <ArticlePage doc={doc} />
}
