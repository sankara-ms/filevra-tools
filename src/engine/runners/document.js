import {
  outputName,
  sanitizeFilename,
} from '../shared'

const A4 = [595.28, 841.89]
const MARGIN = 50
const FONT_SIZE = 11

function checkAbort(signal) {
  if (signal?.aborted) throw new DOMException('Processing cancelled.', 'AbortError')
}

async function readTextFile(file) {
  const buffer = await file.arrayBuffer()
  return new TextDecoder('utf-8', { fatal: false }).decode(buffer)
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrapLines(text, font, size, maxWidth) {
  const lines = []
  String(text)
    .split(/\r?\n/)
    .forEach((paragraph) => {
      if (!paragraph.trim()) {
        lines.push('')
        return
      }
      const words = paragraph.replace(/\t/g, '    ').split(/\s+/)
      let current = ''
      words.forEach((word) => {
        const next = current ? `${current} ${word}` : word
        if (font.widthOfTextAtSize(next, size) <= maxWidth) {
          current = next
          return
        }
        if (current) lines.push(current)
        let remaining = word
        while (font.widthOfTextAtSize(remaining, size) > maxWidth && remaining.length > 1) {
          let cut = remaining.length
          while (cut > 1 && font.widthOfTextAtSize(remaining.slice(0, cut), size) > maxWidth) cut -= 1
          lines.push(remaining.slice(0, cut))
          remaining = remaining.slice(cut)
        }
        current = remaining
      })
      if (current) lines.push(current)
    })
  return lines
}

function latinSafe(text) {
  let replaced = 0
  const safe = String(text).replace(/[\u0100-\uffff]/gu, () => {
    replaced += 1
    return '?'
  })
  return { safe, replaced }
}

export async function txtToPdf({ files, options = {}, onProgress, signal }) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const size = Math.max(8, Math.min(20, Number(options.size) || FONT_SIZE))
  const outputs = []
  let replacedTotal = 0
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const text = await readTextFile(file)
    const { safe, replaced } = latinSafe(text)
    replacedTotal += replaced
    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const pageWidth = A4[0] - MARGIN * 2
    const pageHeight = A4[1] - MARGIN * 2
    const lines = wrapLines(safe, font, size, pageWidth)
    const perPage = Math.floor(pageHeight / (size * 1.45))
    for (let start = 0; start < lines.length || start === 0; start += perPage) {
      const page = pdf.addPage(A4)
      const slice = lines.slice(start, start + perPage)
      slice.forEach((line, lineIndex) => {
        if (!line) return
        page.drawText(line, {
          x: MARGIN,
          y: A4[1] - MARGIN - size - lineIndex * (size * 1.45),
          size,
          font,
          color: rgb(0.1, 0.1, 0.1),
        })
      })
      if (lines.length === 0) break
    }
    pdf.setProducer('Filevra')
    pdf.setTitle(file.name.replace(/\.[^.]+$/, ''))
    const bytes = await pdf.save()
    outputs.push({ name: outputName(file.name, 'pdf'), blob: new Blob([bytes], { type: 'application/pdf' }), note: `${lines.length} line(s)` })
    onProgress?.((index + 1) / files.length)
  }
  return {
    outputs,
    warning: replacedTotal
      ? `${replacedTotal} character(s) outside the Latin alphabet were replaced with "?". This build embeds a Latin font only.`
      : undefined,
  }
}

export async function txtToDocx({ files, onProgress, signal }) {
  const JSZip = (await import('jszip')).default
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const text = await readTextFile(file)
    const paragraphs = text.split(/\r?\n/).map((line) => `<w:p><w:r><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r></w:p>`)
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`
    const zip = new JSZip()
    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    )
    zip.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    )
    zip.file('word/document.xml', documentXml)
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    outputs.push({ name: outputName(file.name, 'docx'), blob, note: `${paragraphs.length} line(s)` })
    onProgress?.((index + 1) / files.length)
  }
  return {
    outputs,
    warning: 'The DOCX keeps the text and line breaks. Fonts, colours and images are not part of a plain text file, so the Word document uses default styling.',
  }
}

async function mammothHtml(file) {
  const mammoth = (await import('mammoth/mammoth.browser.js')).default
  const buffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
  return result.value
}

function sanitizeHtml(html) {
  return html
}

async function purifier() {
  const DOMPurify = (await import('dompurify')).default
  return DOMPurify
}

export async function docxToText({ files, onProgress, signal }) {
  const mammoth = (await import('mammoth/mammoth.browser.js')).default
  const parts = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    parts.push(files.length > 1 ? `===== ${file.name} =====\n${result.value}` : result.value)
    onProgress?.((index + 1) / files.length)
  }
  return {
    text: parts.join('\n\n'),
    outputExt: 'txt',
    outputName: files.length === 1 ? outputName(files[0].name, 'txt') : 'filevra-docx-text.txt',
    warning: 'Only the text is extracted. Tables may lose their columns, and images, headers and footnotes are not included.',
  }
}

export async function docxToHtml({ files, onProgress, signal }) {
  const DOMPurify = await purifier()
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const html = sanitizeHtml(DOMPurify.sanitize(await mammothHtml(file)))
    const full = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${xmlEscape(file.name)}</title></head><body>${html}</body></html>`
    outputs.push({
      name: outputName(file.name, 'html'),
      blob: new Blob([full], { type: 'text/html' }),
      note: `${html.length} characters of HTML`,
    })
    onProgress?.((index + 1) / files.length)
  }
  return {
    outputs,
    warning: 'Conversion is structural, not pixel-perfect. Complex layouts, columns, text boxes and headers may look different from Word.',
  }
}

