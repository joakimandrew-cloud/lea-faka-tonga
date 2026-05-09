#!/usr/bin/env node
// Phase N — Exercise Validation Audit, Passes A, B, C (deterministic, fast).
//
//   Pass A — Forward-vocab gate. Tokenize Tongan content (italicized
//            substrings) in every prompt/answer; look up each token's
//            minChapter in audits/vocab-index.json; flag when it exceeds
//            the host chapter.
//
//   Pass B — Forward-grammar gate. Substring-scan each prompt/answer for
//            markers in audits/grammar-gates.json; flag when a marker's
//            minChapter exceeds the host chapter.
//
//   Pass C — Structural alignment. Per-surface deterministic checks:
//             - missing/mismatched answers (from extractor parseFlags)
//             - quiz exactly-one-correct, four-options, rationale-per-option
//             - fill_blank prompts contain at least one ___
//
// Optional audits/eva-allowlist.json suppresses individual findings by
// itemId + issueType + marker. Use sparingly; document each entry.
//
// Outputs: audits/eva-flags.json (machine), audits/eva-flags.md (human).
// Exit code: 1 if any unsuppressed blocker or major finding; 0 otherwise.
//
// Run: node lea-faka-tonga-app/scripts/validate-exercises.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')
const ALL_EXERCISES = path.join(REPO_ROOT, 'audits', 'all-exercises.json')
const VOCAB_INDEX = path.join(REPO_ROOT, 'audits', 'vocab-index.json')
const GRAMMAR_GATES = path.join(REPO_ROOT, 'audits', 'grammar-gates.json')
const EALD = path.join(REPO_ROOT, 'source-materials', 'EALD-Dictionary.json')
const ALLOWLIST = path.join(REPO_ROOT, 'audits', 'eva-allowlist.json')
const OUT_JSON = path.join(REPO_ROOT, 'audits', 'eva-flags.json')
const OUT_MD = path.join(REPO_ROOT, 'audits', 'eva-flags.md')

// Severity table. See plans/how-would-you-check-eager-lighthouse.md.
const SEVERITY = {
  'count-mismatch': 'blocker',
  'unmarked-answer': 'blocker',
  'multiple-correct': 'blocker',
  'no-correct-marked': 'blocker',
  'missing-answer': 'major',
  'forward-vocab': 'major',
  'forward-grammar': 'major',
  'fill-blank-missing': 'major',
  'option-count': 'major',
  'unknown-tongan-word': 'major',
  'gloss-mismatch': 'minor',
  'missing-rationale': 'minor',
  'no-numbered-items': 'minor',
  'matching-format': 'minor',
  'prose-answer': 'minor',
}

