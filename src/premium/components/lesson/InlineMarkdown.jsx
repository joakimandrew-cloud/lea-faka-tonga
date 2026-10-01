import { okinafy, looksTongan } from '@app/lib/okinafy.js'
import { tokenizeInline } from '../../lib/book.js'
import T from '../T.jsx'

// The only raw HTML the book uses: a <br> and an English line under the Tongan
// inside table cells (105 cells across 13 lessons).
const HTML_BITS = /<br\s*\/?>|<span class="translation">([\s\S]*?)<\/span>/g

export function Md({ text, renderSlot }) {
  text = String(text ?? '')
  if (text.includes('<')) {
    const out = []
    let last = 0
    for (const m of text.matchAll(HTML_BITS)) {
      if (m.index > last) out.push(<Md key={out.length} text={text.slice(last, m.index)} renderSlot={renderSlot} />)
      out.push(m[0].startsWith('<br') ? <br key={out.length} /> : <span key={out.length} className="md-tr"><Md text={okinafy(m[1])} renderSlot={renderSlot} /></span>)
      last = m.index + m[0].length
    }
    if (out.length) {
      if (last < text.length) out.push(<Md key={out.length} text={text.slice(last)} renderSlot={renderSlot} />)
      return out
    }
  }
  const tokenText = token => token.v ?? (token.children || []).map(tokenText).join('')
  const renderText = (value, key, tongan) => {
    const normalized = tongan ? okinafy(value) : value
    if (!renderSlot || !/\uE000\d+\uE001/.test(normalized)) return <span key={key}>{normalized}</span>
    const parts = normalized.split(/\uE000(\d+)\uE001/g)
    return (
      <span key={key}>
        {parts.map((part, index) => index % 2
          ? renderSlot(Number(part), `${key}-${index}`)
          : part)}
      </span>
    )
  }
  const render = (tok, i, tongan = false) => {
    const isTongan = tok.t === 'em' && looksTongan(tokenText(tok).replace(/[()]/g, ''))
    const children = tok.children?.map((child, index) => render(child, index, tongan || isTongan))
    if (tok.t === 'bold') return <strong key={i} className="md-b">{children}</strong>
    if (tok.t === 'em') return isTongan ? <T key={i}>{children}</T> : <em key={i}>{children}</em>
    if (tok.t === 'link') return <a key={i} href={tok.href} className="xref">{children}</a>
    if (tok.t === 'del') return <del key={i}>{children}</del>
    if (tok.t === 'code') return <code key={i}>{tongan ? okinafy(tok.v) : tok.v}</code>
    return renderText(tok.v, i, tongan)
  }
  return tokenizeInline(text).map(render)
}
