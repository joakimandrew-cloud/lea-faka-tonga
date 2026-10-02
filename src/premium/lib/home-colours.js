export const HOME_COLOUR_STORAGE_KEY = 'lft-home-colour'
export const DEFAULT_HOME_COLOUR = 'red'

export const HOME_COLOURS = Object.freeze([
  {
    id: 'red',
    label: 'Red',
    cover: '/covers/2026-09-30-three-row/cover-red-3d.webp',
    alt: 'The red Lea Faka-Tonga book, shown standing upright',
  },
  {
    id: 'black',
    label: 'Black',
    cover: '/covers/2026-09-30-three-row/cover-black-3d.webp',
    alt: 'The black Lea Faka-Tonga book, shown standing upright',
  },
  {
    id: 'blue',
    label: 'Blue',
    cover: '/covers/2026-09-30-three-row/cover-blue-3d.webp',
    alt: 'The blue Lea Faka-Tonga book, shown standing upright',
  },
  {
    id: 'white',
    label: 'White',
    cover: '/covers/2026-10-02-white/cover-white-3d.webp',
    alt: 'The white Lea Faka-Tonga book, shown standing upright',
  },
])

const HOME_COLOUR_IDS = new Set(HOME_COLOURS.map(colour => colour.id))

export function isHomeColour(value) {
  return HOME_COLOUR_IDS.has(value)
}

export function readHomeColour(storage) {
  try {
    const browserStorage = storage ?? (typeof window === 'undefined' ? null : window.localStorage)
    const saved = browserStorage?.getItem(HOME_COLOUR_STORAGE_KEY)
    return isHomeColour(saved) ? saved : DEFAULT_HOME_COLOUR
  } catch {
    return DEFAULT_HOME_COLOUR
  }
}

export function saveHomeColour(colour, storage) {
  if (!isHomeColour(colour)) return false

  try {
    const browserStorage = storage ?? (typeof window === 'undefined' ? null : window.localStorage)
    if (!browserStorage) return false
    browserStorage.setItem(HOME_COLOUR_STORAGE_KEY, colour)
    return true
  } catch {
    return false
  }
}

export function getHomeColour(colour) {
  return HOME_COLOURS.find(option => option.id === colour) ?? HOME_COLOURS[0]
}
