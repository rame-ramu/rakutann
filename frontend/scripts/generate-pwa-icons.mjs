import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const outputDirectory = resolve(scriptDirectory, '../public/icons')

const colors = {
  black: [17, 24, 39, 255],
  green: [0, 166, 166, 255],
  white: [255, 253, 244, 255],
  yellow: [255, 244, 74, 255],
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

const crc32 = (buffer) => {
  let crc = 0xffffffff
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

const pngChunk = (type, data = Buffer.alloc(0)) => {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  const checksum = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, checksum])
}

const encodePng = (width, height, pixels) => {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6

  const stride = width * 4 + 1
  const scanlines = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y += 1) {
    const scanlineStart = y * stride
    scanlines[scanlineStart] = 0
    pixels.copy(scanlines, scanlineStart + 1, y * width * 4, (y + 1) * width * 4)
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND'),
  ])
}

const createIcon = (size) => {
  const pixels = Buffer.alloc(size * size * 4)

  const setPixel = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const offset = (y * size + x) * 4
    pixels[offset] = color[0]
    pixels[offset + 1] = color[1]
    pixels[offset + 2] = color[2]
    pixels[offset + 3] = color[3]
  }

  const fill = (color) => {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) setPixel(x, y, color)
    }
  }

  const roundedRectangle = (left, top, width, height, radius, color) => {
    const right = left + width
    const bottom = top + height
    const startX = Math.max(0, Math.floor(left))
    const endX = Math.min(size, Math.ceil(right))
    const startY = Math.max(0, Math.floor(top))
    const endY = Math.min(size, Math.ceil(bottom))

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const centerX = x + 0.5
        const centerY = y + 0.5
        const nearestX = Math.max(left + radius, Math.min(centerX, right - radius))
        const nearestY = Math.max(top + radius, Math.min(centerY, bottom - radius))
        const distance = Math.hypot(centerX - nearestX, centerY - nearestY)
        if (distance <= radius) setPixel(x, y, color)
      }
    }
  }

  const rectangle = (left, top, width, height, color) => {
    for (let y = Math.floor(top); y < Math.ceil(top + height); y += 1) {
      for (let x = Math.floor(left); x < Math.ceil(left + width); x += 1) setPixel(x, y, color)
    }
  }

  const line = (x1, y1, x2, y2, width, color) => {
    const minX = Math.floor(Math.min(x1, x2) - width)
    const maxX = Math.ceil(Math.max(x1, x2) + width)
    const minY = Math.floor(Math.min(y1, y2) - width)
    const maxY = Math.ceil(Math.max(y1, y2) + width)
    const dx = x2 - x1
    const dy = y2 - y1
    const lengthSquared = dx * dx + dy * dy

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const projection = Math.max(
          0,
          Math.min(1, ((x + 0.5 - x1) * dx + (y + 0.5 - y1) * dy) / lengthSquared),
        )
        const projectedX = x1 + projection * dx
        const projectedY = y1 + projection * dy
        if (Math.hypot(x + 0.5 - projectedX, y + 0.5 - projectedY) <= width / 2) {
          setPixel(x, y, color)
        }
      }
    }
  }

  const scale = (value) => value * size

  fill(colors.yellow)

  roundedRectangle(scale(0.205), scale(0.155), scale(0.64), scale(0.72), scale(0.09), colors.black)
  roundedRectangle(scale(0.155), scale(0.105), scale(0.64), scale(0.72), scale(0.09), colors.black)
  roundedRectangle(scale(0.185), scale(0.135), scale(0.58), scale(0.66), scale(0.06), colors.white)
  roundedRectangle(scale(0.185), scale(0.135), scale(0.58), scale(0.2), scale(0.06), colors.green)
  rectangle(scale(0.185), scale(0.25), scale(0.58), scale(0.1), colors.green)

  roundedRectangle(
    scale(0.255),
    scale(0.075),
    scale(0.075),
    scale(0.18),
    scale(0.035),
    colors.black,
  )
  roundedRectangle(scale(0.62), scale(0.075), scale(0.075), scale(0.18), scale(0.035), colors.black)

  for (const x of [0.335, 0.475, 0.615]) {
    line(scale(x), scale(0.39), scale(x), scale(0.73), scale(0.018), colors.black)
  }
  for (const y of [0.39, 0.505, 0.62, 0.735]) {
    line(scale(0.22), scale(y), scale(0.73), scale(y), scale(0.018), colors.black)
  }

  line(scale(0.395), scale(0.59), scale(0.47), scale(0.665), scale(0.055), colors.green)
  line(scale(0.47), scale(0.665), scale(0.615), scale(0.47), scale(0.055), colors.green)

  roundedRectangle(scale(0.815), scale(0.22), scale(0.055), scale(0.2), scale(0.025), colors.black)
  roundedRectangle(
    scale(0.815),
    scale(0.455),
    scale(0.055),
    scale(0.055),
    scale(0.027),
    colors.black,
  )

  return encodePng(size, size, pixels)
}

mkdirSync(outputDirectory, { recursive: true })

for (const [filename, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(resolve(outputDirectory, filename), createIcon(size))
}

console.log('PWA icons generated in public/icons')
