import { Link } from 'react-router-dom'
import '../styles/tlw-ribbon.css'

/* =============================================================================
   TONGAN LANGUAGE WEEK RIBBON  —  PROTOTYPE, EASY TO REMOVE
   -----------------------------------------------------------------------------
   A slim celebratory ribbon for Uike Kātoangaʻi ʻo e lea faka-Tonga
   (Tongan Language Week, NZ: 16–22 August 2026). Celebration, not a sale.

   TO TURN IT OFF for a look:      add ?tlw=off to the homepage URL
   TO TURN IT OFF permanently:     set SHOW_TLW_RIBBON = false below
   TO DELETE IT ENTIRELY:          delete this file, src/styles/tlw-ribbon.css,
                                   and the two ribbon lines in pages/Landing.jsx
   AFTER THE WEEK:                 nothing to do — it date-gates itself off
                                   after Saturday 22 August 2026 (LAST_DAY below)

   Orthography: the glottal stop is the fakauʻa U+02BB (ʻ) — never a straight
   apostrophe. Do not retype this string by hand; copy it.
   ========================================================================== */

export const SHOW_TLW_RIBBON = true

// Last day the ribbon shows, in the visitor's local time. Tongan Language Week
// ends Saturday 22 August 2026; from the 23rd the ribbon hides itself.
const LAST_DAY = new Date(2026, 7, 22, 23, 59, 59)

export default function TLWRibbon() {
  // ?tlw=off lets the ribbon be compared away without a code change.
  if (!SHOW_TLW_RIBBON) return null
  if (new Date() > LAST_DAY) return null
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tlw') === 'off') {
    return null
  }

  return (
    <div className="tlw-ribbon">
      <div className="tlw-inner">
        <span className="tlw-tongan">Uike Kātoangaʻi ʻo e lea faka-Tonga</span>
        <span className="tlw-dash" aria-hidden="true">—</span>
        <span className="tlw-en">Tongan Language Week, 16–22 August</span>
        {/* No arrow: Andrew's 2026-08-11 taste ruling removed every arrow from
            the homepage, and this ribbon shipped after it with one. */}
        <Link to="/lessons/1" state={{ fromStart: true }} className="tlw-cta">
          Start Lesson 1, free
        </Link>
      </div>
    </div>
  )
}
