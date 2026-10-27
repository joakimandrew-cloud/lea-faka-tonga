import vocabulary from '@app/data/book-vocabulary.json'
import { buildDeck, makeRng, makeRound } from '@app/games/word-rain/index.js'
import { ALL_WORDS } from '@app/games/shared/lists.js'
import { SENTENCES, makeTiles } from '@app/games/sentence-tiles/index.js'
import { makeRng as seeded } from '@app/games/shared/fair.js'
import { SENTENCES as LOCK_SENTENCES } from '@app/games/sentence-lock/lessons.js'

// Every game on the site, in one array. The /games page, the Games card on the
// Drills page and the search on both read it, so a game added later is one
// entry here (plus its route in src/premium/App.jsx).
//
// Each entry: key, route, title, blurb, action (the card's button word), words
// (the count shown on the card), unit (what it counts; words when left out) and
// sample() (the line on the card, built from the game's own deck with a fixed
// seed, so no Tongan is typed in code).
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
  // Sentence Tiles: the count is the book's sentences the game keeps. The card
  // shows one short sentence whose prompt holds no Tongan hint, with its
  // tiles shuffled, chosen with a fixed seed.
  {
    key: 'sentence-tiles',
    route: '/games/sentence-tiles',
    title: 'Sentence Tiles',
    blurb: 'Put the words of a book sentence in order, lesson by lesson from Lesson 1.',
    action: 'Play',
    words: SENTENCES.length,
    unit: 'sentences',
    sample: () => {
      const rng = seeded(2026)
      const short = SENTENCES.filter(s => s.words.length <= 4 && !s.prompt.includes('*'))
      const s = short[Math.floor(rng() * short.length)]
      return { q: s.prompt, ton: makeTiles(s, rng).map(t => t.text).join(' · ') }
    },
  },
  // Sentence Lock: the count is the sentences the game plays (every one with a
  // dial to turn, Lessons 1 to 52). The card shows one short one (four words or
  // fewer, like Sentence Tiles' card), chosen with a fixed seed: its English and
  // its words as the dials hold them.
  {
    key: 'sentence-lock',
    route: '/games/sentence-lock',
    title: 'Sentence Lock',
    blurb: 'Turn each dial to the right word and lock it in, like a bike lock.',
    action: 'Play',
    words: LOCK_SENTENCES.length,
    unit: 'sentences',
    sample: () => {
      const rng = seeded(2026)
      const short = LOCK_SENTENCES.filter(s => s.words.length <= 4)
      const s = short[Math.floor(rng() * short.length)]
      return { q: s.english, ton: s.words.join(' · ') }
    },
  },
]
