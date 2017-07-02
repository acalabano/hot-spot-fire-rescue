'use strict'
import React from 'react'
import { connect } from 'react-redux'

import { setupBoard } from '../utils/setup'
import {
  sortCoord,
  switchDoor,
  damageWall
} from '../reducers/boundary'
import Danger from '../components/Danger'
import {
  createPlayer,
  removePlayer,
  movePlayer,
  endTurn,
  updatePlayer,
  pickUpOrDropVictim,
  checkForFireDamage
} from '../reducers/player'
import {
  addNextPoi
} from '../reducers/victim'
import {
  createDanger,
  addRandomSmoke,
  removeDanger,
  explode} from '../reducers/danger'
import reducer from '../reducers/'

import firebase from 'APP/fire'
const fbAuth = firebase.auth()
const fbDB = firebase.database()

class Board extends React.Component {
  constructor(props) {
    super(props)
    this.state= {
      currentUserId: '',
      currentUsername: '',
      userIsPlaying: false,
      gameStarted: false
    }
    this.handleCellClick = this.handleCellClick.bind(this)
    this.handleDoorSwitch = this.handleDoorSwitch.bind(this)
    this.handleWallDamage = this.handleWallDamage.bind(this)
    this.handleEndTurnClick = this.handleEndTurnClick.bind(this)
    this.handlePoiClick = this.handlePoiClick.bind(this)
    this.rescuedVictimCount = this.rescuedVictimCount.bind(this)
    this.damageCount = this.damageCount.bind(this)
    this.lostVictimCount = this.lostVictimCount.bind(this)
    this.didGameEnd = this.didGameEnd.bind(this)
    this.onPlayerSubmit=this.onPlayerSubmit.bind(this)
    this.removePlayerCallback=this.removePlayerCallback.bind(this)
  }

