# Sentence Lock: the dial options

`dials.json` gives every sentence of the shared sentence bank (`../shared/sentence-bank.json`, 270 book sentences) its dials for the bike-lock game: one dial per Tongan word.

```
{ _note, rules: [ { id, what } ], sentences: [ { id, lesson, english, words, dials: [
    { index, role, right, options, sources, fixed, why } ] } ] }
```

- `role` is the bank's label for the word (null where the book does not settle it).
- `right` is the book's word, exactly as the bank has it (end punctuation included).
- `options` is the right word plus up to three wrong ones in a fixed seeded order. The game shuffles its own start position.
- `sources` runs parallel to `options`: where each string comes from (a bank sentence id, a table row, a vocabulary id, with the lesson that decides the order). It is for the review tables; the game ignores it.
- `fixed: true` means the word is shown in place with no dial, and `why` says why (`"no label in the book"`, `"no other word of this kind in the bank or the vocabulary"`, a vocabulary gap, or the list of rules that ruled the candidates out). A fixed dial's `options` is just `[right]`.

## Local data files

All three are written by `node src/games/sentence-lock/local-data.mjs` from the committed book (`git show HEAD:book/Chapter-NN.md`, so other sessions' edits to the working files never reach them; set `LFT_ROOT` if the book checkout is elsewhere). The builder never reads the book itself.

- `possessives.json`: the book's possessive tables, one row per word with its English gloss, class (e or ho), person, number, inclusiveness and `kind`: `plain` (Lesson 17 lines 37-80), `indefinite` (Lesson 29 lines 102-110 and 130-138), `postposed` (Lesson 37 lines 19-42 and 58-83), `postposed-short` (Lesson 37 line 132) and `emotional` (Lesson 52 lines 177-190; the two rows with no class are left out, and the pity words are taken off the gloss).
- `equivalents.json`: pairs the book uses for the same English meaning (`sameMeaning`: the `lahi` pairs, `lava` and `'osi`, `kei` and `lolotonga`), the two articles for "a/some" (`aSome`), and one-way rules (`oneWay`: `ē` is never a wrong option where the right word is `'eni` or `'ena`). Words are copied by vocabulary id (or by table source). Local to Sentence Lock; the shared `../shared/confusable-pairs.json` is untouched.
- `book-tables.json`: the tense marker forms by position (Lesson 15 line 77), the Tongan words that make a sentence a state (by vocabulary id), the one pronoun the shared pronoun table lacks (Lesson 19 line 153; `loadSources()` adds it in memory, the shared file is untouched) and the meanings the vocabulary lacks (Lesson 22 lines 188-200 for the aspect markers, line 55 for the noun), each used for the role it was read for and only where the vocabulary has no card.

## Rebuild

```
node src/games/sentence-lock/build-dials.mjs          # writes dials.json, prints the summary
node src/games/sentence-lock/build-dials.mjs --tsv    # also writes the review tables
```

`--tsv` writes `dials-all.tsv` and `dials-lesson-01.tsv` into `reviews/sentence-lock-2026-10-27/` of the root checkout (`LFT_ROOT` overrides its location; `--tsv <dir>` names another folder). One row per dial: lesson, id, English, the Tongan sentence, position, role, right, each wrong option with its source, fixed, why.

Never edit `dials.json` by hand. Run `npx vitest run src/games/sentence-lock`; the tests fail if the file is not what the builder makes now.

## The rules (each is in `rules` and enforced in `dials.test.js`)

- **R1 Same kind.** A wrong option has the same role label as the right word. Sources, in order: the bank's words with that role; for tense marker and pronoun the bank's `tenseTable` and `pronounTable`; for possessive `possessives.json` (rows of the right word's own kind only); for verb, noun, adjective, modifier, time word and name also the matching entries of `book-vocabulary.json` (`VOCAB_TYPES` in the builder). Words of the sentence's own lesson and earlier lessons come first, then the nearest later lessons; inside a group the order is a seeded shuffle. A tense marker dial always offers one marker of each other tense, so Lesson 1 shows later-lesson markers (the book introduces them in Lesson 2).
- **R2 Never a second right answer.**
  - R2a: no other tense marker of the right word's tense, and one option per tense. On "is/are/am" + a state (no "-ing" word), or when the Tongan marker is followed (directly, or after *'ikai ke*) by the existential pair, *totonu*, *pau*, an adjective or a "be ..." word, present and perfect count as one tense; on "is/are/am" + "-ing" with no future cue no future marker is offered.
  - R2b: the general "one" pronoun is never a wrong option for an "I" or "you" subject. A pronoun option never has the same person as the subject the English names, unless the English marks the number or inclusiveness that rules it out ("(one person)", "(exclusive, three or more)", "(two)", "(to a group)", "(not including you)"). A pronoun that is not the bank's subject takes its person from its own table row.
  - R2c: another form of the same pronoun (the "I" forms) is a wrong option only where the table's book lines settle it: the right word's line says "after" the marker in front of it and the option's line does not name that marker.
  - R2d: no option clashes with the right word under `clashes()` from `../shared/fair.js`, and no two wrong options clash.
  - R2e: no two options are equal after okinafy display and case-folding; an accent-only variant counts as equal.
  - R2f (added by this step): no option whose meaning shares a content word with the sentence's English.
  - R2g (added by this step): outside tense marker, pronoun, name and possessive, the right word and every option must have a vocabulary meaning, so R2d and R2f could run. A word without one is fixed. The lookup ignores acute accents and macrons. A preposition with no vocabulary meaning (the "with" word) is still a dial; its options are checked against the English including small words.
  - R2h: where the English says "a/an/some", or has a number and no "the", and the noun has no final accent, the two articles of `equivalents.json` are not wrong options for each other. A `oneWay` rule is never a wrong option where the right word is one of its listed words.
  - R2i: a direction word is a dial only where the English marks the direction (come, toward, around, up, down, away, here).
  - R2j: a possessive in the book's tables (Lessons 17, 29, 37, 52) is a dial; its options are rows of the same kind and class, another person (whatever the number, so long and short forms of one person and a dual and its plural are one word), no gloss word in the English.
- **R3 No give-away by spelling.** A pronoun after a word whose accent depends on the pronoun (a tense marker, or any word the bank prints accented before a one-syllable pronoun) is offered only with pronouns of the right word's number of vowels. A tense marker option shows the form the book prints in its slot (Ch 15:77): the form that stands before a pronoun only right before a pronoun, the other form everywhere else; and the bank's accented form before a one-syllable pronoun (the book's own pattern, which matches all 209 tense markers in the bank), the bare form elsewhere. Every other option has the accent state (acute or none) of the right word, taken from the bank or the vocabulary; a word with no such form is not offered. The right word's end punctuation is copied onto the options.
- **R4 Data only.** Every option string comes from the bank, its tables, the possessive tables or the vocabulary, apart from copied end punctuation. Words in `LEFT_OUT_OF_GAME` never appear. No Tongan is typed in the builder or the tests.
- **R5 Dials that cannot be fair.** A null role is fixed ("no label in the book"); a word with no fair wrong option is fixed with its reason. The summary the builder prints lists every live dial with fewer than three wrong options, by role.

## Known limits (for the judge)

The clash test works from the vocabulary's English, so two words the vocabulary does not link (for example a modifier that also means "very") can sit on one dial. `equivalents.json` (local) is where a pair like that is added; the shared `../shared/confusable-pairs.json` stays as it is.
