import expect from 'expect'
import { rereqlMiddleware, fetchQuery } from '../../src/index'

describe('rereqlMiddleware', () => {
  it('should require parameters', () => {
    expect(() => rereqlMiddleware()).toThrow(/requires fetcher/)
    expect(() => rereqlMiddleware(() => undefined)).toNotThrow()
  })
  it('requires fetcher to return a promise', () => {
    const badFetcher = () => ({})
    const middleware = rereqlMiddleware(badFetcher)
    const store = { getState: () => ({}) }
    const action = fetchQuery('')
    const next = () => action
    expect(() => middleware(store)(next)(action)).toThrow(/must return promise/)
  })
})

