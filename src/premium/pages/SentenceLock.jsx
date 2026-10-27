import SentenceLock from '@app/pages/SentenceLock.jsx'
import '../styles/source-core.css'
import '@app/styles/word-rain.css'
import '@app/styles/sentence-lock.css'

// Sentence Lock (plan 2026-10-27-sentence-lock-game, Step 5). The game lives in
// src/pages/SentenceLock.jsx with its logic in src/games/sentence-lock/.
// The build only keeps stylesheets imported from src/premium (vite.config.js,
// course-style-bridge), so the drill shell, Word Balloons' look (which the
// game wears) and the game's own sheet are imported here.
export default function SentenceLockPage() {
  return <SentenceLock />
}
