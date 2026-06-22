import { useState } from 'react'
import Scrubber from '../components/Scrubber.jsx'
import { SCENES } from '../lib/scrub-registry.jsx'

/* =========================================================================
   ScrubHub — the hidden /scrub surface. Picks an animation from the registry
   (SCENES) and hands it to the reusable <Scrubber> harness (view + live-edit).
   Add a scene in scrub-registry.jsx and it appears in the menu here automatically.
   ========================================================================= */

export default function ScrubHub() {
  const [sceneIdx, setSceneIdx] = useState(0)
  const scene = SCENES[sceneIdx]

  return (
    <div style={S.page}>
      <div style={S.head}>
        <div style={S.kicker}>hidden · /scrub</div>
        <h1 style={S.h1}>Animation scrubber</h1>
        <div style={S.sub}>View + direct any animation. Drag the slider (or ← → keys; Shift = 10&nbsp;ms; Space = play) to freeze a moment; drag a <b>dial</b> on the right to re-time it live; hit <b>Save</b> to hand me your numbers. Showing the timings for <b>this device</b> — open on your phone to tune the phone version.</div>
        {SCENES.length > 1 && (
          <div style={S.picker}>
            <span style={S.pickerLabel}>Animation:</span>
            <select value={sceneIdx} onChange={e => setSceneIdx(Number(e.target.value))} style={S.select}>
              {SCENES.map((s, i) => <option key={s.id} value={i}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>
      <Scrubber key={scene.id} scene={scene} />
    </div>
  )
}

const S = {
  page: { maxWidth: 940, margin: '0 auto', padding: '22px 18px 60px', fontFamily: '-apple-system,Segoe UI,Helvetica,sans-serif', color: '#1a1612' },
  head: { marginBottom: 18 },
  kicker: { fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#b8470f', fontWeight: 700 },
  h1: { fontSize: 24, margin: '2px 0 4px' },
  sub: { fontSize: 13, color: '#6b645c', maxWidth: 640, lineHeight: 1.5 },
  picker: { marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 },
  pickerLabel: { fontSize: 13, fontWeight: 600, color: '#3a342c' },
  select: { fontSize: 14, padding: '6px 10px', border: '1px solid #d8d2c8', borderRadius: 6, background: '#fff' },
}
