import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/charis-sil/400.css'
import '@fontsource/charis-sil/400-italic.css'
import '@fontsource/charis-sil/700.css'
import '@fontsource/charis-sil/700-italic.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
