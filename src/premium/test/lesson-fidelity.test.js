import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { cwd } from 'node:process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import { unified } from 'unified'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkExamples from '../../lib/remark-examples.js'
import { parseLessonContent, plainInline } from '../lib/lesson-content.js'

const app = cwd()
const inventory = JSON.parse(fs.readFileSync(path.join(app, 'src/premium/test/fixtures/Source-Inventory.json')))
const quickPractice = JSON.parse(fs.readFileSync(path.join(app, 'src/data/quick-practice.json')))
const drillMap = JSON.parse(fs.readFileSync(path.join(app, 'src/data/drill-map.json')))
// The September 26 teaching oracle stays frozen. These two exact source hashes
// approve only the Lesson 39 pointing pilot added on September 30.
const approvedPracticeHashes = {
  'src/data/drill-map.json': '8e49fa842b937b09d19194fee1c1f8a4c999d7152f016307519646e852f09ae4',
  'src/drills/registry.js': '7258b27368ce76bfa4a67e1b3f872b4f113705aed4f6f37aac99ddbf16658a30'
}
const productionExamples = unified().use(remarkParse).use(remarkGfm).use(remarkDirective).use(remarkExamples)
const sha256 = file => createHash('sha256').update(fs.readFileSync(path.join(app, file))).digest('hex')

