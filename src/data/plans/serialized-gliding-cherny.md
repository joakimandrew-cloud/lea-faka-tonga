# Plain-English Rewrite of Ch 44 and Ch 45 (Case Studies)

## Context

The book's original mission is to make Churchward's *Tongan Grammar* accessible to non-academics. Early chapters (Ch 5, Ch 18) demonstrate the accessible style: **example first, plain-English description, technical terms introduced only after the concept is visible.** Late chapters (Ch 44 — *The Definitive Accent System*, Ch 45 — *Verbal Nouns*) have drifted into a more academic register. Sentences like:

> "Sometimes the beginning of a noun group, including its nucleus, is understood but not spoken. The definitive accent still appears, marking the end of the implied group." (Ch 44, line 158)

> "A verbal noun can serve as the subject of a sentence, with the person performing the action expressed as a possessive phrase with *'a*. The stative or adjective functions as the predicate." (Ch 45, line 167)

…lead with abstract structural description and use terms (*nucleus*, *predicate*, *stative*, *possessive phrase*, *suppressed group*) that the book hasn't taught and that a layman won't know. The reader can't anchor the explanation to anything.

The goal: rewrite Ch 44 and Ch 45 to match the existing Ch 18 style, **without** changing the grammar taught, the example sentences, the exercises, the answers, the Words to Learn tables, or the section structure. This is a **prose pass** over the explanatory paragraphs only.

Ch 44 and Ch 45 are the user's two flagged case studies. Once the rewrite pattern is validated here, the same treatment can be applied chapter-by-chapter to other late chapters during the in-progress Phase M3 (Level-Appropriateness manual sweep) — but that broader rollout is **out of scope** for this plan.

---

## Approach: "Ch 18 style" rules

Apply these rules to every academic passage flagged below. These rules are extracted from the existing Ch 18 prose and from `spec/Grammar-Concepts-for-Students.md`:

