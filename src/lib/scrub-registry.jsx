import { BASE, cells, messageMsFor, PREVIEW_RATE, PREVIEW_MS, MessageInner } from './hero-cells.jsx'

/* =========================================================================
   scrub-registry — the list of animations the /scrub hub can view + edit, and
   the small CONTRACT each one implements. Add a scene here and it shows up in
   the scrubber's menu automatically; nothing else to wire.

   A SCENE = {
     id, label,
     variants: [{ id, label }] | null,        // optional sub-picker (hero has 5 features)
     defaults(variantIndex, env): {            // the live-editable dials
       <key>: { label, min, max, step, unit, value }
     },
     duration(vals, variantIndex, env): ms,    // total length given (edited) dial values
     parts(vals, variantIndex, env): [{ name, color, end }],  // cumulative ends, for the bar
     Stage: ReactComponent,                    // renders the frozen DOM (stable class hooks)
     seek(root, t, { vals, variantIndex, env, mode }): void,  // freeze+seek to time t
     readout?(vals, variantIndex, env, t): string,            // extra readout detail
   }
   env = { portrait }.  vals = defaults overlaid with the owner's live edits.
   `mode` is 'scrub' (freeze a frame) or 'play' (let video run for smoothness).

   If a scene omits `seek`, the harness uses genericSeek below — which works for
   any animation built from CSS animations/transitions + <video>, with zero extra
   code (pause every animation in the subtree and set its currentTime; seek any
   video). Scenes only need a custom seek when JS drives motion the WAAPI can't
   see (e.g. the hero's class-triggered dive + half-speed clip mapping).
   ========================================================================= */

export function genericSeek(root, t) {
  if (!root) return
  root.getAnimations({ subtree: true }).forEach(a => { try { a.pause(); a.currentTime = t } catch { /* noop */ } })
  root.querySelectorAll('video').forEach(v => { try { v.pause(); v.currentTime = t / 1000 } catch { /* noop */ } })
}

/* ---- Scene 1: the homepage hero (5 features) -------------------------- */

function HeroStage({ variantIndex, env }) {
  const cell = cells[variantIndex]
  const file = env.portrait && cell.fileMobile ? cell.fileMobile : cell.file
  return (
    <div className={`hl-stage${env.portrait ? ' is-portrait' : ''}`}>
      <span className="hl-stage-stripe" aria-hidden="true" />
      <div className="hl-cell hl-cx-grammardive hl-scrub">
        <div className={`hl-cell-layer hl-cell-message${cell.messageTextOnly ? ' is-textonly' : ''}`}>
          <MessageInner cell={cell} style="grammardive" running={true} />
        </div>
        <div className="hl-cell-layer hl-cell-preview">
          <video key={file} className="hl-video" muted playsInline preload="auto" poster={`${BASE}${file}-poster.jpg`}>
            <source src={`${BASE}${file}.mp4`} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  )
}

const HERO = {
  id: 'hero',
  label: 'Homepage hero',
  variants: cells.map(c => ({ id: c.id, label: c.previewTitle })),

  defaults(vi, env) {
    const cell = cells[vi]
    return {
      intro: { label: 'Intro', min: 600, max: 4000, step: 50, unit: 'ms', value: messageMsFor(cell, env.portrait) },
      dive: { label: 'Dive', min: 400, max: 3000, step: 50, unit: 'ms', value: env.portrait ? 1800 : 1400 },
      speed: { label: 'Preview speed', min: 0.25, max: 1, step: 0.05, unit: '×', value: cell.rate ?? PREVIEW_RATE },
      hold: { label: 'Preview hold', min: 2000, max: 24000, step: 100, unit: 'ms', value: cell.holdMs ?? Math.round((cell.previewMs ?? PREVIEW_MS) / (cell.rate ?? PREVIEW_RATE)) },
    }
  },
  duration: vals => vals.intro + vals.hold,
  parts: vals => [
    { name: 'intro', color: '#d98a3a', end: vals.intro },
    { name: 'dive', color: '#b8470f', end: vals.intro + vals.dive },
    { name: 'preview', color: '#2e7d4f', end: vals.intro + vals.hold },
  ],
  readout(vals, vi, env, t) {
    if (t < vals.intro) return ''
    return `clip ${Math.max(0, (t - vals.intro) / 1000 * vals.speed).toFixed(2)}s`
  },
  Stage: HeroStage,
  seek(root, t, { vals, mode }) {
    const msg = root.querySelector('.hl-cell-message')
    const prev = root.querySelector('.hl-cell-preview')
    const v = root.querySelector('.hl-video')
    if (!msg || !prev) return
    const msgMs = vals.intro, diveMs = vals.dive, rate = vals.speed
    const msgDiveMs = Math.max(200, Math.round(diveMs * 0.78))
    if (t < msgMs) {
      msg.style.transform = 'scale(1)'; msg.style.opacity = '1'
      prev.style.transform = 'scale(0.58)'; prev.style.opacity = '0'
      msg.getAnimations({ subtree: true }).forEach(a => { try { a.pause(); a.currentTime = t } catch { /* noop */ } })
      if (v) { v.pause(); try { v.currentTime = 0 } catch { /* noop */ } }
    } else {
      const dt = t - msgMs
      const pm = Math.min(1, dt / msgDiveMs), pp = Math.min(1, dt / diveMs)
      msg.style.transform = `scale(${(1 + 0.7 * pm).toFixed(3)})`; msg.style.opacity = `${(1 - pm).toFixed(3)}`
      prev.style.transform = `scale(${(0.58 + 0.42 * pp).toFixed(3)})`; prev.style.opacity = `${pp.toFixed(3)}`
      msg.getAnimations({ subtree: true }).forEach(a => { try { a.pause(); a.currentTime = msgMs } catch { /* noop */ } })
      if (v) {
        const clip = (dt / 1000) * rate
        if (mode === 'play') {
          if (v.paused) { try { v.currentTime = clip } catch { /* noop */ }; v.playbackRate = rate; v.play().catch(() => {}) }
          else { v.playbackRate = rate }
        } else {
          v.pause(); try { v.currentTime = clip } catch { /* noop */ }
        }
      }
    }
  },
}

export const SCENES = [HERO]
export const getScene = id => SCENES.find(s => s.id === id) || SCENES[0]
