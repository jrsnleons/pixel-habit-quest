import type { Accessory, Species } from '../lib/types'

// Hand-drawn 16×16 sprites. Each character is one pixel:
//   O outline · B body · L light belly · P inner ear · . transparent
// Faces and accessories are painted on top, so every species shares the same
// face anchor (rows 6–10, columns 3–12) and gets every mood for free.

const HEAD_ROWS = [
  'OBBBBBBBBBBBBBBO', // 6
  'OBBBBBBBBBBBBBBO',
  'OBBBBBBBBBBBBBBO',
  'OBBBBBBBBBBBBBBO',
  '.OBBBBBBBBBBBBO.', // 10
  '..OOBBBBBBBBOO..',
  '..OBBLLLLLLBBO..',
  '.OBBLLLLLLLLBBO.',
  '.OBBLLLLLLLLBBO.',
  '..OOOOOOOOOOOO..', // 15
]

interface SpeciesDef {
  label: string
  rows: string[]
  /** Row where the top of the head starts; accessories anchor to it. */
  headTop: number
}

export const SPECIES: Record<Species, SpeciesDef> = {
  cat: {
    label: 'Cat',
    headTop: 3,
    rows: [
      '................',
      '..O..........O..',
      '.OPO........OPO.',
      '.OPBOOOOOOOOBPO.',
      '.OBBBBBBBBBBBBO.',
      'OBBBBBBBBBBBBBBO',
      ...HEAD_ROWS,
    ],
  },
  bunny: {
    label: 'Bunny',
    headTop: 4,
    rows: [
      '...OO......OO...',
      '..OPBO....OBPO..',
      '..OPBO....OBPO..',
      '..OPBO....OBPO..',
      '.OBBBOOOOOOBBBO.',
      'OBBBBBBBBBBBBBBO',
      ...HEAD_ROWS,
    ],
  },
  bear: {
    label: 'Bear',
    headTop: 4,
    rows: [
      '................',
      '................',
      '.OOO........OOO.',
      'OBPBO......OBPBO',
      'OBBBOOOOOOOOBBBO',
      '.OBBBBBBBBBBBBO.',
      ...HEAD_ROWS,
    ],
  },
  slime: {
    label: 'Slime',
    headTop: 2,
    rows: [
      '................',
      '................',
      '.......OO.......',
      '......OLBO......',
      '.....OLBBBO.....',
      '...OOBBBBBBOO...',
      '..OBBBBBBBBBBO..',
      '.OBBBBBBBBBBBBO.',
      'OBBBBBBBBBBBBBBO',
      'OBBBBBBBBBBBBBBO',
      'OBBBBBBBBBBBBBBO',
      'OBBBBBBBBBBBBBBO',
      'OBBBBBBBBBBBBBBO',
      '.OBBBBBBBBBBBBO.',
      '..OBBBBBBBBBBO..',
      '...OOOOOOOOOO...',
    ],
  },
}

export type Face = 'happy' | 'normal' | 'tired' | 'sad' | 'blink' | 'hurt'

// 10 columns (sprite columns 3–12) × 5 rows (sprite rows 6–10).
//   E eye · W eye shine · C cheek · M mouth · T tear · . keep body
export const FACES: Record<Face, string[]> = {
  normal: ['.WE....WE.', '.EE....EE.', 'C........C', '....MM....', '..........'],
  happy: ['..E....E..', '.E.E..E.E.', 'C........C', '...M..M...', '....MM....'],
  tired: ['..........', '.EE....EE.', '..........', '....MM....', '..........'],
  blink: ['..........', '.EE....EE.', 'C........C', '....MM....', '..........'],
  sad: ['.WE....WE.', '.EE....EE.', '.T........', '....MM....', '...M..M...'],
  hurt: ['.E......E.', '..E....E..', '.E......E.', '....MM....', '..........'],
}

export const COLORS: Record<string, { label: string; B: string; L: string; O: string; P: string }> = {
  lavender: { label: 'Lavender', B: '#b9a3e3', L: '#e7ddf8', O: '#4b3a6b', P: '#f4a7c0' },
  peach: { label: 'Peach', B: '#f7b58f', L: '#fde2d0', O: '#6b3b2a', P: '#f48fa0' },
  mint: { label: 'Mint', B: '#9fdcc0', L: '#ddf5ea', O: '#2e5b4a', P: '#f4a7c0' },
  cream: { label: 'Cream', B: '#f3e3c3', L: '#fff8ea', O: '#6b5636', P: '#f4a7a7' },
  sky: { label: 'Sky', B: '#9cc7f0', L: '#ddecfb', O: '#2f4a6b', P: '#f4a7c0' },
  pink: { label: 'Pink', B: '#f5a9c6', L: '#fde0ec', O: '#6b2f47', P: '#e86f9a' },
  gray: { label: 'Storm', B: '#b6b3bd', L: '#e8e6ec', O: '#3d3a45', P: '#f4a7c0' },
  choco: { label: 'Cocoa', B: '#a0735a', L: '#dcbca4', O: '#3b2418', P: '#e89a8a' },
}

