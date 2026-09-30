export const POINTING_CUES = [
  {
    id: 'speaker',
    label: 'Near the speaker',
    shortLabel: 'Speaker',
  },
  {
    id: 'listener',
    label: 'Near the listener',
    shortLabel: 'Listener',
  },
  {
    id: 'pointing',
    label: 'Pointing',
    shortLabel: 'Pointing',
  },
  {
    id: 'mentioned',
    label: 'Previously mentioned',
    shortLabel: 'Mentioned',
  },
]

// These are copied from the five approved examples in book/Chapter-39.md.
// Keep the storage spelling (ASCII fakauʻa) and normalize only at render time.
export const POINTING_ITEMS = [
  {
    sourceLine: 59,
    tongan: 'Nofo heni.',
    english: 'Stay here.',
    answer: 'speaker',
    why: 'Heni refers to what is near the speaker or in the speaker’s current focus.',
  },
  {
    sourceLine: 69,
    tongan: "Ko ho'o kató ena 'i he loki.",
    english: 'There (near you) is your basket in the room.',
    answer: 'listener',
    why: 'Ena refers to what is near the listener.',
  },
  {
    sourceLine: 77,
    tongan: 'Ko e hā ē?',
    english: 'What is that? (pointing)',
    answer: 'pointing',
    diagramLabel: 'Pointed-to referent',
    why: 'Ē supplies a pointing cue. What is pointed to can be near either person; pointing is not a third distance band.',
  },
  {
    sourceLine: 79,
    tongan: 'Tuku hē.',
    english: 'Put it there. (where I am pointing)',
    answer: 'pointing',
    diagramLabel: 'Pointed-to place',
    why: 'Hē supplies a pointing cue. The place can be near either person; pointing is not a third distance band.',
  },
  {
    sourceLine: 87,
    tongan: 'Ko ia pē.',
    english: 'That is all.',
    answer: 'mentioned',
    why: 'Ia refers to something already mentioned or being discussed, detached from both speaker and listener.',
  },
]

export function createPointingSceneState() {
  return {
    index: 0,
    status: 'asking',
    selected: null,
    wrongChoices: [],
    resolution: null,
    finished: false,
  }
}

export function reducePointingScene(state, action) {
  if (action.type === 'reset') return createPointingSceneState()

  if (action.type === 'next') {
    if (state.finished || state.status !== 'resolved') return state
    if (state.index === POINTING_ITEMS.length - 1) {
      return { ...state, finished: true }
    }
    return {
      ...state,
      index: state.index + 1,
      status: 'asking',
      selected: null,
      wrongChoices: [],
      resolution: null,
    }
  }

  if (action.type !== 'choose' || state.finished || state.status === 'resolved') return state
  if (!POINTING_CUES.some((cue) => cue.id === action.cueId)) return state
  if (state.wrongChoices.includes(action.cueId)) return state

  const item = POINTING_ITEMS[state.index]
  if (action.cueId === item.answer) {
    return {
      ...state,
      status: 'resolved',
      selected: action.cueId,
      resolution: 'correct',
    }
  }

  if (state.wrongChoices.length === 0) {
    return {
      ...state,
      status: 'retry',
      selected: action.cueId,
      wrongChoices: [action.cueId],
    }
  }

  return {
    ...state,
    status: 'resolved',
    selected: action.cueId,
    wrongChoices: [...state.wrongChoices, action.cueId],
    resolution: 'revealed',
  }
}
