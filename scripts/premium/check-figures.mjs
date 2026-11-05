// Checks every lesson's figure file against that lesson's book text
// (plan 2026-11-05-lesson-page-simplify; the card is spec/Lesson-Figures-Method.md).
//
//   node scripts/premium/check-figures.mjs        every file in src/premium/figures
//   node scripts/premium/check-figures.mjs 15     one lesson
//   npm run check:figures [-- 15]
//
// For each src/premium/figures/NN.js it checks:
//   1. every say, en and tile string (and each lane form, chip, particle, grid marker and
//      rest, opening row and recall sentence) is found verbatim in book/Chapter-NN.md after
//      the normalisation of tools/check-tongan.py: U+0027, U+2018 and U+2019 become U+02BB,
//      NFC, asterisks removed, case sensitive, accents and macrons counted;
//   2. each state that has a sentence joins to it (tiles in order = the say);
//   3. each beat names a tile the scene has, and goes to a state it has;
//   4. every role is in the fixed colour key;
//   5. each anchor block exists, in exactly one section (a ### heading, or a #### inside one);
//   6. in-between states carry no English: English comes after the changes;
//   7. the opening row is at most five tiles; recall sentences do not outnumber the key rules,
//      and a key rule with no book sentence is skipped with null (or a hole), never filled.
// It exits 1 on any failure and prints each one. A figure cannot be seen moving the wrong
// way by a script; a separate reader compares each figure with its section.
//
// It is deliberately NOT part of `npm run build`. It runs with the other gates a ship runs
// (`/ship`), so a later book repair can fail a check and be fixed, and can never fail a deploy
// and take the site down. The parsing follows scripts/premium/check-lesson-plan.mjs: no Vite
// server, and a small loader hook for the JSON import that plain node refuses.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { register } from 'node:module'
import { parseLessonContent } from '../../src/premium/lib/lesson-content.js'
import { groupSections } from '../../src/premium/lib/lesson-plan.js'
import { anchorIndex } from '../../src/premium/figure-engine/anchor.js'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const figuresDir = path.join(app, 'src/premium/figures')
const readJson = relative => JSON.parse(fs.readFileSync(path.join(app, relative), 'utf8'))
const chapters = readJson('src/data/chapters.json')
const quickPractice = readJson('src/data/quick-practice.json')
const drillMap = readJson('src/data/drill-map.json')

register('data:text/javascript,' + encodeURIComponent(
  'export async function load(url, context, next) {' +
  ' if (url.endsWith(".json")) return next(url, { ...context, importAttributes: { ...context.importAttributes, type: "json" } });' +
  ' return next(url, context) }',
))
const { slugify } = await import('../../src/lib/remark-drill-anchors.js')

// The fixed colour key (spec/Lesson-Figures-Method.md). It never changes by lesson.
const ROLES = new Set(['tense', 'verb', 'noun', 'particle', 'pronoun', 'focus', 'question', 'place', 'quiet'])
const KINDS = new Set(['row', 'fork', 'grid', 'path'])
const ROW_BEATS = new Set(['move', 'add', 'drop', 'swap', 'en', 'limit', 'slot', 'line'])
const CHANGE_BEATS = new Set(['move', 'add', 'drop', 'swap', 'slot'])
const PEOPLE = new Set(['speaker', 'listener', 'third', 'away'])

