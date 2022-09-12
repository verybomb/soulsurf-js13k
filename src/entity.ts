import { getKeySet, getKey, getKeyPressed } from './input'
import { SND_ATTACK, SND_BOUNCE, SND_BUMP, SND_CHARGE, SND_CLICK, SND_DIE, SND_GRAVITY_FLIP, SND_HIT, SND_JUMP, SND_LAND, SND_PICKUP, SND_PICKUP2, SND_STEP, sound } from './sound'
import { sin, toNumber } from './utils'
import { HEIGHT, sprite, SPRITE_BOW, SPRITE_ENTITY, SPRITE_SKULL, SPRITE_SWORD, WIDTH } from './renderer'
import { getDoorOpen, getMapCoord, getSolidAtPositions, MAP_HEIGHT, onTouchChunk, onTouchLaser } from './map'
import { BLOCK_TYPE_SPRING, CHARACTERS, CHUNK_KEY_SWITCH_ACTIVE, CHUNK_KEY_SWITCH_TIMER, CHUNK_KEY_TYPE, GRAVITY, JUMP_FRAME_THRESHOLD, MAP_BLOCK, MAP_DOOR, MAP_HAZARD, MAP_PICKUP, MAP_SWITCH, TYPE_ALIEN, TYPE_ARCHER, TYPE_FUNGUS, TYPE_KNIGHT } from './constants'
import { enterLevelEditor, Game, gotoStage, tmpTimeouts } from './game'
import { getInitialAttack, updateAttack } from './attack'

type EntityType = number

export type Entity = ReturnType<typeof createEntity>

export const createEntity = (type: EntityType, x: number, y: number, lives = 0) => ({
  xs: 0,
  ys: 0,
  host: -1,
  rotation: 0,
  timeInAir: -1,
  attackCharge: -1,
  attackTime: 0,
  jumpFrame: -JUMP_FRAME_THRESHOLD,
  coyoteTime: 0,
  walkTime: 0,
  type,
  x,
  y,
  dir: x > WIDTH / 2 ? -1 : 1,
  gravity: 1,
  jumps: CHARACTERS[type].jumps,
  dead: !lives,
})

