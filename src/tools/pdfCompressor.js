import { getPdfjs } from './pdfEngine'
import { createCanvas, encodeCanvas, releaseCanvas } from './canvas'

const MAX_PAGES = 100

export async function compressPdf(file, { dpi = 120, quality = 0.65, onProgress } = {}) {
  const pdfjs = await getPdfjs()
  const { PDFDocument } = await import('pdf-lib')

  const sourceBytes = new Uint8Array(await file.arrayBuffer())
  let source
  try {
    source = await pdfjs.getDocument({ data: sourceBytes, isEvalSupported: false, useSystemFonts: true }).promise
  } catch (error) {
    if (error?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Remove the password first, then compress it here.', { cause: error })
    }
    throw new Error('This PDF could not be opened. It may be damaged or use an unsupported encoding.', { cause: error })
  }

  const pageCount = source.numPages
  if (pageCount > MAX_PAGES) {
    await source.destroy()
    throw new Error(`This PDF has ${pageCount} pages. The browser compressor is limited to ${MAX_PAGES} pages.`)
  }

  const output = await PDFDocument.create()
  const scale = Math.max(0.5, Math.min(3, dpi / 72))

  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await source.getPage(pageNumber)
      const baseViewport = page.getViewport({ scale: 1 })
      const renderViewport = page.getViewport({ scale })
      const { canvas, context } = createCanvas(renderViewport.width, renderViewport.height, '#ffffff')
      await page.render({ canvasContext: context, viewport: renderViewport, background: '#ffffff' }).promise
      const blob = await encodeCanvas(canvas, 'image/jpeg', quality)
      releaseCanvas(canvas)
      page.cleanup()

      const embedded = await output.embedJpg(new Uint8Array(await blob.arrayBuffer()))
      const outputPage = output.addPage([baseViewport.width, baseViewport.height])
      outputPage.drawImage(embedded, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      })
      onProgress?.(pageNumber / pageCount)
    }
  } finally {
    await source.destroy()
  }

  output.setProducer('FormReady')
  output.setTitle('Compressed document')
  const bytes = await output.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })

  return {
    blob,
    size: blob.size,
    originalSize: file.size,
    pageCount,
    smaller: blob.size < file.size,
    dpi,
    quality,
  }
}
