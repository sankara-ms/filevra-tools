import zlib from 'node:zlib'

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

export function encodePng(width, height, pixelAt) {
  const stride = width * 3 + 1
  const raw = Buffer.alloc(height * stride)
  for (let y = 0; y < height; y += 1) {
    const row = y * stride
    raw[row] = 0
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixelAt(x, y)
      const offset = row + 1 + x * 3
      raw[offset] = r
      raw[offset + 1] = g
      raw[offset + 2] = b
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function noisePng(width, height, seed = 42) {
  const random = mulberry32(seed)
  return encodePng(width, height, () => [
    Math.floor(random() * 256),
    Math.floor(random() * 256),
    Math.floor(random() * 256),
  ])
}

export function gradientPng(width, height, seed = 7) {
  const random = mulberry32(seed)
  return encodePng(width, height, (x, y) => {
    const jitter = () => Math.floor((random() - 0.5) * 14)
    const r = 40 + Math.round((x / width) * 180) + jitter()
    const g = 60 + Math.round((y / height) * 160) + jitter()
    const b = 120 + Math.round(((x + y) / (width + height)) * 110) + jitter()
    const clamp = (value) => Math.max(0, Math.min(255, value))
    return [clamp(r), clamp(g), clamp(b)]
  })
}
