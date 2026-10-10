import { lazy, Suspense, useEffect, useRef } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import { Header, Footer } from './components/Chrome.jsx'
import RouteChrome from '@app/components/RouteChrome.jsx'
import Home from './pages/Home.jsx'
import NotBuilt from './pages/NotBuilt.jsx'
import { BESPOKE } from '@app/lib/drill-routes.js'
import { previewNoticeMode } from './lib/membership-offer.js'

// Each inner page loads with its own data, so the homepage stays light.
const Lessons = lazy(() => import('./pages/Lessons.jsx'))
const Lesson = lazy(() => import('./pages/Lesson.jsx'))
const Quiz = lazy(() => import('./pages/Quiz.jsx'))
const Quizzes = lazy(() => import('./pages/Quizzes.jsx'))
const TenseSwap = lazy(() => import('./pages/TenseSwap.jsx'))
const Cards = lazy(() => import('./pages/Cards.jsx'))
const Drills = lazy(() => import('./pages/Drills.jsx'))
const SourceDrill = lazy(() => import('./pages/SourceDrill.jsx'))
const SourceBuilder = lazy(() => import('./pages/SourceBuilder.jsx'))
const Reference = lazy(() => import('./pages/Reference.jsx'))
const Topics = lazy(() => import('./pages/Topics.jsx'))
const TopicArticle = lazy(() => import('./pages/TopicArticle.jsx'))
const Help = lazy(() => import('./pages/Help.jsx'))
const Dictionary = lazy(() => import('./pages/Dictionary.jsx'))
const WordLists = lazy(() => import('./pages/WordLists.jsx'))
const ReportIssue = lazy(() => import('./pages/ReportIssue.jsx'))
const Keepers = lazy(() => import('./pages/Keepers.jsx'))
const GrandmotherQuiz = lazy(() => import('./pages/GrandmotherQuiz.jsx'))
// /support is the premium membership page; the old app's Offer.jsx redirect is no longer routed here.
const Membership = lazy(() => import('./pages/Membership.jsx'))
const PartnerRedirect = lazy(() => import('@app/pages/PartnerRedirect.jsx'))

const BESPOKE_DRILL_ROUTES = Object.entries(BESPOKE).filter(([id]) => id !== 'terminal-builder')

function Page({ children }) {
  const pageRef = useRef(null)
  const loc = useLocation()
  const mountedPath = useRef(loc.pathname)
  useEffect(() => {
    // Lazy routes and lesson Markdown may arrive after the browser's initial
    // hash jump. An exiting page must not consume the next page's anchor.
    if (!loc.hash || mountedPath.current !== loc.pathname) return
    let anchor
    try { anchor = decodeURIComponent(loc.hash.slice(1)) } catch { return }
    const root = pageRef.current
    let frame
    let cancelled = false
    const scroll = () => {
      const target = root.id === anchor ? root : [...root.querySelectorAll('[id]')].find(node => node.id === anchor)
      if (!target) return false
      document.fonts.ready.then(() => {
        if (!cancelled) frame = requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }))
      })
      return true
    }
    if (scroll()) return () => { cancelled = true; cancelAnimationFrame(frame) }
    const observer = new MutationObserver(() => { if (scroll()) observer.disconnect() })
    observer.observe(root, { childList: true, subtree: true })
    const timeout = setTimeout(() => observer.disconnect(), 10000)
    return () => { cancelled = true; observer.disconnect(); clearTimeout(timeout); cancelAnimationFrame(frame) }
  }, [loc.pathname, loc.hash])
  return (
    <Motion.main
      id="main"
      className={loc.pathname === '/' ? undefined : 'wr-inner'}
      ref={pageRef}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: .45, ease: [.16, 1, .3, 1] }}
    >
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>{children}</Suspense>
    </Motion.main>
  )
}

