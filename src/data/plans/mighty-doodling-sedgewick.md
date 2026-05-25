# Chapter Groupings — Tightened Leads + Tier Overlay

## Context

The `/chapters` page currently displays the 53-chapter syllabus inside six themed groups (Foundations → Advanced Patterns). The groupings are pedagogically real (they map cleanly to CEFR levels and the Basic/Intermediate/Advanced tiers in `Chapter-Inventory.md`), but two things are weak:

1. **Group leads under-describe their contents.** "Core Grammar" lists 5 themes when the group covers 7+, and Ch 14 (Greetings) — a `word_study` chapter inside that group — isn't mentioned. Same problem in "Structure & Possession" with Ch 20 (Numbers and Time). The leads in "Expanding Sentences" and "Shaping Meaning" name about half of what their groups actually contain.
2. **The Basic / Intermediate / Advanced arc is invisible.** The three-tier structure is the spine of `Chapter-Inventory.md` and `audits/Chapter-Overview-Map.md`, but on the web page the learner sees six undifferentiated groups in a flat list. The progression from "build the sentence" → "expand and refine" → "productive morphology" isn't communicated.

This plan addresses both without renumbering any chapters or moving Ch 14/20.

## Investigation summary

- The `group` field is consumed **only** by `ChapterBrowser.jsx` (line 184). It is a UI-only key — moving a chapter between groups has zero effect on teaching order or downstream chapter content.
- The Basic/Intermediate/Advanced tier vocabulary already exists in `audits/Chapter-Overview-Map.md` (lines 17, 44, 71) and `Chapter-Inventory.md` but is not stored as a field on chapter data.
- Ch 20 (Numbers and Time) has genuine forward pedagogical dependencies — Ch 22, 25, 27, 31, 32, 33 reference numerals/*toko*/*foʻi*. Those depend on Ch 20 keeping its **chapter number**, not its group assignment. Since we are not renumbering or moving anything, none of those dependencies are at risk.
- Ch 14 (Greetings) has no genuine forward pedagogical dependencies.
- No sorting logic, schema, audit register, or build script keys off the group field anywhere outside `ChapterBrowser.jsx`.

## Recommended changes

### Change 1 — Tighten the six group leads

Rewrite `GROUPS[].lead` strings in `ChapterBrowser.jsx` so each lead covers what the group actually contains, including the previously-unmentioned chapters.

| Group | Current lead | New lead |
|---|---|---|
| Foundations | Building the basic sentence. | Building the basic sentence — tense markers, pronouns, verbs, modifiers, time, commands, and location. |
| Core Grammar | Prepositions, articles, negation, questions, identification. | Prepositions, articles, negation, comitative *mo*, question words, the *ko* pattern, and everyday greetings. |
| Structure & Possession | Noun subjects, possessives, definiteness, transitive word order. | Noun subjects, equational sentences, possessives, definiteness, transitive word order, plus numbers and time. |
| Expanding Sentences | Auxiliaries, aspect, comparison, directionals, conditionals. | Auxiliaries, aspect, obligation, conjunctions, plurals, purpose, comparison, directionals, and conditionals. |
| Shaping Meaning | Existentials, faka- prefix, reported speech, clefts, postposed possessives. | Existentials, *faka-* prefix, instrumental *ʻaki*, reported speech, compound adjectives, clefts, postposed possessives, modal nuances, relative clauses, and spatial nouns. |
| Advanced Patterns | Word class flexibility, productive morphology, emotional and respectful registers. | Word class flexibility, advanced time and definitive accent, verbal nouns, noun classes, conditionals, productive suffixes and prefixes, reduplication, special pronouns, and emotional and respectful registers. |

Ch 14 and Ch 20 stay in their current groups. The new leads name them explicitly (*"…and everyday greetings"*, *"…plus numbers and time"*) so the page no longer reads as if the groups exclude them.

### Change 2 — Basic / Intermediate / Advanced tier banners

Wrap the existing six groups under three tier banners that mirror `Chapter-Inventory.md`:

```
─── BASIC · A1 · 20 chapters ───
    Build the sentence.
  ◆ Foundations          (1–6)
  ◆ Core Grammar         (7–14)
  ◆ Structure & Possess. (15–20)

─── INTERMEDIATE · A2–B1 · 20 chapters ───
    Expand and refine.
  ◆ Expanding Sentences  (21–30)
  ◆ Shaping Meaning      (31–40)

─── ADVANCED · B2 · 13 chapters ───
    Productive morphology and register.
  ◆ Advanced Patterns    (41–53)
```

**Implementation approach: derive tier from group, don't store it on each chapter.** The mapping is fixed and 1:1 (no chapter is in two tiers), so adding a `tier` field to all 53 JSON entries would be 53 redundant writes. Instead, declare a `TIERS` constant in `ChapterBrowser.jsx` that lists each tier's member group keys and renders the banner.

