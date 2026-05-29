// build-transition-weights.mjs
// ============================================================================
// ONE-OFF EVIDENCE SCRIPT — READ-ONLY — NOT PART OF THE BUILD/DEPLOY.
// ----------------------------------------------------------------------------
// Purpose: measure, from the actual book corpus, (1) what coarse part-of-speech
// most often follows a [tense-marker + preposed-pronoun] in real Tongan
// sentences, and (2) word frequencies per coarse grammar slot. This is corpus
// evidence used to verify/seed a HAND-CURATED ordering table for the
// sentence-builder picker. It is NOT imported by the app and must never be
// wired into the live build.
//
// It reads (and never writes/modifies) these inputs:
//   - book/Chapter-01.md .. Chapter-53.md          (Tongan in *italics*)
//   - lea-faka-tonga-app/src/data/book-exercises.json   (Tongan in *italics*)
//   - lea-faka-tonga-app/src/data/book-vocabulary.json  (tongan -> part_of_speech)
//   - lea-faka-tonga-app/src/data/vocabulary-by-slot.json (tense markers + pronouns + slots)
//   - lea-faka-tonga-app/src/data/grammar-graph.json    (authored edge order to cross-check)
//
// It writes ONE artifact, for human inspection only:
//   - lea-faka-tonga-app/scripts/transition-weights.json
//
// HOW TO RUN (from the lea-faka-tonga-app directory):
//   node scripts/build-transition-weights.mjs
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, '..');
const REPO_ROOT = resolve(APP_DIR, '..');
const BOOK_DIR = resolve(REPO_ROOT, 'book');
const DATA_DIR = resolve(APP_DIR, 'src', 'data');

