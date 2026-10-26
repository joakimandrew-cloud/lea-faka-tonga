import vocabulary from '@app/data/book-vocabulary.json'
import { buildDeck, makeRng, makeRound } from '@app/games/word-rain/index.js'
import { ALL_WORDS } from '@app/games/shared/lists.js'

// Every game on the site, in one array. The /games page, the Games card on the
// Drills page and the search on both read it, so a game added later is one
// entry here (plus its route in src/premium/App.jsx).
//
// Each entry: key, route, title, blurb, action (the card's button word), words
// (the count shown on the card) and sample() (the line on the card, built from
// the game's own deck with a fixed seed, so no Tongan is typed in code).
//
// Word Balloons: the count is the game's own All words (course words plus the
// site's word lists, less the words it leaves out), so card and game agree.
export const GAMES = [
  {
    key: 'word-balloons',
    route: '/games/word-balloons',
    title: 'Word Balloons',
    blurb: 'Tap the meaning before the word gets away.',
    action: 'Play',
    words: ALL_WORDS.length,
    sample: () => ({
      q: 'Tap the meaning',
      ton: makeRound(buildDeck(vocabulary, 'essential'), makeRng(2026)).mover,
    }),
  },
]
