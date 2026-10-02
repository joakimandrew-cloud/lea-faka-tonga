import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { HOME_SENTENCE_FAMILIES, HOME_SENTENCE_FRAMES, sentenceForStep } from '../data/home-sentence-flip.js'

const normalize = text => text.normalize('NFC')
const sourceLines = (scope, lesson) => {
  const number = String(lesson).padStart(2, '0')
  const relative = scope === 'app'
    ? `../../../book/Chapter-${number}.md`
    : `../../../../book/Chapter-${number}.md`
  const url = new URL(relative, import.meta.url)
  if (scope === 'canonical' && !fs.existsSync(url)) return null
  return normalize(fs.readFileSync(url, 'utf8')).split(/\r?\n/)
}

const valueMap = step => Object.fromEntries([
  ...step.parts.map(part => [part.id, `${part.label}\u0000${part.text}`]),
  ['punctuation', step.punctuation],
])

const actualDifferences = (previous, current) => {
  const before = valueMap(previous)
  const after = valueMap(current)
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(id => before[id] !== after[id])
    .sort()
}

test('all 30 frames preserve their raw source sentence and English on the cited lines', () => {
  assert.equal(HOME_SENTENCE_FRAMES.length, 30)
  for (const frame of HOME_SENTENCE_FRAMES) {
    const sentence = normalize(sentenceForStep(frame))
    assert.doesNotMatch(sentence, /[ʻʼ‘’]/u, `${frame.id}: display apostrophe leaked into raw data`)
    assert.doesNotMatch(frame.source.quote, /—/u, `${frame.id}: repaired source quote regressed`)

    const appLines = sourceLines('app', frame.source.lesson)
    const appLine = appLines[frame.source.appLine - 1]
    assert.ok(appLine?.includes(sentence), `${frame.id}: Tongan missing at app Lesson ${frame.source.lesson}:${frame.source.appLine}`)
    assert.ok(appLine?.includes(frame.english), `${frame.id}: English missing at app Lesson ${frame.source.lesson}:${frame.source.appLine}`)
    const firstPair = appLines.findIndex(line => line.includes(sentence) && line.includes(frame.english)) + 1
    assert.equal(firstPair, frame.source.appLine, `${frame.id}: appLine is not the first exact pair`)

    if (frame.source.line) {
      const canonicalLines = sourceLines('canonical', frame.source.lesson)
      if (canonicalLines) {
        const canonicalLine = canonicalLines[frame.source.line - 1]
        assert.ok(canonicalLine?.includes(sentence), `${frame.id}: Tongan missing at canonical Lesson ${frame.source.lesson}:${frame.source.line}`)
        assert.ok(canonicalLine?.includes(frame.english), `${frame.id}: English missing at canonical Lesson ${frame.source.lesson}:${frame.source.line}`)
      }
    }
  }
})

test('declared changes and linked cues match every adjacent source-backed frame', () => {
  const cuePart = new Map([
    ['Change when', 'tense'],
    ['Change who', 'person'],
    ['Change the action', 'predicate'],
    ['Change the description', 'predicate'],
    ['Describe instead', 'predicate'],
    ['Add not', 'negative'],
    ['Ask it', 'punctuation'],
    ['Add more detail', 'detail2'],
  ])

  for (const family of HOME_SENTENCE_FAMILIES) {
    assert.deepEqual([...family.steps[0].change.parts].sort(), Object.keys(valueMap(family.steps[0])).sort())
    for (let index = 1; index < family.steps.length; index++) {
      const previous = family.steps[index - 1]
      const current = family.steps[index]
      assert.deepEqual([...current.change.parts].sort(), actualDifferences(previous, current), `${current.id}: declared parts`)
      for (const link of current.change.linked) {
        assert.ok(current.change.parts.includes(link.part), `${current.id}: linked ${link.part} is not changing`)
        assert.ok(link.because, `${current.id}: linked ${link.part} lacks a reason`)
      }
      const expectedPart = cuePart.get(current.cue)
      if (expectedPart) {
        const allowed = [expectedPart, ...current.change.linked.map(link => link.part)].sort()
        assert.ok(current.change.parts.includes(expectedPart), `${current.id}: cue does not name a real change`)
        if (current.change.kind !== 'reset') {
          assert.deepEqual([...current.change.parts].sort(), allowed, `${current.id}: cue hides an unrelated change`)
        }
      }
    }
  }
})

test('negative roles and family themes keep the frozen teaching contract', () => {
  assert.deepEqual(
    HOME_SENTENCE_FAMILIES.map(({ id, theme }) => [id, theme]),
    [['basic', 'red'], ['negative', 'deep-red'], ['questions', 'charcoal']],
  )

  const negative = HOME_SENTENCE_FAMILIES.find(family => family.id === 'negative')
  for (const step of negative.steps) {
    for (const part of step.parts) {
      if (part.id === 'negative') {
        assert.equal(part.label, 'NOT', `${step.id}: negative connector role`)
        assert.equal(part.text, "'ikai té", `${step.id}: negative connector spelling`)
      }
      if (part.label === 'WHEN') assert.notEqual(part.id, 'negative', `${step.id}: connector labelled as tense`)
    }
  }
})
