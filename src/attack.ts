import { getSolidAtPositions } from './map'
import { sprite, SPRITE_ARROW } from './renderer'
import { GRAVITY } from './constants'
import { Game } from './game'

export type Attack = {
  x: number
  y: number
  xs: number
  ys: number
  range: number
  // gravity: number
  dead: number
  rotation: number
  t?: number
}

export const getInitialAttack = (
  startX: number,
  startY: number,
  charge: number,
  direction: number,
  speed: number,
  range: number,
): Attack => {
  const aim = range > 60 ? (charge / 33 | 0) / 3 : 0
  const angle = (direction < 0 ? Math.PI : 0) - aim * direction
  const xx = Math.cos(angle)
  const yy = Math.sin(angle)
  const x = startX + 16 * xx
  const y = startY + 16 * yy
  const xs = xx * speed
  const ys = yy * speed
  return { x, y, xs, ys, rotation: angle, range, dead: 0 }
}

export const updateAttack = (game: Game, self: Attack, timeScale = 1, draw = true) => {
  const t = self.t || 0
  self.x += self.xs * timeScale
  self.y += self.ys * timeScale

  self.t = t + timeScale
  if (self.range > 60)
    self.ys += GRAVITY * timeScale

  if (t > self.range || getSolidAtPositions(game.map, [[self.x, self.y]])) {
    game.attacks.splice(game.attacks.indexOf(self), 1)
    self.dead = 1
  }

  self.rotation = Math.atan2(-self.ys, self.xs)

  if (draw && !self.dead && self.range > 60)
    sprite(SPRITE_ARROW, 0, self.x, self.y, [,, self.rotation])
}
