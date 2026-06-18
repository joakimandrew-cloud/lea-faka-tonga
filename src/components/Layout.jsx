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
    breadcrumbLabel = ch ? `Ch. ${ch.chapter}: ${ch.title}` : ''
    backTo = '/chapters'
  } else if (isChapterBrowser) {
    breadcrumbLabel = 'Chapters'
  } else if (isFlipCards) {
    breadcrumbLabel = 'Flip Cards'
  } else if (currentQuizNum) {
    breadcrumbLabel = `Ch. ${currentQuizNum} Quiz`
    backTo = '/quizzes'
  } else if (isQuizIndex) {
    breadcrumbLabel = 'Quizzes'
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
                className="back-link text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
              {currentChapterNum ? (
                <span className="ch-chip">Ch {currentChapterNum}</span>
              ) : currentQuizNum ? (
                <span className="ch-chip">Ch {currentQuizNum} Quiz</span>
              ) : (
                <>
                  <span className="text-[var(--border)]">/</span>
                  <span className="text-[var(--text-muted)] text-xs md:text-sm">{breadcrumbLabel}</span>
                </>
              )}
            </div>
          )}
        </header>

        {/* ── Content ── */}
        <main className={isDrillsMenu || isQuizIndex ? '' : 'max-w-3xl mx-auto px-8 py-10'}>
          <Outlet />
        </main>

        {/* ── Footer: a quiet report-a-mistake path on every content page ── */}
        <footer className="max-w-3xl mx-auto px-8 pt-6 pb-10 mt-6 border-t border-[var(--border)] text-center">
          <button
            onClick={() => navigate('/report')}
            className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors cursor-pointer"
          >
            Spot a mistake? Tell us &rarr;
          </button>
        </footer>

      </div>
    </div>
  )
}
