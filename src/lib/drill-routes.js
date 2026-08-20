// Where a drill lives on the site.
//
// Eleven drills have a richer bespoke page and keep their own short route; the
// rest are served by the generic /drill/:id route, which mounts the registry
// Core. Both URLs answer for a bespoke drill, which is why this map is shared
// rather than copied: the drills menu links to the route named here, and the
// prerenderer points /drill/:id at the same one with a canonical link so search
// engines do not treat the pair as duplicate content.

export const BESPOKE = {
  'tense-swapper': '/tense-swap',
  'first-word-quiz': '/first-word',
  'skeleton-filler': '/skeleton-filler',
  'possessive-sorter': '/possessive-sort',
  'clusivity-corner': '/clusivity',
  'adjective-flip': '/adjective-flip',
  'faka-pattern-sorter': '/faka-sort',
  'cleft-builder': '/cleft-builder',
  'accent-placement-picker': '/accent-placement',
  'verbal-noun-converter': '/verbal-noun',
  'terminal-builder': '/sentence-builder',
}

export const routeFor = (id) => BESPOKE[id] || `/drill/${id}`