  componentWillMount() {
    this.props.fireRef.once('value', (snapshot) => {
      if (!snapshot.exists()) this.props.fetchInitialData()
    })
  }
  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({ currentUserId: user.uid, currentUsername: user.displayName })
      }
    })
  }
  handleWallDamage(event, wall) {
    event.stopPropagation()
    this.props.changeWallStatus(wall)
  }

  handleDoorSwitch(event, door) {
    event.stopPropagation()
    this.props.openOrCloseDoor(door.coord)
  }

  handleEndTurnClick(event) {
    event.stopPropagation()

    const isValid = (num) => {
      return !(num % 10 === 0 || num % 10 === 9 || num >= 70 || num <= 10)
    }

    let locationToAddSmoke = 0
    while (!isValid(locationToAddSmoke)) {
      locationToAddSmoke = Math.floor(Math.random() * 79) + 1
      // locationToAddSmoke = 14
    }

    const boundariesObj = this.props.boundaries.toObject()

    // helper function - to check the danger status of a cell
    const cellDangerStatus = (location) => {
      const targetCellKind = this.props.danger.getIn([location, 'kind'])
      const targetCellStatus = this.props.danger.getIn([location, 'status'])
      if (targetCellKind === 'fire' && targetCellStatus === 1) {
        return 'fire'
      } else if (targetCellKind === 'smoke' && targetCellStatus === 1) {
        return 'smoke'
      }
      return undefined
    }

    let actionCellDangerStatus = cellDangerStatus(locationToAddSmoke)
    actionCellDangerStatus = (actionCellDangerStatus === undefined) ? 'no status' : actionCellDangerStatus

    // if current cell is not fire, dispatch endTurn to add smoke
    if (cellDangerStatus(locationToAddSmoke) !== 'fire') {
      this.props.endTurn(locationToAddSmoke, boundariesObj)
    }
    // always check if it will cause explosion
    this.props.explode(actionCellDangerStatus, locationToAddSmoke, boundariesObj)

    // check for fire on POIs and characters
    const fireLocations = this.props.danger.map(danger => {
      if (danger && danger.get('kind') === 'fire' && danger.get('status') === 1) {
        return true
      } else {
        return false
      }
    })
    this.props.checkFireDamage(fireLocations.toArray())

    // add new POI only if < 3 are on board
    const poiStatusCount = this.props.victims.countBy(poi => poi.status)
    if ((poiStatusCount.get(0, 0) + poiStatusCount.get(1, 0)) < 3) {
      let locationToAddPoi = 0
      const hasPoiOrCharacter = (location) => (
        Boolean(this.props.players.find(player => player.location === location) ||
                this.props.victims.find(victim => victim.location === location))
      )
      while (!(isValid(locationToAddPoi) &&
             !hasPoiOrCharacter(locationToAddPoi))) {
        locationToAddPoi = Math.floor(Math.random() * 79) + 1
      }
      this.props.removeDanger(locationToAddPoi) // clear fire and smoke
      this.props.addPoi(locationToAddPoi)
    }
  }

  handleCellClick(event, cell) {
    event.stopPropagation()

    if (event.target.className === 'cell') {
      const sortedCoords = sortCoord([cell.cellNum,
        this.props.players.get(this.props.currentPlayerId).location])
      const nextCell = this.props.cells.get(cell.cellNum)
      const nextBoundary = this.props.boundaries.get(sortedCoords.toString(), '')
      const nextCellDangerKind = this.props.danger.getIn([cell.cellNum, 'kind'], '')

      this.props.move(this.props.currentPlayerId,
        nextCell,
        nextBoundary,
        nextCellDangerKind)
    }
  }

  handlePoiClick(event, victim, player) {
    event.stopPropagation()
    this.props.pickUpOrDropVictim(victim, this.props.currentPlayerId)
  }

  damageCount() {
    const wallsByStatus = this.props.boundaries
                          .filter(boundary => boundary.kind === 'wall')
                          .countBy(wall => wall.status)
    return wallsByStatus.get(1, 0) + (wallsByStatus.get(2, 0) * 2)
  }

  rescuedVictimCount() {
    const rescued = this.props.victims.countBy(victim => victim.status)
    return rescued.get(2) || 0
  }

  lostVictimCount() {
    const lost = this.props.victims.countBy(victim => victim.status)
    return lost.get(3) || 0
  }

  didGameEnd() {
    if (this.damageCount() > 23) {
      // Building collapsed!
    }
    if (this.lostVictimCount() > 4) {
      // Defeat - 4 victims were lost
    }
    if (this.rescuedVictimCount > 6) {
      // Victory - 7 victims were rescued!
    }
  }

  onPlayerSubmit(event) {
    event.preventDefault()
    let playerInfo = {
      id: this.state.currentUserId,
      ap: 5,
      location: -1,
      color: event.target.color.value,
      username: this.state.currentUsername
    }
    this.props.createAPlayer(playerInfo)
    this.setState({userIsPlaying: true})
  }

  removePlayerCallback(event) {
    const removeAPlayer = this.props.removeAPlayer
    this.props.removeAPlayer(event.target.id)
  }

  render() {
    const {
      players,
      danger,
      victims,
      currentPlayerId,
      cells,
      boundaries,
      fetchInitialData } = this.props

    let handleCellClick = this.handleCellClick
    let handleDoorSwitch = this.handleDoorSwitch
    let handleWallDamage = this.handleWallDamage
    let handleEndTurnClick = this.handleEndTurnClick
    let handlePoiClick = this.handlePoiClick
    let damageCount = this.damageCount
    let rescuedVictimCount = this.rescuedVictimCount
    let lostVictimCount = this.lostVictimCount
    let condition
    if (players.size>0) {
      condition = players.get(currentPlayerId).id!== this.state.currentUserId
    }
    // don't put console logs in render
    let tooManyPlayers= players.size >6
    let notEnoughPlayers= players.size < 2
    let spectating= this.state.userIsPlaying === false
    let doNotShowTheBoard= notEnoughPlayers && !spectating
    if (condition || spectating || this.state.gameStarted===false) {
      handleCellClick = () => (console.log('It is not your turn yet.  Have patience, padawan'))
      handleDoorSwitch = () => (console.log('It is not your turn yet.  Have patience, padawan'))
      handleWallDamage = () => (console.log('It is not your turn yet.  Have patience, padawan'))
      handleEndTurnClick = () => (console.log('It is not your turn yet.  Have patience, padawan'))
    }

    const remainingAp = players.get(currentPlayerId) ? players.get(currentPlayerId).ap : 0

    return (doNotShowTheBoard)?(
      <div>
      <h1>Add a Player</h1>
        <div className="row col-lg-4">
          <form onSubmit={this.onPlayerSubmit}>
          <div className="form-group">
            <label htmlFor="color"></label>
            <input className="form-control" type="color" id="color"/>
          </div>
            <button className="btn btn-default" type="submit" disabled={tooManyPlayers}>Add New Player</button>
          </form>
        </div>
        <ul>
          {
            players.map((player) => {
              let idx= players.indexOf(player)
              return (
                <div key={idx}>
                  <li style={{color: `${player.color}`}}> <p style={{color: `${player.color}`}}>{player.username} </p></li><button id={idx} onClick= {this.removePlayerCallback} disabled={player.id!==this.state.currentUserId}>X</button>
                </div>
              )
            })
          }
        </ul>
        <button disabled={players.size<1} onClick= {() => {
          this.setState({userIsPlaying: false})
        }}> Just Spectating</button>
        {
          (players.size < 1)?<p>You cannot spectate an empty game</p>: null
        }
      </div>
    ):(
      <div>{console.log(this.state.userIsPlaying)}
        <div>
            {(spectating)?
              <div>
              <h1>Join the Game!</h1>
                  <div className="row col-lg-4">
                    <form onSubmit={this.onPlayerSubmit}>
                    <div className="form-group">
                      <label htmlFor="color"></label>
                      <input className="form-control" type="color" id="color"/>
                    </div>
                      <button className="btn btn-default" type="submit" disabled={tooManyPlayers}>Add New Player</button>
                    </form>
                  </div>
              </div>
            :<div></div>}
        </div>
        <ul>
            {
              players.map((player) => {
                return (
                  <div>
                    <li key= {`${player.color}`} style={{color: `${player.color}`}}> <p style={{color: `${player.color}`}}>{player.username} </p></li>
                  </div>
                )
              })
            }
          </ul>
          {
            (!this.state.gameStarted && !spectating)?<button onClick={() => this.setState({gameStarted: true})}>Start the Game</button>:<div></div>
          }
        <br></br>
        <button disabled={condition} onClick={handleEndTurnClick}>End Turn</button>
        <h6>Player0-blue, Player1-green, Player2-purple, Player3-orange </h6>
        <h3>Player {currentPlayerId} has {remainingAp} AP left</h3>
        <h5>Number of saved victims: {rescuedVictimCount()}</h5>
        <h5>Number of lost victims: {lostVictimCount()}</h5>
        <h5>Total damage to building: {damageCount()}</h5>

        {
          cells.map(cell => {
            const eastBoundaryCoord = [cell.cellNum, cell.cellNum + 1].toString()
            const southBoundaryCoord = [cell.cellNum, cell.cellNum + 10].toString()
            const eastBoundary = boundaries.get(eastBoundaryCoord)
            const southBoundary = boundaries.get(southBoundaryCoord)
            const kind = danger.getIn([cell.cellNum, 'kind'])
            const status = danger.getIn([cell.cellNum, 'status'])
            const location = danger.getIn([cell.cellNum, 'location'])
            const player = players.find((val) => val.location === cell.cellNum)
            const poi = victims.find((val) => val.location === cell.cellNum)
            const fire = danger.get(cell.cellNum)

            return (
              <div key={cell.cellNum}
                className="cell"
                onClick={(evt) => handleCellClick(evt, cell)}>
                {
                  fire
                  && <Danger location={location} kind={kind} status={status} />
                }
                {
                  player
                  && <div className='player'
                    style={{ backgroundColor: player.color }} />
                }
                {
                  poi && poi.status === 0
                  && <div className='poi'>?</div>
                }
                {
                  poi && poi.status === 1 && !poi.carriedBy
                  && <div className={`poi victim-uncarried`}
                    onClick={(evt) => handlePoiClick(evt, poi, player)} />
                }
                {
                  poi && poi.status === 1 && poi.carriedBy
                  && <div className={`poi victim-carried`}
                    onClick={(evt) => handlePoiClick(evt, poi, player)} />
                }
                {
                  eastBoundary && eastBoundary.kind === 'wall' && eastBoundary.status === 0
                  && <div className='vertical-wall'
                    id={eastBoundaryCoord}
                    onClick={(evt) => handleWallDamage(evt, eastBoundary)} />
                }
                {
                  eastBoundary && eastBoundary.kind === 'wall' && eastBoundary.status === 1
                  && <div className='vertical-wall-damagedOnce'
                    id={eastBoundaryCoord}
                    onClick={(evt) => handleWallDamage(evt, eastBoundary)} />
                }
                {
                  eastBoundary && eastBoundary.kind === 'wall' && eastBoundary.status === 2
                  && <div className='vertical-wall-damagedTwice'
                    id={eastBoundaryCoord}
                    onClick={(evt) => handleWallDamage(evt, eastBoundary)} />
                }
                {
                  southBoundary && southBoundary.kind === 'wall' && southBoundary.status === 0
                  && <div className='horizontal-wall'
                    id={southBoundaryCoord}
                    onClick={(evt) => handleWallDamage(evt, southBoundary)} />
                }
                {
                  southBoundary && southBoundary.kind === 'wall' && southBoundary.status === 1
                  && <div className='horizontal-wall-damagedOnce'
                    id={southBoundaryCoord}
                    onClick={(evt) => handleWallDamage(evt, southBoundary)} />
                }
                {
                  southBoundary && southBoundary.kind === 'wall' && southBoundary.status === 2
                  && <div className='horizontal-wall-damagedTwice'
                    id={southBoundaryCoord}
                    onClick={(evt) => handleWallDamage(evt, southBoundary)} />
                }
                {
                  eastBoundary && eastBoundary.kind === 'door'
                  && eastBoundary.status === 0
                  && <div className='vertical-door-closed'
                    onClick={(evt) => handleDoorSwitch(evt, eastBoundary)} />
                }
                {
                  southBoundary && southBoundary.kind === 'door'
                  && southBoundary.status === 0
                  && <div className='horizontal-door-closed'
                    onClick={(evt) => handleDoorSwitch(evt, southBoundary)} />
                }
                {
                  eastBoundary && eastBoundary.kind === 'door'
                  && eastBoundary.status === 1
                  && <div className='vertical-door-open'
                    onClick={(evt) => handleDoorSwitch(evt, eastBoundary)} />
                }
                {
                  southBoundary && southBoundary.kind === 'door'
                  && southBoundary.status === 1
                  && <div className='horizontal-door-open'
                    onClick={(evt) => handleDoorSwitch(evt, southBoundary)} />
                }
              </div>
            )
          })
        }
      </div>
    )
  }
}

