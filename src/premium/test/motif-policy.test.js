import test from 'node:test'
import assert from 'node:assert/strict'
import { APPROVED_MOTIF_KEYS, approvedMotif } from '../lib/motif-policy.js'
import { lessonTile } from '../lib/lesson-colour.js'
import { checkMotifs, inspectMotifSource, verifyApprovedGeometry } from '../../../scripts/premium/check-motifs.mjs'

test('the entire active site uses the approved artwork with unchanged geometry', () => {
  assert.equal(checkMotifs().approvedShapes, 8)
})

test('every lesson motif and both polarities resolve to approved geometry', () => {
  for (let lesson = 1; lesson <= 52; lesson++) {
    for (let offset = 0; offset < 9; offset++) {
      const tile = lessonTile(lesson, offset)
      assert.ok(APPROVED_MOTIF_KEYS.includes(tile.kind))
      assert.ok(approvedMotif(tile.kind, tile.invert).d.length > 0)
    }
  }
})

test('retired names, aliases and unknown motifs cannot render through the shared library', () => {
  for (const name of ['petal', 'nested', 'saw', 'eye', 'xbox', 'diamond', 'steps', 'unapproved']) {
    assert.throws(() => approvedMotif(name), /Unapproved website motif/)
    assert.throws(() => approvedMotif(name, true), /Unapproved website motif/)
  }
})

test('the build guard rejects reintroduced feedback motifs, legacy imports and copied assets', () => {
  assert.ok(inspectMotifSource('Quiz.jsx', `<KupesiTile kind={correct ? 'petal' : 'xbox'} />`).length)
  assert.ok(inspectMotifSource('Other.jsx', `import old from './kupesi-tiles-opt2.js'`).length)
  assert.ok(inspectMotifSource('src/components/cover-tiles.js', 'export const data = {}').length)
  assert.deepEqual(inspectMotifSource('Quiz.jsx', `<KupesiTile kind={correct ? 'leaf' : 'nest'} framed />`), [])
})

test('adding or changing an approved path fails the geometry guard', () => {
  assert.ok(verifyApprovedGeometry({ leaf: { d: 'changed' } }, { leaf: 'original-hash' }).length)
  assert.ok(verifyApprovedGeometry({ leaf: { d: 'changed' }, extra: {} }, { leaf: 'original-hash' }).includes('Approved motif keys changed'))
})
