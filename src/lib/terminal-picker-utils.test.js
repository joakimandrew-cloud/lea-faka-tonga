import { describe, it, expect } from 'vitest'
import { expandAddMoreGroup } from './terminal-picker-utils'

describe('terminal-picker-utils: expandAddMoreGroup', () => {
  it('splits an "Add more" group into a Finish tab then one tab per extension, in input order', () => {
    const groups = [{
      label: 'Add more',
      items: [
        { type: 'terminator', id: 'FINISH_STATEMENT', display: '.', hint: 'finish' },
        { type: 'extension', id: 'verb', display: '+ Verb', hint: '' },
        { type: 'extension', id: 'time_word', display: '+ Time', hint: 'when' },
      ],
    }]
    const out = expandAddMoreGroup(groups)
    expect(out.map(g => g.label)).toEqual(['Finish', 'Verb', 'Time'])
    expect(out[0].items[0].type).toBe('terminator')
    expect(out[1].items[0]).toMatchObject({ type: 'extension', id: 'verb' })
    expect(out[2].items[0]).toMatchObject({ type: 'extension', id: 'time_word' })
  })

  it('omits the Finish tab when an Add-more group has no terminators (branching mode)', () => {
    const groups = [{
      label: 'Add more',
      items: [
        { type: 'extension', id: 'verb', display: '+ Verb', hint: '' },
        { type: 'extension', id: 'preposed_modifier', display: '+ Preposed Modifier', hint: '' },
      ],
    }]
    const out = expandAddMoreGroup(groups)
    expect(out.map(g => g.label)).toEqual(['Verb', 'Preposed Modifier'])
    expect(out.find(g => g.label === 'Finish')).toBeUndefined()
  })

  it('passes plain word / Finish / Done groups through unchanged', () => {
    const groups = [
      { label: 'Verb', items: [{ type: 'word', display: 'kai', hint: 'eat' }] },
      { label: 'Done', items: [{ type: 'finish_frame', display: 'done with this part', hint: '' }] },
    ]
    expect(expandAddMoreGroup(groups)).toEqual(groups)
  })
})
