import { createCanvas, encodeCanvas, loadImage, releaseCanvas } from '../../tools/canvas'
import { extensionOf, readError } from '../shared'

const MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
}

function outExt(format, fallback = 'jpg') {
  const value = String(format || '').toLowerCase()
  if (value === 'keep') {
    const ext = fallback === 'image/png' ? 'png' : fallback === 'image/webp' ? 'webp' : fallback === 'image/avif' ? 'avif' : 'jpg'
    return ext
  }
  return value === 'jpeg' ? 'jpg' : value || 'jpg'
}

function mimeOf(ext) {
  return MIME[ext] || 'image/jpeg'
}

function checkAbort(signal) {
  if (signal?.aborted) throw new DOMException('Processing cancelled.', 'AbortError')
}

function sanitizeBase(name) {
  return String(name || 'image')
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .slice(0, 80) || 'image'
}

async function drawNormalized(file, { background = '#ffffff', maxEdge = 0 } = {}) {
  const image = await loadImage(file)
  let width = image.naturalWidth || image.width || 1024
  let height = image.naturalHeight || image.height || 1024
  if (maxEdge > 0) {
    const ratio = Math.min(1, maxEdge / Math.max(width, height))
    width = Math.max(1, Math.round(width * ratio))
    height = Math.max(1, Math.round(height * ratio))
  }
  const { canvas, context } = createCanvas(width, height, background)
  context.drawImage(image, 0, 0, width, height)
  return { canvas, width, height }
}

async function encodeChecked(canvas, ext, quality) {
  const mime = mimeOf(ext)
  const blob = await encodeCanvas(canvas, mime, quality)
  if (blob.type && blob.type !== mime) {
    throw new Error(`This browser cannot create ${ext.toUpperCase()} files. Try PNG or JPG instead.`)
  }
  return blob
}

async function mapFiles(files, onProgress, signal, worker) {
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const result = await worker(file, index)
    if (Array.isArray(result)) outputs.push(...result)
    else if (result) outputs.push(result)
    onProgress?.((index + 1) / files.length)
  }
  return outputs
}

export async function convert({ files, options = {}, onProgress, signal }) {
  const format = options.format || 'png'
  const quality = Math.min(0.98, Math.max(0.35, Number(options.quality) || 0.9))
  const maxEdge = Math.max(0, Number(options.maxEdge) || 0)
  const ext = outExt(format)
  const background = ext === 'jpg' ? options.background || '#ffffff' : null

  const outputs = await mapFiles(files, onProgress, signal, async (file) => {
    const { canvas } = await drawNormalized(file, { background, maxEdge })
    const note = `${canvas.width} × ${canvas.height} ${ext.toUpperCase()}`
    const blob = await encodeChecked(canvas, ext, quality)
    releaseCanvas(canvas)
    return {
      name: `${sanitizeBase(file.name)}.${ext}`,
      blob,
      note,
    }
  })

  return { outputs, stats: [{ label: 'Files converted', value: String(outputs.length) }] }
}

export async function compress({ files, options = {}, onProgress, signal }) {
  const { compressImage } = await import('../../tools/imageCompressor')
  const targetKb = Number(options.targetKb) || 0
  const targetBytes = targetKb > 0 ? Math.round(targetKb * 1024) : null
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const result = await compressImage(file, {
      targetBytes,
      onProgress: (value) => onProgress?.((index + value) / files.length),
    })
    const blob = result.blob
    const ext = result.usedOriginal ? extensionOf(file.name) || 'jpg' : 'jpg'
    outputs.push({
      name: `${sanitizeBase(file.name)}-compressed.${ext}`,
      blob,
      note: `${Math.round(file.size / 1024)} KB → ${Math.round(blob.size / 1024)} KB${result.hitTarget === false ? ' · target not reached' : ''}`,
    })
  }
  onProgress?.(1)
  return { outputs, stats: [{ label: 'Images compressed', value: String(outputs.length) }] }
}

