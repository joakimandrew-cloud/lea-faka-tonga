import test from 'node:test'
import assert from 'node:assert/strict'

test('entry motifs repeat stable approved artwork, keep decorative semantics and support compact sizes', async () => {
  const { createServer } = await import('vite')
  const { default: React } = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
  try {
    const { default: EntryMotif } = await server.ssrLoadModule('/src/premium/components/EntryMotif.jsx')
    const render = props => renderToStaticMarkup(React.createElement(EntryMotif, props))
    const sequence = Array.from({ length: 8 }, (_, index) => render({ index }))
    assert.deepEqual(sequence.map(html => html.match(/kp-(pinwheel|nest|leaf|lens) /)[1]),
      ['pinwheel', 'nest', 'leaf', 'lens', 'pinwheel', 'nest', 'leaf', 'lens'])
    assert.equal(render({}), sequence[0])
    assert.equal(render({ index: -1 }), sequence[3])
    for (const html of sequence) {
      assert.match(html, /^<span class="entry-motif" aria-hidden="true"><svg/)
      assert.match(html, /width:24px;height:24px/)
      assert.doesNotMatch(html, /tabindex|<title|<a\b|<button\b|→/)
    }
    assert.match(render({ kind: 'leaf', size: 18 }), /width:18px;height:18px/)
    assert.throws(() => render({ kind: 'unapproved' }), /Unapproved website motif/)
  } finally {
    await server.close()
  }
})