async function docxMarkdown(file) {
  const DOMPurify = await purifier()
  const TurndownService = (await import('turndown/lib/turndown.browser.es.js')).default
  const html = DOMPurify.sanitize(await mammothHtml(file))
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  return turndown.turndown(html)
}

export async function docxToMarkdown({ files, onProgress, signal }) {
  const parts = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const markdown = await docxMarkdown(file)
    parts.push(files.length > 1 ? `# ${file.name}\n\n${markdown}` : markdown)
    onProgress?.((index + 1) / files.length)
  }
  return {
    text: parts.join('\n\n'),
    outputExt: 'md',
    outputName: files.length === 1 ? outputName(files[0].name, 'md') : 'filevra-docx.md',
    warning: 'Markdown supports fewer features than Word. Fonts, colours, page layout and text boxes cannot be represented.',
  }
}

export async function imagesToPdf({ files, onProgress, signal }) {
  const { imagesToPdf: convert } = await import('../../tools/imageToPdf')
  checkAbort(signal)
  const result = await convert(files, { onProgress })
  const base = files[0].name.replace(/\.[^.]+$/, '')
  return {
    outputs: [
      {
        name: files.length === 1 ? outputName(files[0].name, 'pdf') : `${sanitizeFilename(base)}-images.pdf`,
        blob: result.blob,
        note: `${result.pageCount} A4 page(s)`,
      },
    ],
    stats: [
      { label: 'Images', value: String(files.length) },
      { label: 'Pages', value: String(result.pageCount) },
    ],
    warning: files.some((file) => /\.(svg)$/i.test(file.name))
      ? 'SVG images are rasterised at their displayed size before being placed on the page.'
      : undefined,
  }
}

const DOC_STYLE = `
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.65; color: #111827; margin: 0; }
  h1, h2, h3, h4 { font-family: -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.25; margin: 1.2em 0 0.5em; }
  h1 { font-size: 2em; } h2 { font-size: 1.5em; } h3 { font-size: 1.2em; }
  p { margin: 0 0 0.9em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.92em; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; vertical-align: top; text-align: left; }
  th { background: #f3f4f6; }
  img { max-width: 100%; height: auto; }
  pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-wrap: anywhere; white-space: pre-wrap; font-size: 0.88em; }
  code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }
  blockquote { border-left: 4px solid #d1d5db; margin: 1em 0; padding-left: 1em; color: #4b5563; }
  ul, ol { padding-left: 1.4em; margin: 0 0 1em; }
`

async function renderHtmlToPdf(html, { signal, onProgress } = {}) {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText =
    'position:fixed;left:-12000px;top:0;width:794px;background:#ffffff;padding:56px 64px;box-sizing:border-box;z-index:-1;'
  const style = document.createElement('style')
  style.textContent = DOC_STYLE
  host.innerHTML = html
  document.body.appendChild(style)
  document.body.appendChild(host)
  try {
    await document.fonts?.ready
    checkAbort(signal)
    onProgress?.(0.25)
    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 794,
    })
    onProgress?.(0.65)
    checkAbort(signal)
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const pagePixelHeight = Math.floor((canvas.width * pageHeight) / pageWidth)
    const totalPages = Math.ceil(canvas.height / pagePixelHeight)
    if (totalPages > 60) throw new Error('The document is longer than 60 A4 pages. Split it into smaller files first.')
    const slice = document.createElement('canvas')
    const context = slice.getContext('2d')
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      const offset = pageIndex * pagePixelHeight
      const height = Math.min(pagePixelHeight, canvas.height - offset)
      slice.width = canvas.width
      slice.height = height
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, slice.width, slice.height)
      context.drawImage(canvas, 0, offset, canvas.width, height, 0, 0, canvas.width, height)
      const data = slice.toDataURL('image/jpeg', 0.9)
      if (pageIndex > 0) pdf.addPage()
      pdf.addImage(data, 'JPEG', 0, 0, pageWidth, (height * pageWidth) / canvas.width, undefined, 'FAST')
      onProgress?.(0.65 + (0.35 * (pageIndex + 1)) / totalPages)
    }
    slice.width = 0
    slice.height = 0
    return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' })
  } finally {
    host.remove()
    style.remove()
  }
}