export async function resize({ files, options = {}, onProgress, signal }) {
  const mode = options.mode || 'max'
  const format = options.format || 'keep'
  const quality = Math.min(0.98, Math.max(0.35, Number(options.quality) || 0.9))
  const outputs = await mapFiles(files, onProgress, signal, async (file) => {
    const image = await loadImage(file)
    const sourceWidth = image.naturalWidth || image.width
    const sourceHeight = image.naturalHeight || image.height
    let width
    let height
    if (mode === 'percent') {
      const percent = Math.min(400, Math.max(1, Number(options.percent) || 100))
      width = Math.max(1, Math.round((sourceWidth * percent) / 100))
      height = Math.max(1, Math.round((sourceHeight * percent) / 100))
    } else if (mode === 'dimensions') {
      width = Math.max(1, Math.round(Number(options.width) || sourceWidth))
      height = Math.max(1, Math.round(Number(options.height) || sourceHeight))
    } else if (mode === 'width') {
      width = Math.max(1, Math.round(Number(options.width) || sourceWidth))
      height = Math.max(1, Math.round((sourceHeight * width) / sourceWidth))
    } else {
      const maxWidth = Math.max(1, Number(options.maxWidth) || 1600)
      const maxHeight = Math.max(1, Number(options.maxHeight) || 1600)
      const ratio = Math.min(1, maxWidth / sourceWidth, maxHeight / sourceHeight)
      width = Math.max(1, Math.round(sourceWidth * ratio))
      height = Math.max(1, Math.round(sourceHeight * ratio))
    }
    const ext = outExt(format, file.type)
    const { canvas, context } = createCanvas(width, height, ext === 'jpg' ? options.background || '#ffffff' : null)
    context.drawImage(image, 0, 0, width, height)
    const blob = await encodeChecked(canvas, ext, quality)
    releaseCanvas(canvas)
    return {
      name: `${sanitizeBase(file.name)}-${width}x${height}.${ext}`,
      blob,
      note: `${sourceWidth} × ${sourceHeight} → ${width} × ${height}`,
    }
  })
  return { outputs }
}

export async function crop({ files, options = {}, onProgress, signal }) {
  const format = options.format || 'keep'
  const quality = Math.min(0.98, Math.max(0.35, Number(options.quality) || 0.92))
  const outputs = await mapFiles(files, onProgress, signal, async (file) => {
    const image = await loadImage(file)
    const sourceWidth = image.naturalWidth || image.width
    const sourceHeight = image.naturalHeight || image.height
    const percentX = Math.min(95, Math.max(0, Number(options.x) || 0))
    const percentY = Math.min(95, Math.max(0, Number(options.y) || 0))
    const percentW = Math.min(100 - percentX, Math.max(1, Number(options.width) || 100))
    const percentH = Math.min(100 - percentY, Math.max(1, Number(options.height) || 100))
    const sx = Math.round((sourceWidth * percentX) / 100)
    const sy = Math.round((sourceHeight * percentY) / 100)
    const sw = Math.max(1, Math.round((sourceWidth * percentW) / 100))
    const sh = Math.max(1, Math.round((sourceHeight * percentH) / 100))
    const ext = outExt(format, file.type)
    const { canvas, context } = createCanvas(sw, sh, ext === 'jpg' ? '#ffffff' : null)
    context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)
    const blob = await encodeChecked(canvas, ext, quality)
    releaseCanvas(canvas)
    return { name: `${sanitizeBase(file.name)}-cropped.${ext}`, blob, note: `${sw} × ${sh}` }
  })
  return { outputs }
}

export async function rotate({ files, options = {}, onProgress, signal }) {
  const angle = ((Number(options.angle) || 90) % 360 + 360) % 360
  const flipH = Boolean(options.flipH)
  const flipV = Boolean(options.flipV)
  const format = options.format || 'keep'
  const outputs = await mapFiles(files, onProgress, signal, async (file) => {
    const image = await loadImage(file)
    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    const swap = angle === 90 || angle === 270
    const outWidth = swap ? height : width
    const outHeight = swap ? width : height
    const ext = outExt(format, file.type)
    const { canvas, context } = createCanvas(outWidth, outHeight, ext === 'jpg' ? '#ffffff' : null)
    context.translate(outWidth / 2, outHeight / 2)
    context.rotate((angle * Math.PI) / 180)
    context.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    context.drawImage(image, -width / 2, -height / 2, width, height)
    const blob = await encodeChecked(canvas, ext, 0.92)
    releaseCanvas(canvas)
    return { name: `${sanitizeBase(file.name)}-rotated.${ext}`, blob, note: `${outWidth} × ${outHeight}` }
  })
  return { outputs }
}

