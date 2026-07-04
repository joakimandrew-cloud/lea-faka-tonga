import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { ChapterProvider } from './contexts/ChapterContext'
import RouteChrome from './components/RouteChrome'
import Landing from './pages/Landing'

// Layout is lazy too — it statically imports chapters.json, which would
// otherwise ride in the landing bundle.
const Layout = lazy(() => import('./components/Layout'))

// Every page except Landing is a lazy chunk (site-analysis fix #2,
// 2026-07-03): the landing paint pays only for react + router + its own code.
const Offer = lazy(() => import('./pages/Offer'))
const GrandmotherQuiz = lazy(() => import('./pages/GrandmotherQuiz'))
const Keepers = lazy(() => import('./pages/Keepers'))
const ChapterBrowser = lazy(() => import('./pages/ChapterBrowser'))
const ChapterPractice = lazy(() => import('./pages/ChapterPractice'))
const FlipCards = lazy(() => import('./pages/FlipCards'))
const ReferenceCharts = lazy(() => import('./pages/ReferenceCharts'))
const TerminalBuilder = lazy(() => import('./pages/TerminalBuilder'))
const SentenceBuilder = lazy(() => import('./pages/SentenceBuilder'))
const TenseSwapper = lazy(() => import('./pages/TenseSwapper'))
const FirstWordQuiz = lazy(() => import('./pages/FirstWordQuiz'))
const PossessiveSorter = lazy(() => import('./pages/PossessiveSorter'))
const AdjectiveFlip = lazy(() => import('./pages/AdjectiveFlip'))
const SkeletonFiller = lazy(() => import('./pages/SkeletonFiller'))
const ClusivityCorner = lazy(() => import('./pages/ClusivityCorner'))
const FakaSorter = lazy(() => import('./pages/FakaSorter'))
const QuizIndex = lazy(() => import('./pages/QuizIndex'))
const QuizPlay = lazy(() => import('./pages/QuizPlay'))
const CleftBuilder = lazy(() => import('./pages/CleftBuilder'))
const AccentPlacementPicker = lazy(() => import('./pages/AccentPlacementPicker'))
const VerbalNounConverter = lazy(() => import('./pages/VerbalNounConverter'))
const DrillsMenu = lazy(() => import('./pages/DrillsMenu'))
const DrillPage = lazy(() => import('./pages/DrillPage'))
const ReportIssue = lazy(() => import('./pages/ReportIssue'))
const HeroLab = lazy(() => import('./pages/HeroLab'))
const ScrubHub = lazy(() => import('./pages/ScrubHub'))
const NotFound = lazy(() => import('./pages/NotFound'))

// The course unit is a "Lesson" in the UI and the URL (2026-06-22). Old
// /chapters/:num links are kept alive as permanent redirects to /lessons/:num
// so nothing a visitor saved or shared ever 404s. React Router does not
// substitute :num into <Navigate to>, so this reads the param itself.
function ChapterRedirect() {
  const { num } = useParams()
  return <Navigate to={`/lessons/${num}`} replace />
}

const pageFallback = (
  <div className="min-h-[40vh] flex items-center justify-center text-sm text-[var(--text-faint)]">
    Loading…
  </div>
)

export default function App() {
  return (
    <ChapterProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <RouteChrome />
        <Suspense fallback={pageFallback}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/support" element={<Offer />} />
            <Route path="/quiz" element={<GrandmotherQuiz />} />
            <Route path="/keepers" element={<Keepers />} />
            <Route path="/report" element={<ReportIssue />} />
            {/* Hidden prototype for the Home Hero Review — not linked from any nav. */}
            <Route path="/hero-lab" element={<HeroLab />} />
            {/* Hidden animation scrubber (view + live-edit any registered animation),
                not linked. /hero-scrub kept as an alias so older links still work. */}
            <Route path="/scrub" element={<ScrubHub />} />
            <Route path="/hero-scrub" element={<ScrubHub />} />
            <Route path="/lessons" element={<ChapterBrowser />} />
            {/* Course unit is a "Lesson" in the URL since 2026-06-22; the old
                /chapters/* paths stay as permanent redirects so saved and shared
                links never break. Internal IDs (data keys, filenames) stay "chapter". */}
            <Route path="/chapters" element={<Navigate to="/lessons" replace />} />
            <Route path="/chapters/:num" element={<ChapterRedirect />} />
            <Route element={<Layout />}>
              <Route path="/lessons/:num" element={<ChapterPractice />} />
              <Route path="/cards" element={<FlipCards />} />
              <Route path="/charts" element={<ReferenceCharts />} />
              <Route path="/terminal-build" element={<TerminalBuilder />} />
              <Route path="/sentence-builder" element={<SentenceBuilder />} />
              <Route path="/tense-swap" element={<TenseSwapper />} />
              <Route path="/first-word" element={<FirstWordQuiz />} />
              <Route path="/possessive-sort" element={<PossessiveSorter />} />
              <Route path="/adjective-flip" element={<AdjectiveFlip />} />
              <Route path="/skeleton-filler" element={<SkeletonFiller />} />
              <Route path="/clusivity" element={<ClusivityCorner />} />
              <Route path="/faka-sort" element={<FakaSorter />} />
              <Route path="/quizzes" element={<QuizIndex />} />
              <Route path="/quizzes/:num" element={<QuizPlay />} />
              <Route path="/cleft-builder" element={<CleftBuilder />} />
              <Route path="/accent-placement" element={<AccentPlacementPicker />} />
              <Route path="/verbal-noun" element={<VerbalNounConverter />} />
              {/* Drills demoted to chapter-only lose their bespoke pages;
                  redirect old deep links to the generic route. The legacy
                  slot-engine builders (/build, /open-build, /guided) were
                  deleted outright 2026-06-13 (exercise-overwhelm review X05) —
                  /sentence-builder supersedes them; /terminal-build remains
                  as the engine fallback. */}
              <Route path="/reciprocity" element={<Navigate to="/drill/reciprocity-picker" replace />} />
              <Route path="/emotional-article" element={<Navigate to="/drill/emotional-article-matrix" replace />} />
              <Route path="/definiteness-flip" element={<Navigate to="/drill/definiteness-flip" replace />} />
              <Route path="/drills" element={<DrillsMenu />} />
              <Route path="/drill/:id" element={<DrillPage />} />
              {/* Unknown URL → friendly in-app 404 (site-analysis fix #6). */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ChapterProvider>
  )
}
