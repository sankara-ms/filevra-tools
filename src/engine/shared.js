import { replaceExtension, stripExtension } from '../utils/format'

export const MAX_IMAGE_BYTES = 30 * 1024 * 1024
export const MAX_PDF_BYTES = 50 * 1024 * 1024
export const MAX_ANY_BYTES = 100 * 1024 * 1024

const EXT_MIME = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  xml: 'application/xml',
  html: 'text/html',
  htm: 'text/html',
  md: 'text/markdown',
  markdown: 'text/markdown',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  zip: 'application/zip',
  rtf: 'application/rtf',
  odt: 'application/vnd.oasis.opendocument.text',
}

export function extensionOf(name = '') {
  const dot = String(name).lastIndexOf('.')
  return dot > 0 ? String(name).slice(dot + 1).toLowerCase() : ''
}

export function mimeForExtension(ext) {
  return EXT_MIME[String(ext || '').toLowerCase()] || 'application/octet-stream'
}

export function outputName(inputName, nextExtension, suffix = '') {
  const base = stripExtension(inputName || 'file')
  return `${base}${suffix}.${String(nextExtension).replace(/^\./, '')}`
}

export function uniqueName(name, used) {
  if (!used.has(name)) {
    used.add(name)
    return name
  }
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let index = 2
  let candidate = `${base}-${index}${ext}`
  while (used.has(candidate)) {
    index += 1
    candidate = `${base}-${index}${ext}`
  }
  used.add(candidate)
  return candidate
}

function startsWith(bytes, pattern, offset = 0) {
  return pattern.every((byte, index) => bytes[offset + index] === byte)
}

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.slice(start, start + length))
}

export function kindFromName(name = '', mime = '') {
  const ext = extensionOf(name)
  if (['pdf'].includes(ext) || mime === 'application/pdf') return 'pdf'
  if (['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp', 'svg', 'ico', 'tif', 'tiff', 'heic', 'heif'].includes(ext)) return 'image'
  if (['docx', 'doc', 'rtf', 'odt'].includes(ext)) return 'document'
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet'
  if (['pptx', 'ppt'].includes(ext)) return 'presentation'
  if (['txt', 'md', 'markdown', 'html', 'htm', 'json', 'xml', 'css', 'js'].includes(ext)) return 'text'
  if (['zip'].includes(ext)) return 'archive'
  return 'unknown'
}

export async function detectFile(file) {
  const head = new Uint8Array(await file.slice(0, 64).arrayBuffer())
  if (startsWith(head, [0x25, 0x50, 0x44, 0x46])) return { kind: 'pdf', label: 'PDF', ext: 'pdf' }
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47])) return { kind: 'image', label: 'PNG image', ext: 'png' }
  if (startsWith(head, [0xff, 0xd8, 0xff])) return { kind: 'image', label: 'JPEG image', ext: 'jpg' }
  if (ascii(head, 0, 4) === 'GIF8') return { kind: 'image', label: 'GIF image', ext: 'gif' }
  if (ascii(head, 0, 2) === 'BM') return { kind: 'image', label: 'BMP image', ext: 'bmp' }
  if (startsWith(head, [0x00, 0x00, 0x01, 0x00])) return { kind: 'image', label: 'ICO image', ext: 'ico' }
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 4) === 'WEBP') return { kind: 'image', label: 'WebP image', ext: 'webp' }
  if (ascii(head, 4, 4) === 'ftyp') {
    const brand = ascii(head, 8, 4)
    if (brand.startsWith('avif')) return { kind: 'image', label: 'AVIF image', ext: 'avif' }
    if (/^(heic|heix|hevc|mif1|msf1)$/.test(brand)) return { kind: 'image', label: 'HEIC image', ext: 'heic' }
  }
  if (startsWith(head, [0x49, 0x49, 0x2a, 0x00]) || startsWith(head, [0x4d, 0x4d, 0x00, 0x2a])) {
    return { kind: 'image', label: 'TIFF image', ext: 'tiff' }
  }
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04])) {
    const byName = kindFromName(file.name, file.type)
    if (byName === 'document' || byName === 'spreadsheet' || byName === 'presentation') {
      return { kind: byName, label: byName === 'document' ? 'Word document' : byName === 'spreadsheet' ? 'Spreadsheet' : 'Presentation', ext: extensionOf(file.name) }
    }
    return { kind: 'archive', label: 'ZIP archive', ext: 'zip' }
  }
  const textHead = new TextDecoder().decode(head).trim().toLowerCase()
  if (textHead.startsWith('<svg') || (textHead.startsWith('<?xml') && textHead.includes('<svg'))) {
    return { kind: 'image', label: 'SVG image', ext: 'svg' }
  }
  const named = kindFromName(file.name, file.type)
  return { kind: named, label: named === 'unknown' ? 'Unknown file' : `${named} file`, ext: extensionOf(file.name) }
}

