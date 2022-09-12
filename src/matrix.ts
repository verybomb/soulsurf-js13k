import { cos, sin } from './utils'

export type Matrix = number[]

export const _multiply = (a: Matrix, b: Matrix) => {
  const a00 = a[0 * 3], a01 = a[0 * 3 + 1], a02 = a[0 * 3 + 2],
    a10 = a[1 * 3], a11 = a[1 * 3 + 1], a12 = a[1 * 3 + 2],
    a20 = a[2 * 3], a21 = a[2 * 3 + 1], a22 = a[2 * 3 + 2],
    b00 = b[0 * 3], b01 = b[0 * 3 + 1], b02 = b[0 * 3 + 2],
    b10 = b[1 * 3], b11 = b[1 * 3 + 1], b12 = b[1 * 3 + 2],
    b20 = b[2 * 3], b21 = b[2 * 3 + 1], b22 = b[2 * 3 + 2]

  return [a00 * b00 + a01 * b10 + a02 * b20,
    a00 * b01 + a01 * b11 + a02 * b21,
    a00 * b02 + a01 * b12 + a02 * b22,
    a10 * b00 + a11 * b10 + a12 * b20,
    a10 * b01 + a11 * b11 + a12 * b21,
    a10 * b02 + a11 * b12 + a12 * b22,
    a20 * b00 + a21 * b10 + a22 * b20,
    a20 * b01 + a21 * b11 + a22 * b21,
    a20 * b02 + a21 * b12 + a22 * b22]
}

type MatrixTransformation = (a: Matrix) => Matrix
type MakeMatrixTransformation = (...args: number[]) => MatrixTransformation

const matrix = (...operations: MatrixTransformation[]): Matrix => {
  let m = [1, 0, 0,  0, 1, 0,  0, 0, 1]
  for (const o of operations) {
    m = o(m)
  }
  return m
}

export const translate: MakeMatrixTransformation = (x, y) => (m) => {
  return _multiply(m, [1, 0, 0,  0, 1, 0,  x, y, 1])
}

export const scale: MakeMatrixTransformation = (x, y) => (m) => {
  return _multiply(m, [
    x, 0, 0,
    0, y, 0,
    0, 0, 1,
  ])
}

export const rotate: MakeMatrixTransformation = (r) => (m) => {
  const c = cos(r)
  const s = sin(r)
  return _multiply(m, [
    c, -s, 0,
    s, c, 0,
    0, 0, 1,
  ])
}

export const multiply: MakeMatrixTransformation = (...m2) => (m) => {
  return _multiply(m, m2)
}

export default matrix
