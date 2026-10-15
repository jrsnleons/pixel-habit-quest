// Renders the default companion into PNG app icons (no image dependencies).
// Run with: node --experimental-strip-types scripts/make-icons.mjs
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { buildSprite } from '../src/pet/sprites.ts'

const BG = [0xfb, 0xe4, 0xd5]

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y)
      const o = y * (size * 3 + 1) + 1 + x * 3
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

const grid = buildSprite({ species: 'cat', color: 'lavender', accessory: 'bow', face: 'happy' })
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

for (const [name, size, pad] of [['icon-192.png', 192, 0.18], ['icon-512.png', 512, 0.18], ['maskable-512.png', 512, 0.26], ['apple-touch-icon.png', 180, 0.16]]) {
  const inner = size * (1 - pad * 2)
  const scale = Math.floor(inner / 18)
  const ox = Math.floor((size - 16 * scale) / 2)
  const oy = Math.floor((size - 18 * scale) / 2)
  const buf = png(size, (x, y) => {
    const gx = Math.floor((x - ox) / scale)
    const gy = Math.floor((y - oy) / scale)
    const c = gx >= 0 && gx < 16 && gy >= 0 && gy < 18 ? grid[gy][gx] : null
    return c ? hex(c) : BG
  })
  writeFileSync(`public/${name}`, buf)
}
console.log('icons written')