// -- // -- // Container // -- // -- //

const mapState = ({ board, boundary, player, victim, danger }) => ({
  cells: board,
  boundaries: boundary,
  players: player.players,
  victims: victim.poi,
  currentPlayerId: player.currentId,
  danger: danger
})

const mapDispatch = dispatch => ({
  fetchInitialData: () => {
    dispatch(setupBoard())
  },
  endTurn: (location, boundaries) => {
    dispatch(endTurn(location, boundaries))
  },
  openOrCloseDoor: (coord) => {
    dispatch(switchDoor(coord))
  },
  changeWallStatus: (coord) => {
    dispatch(damageWall(coord))
  },
  move: (id, nextCell, nextBoundary, nextDanger) => {
    dispatch(movePlayer(id, nextCell, nextBoundary, nextDanger))
  },
  pickUpOrDropVictim: (victim, playerId) => {
    dispatch(pickUpOrDropVictim(victim, playerId))
  },
  updatePlayer: (id, uid) => {
    dispatch(updatePlayer(id, uid))
  },
  explode: (actionCellDangerStatus, explosionLocation, boundariesObj) => {
    dispatch(explode(actionCellDangerStatus, explosionLocation, boundariesObj))
  },
  addPoi: (location) => {
    dispatch(addNextPoi(location))
  },
  removeDanger: (location) => {
    dispatch(removeDanger(location))
  },
  checkFireDamage: (fireLocations) => {
    dispatch(checkForFireDamage(fireLocations))
  },
  createAPlayer: (playerInfo) => {
    dispatch(createPlayer(playerInfo.id, playerInfo.ap, playerInfo.location, playerInfo.color, playerInfo.username))
  },
  removeAPlayer: (player) => {
    dispatch(removePlayer(player))
  }
})

export default connect(mapState, mapDispatch)(Board)
