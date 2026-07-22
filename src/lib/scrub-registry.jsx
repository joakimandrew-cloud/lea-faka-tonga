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
      dive: { label: 'Dive', min: 400, max: 3000, step: 50, unit: 'ms', value: env.portrait ? (cell.diveMobile ?? 1800) : (cell.diveDesktop ?? 1300) },
      speed: { label: 'Preview speed', min: 0.25, max: 1, step: 0.05, unit: '×', value: cell.rate ?? PREVIEW_RATE },
      hold: { label: 'Preview hold', min: 2000, max: 24000, step: 100, unit: 'ms', value: cell.holdMs ?? Math.round((env.portrait ? (cell.previewMsMobile ?? cell.previewMs ?? PREVIEW_MS) : (cell.previewMs ?? PREVIEW_MS)) / (cell.rate ?? PREVIEW_RATE)) },
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

/* ---- Scene 2: Basics grammar clips (Remotion renders) ------------------ */
/* The six Lesson clips built 2026-07-22 (plans/readalong-new-animations.md),
   served from public/clips/. The scrubber seeks the finished render
   frame-by-frame; the Speed dial previews a global re-timing. Applying a
   saved speed for real = scale the scene's beat grid in
   video-remotion/src/scenes/<id>.tsx and re-render (dials can't re-cut a
   rendered video — see spec/Animation-Scrubber.md). Parts mirror each
   scene's view.beats in its concept file (BEAT = 600ms). */

const BEAT_MS = 600 // video-remotion/src/theme/timing.ts BEAT (18f @ 30fps)
const PART_COLORS = ['#d98a3a', '#b8470f', '#2e7d4f', '#7a5c9e', '#3a7ca5', '#c2452f']
const CLIPS = [
  { id: 'KaiIsAlwaysKai', label: 'L1 · Kai is always kai', beats: 16, phases: [['sting', 2], ['stage', 2], ['eat→ate', 2], ['glosses', 3], ['naʻá ke kai', 3], ['rule', 4]] },
  { id: 'AdjectiveInVerbSlot', label: 'L3 · Adjective in the verb slot', beats: 18, phases: [['sting', 2], ['slot', 2], ['mālohi drops', 3], ['vaivai swap', 3], ['tense ladder', 5], ['rule', 3]] },
  { id: 'CommandBySubtraction', label: 'L5 · Command by subtraction', beats: 16, phases: [['sting', 2], ['Té u nofo', 2], ['peel', 2], ['Nofo!', 3], ['Mou nofo!', 3], ['rule', 4]] },
  { id: 'KiKiaKiate', label: 'L7 · ki → kia → kiate', beats: 18, phases: [['sting', 2], ['ki Tonga', 2], ['kia Sione', 3], ['kiate au', 3], ['3×3 grid', 3], ['payoff + rule', 5]] },
  { id: 'QuestionWordSlot', label: 'L11 · Question in the answer slot', beats: 16, phases: [['sting', 2], ['the question', 3], ['the answer', 4], ['when pair', 4], ['rule', 3]] },
  { id: 'VerblessKo', label: 'L12 · The verbless ko sentence', beats: 16, phases: [['sting', 2], ['scaffold', 2], ['drop + ko rises', 4], ['Ko e hele ʻeni', 3.5], ['fala swap', 2], ['rule', 2.5]] },
]

function ClipStage({ variantIndex }) {
  const clip = CLIPS[variantIndex]
  return (
    <div className="hl-stage" style={{ background: '#000', display: 'grid', placeItems: 'center' }}>
      <video key={clip.id} className="hl-video" muted playsInline preload="auto" style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
        <source src={`${BASE}clips/${clip.id}.mp4`} type="video/mp4" />
      </video>
    </div>
  )
}

const BASICS_CLIPS = {
  id: 'basics-clips',
  label: 'Basics grammar clips',
  variants: CLIPS.map(c => ({ id: c.id, label: c.label })),

  defaults() {
    return {
      speed: { label: 'Speed', min: 0.5, max: 1.5, step: 0.05, unit: '×', value: 1 },
    }
  },
  duration: (vals, vi) => Math.round((CLIPS[vi].beats * BEAT_MS) / vals.speed),
  parts: (vals, vi) => {
    let acc = 0
    return CLIPS[vi].phases.map(([name, b], i) => {
      acc += (b * BEAT_MS) / vals.speed
      return { name, color: PART_COLORS[i % PART_COLORS.length], end: Math.round(acc) }
    })
  },
  readout: (vals, vi, env, t) => `beat ${((t * vals.speed) / BEAT_MS).toFixed(1)} · clip ${((t * vals.speed) / 1000).toFixed(2)}s`,
  Stage: ClipStage,
  seek(root, t, { vals, mode }) {
    const v = root.querySelector('video')
    if (!v) return
    const clip = (t / 1000) * vals.speed
    if (mode === 'play') {
      if (v.paused) { try { v.currentTime = clip } catch { /* noop */ }; v.playbackRate = vals.speed; v.play().catch(() => {}) }
      else { v.playbackRate = vals.speed }
    } else {
      v.pause()
      try { v.currentTime = clip } catch { /* noop */ }
    }
  },
}

export const SCENES = [HERO, BASICS_CLIPS]
export const getScene = id => SCENES.find(s => s.id === id) || SCENES[0]
