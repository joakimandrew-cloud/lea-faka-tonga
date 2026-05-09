#!/usr/bin/env node
// Build audits/vocab-index.json from audits/Flip-Card-Vocabulary-Master.md.
//
// The master contains a single big table with columns:
//   | Ch | Class | Tongan | Type/Function | English |
//
// We index each Tongan form by its first-introduction chapter (min over all
// occurrences). The validator's forward-vocab gate looks up tokens in this
// index; any token whose minChapter exceeds the host chapter is flagged.
//
// Tongan apostrophes (ʻokina), diacritics (macrons), and the bare straight
// quote all collapse to the same logical form for lookup. We store both:
//
//   byForm["na'a"]        — keyed by the canonical form (as written in the master)
//   byNormalized["naa"]   — keyed by the diacritic/apostrophe-stripped form
//
// Both indexes carry { minChapter, class, type, english, allChapters[] }.
//
// Run:  node lea-faka-tonga-app/scripts/build-vocab-index.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')
const SOURCE = path.join(REPO_ROOT, 'audits', 'Flip-Card-Vocabulary-Master.md')
const OUT = path.join(REPO_ROOT, 'audits', 'vocab-index.json')

// Normalize a Tongan word for fuzzy lookup:
//   - lowercase
//   - all apostrophe-like characters → empty (drop)
//   - macron vowels → bare ASCII vowels
//   - any other diacritic → stripped
//   - collapse internal whitespace
//
// Validators use this to compare exercise tokens against the master without
// having to track every apostrophe variant or accent placement.
export function normalizeTongan(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʻʼ'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Strip italic/markdown markers from a cell value (the master uses some bold
// for occasional emphasis, though most of the Tongan column is plain text).
function cleanCell(s) {
  return s.replace(/\*+/g, '').trim()
}

function parseMaster(md) {
  const lines = md.split(/\n/)
  // Find the header row: "| Ch | Class | Tongan | Type/Function | English |".
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^\|\s*Ch\s*\|\s*Class\s*\|\s*Tongan\s*\|/i.test(lines[i])) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) throw new Error(`No vocab table found in ${path.relative(REPO_ROOT, SOURCE)}`)

  const rows = []
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith('|')) break
    if (/^\|\s*-+\s*\|/.test(line)) continue // separator row
    const parts = line.split('|').slice(1, -1).map(cleanCell)
    if (parts.length < 5) continue
    const [chRaw, klass, tongan, type, english] = parts
    const ch = parseInt(chRaw, 10)
    if (!Number.isFinite(ch)) continue
    rows.push({ chapter: ch, class: klass, tongan, type, english })
  }
  return rows
}

function buildIndex(rows) {
  const byForm = {}
  const byNormalized = {}
  for (const r of rows) {
    const form = r.tongan
    if (!form) continue
    const norm = normalizeTongan(form)

    if (!byForm[form]) {
      byForm[form] = {
        minChapter: r.chapter,
        class: r.class,
        type: r.type,
        english: r.english,
        allChapters: [r.chapter],
        allEnglish: r.english ? [r.english] : [],
      }
    } else {
      const cur = byForm[form]
      if (r.chapter < cur.minChapter) {
        cur.minChapter = r.chapter
        cur.class = r.class
        cur.type = r.type
        cur.english = r.english
      }
      if (!cur.allChapters.includes(r.chapter)) cur.allChapters.push(r.chapter)
      if (r.english && !cur.allEnglish.includes(r.english)) cur.allEnglish.push(r.english)
    }

    // Normalized index — same min-chapter logic, but keyed by normalized form.
    if (!byNormalized[norm]) {
      byNormalized[norm] = {
        canonicalForm: form,
        minChapter: r.chapter,
        class: r.class,
        allForms: [form],
        allChapters: [r.chapter],
        allEnglish: r.english ? [r.english] : [],
      }
    } else {
      const cur = byNormalized[norm]
      if (r.chapter < cur.minChapter) {
        cur.minChapter = r.chapter
        cur.canonicalForm = form
        cur.class = r.class
      }
      if (!cur.allForms.includes(form)) cur.allForms.push(form)
      if (!cur.allChapters.includes(r.chapter)) cur.allChapters.push(r.chapter)
      if (r.english && !cur.allEnglish.includes(r.english)) cur.allEnglish.push(r.english)
    }
  }
  return { byForm, byNormalized }
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`source not found: ${SOURCE}`)
    process.exit(1)
  }
  const md = fs.readFileSync(SOURCE, 'utf8')
  const rows = parseMaster(md)
  const { byForm, byNormalized } = buildIndex(rows)

  const out = {
    summary: {
      generatedAt: new Date().toISOString(),
      sourcePath: path.relative(REPO_ROOT, SOURCE),
      totalRows: rows.length,
      uniqueForms: Object.keys(byForm).length,
      uniqueNormalized: Object.keys(byNormalized).length,
    },
    byForm,
    byNormalized,
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8')

  console.log(`Wrote ${path.relative(REPO_ROOT, OUT)}`)
  console.log('Summary:', out.summary)
}

main()