export default function App() {
  const loc = useLocation()
  useEffect(() => { if (!loc.hash) window.scrollTo({ top: 0, behavior: 'instant' }) }, [loc.pathname, loc.hash])
  const reading = /^\/lessons\/\d+/.test(loc.pathname)
  const focus = /^\/(quizzes|drill)\//.test(loc.pathname) || ['/cards', '/sentence-builder', '/terminal-build', ...BESPOKE_DRILL_ROUTES.map(([, path]) => path)].includes(loc.pathname)

  return (
    <>
      <Header progress={reading} noticeMode={previewNoticeMode(loc.pathname, Object.values(BESPOKE))} />
      <RouteChrome />
      <AnimatePresence mode="wait">
        <Routes location={loc} key={loc.pathname}>
          <Route path="/" element={<Page><Home /></Page>} />
          <Route path="/lessons" element={<Page><Lessons /></Page>} />
          <Route path="/lessons/:num" element={<Page><Lesson /></Page>} />
          <Route path="/chapters" element={<LegacyRedirect to="/lessons" />} />
          <Route path="/chapters/:num" element={<LegacyLessonRedirect />} />
          <Route path="/quizzes" element={<Page><Quizzes /></Page>} />
          <Route path="/quizzes/:num" element={<Page><Quiz /></Page>} />
          <Route path="/drills" element={<Page><Drills /></Page>} />
          <Route path="/drill/tense-swap" element={<Page><TenseSwap /></Page>} />
          <Route path="/drill/:id" element={<Page><SourceDrill /></Page>} />
          {BESPOKE_DRILL_ROUTES.map(([id, path]) => (
            <Route key={path} path={path} element={<Page><SourceDrill bespokeId={id} /></Page>} />
          ))}
          <Route path="/sentence-builder" element={<Page><SourceBuilder mode="sentence" /></Page>} />
          <Route path="/terminal-build" element={<Page><SourceBuilder mode="terminal" /></Page>} />
          <Route path="/cards" element={<Page><Cards /></Page>} />
          <Route path="/charts" element={<Page><Reference /></Page>} />
          <Route path="/topics" element={<Page><Topics /></Page>} />
          <Route path="/alphabet" element={<Page><TopicArticle /></Page>} />
          <Route path="/greetings" element={<Page><TopicArticle /></Page>} />
          <Route path="/questions" element={<Page><TopicArticle /></Page>} />
          <Route path="/grammar/*" element={<Page><TopicArticle /></Page>} />
          <Route path="/dictionary" element={<Page><Dictionary /></Page>} />
          <Route path="/word-lists" element={<Page><WordLists /></Page>} />
          <Route path="/help" element={<Page><Help /></Page>} />
          <Route path="/report" element={<Page><ReportIssue /></Page>} />
          <Route path="/support" element={<Page><Membership /></Page>} />
          <Route path="/keepers" element={<Page><Keepers /></Page>} />
          <Route path="/quiz" element={<Page><GrandmotherQuiz /></Page>} />
          <Route path="/r/:slug" element={<Page><PartnerRedirect /></Page>} />
          <Route path="/reciprocity" element={<LegacyRedirect to="/drill/reciprocity-picker" />} />
          <Route path="/emotional-article" element={<LegacyRedirect to="/drill/emotional-article-matrix" />} />
          <Route path="/definiteness-flip" element={<LegacyRedirect to="/drill/definiteness-flip" />} />
          {['/hero-lab', '/scrub', '/hero-scrub'].map(path => <Route key={path} path={path} element={<Navigate to="/" replace />} />)}
          <Route path="*" element={<Page><NotBuilt /></Page>} />
        </Routes>
      </AnimatePresence>
      {!focus && <Footer />}
    </>
  )
}

function LegacyLessonRedirect() {
  const loc = useLocation()
  return <Navigate to={`${loc.pathname.replace(/^\/chapters/, '/lessons')}${loc.search}${loc.hash}`} replace />
}

function LegacyRedirect({ to }) {
  const loc = useLocation()
  return <Navigate to={`${to}${loc.search}${loc.hash}`} replace />
}
