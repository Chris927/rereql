import React from 'react'
import { connect } from 'react-redux'
import merge from 'lodash/merge'
import invariant from 'invariant'

// TODO: it may be unnecessary to specify a fetcher here, only the middleware may need it
export const RereqlConfig = ({ fetcher, children }) => {
  invariant(typeof fetcher === 'function', 'you must provide a fetcher function in props')
  invariant(children, 'requires children')
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
    const { comp, compProps, query, queryParams, data, lastError } = this.props
    const props = merge({}, compProps, data)
    if (lastError) {
      // TODO: should be a configurable component to display errors
      return (<p>Unable to query API: { lastError.message || 'Error while fetching' }</p>)
    }
    return data
      ? React.createElement(comp, props)
      : (<div>Fetching...</div>) // TODO: should be a configurable component to display while fetching
  }
}

export const fetchQuery = (query, queryParams) => ({ type: 'rereql/FETCH', data: { query, queryParams } })

export function rereqlMiddleware(fetcher) {
  invariant(typeof fetcher === 'function', 'requires fetcher function')
  return store => next => action => {
    if (action.type === 'rereql/FETCH') {
      const { query, queryParams } = action.data
      const promise = fetcher(query, queryParams, store.getState())
      invariant(promise && promise.then, 'fetcher must return promise')
      promise
      .then(json => (next({ type: 'rereql/SUCCESS', data: { query, queryParams, json } })))
      .catch(err => (next({ type: 'rereql/FAILURE', data: { query, queryParams, err } })));
    }
    return next(action)
  }
}

export function rereqlReducer(prevState = {}, action) {
  if (action.type === 'rereql/SUCCESS') {
    const { query, queryParams, json } = action.data
    const state = merge({}, prevState, {
      [`${ query }`]: {
        [`${ JSON.stringify(queryParams) }`]: json
      },
      lastError: null
    })
    return state
  } else if (action.type === 'rereql/FAILURE') {
    const { query, queryParams, err } = action.data
    const state = merge({}, prevState, {
      [`${ query }`]: {
        [`${ JSON.stringify(queryParams) }`]: null
      },
      lastError: {
        message: err.toString(),
        stack: err.stack,
        err
      }
    })
    return state
  }
  return prevState
}

const ConnectedFetcher = connect((state, ownProps) => {
  const result = {
    comp: ownProps.comp,
    compProps: ownProps.compProps,
    query: ownProps.query,
    queryParams: ownProps.queryParams,
    data: ((state.rereql || {})[ownProps.query] || {})[JSON.stringify(ownProps.queryParams)],
    lastError: (state.rereql || {}).lastError
  }
  return result
}, (dispatch) => ({
  fetch: (query, queryParams) => dispatch(fetchQuery(query, queryParams))
}))(Fetcher)

export const rereql = (query, queryParams) => Component => (props) => {
  if (!query || !(typeof query === 'string')) throw new Error('requires query as string');
  return (
    <ConnectedFetcher query={ query } queryParams={ queryParams } comp={ Component } compProps={ props }>
    </ConnectedFetcher>
  )
}
