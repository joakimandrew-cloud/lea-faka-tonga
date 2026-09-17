import { useEffect, useRef } from 'react'

const point = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`

export default function HomeLessonArrow({ openingRef, titleRef, ctaRef }) {
  const svgRef = useRef(null)
  useEffect(() => {
    const opening = openingRef.current, title = titleRef.current, cta = ctaRef.current, svg = svgRef.current
    let disposed = false, scheduled = 0
    function paint() {
      if (disposed || !opening || !title || !cta) return
      const origin = opening.getBoundingClientRect()
      const local = r => ({ left: r.left - origin.left, right: r.right - origin.left, top: r.top - origin.top, bottom: r.bottom - origin.top, height: r.height })
      const range = document.createRange()
      range.selectNodeContents(title)
      const rects = [...range.getClientRects()].filter(r => r.width > 0).map(local)
      if (!rects.length || !origin.width || !origin.height) { svg.style.visibility = 'hidden'; return }
      const mobile = window.innerWidth < 821
      const last = mobile ? rects.reduce((a, b) => a.right > b.right ? a : b) : rects.at(-1)
      const button = local(cta.getBoundingClientRect()), card = local(cta.closest('.ld-door-site').getBoundingClientRect())
      let sx = last.right + (mobile ? 10 : 16), sy = last.top + last.height * .8
      if (sx > origin.width - 70) { sx = last.right - 4; sy = Math.min(last.bottom + 7, card.top - 9) }
      const ex = button.right + (mobile ? 7 : 10), ey = button.top + button.height / 2
      const x = mobile ? origin.width - 18 : card.right + 10
      const bend = sy + Math.min(mobile ? 64 : 94, (ey - sy) * .65)
      const path = mobile
        ? `M ${point(sx, sy)} C ${point(x, sy + 5)} ${point(x, sy + 38)} ${point(x, bend)} C ${point(x, ey - 24)} ${point(ex + 15, ey)} ${point(ex, ey)}`
        : `M ${point(sx, sy)} C ${point(sx + 82, sy + 3)} ${point(x, sy + 48)} ${point(x, bend)} C ${point(x, ey - 16)} ${point(ex + 28, ey)} ${point(ex, ey)}`
      const back = mobile ? 11 : 19, wing = mobile ? 8 : 14
      svg.setAttribute('viewBox', `0 0 ${origin.width} ${origin.height}`)
      svg.setAttribute('width', origin.width)
      svg.setAttribute('height', origin.height)
      svg.style.visibility = 'visible'
      const [shaft, head] = svg.querySelectorAll('path')
      shaft.setAttribute('d', path)
      head.setAttribute('d', `M ${point(ex + back, ey - wing)} L ${point(ex, ey)} L ${point(ex + back, ey + wing)}`)
      for (const p of [shaft, head]) p.setAttribute('stroke-width', mobile ? 8 : 12)
    }
    function schedule() { cancelAnimationFrame(scheduled); scheduled = requestAnimationFrame(paint) }
    const observer = new ResizeObserver(schedule)
    for (const element of [opening, title, cta]) if (element) observer.observe(element)
    window.addEventListener('resize', schedule)
    document.fonts.ready.then(() => { if (!disposed) schedule() })
    paint()
    return () => { disposed = true; cancelAnimationFrame(scheduled); observer.disconnect(); window.removeEventListener('resize', schedule) }
  }, [openingRef, titleRef, ctaRef])
  return (
    <svg ref={svgRef} className="ld-lesson-arrow" aria-hidden="true" focusable="false" fill="none" stroke="#ed7926" strokeLinecap="round" strokeLinejoin="round">
      <path /><path />
    </svg>
  )
}
