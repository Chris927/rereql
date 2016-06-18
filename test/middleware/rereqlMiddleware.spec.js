import expect from 'expect'
import { rereqlMiddleware } from '../../src/index'

describe('rereqlMiddleware', () => {
  it('should require parameters', () => {
    expect(() => rereqlMiddleware()).toThrow(/requires fetcher/)
    expect(() => rereqlMiddleware(() => undefined)).toNotThrow()
  })
})

