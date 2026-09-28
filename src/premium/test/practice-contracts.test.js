import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import postcss from 'postcss'
import { createServer } from 'vite'

const siteRoot = cwd()
const appRoot = siteRoot
const own = relative => fs.readFileSync(path.join(siteRoot, relative), 'utf8')
const source = relative => fs.readFileSync(path.join(appRoot, relative), 'utf8')
const sourceUrl = relative => `/${relative}`
const localStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const ssrStorage = { getItem: () => null, setItem: () => {} }
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ssrStorage })
after(() => {
  if (localStorageDescriptor) Object.defineProperty(globalThis, 'localStorage', localStorageDescriptor)
  else delete globalThis.localStorage
})

async function withVite(run) {
  const server = await createServer({
    configFile: path.join(siteRoot, 'vite.config.js'),
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  try { return await run(server) } finally { await server.close() }
}

test('all 75 registered cores load through the compatibility bridge and produce nonempty SSR', async () => {
  await withVite(async server => {
    const [{ drillRegistry }, { default: SourceDrill }] = await Promise.all([
      server.ssrLoadModule(sourceUrl('src/drills/registry.js')),
      server.ssrLoadModule('/src/premium/pages/SourceDrill.jsx'),
    ])
    const ids = Object.keys(drillRegistry)
    assert.equal(ids.length, 75)
    assert.equal(new Set(ids).size, 75)

    for (const id of ids) {
      const entry = drillRegistry[id]
      assert.equal(typeof entry.Core, 'function', `${id} exposes a component`)
      assert.ok(entry.meta?.title && entry.meta?.blurb, `${id} retains source metadata`)
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement('div', { className: 'premium-core' }, React.createElement(entry.Core)),
        ),
      )
      assert.ok(html.length > 80, `${id} produced substantive markup`)
      assert.doesNotMatch(html, /not in the sample/i, `${id} is not a placeholder`)
      const routeHtml = renderToStaticMarkup(
        React.createElement(MemoryRouter, null, React.createElement(SourceDrill, { bespokeId: id })),
      )
      const routeText = routeHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      assert.ok(routeHtml.length > 100, `${id} route adapter produced substantive markup`)
      assert.match(routeHtml, new RegExp(`data-drill-id="${id}"`), `${id} route adapter preserves its identity`)
      assert.doesNotMatch(routeText, /not in the sample|drill not found|placeholder/i, `${id} route is not a placeholder`)
    }
  })
})

test('all ten bespoke destinations retain their source title, introduction and complete teaching aside', async () => {
  await withVite(async server => {
    const { BESPOKE, routeFor } = await server.ssrLoadModule(sourceUrl('src/lib/drill-routes.js'))
    const { premiumRouteFor } = await server.ssrLoadModule('/src/premium/lib/source-routes.js')
    const { default: SourceDrill } = await server.ssrLoadModule('/src/premium/pages/SourceDrill.jsx')
    const pages = {
      'tense-swapper': 'TenseSwapper',
      'first-word-quiz': 'FirstWordQuiz',
      'skeleton-filler': 'SkeletonFiller',
      'possessive-sorter': 'PossessiveSorter',
      'clusivity-corner': 'ClusivityCorner',
      'adjective-flip': 'AdjectiveFlip',
      'faka-pattern-sorter': 'FakaSorter',
      'cleft-builder': 'CleftBuilder',
      'accent-placement-picker': 'AccentPlacementPicker',
      'verbal-noun-converter': 'VerbalNounConverter',
    }
    assert.equal(Object.keys(pages).length, 10)
    const render = component => renderToStaticMarkup(React.createElement(MemoryRouter, null, component))
    for (const [id, page] of Object.entries(pages)) {
      const { default: Original } = await server.ssrLoadModule(sourceUrl(`src/pages/${page}.jsx`))
      const expected = render(React.createElement(Original))
      const actual = render(React.createElement(SourceDrill, { bespokeId: id }))
      assert.equal(premiumRouteFor(id), BESPOKE[id], `${id} catalogue keeps its bespoke destination`)
      assert.equal(premiumRouteFor(id), routeFor(id))
      for (const [label, pattern] of [
        ['title', /<h1 class="pcs-title">[\s\S]*?<\/h1>/],
        ['introduction', /<p class="pcs-sub">[\s\S]*?<\/p>/],
        ['teaching aside', /<aside class="pcs-lesson">[\s\S]*?<\/aside>/],
      ]) {
        const original = expected.match(pattern)?.[0]
        assert.ok(original, `${id} has a source ${label}`)
        assert.ok(actual.includes(original), `${id} preserves its entire ${label}`)
      }
      assert.match(actual, /class="premium-core"/)
    }
    assert.equal(premiumRouteFor('terminal-builder'), '/sentence-builder')
    assert.equal(premiumRouteFor('aspect-picker'), '/drill/aspect-picker')
  })
})

