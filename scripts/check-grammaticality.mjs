#!/usr/bin/env node
/**
 * check-grammaticality.mjs — Phase P2 Check 7 (mechanical half).
 *
 * High-precision sequence lints over EVERY Tongan span in examples, answer keys,
 * and body — the answer key especially, which the provenance report never
 * examined. Catches the structural-rule violations the SFA history and the
 * project's memory rules name explicitly:
 *
 *   - na'e immediately before a preposed pronoun  (Tongan uses na'a before
 *     pronouns; na'e is for noun-subjects / negation — Churchward 7.1).
 *   - 'ikai ke before a pronoun / 'ikai te before a bare verb  (te pairs with
 *     pronouns, ke with bare verbs — Churchward 9.2-3).
 *   - ha'u mai as a directional  (not valid; cf. SFA-024/028 — use foki mai).
 *   - ho ho'o  (verbal-noun possessive is he ho'o, never ho ho'o).
 *   - bare focus `e` after a transitive verb where 'a e was dropped.
 *
 * These are CANDIDATES, not verdicts: reported as warnings (the reverse-translate
 * gate in the fan-out adjudicates). Run: node scripts/check-grammaticality.mjs
 */

import { parseAllChapters, normOkina } from './lib/chapter.mjs'

const PRON = 'ku|ke|ne|u|tau|mau|mou|nau' // preposed cardinal pronouns (common set)

// Verbs that take a definite focus-marked object `'a e …` (shared with check-style).
const A_E_PRECEDERS = ['kai', 'inu', 'lau', 'tā', 'tanu', 'tatala', 'fai', 'ako', 'nofo', 'lele', 'foki']

const RULES = [
  {
    name: "na'e+pronoun",
    re: new RegExp(`\\bna'e\\s+(${PRON})\\b`, 'i'),
    note: "na'e before a preposed pronoun — Tongan uses na'a before pronouns (Churchward 7.1)",
    conf: 'high',
  },
  {
    name: "'ikai ke+pronoun",
    re: new RegExp(`\\b'ikai\\s+ke\\s+(${PRON})\\b`, 'i'),
    note: "'ikai ke before a pronoun — use 'ikai te before a preposed pronoun (Churchward 9.2-3)",
    conf: 'high',
  },
  {
    name: "ha'u mai",
    re: /\bha'u\s+mai\b/i,
    note: "ha'u mai is not a valid directional (cf. SFA-024/028); use foki mai / ha'u ki heni",
    conf: 'high',
    // Skip lines that TEACH the form is wrong (the Ch 28 rule note quotes
    // *ha'u mai* as a counter-example: "you will not hear *ha'u mai*…").
    // Without this guard the lint flags its own corrected rule statement.
    skipIfLine: /not used with|will not hear|not a valid|never say|do not say|\bincorrect\b/i,
  },
  {
    name: "ho ho'o",
    re: /\bho\s+ho'o\b/i,
    note: "ho ho'o — the verbal-noun possessive is he ho'o, not ho ho'o",
    conf: 'high',
  },
  {
    name: "'ikai te+bare-verb",
    re: new RegExp(`\\b'ikai\\s+te\\s+(?!(?:${PRON})\\b)['a-zāēīōū]`, 'i'),
    note: "'ikai te before a non-pronoun — te pairs with pronouns, ke with bare verbs (review)",
    conf: 'med',
  },
  {
    name: 'bare-focus-e',
    re: new RegExp(`\\b(${A_E_PRECEDERS.join('|')})\\s+e\\s+[a-zāēīōū]`, 'i'),
    note: "transitive verb + bare 'e' — focus-marked definite object should be 'a e (may be a legitimate cleft)",
    conf: 'med',
  },
]

async function main() {
  const chapters = await parseAllChapters()
  const hits = []
  for (const ch of chapters) {
    // Scan every italic Tongan span; dedupe identical (line, rule) so a repeated
    // span on one line counts once.
    const seen = new Set()
    for (const { line, region, span } of ch.tongan) {
      const s = normOkina(span)
      for (const rule of RULES) {
        if (rule.re.test(s)) {
          if (rule.skipIfLine && rule.skipIfLine.test(ch.lines[line - 1] || '')) continue
          const k = `${ch.number}|${line}|${rule.name}`
          if (seen.has(k)) continue
          seen.add(k)
          hits.push({ ch: ch.number, file: ch.file, line, region, rule: rule.name, conf: rule.conf, note: rule.note, span: span.slice(0, 80) })
        }
      }
    }
  }

  console.log('\n── Grammaticality lints (Check 7, mechanical) ──')
  const byConf = (c) => hits.filter((h) => h.conf === c)
  const high = byConf('high'), med = byConf('med')
  if (hits.length === 0) {
    console.log('  ✓ no grammaticality-lint hits in examples/answers across 52 chapters')
  } else {
    if (high.length) {
      console.log(`\n  HIGH-confidence (${high.length}):`)
      for (const h of high) console.log(`  ✗ Ch${h.ch}:${h.line} [${h.rule}] (${h.region})  *${h.span}*\n        → ${h.note}`)
    }
    if (med.length) {
      console.log(`\n  REVIEW (${med.length}) — false positives expected (clefts, semi-definite drills):`)
      for (const h of med) console.log(`  ⚠ Ch${h.ch}:${h.line} [${h.rule}] (${h.region})  *${h.span}*`)
    }
  }
  const byRule = {}
  for (const h of hits) byRule[h.rule] = (byRule[h.rule] || 0) + 1
  console.log(`\n  totals: ${high.length} high, ${med.length} review — ${Object.entries(byRule).map(([k, v]) => `${k}=${v}`).join('  ')}`)
  // Informational like check-style's warning scans; the hard gate stays check:style.
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(2) })
