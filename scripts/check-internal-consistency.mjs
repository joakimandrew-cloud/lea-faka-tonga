#!/usr/bin/env node
/**
 * check-internal-consistency.mjs — Phase P2 Check 5 (intra-chapter).
 *
 * Two mechanical sub-checks within a single chapter:
 *
 *   DANGLING-WTL  a Words-to-Learn headword that never appears in the chapter's
 *                 body / examples / answers / exercises — taught but never shown.
 *
 *   GLOSS-COLLISION  one English gloss mapped to ≥2 distinct Tongan forms across
 *                 the chapter's tables + examples. This is the family SFA-006
 *                 lived in (body paradigm vs table paradigm). Reported as REVIEW
 *                 because legitimate paradigms (definite vs indefinite "my":
 *                 'eku/ha'aku/hoku/haku) also collide — the fan-out adjudicates.
 *
 * Run: node scripts/check-internal-consistency.mjs
 */

import { parseAllChapters, foldLemma, contentWords } from './lib/chapter.mjs'

async function main() {
  const chapters = await parseAllChapters()
  const dangling = []
  const collisions = []

  for (const ch of chapters) {
    // Every Tongan lemma used OUTSIDE the Words-to-Learn table.
    const used = new Set()
    for (const { region, span } of ch.tongan) {
      if (region === 'wtl-table') continue
      // index each whitespace-separated token AND the whole span (multiword headwords)
      used.add(foldLemma(span))
      for (const w of span.split(/\s+/)) used.add(foldLemma(w))
    }

    for (const row of ch.wtl) {
      const k = foldLemma(row.tongan)
      const parts = row.tongan.split(/\s+/).map(foldLemma)
      const shown = used.has(k) || parts.every((p) => used.has(p))
      if (!shown && k.length > 1) {
        dangling.push({ ch: ch.number, line: row.line, word: row.tongan, gloss: row.english })
      }
    }

    // English gloss -> set of Tongan forms (from WtL + examples)
    const byGloss = new Map()
    const add = (english, tongan, where) => {
      const key = contentWords(english).sort().join(' ')
      if (!key) return
      if (!byGloss.has(key)) byGloss.set(key, new Map())
      const forms = byGloss.get(key)
      const fk = foldLemma(tongan)
      if (!forms.has(fk)) forms.set(fk, { surface: tongan.trim(), where })
    }
    for (const row of ch.wtl) add(row.english, row.tongan, `WtL:${row.line}`)
    for (const ex of ch.examples) if (!/\s/.test(ex.tongan.trim())) add(ex.gloss, ex.tongan, `${ex.region}:${ex.line}`)
    for (const [key, forms] of byGloss) {
      if (forms.size >= 2) {
        collisions.push({ ch: ch.number, gloss: key, forms: [...forms.values()].map((f) => `${f.surface} (${f.where})`) })
      }
    }
  }

  console.log('\n── Intra-chapter consistency (Check 5) ──')
  console.log(`\n  DANGLING-WTL (${dangling.length}) — Words-to-Learn headword never shown in the chapter:`)
  if (!dangling.length) console.log('  ✓ none')
  for (const d of dangling) console.log(`  ⚠ Ch${d.ch}:${d.line}  *${d.word}* ("${d.gloss}")`)

  console.log(`\n  GLOSS-COLLISION (${collisions.length}) — one English gloss → multiple Tongan forms (REVIEW; paradigm FPs expected):`)
  // Only show collisions with short, specific glosses (≥2 content words) to cut
  // single-word-synonym noise; full set is in the count.
  const sharp = collisions.filter((c) => c.gloss.split(' ').length >= 2)
  for (const c of sharp.slice(0, 40)) console.log(`  ⚠ Ch${c.ch}  "${c.gloss}" → ${c.forms.join('  |  ')}`)
  if (sharp.length > 40) console.log(`  … +${sharp.length - 40} more sharp collisions`)

  console.log(`\n  totals: DANGLING-WTL=${dangling.length}  GLOSS-COLLISION=${collisions.length} (sharp=${sharp.length})`)
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(2) })
