export const LOG = console.log
export const ERROR = console.error

export const sin = Math.sin
export const cos = Math.cos

export const createRng = (seed: number) => {
  return () => {
    const x = sin(seed++) * 10000
    return x - Math.floor(x)
  }
}

const memoCache: Record<string, [string, any]> = {}

export const memo = <T>(id: string, cb: () => T, args: any[]): T => {
  const argString = JSON.stringify(args)
  if (memoCache[id] && memoCache[id][0] === argString) {
    return memoCache[id][1]
  }

  const result = cb()
  memoCache[cb.name] = [argString, result]
  return result
}

const fromCharCode = String.fromCharCode
const UPPERCASE_A = 65
const LOWERCASE_A = 97

type Cell = number[]

export const encode = (_cells: Cell[]) => {
  // hotfix - replace all undefined to 0
  const cells = _cells.map((x) => x.map(n => n || 0))
  const CELL_SEPERATOR = '-'
  const PARAM_SEPERATOR = ','
  const SEPERATOR = PARAM_SEPERATOR + CELL_SEPERATOR
  const REGEX = /((\d+,)+-)\1*/g // groups repeating cells
  const serialized = cells.join(SEPERATOR) + SEPERATOR
  return serialized
    .replaceAll(REGEX, (a, b: string) => {
      const count = a.split(CELL_SEPERATOR).length - 1
      const params = b.split(PARAM_SEPERATOR).slice(0, -1)
      // convert numbers to letters
      const cell = params.map((x, i) => {
        if (x === '0' && i && params.length === 2) {
          // omit if only param after type is set to 0
          return ''
        }
        const baseCharCode = !i ? UPPERCASE_A : LOWERCASE_A
        return fromCharCode(baseCharCode + (x as any - 0))
      })
      // omit repeat count if 1
      return cell.join('') + (count > 1 ? count : '')
    })
}

export const decode = (encoded: string): Cell[] | undefined => {
  if (!/^([A-Z][a-z]*\d*){1,}$/.test(encoded)) {
    return
  }
  const REGEX = /([A-Z])([a-z]*)(\d*)/g
  const result: Cell[] = []
  for (const match of encoded.matchAll(REGEX)) {
    const type = match[1].charCodeAt(0) - UPPERCASE_A
    const params = (match[2] || 'a').split('').map((x) => x.charCodeAt(0) - LOWERCASE_A)
    let count = (match[3] as any - 0) || 1
    while (count--) {
      result.push([type, ...params])
    }
  }
  return result
}

export const toNumber = (x: string | boolean) => {
  return x as any - 0
}