const POSITIONS = {
  'top-left': ['left', 'top'],
  'top-center': ['center', 'top'],
  'top-right': ['right', 'top'],
  'middle-left': ['left', 'middle'],
  center: ['center', 'middle'],
  'middle-right': ['right', 'middle'],
  'bottom-left': ['left', 'bottom'],
  'bottom-center': ['center', 'bottom'],
  'bottom-right': ['right', 'bottom'],
}

export async function watermark({ files, options = {}, onProgress, signal }) {
  const text = String(options.text || 'Filevra').slice(0, 80)
  if (!text.trim()) throw new Error('Enter the watermark text first.')
  const opacity = Math.min(1, Math.max(0.05, Number(options.opacity) || 0.3))
  const size = Math.min(400, Math.max(8, Number(options.size) || 42))
  const [alignX, alignY] = POSITIONS[options.position] || POSITIONS.center
  const color = options.color || '#ffffff'
  const diagonal = Boolean(options.diagonal)
  const outputs = await mapFiles(files, onProgress, signal, async (file) => {
    const image = await loadImage(file)
    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    const ext = outExt(options.format || 'keep', file.type)
    const { canvas, context } = createCanvas(width, height, ext === 'jpg' ? '#ffffff' : null)
    context.drawImage(image, 0, 0, width, height)
    const fontSize = Math.max(8, Math.round((size / 1000) * Math.max(width, height)))
    context.save()
    context.globalAlpha = opacity
    context.fillStyle = color
    context.strokeStyle = 'rgba(0,0,0,0.35)'
    context.lineWidth = Math.max(1, fontSize / 22)
    context.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`
    context.textBaseline = 'middle'
    context.textAlign = alignX === 'left' ? 'left' : alignX === 'right' ? 'right' : 'center'
    if (diagonal) {
      context.translate(width / 2, height / 2)
      context.rotate(-Math.PI / 4)
      context.textAlign = 'center'
      context.fillText(text, 0, 0)
      context.strokeText(text, 0, 0)
    } else {
      const margin = Math.round(fontSize * 0.8)
      const x = alignX === 'left' ? margin : alignX === 'right' ? width - margin : width / 2
      const y = alignY === 'top' ? margin : alignY === 'bottom' ? height - margin : height / 2
      context.fillText(text, x, y)
      context.strokeText(text, x, y)
    }
    context.restore()
    const blob = await encodeChecked(canvas, ext, 0.92)
    releaseCanvas(canvas)
    return { name: `${sanitizeBase(file.name)}-watermarked.${ext}`, blob, note: text }
  })
  return { outputs }
}

export async function thumbnail({ files, options = {}, onProgress, signal }) {
  const maxEdge = Math.min(1024, Math.max(32, Number(options.maxEdge) || 256))
  const ext = outExt(options.format || 'jpg')
  const outputs = await mapFiles(files, onProgress, signal, async (file) => {
    const { canvas } = await drawNormalized(file, { background: ext === 'jpg' ? '#ffffff' : null, maxEdge })
    const blob = await encodeChecked(canvas, ext, 0.88)
    const size = `${canvas.width} × ${canvas.height}`
    releaseCanvas(canvas)
    return { name: `${sanitizeBase(file.name)}-${maxEdge}.${ext}`, blob, note: size }
  })
  return { outputs }
}

function flatten(value, prefix = '') {
  const rows = []
  const walk = (item, path) => {
    if (item == null) return
    if (Array.isArray(item)) {
      if (item.every((entry) => typeof entry !== 'object')) {
        rows.push({ label: path, value: item.join(', ') })
        return
      }
      item.slice(0, 12).forEach((entry, index) => walk(entry, `${path}[${index}]`))
      return
    }
    if (typeof item === 'object') {
      const date = item instanceof Date
      if (date) {
        rows.push({ label: path, value: item.toISOString() })
        return
      }
      Object.entries(item).forEach(([key, entry]) => walk(entry, path ? `${path}.${key}` : key))
      return
    }
    if (typeof item === 'string' && item.length > 160) {
      rows.push({ label: path, value: `${item.slice(0, 157)}…` })
      return
    }
    rows.push({ label: path, value: String(item) })
  }
  walk(value, prefix)
  return rows
}

export async function metadata({ files, signal }) {
  const exifr = await import('exifr')
  const info = []
  for (const file of files) {
    checkAbort(signal)
    const image = await loadImage(file).catch(() => null)
    const rows = [
      { label: 'File', value: file.name },
      { label: 'Size', value: `${Math.round(file.size / 1024)} KB` },
      { label: 'Type', value: file.type || 'unknown' },
      {
        label: 'Pixels',
        value: image ? `${image.naturalWidth} × ${image.naturalHeight}` : 'not readable',
      },
    ]
    try {
      const parsed = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
        xmp: true,
        jfif: true,
        ihdr: true,
        mergeOutput: true,
      })
      if (parsed && Object.keys(parsed).length) {
        rows.push(...flatten(parsed).slice(0, 120))
      } else {
        rows.push({ label: 'Metadata', value: 'No EXIF, GPS or XMP metadata found.' })
      }
    } catch {
      rows.push({ label: 'Metadata', value: 'The metadata in this file could not be read.' })
    }
    info.push({ heading: file.name, rows })
  }
  return { info }
}

export async function strip({ files, onProgress, signal }) {
  const outputs = await mapFiles(files, onProgress, signal, async (file) => {
    const ext = outExt('keep', file.type)
    const { canvas } = await drawNormalized(file, { background: ext === 'jpg' ? '#ffffff' : null })
    const blob = await encodeChecked(canvas, ext, 0.94)
    const name = `${sanitizeBase(file.name)}-clean.${ext}`
    releaseCanvas(canvas)
    return { name, blob, note: 'Re-encoded without EXIF, GPS or XMP' }
  })
  return {
    outputs,
    warning: 'The image is re-encoded, so the result is a new file. Camera settings, GPS, copyright and editing history are removed.',
  }
}

export async function palette({ files, options = {}, signal }) {
  const count = Math.min(20, Math.max(3, Number(options.count) || 8))
  const results = []
  for (const file of files) {
    checkAbort(signal)
    const image = await loadImage(file)
    const { canvas, context } = createCanvas(96, 96, null)
    const ratio = Math.min(96 / image.naturalWidth, 96 / image.naturalHeight)
    const w = Math.max(1, Math.round(image.naturalWidth * ratio))
    const h = Math.max(1, Math.round(image.naturalHeight * ratio))
    context.drawImage(image, Math.floor((96 - w) / 2), Math.floor((96 - h) / 2), w, h)
    const data = context.getImageData(0, 0, 96, 96).data
    const buckets = new Map()
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] < 32) continue
      const r = data[index] >> 4
      const g = data[index + 1] >> 4
      const b = data[index + 2] >> 4
      const key = `${r}-${g}-${b}`
      const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 }
      bucket.r += data[index]
      bucket.g += data[index + 1]
      bucket.b += data[index + 2]
      bucket.n += 1
      buckets.set(key, bucket)
    }
    releaseCanvas(canvas)
    const colors = [...buckets.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, count)
      .map((bucket) => {
        const r = Math.round(bucket.r / bucket.n)
        const g = Math.round(bucket.g / bucket.n)
        const b = Math.round(bucket.b / bucket.n)
        const hex = `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`
        return { hex, count: bucket.n }
      })
    results.push({ file: file.name, colors })
  }
  const total = results.reduce((sum, item) => sum + item.colors.length, 0)
  const json = JSON.stringify(results, null, 2)
  return {
    palette: results,
    outputs: [
      {
        name: results.length === 1 ? `${sanitizeBase(files[0].name)}-palette.json` : 'filevra-palettes.json',
        blob: new Blob([json], { type: 'application/json' }),
        note: `${total} colours`,
      },
    ],
  }
}

export async function background({ files, options = {}, onProgress, signal }) {
  const replacement = options.color || '#ffffff'
  const tolerance = Math.min(160, Math.max(0, Number(options.tolerance) || 32))
  const hexToRgb = (hex) => {
    const value = String(hex).replace('#', '')
    const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
  }
  const [rr, rg, rb] = hexToRgb(replacement)
  const outputs = await mapFiles(files, onProgress, signal, async (file) => {
    const { canvas, context } = await drawNormalized(file, { background: null })
    const { width, height } = canvas
    const imageData = context.getImageData(0, 0, width, height)
    const data = imageData.data
    const visited = new Uint8Array(width * height)
    const seeds = [0, width - 1, (height - 1) * width, height * width - 1]
    const stack = []
    const isEdgeColor = (index) => {
      const offset = index * 4
      const r = data[offset]
      const g = data[offset + 1]
      const b = data[offset + 2]
      return { r, g, b }
    }
    // Use the first corner colour as the background reference.
    const reference = isEdgeColor(seeds[0])
    const closeToReference = (index) => {
      const offset = index * 4
      const dr = data[offset] - reference.r
      const dg = data[offset + 1] - reference.g
      const db = data[offset + 2] - reference.b
      return Math.sqrt(dr * dr + dg * dg + db * db) <= tolerance
    }
    seeds.forEach((seed) => {
      if (!visited[seed] && closeToReference(seed)) stack.push(seed)
    })
    while (stack.length) {
      const index = stack.pop()
      if (visited[index]) continue
      visited[index] = 1
      if (!closeToReference(index)) continue
      const x = index % width
      const y = (index - x) / width
      const offset = index * 4
      data[offset] = rr
      data[offset + 1] = rg
      data[offset + 2] = rb
      data[offset + 3] = 255
      if (x > 0) stack.push(index - 1)
      if (x < width - 1) stack.push(index + 1)
      if (y > 0) stack.push(index - width)
      if (y < height - 1) stack.push(index + width)
    }
    context.putImageData(imageData, 0, 0)
    const ext = outExt(options.format || 'png')
    const blob = await encodeChecked(canvas, ext, 0.94)
    releaseCanvas(canvas)
    return { name: `${sanitizeBase(file.name)}-background.${ext}`, blob, note: `Corner colour → ${replacement}` }
  })
  return {
    outputs,
    warning: 'This fills the area connected to the four corners that is close to the corner colour. Photos with uneven lighting may need a higher tolerance.',
  }
}

function smallDataUrl(canvas) {
  return canvas.toDataURL('image/jpeg', 0.7)
}

export async function compare({ files, signal }) {
  if (files.length !== 2) throw new Error('Choose exactly two images to compare.')
  const previews = []
  const info = []
  let pixelsDiff = null
  const smalls = []
  for (const file of files) {
    checkAbort(signal)
    const image = await loadImage(file)
    const ratio = Math.min(1, 360 / Math.max(image.naturalWidth, image.naturalHeight))
    const { canvas, context } = createCanvas(
      Math.max(1, Math.round(image.naturalWidth * ratio)),
      Math.max(1, Math.round(image.naturalHeight * ratio)),
      '#ffffff',
    )
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    previews.push({ name: file.name, src: smallDataUrl(canvas), width: image.naturalWidth, height: image.naturalHeight })
    info.push({
      heading: file.name,
      rows: [
        { label: 'Pixels', value: `${image.naturalWidth} × ${image.naturalHeight}` },
        { label: 'Size', value: `${Math.round(file.size / 1024)} KB` },
        { label: 'Type', value: file.type || 'unknown' },
        { label: 'Aspect', value: (image.naturalWidth / image.naturalHeight).toFixed(3) },
      ],
    })
    smalls.push({ canvas, data: context.getImageData(0, 0, canvas.width, canvas.height).data })
  }
  if (smalls[0].canvas.width === smalls[1].canvas.width && smalls[0].canvas.height === smalls[1].canvas.height) {
    const a = smalls[0].data
    const b = smalls[1].data
    let changed = 0
    const pixels = a.length / 4
    for (let index = 0; index < a.length; index += 4) {
      if (Math.abs(a[index] - b[index]) + Math.abs(a[index + 1] - b[index + 1]) + Math.abs(a[index + 2] - b[index + 2]) > 30) {
        changed += 1
      }
    }
    pixelsDiff = Math.round((changed / pixels) * 1000) / 10
  }
  smalls.forEach(({ canvas }) => releaseCanvas(canvas))
  return {
    previews,
    info,
    stats:
      pixelsDiff == null
        ? [{ label: 'Same size', value: 'No' }]
        : [{ label: 'Pixels changed', value: `${pixelsDiff}%` }],
    warning: pixelsDiff == null ? 'The images have different pixel dimensions, so a pixel difference percentage is not shown.' : undefined,
  }
}

export async function dimensions({ files, signal }) {
  const info = []
  for (const file of files) {
    checkAbort(signal)
    const image = await loadImage(file).catch(() => null)
    info.push({
      heading: file.name,
      rows: image
        ? [
            { label: 'Width', value: `${image.naturalWidth} px` },
            { label: 'Height', value: `${image.naturalHeight} px` },
            { label: 'Megapixels', value: ((image.naturalWidth * image.naturalHeight) / 1e6).toFixed(2) },
            { label: 'Aspect ratio', value: (image.naturalWidth / image.naturalHeight).toFixed(3) },
            { label: 'File size', value: `${Math.round(file.size / 1024)} KB` },
            { label: 'File type', value: file.type || 'unknown' },
          ]
        : [{ label: 'Error', value: readError(new Error('The dimensions could not be read.')) }],
    })
  }
  return { info }
}

export async function toIco({ files, options = {}, onProgress, signal }) {
  const size = Math.min(256, Math.max(16, Number(options.size) || 64))
  const outputs = await mapFiles(files, onProgress, signal, async (file) => {
    const image = await loadImage(file)
    const canvasSize = Math.min(size, Math.max(1, Math.min(image.naturalWidth, image.naturalHeight)))
    const { canvas, context } = createCanvas(canvasSize, canvasSize, null)
    const ratio = Math.min(canvasSize / image.naturalWidth, canvasSize / image.naturalHeight)
    const drawWidth = Math.max(1, Math.round(image.naturalWidth * ratio))
    const drawHeight = Math.max(1, Math.round(image.naturalHeight * ratio))
    context.drawImage(image, Math.floor((canvasSize - drawWidth) / 2), Math.floor((canvasSize - drawHeight) / 2), drawWidth, drawHeight)
    const pngBlob = await encodeChecked(canvas, 'png', 1)
    releaseCanvas(canvas)
    const png = new Uint8Array(await pngBlob.arrayBuffer())
    const header = new Uint8Array(22)
    const view = new DataView(header.buffer)
    view.setUint16(0, 0, true)
    view.setUint16(2, 1, true)
    view.setUint16(4, 1, true)
    view.setUint8(6, canvasSize >= 256 ? 0 : canvasSize)
    view.setUint8(7, canvasSize >= 256 ? 0 : canvasSize)
    view.setUint8(8, 0)
    view.setUint8(9, 0)
    view.setUint16(10, 1, true)
    view.setUint16(12, 32, true)
    view.setUint32(14, png.length, true)
    view.setUint32(18, 22, true)
    const ico = new Uint8Array(22 + png.length)
    ico.set(header, 0)
    ico.set(png, 22)
    return {
      name: `${sanitizeBase(file.name)}.ico`,
      blob: new Blob([ico], { type: 'image/x-icon' }),
      note: `${canvasSize} × ${canvasSize} icon`,
    }
  })
  return { outputs }
}

export default {
  convert,
  compress,
  resize,
  crop,
  rotate,
  watermark,
  thumbnail,
  metadata,
  strip,
  palette,
  background,
  compare,
  dimensions,
  toIco,
}
