import { ERROR } from './utils'

export const canvas = document.querySelector('canvas')!
export const gl = canvas.getContext('webgl')!

if (!gl) {
  alert('Failed to create GL context')
}

export const loadShader = (gl: WebGLRenderingContext, shaderSource: string, shaderType: number) => {
  const shader = gl.createShader(shaderType)!
  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader)
  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

  if (!compiled) {
    // const lastError = gl.getShaderInfoLog(shader)
    // ERROR(shader + '\':' + lastError + '\n' + shaderSource.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n'))
    alert('Failed to compile shader')
    gl.deleteShader(shader)
  }

  return shader
}

export const createProgram = (gl: WebGLRenderingContext, shaders: [WebGLShader, WebGLShader]) => {
  const program = gl.createProgram()!

  shaders.forEach((shader) => {
    gl.attachShader(program, shader)
  })

  gl.linkProgram(program)

  const linked = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (!linked) {
    const lastError = gl.getProgramInfoLog(program)
    ERROR(lastError)
    gl.deleteProgram(program)
    return
  }

  setupBuffers(gl, program)
  return program
}

const setupBuffers = (gl: WebGLRenderingContext, shader: WebGLProgram) => {
  const buffer = gl.createBuffer()
  const positionLocation = gl.getAttribLocation(shader, 'a_pos')

  const vertices = new Float32Array([
    0, 1,
    1, 0,
    0, 0,
    0, 1,
    1, 1,
    1, 0,
  ])

  gl.enableVertexAttribArray(positionLocation)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
}

const setupTextureParameters = (gl: WebGLRenderingContext) => {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

export const createFbo = (gl: WebGLRenderingContext, w: number, h: number) => {
  // create empty texture
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  setupTextureParameters(gl)

  // create framebuffer and attach texture to it
  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  return [fbo, texture]
}


export const loadImage = async (url: string) => {
  const image = new Image()
  image.src = url
  return new Promise<HTMLImageElement>((resolve) => {
    image.onload = () => resolve(image)
  })
}

export const loadImageTexture = (image: HTMLImageElement | HTMLCanvasElement) => {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  setupTextureParameters(gl)
  return texture!
}
