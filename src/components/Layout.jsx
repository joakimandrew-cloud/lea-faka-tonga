import { useState, useEffect } from 'react'
import LogoMark from './LogoMark'
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

  const chapterMatch = path.match(/^\/lessons\/(\d+)/)
  const currentChapterNum = chapterMatch ? parseInt(chapterMatch[1], 10) : null
  const quizMatch = path.match(/^\/quizzes\/(\d+)/)
  const currentQuizNum = quizMatch ? parseInt(quizMatch[1], 10) : null

  const isChapterBrowser = path === '/lessons'
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
    backTo = '/lessons'
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

  // Lesson pages get a wide reading column; prose stays at a comfortable
  // measure (see .lesson-reader CSS) while tables break out. Other sub-pages
  // keep the original comfortable width.
  const contentMaxW = currentChapterNum ? 'max-w-5xl' : 'max-w-3xl'

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* ── Main area (full width; the left lesson-number rail was removed 2026-06-22) ── */}
      <div>
        {/* ── Top header (two-row on mobile, single-row on desktop) ── */}
        <header className="site-header sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="site-header-brand">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <LogoMark className="brand-seal" />
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
              {/* Show the page label next to ← Back. On a lesson page this is the
                  "which lesson am I in" cue that the left number rail used to give
                  (rail removed 2026-06-22). */}
              <span className="context-sep" aria-hidden="true">/</span>
              <span className="context-label">
                {currentQuizNum ? `Lesson ${currentQuizNum} Quiz` : breadcrumbLabel}
              </span>
            </div>
          )}
        </header>

        {/* ── Content ── */}
        <main className={isDrillsMenu || isQuizIndex ? '' : `${contentMaxW} mx-auto px-8 py-10`}>
          <Outlet />
        </main>

        {/* ── Footer: an end-of-lesson invitation to report a mistake, on every
            content page. The course is corrected in the open, so this stands as
            a friendly standing call (Option C from the A2 discoverability review). ── */}
        <footer className={`${contentMaxW} mx-auto px-8 pt-8 pb-12 mt-6 border-t border-[var(--border)] text-center`}>
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
