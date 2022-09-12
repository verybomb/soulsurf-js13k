import { loadImage } from './webgl'
import { FRAMERATE } from './constants'
import { eventListeners, updateKeyPress } from './input'
import { createGame, gotoStage, updateGame } from './game'
import {
  begin,
  end,
  setTileTexture,
} from './renderer'
import tile from './tile.png'

const runApp = async (tileImage: HTMLImageElement) => {
  const game = createGame()

  eventListeners()
  setTileTexture(tileImage)
  gotoStage(game, 0)

  const animate = () => {
    begin(game)
    updateGame(game)
    updateKeyPress()
    end()
  }

  setInterval(animate, 1000 / FRAMERATE)
}

loadImage(tile).then(runApp)
