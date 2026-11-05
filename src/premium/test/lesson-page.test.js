// The lesson page of plan 2026-11-05-lesson-page-simplify: /lessons/:n renders the calm page with
// each lesson's figures from src/premium/figures/NN.js. These guards cover what the page reads and
// what it must never show: recall cards from book sentences only, the figures placed once, the
// anchors and the saved-progress keys kept, one file per lesson loaded by glob, and the test-build
// tools kept out of a production build.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd, execPath } from 'node:process'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { parseLessonContent } from '../lib/lesson-content.js'
import { groupSections, learnModel } from '../lib/lesson-plan.js'
import { LESSON_PATH_KEY } from '../lib/lesson-path-store.js'

const app = cwd()
const source = file => fs.readFileSync(path.join(app, file), 'utf8')
const readJson = relative => JSON.parse(source(relative))
const chapters = readJson('src/data/chapters.json')
const quickPractice = readJson('src/data/quick-practice.json')
const drillMap = readJson('src/data/drill-map.json')
const slugify = text => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[‘’ʻ'`]/g, '').replace(/[/. :,;—–]/g, ' ')
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

const figureFiles = fs.readdirSync(path.join(app, 'src/premium/figures')).filter(name => /^\d\d\.js$/.test(name)).sort()

async function withServer(run) {
  const server = await createServer({
    root: app,
    configFile: path.join(app, 'vite.config.js'),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'silent',
  })
  try { return await run(server) } finally { await server.close() }
}

function sectionsOf(n) {
  const md = source(`book/Chapter-${String(n).padStart(2, '0')}.md`)
  const parsed = parseLessonContent(md, { chapter: n, quickPractices: quickPractice[String(n)] || [], drillAnchors: drillMap[String(n)] || [], slugify })
  return groupSections(parsed.blocks)
}

test('recall cards read book sentences from the figure file and never the chapters.json examples', async () => {
  await withServer(async server => {
    const { withRecall } = await server.ssrLoadModule('/src/premium/pages/Lesson.jsx')
    for (const meta of chapters) {
      const n = meta.chapter
      const sections = sectionsOf(n)
      // A lesson with no recall sentences: no card has a sentence, so none shows.
      const bare = learnModel({ n, meta: withRecall(meta, null), sections })
      assert.equal(bare.items.length, meta.teaching.key_rules.length, `Lesson ${n} keeps every rule's text`)
      assert.ok(bare.items.every(item => item.to === undefined && item.en === undefined), `Lesson ${n}: no chapters.json example reaches the page`)
      assert.deepEqual(bare.items.map(item => item.text), meta.teaching.key_rules.map(rule => rule.rule), `Lesson ${n}: the rule text is unchanged`)
      // A lesson with recall sentences: card i reads sentence i, and only the rules that have one get a card.
      const recall = [{ to: 'Test sentence one.', en: 'English one.' }]
      const some = learnModel({ n, meta: withRecall(meta, recall), sections })
      assert.equal(some.items[0].to, 'Test sentence one.')
      assert.equal(some.items[0].en, 'English one.')
      assert.ok(some.items.slice(1).every(item => item.to === undefined), `Lesson ${n}: a rule with no book sentence gets no card`)
    }
  })
})

test('every figure is placed exactly once, in a section that exists, and the lesson page loads its file by glob', () => {
  const page = source('src/premium/pages/Lesson.jsx')
  assert.match(page, /import\.meta\.glob\('\.\.\/figures\/\[0-9\]\[0-9\]\.js'\)/, 'one file per lesson, loaded lazily')
  assert.ok(figureFiles.length >= 3, 'the three pilot files exist')
  return withServer(async server => {
    const { figurePlaces } = await server.ssrLoadModule('/src/premium/pages/Lesson.jsx')
    for (const name of figureFiles) {
      const n = Number(name.slice(0, 2))
      const { FIGURES } = await server.ssrLoadModule(`/src/premium/figures/${name}`)
      const sections = sectionsOf(n)
      const placed = []
      for (const s of sections) for (const defs of figurePlaces(s, FIGURES).values()) placed.push(...defs.map(def => def.id))
      assert.deepEqual([...placed].sort(), FIGURES.map(def => def.id).sort(), `Lesson ${n}: each figure appears once`)
    }
  })
})

test('the lesson page keeps its saved-progress keys and anchors', () => {
  assert.equal(LESSON_PATH_KEY, 'lft-premium-lesson-path-v1')
  const stepped = source('src/premium/components/lesson/SteppedExercises.jsx')
  const page = source('src/premium/pages/Lesson.jsx')
  assert.match(page, /id="finish"/)
  assert.match(source('src/premium/lib/exercise-progress.js'), /lft-premium-exercises-v1/)
  assert.match(stepped, /id=\{`ex-\$\{ex\.number\}`\}/, 'each exercise set keeps #ex-N')
  assert.match(source('src/premium/lib/lesson-plan.js'), /id: 'exercises', title: 'Exercises'/, 'the section keeps #exercises')
  assert.match(stepped, /exerciseProgressFromSnapshot[\s\S]*writeExerciseSnapshot/, 'exercise answers are saved through the shared writer')
  assert.match(page, /markLessonDone/)
  assert.match(page, /markTried/)
  assert.match(page, /markRead/)
})

test('the stepped exercise sets keep matching and real multiple choice interactive while open types reveal', () => {
  const stepped = source('src/premium/components/lesson/SteppedExercises.jsx')
  assert.match(stepped, /ex\.type === 'matching'/)
  assert.match(stepped, /ex\.type === 'mcq'/)
  assert.match(stepped, /<MatchingItems/)
  assert.match(stepped, /<McqRow/)
  assert.match(stepped, /<RevealRow/)
})

test('the retired pieces are off the page, and the Contents sheet keeps the compass dialog guards', () => {
  const page = source('src/premium/pages/Lesson.jsx')
  for (const retired of ['MobileCompass', 'LessonPlan', 'LessonFigure', 'FIGURE_PLAN', 'stationsModel', '<LessonPath', 'path-rail', 'path-plan', 'path-finish']) {
    assert.ok(!page.includes(retired), `the page no longer uses ${retired}`)
  }
  assert.doesNotMatch(page, /<CourseStrip n=\{n\} \/>/, 'the course strip under the hero is gone; it stays in the done state')
  assert.match(page, /<CourseStrip n=\{n\} fill=\{celebrate\} \/>/)
  // The same dialog and focus handling the compass had (guarded in lesson-experience.test.js).
  const sheet = source('src/premium/components/lesson/Contents.jsx')
  assert.match(sheet, /showModal\(\)/)
  assert.match(sheet, /onKeyDown=\{keepFocus\}/)
  assert.match(sheet, /event\.key !== 'Tab'/)
  assert.match(sheet, /event\.shiftKey && document\.activeElement === first/)
  assert.match(sheet, /!event\.shiftKey && document\.activeElement === last/)
  assert.equal((sheet.match(/event\.preventDefault\(\)/g) || []).length, 2, 'Tab is prevented only for focus wrapping')
  assert.match(sheet, /event\.target === event\.currentTarget/)
  assert.match(sheet, /heading\.focus\?\.\(\{ preventScroll: true \}\)/)
  assert.match(sheet, /prefers-reduced-motion: reduce/)
})

test('the capture flags, the /__proto route and /scrub exist in a test build only', () => {
  const config = source('vite.config.js')
  assert.match(config, /__TEST_BUILD__: JSON\.stringify\(command === 'serve' \|\| process\.env\.LFT_TEST_BUILD === '1'\)/)
  const shell = source('src/premium/App.jsx')
  assert.match(shell, /__TEST_BUILD__ && <Route path="\/__proto\/lesson\/:num"/)
  assert.match(shell, /__TEST_BUILD__\s*\?\s*<Route path="\/scrub" element=\{<Page still><ScrubPage \/><\/Page>\} \/>\s*:\s*<Route path="\/scrub" element=\{<Navigate to="\/" replace \/>\} \/>/)
  assert.match(shell, /const ScrubPage = __TEST_BUILD__ \? lazy/)
  const page = source('src/premium/pages/Lesson.jsx')
  assert.match(page, /const TestVariant = __TEST_BUILD__ \? lazy/)
  assert.match(page, /const flag = name => \(__TEST_BUILD__ \? params\.get\(name\) : null\)/)
  // Every capture flag is read through flag(), and none straight from the address.
  assert.doesNotMatch(page, /params\.get\('(structure|band|look|still|solo|view)'\)/)
  // The figure clock's ?still check too: a production build ignores it.
  assert.match(source('src/premium/figure-engine/lib/clock.js'), /function stillPage\(\) \{\s*return __TEST_BUILD__ && /)
})

test('check:figures passes, and the build never runs it', () => {
  const pkg = readJson('package.json')
  assert.equal(pkg.scripts['check:figures'], 'node scripts/premium/check-figures.mjs')
  assert.ok(!/check:figures|check-figures/.test(pkg.scripts.build), 'a later book repair must never fail a deploy')
  const run = spawnSync(execPath, ['scripts/premium/check-figures.mjs'], { cwd: app, encoding: 'utf8' })
  assert.equal(run.status, 0, run.stdout + run.stderr)
  assert.match(run.stdout, /check:figures passed/)
})