1. **Show before name.** Start each section (or sub-section) with a concrete Tongan example and its translation. Describe what's happening in plain English. Only then name the technical term.
2. **Define jargon inline, the first time it appears in the chapter.** Use a parenthetical or a one-clause gloss. e.g., "the predicate (the part of the sentence that says what's true about the subject)".
3. **Replace removable jargon with plain English.** Some terms (*stative*, *implied group*, *the underlying principle*) can be cut entirely without losing meaning. Some terms must stay because they are canonical names for Tongan-specific phenomena (*definitive accent*, *verbal noun*, *'e-class* / *ho-class* possessive) — keep those, but always with the example-first framing.
4. **Use a mental model, not a structural description.** Ch 18 uses "Think of the article and noun as a single pronunciation unit where the stress adjusts to cover the whole group." That intuitive picture does more work than any formal definition. Mirror this in Ch 44 and Ch 45.
5. **Preserve everything else.** Every example sentence, every translation, every exercise, every answer, every cross-reference, every table, every `::: {.examples}` block, every "Words to Learn" row — **untouched**. The diff should be confined to explanatory prose paragraphs.

---

## Specific passages to rewrite

### Chapter 44 (`book/Chapter-44.md`)

| Line(s) | Issue | Approach |
|---|---|---|
| 3 (chapter opener) | Front-loads six technical terms ("semi-definiteness, groups within groups, suppressed groups, phrasal accents, emphasis, double-vowel phenomenon") before any are explained. | Replace with a plain opener naming what the chapter does, not the labels. e.g., "Ch 18 introduced the basic stress shift; this chapter shows the full pattern, including what happens with nested phrases, dropped words, and long vowels." |
| 7–29 ("Three levels of definiteness, revisited") | Solid but opens with "Now that you have worked through forty-four chapters..." which is filler; the term "indefinite/semi-definite/definite" appears in the table before being re-introduced for the reader. | Trim opener; carry the three terms over from Ch 18 directly. |
| 92 ("The nucleus (the core noun)…") | "Nucleus" appears without definition. The Ch 18 metaphor of "pronunciation unit" already works. | Drop "nucleus" entirely — use "the core noun" or just "the noun itself". |
| 136–152 ("Groups within groups") | "Inner / outer noun group", "runs from X all the way to Y" — formal nesting language. | Lead with the example. Plain-English version: "When a noun phrase contains another noun phrase inside it, each one is definite on its own, so each one gets its own accent." |
| 158 (user-flagged) | "Sometimes the beginning of a noun group, including its nucleus, is understood but not spoken. The definitive accent still appears, marking the end of the implied group." | Rewrite as: "Sometimes the speaker drops the first part of a noun phrase — the noun itself and anything before it — when the listener can fill it in from context. The accent still falls on the last word that *is* spoken." Then show the cleft-sentence example. |
| 188–204 ("Phrasal and clausal definitive accents") | Opens with abstract description ("Sometimes a sentence begins with a phrase or clause that presents a definite person, thing, place, time, or situation."). | Lead with one of the examples (*Ko ho'o 'alú ki fē?*) and the intuition: "When a sentence opens by setting up a specific thing or moment to talk about, that opener gets the accent — the same way a definite noun does, but applied to a whole phrase or clause." |
| 262–266 ("Double vowels — underlying principle") | "Underlying principle" + "Tongan avoids placing a long vowel in a position where it would also carry the main stress." That phrasing is the most academic in the chapter. | Rewrite: "A long vowel can't sit in a stressed spot. When the definitive accent forces stress onto a long vowel, the vowel splits into two short vowels — the second one carrying the stress." |
| 275–277 ("Synthetic vs. analytic double vowels") | Title is jargon; the body actually explains it clearly. | Rename heading to "Two kinds of double vowels" or similar. Body prose is mostly fine. |

### Chapter 45 (`book/Chapter-45.md`)

| Line(s) | Issue | Approach |
|---|---|---|
| 1–3 (chapter opener) | "A verbal noun is a verb used as a noun, a word for an action treated as a thing." This is actually a good plain-English definition — keep it. The phrase "Building on the basic construction..." should be checked but is probably OK. | No change beyond verification. |
| 9 ("Preposed subjects become possessive pronouns") | "Preposed" is not defined until line 10 ("the pronoun between the tense marker and the verb"). The heading itself is opaque. | Rename heading to something concrete: "When the doer was a pronoun before the verb" or "Pronoun subjects in verbal noun phrases". |
| 56 ("Postposed subjects stay unchanged") | Same issue. | Rename heading similarly: "When the doer was a noun after the verb". |
| 81–115 ("What happens to objects" — three sub-patterns) | Each sub-pattern leads with the structural condition ("When the verb has a postposed subject or no subject…"). Better to lead with what changes and show. | Re-lead each sub-section with the visual pattern: "If the verb already has a possessive-pronoun doer in front of it, the object stays exactly as it was." Then show. |
| 167 (user-flagged) | "A verbal noun can serve as the subject of a sentence, with the person performing the action expressed as a possessive phrase with *'a*. The stative or adjective functions as the predicate:" | Rewrite as: "You can also turn the whole *act* of doing something into the subject of a sentence — 'Seini's singing', 'Tēvita's working'. Then a quality word describes that act:" Then show the examples. **Drop the words "stative" and "predicate" entirely** — they're removable. |
| 200 (the *'ene* vs *hono* note) | Strong concept, but opens with "Not every verb used as a noun is a verbal noun. The possessive class signals the difference." That sentence runs ahead of the examples. | Restructure to: example pair first (*'ene ngāue* / *hono ngāue*), then the rule. |

---

## Critical files

- `book/Chapter-44.md` — prose rewrite per the table above; everything else untouched.
- `book/Chapter-45.md` — prose rewrite per the table above; everything else untouched.
- `spec/Grammar-Concepts-for-Students.md` — **check first** whether plain-language entries already exist for: *verbal noun*, *possessive phrase*, *predicate*, *noun phrase / noun group*, *cleft sentence*. If any are missing, add a short entry **before** doing the chapter rewrite, so the rewrite has a stable source it can mirror.
- `audits/Level-Appropriateness-Audit-Register.md` — file two new findings (`LAA-021` for Ch 44, `LAA-022` for Ch 45) under the existing format. Status starts `pending`, flipped to `applied` per chapter as commits land. This keeps the audit register accurate even though the edits happen outside the M3 "collection-only" workflow (the user explicitly authorized this work).

The user-confirmed scope is **inline rewrites only** — no chapter-opener "reader note" callouts, no separate plain-English boxes alongside the academic prose.

---

## Execution sequence

1. **Glossary check** — open `spec/Grammar-Concepts-for-Students.md` and confirm/add entries for the terms listed above. Show the user any new entries before adding.
2. **File LAA-021 (Ch 44)** in the audit register with status `pending`, format matching existing findings (`Description`, `Evidence`, `Recommended remediation`, `Alternative options`, `Decision`).
3. **Rewrite Ch 44 prose** per the table. Show the user **the diff of the first two sections** before applying the rest, so the tone can be calibrated.
4. **Commit** as `audit(LAA-021): plain-English rewrite of Ch 44 explanatory prose`. Flip status to `applied` in register.
5. **File LAA-022 (Ch 45)** the same way.
6. **Rewrite Ch 45 prose** per the table; show the user the first two sections before continuing.
7. **Commit** as `audit(LAA-022): plain-English rewrite of Ch 45 explanatory prose`. Flip status to `applied`.
8. **Verification pass** (see below).
9. Note in the LAA register that the same rewrite pattern is candidate work for other dense late chapters during M3, but is NOT being applied in this session.

---

## Verification

- **Sentence-by-sentence preservation check.** For each chapter, diff the rewritten file against the original and confirm every example sentence (every `::: {.examples}` block), every translation, every table, every Words to Learn row, every exercise, and every answer is byte-identical to the original. Only paragraph prose between those anchors should change.
- **Tone check.** Read the rewritten sections aloud. Each section should open with a concrete Tongan example or a sentence that names what speakers DO. No paragraph should open with "Sometimes the X is Y" or "When the Z is W" without an example immediately before.
- **Jargon check.** Search the rewritten chapters for *nucleus*, *stative*, *predicate*, *implied group*, *underlying principle*, *preposed*, *postposed* in body prose (not in headings or technical sub-notes where canonical). Either remove or define inline on first use.
- **Line count check.** Ch 44 is currently 393 lines, Ch 45 is 299. Both should remain under 500.
- **Build check.** Run `./build.sh digital` and `cd lea-faka-tonga-app && npm run build`. Both should succeed; chapter rendering in the app should show no broken structure.
- **Cross-reference check.** `grep -n "Chapter 44\|Chapter 45\|Chapter 18" book/*.md spec/Grammar-Concepts-for-Students.md` — no cross-references should be broken.
- **Spot read.** Open the digital PDF to Ch 44 and Ch 45 and read 2–3 pages of each end-to-end. The reading experience should feel continuous with Ch 18, not like a different book.

---

## Out of scope (deferred)

- **Other late chapters** (Ch 35–43, Ch 46–53). The same academic-density issue likely exists in several. Apply the pattern as part of Phase M3 chapter-by-chapter sweep; file findings as `LAA-NNN` rows when caught.
- **Reader-note callouts** at chapter openers ("If the labels feel unfamiliar..."). User chose inline-only.
- **Plain-English callout boxes** alongside academic prose. User chose inline-only.
- **Structural changes** to Ch 44 or Ch 45 — section order, exercise count, section splits/merges. Out of scope; this is a prose pass only.
- **Renaming "definitive accent" or "verbal noun"** — these are the canonical Tongan-grammar terms, established in earlier chapters; keep them.
- **Workbook chapters** (`workbook/Chapter-44-Workbook.md`, `workbook/Chapter-45-Workbook.md`). Workbooks are exercise-only per `feedback_workbook_design`; no academic prose to rewrite.
- **Quiz files, video scripts, app drill files** — none of these contain the explanatory prose that's the problem.
