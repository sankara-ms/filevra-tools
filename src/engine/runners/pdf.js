import { getPdfjs } from '../../tools/pdfEngine'
import { createCanvas, encodeCanvas, releaseCanvas } from '../../tools/canvas'
import {
  outputName,
  parsePageList,
  parseRanges,
  uniqueName,
} from '../shared'
import { diffLines } from '../diff'

const MAX_RASTER_PAGES = 60

function checkAbort(signal) {
  if (signal?.aborted) throw new DOMException('Processing cancelled.', 'AbortError')
}

async function getLib() {
  return import('pdf-lib')
}

async function loadDocument(file, options = {}) {
  const { PDFDocument } = await getLib()
  const bytes = new Uint8Array(await file.arrayBuffer())
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false, ...options })
  } catch (error) {
    if (error?.constructor?.name === 'EncryptedPDFError') {
      throw new Error('This PDF is password-protected. Use the Unlock PDF tool first, then try again.', { cause: error })
    }
    throw new Error(`"${file.name}" could not be opened. It may be damaged or use an unsupported encoding.`, { cause: error })
  }
}

async function savePdf(document, type = 'pdf') {
  document.setProducer('Filevra')
  const bytes = await document.save()
  return new Blob([bytes], { type: type === 'pdf' ? 'application/pdf' : type })
}

async function openPdfjs(file) {
  const pdfjs = await getPdfjs()
  const data = new Uint8Array(await file.arrayBuffer())
  try {
    return await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise
  } catch (error) {
    if (error?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Use the Unlock PDF tool first.', { cause: error })
    }
    throw new Error('This PDF could not be opened. It may be damaged or use an unsupported encoding.', { cause: error })
  }
}

async function renderPages(file, { scale = 1, pages = null, filter = null, onProgress, signal }) {
  const pdf = await openPdfjs(file)
  const total = pdf.numPages
  const indices = pages || Array.from({ length: total }, (_, index) => index + 1)
  if (indices.length > MAX_RASTER_PAGES) {
    await pdf.destroy()
    throw new Error(`Rendering is limited to ${MAX_RASTER_PAGES} pages at a time. Enter a smaller page range.`)
  }
  const results = []
  try {
    for (let position = 0; position < indices.length; position += 1) {
      checkAbort(signal)
      const pageNumber = indices[position]
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      const { canvas, context } = createCanvas(viewport.width, viewport.height, '#ffffff')
      if (filter) context.filter = filter
      await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise
      results.push({ canvas, pageNumber })
      page.cleanup()
      onProgress?.((position + 1) / indices.length)
    }
  } finally {
    await pdf.destroy()
  }
  return { results, total }
}

function pageTextLines(page) {
  return page.getTextContent().then((content) => {
    const lines = new Map()
    content.items.forEach((item) => {
      if (!item.str || !item.str.length) return
      const y = Math.round(item.transform[5])
      const key = [...lines.keys()].find((value) => Math.abs(value - y) <= 2) ?? y
      if (!lines.has(key)) lines.set(key, [])
      lines.get(key).push({ x: item.transform[4], text: item.str })
    })
    return [...lines.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)
          .map((item) => item.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .filter((line) => line.length)
  })
}

async function extractText(file, signal, onProgress) {
  const pdf = await openPdfjs(file)
  const total = pdf.numPages
  const pages = []
  try {
    for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
      checkAbort(signal)
      const page = await pdf.getPage(pageNumber)
      const lines = await pageTextLines(page)
      pages.push(`--- Page ${pageNumber} ---\n${lines.join('\n')}`)
      page.cleanup()
      onProgress?.(pageNumber / total)
    }
  } finally {
    await pdf.destroy()
  }
  return { text: pages.join('\n\n'), pageCount: total }
}

function hexToRgb(hex) {
  const value = String(hex || '#000000').replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  const int = parseInt(full, 16)
  if (Number.isNaN(int)) return [0, 0, 0]
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255]
}

