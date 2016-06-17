import expect from 'expect'
import React from 'react'
import TestUtils from 'react-addons-test-utils'
import { RereqlConfig } from '../../src/index'

describe('RereqlConfig', () => {
  it('should require a fetcher function', () => {
    expect(() => TestUtils.renderIntoDocument(
      <RereqlConfig>
      </RereqlConfig>
    )).toThrow(/provide fetcher/)
  })
})