// Normalize for diacritic/apostrophe-insensitive matching. Mirror
// build-vocab-index.mjs::normalizeTongan so byNormalized lookups align.
function normalizeTongan(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʻʼ'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

// ── Field-of-interest selection ───────────────────────────────────────────
//
// Only fields that contain Tongan content should be scanned by Pass A
// (otherwise English text false-positives on Tongan grammar particles like
// "he", "e", "a"). Pass B uses substring markers that are robust against
// English text — we scan all fields for B.

function tonganFieldsForPassA(item) {
  // Text scanned: only italicized substrings (those are Tongan by convention
  // in this project's markdown). The italics-extractor below handles this,
  // so for Pass A we just hand it both prompt and answer; non-italicized
  // English content yields no tokens.
  const out = []
  if (item.prompt) out.push({ field: 'prompt', text: item.prompt })
  if (item.answer) out.push({ field: 'answer', text: item.answer })
  if (item.options) {
    for (const o of item.options) {
      if (o.text) out.push({ field: `option-${o.letter}`, text: o.text })
    }
  }
  return out
}

function allFieldsForPassB(item) {
  const out = tonganFieldsForPassA(item)
  if (item.options) {
    for (const o of item.options) {
      if (o.rationale) out.push({ field: `rationale-${o.letter}`, text: o.rationale })
    }
  }
  return out
}

// Extract substrings inside markdown italics (single-asterisk only — bold
// uses ** which the italics regex correctly skips). Returns the inner text,
// not the asterisks.
function extractItalics(text) {
  const out = []
  // Match *...* but not ** (bold). Tongan rarely has nested asterisks.
  const re = /(?<!\*)\*([^*\n]+?)\*(?!\*)/g
  let m
  while ((m = re.exec(text)) !== null) out.push(m[1])
  return out
}

// "Translate to Tongan: *I drank.*" / "Translate ... into Tongan" prompts
// italicize the ENGLISH source. Scanning that for Tongan tokens produces
// pure noise (drank, you, sleep, …). Detect this case and skip the
// italicized chunks for that field.
function promptItalicsAreEnglishSource(text) {
  return /translate.*to\s+tongan|translate.*into\s+tongan|english\s+→\s+tongan/i.test(text)
}

// Some workbook drills italicize bare English items like "*we (excl., 3+)
// ate*" without a surrounding "Translate to Tongan:" cue. Heuristics:
//   - parenthesized linguistic abbreviation ((excl/incl/sing/pl)) → English
//   - any standalone English subject pronoun (I, you, we, they…) → English
//   - any strong English content marker (will, have, eat, sleep…) → English
const ENGLISH_SUBJECT_PRONOUNS = new Set([
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'me', 'him', 'her', 'us', 'them',
])
const STRONG_ENGLISH_MARKERS = new Set([
  'the', 'and', 'have', 'has', 'had', 'will', 'would', 'should', 'could',
  'their', 'there', 'were', 'been', 'being', 'about', 'all', 'both',
  'because', 'what', 'where', 'when', 'who', 'why', 'how', 'gone', 'going',
  'sleep', 'sleeping', 'slept', 'eat', 'eating', 'ate', 'drink', 'drinking',
  'drank', 'sing', 'singing', 'sang', 'went', 'come', 'coming', 'came',
  'stay', 'stayed', 'run', 'ran', 'running', 'study', 'studied', 'studying',
  'speak', 'spoke', 'speaking', 'work', 'worked', 'working',
  // Expanded for single-italicized-English-word workbook prompts.
  'a', 'an', 'is', 'was', 'are', 'do', 'does', 'did', 'don', 'doesn', 'didn',
  'not', 'no', 'yes', 'down', 'up', 'in', 'on', 'out', 'off', 'with', 'from',
  'to', 'at', 'by', 'for', 'of', 'over', 'under',
  'fine', 'good', 'bad', 'big', 'small', 'old', 'new', 'tired', 'happy', 'sad',
  'hot', 'cold', 'sick', 'well', 'strong', 'weak',
  'teacher', 'student', 'doctor', 'mother', 'father', 'brother', 'sister',
  'man', 'woman', 'boy', 'girl', 'child', 'baby', 'family', 'friend',
  'house', 'book', 'food', 'water', 'fish', 'pig', 'dog', 'cat', 'bird',
  'tree', 'flower', 'road', 'town', 'church', 'school', 'work', 'name',
  'today', 'tomorrow', 'yesterday', 'morning', 'evening', 'night', 'day',
  'just', 'only', 'very', 'also', 'too', 'never', 'always', 'sometimes',
  'whom', 'whose', 'which', 'this', 'that', 'these', 'those',
  'sit', 'stand', 'walk', 'fall', 'fell', 'fallen', 'asleep', 'awake',
  'love', 'loved', 'loving', 'like', 'liked', 'liking', 'see', 'saw', 'seen',
  'know', 'knew', 'known', 'think', 'thought', 'say', 'said', 'tell', 'told',
  'help', 'helped', 'helping', 'use', 'used', 'using', 'make', 'made', 'making',
  'give', 'gave', 'given', 'take', 'took', 'taken', 'put', 'get', 'got',
  'goodbye', 'goodnight', 'hello', 'sorry', 'please', 'pardon', 'thanks',
  'kindness', 'helping', 'coming', 'staying', 'working',
  'old?', 'old.', 'fine.', 'good.', 'yes.', 'no.', 'down!',
  'sun', 'farm', 'weave', 'preposed', 'postposed', 'emphatic',
  'transitive', 'intransitive', 'noun', 'verb', 'adjective', 'adverb',
  'pronoun', 'particle', 'marker', 'tense', 'present', 'past', 'future',
  'definite', 'indefinite', 'singular', 'plural', 'dual',
])
function chunkIsLikelyEnglish(chunk) {
  if (/\((excl|incl|sing\.|pl\.|sg|formal|informal)\b/i.test(chunk)) return true
  const tokens = chunk.replace(/[(),.?!;:"]/g, ' ').split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  for (const t of tokens) {
    const low = t.toLowerCase()
    if (ENGLISH_SUBJECT_PRONOUNS.has(low)) return true
    if (STRONG_ENGLISH_MARKERS.has(low)) return true
  }
  return false
}

function tonganChunksFromField(field, text) {
  if (field === 'prompt' && promptItalicsAreEnglishSource(text)) return []
  return extractItalics(text).filter(c => !chunkIsLikelyEnglish(c))
}

// Tokenize Tongan content. Tongan apostrophe is a letter; keep it.
// Output: array of tokens with original case + diacritics preserved. Callers
// lowercase via normalizeTongan() when they need to match the vocab index.
function tokenizeTongan(text) {
  // Splitting on non-letter/non-apostrophe characters; the unicode class \p{L}
  // catches macron-bearing vowels.
  return text.split(/[^\p{L}ʻ‘’']+/u).filter(Boolean)
}

function isLikelyProperNoun(token) {
  // Mid-sentence capitalization in Tongan corpus virtually always marks a
  // name (Sione, Mele, Tēvita, Pita, ʻElenoa). Tongan proper nouns also
  // commonly start with the glottal stop 'okina followed by a capital
  // ('Amelika, 'Isileli, 'Iohoe). Sentence-initial capital tokens get
  // false-skipped here, but the vocab and EALD indexes will handle them
  // via byNormalized lookup since most function-words appear lowercased
  // somewhere in the master.
  return /^['ʻ]?\p{Lu}/u.test(token)
}

// ── Allowlist ─────────────────────────────────────────────────────────────
//
// Format: { entries: [{ itemId, issueType, marker?, reason }] }
// Marker is optional — when present, only suppress flags whose marker matches.

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST)) return []
  const data = readJson(ALLOWLIST)
  return data.entries || []
}

function isAllowed(allowlist, finding) {
  return allowlist.some(e =>
    e.itemId === finding.itemId &&
    e.issueType === finding.issueType &&
    (e.marker === undefined || e.marker === finding.marker)
  )
}

// ── Pass A: forward-vocab gate ────────────────────────────────────────────

function runPassA(items, vocab) {
  const findings = []
  for (const item of items) {
    for (const { field, text } of tonganFieldsForPassA(item)) {
      // Only scan italicized substrings (Tongan content). Skip italicized
      // English in "Translate to Tongan:" prompts.
      const tonganChunks = tonganChunksFromField(field, text)
      if (tonganChunks.length === 0) continue
      for (const chunk of tonganChunks) {
        const tokens = tokenizeTongan(chunk)
        const seenInChunk = new Set()
        for (const tok of tokens) {
          // Skip 1- and 2-char tokens — they're particles ("a", "i", "he",
          // "ke", "te") that the grammar-gate cross-clamp already keeps
          // honest, and they collide with English in italicized translation
          // prompts ("*I drank.*") much more than they catch real defects.
          if (tok.length <= 2) continue
          if (isLikelyProperNoun(tok)) continue
          // Always go through byNormalized — the vocab master sometimes lists
          // the same word under multiple inflections at different chapters
          // (e.g. "fale" Ch 6 and "falé" Ch 44 "accent example"). The
          // normalized index returns the lowest chapter across all inflected
          // forms, which is what the gate should use.
          const norm = vocab.byNormalized[normalizeTongan(tok)]
          if (!norm) continue
          if (norm.minChapter <= item.chapter) continue
          // De-duplicate identical token findings within a single chunk.
          const dedupe = `${field}:${normalizeTongan(tok)}`
          if (seenInChunk.has(dedupe)) continue
          seenInChunk.add(dedupe)
          findings.push({
            itemId: item.id,
            chapter: item.chapter,
            surface: item.surface,
            exerciseId: item.exerciseId,
            pass: 'A',
            issueType: 'forward-vocab',
            severity: SEVERITY['forward-vocab'],
            marker: tok,
            minChapter: norm.minChapter,
            evidence: { field, text: chunk },
            surfaceLocation: item.surfaceLocation,
          })
        }
      }
    }
  }
  return findings
}

// ── Pass B: forward-grammar gate ──────────────────────────────────────────
//
// For each gate entry, substring-scan every text field. When a gate's
// minChapter > host chapter, emit a finding. Markers are deliberately chosen
// to be specific enough that English text won't false-positive (per
// validate-drill-map.mjs's curation philosophy).

// Word-boundary check: marker must not be flanked by a Tongan/English letter
// or apostrophe-like character. Without this, "ke" matches inside "kena" and
// "Mike" — far too many false positives.
//
// Trailing-space markers like "Naʻe " or "Ko e " survive: the trailing space
// becomes part of the pattern, and the space itself is not a letter, so the
// post-marker boundary is automatic. Markers ending in a letter (most of
// them) are protected by the regex's lookahead.
function compileGateRegex(marker) {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![\\p{L}'ʻ‘’])${escaped}(?![\\p{L}'ʻ‘’])`, 'u')
}

function runPassB(items, gates) {
  const findings = []
  // Pre-compile regexes — substring scan over 15K items × 114 gates is hot.
  const compiled = gates.map(g => ({ ...g, regex: compileGateRegex(g.marker) }))
  for (const item of items) {
    for (const { field, text } of allFieldsForPassB(item)) {
      // Same italics-only restriction as Pass A. Without this, English prose
      // in workbook instructions ("he / she / it") false-positives on
      // grammar particles via word-boundary match.
      const tonganChunks = tonganChunksFromField(field, text)
      if (tonganChunks.length === 0) continue
      const tonganOnly = tonganChunks.join(' ')
      const seenInField = new Set()
      for (const gate of compiled) {
        if (gate.minChapter <= item.chapter) continue
        if (!gate.regex.test(tonganOnly)) continue
        if (seenInField.has(gate.marker)) continue
        seenInField.add(gate.marker)
        findings.push({
          itemId: item.id,
          chapter: item.chapter,
          surface: item.surface,
          exerciseId: item.exerciseId,
          pass: 'B',
          issueType: 'forward-grammar',
          severity: SEVERITY['forward-grammar'],
          marker: gate.marker,
          minChapter: gate.minChapter,
          desc: gate.desc,
          evidence: { field, text: tonganOnly.slice(0, 200) },
          surfaceLocation: item.surfaceLocation,
        })
      }
    }
  }
  return findings
}

// ── Pass D: EALD vocabulary verification ──────────────────────────────────
//
// For every Tongan token in italicized content:
//   1. Look up in vocab-index OR EALD. If absent → flag `unknown-tongan-word`
//      (catches typos and invented forms).
//   2. For "simple vocab drills" (single-Tongan-word ↔ single-English-word
//      translation items, ≤ 30 chars on each side), if the EALD/vocab
//      glosses for the Tongan word share no lemma with the English text,
//      flag `gloss-mismatch`. Skipped on multi-word answers — too noisy.
//
// Both checks skip mid-sentence capitalized tokens (proper nouns) and
// 1-2-char particles (covered by Pass A's screening).

function loadEald() {
  if (!fs.existsSync(EALD)) return null
  return JSON.parse(fs.readFileSync(EALD, 'utf8'))
}

function buildEaldIndex(eald) {
  // Map<normalizedTongan, [{ tongan, english, notes, category }]>
  const byNormalized = new Map()
  if (!eald?.categories) return byNormalized
  for (const [category, entries] of Object.entries(eald.categories)) {
    for (const e of entries) {
      if (!e.tongan) continue
      const norm = normalizeTongan(e.tongan)
      if (!byNormalized.has(norm)) byNormalized.set(norm, [])
      byNormalized.get(norm).push({ ...e, category })
    }
  }
  return byNormalized
}

// Tokenize an English string into lemma-ish words for gloss-overlap checks.
// Strip plural -s, common stopwords; map irregular past-tense forms back to
// their lemma. The corpus is heavy on simple-action vocab drills ("ate",
// "drank", "slept", "went", "sang") whose Tongan glosses give the present
// tense ("eat", "drink", "sleep", "go", "sing"); without this mapping the
// gloss-overlap check spuriously fires.
const ENGLISH_STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
  'them', 'my', 'your', 'his', 'their', 'our', 'this', 'that', 'these',
  'those', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'and', 'or',
  'but', 'as', 'do', 'did', 'does', 'have', 'has', 'had',
])
const IRREGULAR_LEMMA = {
  ate: 'eat', drank: 'drink', slept: 'sleep', went: 'go', came: 'come',
  ran: 'run', sang: 'sing', sat: 'sit', stood: 'stand', spoke: 'speak',
  said: 'say', knew: 'know', made: 'make', took: 'take', gave: 'give',
  saw: 'see', got: 'get', found: 'find', kept: 'keep', felt: 'feel',
  thought: 'think', brought: 'bring', told: 'tell', wrote: 'write',
  read: 'read', held: 'hold', heard: 'hear', left: 'leave', met: 'meet',
  paid: 'pay', sent: 'send', sold: 'sell', spent: 'spend', built: 'build',
  caught: 'catch', taught: 'teach', bought: 'buy', fought: 'fight',
  led: 'lead', meant: 'mean', drove: 'drive', threw: 'throw',
  gone: 'go', eaten: 'eat', drunk: 'drink', slept2: 'sleep', // -en/-d forms
  fell: 'fall', flew: 'fly', shook: 'shake', took2: 'take', hid: 'hide',
  fallen: 'fall', asleep: 'sleep', chosen: 'choose', chose: 'choose',
  done: 'do', overslept: 'oversleep', homestead: 'home', today: 'day',
}

// Tongan tokens whose translations are inherently structural (tense markers,
// bound subject pronouns) rather than content. Their EALD/vocab glosses read
// as "marks a present action/state", "we (not you)", etc., which after
// stopword stripping share no lemma with the typical drill answer like
// "perfect tense marker" or "we (exclusive, 3+)". Skip the gloss-overlap
// check for these — Pass A and the unknown-tongan-word check still apply.
// Keys are NORMALIZED (no apostrophes, no diacritics, lowercase).
const STRUCTURAL_TONGAN = new Set([
  // tense / aspect markers
  'oku', 'kuo', 'naa', 'nae', 'te',
  // bound subject pronouns (3+ chars; shorter ones already filtered by length)
  'mau', 'tau',
])
function englishLemmas(s) {
  if (!s) return new Set()
  const words = s
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const out = new Set()
  for (const w of words) {
    if (ENGLISH_STOPWORDS.has(w)) continue
    out.add(w)
    if (IRREGULAR_LEMMA[w]) out.add(IRREGULAR_LEMMA[w])
    if (w.endsWith('s') && w.length > 3) out.add(w.slice(0, -1))
    if (w.endsWith('ed') && w.length > 4) out.add(w.slice(0, -2))
    if (w.endsWith('ing') && w.length > 5) out.add(w.slice(0, -3))
  }
  return out
}

function runPassD(items, vocab, eald, ealdIndex) {
  const findings = []
  if (!eald) return findings
  for (const item of items) {
    for (const { field, text } of tonganFieldsForPassA(item)) {
      const tonganChunks = tonganChunksFromField(field, text)
      if (tonganChunks.length === 0) continue
      for (const chunk of tonganChunks) {
        const tokens = tokenizeTongan(chunk)
        const seen = new Set()
        for (const tok of tokens) {
          if (tok.length <= 2) continue
          if (isLikelyProperNoun(tok)) continue
          const norm = normalizeTongan(tok)
          if (seen.has(norm)) continue
          seen.add(norm)
          const inVocab = !!vocab.byNormalized[norm]
          const inEald = ealdIndex.has(norm)
          if (inVocab || inEald) continue
          findings.push({
            itemId: item.id,
            chapter: item.chapter,
            surface: item.surface,
            exerciseId: item.exerciseId,
            pass: 'D',
            issueType: 'unknown-tongan-word',
            severity: SEVERITY['unknown-tongan-word'],
            marker: tok,
            evidence: { field, text: chunk.slice(0, 200) },
            surfaceLocation: item.surfaceLocation,
          })
        }
      }
    }
  }

  // Gloss-mismatch — only on simple single-word ↔ single-word vocab drills.
  for (const item of items) {
    const type = item.exerciseMeta?.type
    const isSimpleDrill =
      (type === 'translate_to_english' || type === 'translate_to_tongan') &&
      item.prompt && item.answer &&
      item.prompt.length <= 30 && item.answer.length <= 30
    if (!isSimpleDrill) continue

    // Identify which side is Tongan and which is English.
    const tonganSide = type === 'translate_to_english' ? item.prompt : item.answer
    const englishSide = type === 'translate_to_english' ? item.answer : item.prompt
    const tonganTokens = extractItalics(tonganSide).flatMap(c => tokenizeTongan(c))
    if (tonganTokens.length === 0) continue
    // Compound phrases ("fale kai", "ha ngaahi fale", "Mālō e lelei") are
    // idiomatic units whose English translation typically doesn't lemma-match
    // any single component's gloss. Skip when the Tongan side has more than
    // one meaningful (non-1-char-particle) token — gloss-overlap is meant for
    // single-word vocab drills only. The proper-noun filter below handles the
    // sentence-initial-capital cases (Foki, Kuó, Mou, etc.).
    const meaningfulTokens = tonganTokens.filter(t => t.length > 1)
    if (meaningfulTokens.length > 1) continue

    // Collect glosses from vocab + EALD for the first content token.
    const contentToken = tonganTokens.find(t => t.length > 2 && !isLikelyProperNoun(t))
    if (!contentToken) continue
    const norm = normalizeTongan(contentToken)
    // Tense markers and bound pronouns can't be validated by lemma overlap —
    // their glosses are structural ("marks a present action/state",
    // "we (not you)") which share no lemma with the typical drill answer.
    if (STRUCTURAL_TONGAN.has(norm)) continue
    const glosses = []
    const v = vocab.byNormalized[norm]
    if (v?.allEnglish) {
      // Aggregate all English glosses across all chapters/forms — multi-sense
      // words like ange (Ch 5 "(adds politeness)" + Ch 27 "more (after
      // adjective)") would otherwise only carry the first-introduction sense.
      for (const eng of v.allEnglish) glosses.push(eng)
    } else if (v?.canonicalForm) {
      const entry = vocab.byForm[v.canonicalForm]
      if (entry?.english) glosses.push(entry.english)
    }
    const eEntries = ealdIndex.get(norm) || []
    for (const e of eEntries) glosses.push(e.english, e.notes || '')

    if (glosses.length === 0) continue // unknown — already covered by Pass D check above
    const englishLemmaSet = englishLemmas(englishSide)
    if (englishLemmaSet.size === 0) continue
    const glossLemmaSet = new Set()
    for (const g of glosses) for (const l of englishLemmas(g)) glossLemmaSet.add(l)
    // If gloss reduces to nothing after stopword stripping (e.g. gloss is
    // "for him/her" — all stopwords), there's no signal to compare. Skip
    // rather than emit a false positive.
    if (glossLemmaSet.size === 0) continue
    let overlap = false
    for (const l of englishLemmaSet) {
      if (glossLemmaSet.has(l)) { overlap = true; break }
    }
    if (overlap) continue

    findings.push({
      itemId: item.id,
      chapter: item.chapter,
      surface: item.surface,
      exerciseId: item.exerciseId,
      pass: 'D',
      issueType: 'gloss-mismatch',
      severity: SEVERITY['gloss-mismatch'],
      marker: contentToken,
      evidence: {
        field: 'pair',
        text: `tongan="${tonganSide}" english="${englishSide}" glosses=[${glosses.join(' | ')}]`.slice(0, 240),
      },
      surfaceLocation: item.surfaceLocation,
    })
  }

  return findings
}

// ── Pass C: structural alignment ──────────────────────────────────────────
//
// Two kinds of checks:
//   1. Convert extractor parseFlags into EVA findings.
//   2. Per-exercise structural checks (group by exerciseId): MCQ option
//      count, exactly-one-correct, rationale presence, fill-blank ___ check.

function runPassC(items) {
  const findings = []

  // (1) Promote parseFlags from the extractor.
  // Parser-format sentinels — kept on items in all-exercises.json for
  // forensics, dropped here so they don't pollute eva-flags:
  //   prose-answer     — answer-key block uses prose rather than numbered list
  //   no-numbered-items — exercise body has no `1. … 2. …` items (matching
  //                       tables, mini-dialogues, prose drills)
  //   matching-format   — exercise pairs a-e to 1-N; answer key uses
  //                       letter→number rather than parallel numbered lists
  // These three reflect format variants the extractor handled gracefully,
  // not real defects.
  const PARSER_SENTINELS = new Set(['prose-answer', 'no-numbered-items', 'matching-format'])
  for (const item of items) {
    if (!item.parseFlags || item.parseFlags.length === 0) continue
    for (const f of item.parseFlags) {
      if (PARSER_SENTINELS.has(f)) continue
      const severity = SEVERITY[f] || 'minor'
      findings.push({
        itemId: item.id,
        chapter: item.chapter,
        surface: item.surface,
        exerciseId: item.exerciseId,
        pass: 'C',
        issueType: f,
        severity,
        evidence: { field: 'item', text: (item.prompt || '').slice(0, 200) },
        surfaceLocation: item.surfaceLocation,
      })
    }
  }

  // (2) Per-exercise structural checks. Group items by exerciseId.
  const byExercise = new Map()
  for (const item of items) {
    if (!byExercise.has(item.exerciseId)) byExercise.set(item.exerciseId, [])
    byExercise.get(item.exerciseId).push(item)
  }

  for (const [exId, group] of byExercise) {
    const first = group[0]
    if (first.surface === 'quiz') {
      // Each quiz exerciseId has a single item; structural checks on options.
      const opts = first.options || []
      if (opts.length !== 4) {
        findings.push({
          itemId: first.id,
          chapter: first.chapter,
          surface: 'quiz',
          exerciseId: exId,
          pass: 'C',
          issueType: 'option-count',
          severity: SEVERITY['option-count'],
          evidence: { field: 'options', text: `${opts.length} options found, expected 4` },
          surfaceLocation: first.surfaceLocation,
        })
      }
      const correct = opts.filter(o => o.isCorrect)
      if (correct.length === 0) {
        findings.push({
          itemId: first.id,
          chapter: first.chapter,
          surface: 'quiz',
          exerciseId: exId,
          pass: 'C',
          issueType: 'no-correct-marked',
          severity: SEVERITY['no-correct-marked'],
          evidence: { field: 'options', text: opts.map(o => o.letter).join(',') },
          surfaceLocation: first.surfaceLocation,
        })
      } else if (correct.length > 1) {
        findings.push({
          itemId: first.id,
          chapter: first.chapter,
          surface: 'quiz',
          exerciseId: exId,
          pass: 'C',
          issueType: 'multiple-correct',
          severity: SEVERITY['multiple-correct'],
          evidence: { field: 'options', text: correct.map(o => o.letter).join(',') },
          surfaceLocation: first.surfaceLocation,
        })
      }
      // Rationale presence on each option.
      for (const o of opts) {
        if (!o.rationale) {
          findings.push({
            itemId: first.id,
            chapter: first.chapter,
            surface: 'quiz',
            exerciseId: exId,
            pass: 'C',
            issueType: 'missing-rationale',
            severity: SEVERITY['missing-rationale'],
            marker: o.letter,
            evidence: { field: `option-${o.letter}`, text: o.text },
            surfaceLocation: first.surfaceLocation,
          })
        }
      }
    }

    // Fill-blank prompts must contain ___ (the visible blank). Markdown
    // commonly escapes underscores (\_\_\_) so they don't render as italics;
    // accept either form.
    if (first.exerciseMeta?.type === 'fill_blank') {
      for (const item of group) {
        if (item.prompt && !/_{3,}|(?:\\_){3,}/.test(item.prompt)) {
          findings.push({
            itemId: item.id,
            chapter: item.chapter,
            surface: item.surface,
            exerciseId: exId,
            pass: 'C',
            issueType: 'fill-blank-missing',
            severity: SEVERITY['fill-blank-missing'],
            evidence: { field: 'prompt', text: item.prompt.slice(0, 200) },
            surfaceLocation: item.surfaceLocation,
          })
        }
      }
    }
  }

  return findings
}

// ── Aggregation + emission ────────────────────────────────────────────────

function aggregate(findings) {
  const summary = {
    totalFindings: findings.length,
    byPass: {},
    bySeverity: {},
    bySurface: {},
    byIssueType: {},
    byChapter: {},
  }
  for (const f of findings) {
    summary.byPass[f.pass] = (summary.byPass[f.pass] || 0) + 1
    summary.bySeverity[f.severity] = (summary.bySeverity[f.severity] || 0) + 1
    summary.bySurface[f.surface] = (summary.bySurface[f.surface] || 0) + 1
    summary.byIssueType[f.issueType] = (summary.byIssueType[f.issueType] || 0) + 1
    summary.byChapter[f.chapter] = (summary.byChapter[f.chapter] || 0) + 1
  }
  return summary
}

function sortFindings(findings) {
  const severityOrder = { blocker: 0, major: 1, minor: 2 }
  return findings.sort((a, b) => {
    if (a.chapter !== b.chapter) return a.chapter - b.chapter
    const sa = severityOrder[a.severity] ?? 3
    const sb = severityOrder[b.severity] ?? 3
    if (sa !== sb) return sa - sb
    if (a.surface !== b.surface) return a.surface.localeCompare(b.surface)
    if (a.exerciseId !== b.exerciseId) return a.exerciseId.localeCompare(b.exerciseId)
    return (a.itemId || '').localeCompare(b.itemId || '')
  })
}

function writeMarkdownReport(findings, summary, totalItems, suppressed) {
  const lines = []
  lines.push('# Exercise Validation Audit — Flags')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push(`- Total items scanned: ${totalItems}`)
  lines.push(`- Total findings: ${summary.totalFindings}`)
  lines.push(`- Suppressed by allowlist: ${suppressed}`)
  lines.push('')
  lines.push('### By severity')
  lines.push('')
  for (const sev of ['blocker', 'major', 'minor']) {
    const n = summary.bySeverity[sev] || 0
    lines.push(`- **${sev}:** ${n}`)
  }
  lines.push('')
  lines.push('### By pass')
  lines.push('')
  for (const p of ['A', 'B', 'C']) {
    const n = summary.byPass[p] || 0
    lines.push(`- **Pass ${p}:** ${n}`)
  }
  lines.push('')
  lines.push('### By issue type')
  lines.push('')
  const issueOrder = Object.entries(summary.byIssueType).sort((a, b) => b[1] - a[1])
  for (const [issue, n] of issueOrder) lines.push(`- ${issue}: ${n}`)
  lines.push('')
  lines.push('### By surface')
  lines.push('')
  for (const [surface, n] of Object.entries(summary.bySurface)) {
    lines.push(`- ${surface}: ${n}`)
  }
  lines.push('')
  lines.push('## Findings by chapter')
  lines.push('')

  // Group findings by chapter, then surface.
  const byChapter = new Map()
  for (const f of findings) {
    if (!byChapter.has(f.chapter)) byChapter.set(f.chapter, [])
    byChapter.get(f.chapter).push(f)
  }

  for (const ch of [...byChapter.keys()].sort((a, b) => a - b)) {
    const group = byChapter.get(ch)
    lines.push(`### Chapter ${ch} — ${group.length} finding${group.length === 1 ? '' : 's'}`)
    lines.push('')
    for (const f of group) {
      const ev = f.evidence ? `\`${(f.evidence.text || '').replace(/`/g, '\\`').slice(0, 160)}\`` : ''
      const markerStr = f.marker ? ` \`${f.marker}\`` : ''
      const minStr = f.minChapter ? ` → first taught Ch ${f.minChapter}` : ''
      lines.push(`- **[${f.severity}] ${f.issueType}**${markerStr}${minStr}`)
      lines.push(`  - item: \`${f.itemId}\` (${f.surface})`)
      lines.push(`  - location: \`${f.surfaceLocation || ''}\``)
      if (ev) lines.push(`  - evidence (${f.evidence.field}): ${ev}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────

function main() {
  const exData = readJson(ALL_EXERCISES)
  const vocab = readJson(VOCAB_INDEX)
  const gateData = readJson(GRAMMAR_GATES)
  const gates = gateData.gates
  const items = exData.items
  const allowlist = loadAllowlist()
  const eald = loadEald()
  const ealdIndex = buildEaldIndex(eald)

  console.log(
    `Loaded ${items.length} items, ` +
      `${Object.keys(vocab.byForm).length} vocab forms, ` +
      `${gates.length} grammar gates, ` +
      `${ealdIndex.size} EALD normalized forms`
  )

  let findings = [
    ...runPassA(items, vocab),
    ...runPassB(items, gates),
    ...runPassC(items),
    ...runPassD(items, vocab, eald, ealdIndex),
  ]

  // Apply allowlist.
  const before = findings.length
  findings = findings.filter(f => !isAllowed(allowlist, f))
  const suppressed = before - findings.length

  findings = sortFindings(findings)
  const summary = aggregate(findings)

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true })
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalItemsScanned: items.length,
        suppressedByAllowlist: suppressed,
        summary,
        findings,
      },
      null,
      2
    ) + '\n',
    'utf8'
  )
  fs.writeFileSync(OUT_MD, writeMarkdownReport(findings, summary, items.length, suppressed) + '\n', 'utf8')

  console.log(`Wrote ${path.relative(REPO_ROOT, OUT_JSON)}`)
  console.log(`Wrote ${path.relative(REPO_ROOT, OUT_MD)}`)
  console.log(`Findings: ${summary.totalFindings} (suppressed ${suppressed})`)
  console.log('  By pass:', summary.byPass)
  console.log('  By severity:', summary.bySeverity)
  console.log('  By issue type:', summary.byIssueType)

  // Exit non-zero on any unsuppressed blocker or major finding (per plan).
  const blockers = summary.bySeverity.blocker || 0
  const majors = summary.bySeverity.major || 0
  process.exit(blockers + majors > 0 ? 1 : 0)
}

main()
