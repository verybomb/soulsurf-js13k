export const FRAMERATE = 120

export const GRAVITY = .1

export const MAP_EMPTY = 0
export const MAP_BLOCK = 1
export const MAP_SOUL_SPAWN = 2
export const MAP_PLAYER_SPAWN = 3
export const MAP_PICKUP = 4
export const MAP_DOOR = 5
export const MAP_LASER_TURRET = 6
export const MAP_GATE = 7
export const MAP_SWITCH = 8
export const MAP_HAZARD = 9

export const CHUNK_KEY_TYPE = 0

export const CHUNK_KEY_SWITCH_INDEX = 1
export const CHUNK_KEY_SWITCH_ACTIVE = 2
export const CHUNK_KEY_SWITCH_TIMER = 3

export const BLOCK_TYPE_NORMAL = 0
export const BLOCK_TYPE_SPRING = 1
// export const BLOCK_TYPE_PORTAL = 2
export const NUM_BLOCK_TYPES = 2

export const NUM_SWITCHES = 5

export const STAGE_INTRO = -1
export const STAGE_LEVEL_EDITOR = 0
export const STAGE_MENU = 1

export const JUMP_FRAME_THRESHOLD = 15

type Character = typeof defaultCharacter

const defaultCharacter = {
  jumps: 1,
  attackSpeed: 3,
  attackRange: 1,
  maxFallVelocity: 3,
  attackChargeSpeed: 1,
  jumpVelocity: 2,
  minWalkTime: 5,
}

const defineCharacter = (definition?: Partial<Character>) => ({ ...defaultCharacter, ...definition })

export const TYPE_KNIGHT = 0
export const TYPE_ARCHER = 1
export const TYPE_BUNNY = 2
export const TYPE_BIRD = 3
export const TYPE_ALIEN = 4
export const TYPE_PROTAGONIST = 5
export const TYPE_FUNGUS = 6
// export const TYPE_WIZARD = 5
export const NUM_ENTITY_TYPES = 7

export const CHARACTERS: Record<number, Character> = {
  [TYPE_KNIGHT]: defineCharacter(),
  [TYPE_ARCHER]: defineCharacter({
    attackSpeed: 4,
    attackRange: 120,
    minWalkTime: 3,
  }),
  [TYPE_BUNNY]: defineCharacter({
    jumps: 2,
    attackRange: 0,
    minWalkTime: 1,
  }),
  [TYPE_BIRD]: defineCharacter({
    attackRange: 0,
    jumps: 16,
    maxFallVelocity: .75,
    jumpVelocity: 2,
    minWalkTime: 1,
  }),
  [TYPE_ALIEN]: defineCharacter({
    attackRange: 0,
    jumps: 0,
  }),
  [TYPE_PROTAGONIST]: defineCharacter({ minWalkTime: 0, attackRange: 0 }),
  [TYPE_FUNGUS]: defineCharacter({ minWalkTime: 1e9, jumps: 0, jumpVelocity: 0, attackRange: 0 }),
  // [TYPE_WIZARD]: defineCharacter({
  //   attackRange: 60,
  //   attackSpeed: 2,
  // }),
}