async function markdownToSafeHtml(markdown) {
  const { marked } = await import('marked')
  const DOMPurify = await purifier()
  const raw = marked.parse(String(markdown), { gfm: true, breaks: false })
  return DOMPurify.sanitize(raw)
}

function fullHtmlDocument(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${xmlEscape(title)}</title><style>${DOC_STYLE}</style></head><body>${body}</body></html>`
}

export async function docxToPdf({ files, onProgress, signal }) {
  const DOMPurify = await purifier()
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const body = DOMPurify.sanitize(await mammothHtml(file))
    const blob = await renderHtmlToPdf(body, {
      signal,
      onProgress: (value) => onProgress?.((index + value) / files.length),
    })
    outputs.push({ name: outputName(file.name, 'pdf'), blob, note: 'Rendered pages' })
    onProgress?.((index + 1) / files.length)
  }
  return {
    outputs,
    warning: 'The PDF is rendered from the document structure, not from Word itself. Columns, footnotes, headers and exact fonts may differ; each page is saved as an image.',
  }
}

export async function markdownToHtml({ texts, files, options = {}, onProgress, signal }) {
  const source = texts?.markdown ?? (files?.length ? await readTextFile(files[0]) : '')
  checkAbort(signal)
  const body = await markdownToSafeHtml(source)
  const title = options.title || (files?.[0] ? files[0].name.replace(/\.[^.]+$/, '') : 'Markdown document')
  const full = fullHtmlDocument(title, body)
  const name = files?.[0] ? outputName(files[0].name, 'html') : 'filevra-markdown.html'
  onProgress?.(1)
  return {
    html: body,
    outputs: [{ name: sanitizeFilename(name), blob: new Blob([full], { type: 'text/html' }), note: 'Self-contained HTML' }],
  }
}

export async function markdownToPdf({ texts, files, onProgress, signal }) {
  const source = texts?.markdown ?? (files?.length ? await readTextFile(files[0]) : '')
  checkAbort(signal)
  const body = await markdownToSafeHtml(source)
  const blob = await renderHtmlToPdf(body, { signal, onProgress })
  const name = files?.[0] ? outputName(files[0].name, 'pdf') : 'filevra-markdown.pdf'
  return {
    outputs: [{ name, blob, note: 'Rendered pages' }],
    warning: 'Pages are rendered as images. Text in the PDF is not selectable, and very long documents may look different from the browser preview.',
  }
}

export async function htmlToMarkdown({ texts, files, onProgress, signal }) {
  const TurndownService = (await import('turndown/lib/turndown.browser.es.js')).default
  const source = texts?.html ?? (files?.length ? await readTextFile(files[0]) : '')
  checkAbort(signal)
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  const markdown = turndown.turndown(source)
  onProgress?.(1)
  return {
    text: markdown,
    outputExt: 'md',
    outputName: files?.[0] ? outputName(files[0].name, 'md') : 'filevra-markdown.md',
    warning: 'Scripts, styles and interactive elements cannot be converted. Tables become plain text unless they are simple tables.',
  }
}

export async function htmlToPdf({ files, onProgress, signal }) {
  const DOMPurify = await purifier()
  const file = files[0]
  const source = await readTextFile(file)
  const body = DOMPurify.sanitize(source, {
    FORBID_TAGS: ['script', 'style', 'link', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'video', 'audio'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
  const blob = await renderHtmlToPdf(`<div>${body}</div>`, { signal, onProgress })
  return {
    outputs: [{ name: outputName(file.name, 'pdf'), blob, note: 'Rendered pages' }],
    warning: 'Styles, scripts and external files are removed before rendering. The result keeps the HTML structure and inline text, not a screenshot of the original page.',
  }
}

export default {
  imagesToPdf,
  txtToPdf,
  txtToDocx,
  docxToText,
  docxToHtml,
  docxToMarkdown,
  docxToPdf,
  markdownToHtml,
  markdownToPdf,
  htmlToMarkdown,
  htmlToPdf,
}
