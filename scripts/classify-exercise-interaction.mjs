// ---------------------------------------------------------------------------
// classify-exercise-interaction.mjs  (dev-only, discovery tool)
//
// Reads src/data/book-exercises.json and proposes, per exercise, the right
// website interaction under the 2026-06-16 ruling:
//
//   mcq     — a faithful CLOSED set of answers exists (a word bank): the
//             learner taps the right option. Bank is recovered ONLY from the
//             book (option list stated in title/instructions  ∪  the items'
//             own canonical answers). Never invented.
//   reveal  — open production / translation / unique-per-item build: the
//             answer stays blurred until tapped.
//
// Output: a human-readable register at audits/Exercise-Interaction-Review.md
// (path is repo-root/audits, NOT the app). This is a PROPOSAL only — the
// judge-verified Phase 2 pass corrects the bank and the mcq/reveal call before
// anything ships. Re-run:  node scripts/classify-exercise-interaction.mjs
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP = resolve(__dirname, '..')
const ROOT = resolve(APP, '..')
const data = JSON.parse(readFileSync(resolve(APP, 'src/data/book-exercises.json'), 'utf8'))

// --- helpers ---------------------------------------------------------------

// Lenient key for de-duping options (mirrors book-exercise-grading.normalize):
// ʻokina is kept (phonemic), accents stripped, case folded.
function key(s) {
  return String(s || '')
    .replace(/\*+/g, '')
    .replace(/[‘’ʻ'`]/g, "'")
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// Display form of a canonical answer token: take the leading *italic* run if
// present (e.g. "*kia*. Sione is a personal noun." -> "kia"), else the text up
// to the first sentence break. Strip emphasis asterisks.
function answerToken(item) {
  const raw = (item.accept && item.accept[0]) || item.answer || ''
  const m = raw.match(/^\s*\*([^*]+)\*/)
  let t = m ? m[1] : raw.split(/[.\n]/)[0]
  return t.replace(/\*/g, '').trim()
}

// Pull *italic* option tokens out of a "list region" of the title/instructions,
// stopping before any Example/Model/arrow (those italics are demos, not options).
function listTokens(text) {
  if (!text) return []
  let region = text.split(/Example|Model|→/i)[0]
  const toks = []
  const re = /\*([^*]+)\*/g
  let m
  while ((m = re.exec(region)) !== null) {
    // a slash-joined run like "ki / kia / kiate" is several options
    m[1].split('/').forEach((p) => { const t = p.trim(); if (t) toks.push(t) })
  }
  return toks
}

// English classification labels: "...whether it is intransitive or transitive",
// "...indefinite, semi-definite, or definite", "pity, affection, ... or endearment".
function classificationLabels(text) {
  if (!text) return []
  const m = text.match(/whether (?:it is|the [^,]*? is|[^,]*? means|the device is|the reduplication is|the effect is)\s+([^.]+)/i)
    || text.match(/state whether[^.]*?\bis\b\s+([^.]+)/i)
    || text.match(/identify[^.]*?:\s*([^.]+)/i)
  if (!m) return []
  // strip parenthetical glosses, lettered markers, split on commas / "or"
  return m[1]
    .replace(/\([^)]*\)/g, '')
    .replace(/\([a-f]\)/gi, '')
    .split(/,|\bor\b/i)
    .map((s) => s.replace(/["“”']/g, '').trim())
    .filter((s) => s && s.length <= 24 && !/^the\b|^a\b/i.test(s))
}

const PRODUCTION = /\b(form the|build the|build \*|give (?:the|its)[^.]*meaning|and its meaning|and translate|rewrite|convert|arrange|combine|join the|add the (?:correct )?(?:time|modifier|person)|change (?:each|to)|respond to|write the (?:complete|tongan|form)|complete the sentence with the correct \*loto\*)/i
const TWO_PART = /then (?:write|translate)|and translate|, then\b|and write the|identify (?:them|which)|then write the complete|, and (?:write|give)/i
const OPEN_CAT = /a postposed pronoun|the correct (?:word|form|preposition|conjunction|spatial noun|demonstrative|article|register|emotional form|possessive)\b(?![^.]*[:(])/i

// --- classify --------------------------------------------------------------

const rows = []
let mcq = 0, reveal = 0

for (const ch of Object.keys(data).sort((a, b) => +a - +b)) {
  for (const ex of data[ch]) {
    const type = ex.type
    // Already-interactive or always-open types are not in scope for re-routing.
    if (type === 'matching' || type === 'mcq' || type === 'translate_to_english' || type === 'translate_to_tongan') continue

    const titleI = listTokens(ex.title)
    const instrI = listTokens(ex.instructions)
    const labels = classificationLabels(ex.instructions) .concat(classificationLabels(ex.title))
    const answered = ex.items.filter((it) => it.answer)
    const ansToks = answered.map(answerToken)
    const distinctAns = [...new Map(ansToks.map((t) => [key(t), t])).values()]

    // candidate bank = stated options ∪ item answers, deduped on lenient key
    const stated = [...titleI, ...instrI]
    const bankMap = new Map()
    for (const t of [...stated, ...(labels.length ? labels : []), ...ansToks]) {
      const k = key(t)
      if (k && !bankMap.has(k)) bankMap.set(k, t)
    }
    const bank = [...bankMap.values()]

    const explicit = stated.length >= 2 || labels.length >= 2
    const text = `${ex.title || ''} ${ex.instructions || ''}`
    const isProd = PRODUCTION.test(text)
    const isTwoPart = TWO_PART.test(text)
    const isOpenCat = OPEN_CAT.test(text) && !explicit
    const nOfN = answered.length > 0 && distinctAns.length === answered.length && distinctAns.length > 4
    const allShort = bank.length > 0 && bank.every((t) => t.split(/\s+/).length <= 3 && t.length <= 16)

    const flags = []
    if (isProd) flags.push('production?')
    if (isTwoPart) flags.push('two-part?')
    if (isOpenCat) flags.push('open-category?')
    if (nOfN) flags.push('N-unique-of-N→matching/reveal?')
    if (distinctAns.length <= 1) flags.push('distinct≤1→reveal')
    if (labels.length >= 2) flags.push('classification(EN-labels)')
    if (bank.some((t) => /^-|-$/.test(t))) flags.push('affix-options')
    if (/\([^)]+\)/.test(stated.join(' ')) && type !== 'free') flags.push('gloss-options')

    // proposal
    let proposed, src, conf
    if (labels.length >= 2 && !isTwoPart) {
      proposed = 'mcq'; src = 'EN-labels'; conf = 'high'
    } else if (explicit && !isProd && !isOpenCat && allShort) {
      proposed = 'mcq'; src = stated.length >= 2 ? 'stated-list' : 'answers'; conf = 'high'
    } else if (!explicit && !isProd && !isOpenCat && !nOfN && allShort &&
               distinctAns.length >= 2 && distinctAns.length <= 6) {
      proposed = 'mcq'; src = 'answers-only'; conf = 'medium'
    } else {
      proposed = 'reveal'; src = isProd ? 'production' : isOpenCat ? 'open' : nOfN ? 'unique-per-item' : 'open'; conf = explicit ? 'medium' : 'high'
    }
    if (proposed === 'mcq') mcq++; else reveal++

    rows.push({
      ch, id: ex.id, num: ex.number, type, n: ex.items.length,
      proposed, src, conf, bank, distinct: distinctAns.length, flags,
      title: (ex.title || '').replace(/\n/g, ' '),
      instr: (ex.instructions || '').replace(/\n/g, ' '),
    })
  }
}

// --- emit register ---------------------------------------------------------

const mcqRows = rows.filter((r) => r.proposed === 'mcq')
const revRows = rows.filter((r) => r.proposed === 'reveal')
const flagged = rows.filter((r) => r.flags.length && (r.proposed === 'mcq' || r.src !== 'open'))

const esc = (s) => String(s).replace(/\|/g, '\\|')
const bankCell = (b) => (b.length ? '`' + b.join('` · `') + '`' : '—')

let md = `# Exercise Interaction Review — tap-to-reveal vs multiple-choice

> Auto-generated by \`lea-faka-tonga-app/scripts/classify-exercise-interaction.mjs\` (Phase 1, ${'2026-06-16'}). **PROPOSAL ONLY** — the Phase 2 judge pass corrects the bank + the mcq/reveal call before anything ships. Plan: [[exercise-interaction-review]].

Scope: the only "type the answer" surface in the website chapters is **Book Exercises** (\`fill_blank\` + typeable \`transform\`). Drills/builders are tap/chip-based; quizzes are already MCQ; \`translate_*\` and \`matching\` items are out of re-routing scope (translate → always reveal; matching → already tap-to-match).

## Headline
- Exercises examined (excl. translate/matching/existing-mcq): **${rows.length}**
- → propose **multiple-choice (tap)**: **${mcq}**
- → propose **tap-to-reveal**: **${reveal}**
- Flagged for judge attention (borderline / false-positive-prone): **${flagged.length}**

The proposal rules: a closed Tongan/label set stated in the title or instructions, or recoverable from the items' own answers, ⇒ **mcq**; "form/build the word", "give its meaning", rewrite/convert/translate, unique-answer-per-item, or open-category ("the correct word", "a postposed pronoun") ⇒ **reveal**. \`bank\` is the proposed option set (book-sourced).

---

## A. Proposed MULTIPLE-CHOICE (${mcq})
The learner taps the answer from these options. Judge must confirm the bank is complete + faithful (e.g. ch7-ex2 should carry all 9 forms) and strip any explanation cruft.

| Ch | Exercise | Type | Items | Bank source | Conf | Proposed bank | Flags |
|---|---|---|---|---|---|---|---|
`
for (const r of mcqRows) {
  md += `| ${r.ch} | \`${r.id}\` ${esc(r.title).slice(0, 40)} | ${r.type} | ${r.n} | ${r.src} | ${r.conf} | ${bankCell(r.bank.map(esc))} | ${r.flags.join(', ') || ''} |\n`
}

md += `\n## B. Proposed TAP-TO-REVEAL (${reveal})
Open production / translation / unique-per-item — no faithful closed set, so the answer stays blurred until tapped. Judge confirms none of these is secretly a clean pick-list.

| Ch | Exercise | Type | Items | Why reveal | Distinct ans | Flags |
|---|---|---|---|---|---|---|
`
for (const r of revRows) {
  md += `| ${r.ch} | \`${r.id}\` ${esc(r.title).slice(0, 40)} | ${r.type} | ${r.n} | ${r.src} | ${r.distinct} | ${r.flags.join(', ') || ''} |\n`
}

md += `\n## C. Judge decision log
*(Phase 2 fills this: per exercise — final interaction, the faithful bank, item→correct map, fidelity verdict, notes. Genuine judgment calls surfaced to the owner are marked ★.)*

| Ch | Exercise | Final interaction | Faithful bank | Fidelity | Judge note |
|---|---|---|---|---|---|
`

writeFileSync(resolve(ROOT, 'audits/Exercise-Interaction-Review.md'), md)
console.log(`Wrote audits/Exercise-Interaction-Review.md — ${rows.length} examined · ${mcq} mcq · ${reveal} reveal · ${flagged.length} flagged`)