export async function split({ files, options = {}, onProgress, signal }) {
  const [file] = files
  const source = await loadDocument(file)
  const pageCount = source.getPageCount()
  const { PDFDocument } = await getLib()
  const mode = options.mode || 'every'
  const outputs = []
  const used = new Set()

  if (mode === 'ranges') {
    const ranges = parseRanges(options.ranges, pageCount)
    for (const range of ranges) {
      checkAbort(signal)
      const indices = []
      for (let page = range.start; page <= range.end; page += 1) indices.push(page - 1)
      const output = await PDFDocument.create()
      const copied = await output.copyPages(source, indices)
      copied.forEach((page) => output.addPage(page))
      const name = uniqueName(
        outputName(file.name, 'pdf', `-pages-${range.start}${range.end !== range.start ? `-${range.end}` : ''}`),
        used,
      )
      outputs.push({ name, blob: await savePdf(output), note: `${indices.length} page(s)` })
    }
  } else {
    const size = Math.max(1, Math.min(200, Number(options.size) || 1))
    if (pageCount / size > 80) throw new Error('That would create more than 80 files. Choose a larger page group.')
    for (let start = 0; start < pageCount; start += size) {
      checkAbort(signal)
      const end = Math.min(pageCount, start + size)
      const output = await PDFDocument.create()
      const indices = Array.from({ length: end - start }, (_, index) => start + index)
      const copied = await output.copyPages(source, indices)
      copied.forEach((page) => output.addPage(page))
      const name = uniqueName(outputName(file.name, 'pdf', `-pages-${start + 1}-${end}`), used)
      outputs.push({ name, blob: await savePdf(output), note: `${end - start} page(s)` })
      onProgress?.(end / pageCount)
    }
  }
  onProgress?.(1)
  return {
    outputs,
    stats: [
      { label: 'Source pages', value: String(pageCount) },
      { label: 'Files created', value: String(outputs.length) },
    ],
  }
}

export async function extract({ files, options = {}, onProgress, signal }) {
  const [file] = files
  const source = await loadDocument(file)
  const pageCount = source.getPageCount()
  const pages = parsePageList(options.pages, pageCount)
  checkAbort(signal)
  const { PDFDocument } = await getLib()
  const output = await PDFDocument.create()
  const copied = await output.copyPages(source, pages.map((page) => page - 1))
  copied.forEach((page) => output.addPage(page))
  onProgress?.(1)
  const name = outputName(file.name, 'pdf', '-extracted')
  return {
    outputs: [{ name, blob: await savePdf(output), note: `${pages.length} of ${pageCount} page(s)` }],
    stats: [{ label: 'Pages extracted', value: String(pages.length) }],
  }
}

export async function removePages({ files, options = {}, onProgress, signal }) {
  const [file] = files
  const source = await loadDocument(file)
  const pageCount = source.getPageCount()
  const remove = new Set(parsePageList(options.pages, pageCount))
  const keep = Array.from({ length: pageCount }, (_, index) => index).filter((index) => !remove.has(index + 1))
  if (!keep.length) throw new Error(`You selected all ${pageCount} pages. At least one page must remain.`)
  checkAbort(signal)
  const { PDFDocument } = await getLib()
  const output = await PDFDocument.create()
  const copied = await output.copyPages(source, keep)
  copied.forEach((page) => output.addPage(page))
  onProgress?.(1)
  return {
    outputs: [
      {
        name: outputName(file.name, 'pdf', '-edited'),
        blob: await savePdf(output),
        note: `${remove.size} page(s) removed, ${keep.length} kept`,
      },
    ],
  }
}

