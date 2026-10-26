# Shared game code

What every game on the site calls instead of rebuilding it. Word Balloons (`../word-rain/`) is the first user; a new game imports from here and keeps only its own screen, rules and round shape. Nothing here knows about balloons.

- **deck.js** builds the cards a game plays from `book-vocabulary.json` and the site word lists (`buildDeck`, `allWordsDeck`, `wordListDecks`), and holds `LEFT_OUT_OF_GAME`, the words no game may use. A game takes its deck from here, never from the raw JSON.
- **lists.js** is the Words menu: `MENU`, `ALL_WORDS`, `listById(id)`, `homeList(card)`. Call `listById` with the id the player chose to get the list's cards, and `bestKey(listId)` for its best-score key.
- **fair.js** holds the fair-answer rules: `clashes(target, other)` says whether `other` could pass for a right answer (shared content word, shared meaning item, same spelling, derived pair, or a pair in `confusable-pairs.json`), plus `posClass`, `makeRng` (seeded, for tests and sample rounds) and `shuffle`. Call `clashes` on every distractor.
- **confusable-pairs.json** is the list of synonym pairs that share no word and so must never sit in one round. Add a pair here, never in a game.
- **bag.js** is the shuffle bag: every word once before any repeats, a missed word back once 5 to 8 turns later. Call `resumeBag`, `drawFromBag`, `missedInBag` and save with `bagToSave`.
- **scoring.js** is points, streak multiplier and speed bonus: `pointsFor({ elapsedMs, durationMs, streak, level })` and `multiplierFor(streak)`. Lives live in each game's own state.
- **sound.js** is synthesised sounds (no audio files): `unlock()` from a tap, then `play(name)` only when the game's own mute setting is off.
- **store.js** is `readStore` and `writeStore`, localStorage that survives a browser which refuses it. Use it for mute and for any saved state.
- **best-scores.js** keeps best scores on this device: `readBests(storageKey)`, `bestOf(bests, key)`, and `recordBest(...)` at game over, which writes and says whether it is a new best. Each game passes its own storage key; Word Balloons uses `lft-word-rain-best`.
- **index.js** re-exports the pure modules above (not lists.js or sound.js, which are imported by path).

Left in `word-rain/` on purpose: levels.js (sky, flight speed and the second word, all balloon rules), speed.js, game.js, scene.jsx and the balloon round shape in rounds.js.
