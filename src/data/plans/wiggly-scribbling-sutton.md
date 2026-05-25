# Restore em-dash policy + build a regression-prevention lint

## Context — what happened, and what your concerns actually map to

You asked three things: (1) how can I see what's been done, (2) how do we get back to the prior "no em-dashes / English-below-Tongan" state, and (3) how do we stop each new audit from quietly undoing the last one. After auditing the recent history I can map each worry to a concrete answer:

**How I can see what was done:** `git log --oneline` shows every audit phase's commits. The audit work is also tracked in `audits/Master-Execution-Tracker.md` (active phase named in the header) and per-phase registers like `audits/Plain-Language-Audit-Register.md`. The relevant prior commits here are `02cbe8d` (em-dash removal from example blocks, 2026-05-22ish), `104f4db` + `8ff5a2d` (English-below-Tongan rendering), and `b78f303` (Phase O merge — the plain-language rewrites you're worried about).

**What's actually regressed vs. what only feels regressed:**

| Concern | Reality | Action needed |
|---|---|---|
| Em-dashes reintroduced | **Real regression.** 27 em-dashes across 12 chapters, all added by Phase O's prose rewrites. The original commit only stripped them from example blocks, but you've now confirmed the policy is "zero em-dashes anywhere." | Sweep all 53 chapters. |
| English translations placed below Tongan | **False alarm.** This is enforced by the *renderer* (`filters/examples.lua` for PDF/EPUB, `lea-faka-tonga-app/src/lib/remark-examples.js` + `.cell-english` CSS for the app), not by source-file markdown. Neither file has been touched since their original commits. Phase O didn't and couldn't undo it. | Visual smoke-test only. |
| `'a e` focus marker before definite `e` | **No active regression**, but no automated check exists. Currently caught only by manual chapter audit. | Add a spot-check + lint rule. |
| Chapter numbering / sort order | **Stable.** `build.sh` line 33 enforces numeric sort; `chapters.json` is the app's single source of truth. Phase O didn't touch filenames. | Add a cheap contiguity check to the lint. |

**Root cause of your meta-concern:** the existing safeguards are all *manual* — the 7 prompts in `review-agents/` (especially `01-style-enforcement.md` which already flags em-dashes, and `02-formatting-consistency.md` rule 11 which already flags inline Tongan/English) are Claude review sessions, not automated checks. There is no `npm test` step that fails when an em-dash slips back in. That's why each new audit pass can quietly undo a style rule — nothing catches it until you happen to notice.

## Plan — two halves: restoration, then prevention

### Part A — Restoration sweep (one branch, one batch)

**A1. Em-dash sweep across all 53 chapters.** Concrete targets, by current count:
- Ch 44 (7), Ch 45 (5), Ch 19 (4), Ch 37 (2), Ch 22 (2)
- Ch 53, 51, 46, 39, 36, 27, 17 (1 each)
- Other 41 chapters: 0 each (verified via `grep -c "—" book/Chapter-*.md`)

For each em-dash, do a **meaning-preserving micro-rewrite** — replace with a comma, semicolon, colon, parenthesis pair, or split the sentence in two. Don't restructure paragraphs. The example you flagged ("the full system — how it works…") becomes "the full system: how it works…" or "the full system. It works…" — author's call sentence-by-sentence. Most of the 27 instances are simple 30-second edits.

**A2. English-below-Tongan smoke test.** Run `./build-epub.sh sampler` and `cd lea-faka-tonga-app && npm run dev`, open a Phase O chapter (e.g. Ch 44), and visually confirm examples and table cells still stack English below Tongan. Expected outcome: no work needed. This is just to satisfy the worry, not because there's evidence of a bug.

**A3. `'a e` spot-check on Phase O chapters.** `grep -nE "\\b[Kk]i e [a-zA-Z]|\\b'oku e [a-zA-Z]|\\bna'e e [a-zA-Z]" book/Chapter-{09,17,19,22,27,36,37,39,44,45,46,51,53}.md` to catch dropped `'a` between common verbs/prepositions and definite `e`. Expected outcome: empty or near-empty. Fix any hits.

**A4. Commit as `style(book): remove em-dashes across all chapters; restore zero-em-dash policy`.** One commit, all 12 files. No mixing with the lint work in Part B.

### Part B — Regression-prevention lint (one new script, build-integrated)

**B1. New script: `lea-faka-tonga-app/scripts/check-style.mjs`** (~100 lines, follow the pattern of the existing `validate-exercises.mjs` and `validate-drill-map.mjs`). Four checks:

