import expect from 'expect'
import React from 'react'
import TestUtils from 'react-addons-test-utils'
import { RereqlConfig } from '../../src/index'

describe('RereqlConfig', () => {
  it('should require a fetcher function', () => {
    expect(() => TestUtils.renderIntoDocument(
      <RereqlConfig>
      </RereqlConfig>
    )).toThrow(/provide a fetcher function/)

    const fetcher = () => undefined

    expect(() => TestUtils.renderIntoDocument(
      <RereqlConfig fetcher={ fetcher }>
      </RereqlConfig>
    )).toThrow(/requires children/)

    expect(() => TestUtils.renderIntoDocument(
      <RereqlConfig fetcher={ fetcher }>
        <div />
      </RereqlConfig>
    )).toNotThrow()
  })
})
