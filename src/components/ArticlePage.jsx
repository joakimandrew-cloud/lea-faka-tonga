/**
 * ArticlePage: renders one of the plain-JS documents in src/seo/pages/ in the
 * app's chapter reading voice.
 *
 * The documents are data, not JSX, because scripts/prerender.mjs has to render
 * the SAME content as static HTML at build time (a crawler that runs no JS must
 * read the whole page). One source, two renderers, no drift.
 *
 * Every class here is already in the stylesheet: `.reading-page` supplies the
 * chapter tokens, the table markup mirrors BookChapterContent's `td`/`th`
 * renderers, and the example blocks reuse `.example-block` / `.example-pair`
 * exactly as remark-examples emits them for a lesson. No new CSS.
 */

import { Link } from 'react-router-dom'
import { tokenizeInline } from '../seo/inline'
import { okinafy, looksTongan } from '../lib/okinafy'

// Italics mark Tongan in this book, so an emphasised span is normalised to the
// real fakauʻa and tagged lang="to" when it really is Tongan (the same test
// BookChapterContent applies to a chapter's own italics).
function Inline({ text }) {
  return (
    <>
      {tokenizeInline(text).map((tok, i) => {
        if (tok.t === 'strong') {
          return (
            <strong key={i} className="text-[var(--text-strong)] font-semibold">
              {okinafy(tok.v)}
            </strong>
          )
        }
        if (tok.t === 'em') {
          const fixed = okinafy(tok.v)
          return (
            <em key={i} className="font-tongan italic" lang={looksTongan(fixed) ? 'to' : undefined}>
              {fixed}
            </em>
          )
        }
        return <span key={i}>{tok.v}</span>
      })}
    </>
  )
}

function Block({ block }) {
  if (block.k === 'h2') {
    return (
      <h2 className="text-lg text-[var(--accent)] font-semibold mt-6 mb-3 border-b border-[var(--border)] pb-1">
        <Inline text={block.text} />
      </h2>
    )
  }
  if (block.k === 'h3') {
    return (
      <h3 className="text-base text-[var(--accent)]/90 font-semibold mt-5 mb-2">
        <Inline text={block.text} />
      </h3>
    )
  }
  if (block.k === 'p') {
    return (
      <p className="text-[var(--text-strong)] leading-relaxed mb-3">
        <Inline text={block.text} />
      </p>
    )
  }
  if (block.k === 'note') {
    return (
      <blockquote className="border-l-2 border-[var(--accent)]/40 bg-[var(--accent)]/5 pl-4 py-2 my-3 text-[var(--text-muted)] text-sm">
        <Inline text={block.text} />
      </blockquote>
    )
  }
  if (block.k === 'ex') {
    return (
      <div className="example-block">
        {block.items.map((item, i) => (
          <div key={i} className="example-pair">
            <div className="example-tongan">
              <em className="font-tongan italic" lang="to">
                {okinafy(item.ton)}
              </em>
            </div>
            <div className="example-english">{item.en}</div>
          </div>
        ))}
      </div>
    )
  }
  if (block.k === 'table') {
    return (
      <div className="ch-table-wrap overflow-x-auto my-4">
        <table className="ch-table border-collapse">
          <thead className="bg-[var(--bg-tone)]">
            <tr>
              {block.headers.map((h, i) => (
                <th
                  key={i}
                  className="border border-[var(--border)] px-3 py-2 text-left text-[var(--accent)] font-semibold"
                >
                  <Inline text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="border border-[var(--border)] px-3 py-2 text-[var(--text-strong)]"
                    data-label={block.headers[ci] || undefined}
                  >
                    <Inline text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (block.k === 'next') {
    return (
      <ul className="list-disc list-inside text-[var(--text-strong)] mb-3 space-y-1">
        {block.items.map((item, i) => (
          <li key={i} className="leading-relaxed">
            <Link
              to={item.to}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    )
  }
  return null
}

export default function ArticlePage({ doc }) {
  return (
    <div className="reading-page">
      <div className="mb-6">
        {doc.eyebrow && (
          <div className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2">
            {doc.eyebrow}
          </div>
        )}
        <h1 className="text-xl text-[var(--text-strong)] mb-3">{doc.h1}</h1>
        {doc.chips?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {doc.chips.map((chip, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 border border-[var(--border)] text-[var(--text-muted)]"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        {doc.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </div>
  )
}
