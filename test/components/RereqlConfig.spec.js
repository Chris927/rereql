import expect from 'expect'
import React from 'react'
import TestUtils from 'react-addons-test-utils'
import { RereqlConfig } from '../../src/index'

describe('RereqlConfig', () => {
  it('should require children', () => {
    expect(() => TestUtils.renderIntoDocument(
      <RereqlConfig>
      </RereqlConfig>
    )).toThrow(/requires children/)

    expect(() => TestUtils.renderIntoDocument(
      <RereqlConfig>
        <div />
      </RereqlConfig>
    )).toNotThrow()
  })
})