export async function organize({ files, options = {}, onProgress, signal }) {
  const [file] = files
  const source = await loadDocument(file)
  const pageCount = source.getPageCount()
  const order = parsePageList(options.order, pageCount)
  if (order.length !== pageCount) {
    throw new Error(`Enter all ${pageCount} pages exactly once, in the new order (for example 3,1,2,4).`)
  }
  checkAbort(signal)
  const { PDFDocument } = await getLib()
  const output = await PDFDocument.create()
  const copied = await output.copyPages(source, order.map((page) => page - 1))
  copied.forEach((page) => output.addPage(page))
  onProgress?.(1)
  return {
    outputs: [{ name: outputName(file.name, 'pdf', '-reordered'), blob: await savePdf(output), note: `${pageCount} pages reordered` }],
  }
}

export async function rotate({ files, options = {}, onProgress, signal }) {
  checkAbort(signal)
  const [file] = files
  const source = await loadDocument(file, { updateMetadata: true })
  const pageCount = source.getPageCount()
  const angle = Number(options.angle) || 90
  const { degrees } = await getLib()
  const targetPages =
    options.scope === 'selected' ? parsePageList(options.pages, pageCount) : Array.from({ length: pageCount }, (_, i) => i + 1)
  targetPages.forEach((pageNumber) => {
    const page = source.getPage(pageNumber - 1)
    const current = page.getRotation().angle || 0
    page.setRotation(degrees((current + angle) % 360))
  })
  source.setTitle(source.getTitle() || 'Rotated document')
  onProgress?.(1)
  return {
    outputs: [{ name: outputName(file.name, 'pdf', '-rotated'), blob: await savePdf(source), note: `${targetPages.length} page(s) turned ${angle}°` }],
  }
}

export async function pageNumbers({ files, options = {}, signal }) {
  const [file] = files
  const source = await loadDocument(file, { updateMetadata: true })
  const { StandardFonts, rgb } = await getLib()
  const font = await source.embedFont(StandardFonts.Helvetica)
  const size = Math.max(6, Math.min(36, Number(options.size) || 10))
  const startAt = Math.max(1, Number(options.startAt) || 1)
  const position = options.position || 'bottom-center'
  const skipFirst = Boolean(options.skipFirst)
  const pages = source.getPages()
  pages.forEach((page, index) => {
    checkAbort(signal)
    if (skipFirst && index === 0) return
    const { width, height } = page.getSize()
    const number = index + startAt
    const label = options.format === 'n-of-total' ? `Page ${number} of ${pages.length + startAt - 1}` : String(number)
    const widthOfText = font.widthOfTextAtSize(label, size)
    const margin = 24
    const x = position.endsWith('left') ? margin : position.endsWith('right') ? width - widthOfText - margin : (width - widthOfText) / 2
    const y = position.startsWith('top') ? height - margin - size : margin
    page.drawText(label, { x, y, size, font, color: rgb(0.25, 0.25, 0.25) })
  })
  return {
    outputs: [{ name: outputName(file.name, 'pdf', '-numbered'), blob: await savePdf(source), note: `${pages.length} page(s) numbered` }],
  }
}

export async function watermark({ files, options = {}, signal }) {
  const [file] = files
  const text = String(options.text || 'Filevra').slice(0, 80)
  if (!text.trim()) throw new Error('Enter the watermark text first.')
  const source = await loadDocument(file, { updateMetadata: true })
  const { StandardFonts, degrees, rgb } = await getLib()
  const font = await source.embedFont(StandardFonts.HelveticaBold)
  const size = Math.max(8, Math.min(160, Number(options.size) || 48))
  const opacity = Math.min(0.9, Math.max(0.05, Number(options.opacity) || 0.22))
  const [r, g, b] = hexToRgb(options.color || '#606060')
  const diagonal = options.diagonal !== false
  const pages = source.getPages()
  pages.forEach((page) => {
    checkAbort(signal)
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: (width - textWidth * Math.cos(Math.PI / 4)) / 2,
      y: height / 2 - textWidth * 0.15,
      size,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: diagonal ? degrees(45) : degrees(0),
    })
  })
  return {
    outputs: [{ name: outputName(file.name, 'pdf', '-watermarked'), blob: await savePdf(source), note: `${pages.length} page(s)` }],
    warning: 'The watermark is a visible layer drawn over the page. A determined reader could still copy the text underneath.',
  }
}

