import React from 'react'
import { connect } from 'react-redux'
import merge from 'lodash/merge'
import invariant from 'invariant'

// TODO: it may be unnecessary to specify a fetcher here, only the middleware may need it
export const RereqlConfig = ({ children }) => {
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

const fetch = (fetcher, query, params, state) => {
  const promise = fetcher(query, params, state)
  invariant(promise && promise.then, 'fetcher must return promise')
  return promise
}

export function rereqlMiddleware(fetcher) {
  invariant(typeof fetcher === 'function', 'requires fetcher function')
  return store => next => action => {
    if (action.type === 'rereql/FETCH') {
      const { query, queryParams } = action.data
      fetch(fetcher, query, queryParams, store.getState())
      .then(json => (next({ type: 'rereql/SUCCESS', data: { query, queryParams, json } })))
      .catch(err => (next({ type: 'rereql/FAILURE', data: { query, queryParams, err } })));
      return next(action)
    } else if (action[MUTATE]) {
      const state = store.getState()
      const { mapStateToQuery, mapStateToParams, types, resolve, reject } = action[MUTATE]
      const [ requestType, successType, failureType ] = types
      let [ query, params ] = [ mapStateToQuery(state), mapStateToParams(state) ]
      fetch(fetcher, query, params, store.getState())
      .then(json => {
        resolve()
        return next({ type: successType, data: { query, params, json } })
      })
      .catch(err => {
        reject()
        return next({ type: failureType, data: { query, params, err } })
      });
      return next({ type: requestType, data: { query, params } })
    } else {
      return next(action)
    }
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

export const mutates = ({ actionTypes }) => {

  const [ requestType, successType, failureType ] = actionTypes

  return (state = {}, action) => {
    switch (action.type) {
      case requestType:
        return merge({}, state, {
          isMutating: true,
          lastError: null
        })
      case successType: 
        return merge({}, state, {
          isMutating: false,
          lastError: null,
          result: action.data.json
        })
      case failureType:
        return merge({}, state, {
          isMutating: false,
          lastError: action.data.err
        })
    }
    return state
  }
}

const MUTATE = Symbol('GraphQL Mutation')

export const dispatchMutateAction = (dispatch, { actionTypes, mapStateToQuery, mapStateToParams }) => {
  return new Promise((resolve, reject) => {
    dispatch({
      [MUTATE]: {
        types: actionTypes,
        mapStateToQuery,
        mapStateToParams,
        resolve,
        reject
      }
    })
  })
}

export const mutate = ({ actionTypes, mapStateToQuery, mapStateToParams }) => component => {
  const connected = connect(() => ({}), (dispatch) => ({
    onAction: () => dispatchMutateAction(dispatch, {
      actionTypes, mapStateToQuery, mapStateToParams
    })
  }))(component)
  return connected
}