```js
const TIERS = [
  { key: 'basic',        name: 'Basic',        level: 'A1',
    blurb: 'Build the sentence.',
    groupKeys: ['foundations', 'core-grammar', 'structure-possession'] },
  { key: 'intermediate', name: 'Intermediate', level: 'A2–B1',
    blurb: 'Expand and refine.',
    groupKeys: ['expanding-sentences', 'shaping-meaning'] },
  { key: 'advanced',     name: 'Advanced',     level: 'B2',
    blurb: 'Productive morphology and register.',
    groupKeys: ['advanced-patterns'] },
]
```

Then refactor the existing `<div className="chapters-groups">…GROUPS.map(…)</div>` into `TIERS.map(tier => …)` with each tier rendering a banner header followed by its member groups (the group rendering block stays unchanged inside).

Banner structure (matches the existing eyebrow/title/lead/stat vocabulary already in the chapters-hero):
- Eyebrow: `Tier · {level}` (e.g. *"Tier · A1"*)
- Title: tier name
- Blurb: one-line description
- Count: total chapters across member groups

## Files to modify

1. **`lea-faka-tonga-app/src/pages/ChapterBrowser.jsx`**
   - Lines 11–82: update `GROUPS[].lead` strings per the table in Change 1.
   - After the `GROUPS` constant: add the `TIERS` constant from Change 2.
   - Lines 312–371 (the `<div className="chapters-groups">` block): wrap the existing `GROUPS.map(...)` rendering in a `TIERS.map(...)` that emits a `<section className="chapters-tier">` per tier, with a banner header and the tier's member groups inside. The inner group rendering (header, lead, grid, expand/collapse) is unchanged.

2. **`lea-faka-tonga-app/src/styles/v11-components.css`**
   - Add styles for `.chapters-tier`, `.chapters-tier-banner`, `.chapters-tier-eyebrow`, `.chapters-tier-name`, `.chapters-tier-blurb`, `.chapters-tier-count`.
   - Match the existing `chapters-hero` / `chapters-group-header` typographic scale and the Way of Code aesthetic defined in `way-of-code-design-spec.md`. The banner should read as a tier divider, not a card — likely a horizontal rule + eyebrow/title block + blurb + count, with generous vertical spacing above each banner to telegraph the tier change.

**No changes** to `lea-faka-tonga-app/src/data/chapters.json`. No changes to `Chapter-Inventory.md`, audit files, book/, workbook/, quizzes/, video/, or spec/.

## Forward dependency analysis

The user raised forward-dependency risk explicitly. Here is the full picture for the recommended plan:

| Change | Files touched | Forward deps at risk |
|---|---|---|
| Tighten 6 group leads | 1 file (`ChapterBrowser.jsx`) | None. Lead strings are pure copy. |
| Add tier banners | 2 files (`ChapterBrowser.jsx` + CSS) | None. Tier metadata is derived from existing group keys; no data schema change. |
| (Not doing) Move Ch 14 | — | Would have been safe: Ch 14 has zero downstream pedagogical references. Group field is UI-only. |
| (Not doing) Move Ch 20 | — | Group reassignment would have been safe (Ch 20 keeps its number 20, so Ch 22/25/27/31/32/33 still resolve numerals from Ch 20 by chapter order). The visual cost — Ch 20 appearing out of numeric sequence in the browser — is what motivated us not to do it. |

The teaching-order forward dependencies on Ch 20 (numerals used in Ch 22, 25, 27, 31, 32, 33; spec rules at `spec/grammar-spec.md:3407` and `spec/Phase-2-Engine-Plan.md:863`) are unaffected by anything in this plan because no chapter is being renumbered.

## Verification

1. Start the dev server: `cd lea-faka-tonga-app && npm run dev`
2. Open `http://localhost:5173/lea-faka-tonga/chapters`.
3. Confirm three tier banners render between the hero/search band and the six group sections, in order: Basic (A1, 20 chapters) → Intermediate (A2–B1, 20 chapters) → Advanced (B2, 13 chapters).
4. Confirm the six group leads now read as specified in the Change 1 table, in particular that "Core Grammar" mentions everyday greetings and "Structure & Possession" mentions numbers and time.
5. Confirm all 53 chapters still appear, the per-group chapter counts are unchanged (6 / 8 / 6 / 10 / 10 / 13), and every group's "View all N chapters" expand/collapse still works.
6. Exercise the existing filters: search ("noun", "tense", "greetings"), CEFR chips (A1/A2/B1/B2), and Grammar/Conversation chips. Confirm filtered chapter cards still appear inside their original groups under the correct tier banners.
7. Open `Chapter-Inventory.md` and confirm the Basic (1–20) / Intermediate (21–40) / Advanced (41–53) partition matches what the page now shows.
8. Click into one chapter from each tier (e.g. Ch 1, Ch 25, Ch 47) to confirm chapter navigation is unaffected.

## Out of scope

- Renumbering chapters.
- Adding a 7th group (e.g. "Everyday Tongan") for `word_study` chapters.
- Adding a `tier` field to `chapters.json`.
- Changing the Way of Code visual system or any other route.
- Updating book/workbook/quiz/audit/spec files.
