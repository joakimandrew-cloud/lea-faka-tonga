import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ pathname: '/', firstLoad: { current: true } }))
vi.mock('react', () => ({ useEffect: callback => callback(), useRef: () => state.firstLoad }))
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: state.pathname }) }))
import RouteChrome from './RouteChrome'

beforeEach(() => {
  state.pathname = '/'; state.firstLoad.current = true
  vi.stubGlobal('window', { goatcounter: { count: vi.fn() } })
  vi.stubGlobal('document', { title: '', querySelector: () => ({ setAttribute: vi.fn() }) })
})
afterEach(() => vi.unstubAllGlobals())
it('leaves the initial count to the script and counts an SPA navigation with updated metadata', () => {
  RouteChrome()
  expect(window.goatcounter.count).not.toHaveBeenCalled()
  state.pathname = '/dictionary'
  RouteChrome()
  expect(window.goatcounter.count).toHaveBeenCalledExactlyOnceWith({ path: '/dictionary' })
  expect(document.title).toMatch(/Tongan Dictionary/)
})
it('works without an analytics script', () => {
  window.goatcounter = undefined
  state.firstLoad.current = false
  expect(() => RouteChrome()).not.toThrow()
})
