import {List, Map} from 'immutable'

`
Legend for Danger:
fire: 0 = removed, 1 = exist
smoke: 0 = removed, 1 = exist 
`

// -- // -- // Actions // -- // -- //

export const CREATE_DANGER = 'CREATE_DANGER'
export const createDanger = (location, kind, status) => {
  console.log("THIS IS THE CREATEDANGERFUNC BEING ACCESSED")
    return ({
    type: CREATE_DANGER,
    location,
    kind,
    status})
}
// export const CREATE_SMOKE = 'CREATE_SMOKE'
// export const createSmoke = (location) => ({
//   type: CREATE_SMOKE,
//   location,
//   kind: 'smoke',
//   status: 1
// })

export const FIRE_TO_SMOKE = 'FIRE_TO_SMOKE'
export const fireToSmoke = (location) => ({
  type: FIRE_TO_SMOKE,
  location,
  kind: 'smoke',
  status: 1
})

export const SMOKE_TO_FIRE = 'SMOKE_TO_FIRE'
export const smokeToFire = (location) => ({
  type: SMOKE_TO_FIRE,
  location,
  kind: 'fire',
  status: 1
})

export const REMOVE_FIRE = 'REMOVE_FIRE'
export const removeFire = (location) => ({
  type: REMOVE_FIRE,
  location,
  kind: 'fire',
  status: 0
})

export const REMOVE_SMOKE = 'REMOVE_SMOKE'
export const removeSmoke = (location) => ({
  type: REMOVE_SMOKE,
  location,
  kind: 'smoke',
  status: 0
})
// -- // -- // State // -- // -- //

const initial = List()

// -- // -- // Reducer // -- // -- //

const dangerReducer = (state = initial, action) => {
  switch (action.type) {
    case CREATE_DANGER:
      return state.set(action.location, {
          location: action.location,
          kind: action.kind,
          status: action.status
        })

    // case CREATE_SMOKE:
    //   return state.set(action.location, {
    //       location: action.location,
    //       kind: action.kind,
    //       status: action.status
    //     })

    // case FIRE_TO_SMOKE:
    //   return (
    //     danger.map(danger => {
    //       if (danger.location === action.location) {
    //         danger.kind = action.kind
    //       }
    //       return danger
    //     })
    //   )

    // case SMOKE_TO_FIRE:
    //   return (
    //     danger.map(danger => {
    //       if (danger.location === action.location) {
    //         danger.kind = action.kind
    //       }
    //       return danger
    //     })
    //   )

    // case REMOVE_FIRE:
    //   return (
    //     danger.map(danger => {
    //       if (danger.location === action.location) {
    //         danger.status = action.status
    //       }
    //       return danger
    //     })
    //   )

    //   case REMOVE_SMOKE:
    //   return (
    //     danger.map(danger => {
    //       if (danger.location === action.location) {
    //         danger.status = action.status
    //       }
    //       return danger
    //     })
    //   )

    case FIRE_TO_SMOKE:
      return state.update(action.location, val => Object.assign(val, {kind: action.kind}))

    case SMOKE_TO_FIRE:
      return state.update(action.location, val => Object.assign(val, {kind: action.kind}))

    case REMOVE_FIRE:
      return state.update(action.location, val => Object.assign(val, {status: action.status}))

    case REMOVE_SMOKE:
      return state.update([action.location, val => Object.assign(val, {status: action.status}))
  }

  return state
}

export default dangerReducer