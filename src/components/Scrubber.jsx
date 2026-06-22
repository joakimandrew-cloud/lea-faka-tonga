import { useState, useEffect, useRef } from 'react'
import { genericSeek } from '../lib/scrub-registry.jsx'
import '../styles/hero-lab.css'

/* =========================================================================
   Scrubber — the reusable harness behind /scrub. Given a SCENE (see
   scrub-registry.jsx) it renders: the frozen stage, a parts bar, a slider,
   play/step controls + keyboard, a LIVE-EDIT dial panel (drag a dial and the
   animation re-times instantly), and a SAVE button that surfaces the exact
   changed numbers for Claude to bake into the code. Works for any scene; the
   only scene-specific knowledge lives in the scene's contract.
   ========================================================================= */

const fmt = ms => (ms / 1000).toFixed(2) + 's'

export default function Scrubber({ scene }) {
  const [vi, setVi] = useState(0)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [portrait, setPortrait] = useState(false)
  const [edits, setEdits] = useState({})       // { [variantId]: { key: value } }
  const [showSave, setShowSave] = useState(false)
  const rootRef = useRef(null)

  const env = { portrait }
  const variant = scene.variants ? scene.variants[vi] : null
  const variantId = variant ? variant.id : '_'
  const defs = scene.defaults(vi, env)
  const vals = {}
  for (const k in defs) vals[k] = edits[variantId]?.[k] ?? defs[k].value
  const valsKey = JSON.stringify(vals)
  const total = scene.duration(vals, vi, env)
  const parts = scene.parts(vals, vi, env)
  const seek = scene.seek || genericSeek
  const partName = (() => { for (const p of parts) if (t < p.end) return p.name; return parts[parts.length - 1].name })()
  const detail = scene.readout ? scene.readout(vals, vi, env, t) : ''

  useEffect(() => {
    const m = window.matchMedia('(max-width: 600px)')
    const on = () => setPortrait(m.matches); on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])

  useEffect(() => { setT(0); setPlaying(false) }, [vi, portrait, scene.id])

  // scrub: freeze + seek to t (re-runs on live edits via valsKey)
  useEffect(() => {
    if (playing || !rootRef.current) return
    seek(rootRef.current, t, { vals, variantIndex: vi, env, mode: 'scrub' })
  }, [t, vi, portrait, playing, valsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // play: advance the playhead; the scene seeks each frame (video plays natively)
  useEffect(() => {
    if (!playing) return
    let raf, start = performance.now()
    const stepFn = now => {
      let nt = now - start
      if (nt >= total) { start = now; nt = 0 }
      if (rootRef.current) seek(rootRef.current, nt, { vals, variantIndex: vi, env, mode: 'play' })
      setT(nt)
      raf = requestAnimationFrame(stepFn)
    }
    raf = requestAnimationFrame(stepFn)
    return () => cancelAnimationFrame(raf)
  }, [playing, total, valsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const startPlay = () => { setT(0); setPlaying(true) }
  const bump = d => { setPlaying(false); setT(v => Math.max(0, Math.min(total, v + d))) }
  const seekBar = e => {
    const r = e.currentTarget.getBoundingClientRect()
    setPlaying(false); setT(Math.max(0, Math.min(total, ((e.clientX - r.left) / r.width) * total)))
  }
  const onKey = e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); bump(e.shiftKey ? -10 : -100) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); bump(e.shiftKey ? 10 : 100) }
    else if (e.key === ' ') { e.preventDefault(); playing ? setPlaying(false) : startPlay() }
  }
  const editParam = (key, value) => {
    const d = defs[key]
    const v = Math.max(d.min, Math.min(d.max, value))
    setPlaying(false)
    setEdits(prev => ({ ...prev, [variantId]: { ...prev[variantId], [key]: v } }))
  }
  const resetParam = key => setEdits(prev => {
    const next = { ...(prev[variantId] || {}) }; delete next[key]
    return { ...prev, [variantId]: next }
  })
  const resetAll = () => setEdits({})

  const buildDiff = () => {
    const out = []
    for (const vId of Object.keys(edits)) {
      const idx = scene.variants ? scene.variants.findIndex(x => x.id === vId) : 0
      if (idx < 0) continue
      const d = scene.defaults(idx, env)
      const sub = []
      for (const k of Object.keys(edits[vId] || {})) {
        if (d[k] && edits[vId][k] !== d[k].value) sub.push(`  ${d[k].label}: ${d[k].value}${d[k].unit} → ${edits[vId][k]}${d[k].unit}`)
      }
      if (sub.length) { out.push(scene.variants ? `${scene.variants[idx].label}:` : ''); out.push(...sub) }
    }
    if (!out.length) return 'No changes yet — drag a dial to change a timing, then come back.'
    return `${scene.label} — apply these (${portrait ? 'phone' : 'desktop'} timings):\n` + out.join('\n')
  }
  const anyEdits = Object.values(edits).some(v => Object.keys(v || {}).length)
  const StageComp = scene.Stage
  const seg = parts.map((p, i) => ({ name: p.name, color: p.color, w: ((p.end - (i ? parts[i - 1].end : 0)) / total) * 100 }))

  return (
    <div style={S.wrap} tabIndex={0} onKeyDown={onKey}>
      {/* variant picker */}
      {scene.variants && (
        <div style={S.variants}>
          {scene.variants.map((v, i) => (
            <button key={v.id} onClick={() => setVi(i)} style={{ ...S.vbtn, ...(i === vi ? S.vbtnOn : {}) }}>{i + 1}. {v.label}</button>
          ))}
        </div>
      )}

      <div style={S.cols}>
        {/* left: stage + transport */}
        <div style={S.left}>
          <div style={S.stageWrap}><div ref={rootRef}><StageComp variantIndex={vi} env={env} vals={vals} /></div></div>

          <div style={S.bar} onClick={seekBar} title="click to seek">
            {seg.map((s, i) => <div key={i} style={{ width: `${s.w}%`, background: s.color, ...S.segBase }}>{s.name}</div>)}
            <div style={{ ...S.playhead, left: `${(t / total) * 100}%` }} />
          </div>
          <input type="range" min={0} max={Math.round(total)} step={10} value={Math.round(t)} onChange={e => { setPlaying(false); setT(Number(e.target.value)) }} style={S.range} />

          <div style={S.controls}>
            <button style={S.btn} onClick={() => bump(-100)}>⏮ −100</button>
            <button style={S.btn} onClick={() => bump(-10)}>◀ −10</button>
            <button style={{ ...S.btn, ...S.playBtn }} onClick={() => (playing ? setPlaying(false) : startPlay())}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
            <button style={S.btn} onClick={() => bump(10)}>+10 ▶</button>
            <button style={S.btn} onClick={() => bump(100)}>+100 ⏭</button>
            <button style={S.btn} onClick={() => { setPlaying(false); setT(0) }}>↺ Start</button>
          </div>

          <div style={S.readout}>
            <span style={S.bigT}>{fmt(t)}</span><span style={S.ofTotal}> / {fmt(total)}</span>
            <span style={{ ...S.tag, background: partName === 'preview' ? '#2e7d4f' : partName === 'dive' ? '#b8470f' : '#d98a3a' }}>{partName.toUpperCase()}{detail ? ` · ${detail}` : ''}</span>
          </div>
        </div>

        {/* right: live-edit dials */}
        <div style={S.right}>
          <div style={S.dialHead}>Live timing — drag a dial, it re-times instantly</div>
          {Object.keys(defs).map(k => {
            const d = defs[k], cur = vals[k], changed = cur !== d.value
            return (
              <div key={k} style={S.dialRow}>
                <div style={S.dialTop}>
                  <span style={S.dialLabel}>{d.label}{changed && <button style={S.reset} onClick={() => resetParam(k)} title="reset">↺</button>}</span>
                  <span style={{ ...S.dialVal, color: changed ? '#b8470f' : '#1a1612' }}>
                    <input type="number" value={cur} min={d.min} max={d.max} step={d.step} onChange={e => editParam(k, Number(e.target.value))} style={S.num} />{d.unit}
                  </span>
                </div>
                <input type="range" min={d.min} max={d.max} step={d.step} value={cur} onChange={e => editParam(k, Number(e.target.value))} style={{ ...S.range, accentColor: changed ? '#b8470f' : '#9a948c', margin: '2px 0 0' }} />
              </div>
            )
          })}
          <div style={S.saveRow}>
            <button style={{ ...S.btn, ...S.saveBtn, opacity: anyEdits ? 1 : 0.5 }} onClick={() => setShowSave(s => !s)}>{showSave ? 'Hide' : '💾 Save changes'}</button>
            {anyEdits && <button style={S.btn} onClick={resetAll}>Reset all</button>}
          </div>
          {showSave && (
            <div>
              <div style={S.saveHint}>Copy this and send it to me (or just read it out) — I'll bake it into the live site:</div>
              <textarea readOnly value={buildDiff()} style={S.saveBox} onFocus={e => e.target.select()} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const S = {
  wrap: { outline: 'none' },
  variants: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  vbtn: { fontSize: 12.5, padding: '6px 11px', border: '1px solid #d8d2c8', borderRadius: 6, background: '#fff', color: '#3a342c', cursor: 'pointer' },
  vbtnOn: { background: '#b8470f', color: '#fff', border: '1px solid #b8470f', fontWeight: 700 },
  cols: { display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'flex-start' },
  left: { flex: '1 1 380px', maxWidth: 480 },
  right: { flex: '1 1 300px', maxWidth: 360, background: '#faf8f5', border: '1px solid #ece8e1', borderRadius: 10, padding: '14px 16px' },
  stageWrap: { maxWidth: 460, margin: '0 auto 12px' },
  bar: { position: 'relative', display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', userSelect: 'none', fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: '#fff', fontWeight: 700 },
  segBase: { display: 'grid', placeItems: 'center', minWidth: 0, overflow: 'hidden' },
  playhead: { position: 'absolute', top: -3, bottom: -3, width: 2, background: '#1a1612', boxShadow: '0 0 0 1px #fff', transform: 'translateX(-1px)' },
  range: { width: '100%', margin: '10px 0 4px', accentColor: '#b8470f' },
  controls: { display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center', margin: '6px 0 12px' },
  btn: { fontSize: 12.5, padding: '6px 11px', border: '1px solid #d8d2c8', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#3a342c' },
  playBtn: { background: '#1a1612', color: '#fff', border: '1px solid #1a1612', minWidth: 92, fontWeight: 700 },
  readout: { textAlign: 'center', borderTop: '1px solid #ece8e1', paddingTop: 10 },
  bigT: { fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums' },
  ofTotal: { fontSize: 15, color: '#9a948c' },
  tag: { display: 'inline-block', color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', padding: '3px 11px', borderRadius: 4, marginLeft: 10, verticalAlign: 'middle' },
  dialHead: { fontSize: 12, fontWeight: 700, color: '#6b645c', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 },
  dialRow: { marginBottom: 14 },
  dialTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dialLabel: { fontSize: 13.5, fontWeight: 600, color: '#1a1612' },
  dialVal: { fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  num: { width: 64, fontSize: 13, padding: '2px 5px', border: '1px solid #d8d2c8', borderRadius: 4, textAlign: 'right', marginRight: 3, fontVariantNumeric: 'tabular-nums' },
  reset: { marginLeft: 6, fontSize: 11, border: 'none', background: 'none', color: '#b8470f', cursor: 'pointer', padding: 0 },
  saveRow: { display: 'flex', gap: 8, marginTop: 4 },
  saveBtn: { background: '#2e7d4f', color: '#fff', border: '1px solid #2e7d4f', fontWeight: 700 },
  saveHint: { fontSize: 12, color: '#6b645c', margin: '12px 0 6px' },
  saveBox: { width: '100%', minHeight: 110, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12, padding: 9, border: '1px solid #d8d2c8', borderRadius: 6, resize: 'vertical', boxSizing: 'border-box' },
}
