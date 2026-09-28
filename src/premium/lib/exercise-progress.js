export const EXERCISE_STATE_VERSION = 1
export const EXERCISE_STORAGE_KEY = 'lft-premium-exercises-v1'

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

function sourceShape(ex) {
  return {
    version: EXERCISE_STATE_VERSION,
    id: ex.id,
    type: ex.type,
    items: ex.items.map(item => ({
      id: item.id,
      prompt: item.prompt ?? null,
      options: item.options ?? null,
      correct: item.correct ?? null,
      answer: item.answer ?? null,
    })),
  }
}

export function exerciseSignature(ex) {
  return JSON.stringify(sourceShape(ex))
}

export function exerciseKind(ex) {
  if (ex.type === 'matching') return 'matching'
  if (ex.type === 'mcq' && ex.items.every(item => item.options?.length)) return 'mcq'
  return 'reveal'
}

export function emptyExerciseSnapshot(ex) {
  return {
    version: EXERCISE_STATE_VERSION,
    signature: exerciseSignature(ex),
    items: {},
  }
}

function validMcqRecord(item, value) {
  if (!isObject(value) || value.kind !== 'mcq' || !Array.isArray(value.tries) || value.tries.length === 0) return null
  const tries = value.tries
  if (tries.some(tryValue => typeof tryValue !== 'string' || !item.options.includes(tryValue))) return null
  if (new Set(tries).size !== tries.length) return null
  const correctIndex = tries.indexOf(item.correct)
  if (correctIndex >= 0 && correctIndex !== tries.length - 1) return null
  return { kind: 'mcq', tries: [...tries] }
}

function validRevealRecord(value) {
  if (!isObject(value) || value.kind !== 'reveal' || typeof value.open !== 'boolean') return null
  if (![null, true, false].includes(value.self)) return null
  if (value.self !== null && !value.open) return null
  if (!value.open && value.self === null) return null
  return { kind: 'reveal', open: value.open, self: value.self }
}

function validMatchingRecord(value) {
  if (!isObject(value) || value.kind !== 'matching' || value.matched !== true) return null
  return { kind: 'matching', matched: true }
}

export function validateExerciseSnapshot(ex, value) {
  const empty = emptyExerciseSnapshot(ex)
  if (!isObject(value) || value.version !== EXERCISE_STATE_VERSION || value.signature !== empty.signature || !isObject(value.items)) return empty

  const kind = exerciseKind(ex)
  const items = {}
  for (const item of ex.items) {
    const stored = value.items[item.id]
    if (stored === undefined) continue
    const valid = kind === 'mcq'
      ? validMcqRecord(item, stored)
      : kind === 'matching'
        ? validMatchingRecord(stored)
        : validRevealRecord(stored)
    if (valid) items[item.id] = valid
  }
  return { ...empty, items }
}

function browserStorage(storage) {
  if (storage !== undefined) return storage
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function readRoot(storage) {
  if (!storage) return null
  try {
    const parsed = JSON.parse(storage.getItem(EXERCISE_STORAGE_KEY) || 'null')
    if (!isObject(parsed) || parsed.version !== EXERCISE_STATE_VERSION || !isObject(parsed.sets)) return null
    return parsed
  } catch {
    return null
  }
}

export function readExerciseSnapshot(ex, storage) {
  const target = browserStorage(storage)
  const root = readRoot(target)
  return validateExerciseSnapshot(ex, root?.sets?.[ex.id])
}

export function initialExerciseSnapshot(ex, compact = false, storage) {
  return compact ? emptyExerciseSnapshot(ex) : readExerciseSnapshot(ex, storage)
}

export function writeExerciseSnapshot(ex, snapshot, storage) {
  const target = browserStorage(storage)
  if (!target) return false
  const valid = validateExerciseSnapshot(ex, snapshot)
  const current = readRoot(target)
  const next = {
    version: EXERCISE_STATE_VERSION,
    sets: { ...(current?.sets || {}), [ex.id]: valid },
  }
  try {
    target.setItem(EXERCISE_STORAGE_KEY, JSON.stringify(next))
    return true
  } catch {
    return false
  }
}

export function clearExerciseState(ex, storage) {
  const target = browserStorage(storage)
  if (!target) return false
  const current = readRoot(target)
  if (!current) {
    try {
      target.removeItem(EXERCISE_STORAGE_KEY)
      return true
    } catch {
      return false
    }
  }
  if (!current.sets[ex.id]) return true
  const sets = { ...current.sets }
  delete sets[ex.id]
  try {
    if (Object.keys(sets).length === 0) target.removeItem(EXERCISE_STORAGE_KEY)
    else target.setItem(EXERCISE_STORAGE_KEY, JSON.stringify({ version: EXERCISE_STATE_VERSION, sets }))
    return true
  } catch {
    return false
  }
}

export function exerciseStateFromSnapshot(ex, snapshot) {
  const valid = validateExerciseSnapshot(ex, snapshot)
  const kind = exerciseKind(ex)
  const state = {}
  for (const item of ex.items) {
    const stored = valid.items[item.id]
    if (!stored) continue
    if (kind === 'mcq') {
      const solved = stored.tries.at(-1) === item.correct
      if (solved) state[item.id] = stored.tries.length === 1 && stored.tries[0] === item.correct
    } else if (kind === 'matching') {
      state[item.id] = true
    } else if (stored.self !== null) {
      state[item.id] = stored.self
    }
  }
  return state
}

export function exerciseProgressFromSnapshot(ex, snapshot) {
  return {
    state: exerciseStateFromSnapshot(ex, snapshot),
    total: ex.items.length,
  }
}

export function readExerciseState(ex, storage) {
  return exerciseProgressFromSnapshot(ex, readExerciseSnapshot(ex, storage))
}
