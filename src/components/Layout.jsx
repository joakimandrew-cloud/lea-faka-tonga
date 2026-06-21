import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import chapters from '../data/chapters.json'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  const path = location.pathname

  const chapterMatch = path.match(/^\/chapters\/(\d+)/)
  const currentChapterNum = chapterMatch ? parseInt(chapterMatch[1], 10) : null
  const quizMatch = path.match(/^\/quizzes\/(\d+)/)
  const currentQuizNum = quizMatch ? parseInt(quizMatch[1], 10) : null

  const isChapterBrowser = path === '/chapters'
  const isFlipCards = path === '/cards'
  const isTerminalBuild = path === '/terminal-build'
  const isSentenceBuilder = path === '/sentence-builder'
  const isTenseSwap = path === '/tense-swap'
  const isFirstWord = path === '/first-word'
  const isPossessiveSort = path === '/possessive-sort'
  const isAdjectiveFlip = path === '/adjective-flip'
  const isSkeletonFiller = path === '/skeleton-filler'
  const isClusivity = path === '/clusivity'
  const isQuizIndex = path === '/quizzes'
  const isDrillsMenu = path === '/drills'
  const isSubPage = isTerminalBuild || isSentenceBuilder || isTenseSwap || isFirstWord || isPossessiveSort || isAdjectiveFlip || isSkeletonFiller || isClusivity || currentChapterNum || isChapterBrowser || isFlipCards || isQuizIndex || currentQuizNum || isDrillsMenu

  let breadcrumbLabel = ''
  let backTo = '/'
  if (isDrillsMenu) {
    breadcrumbLabel = 'Practice Drills'
  } else if (isTerminalBuild) {
    breadcrumbLabel = 'Build a Sentence'
  } else if (isSentenceBuilder) {
    breadcrumbLabel = 'Build a Sentence'
  } else if (isTenseSwap) {
    breadcrumbLabel = 'Tense Swapper'
  } else if (isFirstWord) {
    breadcrumbLabel = 'First-Word Quiz'
  } else if (isPossessiveSort) {
    breadcrumbLabel = 'Possessive Sorter'
  } else if (isAdjectiveFlip) {
    breadcrumbLabel = 'Adjective Flip'
  } else if (isSkeletonFiller) {
    breadcrumbLabel = 'Skeleton Filler'
  } else if (isClusivity) {
    breadcrumbLabel = 'Clusivity Corner'
  } else if (currentChapterNum) {
    const ch = chapters.find(c => c.chapter === currentChapterNum)
    breadcrumbLabel = ch ? `Lesson ${ch.chapter}: ${ch.title}` : ''
    backTo = '/chapters'
  } else if (isChapterBrowser) {
    breadcrumbLabel = 'Lessons'
  } else if (isFlipCards) {
    breadcrumbLabel = 'Flip Cards'
  } else if (currentQuizNum) {
    breadcrumbLabel = `Lesson ${currentQuizNum} Quiz`
    backTo = '/quizzes'
  } else if (isQuizIndex) {
    breadcrumbLabel = 'Quizzes'
  }

  // Pre-fill the report form's "Where is it?" with the page the reader is on,
  // so a correction arrives already located and nobody has to retype "Chapter 12".
  let reportWhere = ''
  if (currentChapterNum) {
    const ch = chapters.find(c => c.chapter === currentChapterNum)
    reportWhere = ch ? `Lesson ${ch.chapter}: ${ch.title}` : `Lesson ${currentChapterNum}`
  } else if (currentQuizNum) {
    reportWhere = `Lesson ${currentQuizNum} Quiz`
  } else if (breadcrumbLabel) {
    reportWhere = breadcrumbLabel
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* ── Fixed left sidebar: chapter index ── */}
      <nav className="fixed left-0 top-0 w-10 h-screen z-20 hidden md:flex flex-col items-center border-r border-[var(--border)]">
        <div className="chapter-sidebar overflow-y-auto flex-1 py-3 w-full">
          {chapters.map(ch => {
            const isActive = currentChapterNum === ch.chapter
            return (
              <div
                key={ch.chapter}
                onClick={() => navigate(`/chapters/${ch.chapter}`)}
                className={`text-center text-[15px] py-[2px] transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[var(--accent)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--accent)]'
                }`}
              >
                {String(ch.chapter).padStart(2, '0')}
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── Main area (offset by sidebar) ── */}
      <div className="md:ml-10">
        {/* ── Top header (two-row on mobile, single-row on desktop) ── */}
        <header className="site-header sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="site-header-brand">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <svg className="brand-seal" viewBox="0 0 100 100" fill="currentColor" role="img" aria-label="Lea Faka-Tonga">
                <polygon points="0,0 50,0 0,50" /><polygon points="100,0 50,0 100,50" />
                <polygon points="100,100 50,100 100,50" /><polygon points="0,100 50,100 0,50" />
                <polygon points="25,25 50,25 25,50" /><polygon points="75,25 50,25 75,50" />
                <polygon points="75,75 50,75 75,50" /><polygon points="25,75 50,75 25,50" />
                <polygon points="37.5,37.5 50,37.5 37.5,50" /><polygon points="62.5,37.5 50,37.5 62.5,50" />
                <polygon points="62.5,62.5 50,62.5 62.5,50" /><polygon points="37.5,62.5 50,62.5 37.5,50" />
              </svg>
              <span className="brand-text">LEA FAKA-TONGA</span>
            </button>
            <div className="theme-seg" role="group" aria-label="Theme">
              <span
                className={!dark ? 'on' : ''}
                onClick={() => setDark(false)}
              >
                Light
              </span>
              <span
                className={dark ? 'on' : ''}
                onClick={() => setDark(true)}
              >
                Dark
              </span>
            </div>
          </div>
          {isSubPage && (
            <div className="site-header-context">
              <button
                onClick={() => navigate(backTo)}
                className="back-link cursor-pointer"
              >
                &larr; Back
              </button>
              {/* On a chapter page the chapter is already obvious (big number in
                  the body + active in the sidebar), so "← Back" stands alone.
                  Other sub-pages keep a quiet serif label for orientation. */}
              {!currentChapterNum && (
                <>
                  <span className="context-sep" aria-hidden="true">/</span>
                  <span className="context-label">
                    {currentQuizNum ? `Lesson ${currentQuizNum} Quiz` : breadcrumbLabel}
                  </span>
                </>
              )}
            </div>
          )}
        </header>

        {/* ── Content ── */}
        <main className={isDrillsMenu || isQuizIndex ? '' : 'max-w-3xl mx-auto px-8 py-10'}>
          <Outlet />
        </main>

        {/* ── Footer: an end-of-lesson invitation to report a mistake, on every
            content page. The course is corrected in the open, so this stands as
            a friendly standing call (Option C from the A2 discoverability review). ── */}
        <footer className="max-w-3xl mx-auto px-8 pt-8 pb-12 mt-6 border-t border-[var(--border)] text-center">
          <div
            className="text-[var(--accent)] leading-none mb-2"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '30px' }}
            aria-hidden="true"
          >
            &#699;
          </div>
          <div
            className="text-[var(--text)] font-semibold mb-2"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '21px' }}
          >
            {currentChapterNum ? 'See a mistake in this lesson?' : 'See a mistake on this page?'}
          </div>
          <p
            className="text-[var(--text-muted)] mb-4 mx-auto"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '15px', lineHeight: 1.55, maxWidth: '34rem' }}
          >
            This course is corrected in the open. Every report makes it more accurate for the next family.
          </p>
          <button
            onClick={() => navigate('/report', { state: { where: reportWhere } })}
            className="text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '17px', fontWeight: 600, padding: '8px 18px', borderRadius: '2px' }}
          >
            Tell us what&rsquo;s off &rarr;
          </button>
        </footer>

      </div>
    </div>
  )
}