export function acceptsKind(file, kinds = []) {
  if (!kinds.length) return true
  const kind = kindFromName(file.name, file.type)
  return kinds.includes(kind) || (kinds.includes('image') && kind === 'image')
}

export function validateFile(file, { kinds = [], maxBytes = MAX_ANY_BYTES } = {}) {
  if (!file) return 'Choose a file to continue.'
  if (file.size === 0) return `"${file.name}" is empty.`
  if (file.size > maxBytes) {
    return `"${file.name}" is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`
  }
  if (kinds.length) {
    const kind = kindFromName(file.name, file.type)
    const mimeOk = kind === 'unknown' ? false : true
    if (!mimeOk || !acceptsKind(file, kinds)) {
      const labels = kinds.map((item) => (item === 'image' ? 'an image' : `a ${item}`)).join(' or ')
      return `"${file.name}" is not ${labels}.`
    }
  }
  return null
}

export function validateSignature(file, detected, kinds = []) {
  if (!kinds.length) return null
  if (kinds.includes('image') && detected.kind !== 'image' && !/^image\//.test(file.type)) {
    return `"${file.name}" does not look like a real image file. If it was renamed, save it again in its original format.`
  }
  if (kinds.includes('pdf') && detected.kind !== 'pdf') {
    return `"${file.name}" does not look like a real PDF. Damaged or renamed files can fail this check.`
  }
  return null
}

export function sanitizeFilename(name, fallback = 'file') {
  const cleaned = String(name || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\p{Cc}/gu, '_')
    .replace(/^\.+/, '')
    .slice(0, 120)
  return cleaned || fallback
}

export function parsePageList(input, pageCount) {
  const text = String(input || '').replace(/\s+/g, '')
  if (!text) throw new Error('Enter the pages you want, for example 1-3,5.')
  const pages = []
  for (const part of text.split(',')) {
    if (!part) continue
    const range = part.match(/^(\d+)-(\d+)$/)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      if (start < 1 || end < 1 || start > end) throw new Error(`"${part}" is not a valid page range.`)
      if (end > pageCount) throw new Error(`The range "${part}" goes past the last page (${pageCount}).`)
      for (let page = start; page <= end; page += 1) pages.push(page)
    } else if (/^\d+$/.test(part)) {
      const page = Number(part)
      if (page < 1 || page > pageCount) throw new Error(`Page ${page} does not exist. This document has ${pageCount} pages.`)
      pages.push(page)
    } else {
      throw new Error(`"${part}" is not a page number or range.`)
    }
  }
  if (!pages.length) throw new Error('Enter at least one page.')
  return pages
}

export function parseRanges(input, pageCount) {
  const text = String(input || '').replace(/\s+/g, '')
  if (!text) throw new Error('Enter page ranges, for example 1-3,4-6.')
  return text.split(',').filter(Boolean).map((part) => {
    const range = part.match(/^(\d+)-(\d+)$/)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      if (start < 1 || end < start || end > pageCount) {
        throw new Error(`"${part}" is not a valid range for a ${pageCount}-page document.`)
      }
      return { start, end }
    }
    if (/^\d+$/.test(part)) {
      const page = Number(part)
      if (page < 1 || page > pageCount) throw new Error(`Page ${part} does not exist. This document has ${pageCount} pages.`)
      return { start: page, end: page }
    }
    throw new Error(`"${part}" is not a page range.`)
  })
}

export function readError(error, fallback = 'Something went wrong while processing the file.') {
  if (error && typeof error.message === 'string' && error.message.trim()) return error.message
  return fallback
}

export { replaceExtension }
