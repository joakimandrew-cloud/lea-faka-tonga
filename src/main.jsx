import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (site-analysis fix #6) — same families/weights the old
// Google Fonts links served, now bundled as hashed woff2 assets.
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/barlow-condensed/400.css'
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800.css'
import '@fontsource/barlow-condensed/500-italic.css'
import '@fontsource/barlow-condensed/600-italic.css'
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/500.css'
import '@fontsource/source-serif-4/400-italic.css'
import './index.css'
import './styles/exercises.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
