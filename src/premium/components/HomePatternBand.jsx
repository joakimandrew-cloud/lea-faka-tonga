import { KupesiTile } from './Kupesi.jsx'
import { lessonTile } from '../lib/lesson-colour.js'
import '../styles/home-pattern-band.css'

// Reuse the approved lesson-map geometry and alternating framed treatment.
export default function HomePatternBand({ className = '' }) {
  return (
    <div className={`home-pattern-band ${className}`} aria-hidden="true">
      {Array.from({ length: 80 }, (_, i) => (
        <KupesiTile key={i} {...lessonTile(i + 1)} framed />
      ))}
    </div>
  )
}
