// Minimal inline markup, shared by the two renderers that have to agree.
//
// The book's convention is that italics mark Tongan, so `*…*` becomes a Tongan
// span (fakauʻa normalised, lang="to") and `**…**` is bold. Everything else is
// plain text. This is deliberately tiny: it exists so the React page
// (src/components/ArticlePage.jsx) and the build-time prerenderer
// (scripts/prerender.mjs) can render the SAME source string, rather than each
// carrying its own half-implementation that drifts.
//
// Plain JS, no imports, so `node` can load it directly during the build.

export function tokenizeInline(text) {
  const out = []
  let rest = String(text == null ? '' : text)
  while (rest.length) {
    const bold = rest.match(/^\*\*([^*]+)\*\*/)
    if (bold) {
      out.push({ t: 'strong', v: bold[1] })
      rest = rest.slice(bold[0].length)
      continue
    }
    const em = rest.match(/^\*([^*]+)\*/)
    if (em) {
      out.push({ t: 'em', v: em[1] })
      rest = rest.slice(em[0].length)
      continue
    }
    // Consume up to (not including) the next `*`, always at least one char so
    // an unmatched asterisk cannot spin the loop.
    const next = rest.slice(1).search(/\*/)
    const chunk = next === -1 ? rest : rest.slice(0, next + 1)
    out.push({ t: 'text', v: chunk })
    rest = rest.slice(chunk.length)
  }
  return out
}
