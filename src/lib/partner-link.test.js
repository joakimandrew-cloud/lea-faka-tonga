import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SUPPORT_URL, PARTNER_STORAGE_KEY, rememberPartner, readPartner, supportUrl } from './partner-link'

function stored(values = new Map()) {
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
  vi.stubGlobal('window', { localStorage: storage })
  return values
}
afterEach(() => vi.unstubAllGlobals())
describe('free course support and partner attribution', () => {
  it('remembers a known partner without sending support to an access product', () => {
    const values = stored()
    expect(rememberPartner('Kulisi')).toBe(true)
    expect(readPartner()?.slug).toBe('kulisi')
    expect(JSON.parse(values.get(PARTNER_STORAGE_KEY)).slug).toBe('kulisi')
    expect(supportUrl()).toBe(DEFAULT_SUPPORT_URL)
    expect(supportUrl()).not.toContain('/e/')
  })
  it('also uses general support for a previously stored partner', () => {
    stored(new Map([[PARTNER_STORAGE_KEY, JSON.stringify({ slug: 'kulisi', ts: Date.now() })]]))
    expect(readPartner()?.name).toBe('Neil Crisp')
    expect(supportUrl()).toBe(DEFAULT_SUPPORT_URL)
  })
  it('does not remember an unknown partner and tolerates blocked storage', () => {
    const values = stored()
    expect(rememberPartner('unknown')).toBe(false)
    expect(values.size).toBe(0)
    vi.stubGlobal('window', { get localStorage() { throw new Error('blocked') } })
    expect(rememberPartner('kulisi')).toBe(false)
    expect(supportUrl()).toBe(DEFAULT_SUPPORT_URL)
  })
})
