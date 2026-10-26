import SentenceTiles from '@app/pages/SentenceTiles.jsx'
import '../styles/source-core.css'
import '@app/styles/word-rain.css'
import '@app/styles/sentence-tiles.css'

// Sentence Tiles (plan 2026-10-26-games-section, Step 3). The game lives in
// src/pages/SentenceTiles.jsx with its logic in src/games/sentence-tiles/.
// The build only keeps stylesheets imported from src/premium (vite.config.js,
// course-style-bridge), so the drill shell, Word Balloons' look (which the
// game wears) and the game's own sheet are imported here.
export default function SentenceTilesPage() {
  return <SentenceTiles />
}
