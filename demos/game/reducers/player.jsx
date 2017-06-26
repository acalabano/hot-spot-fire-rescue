import {combineReducers} from 'redux'
import {OrderedMap} from 'immutable'

// -- // -- // Actions // -- // -- //

export const CREATE_PLAYER = 'CREATE_PLAYER'
export const createPlayer = (id, ap, location, color) => ({
  type: CREATE_PLAYER,
  id,
  ap,
  location,
  color
})

export const RECEIVE_PLAYERS = 'RECEIVE_PLAYERS'
export const receivePlayers = players => ({
  type: RECEIVE_PLAYERS,
  players
})

export const RECEIVE_PLAYER = 'RECEIVE_PLAYER'
export const receivePlayer = player => ({
  type: RECEIVE_PLAYER,
  player
})

export const SET_PLAYER = 'SET_PLAYER'
export const setPlayer = (id, location) => ({
  type: SET_PLAYER,
  id,
  location
})

// -- // -- // State // -- // -- //

const initial = {
  players: [],
  selected: {}
}

// -- // -- // Reducer // -- // -- //

const playerReducer = (state = initial, action) => {
  switch (action.type) {
    case RECEIVE_PLAYERS:
      return {...state,
        players: action.players
      }

    case RECEIVE_PLAYER:
      return {...state,
        selected: action.player
      }

    case CREATE_PLAYER:
      return {...state,
        players: state.players.concat([{id: action.id, ap: action.ap, location: action.location, color: action.color}])
      }

    case SET_PLAYER:
      return {...state,
        players: state.players.map(player => {
          if (player.id === action.id) {
            player.location = action.location
            return player
          }
        })
      }

  }

  return state
}

export default playerReducer