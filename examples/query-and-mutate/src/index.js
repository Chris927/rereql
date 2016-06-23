import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import fetch from 'isomorphic-fetch'
import { rereql, rereqlMiddleware, rereqlReducer, mutate, mutates } from '../../../lib'

const apiEndpoint = 'http://localhost:3000/graphql'

// we need to give the rereql middleware a fetcher, so that rereql knows how to
// execute a query. rereql will call the fetcher with the following parameters:
//
// 1) the GraphQL query
// 2) parameter values (which will be interpolated by the GraphQL service)
// 3) the current (redux) state
//
// The fetcher is expected to return a promise that will eventually resolve to
// the GraphQL response.
const fetcher = (query, params, state) => {
  return fetch(apiEndpoint, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: params })
  }).then(response => {
    if (response.status >= 300) {
      return response.json().then(json => {
        const err = merge(new Error(response.statusText || 'bad response'), {
          graphqlErrors: json
        })
        throw err
      })
    }
    return response.json()
  })
}

// for mutations, we define our own action types
const addOrderActions = [
  'ADD_ORDER', 'ADD_ORDER_SUCCESS', 'ADD_ORDER_FAILURE'
]
const [ ADD_ORDER, ADD_ORDER_SUCCESS, ADD_ORDER_FAILURE ] = addOrderActions

// we create the reducer, where 'rereql' *must* be set to the rereqlReducer.
// For mutations, `mutates` maps the current state of a mutation (isMutating,
// lastError, result) into the state. See below for how to initiate a mutation.
const reducer = combineReducers({
  rereql: rereqlReducer,
  addOrder: mutates({
    actionTypes: [ ADD_ORDER, ADD_ORDER_SUCCESS, ADD_ORDER_FAILURE ]
  })
})

// middleware to alert us on new order (don't do this in production...)
const alertOnOrderAdded = store => next => action => {
  if(action.type === ADD_ORDER_SUCCESS) alert('Order added. You must refresh (for now) to see it.')
  return next(action)
}

// when creating the store, we must apply rereqlMiddleware
const store = createStore(
  reducer,
  compose(
    applyMiddleware(rereqlMiddleware(fetcher), alertOnOrderAdded /*, moreMiddlewareIfNeeded */),

    // activates Chrome dev tools, see https://github.com/zalmoxisus/redux-devtools-extension
    window.devToolsExtension ? window.devToolsExtension() : f => f

  )
)

const ordersQuery = `
query($shopId:String) {
  orders(shopId:$shopId) {
    id,
    orderedBy,
    items {
      id,
      quantity,
      inventoryId
    }
  }
}
`

const addOrderQuery = `
mutation($shopId:String) {
  addOrder(shopId:$shopId, tipInCents:20, items: [
    { inventoryId:"burger", quantity:2 }
  ]) {
    createdOrder {
      id
    }
  }
}
`

// component to query and display orders. `rereql` is a higher order function
// (similar to `connect` of react-redux) which received query and parameters,
// and can then be applied to a component (anonymous, in this example).
const OrdersList = rereql(ordersQuery, { shopId: '123' })(({ data }) => {
  if (data) {
    return (
      <ul>
        { data.orders.map(o => (
          <li key={ o.id }>Order { o.id } ordered by { o.orderedBy }</li>
        ))}
      </ul>
    )
  } else {
    return (<p>No orders</p>)
  }
})

// component to mutate (add an order)
const AddOrderButton = mutate({
  actionTypes: addOrderActions,
  mapStateToQuery: (state) => addOrderQuery,
  mapStateToParams: (state) => ({ shopId: '123' })
})(({ onAction }) => (
  <button onClick={ onAction }>Add order</button>
))

// a plain component to combine OrdersList and AddOrderButton
const Orders = () => (
  <div>
    <OrdersList />
    <AddOrderButton />
  </div>
)

// the app needs a react-redux Provider, but nothing special otherwise
const App = () => (
  <Provider store={ store }>
    <Orders />
  </Provider>
)

ReactDOM.render(<App />, document.getElementById('app'))
