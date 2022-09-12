import { sprite, SPRITE_BLOCK, SPRITE_DOOR, SPRITE_ENTITY, SPRITE_GATE, SPRITE_LASER_BEAM, SPRITE_KEY, SPRITE_TURRET, SPRITE_PLANT, SPRITE_PLATFORM, SPRITE_POINTER, SPRITE_SOUL, SPRITE_SWITCH, _tmp_frame, SPRITE_SPIKES, SPRITE_VINE } from './renderer'
import { cos, createRng, memo, toNumber } from './utils'
import { CHUNK_KEY_TYPE, MAP_BLOCK, MAP_DOOR, MAP_EMPTY, MAP_GATE, MAP_HAZARD, MAP_LASER_TURRET, MAP_PICKUP, MAP_PLAYER_SPAWN, MAP_SOUL_SPAWN, MAP_SWITCH } from './constants'

export type MapChunk = number[]
export type Map = MapChunk[]

export const MAP_WIDTH = 17
export const MAP_HEIGHT = 15
export const MAP_SIZE = MAP_WIDTH * MAP_HEIGHT

// world coordinate to map space
export const getMapCoord = (x: number) => {
  return Math.round(x / 16)
}

// coordinate to index
export const getMapIndex = (x: number, y: number) => {
  return x + y * MAP_WIDTH
}

export const getPositionFromIndex = (index: number) => {
  const x = index % MAP_WIDTH
  const y = index / MAP_WIDTH | 0
  return [x, y]
}

export const getMapIndexFromPosition = (x: number, y: number) => {
  const cx = getMapCoord(x)
  const cy = getMapCoord(y)
  return getMapIndex(cx, cy)
}

export const getSwitchableActive = (map: Map, params: number[]) => {
  const switchIndex = params[0]
  const alreadyActive = params[1]
  const switchesOn = map.some(([type, index, active]) => {
    return type == MAP_SWITCH && index == switchIndex && active
  })
  return toNumber(alreadyActive ? !switchesOn : switchesOn)
}

export const getMapChunkFromPosition = (map: number[][], x: number, y: number): MapChunk => {
  const cx = getMapCoord(x)
  const cy = getMapCoord(y)
  if (cx < 0 || cx >= MAP_WIDTH) {
    return [MAP_EMPTY, 0]
  }

  const index = getMapIndex(cx, cy)

  return map[index] || [MAP_EMPTY, 0]
}

export const getSolidAtPositions = (map: Map, positions: [number, number][]) => {
  for (const [x, y] of positions) {
    const chunk = getMapChunkFromPosition(map, x, y)
    const [type, ...params] = chunk
    if (type == MAP_BLOCK || type == MAP_LASER_TURRET || (type == MAP_GATE && getSwitchableActive(map, params))) {
      return chunk
    }
  }
}

export const onTouchChunk = (map: Map, type: number, [x, y]: number[], cb: (c: MapChunk) => void) => {
  const chunk = getMapChunkFromPosition(map, x, y)
  if (chunk[CHUNK_KEY_TYPE] === type) {
    cb(chunk)
  }
}

export const onTouchLaser = (map: Map, [x, y]: number[], cb: (c: number) => void) => {
  const lasers = getLaserBeams(map)
  const _x = getMapCoord(x), _y = getMapCoord(y)

  // min-max makes beam repeat beyond level
  const mapIndex = getMapIndex(_x, Math.min(MAP_HEIGHT - 1, Math.max(0, _y)))

  if (lasers[mapIndex]) {
    cb(lasers[mapIndex])
  }
}

export const getDoorOpen = (map: Map) => {
  return !map.some(([type]) => type === MAP_PICKUP)
}


export const getLaserBeams = (map: Map) => memo('lasers', () => {
  const lasers = new Array<number>(MAP_SIZE).fill(0)
  const laserDirection = [[0, 1], [1, 0], [0, -1], [-1, 0]]
  map
    .forEach(([type, ...params], i) => {
      if (type != MAP_LASER_TURRET || !getSwitchableActive(map, params)) {
        return
      }
      laserDirection.forEach(([dx, dy], directionIndex) => {
        let x = i % MAP_WIDTH
        let y = i / MAP_WIDTH | 0
        let stop = false
        while (!stop) {
          x += dx
          y += dy
          const ii = getMapIndex(x, y)
          const outside = x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT
          const collision = getSolidAtPositions(map, [[x * 16, y * 16]])
          if (outside || collision) {
            stop = true
          } else {
            const vertical = directionIndex % 2 == 1
            const state = vertical ? 2 : 1
            // 3 = BOTH
            // 2 = VERTICAL
            // 1 = HORIZONTAL
            lasers[ii] = lasers[ii] && lasers[ii] != state ? 3 : vertical ? 2 : 1
          }
        }
      })
    })
  return lasers
}, map)

