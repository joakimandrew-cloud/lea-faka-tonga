import { motion as Motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import T from '../T.jsx'
import { okinafy } from '@app/lib/okinafy.js'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { KupesiTile } from '../Kupesi.jsx'

function cardTextSize(text) {
  const clean = String(text ?? '').replace(/[*_~`]+/g, '').trim()
  const longest = Math.max(0, ...clean.split(/\s+/).map(word => [...word].length))
  const length = [...clean].length
  if (longest >= 13 || length >= 36) return 'is-extra-long'
  if (longest >= 9 || length >= 20) return 'is-long'
  return ''
}

// meaning (optional, book-vocabulary decks only): { count, also } when the same
// Tongan word is another card in the course. Lesson decks and the homepage
// film never pass it, so they render exactly as before.
export default function PracticeCard({ word, flipped, onFlip, onSwipe, front, depth, demo = false, meaning }) {
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(0)
  const rotation = useTransform(x, [-240, 240], [-14, 14])
  const knownOpacity = useTransform(x, [30, 140], [0, 1])
  const againOpacity = useTransform(x, [-140, -30], [1, 0])
  const top = depth === 0
  const visibleIsTongan = (front === 'to') !== Boolean(flipped)
  const spokenFace = visibleIsTongan ? okinafy(word.to) : [word.en, word.type].filter(Boolean).join('. ')

  const end = (_, info) => {
    if (info.offset.x > 120 || info.velocity.x > 600) onSwipe('known')
    else if (info.offset.x < -120 || info.velocity.x < -600) onSwipe('again')
    else animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
  }
  const count = meaning?.count
  const markOf = () => meaning ? <><span className="visually-hidden">, has {count} meanings in this course</span><span className="fc-meanings" aria-hidden="true">{count} meanings</span></> : null
  const alsoOf = (apart) => meaning?.also?.length ? <span className={`fc-also${apart ? ' is-apart' : ''}`}>also means: <Md text={meaning.also.join(' · ')} /></span> : null
  const tongan = <><T className={`fc-to ${cardTextSize(word.to)}`.trim()}>{word.to}</T>{markOf()}<span className="fc-sub">Tongan</span></>
  const english = <><span className={`fc-en ${cardTextSize(word.en)}`.trim()}><Md text={word.en} /></span><span className="fc-type"><Md text={word.type} /></span></>

  return (
    <Motion.div
      className={`fc ${top ? 'is-top' : ''}${reduceMotion ? ' is-reduced-motion' : ''}${flipped ? ' is-flipped' : ''}`}
      role={top && !demo ? 'button' : undefined}
      tabIndex={top && !demo ? 0 : undefined}
      aria-label={top && !demo ? `Turn card: ${spokenFace}` : undefined}
      onKeyDown={top && !demo ? event => { if (event.key === ' ') { event.preventDefault(); event.stopPropagation(); onFlip() } else if (event.key === 'Enter') { event.stopPropagation() } } : undefined}
      aria-hidden={!top}
      style={top ? { x, rotate: rotation, zIndex: 10 } : { zIndex: 10 - depth }}
      initial={demo || reduceMotion ? false : { scale: .9, y: 30, opacity: 0 }}
      animate={{ scale: 1 - depth * .05, y: depth * -16, opacity: depth > 2 ? 0 : 1 }}
      variants={{ gone: direction => ({ x: direction * 520, rotate: direction * 18, opacity: 0, transition: { duration: .45, ease: [.4, 0, .2, 1] } }) }}
      exit={reduceMotion ? undefined : 'gone'}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      drag={top && !demo ? 'x' : false}
      dragSnapToOrigin={false}
      onDragEnd={demo ? undefined : end}
      onTap={top && !demo ? onFlip : undefined}
    >
      <Motion.div className="fc-inner" initial={demo ? false : undefined} animate={{ rotateY: reduceMotion ? 0 : flipped ? 180 : 0 }} transition={{ duration: .6, ease: [.16, 1, .3, 1] }}>
        <div className="fc-face fc-front" aria-hidden={flipped}>
          <span className="fc-corner" aria-hidden="true"><KupesiTile kind="leaf" framed /></span>
          {front === 'to' ? tongan : english}
          <span className="fc-tap">Tap to turn</span>
        </div>
        <div className="fc-face fc-back" aria-hidden={!flipped}>
          {front === 'to' && <T className="fc-mini">{word.to}</T>}
          {front === 'to' && meaning && <span className="fc-mini-meaning">{markOf()}{alsoOf(false)}</span>}
          {front === 'to' ? english : tongan}
          {front !== 'to' && alsoOf(true)}
        </div>
      </Motion.div>
      {top && (
        <>
          <Motion.span className="fc-stamp known" style={{ opacity: knownOpacity }}>Got it</Motion.span>
          <Motion.span className="fc-stamp again" style={{ opacity: againOpacity }}>Again</Motion.span>
        </>
      )}
    </Motion.div>
  )
}

