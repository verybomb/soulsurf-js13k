type Renderer = {
  gl: WebGLRenderingContext
}

type RenderInstruction = (renderer: Renderer) => void

export const createRenderer = (canvas: HTMLCanvasElement, tile: HTMLImageElement): Renderer => {
  const gl = canvas.getContext('webgl')

  if (!gl) {
    throw ''
  }

  return { gl }
}

export const clear = (): RenderInstruction => ({ gl }) => {

}

export const sprite = (tile: number[], x: number, y: number): RenderInstruction => ({ gl }) => {

}

export const render = (renderer: Renderer, renderInstructions: RenderInstruction[]) => {

}
