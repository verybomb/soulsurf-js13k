import zzfx from './zzfx'

export const SND_DIE = [1.25,, 145, .03, .04, .14,, 2.32, -1.2, .5,,,, .6,, .4,, .5]
export const SND_JUMP = [1.01,, 319, .04, .02, .06,, 1.51, 18,, 100, 20,,,,,, .73, .01]
export const SND_ATTACK = [2.07,, 285, .02, .01, .09, 4, .2,,,,,, 1,, .1,, .59, .01, .22]
export const SND_PICKUP = [1.99,, 1290,, .01, .14,, 1.26,, .3, -54, .09,,,, .1, .08, .42, .02]
export const SND_PICKUP2 = [2.16,, 238, .01, .08, .19, 1, 1.66,,, 200, .02, .11,,, .1, .09, .47, .04]
export const SND_LAND = [,, 800, .02, .01, .01, 1, .34,, -1.1, 68, .1,,, -14,,,, .01]
export const SND_STEP = [,, 1394, .01,, .02,, 1.47,,, 983, .07,,, 18,,, .29, .02]
export const SND_HIT = [4.64,, 900,,, .5, 2, .1, .2,,,, .08, 10,, .34, .05, .32, .1, .5]
export const SND_CHARGE = [1.87,, 1, .02, .04, .12,, .21, -5.9,,,,, .8,, .1, .01, .62, .01]
export const SND_COPY = [1.03,, 1446, .01, .05, .13, 2, .11,,, -276, .03,,,, .1,, .67, .03, .11]
export const SND_PLACEBLOCK = [1.09,, 150, .02, .06, .04,, 2.41, -5.8,,,,, 1,, .1,, .47, .02]
export const SND_SOUL_OCCUPY = [,, 200,, .08, .18,, .31, -7.7,, 150, .01,,,,,, .96, .01]
export const SND_BUMP = [,, 338, .01, .07, .05, 1, .48, -9.5, -5.5,,,, 2.2,,,, .46, .01]
export const SND_BOUNCE = [,,162,.01,.05,.09,,1.9,-6.6,,,,,.8,,,,.43,.05]
export const SND_BLIP = [,, 3000, .01,, .02,, 1.47,,, 983, .07,,, 18,,, .29, .02]
export const SND_CLICK = [2.01,,1152,.02,.01,.01,4,2.37,,-2.3,,,.11,,-9.2,,.32,.6]
export const SND_GRAVITY_FLIP = [,,179,.02,.04,.09,1,1.03,4.5,4.2,,,,,8,,,.82,.06]
export const SND_LIGHTNING = [1.02,,419,.04,.03,.45,4,.67,,.4,,,,1.7,,.7,,.48,.02,.03]

// ugly solution to prevent same sound from being played multiple times (causes lag)
const lastPlay: Record<string, number> = {}

export const sound = (s: (number|undefined)[]) => {
  const n = Date.now()
  const id = s[2] || 0
  if (!lastPlay[id] || n > lastPlay[id] + 10) {
    lastPlay[id] = n
    zzfx(...s)
  }
}
