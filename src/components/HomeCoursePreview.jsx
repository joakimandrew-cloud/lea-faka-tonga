import { useEffect, useRef, useState } from 'react'

const CLIPS = [
  { id: 'read', label: 'Read a lesson', rate: .75 },
  { id: 'drills', label: 'Interactive exercises', rate: .7 },
  { id: 'vocab', label: 'Vocabulary cards', rate: .9 },
  { id: 'quiz', label: 'Chapter quiz', rate: .9 },
]
const MOTION = '(prefers-reduced-motion: reduce)'
const PHONE = '(max-width:680px)'
const matches = query => typeof window !== 'undefined' && window.matchMedia(query).matches

export default function HomeCoursePreview({ active }) {
  const rootRef = useRef(null)
  const videoRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(() => matches(MOTION))
  const [portrait, setPortrait] = useState(() => matches(PHONE))
  const [visible, setVisible] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [failedFile, setFailedFile] = useState(null)
  const clip = CLIPS[index]
  const file = `${import.meta.env.BASE_URL}feat-${clip.id}${portrait ? '-mobile' : ''}`
  const failed = failedFile === file

  useEffect(() => {
    const motion = window.matchMedia(MOTION)
    const phone = window.matchMedia(PHONE)
    const onMotion = event => setPaused(event.matches)
    const onPhone = event => setPortrait(event.matches)
    const onVisibility = () => setDocumentVisible(!document.hidden)
    motion.addEventListener('change', onMotion)
    phone.addEventListener('change', onPhone)
    document.addEventListener('visibilitychange', onVisibility)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .1 })
    observer.observe(rootRef.current)
    return () => {
      observer.disconnect()
      motion.removeEventListener('change', onMotion)
      phone.removeEventListener('change', onPhone)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    let cancelled = false
    video.playbackRate = clip.rate
    if (active && visible && documentVisible && !paused && !failed) {
      video.play().catch(error => {
        if (!cancelled && error.name !== 'AbortError') setPaused(true)
      })
    } else video.pause()
    return () => { cancelled = true; video.pause() }
  }, [active, visible, documentVisible, paused, failed, file, clip.rate])

  return (
    <div ref={rootRef} className="xp-preview" data-clip={clip.id}>
      <div className="xp-toolbar">
        <span className="xp-label">{clip.label} · {index + 1} / {CLIPS.length}</span>
        <button className="xp-pause" type="button" disabled={failed} onClick={() => setPaused(value => !value)}>
          {failed ? 'Unavailable' : paused ? 'Play preview' : 'Pause preview'}
        </button>
      </div>
      <div className="xp-viewport" data-entrance-visual>
        <video
          key={file}
          ref={videoRef}
          muted playsInline
          preload={active ? 'metadata' : 'none'}
          src={active ? `${file}.mp4` : undefined}
          poster={`${file}-poster.jpg`}
          hidden={failed}
          aria-label={`Animated course demonstration: ${clip.label.toLowerCase()}`}
          onEnded={() => { if (active) setIndex(value => (value + 1) % CLIPS.length) }}
          onError={() => { if (active) setFailedFile(file) }}
        />
        <p className="xp-error" hidden={!failed}>Preview unavailable. You can still start Lesson 1 above.</p>
      </div>
    </div>
  )
}
