import WordRain from '@app/pages/WordRain.jsx'
import '../styles/source-core.css'
import '@app/styles/word-rain.css'

// Word Rain (plan 2026-10-26-word-rain-game). The game lives in
// src/pages/WordRain.jsx with its logic in src/games/word-rain/; this page is
// the premium side of it, as SourceDrill.jsx is for the drills. The build only
// keeps stylesheets imported from src/premium (vite.config.js,
// course-style-bridge), so the drill shell's source-core.css and the game's
// own word-rain.css are imported here.
export default function WordRainPage() {
  return <WordRain />
}
