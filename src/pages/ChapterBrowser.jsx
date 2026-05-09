import { Link, useNavigate } from 'react-router-dom'
import { useChapter } from '../contexts/ChapterContext'
import chapters from '../data/chapters.json'
import '../styles/v11-landing.css'

export default function ChapterBrowser() {
  const navigate = useNavigate()
  const { setChapter } = useChapter()

  function handleSelect(ch) {
    setChapter(ch.chapter)
    navigate(`/chapters/${ch.chapter}`)
  }

  return (
    <div className="v11-landing">

      <div className="toc-top">
        <Link to="/" className="brand">
          <svg className="logo-mark" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="0,0 50,0 0,50" />
            <polygon points="100,0 50,0 100,50" />
            <polygon points="100,100 50,100 100,50" />
            <polygon points="0,100 50,100 0,50" />
            <polygon points="25,25 50,25 25,50" />
            <polygon points="75,25 50,25 75,50" />
            <polygon points="75,75 50,75 75,50" />
            <polygon points="25,75 50,75 25,50" />
            <polygon points="37.5,37.5 50,37.5 37.5,50" />
            <polygon points="62.5,37.5 50,37.5 62.5,50" />
            <polygon points="62.5,62.5 50,62.5 62.5,50" />
            <polygon points="37.5,62.5 50,62.5 37.5,50" />
          </svg>
          <span className="wordmark">Lea Faka-Tonga</span>
        </Link>
        <Link to="/" className="home-link">← Home</Link>
      </div>

      <div className="toc-intro">
        <div className="toc-intro-left">
          <div className="toc-label">Contents · Ako ʻa e Lea</div>
          <div className="toc-title">{chapters.length} Chapters.<span className="tone">One Grammar.</span></div>
          <p className="toc-lede">Select a chapter to see what it teaches and practice its patterns.</p>
        </div>
        <div className="toc-intro-right">
          <div><strong>The Complete Course</strong></div>
          <div>Full Grammar Arc · Audio</div>
          <div className="cefr">
            <span className="level">A1–B2</span>
            <div className="scope">Beginner → Advanced</div>
          </div>
        </div>
      </div>

      <div className="toc-list-wrap">
        <ul className="toc-list">
          {chapters.map(ch => {
            const sub = ch.topics && ch.topics.length > 0 ? ch.topics[0] : ''
            return (
              <li key={ch.chapter}>
                <button
                  type="button"
                  className="toc-row"
                  onClick={() => handleSelect(ch)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', font: 'inherit', textAlign: 'left' }}
                >
                  <span className="toc-num">{String(ch.chapter).padStart(2, '0')}</span>
                  <span className="toc-title">{ch.title}</span>
                  {sub && <span className="toc-sub">{sub}</span>}
                  <span className="toc-leader" />
                  <span className="toc-open">Open →</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="toc-foot">
        <div><strong>Lea Faka-Tonga</strong> · Edition 2026</div>
        <div>Set in Barlow Condensed, Inter &amp; Source Serif</div>
        <div className="tonga-sig">Tuʻa ʻofa atu</div>
      </div>

    </div>
  )
}
