import {createCell} from '../reducers/board'
import {createBoundary} from '../reducers/boundary'
import {createPlayer, updateCurrentPlayer} from '../reducers/player'
import {createDanger} from '../reducers/danger'

`
Legend for Cells:
----------------------
0 = empty, 1 = smoke, 2 = fire

Legend for Boundaries:
----------------------
door: 0 = closed, 1 = open, 2 = destroyed
wall: 0 = intact, 1 = 1 damage, 2 = 2 damage (destroyed)
`

const initialWallCoords = () => {
  const cellsWithSouthWall = [1, 2, 3, 4, 5, 7, 8, 23, 24, 25, 26, 27, 41, 42, 43, 45, 46, 47, 48, 61, 62, 64, 65, 66, 67, 68]
  const cellsWithEastWall = [10, 15, 18, 20, 23, 28, 36, 38, 40, 42, 50, 55, 57, 58, 60, 68]

  return cellsWithSouthWall.map(num => [num, num + 10])
  .concat(cellsWithEastWall.map(num => [num, num + 1]))
}

const initialClosedDoorCoords = () => {
  const cellsWithSouthDoor = [28, 44]
  const cellsWithEastDoor = [13, 25, 32, 46, 65, 67]

  return cellsWithSouthDoor.map(num => [num, num + 10])
  .concat(cellsWithEastDoor.map(num => [num, num + 1]))
}

const initialOpenDoorCoords = () => {
  const cellsWithSouthOpenDoor = [6, 63]
  const cellsWithEastOpenDoor = [30, 48]

  return cellsWithSouthOpenDoor.map(num => [num, num + 10])
  .concat(cellsWithEastOpenDoor.map(num => [num, num + 1]))
}

const cellsWithPlayer = [6, 30, 73, 49]
const cellsWithFire = [14, 18, 25, 37, 43, 56, 53, 68]
const colors = ['blue', 'green', 'purple', 'orange']
const initialPlayers = [
  [0, 6, 'blue'],
  [1, 30, 'green'],
  [2, 73, 'purple'],
  [3, 49, 'orange']]
const initialFire = [
  [14, 'fire', 1],
  [37, 'fire', 1],
  [43, 'fire', 1],
  [56, 'fire', 1],
  [53, 'fire', 1],
  [68, 'fire', 1],
  [25, 'fire', 1],
  [18, 'fire', 1]
]

export const setupBoard = () => dispatch => {
  for (let idx = 0; idx < 80; idx++) {
    dispatch(createCell(idx))
  }
  initialPlayers.forEach(info => {
    dispatch(createPlayer(info[0], 4, info[1], info[2]))
  })
  initialFire.forEach(fire => {
    dispatch(createDanger(fire[0], fire[1], fire[2]))
  })
  initialWallCoords().forEach(wallCoord => {
    dispatch(createBoundary(wallCoord, 'wall', 0))
  })
  initialClosedDoorCoords().forEach(doorCoord => {
    dispatch(createBoundary(doorCoord, 'door', 0))
  })
  initialOpenDoorCoords().forEach(doorCoord => {
    dispatch(createBoundary(doorCoord, 'door', 1))
  })
}