import { getKeyPressed } from './input'
import { createEntity, Entity, updateEntity } from './entity'
import { createSoul, Soul, updateSoul } from './soul'
import { Attack, updateAttack } from './attack'
import { HEIGHT, sprite, SPRITE_BLACK_SQUARE, SPRITE_CONGRATS, SPRITE_ENTITY, SPRITE_LIGHTNING, SPRITE_LOGO, SPRITE_POINTER, SPRITE_PORTAL, SPRITE_SOUL, SPRITE_FRAME, text, WIDTH, SPRITE_LABEL, SPRITE_TEXT_TOTAL, SPRITE_KEYBOARD_MANUAL, SPRITE_TEXT_PRESS_RETURN } from './renderer'
import { levelEditor } from './levelEditor'
import { FRAMERATE, MAP_PICKUP, MAP_PLAYER_SPAWN, MAP_SOUL_SPAWN, TYPE_PROTAGONIST } from './constants'
import { getPositionFromIndex, Map, MAP_SIZE, MAP_WIDTH, renderMap } from './map'
import { cos, decode, toNumber } from './utils'
import stages from './stages'
import { SND_DIE, SND_HIT, SND_LIGHTNING, SND_PICKUP2, sound } from './sound'

export let tmpTimeouts: any[] = []
export let personalBest = Number(localStorage.getItem('soulboy-pb')) || 0


export const MENU_OPTIONS = [
  { x: WIDTH / 2 - 32, y: 128 },
  { x: WIDTH / 2 + 32, y: 128 },
]

export interface Game {
  started: boolean
  t: number
  stageTimer: number
  stageTimes: number[]
  stage: number
  souls: Soul[]
  ents: Entity[]
  attacks: Attack[]
  shake: number
  map: number[][]
  levelEditorMap: number[][]
  levelEditor: boolean
  introLightning: number
  transition: number
}

export const createGame = (): Game => ({
  started: false,
  t: 0,
  stageTimer: -1,
  stageTimes: [],
  stage: 0,
  shake: 0,
  map: new Array(MAP_SIZE).fill([0, 0]),
  attacks: [],
  ents: [],
  souls: [createSoul(0, 0, 0)],
  levelEditor: false,
  levelEditorMap: new Array(MAP_SIZE).fill([0, 0]),
  introLightning: 0,
  transition: 0,
})