export async function metadata({ files, options = {}, signal }) {
  const [file] = files
  const source = await loadDocument(file, { updateMetadata: true })
  const edit = String(options.mode || 'view') === 'edit'
  if (edit) {
    checkAbort(signal)
    if (options.title != null) source.setTitle(String(options.title).slice(0, 200))
    if (options.author != null) source.setAuthor(String(options.author).slice(0, 200))
    if (options.subject != null) source.setSubject(String(options.subject).slice(0, 300))
    if (options.keywords != null) {
      const keywords = String(options.keywords)
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean)
        .slice(0, 30)
      source.setKeywords(keywords)
    }
    return {
      outputs: [{ name: outputName(file.name, 'pdf', '-metadata'), blob: await savePdf(source), note: 'Metadata updated' }],
    }
  }
  const date = (value) => {
    try {
      return value ? new Date(value).toISOString() : '—'
    } catch {
      return String(value)
    }
  }
  const pages = source.getPageCount()
  return {
    info: [
      {
        heading: 'Document properties',
        rows: [
          { label: 'Pages', value: String(pages) },
          { label: 'Title', value: source.getTitle() || '—' },
          { label: 'Author', value: source.getAuthor() || '—' },
          { label: 'Subject', value: source.getSubject() || '—' },
          { label: 'Keywords', value: (source.getKeywords() || []).join(', ') || '—' },
          { label: 'Creator', value: source.getCreator() || '—' },
          { label: 'Producer', value: source.getProducer() || '—' },
          { label: 'Created', value: date(source.getCreationDate()) },
          { label: 'Modified', value: date(source.getModificationDate()) },
          { label: 'File size', value: `${Math.round(file.size / 1024)} KB` },
        ],
      },
    ],
  }
}

export async function toImages({ files, options = {}, onProgress, signal }) {
  const [file] = files
  const pdf = await openPdfjs(file)
  const total = pdf.numPages
  const pages = options.scope === 'selected' ? parsePageList(options.pages, total) : Array.from({ length: total }, (_, i) => i + 1)
  const dpi = Math.max(48, Math.min(300, Number(options.dpi) || 120))
  const format = options.format === 'png' ? 'png' : 'jpg'
  const quality = Math.min(0.95, Math.max(0.4, Number(options.quality) || 0.85))
  if (pages.length > MAX_RASTER_PAGES) {
    await pdf.destroy()
    throw new Error(`Conversion is limited to ${MAX_RASTER_PAGES} pages at a time. Use a page range for longer documents.`)
  }
  const outputs = []
  try {
    for (let index = 0; index < pages.length; index += 1) {
      checkAbort(signal)
      const page = await pdf.getPage(pages[index])
      const viewport = page.getViewport({ scale: dpi / 72 })
      const { canvas, context } = createCanvas(viewport.width, viewport.height, '#ffffff')
      await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise
      const blob = await encodeCanvas(canvas, format === 'png' ? 'image/png' : 'image/jpeg', quality)
      outputs.push({
        name: outputName(file.name, format, `-page-${pages[index]}`),
        blob,
        note: `${Math.round(viewport.width)} × ${Math.round(viewport.height)} px`,
      })
      releaseCanvas(canvas)
      page.cleanup()
      onProgress?.((index + 1) / pages.length)
    }
  } finally {
    await pdf.destroy()
  }
  return {
    outputs,
    stats: [
      { label: 'Pages converted', value: String(outputs.length) },
      { label: 'Resolution', value: `${dpi} DPI` },
    ],
  }
}

