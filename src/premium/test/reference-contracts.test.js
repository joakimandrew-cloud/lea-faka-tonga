import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { cwd } from 'node:process'
import { pathToFileURL } from 'node:url'

const siteRoot = cwd()
const appRoot = siteRoot
const own = relative => fs.readFileSync(path.join(siteRoot, relative), 'utf8')
const source = relative => fs.readFileSync(path.join(appRoot, relative), 'utf8')

function sourceCharts() {
  const text = source('src/pages/ReferenceCharts.jsx')
  const start = text.indexOf('const charts = ') + 'const charts = '.length
  const end = text.indexOf('\n\nexport default function ReferenceCharts')
  assert.ok(start > 'const charts = '.length && end > start, 'chart source literal remains available')
  return vm.runInNewContext(`(${text.slice(start, end)})`)
}

const DOC_FILES = {
  '/alphabet': 'alphabet.js',
  '/greetings': 'greetings.js',
  '/grammar/tense-markers': 'tense-markers.js',
  '/grammar/word-order': 'word-order.js',
  '/grammar/negation': 'negation.js',
  '/grammar/possessives': 'possessives.js',
  '/grammar/ko-sentences': 'ko-sentences.js',
}

const REPRESENTATIVE_SOURCE_TEXT = {
  '/alphabet': ['17 letters', 'fakauʻa'],
  '/greetings': ['Mālō e lelei', 'Fēfē hake?'],
  '/grammar/tense-markers': ['naʻa', 'ʻoku', 'kuo'],
  '/grammar/word-order': ['the verb comes first', 'ʻa'],
  '/grammar/negation': ['ʻikai te', 'ʻikai ke'],
  '/grammar/possessives': ['ʻeku', 'hoku'],
  '/grammar/ko-sentences': ["Ko e hele 'eni", 'No verb'],
}

test('the chart adapter renders the live eight-group source with intact representative tables and words', () => {
  const adapter = own('src/premium/pages/Reference.jsx')
  assert.match(adapter, /@app\/pages\/ReferenceCharts\.jsx/)
  assert.doesNotMatch(adapter, /const\s+charts\s*=/, 'adapter does not copy teaching data')

  const charts = sourceCharts()
  assert.deepEqual(Array.from(charts, chart => chart.id), [
    'preposed', 'postposed', 'definite', 'indefinite',
    'postposed-poss', 'beneficiary', 'emotional', 'impersonal',
  ])
  assert.equal(charts.reduce((total, chart) => total + chart.tables.length, 0), 12)
  assert.equal(charts.reduce((total, chart) => total + chart.tables.reduce((rows, table) => rows + table.rows.length, 0), 0), 52)
  assert.deepEqual(Array.from(charts[0].tables[0].rows[0]), ['1st excl.', 'ku / ou / u', 'ma', 'mau'])
  assert.equal(charts.find(chart => chart.id === 'definite').tables[0].rows[2][3], 'hoʻomou')
  assert.equal(charts.find(chart => chart.id === 'postposed-poss').tables[0].rows[2][1], 'ʻaʻau')
  assert.equal(charts.find(chart => chart.id === 'beneficiary').tables[1].rows[3][2], 'moʻonau')
  assert.ok(charts.find(chart => chart.id === 'emotional').notes.includes('siʻa: emotional indefinite article ("a poor/dear ...")'))
  assert.deepEqual(Array.from(charts.find(chart => chart.id === 'impersonal').tables[0].rows[4]), ['Beneficiary', 'maʻata', 'moʻota'])
})