1. **Em-dash check:** scan all `book/Chapter-*.md` for U+2014 (`—`). Any hit → fail with file:line + 80-char context. No allow-list; zero tolerance.
2. **Chapter contiguity check:** verify `book/Chapter-01.md` through `book/Chapter-53.md` all exist, no gaps, no extras. Verify `lea-faka-tonga-app/src/data/chapters.json` has 53 entries and each `title` matches the `# ` heading of its corresponding `Chapter-NN.md`.
3. **Cross-reference resolution check:** grep for `Chapter \d+:` references across `book/`; verify each cited number resolves to an existing chapter file. Catches dangling references after any future renumber.
4. **`'a e` lint (low-confidence pattern, warning-only):** scan example blocks (`:::examples` divs) for bare ` e ` immediately after a small set of particles (`ki`, `'i`, `'oku`, `na'e`, `'e`) followed by a lowercase Tongan word. Emit as warning, not failure — false positives are likely, but a heads-up is useful.

Exit code: 1 on any hard-check failure (1–3), 0 with warning stream on soft-check (4).

**B2. Wire into npm:**
- Add `"check:style": "node scripts/check-style.mjs"` to `lea-faka-tonga-app/package.json` scripts.
- Add a top-level `"audit:all"` that runs `npm run check:style && npm run audit:eva && npm run validate:drills` — single command for "is everything green."
- Do NOT add to the default `"test"` script yet — keep it opt-in for one cycle so you can tune false positives.

**B3. Update `CLAUDE.md` Hard constraints section** — add: *"Em-dashes (U+2014) are banned from `book/Chapter-*.md`. The lint at `lea-faka-tonga-app/scripts/check-style.mjs` enforces this — run `npm run check:style` before merging any audit phase."* This is the durable instruction that prevents the next audit phase from quietly reintroducing them, even if a different person/agent does that audit.

**B4. Add a one-paragraph entry to `audits/Master-Execution-Tracker.md`** noting that style enforcement (em-dashes, chapter contiguity, cross-refs) is now lint-gated; future audit phases must keep the lint green at close-out.

### Critical files

**Modified for restoration (A1):** `book/Chapter-{17,19,22,27,36,37,39,44,45,46,51,53}.md` — em-dash rewrites only, no other prose changes.

**New for prevention (B1, B3):**
- `lea-faka-tonga-app/scripts/check-style.mjs` (new, ~100 lines, mirrors `validate-drill-map.mjs` structure)
- `lea-faka-tonga-app/package.json` (add two `scripts` entries)
- `CLAUDE.md` (add one bullet to Hard constraints)
- `audits/Master-Execution-Tracker.md` (one paragraph footer)

**Reuse, don't rebuild:**
- Lint script structure: follow `lea-faka-tonga-app/scripts/validate-drill-map.mjs` (Node ESM, file walk, exit-code semantics).
- Chapter loader: `lea-faka-tonga-app/src/data/chapters.json` is already authoritative — reuse it as the source-of-truth for the contiguity check.
- Renderer: don't touch `filters/examples.lua` or `lea-faka-tonga-app/src/lib/remark-examples.js`. Both already do the right thing.

### Verification

- `grep -c "—" book/Chapter-*.md | grep -v ":0$"` returns nothing (all chapters at 0).
- `node lea-faka-tonga-app/scripts/check-style.mjs` exits 0 (after fixes).
- Deliberate sanity check: temporarily add an em-dash to one chapter, run the script, confirm it fails with the right file:line. Revert.
- `./build-epub.sh sampler` produces the same visual layout as before (English stacked under Tongan in example pairs and table cells).
- `cd lea-faka-tonga-app && npm run dev`, open `/chapters/44`, visually confirm Chapter 44 examples and tables still stack correctly.
- Spot-read 3 modified chapters end-to-end to confirm no meaning changes from the em-dash rewrites.

### What this plan does NOT do

- Doesn't touch the renderer or CSS (no regression there).
- Doesn't add `'a e` as a hard failure (false-positive risk too high without a fuller grammar parser; warning-only).
- Doesn't try to automate the 7 review-agent prompts — they're still your manual quality bar; the lint is just a floor.
- Doesn't sweep Quick Practice or workbook exercises for em-dashes — scoped to `book/` per your stated concern. If you want that too, easy to add later.

### Future-proofing the workflow

The structural answer to your meta-concern — *"will the next audit undo this?"* — is that **automated checks are the only durable mechanism**. Any rule that lives only in a `CLAUDE.md` bullet or a review-agent prompt depends on whoever runs the next audit reading it and remembering. Anything in `npm run check:style` survives turnover and survives me forgetting. The pattern to repeat next time something matters: codify it in `check-style.mjs` immediately, not just in a doc.