test('the three builder destinations remain separate and both full pages use the live chapter-52 engines', () => {
  const adapter = own('src/premium/pages/SourceBuilder.jsx')
  const drillAdapter = own('src/premium/pages/SourceDrill.jsx')
  const sentence = source('src/pages/SentenceBuilder.jsx')
  const terminal = source('src/pages/TerminalBuilder.jsx')
  const registry = source('src/drills/registry.js')

  assert.match(adapter, /@app\/pages\/SentenceBuilder\.jsx/)
  assert.match(adapter, /@app\/pages\/TerminalBuilder\.jsx/)
  assert.match(adapter, /mode === 'terminal'/)
  assert.doesNotMatch(adapter, /ChapterContext|ChapterProvider/)
  assert.match(sentence, /const CHAPTER = 52/)
  assert.match(sentence, /createGuidedMultiWalker\(CHAPTER\)/)
  assert.match(terminal, /createMultiWalker\(52\)/)
  assert.match(registry, /'sentence-builder'\s*:\s*\{[\s\S]*?Core:\s*SentenceBuilderCore/)
  assert.match(drillAdapter, /drillRegistry\[id\]/)
  assert.match(drillAdapter, /<Core key=\{id\} \/>/)
  assert.match(drillAdapter, /onKeyDownCapture=\{keepControlKeysLocal\}/)
  assert.match(adapter, /onKeyDownCapture=\{keepControlKeysLocal\}/)
})

test('guided and bare builders keep the production fixture result and their distinct opening states', async () => {
  await withVite(async server => {
    const engine = await server.ssrLoadModule(sourceUrl('src/engine/multi-walker.js'))
    const translator = await server.ssrLoadModule(sourceUrl('src/engine/translate.js'))
    const {
      PHASE, createGuidedMultiWalker, createMultiWalker, pickEntryPointCategory,
      getFirstWordOptions, pickFirstWord, getCurrentOptions, pickCategory, pickWord,
      pickTerminator, getRenderedSentence, getFinishedWalker,
    } = engine

    const bare = createMultiWalker(52)
    const guided = createGuidedMultiWalker(52)
    assert.equal(bare.phase, PHASE.PICKING_FIRST_WORD)
    assert.equal(guided.phase, PHASE.PICKING_ENTRY_POINT)
    assert.equal(bare.chapter, 52)
    assert.equal(guided.chapter, 52)

    let state = pickEntryPointCategory(guided, 'Statements')
    const oku = getFirstWordOptions(state).groups.flatMap(group => group.words)
      .find(item => item.word.tongan === 'ʻOku')
    assert.ok(oku)
    state = pickFirstWord(state, oku)
    for (const tongan of ['ou', 'ʻalu']) {
      const options = getCurrentOptions(state)
      let word = options.words?.find(option => option.tongan === tongan)
      if (!word && options.categories) {
        for (const category of options.categories) {
          const categorized = pickCategory(state, category.label)
          word = getCurrentOptions(categorized).words?.find(option => option.tongan === tongan)
          if (word) { state = categorized; break }
        }
      }
      if (!word && (options.type === 'extensions' || options.type === 'mixed')) {
        try {
          state = pickWord(state, { tongan })
          continue
        } catch { /* the assertion below reports an unavailable fixture word */ }
      }
      assert.ok(word, `${tongan} remains selectable in the source fixture`)
      state = pickWord(state, word)
    }
    state = pickTerminator(state, 'FINISH_STATEMENT')
    assert.equal(state.phase, PHASE.FINISHED)
    assert.equal(getRenderedSentence(state).map(step => step.renderedTongan).join(' '), 'ʻOku ou ʻalu')
    assert.match(translator.translateWalkerState(getFinishedWalker(state)).text.toLowerCase(), /go/)
  })
})

test('representative mechanic families retain real answer, advance, reset and completion paths', () => {
  const contracts = [
    ['picker', 'src/drills/PickerCore.jsx', ['handleGuess', 'handleNext', 'handleReset', 'DeckComplete']],
    ['sorter', 'src/drills/SorterCore.jsx', ['handleGuess', 'handleNext', 'handleReset', 'Deck complete']],
    ['tile builder', 'src/drills/AdjectiveFlipCore.jsx', ['handleTileClick', 'handleNext', 'handleReset', 'DeckComplete']],
    ['skeleton builder', 'src/drills/SkeletonFillerCore.jsx', ['handlePoolClick', 'handleCheck', 'handleNext', 'DeckComplete']],
    ['matrix', 'src/drills/ClusivityCornerCore.jsx', ['handleGuess', 'handleNext', 'handleReset', 'DeckComplete']],
    ['matcher', 'src/drills/TimePairMatcherCore.jsx', ['handlePastClick', 'handleFutureClick', 'handleReset', 'DeckComplete']],
    ['graded lab', 'src/drills/SentenceLabCore.jsx', ['handleSwap', 'handleReveal', 'finishRound', 'DeckComplete']],
    ['correction', 'src/drills/SpotTheSlipCore.jsx', ['handleWordTap', 'handleFixTap', 'next', 'finished']],
    ['persistent deck', 'src/drills/DailyWordsCore.jsx', ['handleGuess', 'next', 'goAgain', 'localStorage']],
  ]

  for (const [family, file, markers] of contracts) {
    const text = source(file)
    for (const marker of markers) assert.ok(text.includes(marker), `${family} keeps ${marker}`)
  }
})

test('practice CSS is wrapper-scoped, covers every bespoke family and carries only the exact builder utility subset', () => {
  const files = ['src/premium/styles/source-core.css', 'src/premium/styles/source-builders.css', 'src/premium/styles/source-utilities.css']
  for (const file of files) {
    const css = own(file)
    const root = postcss.parse(css)
    root.walkRules(rule => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return
      for (const selector of rule.selectors) {
        assert.ok(
          selector.trim().startsWith('.premium-core') || selector.trim().startsWith('.source-'),
          `${file} selector remains scoped: ${selector}`,
        )
      }
    })
    assert.doesNotMatch(css, /(^|\n)\s*(?:html|body|:root|\*)\s*\{/)
  }

  const core = own('src/premium/styles/source-core.css')
  for (const family of ['pcs-', 'tense-swap-', 'fwq-', 'afl-', 'skf-', 'clu-', 'x-lab-']) {
    assert.ok(core.includes(family), `core bridge includes ${family}`)
  }
  assert.match(core, /fwq-why-text[\s\S]*font-size:\s*15px/)
  assert.match(core, /prefers-reduced-motion:\s*reduce/)

  const builders = own('src/premium/styles/source-builders.css')
  for (const hook of ['terminal-builder', 'tb-picker', 'tb-mobile-menu', 'tb-chooser', 'tb-explain']) {
    assert.ok(builders.includes(hook), `builder bridge includes ${hook}`)
  }
  const utilities = own('src/premium/styles/source-utilities.css')
  assert.match(utilities, /intentionally contains no preflight/)
  assert.doesNotMatch(utilities, /@tailwind|@import|preflight\s*\{/)
})