test('all seven source topic IDs, documents and lesson or drill destinations remain represented', async () => {
  const topicModule = await import(pathToFileURL(path.join(appRoot, 'src/lib/topic-pages.js')))
  const paths = topicModule.TOPIC_PAGES.map(topic => topic.to)
  assert.deepEqual(paths, Object.keys(DOC_FILES))

  const articleAdapter = own('src/premium/pages/TopicArticle.jsx')
  for (const [route, file] of Object.entries(DOC_FILES)) {
    const component = file.replace(/(^|-)([a-z])/g, (_, _dash, letter) => letter.toUpperCase()).replace('.js', '')
    assert.ok(articleAdapter.includes(`'${route}'`), `${route} is routed by the adapter`)
    assert.ok(articleAdapter.includes(`@app/pages/${component}.jsx`), `${route} uses its source page component`)

    const doc = (await import(pathToFileURL(path.join(appRoot, 'src/seo/pages', file)))).default
    const serialized = JSON.stringify(doc)
    assert.ok(doc.h1 && doc.blocks.length > 0, `${route} has a nonempty source document`)
    for (const text of REPRESENTATIVE_SOURCE_TEXT[route]) {
      assert.ok(serialized.includes(text), `${route} keeps source text: ${text}`)
    }
    const next = doc.blocks.find(block => block.k === 'next')
    assert.ok(next?.items?.length, `${route} keeps its source next links`)
    assert.ok(next.items.some(item => item.to.startsWith('/lessons')), `${route} links into lessons`)
  }

  const allNext = []
  for (const file of Object.values(DOC_FILES)) {
    const doc = (await import(pathToFileURL(path.join(appRoot, 'src/seo/pages', file)))).default
    allNext.push(...doc.blocks.filter(block => block.k === 'next').flatMap(block => block.items))
  }
  assert.ok(allNext.some(item => item.to.startsWith('/drill/')), 'topic sources link into registered drills')
  assert.match(articleAdapter, /Topic not found\./)
  assert.match(articleAdapter, /to="\/topics"/)
})

test('topic hub imports the live metadata rather than a copied topic list', () => {
  const adapter = own('src/premium/pages/Topics.jsx')
  assert.match(adapter, /@app\/pages\/Topics\.jsx/)
  assert.doesNotMatch(adapter, /TOPIC_PAGES|Mālō e lelei|tense-markers/)
})

test('the rendered topic hub keeps all seven exact labels, descriptions and destinations, with charts and language spans', async () => {
  const { createServer } = await import('vite')
  const { default: React } = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { MemoryRouter } = await import('react-router-dom')
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
  try {
    const { default: Topics } = await server.ssrLoadModule('/src/premium/pages/Topics.jsx')
    const { TOPIC_PAGES } = await import(pathToFileURL(path.join(appRoot, 'src/lib/topic-pages.js')))
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Topics)))
    const plain = value => value.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&').replaceAll('&#x27;', "'")
    const cards = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
      .filter(([, attributes]) => attributes.includes('class="topic-card"'))
    assert.equal(cards.length, 7)
    assert.deepEqual(cards.map(([, attributes, content]) => [attributes.match(/href="([^"]+)"/)[1], plain(content)]),
      TOPIC_PAGES.map(topic => [topic.to, `${topic.label}${topic.blurb}`]))
    assert.equal((html.match(/class="entry-motif"/g) || []).length, 8)
    for (const kind of ['pinwheel', 'nest', 'leaf', 'lens']) {
      assert.equal((html.match(new RegExp(`kp-${kind} `, 'g')) || []).length, 2)
    }
    assert.doesNotMatch(html, /topic-entry-bird|→/)
    assert.match(html, /href="\/charts"/)
    assert.deepEqual([...html.matchAll(/<span[^>]*lang="to"[^>]*>([^<]+)<\/span>/g)].map(match => plain(match[1])),
      ['Mālō e lelei', 'ʻikai', 'te', 'ke', 'Ko', 'Ko e hele ʻeni'])
    assert.match(html, /aria-labelledby="topic-group-sounds"/)
    assert.match(html, /aria-labelledby="topic-group-grammar"/)
  } finally {
    await server.close()
  }
})

test('help uses live internal report and support destinations', () => {
  const help = own('src/premium/pages/Help.jsx')
  assert.match(help, /to="\/report"/)
  assert.match(help, /to="\/support"/)
  assert.match(help, /PDF_URL/)
  assert.match(help, /EPUB_URL/)
  assert.match(help, /Free forever\. Lifetime updates\./)
  assert.doesNotMatch(help, /local preview|leafakatonga\.org\/report|leafakatonga\.org\/support/)
})

test('reference styles stay scoped and retain focus, mobile table and reduced-motion contracts', () => {
  const css = own('src/premium/styles/reference.css')
  assert.match(css, /\.premium-reference :focus-visible/)
  assert.match(css, /overflow-x: auto/)
  assert.match(css, /@media \(max-width: 640px\)/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.doesNotMatch(css, /(^|\n)\s*(?:body|html|:root|\*|\.btn\b|\.reading-page\b)[^{]*\{/)
})
