import { Link, useLocation } from 'react-router-dom'
import SourceAlphabet from '@app/pages/Alphabet.jsx'
import SourceGreetings from '@app/pages/Greetings.jsx'
import SourceTenseMarkers from '@app/pages/TenseMarkers.jsx'
import SourceWordOrder from '@app/pages/WordOrder.jsx'
import SourceNegation from '@app/pages/Negation.jsx'
import SourcePossessives from '@app/pages/Possessives.jsx'
import SourceKoSentences from '@app/pages/KoSentences.jsx'
import { TOPIC_PAGES } from '@app/lib/topic-pages.js'
import { useTitle } from '../lib/title.js'
import '../styles/reference.css'

const TOPIC_COMPONENTS = {
  '/alphabet': SourceAlphabet,
  '/greetings': SourceGreetings,
  '/grammar/tense-markers': SourceTenseMarkers,
  '/grammar/word-order': SourceWordOrder,
  '/grammar/negation': SourceNegation,
  '/grammar/possessives': SourcePossessives,
  '/grammar/ko-sentences': SourceKoSentences,
}

export default function TopicArticle() {
  const location = useLocation()
  const pathname = location.pathname.replace(/\/+$/, '') || '/'
  const Topic = TOPIC_COMPONENTS[pathname]
  const metadata = TOPIC_PAGES.find(topic => topic.to === pathname)
  useTitle(metadata?.label || 'Topic not found')

  if (!Topic || !metadata) {
    return (
      <div className="premium-reference premium-reference-missing band grain">
        <div className="wrap">
          <p className="eyebrow">Reference</p>
          <h1 className="display">Topic not found.</h1>
          <p>That topic page is not in this reference set.</p>
          <div className="premium-reference-actions">
            <Link className="btn btn-primary" to="/topics">Return to all topics</Link>
            <Link className="btn btn-ghost" to="/charts">Open the grammar charts</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-reference premium-reference-article">
      <div className="premium-reference-article-shell">
        <nav className="premium-reference-crumbs" aria-label="Breadcrumb">
          <Link to="/topics">Topics</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{metadata.label}</span>
        </nav>
        <div className="premium-core">
          <Topic />
        </div>
      </div>
    </div>
  )
}
