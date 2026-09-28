import { createElement } from 'react'
import { okinafy } from '@app/lib/okinafy.js'

/** Tongan text. The book stores the fakauʻa as an ASCII apostrophe; display
 *  normalises it (DECISIONS 2026-06-20), exactly as the live site does. */
export default function T({ children, as: Tag = 'span', className = '', ...rest }) {
  const text = typeof children === 'string' ? okinafy(children) : children
  return createElement(Tag, { lang: 'to', className: `to ${className}`, ...rest }, text)
}


/** Render a book string with *italics* as Tongan spans and the rest as-is. */
export function Inline({ text, tClass = '' }) {
  if (!text) return null
  // Display-only: straight double quotes become curly.
  const parts = String(text).replace(/"([^"]*)"/g, '\u201c$1\u201d').split(/(\*[^*]+\*)/g)
  return parts.map((p, i) =>
    p.startsWith('*') && p.endsWith('*') && p.length > 2
      ? <T key={i} className={tClass}>{p.slice(1, -1)}</T>
      : <span key={i}>{p}</span>,
  )
}
