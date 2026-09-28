import quickPractice from '@app/data/quick-practice.json'
import drillMap from '@app/data/drill-map.json'
import { slugify } from '@app/lib/remark-drill-anchors.js'
import { parseInlineTokens, parseLessonContent } from './lesson-content.js'

const files = import.meta.glob('@book/Chapter-*.md', { query: '?raw', import: 'default' })

export async function loadLesson(n) {
  const key = Object.keys(files).find(k => k.endsWith(`Chapter-${String(n).padStart(2, '0')}.md`))
  if (!key) return null
  return parseLessonContent(await files[key](), {
    chapter: n,
    quickPractices: quickPractice[String(n)] || [],
    drillAnchors: drillMap[String(n)] || [],
    slugify,
  })
}

// Inline markdown: **bold**, *italic* (Tongan), \_ escapes.
export function tokenizeInline(text) {
  // Display-only: straight double quotes become curly. The words are untouched.
  text = text.replace(/"([^"]*)"/g, '\u201c$1\u201d')
  return parseInlineTokens(text)
}
