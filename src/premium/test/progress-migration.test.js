import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LEGACY_CHAPTER_KEY,
  LEGACY_PROGRESS_MIGRATION,
  LEGACY_QUIZ_KEY,
  PREMIUM_PROGRESS_KEY,
  migrateLegacyProgress,
  normalizeProgress,
  readProgress,
  validLesson,
  validScore,
} from '../lib/progress-migration.js'

class MemoryStorage {
  constructor(initial = {}, { blocked = false, quota = false } = {}) {
    this.values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]))
    this.blocked = blocked
    this.quota = quota
    this.reads = []
    this.writes = []
  }
  getItem(key) {
    this.reads.push(key)
    if (this.blocked) throw new Error('storage blocked')
    return this.values.get(String(key)) ?? null
  }
  setItem(key, value) {
    this.writes.push(key)
    if (this.blocked) throw new Error('storage blocked')
    if (this.quota) throw new Error('quota exceeded')
    this.values.set(String(key), String(value))
  }
}

const json = value => JSON.stringify(value)

test('empty storage becomes a valid, completed migration without inventing progress', () => {
  const storage = new MemoryStorage()
  assert.deepEqual(readProgress(storage), {
    done: [],
    quiz: {},
    _migrations: { releasedProgress: LEGACY_PROGRESS_MIGRATION },
  })
  assert.deepEqual(storage.writes, [PREMIUM_PROGRESS_KEY])
})

test('valid released chapter and quiz scores migrate once while legacy keys remain', () => {
  const initial = {
    [LEGACY_CHAPTER_KEY]: '37',
    [LEGACY_QUIZ_KEY]: json({
      1: { best: 8, of: 10, at: '2026-01-01T00:00:00Z' },
      52: { best: 10, of: 10 },
    }),
  }
  const storage = new MemoryStorage(initial)
  const migrated = migrateLegacyProgress(storage)
  assert.deepEqual(migrated.done, [], 'opening Lesson 37 never implies that Lessons 1–36 are complete')
  assert.equal(migrated.last, 37)
  assert.deepEqual(migrated.quiz, { 1: { right: 8, total: 10 }, 52: { right: 10, total: 10 } })
  assert.equal(storage.getItem(LEGACY_CHAPTER_KEY), initial[LEGACY_CHAPTER_KEY])
  assert.equal(storage.getItem(LEGACY_QUIZ_KEY), initial[LEGACY_QUIZ_KEY])

  const writes = storage.writes.length
  const reads = storage.reads.length
  assert.deepEqual(migrateLegacyProgress(storage), migrated)
  assert.equal(storage.writes.length, writes, 'second read does not rewrite premium storage')
  assert.deepEqual(storage.reads.slice(reads), [PREMIUM_PROGRESS_KEY], 'completed migration does not reread legacy keys')
})

test('existing valid premium state wins ties and retains the stronger score', () => {
  const storage = new MemoryStorage({
    [PREMIUM_PROGRESS_KEY]: json({
      done: [1, 2, 2],
      last: 12,
      quiz: { 7: { right: 9, total: 10 }, 8: { right: 3, total: 5 } },
      futureField: 'keep',
    }),
    [LEGACY_CHAPTER_KEY]: '51',
    [LEGACY_QUIZ_KEY]: json({
      7: { best: 8, of: 10 },
      8: { best: 3, of: 10 },
      9: { best: 7, of: 10 },
    }),
  })
  const progress = readProgress(storage)
  assert.deepEqual(progress.done, [1, 2])
  assert.equal(progress.last, 12)
  assert.deepEqual(progress.quiz, {
    7: { right: 9, total: 10 },
    8: { right: 3, total: 5 },
    9: { right: 7, total: 10 },
  })
  assert.equal(progress.futureField, 'keep')
})

test('malformed and out-of-range records are rejected rather than guessed', () => {
  const storage = new MemoryStorage({
    [PREMIUM_PROGRESS_KEY]: '{bad json',
    [LEGACY_CHAPTER_KEY]: '53',
    [LEGACY_QUIZ_KEY]: json({
      0: { best: 1, of: 1 },
      1: { best: -1, of: 10 },
      2: { best: 11, of: 10 },
      3: { best: 2.5, of: 10 },
      4: { best: 2, of: 0 },
      5: { best: '2', of: 10 },
      53: { best: 1, of: 1 },
      nope: { best: 1, of: 1 },
    }),
  })
  const progress = readProgress(storage)
  assert.deepEqual(progress.done, [])
  assert.equal(progress.last, undefined)
  assert.deepEqual(progress.quiz, {})
  assert.equal(validLesson('01'), null)
  assert.equal(validLesson(1), 1)
  assert.equal(validScore({ right: 0, total: 1 }).right, 0)
  assert.equal(validScore({ right: NaN, total: 1 }), null)
})

test('malformed premium members are sanitized independently', () => {
  assert.deepEqual(normalizeProgress({
    done: [1, '2', 0, 53, 1],
    last: '7',
    quiz: { 1: { right: 2, total: 3 }, 2: { right: 4, total: 3 }, 99: { right: 1, total: 1 } },
  }), {
    done: [1, 2],
    last: 7,
    quiz: { 1: { right: 2, total: 3 } },
    _migrations: {},
  })
})

test('blocked and quota-failing storage never prevents rendering', () => {
  const blocked = new MemoryStorage({}, { blocked: true })
  assert.doesNotThrow(() => readProgress(blocked))
  assert.deepEqual(readProgress(blocked).done, [])

  const quota = new MemoryStorage({
    [LEGACY_CHAPTER_KEY]: '6',
    [LEGACY_QUIZ_KEY]: json({ 6: { best: 4, of: 5 } }),
  }, { quota: true })
  const progress = readProgress(quota)
  assert.equal(progress.last, 6)
  assert.deepEqual(progress.quiz, { 6: { right: 4, total: 5 } })
  assert.equal(quota.getItem(PREMIUM_PROGRESS_KEY), null, 'failed write leaves storage untouched')
  assert.equal(quota.getItem(LEGACY_CHAPTER_KEY), '6')
  assert.ok(quota.writes.every(key => key === PREMIUM_PROGRESS_KEY), 'migration writes only the premium key')
})

test('migration leaves unrelated and unprefixed source storage untouched', () => {
  const daily = json({ 'lesson-1-kai': 3 })
  const storage = new MemoryStorage({
    'lft-daily-words-v1': daily,
    theme: 'dark',
    unrelated: 'keep',
  })
  readProgress(storage)
  assert.equal(storage.getItem('lft-daily-words-v1'), daily)
  assert.equal(storage.getItem('theme'), 'dark')
  assert.equal(storage.getItem('unrelated'), 'keep')
  assert.deepEqual([...new Set(storage.writes)], [PREMIUM_PROGRESS_KEY])
})