// ---------------------------------------------------------------------------
// Normalization: lowercase; NFD-decompose and strip combining accents; collapse
// the saltillo/okina + apostrophe family to a single ASCII apostrophe `'`.
// Used identically for corpus tokens and for vocabulary lookup keys.
// ---------------------------------------------------------------------------
function normalize(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    // strip combining marks (accents, definitive accent, etc.)
    .replace(/[̀-ͯ]/g, '')
    // unify okina / saltillo / curly + straight quotes / backtick / acute
    .replace(/[ʻʼ‘’`´′]/g, "'")
    .toLowerCase()
    .trim();
}

function readJSON(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

// ---------------------------------------------------------------------------
// 1. Load reference data and build lookup sets.
// ---------------------------------------------------------------------------
const slot = readJSON(resolve(DATA_DIR, 'vocabulary-by-slot.json'));
const vocab = readJSON(resolve(DATA_DIR, 'book-vocabulary.json'));
const graph = readJSON(resolve(DATA_DIR, 'grammar-graph.json'));

// Tense markers: union of vocabulary-by-slot tense lists + graph tense_marker node.
const tenseMarkers = new Set();
for (const key of Object.keys(slot)) {
  if (key.startsWith('tense_marker')) {
    for (const tm of slot[key]) tenseMarkers.add(normalize(tm.tongan));
  }
}
for (const w of graph.nodes?.tense_marker?.words ?? []) {
  tenseMarkers.add(normalize(w.tongan));
}
// Common surface variants of tense markers seen in running prose (the slot data
// lists the citation forms Naʻa / ʻOku / Kuo / Te; corpus also has Naʻe / ʻE).
['na\'a', 'na\'e', '\'oku', 'kuo', 'te', '\'e'].forEach((t) => tenseMarkers.add(t));

// Preposed (subject-clitic) pronouns from vocabulary-by-slot pronouns map +
// graph pronoun node. These are the SHORT forms that sit between TM and verb.
const preposedPronouns = new Set();
for (const p of Object.values(slot.pronouns ?? {})) {
  if (p.short) preposedPronouns.add(normalize(p.short));
  if (p.short_forms) {
    for (const f of Object.values(p.short_forms)) preposedPronouns.add(normalize(f));
  }
}
for (const w of graph.nodes?.pronoun?.words ?? []) {
  preposedPronouns.add(normalize(w.tongan));
}

// Slot-membership sets, for the per-slot word-frequency tally (step 4).
function slotSet(...keys) {
  const s = new Set();
  for (const k of keys) {
    for (const e of slot[k] ?? []) s.add(normalize(e.tongan));
  }
  return s;
}
const slotSets = {
  verb: slotSet(
    'verbs_intransitive',
    'verbs_transitive',
    'verbs_transitive_full',
    'verbs_stative',
  ),
  object: slotSet('objects', 'transitive_objects', 'countable_nouns'),
  modifier: slotSet('modifiers'),
  time_word: slotSet('time_phrases'),
  preposition: slotSet('prepositions'),
  location: slotSet('locations'),
};

// ---------------------------------------------------------------------------
// POS lookup: normalized tongan surface -> coarse bucket.
// book-vocabulary.json gives the fine-grained part_of_speech string.
// ---------------------------------------------------------------------------
const posByWord = new Map();
for (const e of vocab) {
  const key = normalize(e.tongan);
  if (!key) continue;
  // First-write wins, but prefer single-word entries over multi-word phrases
  // when both exist for a key (rare). Keep the existing if already set.
  if (!posByWord.has(key)) posByWord.set(key, e.part_of_speech || '');
}

// Also fold in slot membership as a fallback POS signal (helps short verbs /
// objects that vocabulary may tag differently).
function coarseBucket(token) {
  const pos = (posByWord.get(token) || '').toLowerCase();

  // aux / auxiliaries
  if (token === 'fie' || token === 'lava' || token === "lava 'o") return 'aux';
  // aspect markers (kei, 'osi, te'eki, toe, ...)
  if (
    ['kei', "'osi", "te'eki", "te'eki ke", 'toe'].includes(token) ||
    /aspect marker/.test(pos)
  ) {
    return 'aspect_marker';
  }
  // preposed modifier fa'a-class
  if (token === "fa'a" || /preposed modifier/.test(pos) || /preposed intensifier/.test(pos)) {
    return 'preposed_modifier';
  }
  // numerals / counters
  if (token === 'toko' || /^number$/.test(pos) || /counter|people counter|multiplier|ordinal/.test(pos)) {
    return 'numeral_count';
  }

  // Fine POS string mapping.
  if (pos) {
    if (/adjective|stative/.test(pos)) return 'adjective_stative';
    if (/^verb/.test(pos) || pos === 'noun/verb' || pos === 'verb/adverb' || pos === 'verb phrase') return 'verb';
    if (/^noun|spatial noun|noun phrase|name/.test(pos)) return 'noun';
    if (/adverb|modifier/.test(pos)) return 'modifier';
    if (/preposition/.test(pos)) return 'preposition';
    if (/conjunction/.test(pos)) return 'connector';
    if (/demonstrative/.test(pos)) return 'demonstrative';
  }

  // Slot-membership fallback.
  if (slotSets.verb.has(token)) return 'verb';
  if (slotSets.modifier.has(token)) return 'modifier';
  if (slotSets.object.has(token) || slotSets.location.has(token)) return 'noun';
  if (slotSets.preposition.has(token)) return 'preposition';

  return 'other_unknown';
}

// ---------------------------------------------------------------------------
// 2. Collect Tongan italic spans from the corpus.
// ---------------------------------------------------------------------------
const ITALIC_RE = /(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g;

function extractItalics(text) {
  const out = [];
  let m;
  ITALIC_RE.lastIndex = 0;
  while ((m = ITALIC_RE.exec(text)) !== null) {
    const span = m[1].trim();
    if (span) out.push(span);
  }
  return out;
}

const spans = [];
const chapterFilesUsed = [];
for (let n = 1; n <= 53; n++) {
  const file = resolve(BOOK_DIR, `Chapter-${String(n).padStart(2, '0')}.md`);
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    console.warn(`WARN: could not read ${file}`);
    continue;
  }
  chapterFilesUsed.push(`Chapter-${String(n).padStart(2, '0')}.md`);
  for (const s of extractItalics(text)) spans.push(s);
}

// Add italic spans from book-exercises.json (prompt + answer fields).
let exerciseSpanCount = 0;
try {
  const ex = readJSON(resolve(DATA_DIR, 'book-exercises.json'));
  const chapters = Array.isArray(ex) ? ex : Object.values(ex);
  for (const chArr of chapters) {
    for (const exercise of chArr) {
      for (const item of exercise.items ?? []) {
        for (const field of [item.prompt, item.answer]) {
          if (typeof field !== 'string') continue;
          for (const s of extractItalics(field)) {
            spans.push(s);
            exerciseSpanCount++;
          }
        }
      }
    }
  }
} catch (e) {
  console.warn('WARN: book-exercises.json not used:', e.message);
}

// ---------------------------------------------------------------------------
// 3. Tokenize spans; find [tenseMarker, pronoun, X] windows; classify X.
// 4. Tally per-slot word frequencies (verbs especially).
// ---------------------------------------------------------------------------
function tokenize(span) {
  return span
    .split(/\s+/)
    .map((t) => normalize(t))
    // drop empties and bare punctuation tokens
    .filter((t) => t && /[a-z']/.test(t.replace(/[.,!?;:()"]/g, '')))
    .map((t) => t.replace(/^[.,!?;:()"]+|[.,!?;:()"]+$/g, ''));
}

const afterTensePronoun = {};
const wordFreqBySlot = {
  verb: {},
  object: {},
  modifier: {},
  time_word: {},
  preposition: {},
};
// Raw content-word frequency over the X-after-TM+pronoun position (the actual
// "next word" the picker would lead with) and over all tokens.
const nextWordFreq = {};
const allContentFreq = {};

let tripleCount = 0;
let usableSpanCount = 0;

for (const span of spans) {
  const toks = tokenize(span);
  if (toks.length) usableSpanCount++;

  for (let i = 0; i + 2 < toks.length; i++) {
    const a = toks[i];
    const b = toks[i + 1];
    const x = toks[i + 2];
    if (tenseMarkers.has(a) && preposedPronouns.has(b)) {
      tripleCount++;
      const bucket = coarseBucket(x);
      afterTensePronoun[bucket] = (afterTensePronoun[bucket] || 0) + 1;
      nextWordFreq[x] = (nextWordFreq[x] || 0) + 1;
    }
  }

  // Per-slot frequency tally over ALL tokens in the span.
  for (const t of toks) {
    if (slotSets.verb.has(t)) wordFreqBySlot.verb[t] = (wordFreqBySlot.verb[t] || 0) + 1;
    if (slotSets.object.has(t)) wordFreqBySlot.object[t] = (wordFreqBySlot.object[t] || 0) + 1;
    if (slotSets.modifier.has(t)) wordFreqBySlot.modifier[t] = (wordFreqBySlot.modifier[t] || 0) + 1;
    if (slotSets.time_word.has(t)) wordFreqBySlot.time_word[t] = (wordFreqBySlot.time_word[t] || 0) + 1;
    if (slotSets.preposition.has(t)) wordFreqBySlot.preposition[t] = (wordFreqBySlot.preposition[t] || 0) + 1;
    const bucket = coarseBucket(t);
    if (bucket === 'verb' || bucket === 'noun' || bucket === 'adjective_stative') {
      allContentFreq[t] = (allContentFreq[t] || 0) + 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Sorting helpers.
// ---------------------------------------------------------------------------
function sortedEntries(obj) {
  return Object.entries(obj).sort((p, q) => q[1] - p[1]);
}
function sortedObject(obj) {
  return Object.fromEntries(sortedEntries(obj));
}

// ---------------------------------------------------------------------------
// 5. Cross-check measured verb-frequency ranking vs grammar-graph verb node
//    words[] declaration order. Also flag any OTHER branching node whose
//    next-edge order looks backwards vs likely corpus frequency.
// ---------------------------------------------------------------------------

// 5a. verb node words[] order vs measured frequency.
const verbNodeOrder = (graph.nodes?.verb?.words ?? []).map((w) => normalize(w.tongan));
const measuredVerbRank = sortedEntries(wordFreqBySlot.verb).map(([w]) => w);
const verbRankIndex = new Map(measuredVerbRank.map((w, i) => [w, i]));

// 5b. afterTensePronoun-implied priority for the verb node's first-edge family,
//     and a heuristic "expected" order for each branching node's terminal/continuation edges.
//
// Build a frequency proxy for graph "next" targets: which continuation type is
// most common right after a TM+pronoun (verb, object, etc.) and overall.
const categoryPriority = sortedEntries(afterTensePronoun).map(([k]) => k);

// Heuristic expected-leading-edge map: based on the measured afterTensePronoun
// ranking and on general corpus reality (most spans terminate; FINISH should lead
// any node that allows it). We FLAG a node if its first edge is a rare/late
// continuation while a high-frequency continuation (or FINISH) is buried later.
//
// We compute, for each branching node, the authored order of its edges and a
// "priority score" per edge target using the afterTensePronoun ranking as a
// proxy for continuation likelihood plus a strong bonus for FINISH_* edges
// (terminations dominate real corpora) and for high-frequency adjuncts.
const targetPriorityProxy = (target) => {
  // higher = should appear earlier
  if (target === 'FINISH_STATEMENT') return 1000;
  if (target === 'FINISH_QUESTION') return 990;
  if (target === 'FINISH_EXCLAMATION') return 980;
  // Map graph continuation node names to coarse buckets and use measured rank.
  const bucketForTarget = {
    verb: 'verb',
    object: 'noun',
    article: 'noun',
    modifier: 'modifier',
    time_word: 'time_word',
    preposition: 'preposition',
    directional: 'modifier',
    aspect_marker: 'aspect_marker',
    aspect_marker_post: 'aspect_marker',
    preposed_modifier: 'preposed_modifier',
    personal_count: 'numeral_count',
    numeral: 'numeral_count',
    fie_aux: 'aux',
    lava_o_aux: 'aux',
  };
  const bucket = bucketForTarget[target];
  if (bucket) {
    const idx = categoryPriority.indexOf(bucket);
    if (idx >= 0) return 500 - idx * 10;
  }
  // Subordinators / connectors / benefactives are comparatively rare -> low.
  if (/^(subordinator_|clause_connector_|benefactive_|possessive_|preposition_possessive)/.test(target)) {
    return 50;
  }
  return 100; // default mid for question_word / mo_fixed / postposed_pronoun etc.
};

const FINISH_EDGES = new Set(['FINISH_STATEMENT', 'FINISH_QUESTION', 'FINISH_EXCLAMATION']);
// Rare/low-frequency continuations that should never lead a picker: subordinate
// clauses, clause connectors, benefactives, possessive sub-walks.
const RARE_EDGE_RE = /^(subordinator_|clause_connector_|benefactive_|possessive_|preposition_possessive$|whose_question_form$)/;

const branchingNodes = [];
const reasons = [];
for (const [name, node] of Object.entries(graph.nodes ?? {})) {
  if (!Array.isArray(node.next) || node.next.length < 3) continue;
  const authored = node.next.map((e) => e.node);
  const scored = authored.map((t, i) => ({ target: t, authoredIndex: i, proxy: targetPriorityProxy(t) }));
  const idealOrder = [...scored].sort((p, q) => q.proxy - p.proxy).map((s) => s.target);

  const allowsFinish = authored.some((t) => FINISH_EDGES.has(t));
  const firstFinishIdx = authored.findIndex((t) => FINISH_EDGES.has(t));
  const first = authored[0];

  // -- Primary check: a node that allows FINISH should lead with FINISH.
  // Termination is by far the most common "next move" in any real corpus, so
  // burying FINISH behind continuations costs every short-sentence builder a tab.
  const finishBuried = allowsFinish && firstFinishIdx > 0;

  // -- Secondary check: the leading edge is a rare subordinator/connector while
  // a high-value continuation (verb / object / article) sits later.
  const leadsWithRare = RARE_EDGE_RE.test(first);
  const highValueLater = authored
    .slice(1)
    .some((t) => ['verb', 'object', 'article'].includes(t));
  const rareFirst = leadsWithRare && highValueLater;

  const flagged = finishBuried || rareFirst;
  const why = [];
  if (finishBuried) why.push(`FINISH buried at index ${firstFinishIdx} (leads with "${first}")`);
  if (rareFirst) why.push(`leads with rare edge "${first}" ahead of a verb/object edge`);

  branchingNodes.push({
    name,
    edgeCount: authored.length,
    authoredFirst: first,
    idealFirst: idealOrder[0],
    authored,
    idealOrder,
    allowsFinish,
    firstFinishIdx,
    flagged,
    reasons: why,
  });
  if (flagged) reasons.push({ name, why, authored });
}
const flagged = branchingNodes
  .filter((b) => b.flagged)
  .sort((a, b) => b.firstFinishIdx - a.firstFinishIdx);

// 5c. Verdict on the verb node's words[] order: is it already frequency-sorted?
// Compare the authored sequence (restricted to verbs we actually measured) to the
// measured-frequency sequence; count adjacent inversions.
const verbNodeMeasured = verbNodeOrder
  .map((w) => ({ w, c: wordFreqBySlot.verb[w] || 0 }))
  .filter((x) => x.c > 0);
let verbOrderInversions = 0;
for (let i = 0; i < verbNodeMeasured.length - 1; i++) {
  if (verbNodeMeasured[i].c < verbNodeMeasured[i + 1].c) verbOrderInversions++;
}
const verbOrderVerdict =
  verbOrderInversions === 0
    ? 'already frequency-sorted'
    : `NOT frequency-sorted (${verbOrderInversions} adjacent inversions of ${verbNodeMeasured.length - 1})`;

// ---------------------------------------------------------------------------
// Write the artifact.
// ---------------------------------------------------------------------------
const artifact = {
  generatedFrom:
    'book/Chapter-01..53.md italic spans + src/data/book-exercises.json italic spans; ' +
    'POS via src/data/book-vocabulary.json; tense/pronoun/slot sets via src/data/vocabulary-by-slot.json + grammar-graph.json',
  note: 'evidence only; not imported by the app; regenerate with `node scripts/build-transition-weights.mjs` from lea-faka-tonga-app/',
  sampleSize: {
    italicSpans: spans.length,
    usableSpans: usableSpanCount,
    exerciseSpans: exerciseSpanCount,
    chaptersRead: chapterFilesUsed.length,
    tensePronounTriples: tripleCount,
    tenseMarkerSet: [...tenseMarkers].sort(),
    preposedPronounSet: [...preposedPronouns].sort(),
  },
  afterTensePronoun: sortedObject(afterTensePronoun),
  afterTensePronounPriority: categoryPriority,
  nextWordAfterTensePronoun: sortedObject(nextWordFreq),
  wordFreqBySlot: {
    verb: sortedObject(wordFreqBySlot.verb),
    object: sortedObject(wordFreqBySlot.object),
    modifier: sortedObject(wordFreqBySlot.modifier),
    time_word: sortedObject(wordFreqBySlot.time_word),
    preposition: sortedObject(wordFreqBySlot.preposition),
  },
  topContentWords: sortedEntries(allContentFreq).slice(0, 40),
  verbNodeCrossCheck: {
    verdict: verbOrderVerdict,
    adjacentInversions: verbOrderInversions,
    graphVerbNodeOrder: verbNodeOrder,
    measuredVerbFreqOrder: measuredVerbRank,
    // for each verb in the graph node, its measured rank (or null if unseen)
    perVerb: verbNodeOrder.map((w) => ({
      tongan: w,
      authoredIndex: verbNodeOrder.indexOf(w),
      measuredRank: verbRankIndex.has(w) ? verbRankIndex.get(w) : null,
      measuredCount: wordFreqBySlot.verb[w] || 0,
    })),
  },
  branchingNodeAudit: branchingNodes.map((b) => ({
    name: b.name,
    edgeCount: b.edgeCount,
    authoredFirst: b.authoredFirst,
    idealFirst: b.idealFirst,
    allowsFinish: b.allowsFinish,
    firstFinishIdx: b.firstFinishIdx,
    authored: b.authored,
    flagged: b.flagged,
    reasons: b.reasons,
  })),
};

const outPath = resolve(__dirname, 'transition-weights.json');
import('node:fs').then(({ writeFileSync }) => {
  writeFileSync(outPath, JSON.stringify(artifact, null, 2) + '\n', 'utf8');
});

// ---------------------------------------------------------------------------
// Human-readable summary to stdout.
// ---------------------------------------------------------------------------
const line = '─'.repeat(72);
console.log(line);
console.log('TRANSITION WEIGHTS — corpus evidence (read-only, not part of build)');
console.log(line);
console.log(`Chapters read:            ${chapterFilesUsed.length} (Chapter-01..53)`);
console.log(`Italic Tongan spans:      ${spans.length}  (${exerciseSpanCount} from exercises)`);
console.log(`TM+pronoun+X triples:     ${tripleCount}`);
console.log(`Tense markers matched:    ${[...tenseMarkers].sort().join(', ')}`);
console.log(`Preposed pronouns:        ${[...preposedPronouns].sort().join(', ')}`);
console.log('');
console.log('AFTER [tense marker + preposed pronoun], next coarse POS:');
for (const [k, v] of sortedEntries(afterTensePronoun)) {
  const pct = ((v / tripleCount) * 100).toFixed(1);
  console.log(`  ${String(v).padStart(4)}  ${pct.padStart(5)}%  ${k}`);
}
console.log('');
console.log(`Implied category priority (most->least): ${categoryPriority.join(' > ')}`);
console.log('');
console.log('TOP 20 VERBS by corpus frequency:');
sortedEntries(wordFreqBySlot.verb).slice(0, 20).forEach(([w, c], i) => {
  console.log(`  ${String(i + 1).padStart(2)}. ${w.padEnd(12)} ${c}`);
});
console.log('');
console.log('grammar-graph verb node words[] order:');
console.log('  ' + verbNodeOrder.join(', '));
console.log('measured verb-frequency order (top 15):');
console.log('  ' + measuredVerbRank.slice(0, 15).join(', '));
console.log(`verb node order verdict:  ${verbOrderVerdict}`);
console.log('');
console.log('BRANCHING NODES flagged as likely backwards vs corpus frequency:');
console.log('  (rule A: a node that allows FINISH should lead with FINISH — termination dominates the corpus)');
console.log('  (rule B: a node should not lead with a rare subordinator/connector ahead of a verb/object edge)');
if (flagged.length === 0) {
  console.log('  (none)');
} else {
  for (const f of flagged) {
    console.log(`  • ${f.name} (${f.edgeCount} edges) — ${f.reasons.join('; ')}`);
    console.log(`      authored order: ${f.authored.slice(0, 6).join(', ')}${f.authored.length > 6 ? ', …' : ''}`);
  }
}
console.log('');
console.log(`Artifact written: ${outPath}`);
console.log(line);
