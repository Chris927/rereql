import React from 'react'
import { connect } from 'react-redux'
import merge from 'lodash/merge'

export const ReclConfig = ({ stateLocation, children }) => {
  console.log('ReqlConfig, stateLocation', stateLocation)
  // TODO: not using stateLocation
  return children
}

class Fetcher extends React.Component {
  constructor(props) {
    super(props)
  }
  componentWillMount() {
    const { data, fetch, query, queryParams } = this.props
    if (!data) fetch(query, queryParams)
  }
  render() {
    const { comp, compProps, query, queryParams, data } = this.props
    console.log('Fetcher, comp', comp)
    console.log('Fetcher, compProps', compProps)
    console.log('Fetcher, query', query)
    console.log('Fetcher, data', data)
    const props = merge({}, compProps, { data })
    return data
      ? React.createElement(comp, props)
      : (<div>Fetching...</div>) // TODO: should be a configurable component to display while fetching
  }
}