export const renderMapChunk = (map: Map, chunk: number[], index: number, x: number, y: number, drawHidden = false) => {
  const [type, ...params] = chunk

  // adjecent blocks
  const [left, right, up, down] = [-1, 1, -MAP_WIDTH, MAP_WIDTH].map((adjacentIndex) => {
    const i = index + adjacentIndex
    return (map[i] && map[i][0] == MAP_BLOCK) ? 1 + map[i][1] : 0
  })

  if ([MAP_EMPTY, MAP_PICKUP].includes(type)) {
    const tileRng = createRng(index)
    const plant = tileRng() > .25
    const tileOffset = tileRng() * 4 | 0
    const xs = tileRng() > .5 ? 1 : -1
    if (plant) {
      if (down === 1) {
        sprite(SPRITE_PLANT, tileOffset, x, y, [xs])
      }
      if (up) {
        for (let xOffset = 2; xOffset--;) {
          let vineY = 0
          for (let i = 6; i--;) {
            const solid = memo('vine', () => !!getSolidAtPositions(map, [[x, y + vineY]]),  [x, y + vineY])
            const stop = tileRng() < .6 || solid
            sprite(SPRITE_VINE, toNumber(stop), x + xOffset * 8, y + vineY, [xs])
            vineY += 16
            if (stop) {
              break
            }
          }
        }
      }
    }
  }

  switch (type) {
    case MAP_BLOCK: {
      const offsetLeft = left ? 1 : down ? 2 : 0
      const offsetRight = right ? 1 : down ? 2 : 0
      sprite(SPRITE_BLOCK, offsetLeft, x, y, [])
      sprite(SPRITE_BLOCK, offsetRight, x + 8, y, [-1])
      if (!up) {
        const blockType = params[0]
        sprite(SPRITE_PLATFORM, toNumber(left > 0) + blockType * 2, x, y, [])
        sprite(SPRITE_PLATFORM, toNumber(right > 0) + blockType * 2, x + 8, y, [-1])
      }
      break
    }
    case MAP_SOUL_SPAWN: {
      if (drawHidden) {
        sprite(SPRITE_SOUL, 0, x + 4, y + 4, [])
      }
      break
    }
    case MAP_PLAYER_SPAWN: {
      if (drawHidden) {
        const entitySpawnType = params[0]
        const entitySpawnLives = params[1]
        const entitySpawnDead = !entitySpawnLives
        const tileOffset = entitySpawnType * 2 + toNumber(entitySpawnDead)
        sprite(SPRITE_ENTITY, tileOffset, x, y, [])
      }
      break
    }
    case MAP_PICKUP: {
      const subType = params[0]
      const a = index + _tmp_frame * .05
      const yscale = 1 + Math.max(0, cos(a * 2) * .1)
      const rot = cos(a) * .2
      sprite(SPRITE_KEY, subType, x + 4, y + 4 + cos(a * 2) * 2, [, yscale, rot])
      break
    }
    case MAP_LASER_TURRET: {
      sprite(SPRITE_TURRET, 0, x, y)
      break
    }
    case MAP_HAZARD: {
      sprite(SPRITE_SPIKES, 0, x, y)
      break
    }
    case MAP_DOOR: {
      const open = getDoorOpen(map)

      sprite(SPRITE_DOOR, toNumber(open), x, y)
      if (open) {
        sprite(SPRITE_POINTER, 0, x, y - 8 + cos(_tmp_frame / 10) * 2, [,, -Math.PI / 2])
        // for (let i = 3; i--;)
        //   sprite(SPRITE_PORTAL, 0, x, y, [,, _tmp_frame * (1 + i) / 40])
      }
      break
    }
    case MAP_GATE: {
      const tileOffset = getSwitchableActive(map, params)
      sprite(SPRITE_GATE, tileOffset, x, y)
      break
    }
    case MAP_SWITCH: {
      const switchesOn = params[1] || 0 // game.switches[switchIndex]
      const tileOffset = toNumber(switchesOn > 0) // + switchType * 2
      const rot = down ? 0 : up ? -2 : left ? 1 : right ? -1 : 0
      sprite(SPRITE_SWITCH, tileOffset, x, y, [,, rot * Math.PI / 2])
    }
  }
}

export const renderMap = (map: Map, renderHidden = false) => {
  const lasers = getLaserBeams(map)

  map.forEach((chunk, index) => {
    const tx = index % MAP_WIDTH
    const ty = (index / MAP_WIDTH | 0)
    const x = tx * 16, y = ty * 16

    renderMapChunk(map, chunk, index, x, y, renderHidden)
    if (lasers[index]) {
      const x = 16 * (index % MAP_WIDTH)
      const y = 16 * (index / MAP_WIDTH | 0)
      const both = lasers[index] == 3
      const vertical = both || lasers[index] === 2
      const horizontal = both || lasers[index] === 1
      horizontal && sprite(SPRITE_LASER_BEAM, 0, x, y, [,, Math.PI / 2])
      vertical && sprite(SPRITE_LASER_BEAM, 0, x, y)
    }
  })
}