export async function toText({ files, onProgress, signal }) {
  const [file] = files
  const { text, pageCount } = await extractText(file, signal, onProgress)
  return {
    text,
    outputExt: 'txt',
    outputName: outputName(file.name, 'txt'),
    info: [{ heading: 'Document', rows: [{ label: 'Pages read', value: String(pageCount) }] }],
    warning: 'Text is extracted in reading order as the PDF stores it. Multi-column layouts and tables may come out in a different order than you see on screen.',
  }
}

export async function preview({ files, signal }) {
  const [file] = files
  const pdf = await openPdfjs(file)
  const total = pdf.numPages
  const limit = Math.min(total, 12)
  const previews = []
  try {
    for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
      checkAbort(signal)
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 0.55 })
      const { canvas, context } = createCanvas(viewport.width, viewport.height, '#ffffff')
      await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise
      previews.push({ name: `Page ${pageNumber}`, src: canvas.toDataURL('image/jpeg', 0.7) })
      releaseCanvas(canvas)
      page.cleanup()
    }
  } finally {
    await pdf.destroy()
  }
  return {
    previews,
    info: [
      {
        heading: 'Document',
        rows: [
          { label: 'Pages', value: String(total) },
          { label: 'Preview shown', value: `${limit} page(s)` },
          { label: 'File size', value: `${Math.round(file.size / 1024)} KB` },
        ],
      },
    ],
    warning: total > limit ? `Only the first ${limit} pages are previewed to keep memory use reasonable.` : undefined,
  }
}

export async function grayscale({ files, options = {}, onProgress, signal }) {
  const [file] = files
  const dpi = Math.max(72, Math.min(200, Number(options.dpi) || 120))
  const { results, total } = await renderPages(file, {
    scale: dpi / 72,
    filter: 'grayscale(1)',
    onProgress,
    signal,
  })
  const { PDFDocument } = await getLib()
  const output = await PDFDocument.create()
  for (const { canvas } of results) {
    const blob = await encodeCanvas(canvas, 'image/jpeg', 0.78)
    const embedded = await output.embedJpg(new Uint8Array(await blob.arrayBuffer()))
    const page = output.addPage([canvas.width, canvas.height])
    page.drawImage(embedded, { x: 0, y: 0, width: canvas.width, height: canvas.height })
    releaseCanvas(canvas)
  }
  return {
    outputs: [{ name: outputName(file.name, 'pdf', '-grayscale'), blob: await savePdf(output), note: `${total} page(s)` }],
    warning: 'Pages are rendered to greyscale images and rebuilt into a PDF. Text stops being selectable and the file may be smaller or larger than the original.',
  }
}

export async function protect({ files, options = {}, signal }) {
  const [file] = files
  const userPassword = String(options.password || '')
  const ownerPassword = String(options.ownerPassword || userPassword)
  if (userPassword.length < 4) throw new Error('Use a password with at least 4 characters.')
  const { PDFDocument } = await import('@cantoo/pdf-lib')
  let document
  try {
    document = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()))
  } catch {
    throw new Error('This PDF could not be opened. Remove any existing password before protecting it again.')
  }
  checkAbort(signal)
  document.setProducer('Filevra')
  await document.encrypt({ userPassword, ownerPassword })
  const bytes = await document.save()
  return {
    outputs: [{ name: outputName(file.name, 'pdf', '-protected'), blob: new Blob([bytes], { type: 'application/pdf' }), note: 'Password required to open' }],
    warning: 'Keep the password somewhere safe. Filevra cannot recover it, and a lost password locks the document permanently.',
  }
}