export const enterLevelEditor = (game: Game) => {
  clearGame(game)
  gotoStage(game, -1)
  game.levelEditor = true
  game.souls[0].x = WIDTH / 2
  game.souls[0].y = HEIGHT / 2
  game.souls[0].xs = 0
  game.souls[0].ys = 0
}

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
  }

  const closestOption = MENU_OPTIONS.findIndex((x, i) => {
    const soul = game.souls[0]
    if (soul) {
      const dx = x.x - soul.x, dy = x.y - soul.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < 32)
        return true
    }
  })


  if (getKeyPressed('x')) {
    if (!game.stage && closestOption > -1) {
      if (closestOption === 0)
        gotoStage(game, 1)
      if (closestOption === 1) {
        enterLevelEditor(game)
      }
    }
    if (game.stage === stages.length - 1 && game.stageTimer > 1200)
      gotoStage(game, 0)
  }

  if (getKeyPressed('enter')) {
    if (!game.started) {
      game.started = true
    }
    if (!game.stage && game.t > 120 && !game.ents[0].dead) {
      game.ents[0].x = 128
      game.ents[0].y = HEIGHT - 64
    }
  }

  if (getKeyPressed('escape')) {
    if (game.levelEditor || game.stage > 0 && game.stage < stages.length - 1) {
      // EXIT TO MENU
      gotoStage(game, 0)
    } else if (game.stage < 0) {
      // EXIT LEVEL EDTIOR STAGE
      enterLevelEditor(game)
    }
  }

  if (getKeyPressed('r')) {
    if (!game.levelEditor && game.stage < 0) {
      // RESTART LEVEL EDITOR STAGE
      game.levelEditor = false
      setupGame(game, game.levelEditorMap)
    } else if (game.stage > 0 && game.stage < stages.length - 1) {
      gotoStage(game, game.stage)
    }
  }

  // DEBUG
  // if (getKeyPressed('0')) {
  //   game.levelEditorMap = game.map
  //   game.levelEditor = !game.levelEditor
  // }
  // if (getKeyPressed('+')) {
  //   gotoStage(game, Math.min(stages.length - 1, game.stage + 1))
  // }
  // if (getKeyPressed('t')) {
  //   gotoStage(game, 0)
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

    sprite(SPRITE_KEYBOARD_MANUAL, 0, WIDTH - 56, HEIGHT - 24)

    // ENDING
    if (game.stage === stages.length - 1) {
      const t = Math.max(0, game.stageTimer - 360)
      const totalTime = game.stageTimes.slice(1, stages.length - 2).reduce((p, x) => p + x, 0)
      if (game.stageTimer > 240)
        sprite(SPRITE_CONGRATS, 0, WIDTH / 2 - 16, 32)
      if (t > 0) {
        const ii = t / 60 | 0
        if (t % 60 === 0 && ii <= stages.length - 2) {
          sound(SND_HIT)
        }

        if (t === 60 * stages.length) {
          sound(SND_PICKUP2)
          if (!personalBest || totalTime < personalBest) {
            localStorage.setItem('soulboy-pb', String(totalTime))
            personalBest = totalTime
          }
        }

        for (let i = 0; i < Math.min(stages.length - 2, ii); i++) {
          const time = game.stageTimes[i + 1]
          const x = i % 3
          const y = i / 3 | 0
          text(':==' + (time / FRAMERATE | 0), 96 + x * 32, 56 + y * 16)
        }
        if (t > 60 * stages.length) {
          sprite(SPRITE_TEXT_TOTAL, 0, 96, 128 + 16, [])
          text(':==' + (totalTime / FRAMERATE | 0), 96 + 32, 128 + 16)
        }
        if (t > 60 * stages.length) {
          const isPersonalBest = personalBest === totalTime
          sprite(SPRITE_LABEL, 2 + toNumber(isPersonalBest), 96, 128 + 32, [])
        }
      }
    }
  }

  // MENU
  if (!game.stage) {
    if (game.ents[0].dead) {
      sprite(SPRITE_LOGO, 0, WIDTH / 2 - 48, 48)
      MENU_OPTIONS.forEach((option, i) => {
        for (let i = 3; i--;)
          sprite(SPRITE_PORTAL, 0, option.x - 8, option.y - 8, [,, game.t * (1 + i) / 40])
        if (closestOption === i) {
          sprite(SPRITE_LABEL, i, option.x - 16, option.y - 20, [,, cos(i + game.t * .01) * .1])
          if (closestOption === 0 && personalBest)
            text(':==' + (personalBest / FRAMERATE | 0), option.x - 16, option.y - 32)
        }
      })
    }

    if (game.introLightning > 0) {
      sprite(SPRITE_LIGHTNING, 0, game.ents[0].x + Math.random() * 4 - 2, game.ents[0].y + Math.random() * 4 - 2, [10, 13])
      game.introLightning -= .1
    }
  }

  if (game.started) {
    if (game.levelEditor)
      renderMap(game.levelEditorMap, true)
    else
      renderMap(game.map)
    game.ents.map((x) => updateEntity(game, x))
    game.souls.map((x) => updateSoul(game, x))
    game.attacks.map((x) => updateAttack(game, x))
    frame()
    hud()
  } else {
    sprite(SPRITE_TEXT_PRESS_RETURN, 0, WIDTH / 2 - 16, HEIGHT / 2)
  }


  if (game.started)
    game.t++

  game.shake -= game.shake * .1
  if (game.stageTimer > -1) {
    game.stageTimer++
  }
}

export const clearGame = (game: Game) => {
  tmpTimeouts.forEach(clearTimeout)
  tmpTimeouts = []
  game.t = 0
  game.ents = []
  game.attacks = []
  game.levelEditor = false
  game.map = new Array(MAP_SIZE).fill([0, 0])
  game.souls[0].hosted = 0
}

export const setupGame = (game: Game, map: Map) => {
  game.map = map
  let soulX = WIDTH / 2, soulY = HEIGHT / 2

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

  game.souls[0].x = soulX
  game.souls[0].y = soulY
  game.souls[0].xs = 0
  game.souls[0].ys = 0
  game.souls[0].hosted = 0
}

export const gotoStage = (game: Game, stage: number) => {
  clearGame(game)
  game.stageTimes[game.stage] = game.stageTimer
  game.stageTimer = -1
  game.stage = stage

  const decoded = decode(stages[stage])
  if (decoded) {
    setupGame(game, decoded)
  }

  if (!stage) {
    const e = createEntity(TYPE_PROTAGONIST, -8, 160, 0)
    e.host = 0
    e.dead = false
    game.ents.push(e)
    game.souls[0].hosted = e
  }
}
