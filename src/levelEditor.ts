import { getKey, getKeyPressed } from './input'
import { renderMapChunk, getMapCoord, getMapIndexFromPosition } from './map'
import { HEIGHT, sprite, SPRITE_SQUARE, text } from './renderer'
import { SND_BLIP, SND_COPY, SND_PLACEBLOCK, sound } from './sound'
import { decode, encode } from './utils'
import { Game, setupGame } from './game'
import { NUM_BLOCK_TYPES, NUM_ENTITY_TYPES, NUM_SWITCHES } from './constants'

const LEVEL_EDITOR_MAX_VALUES = [
  // EMPTY
  [],
  // BLOCK - TYPE
  [NUM_BLOCK_TYPES],
  // SOUL SPAWN
  [],
  // PLAYER - TYPE, DEAD/ALIVE
  [NUM_ENTITY_TYPES - 2, 2],
  // PICKUP
  [],
  // DOOR
  [],
  // LASER TURRET - SWITCH INDEX / ON BY DEFAULT
  [NUM_SWITCHES, 2],
  // HOLOGRAM BLOCK - SWITCH INDEX / ON BY DEFAULT
  [NUM_SWITCHES, 2],
  // SWITCH - SWITCH INDEX / LEVER/BUTTON  / TIMER
  [NUM_SWITCHES, 2, 6],
  // SPIKES
  [],
]

const pasteStage = () => {
  return new Promise<string>((resolve) => {
    navigator.clipboard.readText().then(resolve).catch(() => {
      resolve(prompt('', '') || '')
    })
  })
}

let selectedParams = [1, 0]
let selectedOption = 0

export function levelEditor(game: Game) {
  const paramNumValues = LEVEL_EDITOR_MAX_VALUES[selectedParams[0]] || []

  const navLeftRight = getKeyPressed('l') - getKeyPressed('j')
  const navUpDown = getKeyPressed('i') - getKeyPressed('k')

  if (navLeftRight) {
    const next = selectedOption + navLeftRight
    if (next >= 0 && next <= paramNumValues.length) {
      sound(SND_BLIP)
      selectedOption = next
    }
  }

  if (navUpDown) {
    const next = (selectedParams[selectedOption] || 0) + navUpDown
    // first column (type) should only go to 1 minimum
    const maxValue = !selectedOption ? LEVEL_EDITOR_MAX_VALUES.length - 1 : paramNumValues[selectedOption - 1] - 1 || 0
    const minValue = !selectedOption ? 1 : 0
    if (next >= minValue && next <= maxValue) {
      sound(SND_BLIP)
      if (selectedOption === 0) {
        // game.levelEditType += navUpDown
        selectedParams = [next, 0]
      } else {
        selectedParams[selectedOption] = next
      }
    }
  }

  if (getKeyPressed('enter')) {
    game.levelEditor = false
    setupGame(game, game.levelEditorMap)
  }

  if (getKeyPressed('1')) {
    const encoded = encode(game.levelEditorMap)
    navigator.clipboard.writeText(encoded).then(() => {
      sound(SND_COPY)
    })
  }

  if (getKeyPressed('2')) {
    pasteStage().then((t) => {
      const decoded = decode(t)
      if (decoded) {
        game.levelEditorMap = decoded
        sound(SND_COPY)
      }
    })
  }

  const [soul] = game.souls

  const place = (erase = false) => {
    const block = erase ? [0, 0] : [...selectedParams]
    const index = getMapIndexFromPosition(soul.x, soul.y)
    if (game.levelEditorMap[index][0] != block[0]) {
      game.shake = 1
      sound(SND_PLACEBLOCK)
    }
    game.levelEditorMap[index] = block
  }

  // hotfix
  if (game.t > 30) {
    if (getKey('x')) {
      place()
    }
    if (getKey('c')) {
      place(true)
    }
  }

  renderMapChunk(game.levelEditorMap, selectedParams, 1E9, 8, HEIGHT - 24, true)
  sprite(SPRITE_SQUARE, 0, 8 + 24 * selectedOption, HEIGHT - 24)
  //
  sprite(SPRITE_SQUARE, 0, getMapCoord(game.souls[0].x) * 16, getMapCoord(game.souls[0].y) * 16)
  for (let i = 0; i < 1 + paramNumValues.length; i++) {
    text(selectedParams[i] || 0, 8 + 24 * i, HEIGHT - 32 + 8)
  }
}
