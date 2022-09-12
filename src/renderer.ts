import { FRAMERATE } from './constants'
import { Game } from './game'
import { mainFrag, mainVert, screenFrag, screenVert } from './glsl/shaders'
import matrix, { rotate, scale, translate } from './matrix'
import { cos, sin } from './utils'
import { canvas, createFbo, createProgram, gl, loadImageTexture, loadShader } from './webgl'

const SHADER_MAIN = 0
const SHADER_SCREEN = 1
const NUM_SHADERS = 2

const SHADER_SOURCES = [
  [mainVert, mainFrag],
  [screenVert, screenFrag],
]

export const WIDTH = 272
export const HEIGHT = 272
const TILES_PER_ROW = 16

export const SPRITE_SOUL = [0, 0]
export const SPRITE_CHARS = [0, 1]
export const SPRITE_SKULL = [1, 0]
export const SPRITE_KEY = [3, 0]
export const SPRITE_BLACK_SQUARE = [8, 0, 1, 1, 0, 0]
export const SPRITE_ARROW = [4, 0, 1, 1, .5, .5]
export const SPRITE_SWORD = [5, 0]
export const SPRITE_BOW = [5, 0, 1, 1, .5, .5]
export const SPRITE_HAT = [7, 0]
export const SPRITE_ENTITY = [0, 2, 2, 2]
export const SPRITE_TURRET = [12, 8, 2, 2, .5, .5]
export const SPRITE_LASER_BEAM = [14, 8, 2, 2, .5, .5]
export const SPRITE_SQUARE = [14, 0, 2, 2]
export const SPRITE_POINTER = [11, 0, 1, 1, 1, .5]
export const SPRITE_SPIKES = [4, 6, 2, 2, .5, .5]
export const SPRITE_GATE = [8, 8, 2, 2, .5, .5]
export const SPRITE_BLOCK = [0, 8, 1, 2]
export const SPRITE_PLATFORM = [0, 7]
export const SPRITE_SWITCH = [4, 8, 2, 2, .5, .5]
export const SPRITE_DOOR = [0, 10, 2, 2]
export const SPRITE_PLANT = [6, 6, 2, 2]
export const SPRITE_VINE = [14, 6, 1, 2]
export const SPRITE_FRAME = [8, 10, 2, 2, .5, .5]
export const SPRITE_PORTAL = [4, 10, 2, 2, .5, .5]
export const SPRITE_LIGHTNING = [6, 10, 2, 2]
export const SPRITE_LOGO = [0, 12, 12, 3, .5, .5]
export const SPRITE_CONGRATS = [12, 12, 4, 1, .5, .5]
export const SPRITE_TEXT_TOTAL = [12, 13, 4, 1, .5, 1]
export const SPRITE_TEXT_PRESS_RETURN = [12, 14, 4, 1, .5, 1]
export const SPRITE_LABEL = [0, 15, 4, 1, .5, 1]
export const SPRITE_KEYBOARD_MANUAL = [10, 10, 6, 2, 0, 1]

const programs: WebGLProgram[] = []
let tileTexture: WebGLTexture

export const setTileTexture = (tileImage: HTMLImageElement) => {
  tileTexture = loadImageTexture(tileImage)
}

const [fbo, fboTexture] = createFbo(gl, canvas.width, canvas.height)

const getUniformLocation = (shader: number, name: string) => {
  return gl.getUniformLocation(programs[shader], name)
}

for (let i = NUM_SHADERS; i--;) {
  const [vertSource, fragSource] = SHADER_SOURCES[i]

  const vert = loadShader(gl, vertSource, gl.VERTEX_SHADER)
  const frag = loadShader(gl, fragSource, gl.FRAGMENT_SHADER)

  programs[i] = createProgram(gl, [vert, frag])!
  gl.useProgram(programs[i])
  gl.uniform2f(getUniformLocation(i, 'u_res'), WIDTH, HEIGHT)
}

export const begin = (game: Game) => {
  _tmp_frame = Date.now() / 1000 * FRAMERATE
  gl.useProgram(programs[SHADER_MAIN])
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.clearColor(0.027, 0.031, 0.08, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.uniform2f(getUniformLocation(SHADER_MAIN, 'u_cam'),
    (cos(_tmp_frame / 2) - .5) * game.shake | 0,
    (sin(_tmp_frame / 2) - .5) * game.shake | 0)
}

export let _tmp_frame = 0

export const end = () => {
  gl.useProgram(programs[SHADER_SCREEN])
  gl.uniform1f(getUniformLocation(SHADER_SCREEN, 'u_t'), _tmp_frame)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.bindTexture(gl.TEXTURE_2D, fboTexture)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6)
}

export const sprite = (tile: number[], tileOffset: number, x: number, y: number, transforms: (number|undefined)[] = []) => {
  const [tx, ty, tw = 1, th = 1, cx = .5, cy = 1] = tile
  const [xscale = 1, yscale = 1, rotation = 0] = transforms
  const w = tw * 8, h = th * 8
  const mat = matrix(
    translate(-cx, -cy),
    rotate(rotation),
    scale(w * xscale, h * yscale),
    translate(w * cx, h * cy),
    translate(x, y),
  )


  const yOffset = (tileOffset * tw - tx) / TILES_PER_ROW | 0
  const xx = (tx + tileOffset * tw) % TILES_PER_ROW
  const yy = ty + yOffset * th

  gl.uniform4f(getUniformLocation(SHADER_MAIN, 'u_tile'), xx, yy, tw, th)
  gl.uniformMatrix3fv(getUniformLocation(SHADER_MAIN, 'u_mat'), false, mat)

  gl.bindTexture(gl.TEXTURE_2D, tileTexture)

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6)
}

export const text = (num: string | number, x: number, y: number) => {
  ('' + num).split('').forEach((d, i) => {
    sprite(SPRITE_CHARS, d.charCodeAt(0) - 48, x + 4 * i, y)
  })
}