export const updateEntity = (game: Game, self: Entity) => {
  const character = CHARACTERS[self.type]
  const isHost = self.host > -1
  const canControl = isHost && game.stage != 0

  const [leftKey, rightKey, upKey, downKey, keyAction] = getKeySet()
  const inputKeyDown = getKeyPressed(downKey, canControl)

  const inputKeyUp = (() => {
    if (!game.stage) {
      return !self.dead && game.t === 240 ? 1 : 0
    }
    return getKeyPressed(upKey, canControl)
  })()
  const inputMoveX = (() => {
    if (!game.stage) {
      if (!self.dead && ((game.t > 120 && game.t < 140) || (game.t > 200)))
        return 1
    }
    return getKey(rightKey, canControl) - getKey(leftKey, canControl)
  })()

  const moveX = self.walkTime > character.minWalkTime ? inputMoveX : 0
  const inAir = self.timeInAir > -1
  const outsideMap = self.y < -32 || self.y > MAP_HEIGHT * 16

  if (inputKeyUp) {
    self.jumpFrame = game.t
  }

  const jumpFrame = game.t - self.jumpFrame

  const die = () => {
    const soulId = self.host
    if (!self.dead || soulId > -1) {
      game.shake = 3
      self.dead = true
      self.ys = -1 * self.gravity
      sound(SND_DIE)
    }
    if (soulId > -1) {
      const soul = game.souls[soulId]
      soul.hosted = 0
      soul.x = self.x
      soul.y = self.y + 8
      soul.xs = self.xs
      soul.ys = self.ys - .5
      self.host = -1
    }
  }

  const jump = () => {
    if (!character.jumpVelocity) {
      return
    }
    if (self.type === TYPE_ALIEN) {
      if (!inAir) {
        self.gravity = -self.gravity
        self.jumps-- // TODO: remove?
        self.jumpFrame = 0
        sound(SND_GRAVITY_FLIP)
      }
    } else {
      self.ys = -character.jumpVelocity * self.gravity
      self.jumps--
      if (!inAir) {
        self.timeInAir = 0
      }
      self.jumpFrame = 0
      sound(SND_JUMP)
    }
  }

  const attack = () => {
    sound(SND_ATTACK)
    game.shake = 2
    const att = getInitialAttack(
      self.x, self.y,
      self.attackCharge,
      self.dir,
      character.attackSpeed,
      character.attackRange,
    )
    game.attacks.push({ ...att, range: character.attackRange })
    self.attackCharge = -1
    self.attackTime = 1
  }

  if (!self.dead || isHost) {
    game.attacks.forEach((a) => {
      const dx = a.x - self.x
      const dy = a.y - (self.y + 8)
      if (Math.abs(dy) < 16 && Math.abs(dx) < 12) {
        game.attacks.splice(game.attacks.indexOf(a), 1)
        sound(SND_HIT)
        die()
      }
    })
  }

  const nextX = self.x + self.xs
  const roofY = self.y - 4 * self.gravity
  const floorY = self.y + 9 * self.gravity

  const wall = getSolidAtPositions(game.map, [[self.x + moveX * 9, self.y]])
  const roof = getSolidAtPositions(game.map, [
    [nextX, roofY],
    [nextX + 4, roofY],
    [nextX - 4, roofY],
  ])
  const floor = getSolidAtPositions(game.map, [
    [nextX, floorY],
    [nextX + 4, floorY],
    [nextX - 4, floorY],
  ])
  const floorIsSpring = floor && floor[0] === MAP_BLOCK && floor[1] === BLOCK_TYPE_SPRING

  if (inputMoveX && self.type != TYPE_FUNGUS) {
    if (self.attackCharge < 0) {
      self.dir = inputMoveX
    }
    if (!(self.walkTime++ % 10) && !inAir) {
      sound(SND_STEP)
    }
  } else {
    self.walkTime = 0
  }

  onTouchChunk(game.map, MAP_SWITCH, [self.x, self.y], (chunk) => {
    if (inputKeyDown) {
      sound(SND_CLICK)
      // const switchIndex = chunk[CHUNK_KEY_SWITCH_INDEX]
      chunk[CHUNK_KEY_SWITCH_ACTIVE] = toNumber(!chunk[CHUNK_KEY_SWITCH_ACTIVE])
      if (chunk[CHUNK_KEY_SWITCH_TIMER] > 0) {
        // game.switchTimers[switchIndex] = chunk[CHUNK_KEY_SWITCH_TIMER] * 120
        const interval = setInterval(() => {
          sound(SND_CLICK)
        }, 1000)
        tmpTimeouts.push(interval)
        tmpTimeouts.push(setTimeout(() => {
          clearTimeout(interval)
          chunk[CHUNK_KEY_SWITCH_ACTIVE] = toNumber(!chunk[CHUNK_KEY_SWITCH_ACTIVE])
        }, chunk[CHUNK_KEY_SWITCH_TIMER] * 1000))
      }
    }
  })

  onTouchChunk(game.map, MAP_DOOR, [self.x, self.y], () => {
    if (getDoorOpen(game.map) && inputKeyDown) {
      sound(SND_PICKUP2)
      if (game.stage < 0) {
        enterLevelEditor(game)
      } else
        gotoStage(game, game.stage + 1)
    }
  })

  onTouchChunk(game.map, MAP_PICKUP, [self.x, self.y], (chunk) => {
    if (chunk) {
      chunk[CHUNK_KEY_TYPE] = 0
      sound(SND_PICKUP)
    }
  })

  onTouchLaser(game.map, [self.x, self.y], (laserDirection) => {
    if (laserDirection === 1)
      self.x = getMapCoord(self.x - self.dir * 8) * 16
    die()
  })
  onTouchChunk(game.map, MAP_HAZARD, [self.x, self.y], () => {
    die()
  })

  if (outsideMap) {
    die()
  }

  // move outside block if stuck
  if (getSolidAtPositions(game.map, [[self.x, self.y]])) {
    const xd = self.x > WIDTH / 2 ? -1 : 1
    const yd = self.y > HEIGHT / 2 ? -1 : 1
    self.x += xd * 16
    self.y += yd
  }

  if (self.attackCharge < 0) {
    if (!self.attackTime && character.attackRange && getKeyPressed(keyAction, isHost)) {
      self.attackCharge = 0
      sound(SND_CHARGE)
    }
  } else {
    if (self.attackCharge < 100)
      self.attackCharge += character.attackChargeSpeed
    if (!getKey(keyAction, isHost)) {
      attack()
    }
  }

  if (self.attackTime > 0) {
    self.attackTime -= .05
  } else {
    self.attackTime = 0
  }

  if (wall) {
    self.xs = 0
    self.x = getMapCoord(self.x) * 16
  }

  if (self.timeInAir < 0) {
    if (jumpFrame < JUMP_FRAME_THRESHOLD) {
      jump()
    }
    if (!floor) {
      self.timeInAir = 0
      self.coyoteTime = JUMP_FRAME_THRESHOLD
    } else {
      if (self.gravity == 1 && floorIsSpring && self.y >= 0) {
        self.ys = -3
        game.shake = 1
        sound(SND_BOUNCE)
      }
    }
  } else {
    self.timeInAir++

    // lose 1 jump if fallen off a platform for more than x frames
    if (!--self.coyoteTime && self.jumps == character.jumps) {
      self.jumps--
    }

    if (self.ys < character.maxFallVelocity) {
      self.ys += GRAVITY * self.gravity
    }

    if (jumpFrame < JUMP_FRAME_THRESHOLD) {
      if (self.jumps > 0) {
        jump()
      }
    }

    if (roof && self.ys < 0) {
      self.ys = 0
      sound(SND_BUMP)
    }

    if (floor) {
      self.y = getMapCoord(self.y) * 16
      self.ys = 0
      self.timeInAir = -1
      self.jumps = character.jumps
      if (self.gravity > 0 && !floorIsSpring) {
        sound(SND_LAND)
      }
    }
  }

  const maxSpeed = !game.stage ? .75 : 1
  self.xs += (moveX * maxSpeed - self.xs) * .25
  self.x += self.xs
  self.y += self.ys

  if (self.timeInAir > -1) {
    self.rotation += ((self.ys > 0 ? -.25 : .25) - self.rotation) * .3
  } else {
    self.rotation += (sin(self.walkTime / 2) * .3 - self.rotation) * .5
  }

  // RENDER
  const dead = self.dead && self.host < 0
  const tileOffset = self.type * 2 + toNumber(dead)
  const yOffset = self.gravity < 0 ? 16 : 0
  sprite(SPRITE_ENTITY, tileOffset, self.x, self.y - yOffset, [self.dir, self.gravity, self.rotation])

  if (!isHost && game.stage) {
    const symbolOffset = dead ? 4 : 8
    sprite(SPRITE_SKULL, toNumber(!self.dead), self.x + 4, self.y - symbolOffset)
  }

  if (self.type === TYPE_KNIGHT) {
    sprite(
      SPRITE_SWORD, self.type,
      self.x + 4 + 5 * self.dir, self.y + 4,
      [
        self.dir, , self.rotation - self.attackTime,
      ],
    )
  }
  if (self.type === TYPE_ARCHER) {
    // trajectory guide
    const inititalAttack = getInitialAttack(
      self.x, self.y,
      self.attackCharge,
      self.dir,
      character.attackSpeed,
      character.attackRange,
    )
    if (self.attackCharge > 0) {
      const attack = { ...inititalAttack }
      for (let i = 0; i < character.attackRange; i++) {
        updateAttack(game, attack, 1, i % 10 === 0)
      }
    }
    sprite(
      SPRITE_BOW, self.type,
      self.x + 4 + 5 * self.dir, self.y + 6,
      [
        , , self.rotation - inititalAttack.rotation,
      ],
    )
  }
}
