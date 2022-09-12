import { getKeySet, getKey, getKeyPressed } from './input'
import { getMapCoord, getSolidAtPositions, MAP_HEIGHT, MAP_WIDTH } from './map'
import { sprite, SPRITE_HAT, SPRITE_PORTAL, SPRITE_SOUL } from './renderer'
import { SND_SOUL_OCCUPY, sound } from './sound'
import { Entity } from './entity'
import { Game } from './game'

const SOUL_RESSURECT_DISTANCE = 32

export type Soul = ReturnType<typeof createSoul>

export const createSoul = (id: number, x: number, y: number) => ({
  hosted: 0 as Entity | 0,
  transition: 0,
  xs: 0,
  ys: 0,
  dir: 1,
  id,
  x,
  y,
  t: 0,
})

export const updateSoul = (game: Game, self: Soul) => {
  const [lk, rk, uk, dk, keyAction] = getKeySet()
  const moveX = getKey(rk) - getKey(lk)
  const moveY = getKey(dk) - getKey(uk)

  if (self.transition && self.hosted) {
    const
      dx = self.hosted.x - self.x,
      dy = self.hosted.y - self.y,
      a = 1 - self.transition / 30

    self.xs += dx * .1 * a
    self.ys += dy * .1 * a

    if (!--self.transition) {
      game.shake = 2
      if (game.stageTimer < 0) {
        game.stageTimer = 0
      }
      sound(SND_SOUL_OCCUPY)
      self.hosted.host = self.id
      self.hosted.ys = -1 * self.hosted.gravity
    }
  }

  const [closestEntity] = game.ents.reduce<[Entity | undefined, number]>((stuff, entity) => {
    const xBlocksDistance = Math.abs(getMapCoord(entity.x) - getMapCoord(self.x))
    const yBlocksDistance = Math.abs(getMapCoord(entity.y) - getMapCoord(self.y))
    const withinRange = xBlocksDistance <= 1 && yBlocksDistance <= 1
    if (!entity.dead || entity.host > -1 || !withinRange) {
      return stuff
    }
    return [entity, 0]
  }, [, SOUL_RESSURECT_DISTANCE])

  if (!self.hosted) {
    self.xs += (moveX - self.xs) * .1
    self.ys += (moveY - self.ys) * .1
    self.dir = Math.sign(self.xs) || self.dir

    if (!game.levelEditor) {
      if (getSolidAtPositions(game.map, [[self.x, self.y]])) {
        self.y--
      }
      if (getSolidAtPositions(game.map, [[self.x + self.xs, self.y]])) {
        self.x -= self.xs
      }
      if (getSolidAtPositions(game.map, [[self.x, self.y + self.ys]])) {
        self.y -= self.ys
      }

      if (closestEntity && game.stage) {
        if (getKeyPressed(keyAction)) {
          self.hosted = closestEntity
          self.transition = 30
          self.ys = 1
        }
      }
    }
  }

  if (self.t > 60) {
    self.x += self.xs
    self.y += self.ys
  }
  self.x = Math.max(0, Math.min(MAP_WIDTH * 16 - 16, self.x))
  self.y = Math.max(0, Math.min(MAP_HEIGHT * 16 - 16, self.y))
  self.t++

  if (!self.hosted || self.transition) {
    if (self.t < 60) {
      for (let i = 3; i--;) {
        const s = 1
        sprite(SPRITE_PORTAL, 0, self.x, self.y, [s, s, game.t * (1 + i) / 40])
      }
    } else {
      sprite(SPRITE_SOUL, 0, self.x + 4, self.y + 4, [self.dir])
      if (game.levelEditor)
        sprite(SPRITE_HAT, 0, self.x + 4 + self.dir, self.y - 1, [self.dir])
    }
  }
}

