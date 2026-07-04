import { describe, it, expect } from 'vitest'
import { okinafy, okinafyDeep, looksTongan } from './okinafy'

describe('okinafy', () => {
  it('converts apostrophe before a vowel to the fakauʻa', () => {
    expect(okinafy("Na'á ke kai?")).toBe('Naʻá ke kai?')
    expect(okinafy("'Oku ou kai ika")).toBe('ʻOku ou kai ika')
    expect(okinafy("ha'u")).toBe('haʻu')
    expect(okinafy("'ikai")).toBe('ʻikai')
    expect(okinafy("fa'ē")).toBe('faʻē')
  })

  it('handles curly apostrophes the same way', () => {
    expect(okinafy('Na’á ke kai?')).toBe('Naʻá ke kai?')
    expect(okinafy('‘alu')).toBe('ʻalu')
  })

  it('leaves English contractions and possessives alone', () => {
    expect(okinafy("don't")).toBe("don't")
    expect(okinafy("what's")).toBe("what's")
    expect(okinafy("Sione's")).toBe("Sione's")
    expect(okinafy("you'll")).toBe("you'll")
  })

  it('is idempotent and null-safe', () => {
    expect(okinafy(okinafy("Na'á"))).toBe('Naʻá')
    expect(okinafy('')).toBe('')
    expect(okinafy(null)).toBe(null)
    expect(okinafy(undefined)).toBe(undefined)
  })

  it('deep-converts data objects', () => {
    expect(okinafyDeep({ tongan: "'aho ni", english: 'today', n: 1 })).toEqual({
      tongan: 'ʻaho ni',
      english: 'today',
      n: 1,
    })
    expect(okinafyDeep([{ t: "na'a" }])).toEqual([{ t: 'naʻa' }])
  })
})

describe('looksTongan', () => {
  it('accepts Tongan spans', () => {
    expect(looksTongan('Naʻá ke kai?')).toBe(true)
    expect(looksTongan('kai')).toBe(true)
    expect(looksTongan('māhina')).toBe(true)
  })
  it('rejects spans with non-Tongan letters', () => {
    expect(looksTongan('Word Study')).toBe(false)
    expect(looksTongan('Did you eat?')).toBe(false)
    expect(looksTongan('')).toBe(false)
  })
})
