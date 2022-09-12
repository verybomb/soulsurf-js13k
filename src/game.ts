import { getKeyPressed } from './input'
import { createEntity, Entity, updateEntity } from './entity'
import { createSoul, Soul, updateSoul } from './soul'
import { Attack, updateAttack } from './attack'
import { HEIGHT, sprite, SPRITE_BLACK_SQUARE, SPRITE_CONGRATS, SPRITE_ENTITY, SPRITE_LIGHTNING, SPRITE_LOGO, SPRITE_POINTER, SPRITE_PORTAL, SPRITE_SOUL, SPRITE_FRAME, text, WIDTH } from './renderer'
import { levelEditor } from './levelEditor'
import { FRAMERATE, MAP_PICKUP, MAP_PLAYER_SPAWN, MAP_SOUL_SPAWN, TYPE_PROTAGONIST } from './constants'
import { getPositionFromIndex, MAP_HEIGHT, MAP_SIZE, MAP_WIDTH, renderMap } from './map'
import { cos, decode } from './utils'
import stages from './stages'
import { SND_DIE, SND_HIT, SND_LIGHTNING, SND_PICKUP2, sound } from './sound'

export interface Game {
  t: number
  stageTimer: number
  stageTimes: number[]
  stage: number
  souls: Soul[]
  ents: Entity[]
  attacks: Attack[]
  shake: number
  map: number[][]
  levelEditor: boolean
  introLightning: number
}

export const createGame = (): Game => ({
  t: 0,
  stageTimer: -1,
  stageTimes: [],
  stage: 0,
  shake: 0,
  map: new Array(MAP_SIZE).fill([0, 0]),
  attacks: [],
  ents: [],
  souls: [],
  levelEditor: false,
  introLightning: 0,
})