export async function unlock({ files, options = {}, signal }) {
  const [file] = files
  const password = String(options.password || '')
  if (!password) throw new Error('Enter the PDF password.')
  const { PDFDocument } = await import('@cantoo/pdf-lib')
  let document
  try {
    document = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { password })
  } catch (error) {
    const message = String(error?.message || '')
    if (/password/i.test(message)) throw new Error('That password did not open the PDF. Check capital letters and try again.', { cause: error })
    throw new Error('This PDF could not be unlocked. It may use a protection method this browser cannot handle.', { cause: error })
  }
  checkAbort(signal)
  document.setProducer('Filevra')
  const bytes = await document.save()
  return {
    outputs: [{ name: outputName(file.name, 'pdf', '-unlocked'), blob: new Blob([bytes], { type: 'application/pdf' }), note: 'No password required' }],
    warning: 'Only unlock files you have the right to open. The password is used in this tab only and is never sent anywhere.',
  }
}

export async function crop({ files, options = {}, signal }) {
  const [file] = files
  const source = await loadDocument(file, { updateMetadata: true })
  const left = Math.min(45, Math.max(0, Number(options.left) || 0)) / 100
  const right = Math.min(45, Math.max(0, Number(options.right) || 0)) / 100
  const top = Math.min(45, Math.max(0, Number(options.top) || 0)) / 100
  const bottom = Math.min(45, Math.max(0, Number(options.bottom) || 0)) / 100
  if (left + right >= 0.9 || top + bottom >= 0.9) throw new Error('The crop margins remove almost the whole page.')
  source.getPages().forEach((page) => {
    checkAbort(signal)
    const { width, height } = page.getSize()
    const x = width * left
    const y = height * bottom
    const boxWidth = width * (1 - left - right)
    const boxHeight = height * (1 - top - bottom)
    page.setCropBox(x, y, boxWidth, boxHeight)
  })
  return {
    outputs: [{ name: outputName(file.name, 'pdf', '-cropped'), blob: await savePdf(source), note: 'Visible area cropped' }],
    warning: 'Cropping changes the visible page area. Content outside the new page is hidden, not deleted, and can reappear in some editors.',
  }
}

export async function compress({ files, options = {}, onProgress, signal }) {
  const [file] = files
  checkAbort(signal)
  const { compressPdf } = await import('../../tools/pdfCompressor')
  const dpi = Math.max(72, Math.min(200, Number(options.dpi) || 120))
  const quality = Math.min(0.95, Math.max(0.35, (Number(options.quality) || 65) / 100))
  const result = await compressPdf(file, { dpi, quality, onProgress })
  checkAbort(signal)
  return {
    outputs: [
      {
        name: outputName(file.name, 'pdf', '-compressed'),
        blob: result.blob,
        note: `${Math.round(file.size / 1024)} KB → ${Math.round(result.blob.size / 1024)} KB`,
      },
    ],
    stats: [
      { label: 'Pages', value: String(result.pageCount) },
      { label: 'Result size', value: `${Math.round(result.blob.size / 1024)} KB` },
    ],
    warning: 'Pages are re-rendered at the chosen resolution. Text stops being selectable and the result can be larger when the original was already optimised.',
  }
}

export async function compare({ files, onProgress, signal }) {
  if (files.length !== 2) throw new Error('Choose exactly two PDF files.')
  const first = await extractText(files[0], signal, (value) => onProgress?.(value / 2))
  const second = await extractText(files[1], signal, (value) => onProgress?.(0.5 + value / 2))
  const diff = diffLines(first.text, second.text)
  return {
    text: diff.text,
    outputExt: 'txt',
    outputName: 'filevra-pdf-text-diff.txt',
    info: [
      {
        heading: 'Comparison',
        rows: [
          { label: files[0].name, value: `${first.pageCount} pages` },
          { label: files[1].name, value: `${second.pageCount} pages` },
          { label: 'Lines added', value: String(diff.added) },
          { label: 'Lines removed', value: String(diff.removed) },
          { label: 'Result', value: diff.identical ? 'The extracted text is identical.' : 'The documents differ.' },
        ],
      },
    ],
    warning: 'This compares extracted text, not the visual layout. Images, fonts and spacing are not compared.',
  }
}
