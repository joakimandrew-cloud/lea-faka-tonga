import { useState, useEffect, useRef } from 'react'
import { BASE, cells, messageMsFor, PREVIEW_RATE, PREVIEW_MS, MessageInner, StoryCell } from '../lib/hero-cells.jsx'
import '../styles/hero-lab.css'

/* =========================================================================
   HeroScrub — hidden /hero-scrub surface so the owner can DIRECT hero timing.
   Drag the slider to freeze any exact moment of a feature's animation and read
   what it is; press Play to watch it run. It reuses the SAME engine as the live
   homepage (hero-cells): the frozen frame renders the real <MessageInner> + the
   real preview clip, and Play mounts the real <StoryCell>. Nothing here ships to
   the homepage; it only reads the live timings so what you see == what's live.

   How each layer is seeked (the animation is a mix of three kinds of motion):
     • message build (eyebrow + spec tiles)  -> Web Animations API: pause + set
       currentTime on every CSS animation in the message subtree.
     • dive (zoom from text into the app)     -> interpolated inline transforms.
     • preview clip                           -> video.currentTime (maps wall time
       through PREVIEW_RATE, since the clip plays at half speed live).
   Phone vs desktop styling is viewport-driven (CSS @media), so we auto-detect it
   rather than fake it — open this on the device you want to tune.
   ========================================================================= */

// Dive transition lengths — must mirror hero-lab.css (the visible zoom = the
// preview transform; the message scales out a touch quicker).
const DIVE = { mobile: 1800, desktop: 1300 }
const MSG_DIVE = { mobile: 1400, desktop: 1000 }

const fmt = ms => (ms / 1000).toFixed(2) + 's'

export default function HeroScrub() {
  const [idx, setIdx] = useState(0)
  const [t, setT] = useState(0)          // ms from the start of this feature
  const [playing, setPlaying] = useState(false)
  const [portrait, setPortrait] = useState(false)
  const [nonce, setNonce] = useState(0)  // re-key StoryCell to restart Play

  const cell = cells[idx]
  const msgMs = messageMsFor(cell, portrait)
  const previewWin = (cell.previewMs ?? PREVIEW_MS) / PREVIEW_RATE
  const total = msgMs + previewWin
  const diveMs = portrait ? DIVE.mobile : DIVE.desktop
  const msgDiveMs = portrait ? MSG_DIVE.mobile : MSG_DIVE.desktop
  const part = t < msgMs ? 'intro' : t < msgMs + diveMs ? 'dive' : 'preview'
  const clipT = Math.max(0, (t - msgMs) / 1000 * PREVIEW_RATE)
  const file = portrait && cell.fileMobile ? cell.fileMobile : cell.file

  const msgRef = useRef(null), prevRef = useRef(null), vRef = useRef(null)

  // track the phone breakpoint (the live hero's mobile styles are @media-driven)
  useEffect(() => {
    const m = window.matchMedia('(max-width: 600px)')
    const on = () => setPortrait(m.matches); on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])

  // reset when the feature or orientation changes
  useEffect(() => { setT(0); setPlaying(false) }, [idx, portrait])

  // SCRUB: freeze + seek the exact frame at t (only while not playing)
  useEffect(() => {
    if (playing) return
    const msg = msgRef.current, prev = prevRef.current, v = vRef.current
    if (!msg || !prev) return
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
      if (v) { v.pause(); try { v.currentTime = clipT } catch { /* noop */ } }
    }
  }, [t, idx, portrait, playing, msgMs, diveMs, msgDiveMs, clipT])

  // PLAY: advance the playhead in real time (the real StoryCell does the rendering)
  useEffect(() => {
    if (!playing) return
    let raf, start = performance.now()
    const step = now => {
      let nt = now - start
      if (nt >= total) { start = now; nt = 0; setNonce(n => n + 1) }  // loop the feature
      setT(nt)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing, total])

  const startPlay = () => { setT(0); setNonce(n => n + 1); setPlaying(true) }
  const bump = d => { setPlaying(false); setT(v => Math.max(0, Math.min(total, v + d))) }
  const onSlide = e => { setPlaying(false); setT(Number(e.target.value)) }
  const seekBar = e => {
    const r = e.currentTarget.getBoundingClientRect()
    setPlaying(false); setT(Math.max(0, Math.min(total, ((e.clientX - r.left) / r.width) * total)))
  }
  const onKey = e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); bump(e.shiftKey ? -10 : -100) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); bump(e.shiftKey ? 10 : 100) }
    else if (e.key === ' ') { e.preventDefault(); playing ? setPlaying(false) : startPlay() }
  }

  const dial = part === 'intro'
    ? `Intro length — ${cell.previewTitle}: ${msgMs} ms (the text card before it dives)`
    : part === 'dive'
      ? `Dive — ${diveMs} ms zoom from the text into the app`
      : `Preview — plays at ${PREVIEW_RATE}× · lasts ${Math.round(previewWin)} ms (clip is ${cell.previewMs} ms at 1×)`
  const seg = { intro: msgMs / total * 100, dive: diveMs / total * 100, preview: (total - msgMs - diveMs) / total * 100 }

  return (
    <div style={S.page} tabIndex={0} onKeyDown={onKey}>
      <div style={S.head}>
        <div>
          <div style={S.kicker}>hidden · /hero-scrub</div>
          <h1 style={S.h1}>Hero animation scrubber</h1>
          <div style={S.sub}>Drag the slider (or ← → keys; hold Shift for 10 ms steps; Space = play) to freeze any moment. Showing <b>{portrait ? 'phone' : 'desktop'}</b> timings — open on the device you want to tune.</div>
        </div>
        <div style={S.features}>
          {cells.map((c, i) => (
            <button key={c.id} onClick={() => setIdx(i)} style={{ ...S.feat, ...(i === idx ? S.featOn : {}) }}>{i + 1}. {c.previewTitle}</button>
          ))}
        </div>
      </div>

      <div style={S.stageWrap}>
        {playing ? (
          <StoryCell key={`play-${idx}-${portrait}-${nonce}`} cell={cell} style="grammardive" active portrait={portrait} />
        ) : (
          <div className={`hl-stage${portrait ? ' is-portrait' : ''}`}>
            <span className="hl-stage-stripe" aria-hidden="true" />
            <div className="hl-cell hl-cx-grammardive hl-scrub">
              <div className={`hl-cell-layer hl-cell-message${cell.messageTextOnly ? ' is-textonly' : ''}`} ref={msgRef}>
                <MessageInner cell={cell} style="grammardive" running={true} />
              </div>
              <div className="hl-cell-layer hl-cell-preview" ref={prevRef}>
                <video key={file} ref={vRef} className="hl-video" muted playsInline preload="auto" poster={`${BASE}${file}-poster.jpg`}>
                  <source src={`${BASE}${file}.mp4`} type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* parts bar (click to seek) */}
      <div style={S.bar} onClick={seekBar} title="click to seek">
        <div style={{ ...S.segIntro, width: `${seg.intro}%` }}>intro</div>
        <div style={{ ...S.segDive, width: `${seg.dive}%` }}>dive</div>
        <div style={{ ...S.segPrev, width: `${seg.preview}%` }}>preview</div>
        <div style={{ ...S.play, left: `${(t / total) * 100}%` }} />
      </div>

      <input type="range" min={0} max={Math.round(total)} step={10} value={Math.round(t)} onChange={onSlide} style={S.range} />

      <div style={S.controls}>
        <button style={S.btn} onClick={() => bump(-100)}>⏮ −100</button>
        <button style={S.btn} onClick={() => bump(-10)}>◀ −10</button>
        <button style={{ ...S.btn, ...S.playBtn }} onClick={() => (playing ? setPlaying(false) : startPlay())}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
        <button style={S.btn} onClick={() => bump(10)}>+10 ▶</button>
        <button style={S.btn} onClick={() => bump(100)}>+100 ⏭</button>
        <button style={S.btn} onClick={() => { setPlaying(false); setT(0) }}>↺ Start</button>
      </div>

      <div style={S.readout}>
        <div style={S.bigT}>{fmt(t)} <span style={S.ofTotal}>/ {fmt(total)}</span></div>
        <div style={{ ...S.partTag, background: part === 'preview' ? '#1a7a3a' : '#b8470f' }}>
          {part === 'intro' ? 'INTRO MESSAGE' : part === 'dive' ? 'DIVE' : `PREVIEW · clip ${clipT.toFixed(2)}s`}
        </div>
        <div style={S.dial}>{dial}</div>
        <div style={S.hint}>To change it, tell me e.g. &ldquo;{cell.previewTitle}: {part === 'preview' ? 'cut the part around ' + fmt(t) : part === 'dive' ? 'slow the dive' : 'hold the intro to ' + fmt(msgMs + 400)}&rdquo;.</div>
      </div>
    </div>
  )
}

