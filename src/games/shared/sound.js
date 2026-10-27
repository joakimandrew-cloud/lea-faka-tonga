/**
 * Word Rain: short synthesised sounds (Web Audio API, no audio files).
 *
 * Nothing here makes a sound or even creates an AudioContext until unlock()
 * is called from a tap or key press (browsers only allow audio after one).
 * Every call is wrapped so a browser without Web Audio, or one that refuses
 * it, simply plays nothing. Muting is the page's job: it calls play() only
 * when sound is on.
 */

let ctx = null
let master = null

function context() {
  return ctx && ctx.state !== 'closed' ? ctx : null
}

/** Create (or wake) the audio context. Call it from a user gesture only. */
export function unlock() {
  try {
    if (!context()) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return false
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.5
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return true
  } catch {
    ctx = null
    return false
  }
}

function tone({ type = 'sine', from, to = from, at = 0, dur = 0.12, peak = 0.3, attack = 0.005 }) {
  const c = context()
  if (!c || !master) return
  const t0 = c.currentTime + at
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise({ at = 0, dur = 0.12, peak = 0.2, freq = 400 }) {
  const c = context()
  if (!c || !master) return
  const t0 = c.currentTime + at
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = freq
  const g = c.createGain()
  g.gain.setValueAtTime(peak, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter)
  filter.connect(g)
  g.connect(master)
  src.start(t0)
  src.stop(t0 + dur + 0.02)
}

const SOUNDS = {
  // A soft pop: a quick bright blip that drops, with a breath of air. The
  // pitch climbs a little with the streak multiplier.
  pop: (mult = 1) => {
    const lift = 1 + 0.06 * (Math.min(4, mult) - 1)
    tone({ type: 'sine', from: 880 * lift, to: 420 * lift, dur: 0.09, peak: 0.32 })
    tone({ type: 'triangle', from: 1320 * lift, to: 990 * lift, at: 0.02, dur: 0.07, peak: 0.08 })
    noise({ dur: 0.05, peak: 0.06, freq: 2400 })
  },
  // A low thud: a falling sine with a muffled knock.
  thud: () => {
    tone({ type: 'sine', from: 150, to: 52, dur: 0.24, peak: 0.5, attack: 0.004 })
    noise({ dur: 0.16, peak: 0.22, freq: 260 })
  },
  // A rising chime: three notes up a major chord, then the octave.
  chime: () => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone({ type: 'triangle', from: f, at: i * 0.085, dur: 0.42, peak: 0.16, attack: 0.01 })
      tone({ type: 'sine', from: f * 2, at: i * 0.085, dur: 0.25, peak: 0.04, attack: 0.01 })
    })
  },
  // A latch: a bolt sliding home, two dry clicks (Sentence Lock's lock-in).
  // `open` plays the reverse, the shackle springing free: a lower click, then a lift.
  latch: (open = false) => {
    noise({ dur: 0.03, peak: 0.22, freq: open ? 1800 : 3200 })
    tone({ type: 'square', from: open ? 520 : 1400, to: open ? 380 : 900, dur: 0.03, peak: 0.05 })
    noise({ at: 0.055, dur: 0.035, peak: 0.26, freq: open ? 1200 : 2200 })
    tone({ type: 'triangle', from: open ? 300 : 700, to: open ? 600 : 520, at: 0.055, dur: open ? 0.12 : 0.05, peak: 0.08 })
  },
  // The countdown: a short tick, and a higher one for "go".
  tick: (high = false) => tone({ type: 'sine', from: high ? 988 : 660, dur: high ? 0.16 : 0.08, peak: 0.16 }),
}

/** Play a named sound if audio has been unlocked; otherwise do nothing. */
export function play(name, ...args) {
  try {
    if (!context()) return
    SOUNDS[name]?.(...args)
  } catch {
    // A sound is never worth an error.
  }
}
