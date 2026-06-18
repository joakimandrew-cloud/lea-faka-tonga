import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ChapterProvider } from './contexts/ChapterContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Offer from './pages/Offer'
import GrandmotherQuiz from './pages/GrandmotherQuiz'
import Keepers from './pages/Keepers'
import ChapterBrowser from './pages/ChapterBrowser'
import ChapterPractice from './pages/ChapterPractice'
import FlipCards from './pages/FlipCards'
import ReferenceCharts from './pages/ReferenceCharts'
import TerminalBuilder from './pages/TerminalBuilder'
import SentenceBuilder from './pages/SentenceBuilder'
import TenseSwapper from './pages/TenseSwapper'
import FirstWordQuiz from './pages/FirstWordQuiz'
import PossessiveSorter from './pages/PossessiveSorter'
import AdjectiveFlip from './pages/AdjectiveFlip'
import SkeletonFiller from './pages/SkeletonFiller'
import ClusivityCorner from './pages/ClusivityCorner'
import FakaSorter from './pages/FakaSorter'
import QuizIndex from './pages/QuizIndex'
import QuizPlay from './pages/QuizPlay'
import CleftBuilder from './pages/CleftBuilder'
import AccentPlacementPicker from './pages/AccentPlacementPicker'
import VerbalNounConverter from './pages/VerbalNounConverter'
import DrillsMenu from './pages/DrillsMenu'
import DrillPage from './pages/DrillPage'
import ReportIssue from './pages/ReportIssue'

export default function App() {
  return (
    <ChapterProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/support" element={<Offer />} />
          <Route path="/quiz" element={<GrandmotherQuiz />} />
          <Route path="/keepers" element={<Keepers />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/chapters" element={<ChapterBrowser />} />
          <Route element={<Layout />}>
            <Route path="/chapters/:num" element={<ChapterPractice />} />
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
          </Route>
        </Routes>
      </BrowserRouter>
    </ChapterProvider>
  )
}
