#!/usr/bin/env node
/**
 * check-orthography.mjs — Phase P2 Check 9: cross-book spelling consistency.
 *
 *   MACRON-DRIFT  the same lemma written with a macron in one place and without
 *                 it in another (māvae vs mavae, tūli vs tuli). High signal: one
 *                 spelling is usually wrong. The definitive ACUTE accent
 *                 (tohi → tohí) is meaning-bearing and folded out, so it never
 *                 trips this.
 *   OKINA-DRIFT   the same fully-folded lemma with vs without a glottal (va'e vs
 *                 vae). Lower signal — many are real minimal pairs (va'e "foot" ≠
 *                 vae "divide") — so reported separately as REVIEW.
 *
 * NOTE: a definitive-accent-shape heuristic (word-final glottal+accent, the
 * SFA-009 talavo'ú class) was tried and dropped — on a clean book it is 100%
 * false positives (ta'ú, ha'ú, motu'á all have a real root glottal). Catching a
 * SPURIOUS inserted glottal needs a base-form lexicon check; the fan-out's
 * reverse-translate gate owns that case.
 *
 * Run: node scripts/check-orthography.mjs
 */

import { parseAllChapters, normOkina, foldLemma } from './lib/chapter.mjs'

// Keeps macron + okina, folds the acute definitive accent + case (māhina≠mahina, tohi==tohí).
const macroKey = (s) => normOkina(s).normalize('NFD').replace(/́/g, '').normalize('NFC').toLowerCase().trim()
const hasMacron = (s) => /[āēīōū]/.test(s.normalize('NFC'))
const isWord = (s) => /^['a-zāēīōūáéíóú̀-̄]+$/i.test(s.normalize('NFC')) && s.length > 1

async function main() {
  const chapters = await parseAllChapters()
  const lemmas = new Map() // foldLemma -> Map(macroKey -> {surface, locs:Set})

  for (const ch of chapters) {
    for (const { line, span } of ch.tongan) {
      for (const raw of span.split(/\s+/)) {
        const tok = raw.replace(/[.,;:!?"()]+$/g, '')
        if (!isWord(tok)) continue
        const lk = foldLemma(tok)
        if (lk.length < 2) continue
        const mk = macroKey(tok)
        if (!lemmas.has(lk)) lemmas.set(lk, new Map())
        const forms = lemmas.get(lk)
        if (!forms.has(mk)) forms.set(mk, { surface: normOkina(tok), locs: new Set() })
        forms.get(mk).locs.add(`Ch${ch.number}:${line}`)
      }
    }
  }

  const macron = [], okina = []
  for (const [lk, forms] of lemmas) {
    if (forms.size < 2) continue
    const variants = [...forms.values()]
    const fmt = (v) => `${v.surface} [${[...v.locs].slice(0, 3).join(',')}${v.locs.size > 3 ? ',…' : ''}]`
    const macronDiff = variants.some((v) => hasMacron(v.surface)) && variants.some((v) => !hasMacron(v.surface))
    const okinaDiff = variants.some((v) => v.surface.includes("'")) && variants.some((v) => !v.surface.includes("'"))
    if (macronDiff) macron.push({ lemma: lk, variants: variants.map(fmt) })
    else if (okinaDiff) okina.push({ lemma: lk, variants: variants.map(fmt) })
  }

  console.log('\n── Orthography consistency (Check 9) ──')
  console.log(`\n  MACRON-DRIFT (${macron.length}) — same lemma with vs without a macron (high signal, one is usually wrong):`)
  if (!macron.length) console.log('  ✓ none')
  for (const d of macron) console.log(`  ✗ ${d.lemma}: ${d.variants.join('   ')}`)

  console.log(`\n  OKINA-DRIFT (${okina.length}) — same folded lemma with vs without glottal (REVIEW; minimal pairs expected):`)
  for (const d of okina.slice(0, 40)) console.log(`  ⚠ ${d.lemma}: ${d.variants.join('   ')}`)
  if (okina.length > 40) console.log(`  … +${okina.length - 40} more`)

  console.log(`\n  totals: MACRON-DRIFT=${macron.length}  OKINA-DRIFT=${okina.length}`)
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(2) })
