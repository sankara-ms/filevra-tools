import { createCanvas, encodeCanvas, loadImage, releaseCanvas } from './canvas'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 36
const RENDER_SCALE = 2

export async function imagesToPdf(files, { onProgress } = {}) {
  const { PDFDocument } = await import('pdf-lib')
  const pdf = await PDFDocument.create()

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const image = await loadImage(file)
    const availableWidth = A4_WIDTH - MARGIN * 2
    const availableHeight = A4_HEIGHT - MARGIN * 2
    const ratio = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight, 1)
    const drawWidth = image.naturalWidth * ratio
    const drawHeight = image.naturalHeight * ratio

    const canvasWidth = Math.max(1, Math.round(drawWidth * RENDER_SCALE))
    const canvasHeight = Math.max(1, Math.round(drawHeight * RENDER_SCALE))
    const { canvas, context } = createCanvas(canvasWidth, canvasHeight, '#ffffff')
    context.drawImage(image, 0, 0, canvasWidth, canvasHeight)
    const blob = await encodeCanvas(canvas, 'image/jpeg', 0.9)
    releaseCanvas(canvas)

    const embedded = await pdf.embedJpg(new Uint8Array(await blob.arrayBuffer()))
    const page = pdf.addPage([A4_WIDTH, A4_HEIGHT])
    page.drawImage(embedded, {
      x: (A4_WIDTH - drawWidth) / 2,
      y: (A4_HEIGHT - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    })
    onProgress?.((index + 1) / files.length)
  }

  const bytes = await pdf.save()
  return {
    blob: new Blob([bytes], { type: 'application/pdf' }),
    pageCount: files.length,
  }
}
