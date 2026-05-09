import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ChapterProvider } from './contexts/ChapterContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Builder from './pages/Builder'
import OpenBuilder from './pages/OpenBuilder'
import GuidedBuild from './pages/GuidedBuild'
import ChapterBrowser from './pages/ChapterBrowser'
import ChapterPractice from './pages/ChapterPractice'
import FlipCards from './pages/FlipCards'
import ReferenceCharts from './pages/ReferenceCharts'
import TerminalBuilder from './pages/TerminalBuilder'
import TenseSwapper from './pages/TenseSwapper'
import FirstWordQuiz from './pages/FirstWordQuiz'
import PossessiveSorter from './pages/PossessiveSorter'
import AdjectiveFlip from './pages/AdjectiveFlip'
import SkeletonFiller from './pages/SkeletonFiller'
import ClusivityCorner from './pages/ClusivityCorner'
import FakaSorter from './pages/FakaSorter'
import QuizIndex from './pages/QuizIndex'
import QuizPlay from './pages/QuizPlay'
import DefinitenessFlip from './pages/DefinitenessFlip'
import CleftBuilder from './pages/CleftBuilder'
import AccentPlacementPicker from './pages/AccentPlacementPicker'
import VerbalNounConverter from './pages/VerbalNounConverter'
import ReciprocityPicker from './pages/ReciprocityPicker'
import EmotionalArticleMatrix from './pages/EmotionalArticleMatrix'
import DrillsMenu from './pages/DrillsMenu'

export default function App() {
  return (
    <ChapterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/chapters" element={<ChapterBrowser />} />
          <Route element={<Layout />}>
            <Route path="/learn" element={<Dashboard />} />
            <Route path="/build" element={<Builder />} />
            <Route path="/open-build" element={<OpenBuilder />} />
            <Route path="/guided" element={<GuidedBuild />} />
            <Route path="/chapters/:num" element={<ChapterPractice />} />
            <Route path="/cards" element={<FlipCards />} />
            <Route path="/charts" element={<ReferenceCharts />} />
            <Route path="/terminal-build" element={<TerminalBuilder />} />
            <Route path="/tense-swap" element={<TenseSwapper />} />
            <Route path="/first-word" element={<FirstWordQuiz />} />
            <Route path="/possessive-sort" element={<PossessiveSorter />} />
            <Route path="/adjective-flip" element={<AdjectiveFlip />} />
            <Route path="/skeleton-filler" element={<SkeletonFiller />} />
            <Route path="/clusivity" element={<ClusivityCorner />} />
            <Route path="/faka-sort" element={<FakaSorter />} />
            <Route path="/quizzes" element={<QuizIndex />} />
            <Route path="/quizzes/:num" element={<QuizPlay />} />
            <Route path="/definiteness-flip" element={<DefinitenessFlip />} />
            <Route path="/cleft-builder" element={<CleftBuilder />} />
            <Route path="/accent-placement" element={<AccentPlacementPicker />} />
            <Route path="/verbal-noun" element={<VerbalNounConverter />} />
            <Route path="/reciprocity" element={<ReciprocityPicker />} />
            <Route path="/emotional-article" element={<EmotionalArticleMatrix />} />
            <Route path="/drills" element={<DrillsMenu />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ChapterProvider>
  )
}