const S = {
  page: { maxWidth: 880, margin: '0 auto', padding: '22px 18px 60px', fontFamily: '-apple-system,Segoe UI,Helvetica,sans-serif', color: '#1a1612', outline: 'none' },
  head: { display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  kicker: { fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#b8470f', fontWeight: 700 },
  h1: { fontSize: 24, margin: '2px 0 4px' },
  sub: { fontSize: 13, color: '#6b645c', maxWidth: 560, lineHeight: 1.45 },
  features: { display: 'flex', flexDirection: 'column', gap: 6 },
  feat: { textAlign: 'left', fontSize: 12.5, padding: '6px 11px', border: '1px solid #d8d2c8', borderRadius: 6, background: '#fff', color: '#3a342c', cursor: 'pointer' },
  featOn: { background: '#b8470f', color: '#fff', border: '1px solid #b8470f', fontWeight: 700 },
  stageWrap: { maxWidth: 460, margin: '0 auto 14px' },
  bar: { position: 'relative', display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', userSelect: 'none', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', fontWeight: 700 },
  segIntro: { background: '#d98a3a', display: 'grid', placeItems: 'center', minWidth: 0 },
  segDive: { background: '#b8470f', display: 'grid', placeItems: 'center', minWidth: 0 },
  segPrev: { background: '#2e7d4f', display: 'grid', placeItems: 'center', minWidth: 0 },
  play: { position: 'absolute', top: -3, bottom: -3, width: 2, background: '#1a1612', boxShadow: '0 0 0 1px #fff', transform: 'translateX(-1px)' },
  range: { width: '100%', margin: '10px 0 4px', accentColor: '#b8470f' },
  controls: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', margin: '8px 0 16px' },
  btn: { fontSize: 13, padding: '7px 12px', border: '1px solid #d8d2c8', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#3a342c' },
  playBtn: { background: '#1a1612', color: '#fff', border: '1px solid #1a1612', minWidth: 96, fontWeight: 700 },
  readout: { textAlign: 'center', borderTop: '1px solid #ece8e1', paddingTop: 14 },
  bigT: { fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums' },
  ofTotal: { fontSize: 16, color: '#9a948c', fontWeight: 500 },
  partTag: { display: 'inline-block', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', padding: '3px 12px', borderRadius: 4, margin: '6px 0 10px' },
  dial: { fontSize: 14, color: '#1a1612', marginBottom: 6 },
  hint: { fontSize: 12.5, color: '#8a837a', fontStyle: 'italic' },
}
