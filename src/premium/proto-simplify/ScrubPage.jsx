/**
 * The /scrub hub on this branch. The premium app redirects /scrub to the home page;
 * here it mounts so the prototype's figures can be stepped frame by frame. The style
 * bridge in vite.config.js empties CSS imported from outside src/premium, so the hub's
 * sheet is imported from this premium file.
 */
import ScrubHub from '@app/pages/ScrubHub.jsx'
import '@app/styles/hero-lab.css'

export default function ScrubPage() {
  return <ScrubHub />
}