// The normalisation of tools/check-tongan.py, in the same order.
const normalise = text => String(text).replace(/['‘’]/g, 'ʻ').normalize('NFC')
const bookText = markdown => normalise(markdown.replace(/\*/g, ''))
const squash = text => normalise(text).replace(/\s+/g, ' ').trim()
// A sentence without its closing punctuation, for joining tiles to a say.
const bare = text => squash(text).replace(/[.!?…]+$/u, '').trim()

const requested = process.argv[2] ? Number(process.argv[2]) : null
if (process.argv[2] && (!Number.isInteger(requested) || requested < 1 || requested > 52)) {
  console.error(`usage: node scripts/premium/check-figures.mjs [lesson 1 to 52]`)
  process.exit(2)
}

const files = fs.existsSync(figuresDir)
  ? fs.readdirSync(figuresDir).filter(name => /^\d\d\.js$/.test(name)).sort()
  : []
const wanted = requested ? files.filter(name => Number(name.slice(0, 2)) === requested) : files
if (requested && !wanted.length) {
  console.error(`Lesson ${requested} has no figure file (src/premium/figures/${String(requested).padStart(2, '0')}.js)`)
  process.exit(1)
}

const failures = []
let strings = 0
let figureCount = 0
const rows = []

for (const name of wanted) {
  const n = Number(name.slice(0, 2))
  const nn = name.slice(0, 2)
  const fail = (where, message) => failures.push(`Lesson ${n} ${where}: ${message}`)
  const chapterFile = path.join(app, 'book', `Chapter-${nn}.md`)
  if (!fs.existsSync(chapterFile)) { fail('book', `book/Chapter-${nn}.md is missing`); continue }
  const markdown = fs.readFileSync(chapterFile, 'utf8')
  const book = bookText(markdown)
  const parsed = parseLessonContent(markdown, { chapter: n, quickPractices: quickPractice[String(n)] || [], drillAnchors: drillMap[String(n)] || [], slugify })
  const sections = groupSections(parsed.blocks)
  const meta = chapters.find(c => c.chapter === n)

  let mod
  try {
    mod = await import(pathToFileURL(path.join(figuresDir, name)).href)
  } catch (error) {
    fail('file', `cannot be imported: ${error.message}`)
    continue
  }
  const { FIGURES, OPENING, RECALL } = mod
  if (!Array.isArray(FIGURES)) { fail('file', 'does not export FIGURES as an array'); continue }

  const inBook = (where, value, what) => {
    strings += 1
    if (typeof value !== 'string' || !value.trim()) return fail(where, `${what} is empty`)
    if (!book.includes(squash(value))) fail(where, `${what} ${JSON.stringify(value)} is not in the lesson's book text`)
  }
  const tilesJoin = tiles => squash(tiles.map(tile => tile.text).join(' '))
  const checkRole = (where, tile) => {
    if (!ROLES.has(tile.role)) fail(where, `role ${JSON.stringify(tile.role)} is not in the fixed key (${[...ROLES].join(', ')})`)
  }
  const checkJoin = (where, tiles, say, what) => {
    if (!say) return
    if (bare(tiles.map(tile => tile.text).join(' ')) !== bare(say)) {
      fail(where, `${what} tiles read ${JSON.stringify(tilesJoin(tiles))}, which does not join to ${JSON.stringify(say)}`)
    }
  }

  const ids = new Set()
  FIGURES.forEach((def, index) => {
    figureCount += 1
    const at = `figure ${def?.id ?? index}`
    if (!def || typeof def !== 'object') return fail(at, 'is not an object')
    if (!new RegExp(`^${n}\\.\\d+$`).test(def.id || '')) fail(at, `id must read ${n}.K`)
    if (ids.has(def.id)) fail(at, 'id is used twice')
    ids.add(def.id)
    if (!KINDS.has(def.kind)) fail(at, `kind ${JSON.stringify(def.kind)} is not one of ${[...KINDS].join(', ')}`)
    if (!Array.isArray(def.scenes) || !def.scenes.length) return fail(at, 'has no scenes')

    // 5. The anchor block exists, in exactly one section.
    if (!def.after || typeof def.after.section !== 'string' || typeof def.after.block !== 'function') {
      fail(at, 'after needs a section and a block function')
    } else {
      const holders = sections.filter(s => anchorIndex(s, def.after) >= 0)
      if (holders.length === 0) fail(at, `the anchor block in section ${JSON.stringify(def.after.section)} does not exist`)
      if (holders.length > 1) fail(at, `the anchor matches blocks in ${holders.length} sections (${holders.map(s => s.id).join(', ')}), so the figure would show more than once`)
    }

    // Strings in the book, wherever they sit in the figure.
    const walk = (value, trail) => {
      if (Array.isArray(value)) return value.forEach((item, i) => walk(item, [...trail, i]))
      if (!value || typeof value !== 'object') return
      const here = trail.join('.')
      if (typeof value.role === 'string') {
        checkRole(`${at} ${here}`, value)
        inBook(`${at} ${here}`, value.text, 'tile')
      }
      for (const [key, item] of Object.entries(value)) {
        const place = `${at} ${[...trail, key].join('.')}`
        if (typeof item === 'string') {
          if (key === 'say' || key === 'en') inBook(place, item, key)
          else if (key === 'marker' || key === 'rest') inBook(place, item.trim(), key)
          else if (key === 'particle') inBook(place, item, 'particle')
          else if (key === 'to' && trail.includes('chips')) inBook(place, item, 'chip')
          else if (key === 'dirText') inBook(place, item, 'direction wording')
        } else if (key === 'forms' && Array.isArray(item)) {
          item.forEach((form, i) => inBook(`${place}.${i}`, form, 'lane form'))
        } else if (key === 'laneForms' && Array.isArray(item)) {
          item.forEach((forms, li) => (forms || []).forEach((form, i) => inBook(`${place}.${li}.${i}`, form, 'lane form')))
        } else if (key === 'limit' && item && typeof item.en === 'string') {
          inBook(`${place}.en`, item.en, 'limit English')
        }
        if (item && typeof item === 'object') walk(item, [...trail, key])
      }
    }
    walk({ ...def, after: undefined }, [])

    def.scenes.forEach((scene, si) => {
      const where = `${at} scene ${scene.key ?? si}`
      if (def.kind === 'row') {
        const tiles = scene.tiles || {}
        const states = scene.states || []
        if (!states.length) return fail(where, 'has no states')
        for (const [state, i] of states.map((s, k) => [s, k])) {
          for (const entry of state) {
            const [key, face] = entry
            if (key === 'GHOST' || key === 'SLOT') continue
            if (!tiles[key]) fail(where, `state ${i} names tile ${JSON.stringify(key)}, which the scene does not have`)
            else if (!tiles[key][face ?? 0]) fail(where, `state ${i} names face ${face} of tile ${JSON.stringify(key)}, which has ${tiles[key].length}`)
          }
        }
        const faceOf = ([key, face]) => (key === 'GHOST' || key === 'SLOT' ? null : tiles[key]?.[face ?? 0])
        const stateTiles = i => (states[i] || []).map(faceOf).filter(Boolean)
        // 2. States that have a sentence join to it.
        if (scene.before) checkJoin(where, stateTiles(0), scene.before.say, 'first state')
        if (scene.after) checkJoin(where, stateTiles(states.length - 1), scene.after.say, 'last state')
        if (scene.lines) {
          if (scene.lines.length !== states.length) fail(where, `lines has ${scene.lines.length} entries for ${states.length} states`)
          scene.lines.forEach((line, i) => checkJoin(where, stateTiles(i), line.say, `state ${i}`))
        }
        // 3. Beats name real tiles and real states.
        const beats = scene.beats || []
        beats.forEach((beat, bi) => {
          if (!ROW_BEATS.has(beat.kind)) fail(where, `beat ${bi} has kind ${JSON.stringify(beat.kind)}`)
          for (const id of [].concat(beat.tile ?? [])) {
            if (!tiles[id]) fail(where, `beat ${bi} (${beat.kind}) names tile ${JSON.stringify(id)}, which the scene does not have`)
          }
          if (beat.roll && !tiles[beat.roll]) fail(where, `beat ${bi} rolls tile ${JSON.stringify(beat.roll)}, which the scene does not have`)
          if (beat.to != null && !(Number.isInteger(beat.to) && beat.to >= 0 && beat.to < states.length)) fail(where, `beat ${bi} goes to state ${beat.to}, and the scene has ${states.length}`)
        })
        // 6. English comes after the changes. A scene whose every state is a printed sentence is exempt.
        if (!scene.lines) {
          const firstEn = beats.findIndex(beat => beat.kind === 'en')
          if (firstEn >= 0 && beats.slice(firstEn + 1).some(beat => CHANGE_BEATS.has(beat.kind))) {
            fail(where, 'a change comes after the English beat, so an in-between state would carry English')
          }
        }
      } else if (def.kind === 'fork') {
        const lanes = def.lanes || []
        ;(scene.cases || []).forEach((c, ci) => {
          const here = `${where} case ${ci}`
          if (!Number.isInteger(c.lane) || c.lane < 0 || c.lane >= lanes.length) fail(here, `lane ${c.lane} is not one of the ${lanes.length} lanes`)
          const row = (c.row || []).map(tile => (tile.slot ? tile.form : tile))
          checkJoin(here, row, c.say, 'row')
          // A sentence the book gives no English gets none: say so with en: null, never by leaving it out.
          if (c.en === undefined) fail(here, 'has no English; write en: null where the book gives none')
        })
      } else if (def.kind === 'path') {
        ;(scene.cases || []).forEach((c, ci) => {
          const here = `${where} case ${ci}`
          // A particle can end a verb (ʻoatu), so it need only occur in the sentence.
          if (c.particle && !squash(c.say || '').includes(normalise(c.particle))) fail(here, `the particle ${JSON.stringify(c.particle)} is not in ${JSON.stringify(c.say)}`)
          for (const key of ['from', 'to']) {
            if (c[key] != null && !PEOPLE.has(c[key])) fail(here, `${key} is ${JSON.stringify(c[key])}; use speaker, listener, third or away`)
          }
        })
      } else if (def.kind === 'grid') {
        for (const row of def.rows || []) {
          // A row head marked *like this* is Tongan, so it is copied from the book like any tile.
          for (const piece of String(row.tense ?? '').match(/\*[^*]+\*/g) || []) inBook(where, piece.slice(1, -1), 'row head')
          for (const cell of row.cells || []) {
            if (cell.marker != null && cell.say !== `${cell.marker}${cell.rest}`) fail(where, `a grid cell says ${JSON.stringify(cell.say)} but its marker and rest read ${JSON.stringify(`${cell.marker}${cell.rest}`)}`)
          }
        }
      }
    })
  })

  // The opening row: a still in the hero.
  if (OPENING != null) {
    const where = 'opening'
    if (!Array.isArray(OPENING.row) || !OPENING.row.length) fail(where, 'has no row')
    else {
      if (OPENING.row.length > 5) fail(where, `has ${OPENING.row.length} tiles; five at most`)
      checkJoin(where, OPENING.row, OPENING.say, 'row')
    }
    inBook(where, OPENING.say, 'say')
    inBook(where, OPENING.en, 'en')
  }

  // Recall sentences: one per key rule, in order, from the book.
  if (RECALL != null) {
    const rules = meta?.teaching?.key_rules || []
    if (!Array.isArray(RECALL)) fail('recall', 'is not an array')
    else {
      if (RECALL.length > rules.length) fail('recall', `has ${RECALL.length} sentences for ${rules.length} key rules`)
      RECALL.forEach((item, i) => {
        if (item == null) return // a rule with no book sentence gets no card
        inBook(`recall ${i}`, item?.to, 'to')
        inBook(`recall ${i}`, item?.en, 'en')
      })
    }
  }

  rows.push(`Lesson ${String(n).padStart(2)}: ${FIGURES.length} figures, ${OPENING ? 'opening row' : 'no opening row'}, ${RECALL ? `${RECALL.filter(item => item != null).length} recall sentences` : 'no recall sentences'}`)
}

for (const row of rows) console.log(row)
console.log(`${wanted.length} figure ${wanted.length === 1 ? 'file' : 'files'}, ${figureCount} figures, ${strings} strings checked against the book`)
if (failures.length) {
  console.log(`\nFAILED: ${failures.length}`)
  failures.forEach(line => console.log(`  ${line}`))
  process.exit(1)
}
console.log('check:figures passed')
