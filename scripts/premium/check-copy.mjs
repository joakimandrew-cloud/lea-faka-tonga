import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/premium')
const decoder = new TextDecoder('utf-8', { fatal: true })
const files = fs.readdirSync(root, { recursive: true })
  .filter(name => /\.(?:[cm]?jsx?|css|json)$/.test(name))
  .filter(name => !name.startsWith(`test${path.sep}`))
  .sort()
const failures = []
let macrons = 0
let fakaua = 0

assert.ok(files.length > 20, 'Expected a nonempty premium source tree')
for (const file of files) {
  let text
  try { text = decoder.decode(fs.readFileSync(path.join(root, file))) }
  catch { failures.push(`${file}: invalid UTF-8`); continue }
  macrons += (text.match(/[āēīōūĀĒĪŌŪ]/gu) || []).length
  fakaua += (text.match(/\u02bb/gu) || []).length
  for (const [index, line] of text.split('\n').entries()) {
    // Source-wide checks are intentionally stricter than rendered-copy checks.
    // No protected production teaching text is read or rewritten here.
    if (/\uFFFD|Ã|Â|â€/.test(line)) failures.push(`${file}:${index + 1}: possible encoding corruption`)
    if (/\u2014/.test(line)) failures.push(`${file}:${index + 1}: em dash`)
    if (/\b(?:CEFR|A1|A2|B1|B2|C1|C2)\b/.test(line)) failures.push(`${file}:${index + 1}: prohibited level label`)
  }
}
assert.ok(macrons > 0 && fakaua > 0, 'Expected actual Tongan glyphs in prototype source')
assert.deepEqual(failures, [], failures.join('\n'))
console.log(JSON.stringify({ files: files.length, utf8: 'valid', macrons, fakaua, copyFindings: failures.length }, null, 2))
