#!/usr/bin/env node
/**
 * check-glosses.mjs — Phase P2 Check 2: Words-to-Learn gloss cross-check.
 *
 * For every Words-to-Learn headword, compare its English gloss against (a) the
 * EALD dictionary and (b) how the chapter's own body/examples gloss the same
 * word. This automates the class the SFA commit history keeps fixing by hand
 * (SFA-030 tanu, SFA-031/032 fekumi/mahiki, SFA-033..036 Words-to-Learn rows).
 *
 * EALD is English-indexed ({tongan,english,notes} grouped by POS); we build the
 * Tongan→gloss reverse map ourselves. A Tongan word appearing under an English
 * headword is NOT "not found" — that false-negative caused several §3 errors.
 *
 * Verdicts per headword:
 *   EALD-MATCH    gloss shares a content word with an EALD gloss for that word
 *   EALD-MISMATCH headword is in EALD but no gloss overlap (the real D5 risk)
 *   EALD-ABSENT   headword not in EALD at all (common+OK for grammar words)
 *   BODY-DRIFT    Words-to-Learn gloss shares no content word with the chapter's
 *                 own body/example gloss of the same headword
 *
 * MISMATCH/BODY-DRIFT are the findings; ABSENT on a grammar word is informational.
 * Run: node scripts/check-glosses.mjs
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { parseAllChapters, foldLemma, contentWords, cleanGloss, REPO_ROOT } from './lib/chapter.mjs'

const EALD = path.join(REPO_ROOT, 'source-materials', 'EALD-Dictionary.json')

async function buildEaldIndex() {
  const raw = JSON.parse(await fs.readFile(EALD, 'utf8'))
  const idx = new Map() // foldLemma(tongan) -> [{english, notes, cat}]
  for (const [cat, entries] of Object.entries(raw.categories || {})) {
    for (const e of entries) {
      if (!e.tongan) continue
      const k = foldLemma(e.tongan)
      if (!idx.has(k)) idx.set(k, [])
      idx.get(k).push({ english: e.english || '', notes: e.notes || '', cat })
    }
  }
  return idx
}

const overlaps = (a, b) => {
  const sb = new Set(b)
  return a.some((w) => sb.has(w))
}

async function main() {
  const [chapters, eald] = await Promise.all([parseAllChapters(), buildEaldIndex()])
  const findings = []

  for (const ch of chapters) {
    // Index the chapter's own body/example glosses by headword for BODY-DRIFT.
    const bodyGloss = new Map() // foldLemma -> [{gloss, line}]
    for (const ex of ch.examples) {
      // only single-word Tongan headwords are comparable to a WtL row
      if (/\s/.test(ex.tongan.trim())) continue
      const k = foldLemma(ex.tongan)
      if (!bodyGloss.has(k)) bodyGloss.set(k, [])
      bodyGloss.get(k).push({ gloss: ex.gloss, line: ex.line })
    }

    for (const row of ch.wtl) {
      const k = foldLemma(row.tongan)
      const wtlWords = contentWords(row.english)
      const eentries = eald.get(k)

      // EALD comparison
      if (!eentries) {
        if (row.group === 'vocab') {
          findings.push({ ch: ch.number, line: row.line, kind: 'EALD-ABSENT', conf: 'low',
            word: row.tongan, detail: `vocab headword not in EALD (build by analogy? wrong form? — gloss "${cleanGloss(row.english)}")` })
        }
      } else if (row.group === 'vocab') {
        // Grammar particles (ki, 'a, ha, pea…) carry functional glosses that
        // never overlap a content dictionary — restrict EALD sense-check to vocab.
        const ealdWords = eentries.flatMap((e) => [...contentWords(e.english), ...contentWords(e.notes)])
        if (wtlWords.length && ealdWords.length && !overlaps(wtlWords, ealdWords)) {
          findings.push({ ch: ch.number, line: row.line, kind: 'EALD-MISMATCH', conf: 'med',
            word: row.tongan, detail: `WtL "${cleanGloss(row.english)}" vs EALD ${eentries.map((e) => e.english).filter(Boolean).slice(0, 4).join('/')} (homonym/polysemy expected)` })
        }
      }

      // Body-drift comparison (intra-chapter)
      const bg = bodyGloss.get(k)
      if (bg && wtlWords.length) {
        const allBodyWords = bg.flatMap((g) => contentWords(g.gloss))
        if (allBodyWords.length && !overlaps(wtlWords, allBodyWords)) {
          findings.push({ ch: ch.number, line: row.line, kind: 'BODY-DRIFT', conf: 'med',
            word: row.tongan, detail: `WtL "${cleanGloss(row.english)}" vs body "${cleanGloss(bg[0].gloss)}" (Ch${ch.number}:${bg[0].line})` })
        }
      }
    }
  }

  console.log('\n── Words-to-Learn gloss cross-check (Check 2) ──')
  const byKind = (k) => findings.filter((f) => f.kind === k)
  if (findings.length === 0) console.log('  ✓ no gloss mismatches')
  // BODY-DRIFT (intra-chapter, highest signal) and EALD-MISMATCH (candidates) listed;
  // EALD-ABSENT summarized only (mostly legitimate derived/compound forms a beginner
  // dictionary lacks — a candidate signal for vocab attestation, not a gloss error).
  for (const kind of ['BODY-DRIFT', 'EALD-MISMATCH']) {
    const fs_ = byKind(kind)
    if (!fs_.length) continue
    console.log(`\n  ${kind} (${fs_.length})${kind === 'EALD-MISMATCH' ? ' — candidates; polysemy refuted by fan-out' : ''}:`)
    for (const f of fs_) console.log(`  ✗ Ch${f.ch}:${f.line}  *${f.word}* — ${f.detail}`)
  }
  const absent = byKind('EALD-ABSENT')
  if (absent.length) {
    console.log(`\n  EALD-ABSENT: ${absent.length} vocab headwords not in EALD (summarized; feeds Check 8 vocab-attestation).`)
    console.log(`     ${absent.map((f) => f.word).join(', ')}`)
  }
  console.log(`\n  totals: BODY-DRIFT=${byKind('BODY-DRIFT').length}  EALD-MISMATCH=${byKind('EALD-MISMATCH').length}  EALD-ABSENT=${absent.length}`)
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(2) })