const FACE_COLORS: Record<string, string> = {
  E: '#2b2238',
  W: '#ffffff',
  M: '#2b2238',
  C: '#f48fb1',
  T: '#6ec1ff',
}

const ACCENT: Record<string, string> = {
  R: '#e8566f', // bow
  K: '#a8324a',
  G: '#5fbf6a', // leaf
  S: '#3f8f4a', // stem
  F: '#ffffff', // flower petal
  Y: '#ffd34d', // flower centre / crown
  J: '#e8566f', // crown jewel
  X: '#e8566f', // scarf
  Z: '#ffd34d', // scarf stripe
}

type Pixel = [x: number, y: number, ch: string]

function accessoryPixels(acc: Accessory, top: number): Pixel[] {
  switch (acc) {
    case 'bow':
      return [
        [10, top + 1, 'R'], [12, top + 1, 'R'],
        [10, top + 2, 'R'], [11, top + 2, 'K'], [12, top + 2, 'R'],
      ]
    case 'sprout':
      return [[6, top - 2, 'G'], [7, top - 2, 'G'], [9, top - 2, 'G'], [10, top - 2, 'G'], [8, top - 1, 'S'], [8, top - 2, 'S']]
    case 'flower':
      return [[3, top + 1, 'F'], [2, top + 2, 'F'], [3, top + 2, 'Y'], [4, top + 2, 'F'], [3, top + 3, 'F']]
    case 'scarf': {
      const px: Pixel[] = []
      for (let x = 3; x <= 12; x++) px.push([x, 11, x % 3 === 0 ? 'Z' : 'X'])
      px.push([10, 12, 'X'], [11, 12, 'X'], [10, 13, 'Z'], [11, 13, 'X'])
      return px
    }
    default:
      return []
  }
}

function crownPixels(top: number): Pixel[] {
  const t = top - 3
  return [
    [5, t, 'Y'], [7, t, 'Y'], [8, t, 'Y'], [10, t, 'Y'],
    [5, t + 1, 'Y'], [6, t + 1, 'Y'], [7, t + 1, 'J'], [8, t + 1, 'J'], [9, t + 1, 'Y'], [10, t + 1, 'Y'],
    [5, t + 2, 'Y'], [6, t + 2, 'Y'], [7, t + 2, 'Y'], [8, t + 2, 'Y'], [9, t + 2, 'Y'], [10, t + 2, 'Y'],
  ]
}

export const CANVAS_W = 16
export const CANVAS_H = 18
/** Sprite rows are drawn this many rows down so a crown fits above any head. */
const OFFSET = 2

export interface SpriteOptions {
  species: Species
  color: string
  accessory: Accessory
  face: Face
  crown?: boolean
}

/** A grid of hex colours (or null) ready to draw. */
export function buildSprite(opts: SpriteOptions): (string | null)[][] {
  const def = SPECIES[opts.species] ?? SPECIES.cat
  const pal = COLORS[opts.color] ?? COLORS.lavender
  const grid: (string | null)[][] = Array.from({ length: CANVAS_H }, () => Array(CANVAS_W).fill(null))
  const put = (x: number, y: number, c: string) => {
    const yy = y + OFFSET
    if (x >= 0 && x < CANVAS_W && yy >= 0 && yy < CANVAS_H) grid[yy][x] = c
  }
  def.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== '.') put(x, y, pal[ch as 'B' | 'L' | 'O' | 'P'])
    }),
  )
  FACES[opts.face].forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      if (ch === '.') return
      put(3 + dx, 6 + dy, ch === 'C' ? pal.P : FACE_COLORS[ch])
    }),
  )
  const acc = opts.crown && opts.accessory === 'sprout' ? 'none' : opts.accessory
  for (const [x, y, ch] of accessoryPixels(acc, def.headTop)) put(x, y, ACCENT[ch])
  if (opts.crown) for (const [x, y, ch] of crownPixels(def.headTop)) put(x, y, ACCENT[ch])
  return grid
}

export const ACCESSORIES: { id: Accessory; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'bow', label: 'Bow' },
  { id: 'sprout', label: 'Sprout' },
  { id: 'flower', label: 'Flower' },
  { id: 'scarf', label: 'Scarf' },
]