export const updateGame = (game: Game) => {
  if (!game.stage) {
    const introEntity = game.ents[0]
    const introSoul = game.souls[0]
    if (!introEntity.dead) {
      if (introEntity.x > 128) {
        introEntity.x = 127
        introEntity.dead = true
        introEntity.host = -1
        introEntity.ys = -1
        introSoul.hosted = 0
        introSoul.x = introEntity.x
        introSoul.y = introEntity.y - 16
        introSoul.ys = -2
        game.introLightning = 1
        game.shake = 10
        sound(SND_DIE)
        sound(SND_LIGHTNING)
      }
    }
    if (getKeyPressed('enter')) {
      setupGame(game, 1)
    }
  }
  // if (game.levelEditor) {
  //   if (getKeyPressed('enter')) {
  //     setupGame(game, 1)
  //   }
  // }
  if (getKeyPressed('0')) {
    game.levelEditor = !game.levelEditor
    clearGame(game)
    setupGame(game, -1)
  }
  if (getKeyPressed('+')) {
    setupGame(game, Math.min(stages.length - 1, game.stage + 1))
  }
  if (getKeyPressed('r')) {
    setupGame(game, game.stage)
  }
  // if (getKeyPressed('t')) {
  //   setupGame(game, 0)
  // }

  const frame = () => {
    sprite(SPRITE_BLACK_SQUARE, 0, 0, HEIGHT - 32, [99, 9])

    for (let i = 0; i < WIDTH; i += 16) {
      sprite(SPRITE_FRAME, 0, 0, i, [,,])
      sprite(SPRITE_FRAME, 0, WIDTH - 16, i, [,, Math.PI])
      sprite(SPRITE_FRAME, 0, i, 0, [,, -Math.PI / 2])
      sprite(SPRITE_FRAME, 0, i, HEIGHT - 16, [,, Math.PI / 2])
      sprite(SPRITE_FRAME, 0, i, HEIGHT - 32, [,, -Math.PI / 2])
    }
  }

  const hud = () => {
    if (game.levelEditor) {
      return levelEditor(game)
    }
    game.souls.forEach((soul, i) => {
      const activeChar = game.ents.find((x) => x.host == soul.id)
      if (activeChar) {
        sprite(SPRITE_ENTITY, activeChar.type * 2, 12, HEIGHT - 26)
      } else {
        sprite(SPRITE_SOUL, 0, 16, HEIGHT - 20)
      }
    })

    if (!game.stage && game.ents[0].dead) {
      sprite(SPRITE_LOGO, 0, WIDTH / 2 - 48, 48)
    }

    const stageTimer = game.stageTimer > 0 ? game.stageTimer : 0

    text(
      ';==' + game.stage +
      '==:==' + (stageTimer / FRAMERATE | 0)
      , 40, HEIGHT - 20)

    // TUTORIAL
    if (game.stage === 1) {
      let x = 0, y = 0

      const ent = game.ents.find((ent) => ent.dead && ent.host < 0)
      const pickupIndex = game.map.findIndex(([type]) => type === MAP_PICKUP)

      if (ent) {
        x = game.ents[0].x
        y = game.ents[0].y
      } else if (pickupIndex > -1) {
        const s = getPositionFromIndex(pickupIndex)
        x = s[0] * 16
        y = s[1] * 16
      }

      if (x && y) {
        sprite(SPRITE_POINTER, 0, x, y - 8 + cos(game.t / 10) * 2, [,, -Math.PI / 2])
      }
    }

    // ENDING
    if (game.stage === stages.length - 1) {
      const t = Math.max(0, game.stageTimer - 360)
      if (game.stageTimer > 240)
        sprite(SPRITE_CONGRATS, 0, WIDTH / 2 - 16, 32)
      if (t > 0) {
        const ii = t / 60 | 0
        if (t % 60 === 0 && ii <= stages.length) {
          sound(SND_HIT)
        }
        if (ii === stages.length + 1) {
          sound(SND_PICKUP2)
        }
        for (let i = 0; i < Math.min(stages.length, ii); i++) {
          const x = i % 3
          const y = i / 3 | 0
          text(':==' + (game.stageTimes[i] / FRAMERATE | 0), 96 + x * 32, 64 + y * 16)
        }
      }
    }
  }

  if (!game.stage) {
    const options = 1
    if (game.ents[0].dead)
      for (let x = options; x--;)
        for (let i = 3; i--;)
          sprite(SPRITE_PORTAL, 0, 128 + x * 64, 128, [,, game.t * (1 + i) / 40])

    if (game.introLightning > 0) {
      sprite(SPRITE_LIGHTNING, 0, game.ents[0].x + Math.random() * 4 - 2, game.ents[0].y + Math.random() * 4 - 2, [10, 13])
      game.introLightning -= .1
    }
  }
  renderMap(game.map, game.levelEditor)
  game.ents.map((x) => updateEntity(game, x)),
  game.souls.map((x) => updateSoul(game, x)),
  game.attacks.map((x) => updateAttack(game, x)),
  frame()
  hud()

  game.t++
  game.shake -= game.shake * .1
  if (game.stageTimer > -1) {
    game.stageTimer++
  }
}

export const clearGame = (game: Game) => {
  game.t = 0
  game.stageTimer = -1
  game.ents = []
  game.souls = []
  game.attacks = []
  game.map = new Array(MAP_SIZE).fill([0, 0])
}

export const setupGame = (game: Game, stage: number) => {
  clearGame(game)
  game.stageTimes[game.stage] = game.stageTimer
  game.stage = stage

  let soulX = MAP_WIDTH / 2 * 16, soulY = MAP_HEIGHT / 2 * 16

  localStorage.setItem('soulsurf', JSON.stringify({ stage: game.stage }))

  const decoded = decode(stages[stage])
  if (decoded)
    game.map = decoded

  game.map.forEach(([type, ...params], i) => {
    const tx = i % MAP_WIDTH
    const ty = i / MAP_WIDTH | 0
    const x = tx * 16
    const y = ty * 16
    if (type === MAP_SOUL_SPAWN) {
      soulX = x
      soulY = y
    }
    if (type === MAP_PLAYER_SPAWN) {
      const entityType = params[0]
      const entityLives = params[1]
      game.ents.push(createEntity(entityType, x, y, entityLives))
    }
  })

  game.souls.push(createSoul(0, soulX, soulY))

  if (!stage) {
    const e = createEntity(TYPE_PROTAGONIST, -8, 160, 0)
    e.host = 0
    e.dead = false
    game.ents.push(e)
    game.souls[0].hosted = e
    // game.souls[0].lastHosted = e
  }
}