const slugify = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[\u2018\u2019\u02BB'`]/g, '').replace(/[/. :,;\u2014\u2013]/g, ' ')
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

function listText(items) {
  return items.flatMap(item => [item.text, ...item.children.flatMap(child => listText(child.items))])
}

function sourceText(lesson) {
  const quickRanges = lesson.quickPractice.map(block => block.sourceRange)
  const withinQuickPractice = block => quickRanges.some(range => block.position && block.position.start >= range.start && block.position.start < range.end)
  return lesson.semanticBlocks
    .filter(block => block.position?.start < lesson.contentRegions.reading.end)
    .filter(block => !(block.kind === 'heading' && block.depth === 1))
    .filter(block => !withinQuickPractice(block))
    .flatMap(block => {
      if (block.kind === 'rule') return []
      if (block.kind === 'table') return block.rows.flat()
      if (block.kind === 'list') return listText(block.items)
      return [block.text.replace(/:::\s*\{?\.examples\}?|:::/g, '')]
    })
    .map(plainInline)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
}

function renderedText(parsed) {
  const blocks = [...parsed.intro, ...parsed.blocks]
  return blocks.flatMap(block => {
    if (['hr', 'quick-practice', 'drill', 'exercises-slot'].includes(block.type)) return []
    if (block.type === 'table') return [block.head, ...block.body].flat()
    if (block.type === 'list') return listText(block.items)
    if (block.type === 'note') return [block.label ? `${block.label}: ${block.text}` : block.text]
    if (block.type === 'examples' || block.type === 'pairs') {
      return block.pairs.map(pair => pair.line || [pair.tongan, pair.english].filter(Boolean).join(' '))
    }
    return [block.text]
  }).map(plainInline).filter(Boolean).join(' ').replace(/\s+/g, ' ')
}

function visibleText(html) {
  return html
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/?(?:address|article|aside|blockquote|div|h[1-6]|header|li|main|nav|ol|p|section|table|tbody|td|tfoot|th|thead|tr|ul)(?:\s+[^>]*)?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#xA0;/g, ' ')
    .replace(/&quot;|&#x27;|&#39;|&apos;/g, match => match === '&quot;' ? '"' : "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[‘’ʻ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

const compactText = text => text
  .replace(/[‘’ʻ]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, '')

const nodeText = node => typeof node?.value === 'string' ? node.value : (node?.children || []).map(nodeText).join('')
const classOf = node => node?.data?.hProperties?.className?.[0] || ''
const normalizeExamplesFence = markdown => markdown.replace(/^:::\s*\{\.examples\}\s*$/gm, ':::examples')

function productionPairShape(node) {
  if (classOf(node) !== 'example-pair') return 'plain'
  return node.children?.some(child => classOf(child) === 'example-english') ? 'pair' : 'tongan'
}

function productionStructure(markdown) {
  const tree = productionExamples.runSync(productionExamples.parse(normalizeExamplesFence(markdown.replace(/\r/g, ''))))
  const output = []
  for (let index = 0; index < tree.children.length; index += 1) {
    const node = tree.children[index]
    if (node.type === 'heading' && node.depth === 3 && /^(Exercises|Answers)$/i.test(nodeText(node).trim())) break
    if (node.type === 'heading' && node.depth === 3 && /^Quick Practice\b/i.test(nodeText(node).trim())) {
      while (index + 1 < tree.children.length && tree.children[index + 1].type !== 'heading' && tree.children[index + 1].type !== 'thematicBreak') index += 1
      if (tree.children[index + 1]?.type === 'thematicBreak') index += 1
      continue
    }
    if (node.type === 'paragraph') {
      output.push(classOf(node) === 'example-pair' ? { type: 'pairs', lines: [productionPairShape(node)] } : { type: 'p' })
    } else if (node.type === 'containerDirective' && node.name === 'examples') {
      output.push({
        type: 'examples',
        lines: node.children.filter(child => child.type === 'paragraph').map(productionPairShape),
      })
    }
  }
  return output
}

function descendantStartLines(node) {
  const lines = []
  const visit = child => {
    if (typeof child.value === 'string' && child.position?.start?.line) lines.push(child.position.start.line)
    ;(child.children || []).forEach(visit)
  }
  visit(node)
  return lines
}

function productionFallbackLines(markdown) {
  const sourceLines = markdown.replace(/\r/g, '').split('\n')
  const tree = productionExamples.runSync(productionExamples.parse(normalizeExamplesFence(markdown.replace(/\r/g, ''))))
  const output = []
  for (let index = 0; index < tree.children.length; index += 1) {
    const node = tree.children[index]
    if (node.type === 'heading' && node.depth === 3 && /^(Exercises|Answers)$/i.test(nodeText(node).trim())) break
    if (node.type === 'heading' && node.depth === 3 && /^Quick Practice\b/i.test(nodeText(node).trim())) {
      while (index + 1 < tree.children.length && tree.children[index + 1].type !== 'heading' && tree.children[index + 1].type !== 'thematicBreak') index += 1
      if (tree.children[index + 1]?.type === 'thematicBreak') index += 1
      continue
    }
    if (node.type !== 'containerDirective' || node.name !== 'examples') continue
    for (const line of node.children.filter(child => child.type === 'paragraph')) {
      if (productionPairShape(line) !== 'tongan') continue
      const lines = descendantStartLines(line)
      output.push(sourceLines[Math.min(...lines) - 1].trim())
    }
  }
  return output
}

function parsedStructure(parsed) {
  return [...parsed.intro, ...parsed.blocks].flatMap(block => {
    if (block.type === 'p') return [{ type: 'p' }]
    if (block.type === 'pairs') return [{ type: 'pairs', lines: block.pairs.map(pair => pair.english ? 'pair' : 'tongan') }]
    if (block.type === 'examples') return [{ type: 'examples', lines: block.pairs.map(pair => pair.english ? 'pair' : 'tongan') }]
    return []
  })
}

function parseChapter(number) {
  return parseLessonContent(fs.readFileSync(path.join(app, 'book', `Chapter-${String(number).padStart(2, '0')}.md`), 'utf8'), {
    chapter: number,
    quickPractices: quickPractice[String(number)] || [],
    drillAnchors: drillMap[String(number)] || [],
    slugify,
  })
}

test('all 52 lessons preserve production paragraph and example-pair structure', () => {
  const totals = { paragraphs: 0, pairBlocks: 0, exampleBlocks: 0, translatedLines: 0, tonganOnlyLines: 0 }
  let fallbackLines = 0
  for (let chapter = 1; chapter <= 52; chapter += 1) {
    const markdown = fs.readFileSync(path.join(app, 'book', `Chapter-${String(chapter).padStart(2, '0')}.md`), 'utf8')
    const parsed = parseChapter(chapter)
    const actual = parsedStructure(parsed)
    const expected = productionStructure(markdown)
    assert.deepEqual(actual, expected, `lesson ${chapter} paragraph/example structure`)
    const actualFallback = [...parsed.intro, ...parsed.blocks]
      .filter(block => block.type === 'examples')
      .flatMap(block => block.pairs.filter(pair => pair.line).map(pair => pair.line))
    const expectedFallback = productionFallbackLines(markdown)
    assert.deepEqual(actualFallback, expectedFallback, `lesson ${chapter} fallback example source Markdown`)
    fallbackLines += actualFallback.length
    for (const block of actual) {
      if (block.type === 'p') totals.paragraphs += 1
      if (block.type === 'pairs') totals.pairBlocks += 1
      if (block.type === 'examples') totals.exampleBlocks += 1
      totals.translatedLines += block.lines?.filter(line => line === 'pair').length || 0
      totals.tonganOnlyLines += block.lines?.filter(line => line === 'tongan').length || 0
    }
  }

  const lesson1 = parseChapter(1)
  const lesson2 = parseChapter(2)
  const lesson7 = parseChapter(7)
  const lesson17 = parseChapter(17)
  const lesson46 = parseChapter(46)
  assert.ok([...lesson1.intro, ...lesson1.blocks].some(block => block.type === 'p' && block.text.startsWith('*Kai* did not become')), 'Lesson 1 italic-led prose stays prose')
  assert.ok([...lesson2.intro, ...lesson2.blocks].some(block => block.type === 'p' && block.text.startsWith("*'Oku* marks the present tense")), 'Lesson 2 italic-led prose stays prose')
  assert.deepEqual(lesson2.blocks.filter(block => block.type === 'p' && /^(\*Ou\*|\*U\*|\*Ku\*)/.test(block.text)).map(block => block.text.split(' ')[0]), ['*Ou*', '*U*', '*Ku*'], 'Lesson 2 adjacent prose lines stay distinct')
  assert.ok(lesson7.blocks.some(block => block.type === 'examples' && block.pairs.some(pair => pair.tongan?.includes("Té ke 'alu ki Vava'u?")) && block.pairs.some(pair => pair.tongan?.includes("'Io, té u 'alu ki ai."))), 'Lesson 7 adjacent question and answer stay distinct')
  assert.ok(lesson17.blocks.some(block => block.type === 'examples' && block.pairs.some(pair => pair.tongan?.includes("Ko ho'o huo?")) && block.pairs.some(pair => pair.tongan?.includes("Ko ho'o ako?"))), 'Lesson 17 adjacent examples stay distinct')
  assert.ok(lesson46.blocks.some(block => block.type === 'examples' && block.pairs.some(pair => !pair.english && pair.line?.includes('ki tahi') && pair.line.includes('ki he tahí'))), 'Lesson 46 lowercase annotation remains a Tongan-only line')
  assert.equal(fallbackLines, 148, 'all 148 fallback example lines retain source Markdown')
  assert.deepEqual(totals, { paragraphs: 1489, pairBlocks: 3, exampleBlocks: 704, translatedLines: 1102, tonganOnlyLines: 148 })
})

test('all 52 lessons retain the ordered reading text and structural data from the frozen oracle', () => {
  let quickCount = 0
  let drillCount = 0
  let tables = 0
  let cells = 0

  for (const expected of inventory.lessons) {
    const filename = `Chapter-${String(expected.chapter).padStart(2, '0')}.md`
    const markdown = fs.readFileSync(path.join(app, 'book', filename), 'utf8')
    const parsed = parseLessonContent(markdown, {
      chapter: expected.chapter,
      quickPractices: quickPractice[String(expected.chapter)] || [],
      drillAnchors: drillMap[String(expected.chapter)] || [],
      slugify,
    })
    assert.equal(parsed.title, expected.semanticBlocks[0].text.replace(/^Lesson \d+:\s*/, ''), `lesson ${expected.chapter} title`)
    assert.equal(renderedText(parsed), sourceText(expected), `lesson ${expected.chapter} displayed reading text`)

    const expectedHeadings = expected.semanticBlocks
      .filter(block => block.position?.start < expected.contentRegions.reading.end && [3, 4].includes(block.depth))
      .filter(block => !expected.quickPractice.some(qp => block.position.start >= qp.sourceRange.start && block.position.start < qp.sourceRange.end))
      .map(block => [block.depth, plainInline(block.text), block.slug])
    const actualHeadings = parsed.blocks
      .filter(block => block.type === 'h2' || block.type === 'h3')
      .map(block => [block.type === 'h2' ? 3 : 4, plainInline(block.text), block.id])
    assert.deepEqual(actualHeadings, expectedHeadings, `lesson ${expected.chapter} headings and canonical IDs`)

    const expectedTables = expected.semanticBlocks
      .filter(block => block.kind === 'table' && block.position.start < expected.contentRegions.reading.end)
      .map(block => block.rows.map(row => row.map(plainInline)))
    const actualTables = [...parsed.intro, ...parsed.blocks]
      .filter(block => block.type === 'table')
      .map(block => [block.head, ...block.body].map(row => row.map(plainInline)))
    assert.deepEqual(actualTables, expectedTables, `lesson ${expected.chapter} table cells`)

    quickCount += parsed.quickPracticeCount
    drillCount += parsed.drillCount
    tables += actualTables.length
    cells += actualTables.flat(2).length
  }

  assert.deepEqual({ quickCount, drillCount, tables, cells }, { quickCount: 15, drillCount: 74, tables: 305, cells: 5453 })
  for (const source of Object.values(inventory.sources)) {
    const relative = source.path.replace(/^lea-faka-tonga-app\//, '')
    assert.equal(sha256(relative), approvedPracticeHashes[relative] ?? source.sha256, `${relative} matches its approved source snapshot`)
  }
})

test('the actual lesson and prompt renderers retain all 52 lessons and every exercise prompt', async () => {
  const server = await createServer({
    root: cwd(),
    configFile: path.join(cwd(), 'vite.config.js'),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  })
  try {
    const [{ RenderBlock, Section }, { Prompt }, { Md }] = await Promise.all([
      server.ssrLoadModule('/src/premium/pages/Lesson.jsx'),
      server.ssrLoadModule('/src/premium/components/lesson/Exercises.jsx'),
      server.ssrLoadModule('/src/premium/components/lesson/Blocks.jsx'),
    ])
    const wrap = child => React.createElement(MemoryRouter, null, child)
    let renderedBlocks = 0
    let assembledGroups = 0

    for (const expected of inventory.lessons) {
      const filename = `Chapter-${String(expected.chapter).padStart(2, '0')}.md`
      const parsed = parseLessonContent(fs.readFileSync(path.join(app, 'book', filename), 'utf8'), {
        chapter: expected.chapter,
        quickPractices: quickPractice[String(expected.chapter)] || [],
        drillAnchors: drillMap[String(expected.chapter)] || [],
        slugify,
      })
      const displayBlocks = [...parsed.intro, ...parsed.blocks]
        .filter(block => !['hr', 'quick-practice', 'drill', 'exercises-slot'].includes(block.type))
      const elements = displayBlocks.map((block, index) => block.type === 'h2'
        ? React.createElement('h2', { key: index }, React.createElement(Md, { text: block.text }))
        : React.createElement(RenderBlock, { key: index, block, n: expected.chapter }))
      const html = renderToStaticMarkup(wrap(React.createElement(React.Fragment, null, ...elements)))
      assert.ok(visibleText(html).length > 100, `lesson ${expected.chapter} produces substantive SSR`)
      assert.doesNotMatch(html, /not in the sample|lesson not found|placeholder/i, `lesson ${expected.chapter} is not a placeholder`)
      assert.equal(compactText(visibleText(html)), compactText(renderedText(parsed)), `lesson ${expected.chapter} SSR reading text`)
      renderedBlocks += displayBlocks.length

      if (expected.chapter === 1) {
        assert.match(html, /href="\/lessons\/2"/, 'restored Lesson 1 prose keeps its Lesson 2 cross-reference link')
        assert.match(html, /<span lang="to" class="to "><span>Naʻá ku kai\.<\/span><\/span><span> \(stress: na-<\/span><strong class="md-b"><span>ʻa<\/span><\/strong><span>-ku kai\)<\/span>/, 'Lesson 1 fallback example keeps the source bold stress mark outside the Tongan span')
        const section = id => {
          const start = parsed.blocks.findIndex(block => block.type === 'h2' && block.id === id)
          const end = parsed.blocks.findIndex((block, index) => index > start && (block.type === 'h2' || block.type === 'exercises-slot'))
          return { id, blocks: parsed.blocks.slice(start + 1, end < 0 ? undefined : end) }
        }
        const figureHtml = ['the-pattern', 'building-sentences', 'asking-questions', 'pronunciation-naa-pronoun']
          .map(id => renderToStaticMarkup(wrap(React.createElement(Section, { s: section(id), n: 1 }))))
          .join(' ')
        for (const title of ['Three parts, always in this order', 'Build any sentence from this lesson', 'Only the voice changes', 'Two words, said as one']) {
          assert.equal((figureHtml.match(new RegExp(title, 'g')) || []).length, 1, `Lesson 1 figure remains anchored: ${title}`)
        }
        const askingHtml = renderToStaticMarkup(wrap(React.createElement(Section, { s: section('asking-questions'), n: 1 })))
        assert.ok(askingHtml.indexOf('Only the voice changes') > askingHtml.indexOf('Did you eat?'), 'intonation figure follows both separated source lines')
        assert.ok(askingHtml.indexOf('Only the voice changes') < askingHtml.indexOf('A typical exchange'), 'intonation figure remains before the next teaching paragraph')
      }

      if (expected.chapter === 25) {
        assert.match(html, /<span lang="to" class="to "><span>ha ngaahi fale<\/span><\/span><span>\. some houses<\/span>/, 'Lesson 25 mixed fallback keeps its English gloss upright and outside lang="to"')
      }

      const wordsIndex = parsed.blocks.findIndex(block => block.type === 'h2' && /^words-to-learn/.test(block.id))
      assert.notEqual(wordsIndex, -1, `lesson ${expected.chapter} words section`)
      const wordsEnd = parsed.blocks.findIndex((block, index) => index > wordsIndex && (block.type === 'h2' || block.type === 'exercises-slot'))
      const wordsBlocks = parsed.blocks.slice(wordsIndex + 1, wordsEnd < 0 ? undefined : wordsEnd)
      const groups = wordsBlocks.flatMap((block, index) => block.type === 'table' ? [{
        label: wordsBlocks[index - 1]?.type === 'p' ? wordsBlocks[index - 1].text : null,
        table: block,
      }] : [])
      const sectionHtml = renderToStaticMarkup(wrap(React.createElement(Section, {
        s: { id: parsed.blocks[wordsIndex].id, blocks: wordsBlocks },
        n: expected.chapter,
      })))
      assert.equal((sectionHtml.match(/<table/g) || []).length, 1, `lesson ${expected.chapter} has one assembled vocabulary table`)
      const renderedGroups = [...sectionHtml.matchAll(/<tbody class="words-group">([\s\S]*?)<\/tbody>/g)].map(match => match[1])
      assert.equal(renderedGroups.length, groups.length, `lesson ${expected.chapter} vocabulary group count`)
      renderedGroups.forEach((groupHtml, index) => {
        const group = groups[index]
        const source = [group.label, ...group.table.head, ...group.table.body.flat()].filter(Boolean).map(plainInline).join(' ')
        assert.equal(compactText(visibleText(groupHtml)), compactText(source), `lesson ${expected.chapter} vocabulary group ${index + 1}`)
      })
      assembledGroups += groups.length
    }

    const allExerciseItems = Object.values(inventory.lessons).flatMap(lesson => lesson.exercises.flatMap(set => set.items))
    for (const item of allExerciseItems) {
      const html = renderToStaticMarkup(wrap(React.createElement(Prompt, { text: item.prompt })))
      const blankCount = (item.prompt.match(/(?:\\?_){3,}/g) || []).length
      assert.equal((html.match(/data-blank=""/g) || []).length, blankCount, `${item.id} rendered blank count`)
      assert.equal(compactText(visibleText(html)), compactText(plainInline(item.prompt)), `${item.id} rendered prompt text`)
      if (item.id === 'ch1-ex4-1') assert.match(html, /Naʻa/, 'Tongan around a blank keeps display fakauʻa')
    }
    assert.ok(renderedBlocks > 1_000, 'all lesson blocks passed through the actual renderer')
    assert.equal(assembledGroups, 97, 'all source vocabulary groups passed through the assembled table renderer')
    assert.equal(allExerciseItems.length, 1605)
  } finally {
    await server.close()
  }
})
