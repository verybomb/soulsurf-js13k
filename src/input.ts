const keys: Record<string, number> = {}
let kp: Record<string, number> = {}

export const getKey = (k: string, valid = true) => valid && keys[k] || 0
export const getKeyPressed = (k: string, valid = true) => valid && kp[k] || 0

const lowerCase = (x: string) => x.toLowerCase()

export const eventListeners = () => {
  addEventListener('keydown', (e) => {
    if (!e.repeat) {
      keys[lowerCase(e.key)] = 1
      kp[lowerCase(e.key)] = 1
    }
  })
  addEventListener('keyup', (e) => {
    keys[lowerCase(e.key)] = 0
  })
}

export const updateKeyPress = () => {
  kp = {}
}

export const getKeySet = () => {
  // return 'adwsfq'
  return ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'x']
}
