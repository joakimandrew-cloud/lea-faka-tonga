import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkExamples from '../lib/remark-examples'
import remarkDrillAnchors from '../lib/remark-drill-anchors'
import ChapterDrillAnchor from './ChapterDrillAnchor'

// Bulk-load every chapter markdown file at build time. Vite inlines each
// file's contents as a string, so no runtime fetch is needed.
const chapterFiles = import.meta.glob('../../book/Chapter-*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const chapterMarkdown = {}
for (const [path, content] of Object.entries(chapterFiles)) {
  const match = path.match(/Chapter-(\d+)\.md$/)
  if (match) {
    chapterMarkdown[parseInt(match[1], 10)] = content
  }
}

function stripLeadingTitle(md) {
  if (!md) return md
  return md.replace(/^##\s+Chapter\s+\d+:.*?\n+/m, '')
}

// Pandoc fenced divs (`::: {.examples}`) aren't understood by remark-directive
// out of the box — it expects `:::examples`. Rewrite the opener so the rest of
// the pipeline can treat this as a container directive; the PDF/EPUB toolchain
// continues to read the source form verbatim.
function normalizeExamplesFence(md) {
  if (!md) return md
  return md.replace(/^:::\s*\{\.examples\}\s*$/gm, ':::examples')
}

// Styled renderers that match the warm ivory theme.
const baseComponents = {
  h1: ({ children }) => (
    <h1 className="text-xl text-[var(--accent)] font-semibold mt-6 mb-3">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg text-[var(--accent)] font-semibold mt-6 mb-3 border-b border-[var(--border)] pb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base text-[var(--accent)]/90 font-semibold mt-5 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm text-[var(--accent)] uppercase tracking-wider mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-[var(--text-strong)] leading-relaxed mb-3">{children}</p>
  ),
  em: ({ children }) => (
    <em className="font-tongan italic">{children}</em>
  ),
  strong: ({ children }) => (
    <strong className="text-[var(--text-strong)] font-semibold">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-[var(--text-strong)] mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-[var(--text-strong)] mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[var(--accent)]/40 bg-[var(--accent)]/5 pl-4 py-2 my-3 text-[var(--text-muted)] text-sm">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-[var(--border)] my-6" />,
  code: ({ inline, children }) =>
    inline ? (
      <code className="font-tongan italic bg-[var(--bg-tone)] px-1 py-0.5 rounded">{children}</code>
    ) : (
      <pre className="bg-[var(--bg-tone)] border border-[var(--border)] p-3 my-3 overflow-x-auto text-sm text-[var(--text-strong)]">
        <code>{children}</code>
      </pre>
    ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[var(--bg-tone)]">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-[var(--border)] px-3 py-2 text-left text-[var(--accent)] font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-[var(--border)] px-3 py-2 text-[var(--text-strong)]">{children}</td>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline">{children}</a>
  ),
}

/**
 * Render the full book chapter for a given chapter number, styled to match
 * the app. Returns null if no markdown file was found for that chapter.
 *
 * remark-drill-anchors injects synthetic <chapter-drill-anchor> nodes into
 * the parsed tree based on src/data/drill-map.json. The components map
 * routes that custom element to ChapterDrillAnchor with the chapter number
 * passed through as a prop (so each anchor knows its chapter context).
 */
export default function BookChapterContent({ chapterNum }) {
  const md = chapterMarkdown[chapterNum]

  const remarkPlugins = useMemo(
    () => [
      remarkGfm,
      remarkDirective,
      remarkExamples,
      [remarkDrillAnchors, { chapterNum }],
    ],
    [chapterNum]
  )

  const components = useMemo(
    () => ({
      ...baseComponents,
      'chapter-drill-anchor': (props) => {
        const drillId =
          props?.node?.properties?.dataDrillId ||
          props?.node?.properties?.['data-drill-id']
        if (!drillId) return null
        return <ChapterDrillAnchor drillId={drillId} chapterNum={chapterNum} />
      },
    }),
    [chapterNum]
  )

  if (!md) return null

  return (
    <div className="mb-8">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        components={components}
      >
        {normalizeExamplesFence(stripLeadingTitle(md))}
      </ReactMarkdown>
    </div>
  )
}
