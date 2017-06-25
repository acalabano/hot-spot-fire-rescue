import {createCell, createBoundary} from '../reducers/board'

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

  return cellsWithSouthWall.map(num => `[${num}, ${num + 10}]`)
  .concat(cellsWithEastWall.map(num => `[${num}, ${num + 1}]`))
}

const initialClosedDoorCoords = () => {
  const cellsWithSouthDoor = [28, 44]
  const cellsWithEastDoor = [13, 25, 32, 46, 65, 67]

  return cellsWithSouthDoor.map(num => `[${num}, ${num + 10}]`)
  .concat(cellsWithEastDoor.map(num => `[${num}, ${num + 1}]`))
}

const initialOpenDoorCoords = () => {
  const cellsWithSouthOpenDoor = [6, 63]
  const cellsWithEastOpenDoor = [30, 48]

  return cellsWithSouthOpenDoor.map(num => `[${num}, ${num + 10}]`)
  .concat(cellsWithEastOpenDoor.map(num => `[${num}, ${num + 1}]`))
}

export const setupBoard = () => dispatch => {
  // TODO: check if no board exists somewhere onEnter
  for (let idx = 0; idx < 80; idx++) {
    dispatch(createCell(idx))
  }
  initialWallCoords().forEach(wallCoords => {
    dispatch(createBoundary(wallCoords, 'wall', 0))
  })
  initialClosedDoorCoords().forEach(doorCoords => {
    dispatch(createBoundary(doorCoords, 'door', 0))
  })
  initialOpenDoorCoords().forEach(doorCoords => {
    dispatch(createBoundary(doorCoords, 'door', 1))
  })
}