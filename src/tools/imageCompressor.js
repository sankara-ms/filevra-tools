import { createCanvas, encodeCanvas, loadImage, releaseCanvas } from './canvas'
import { encodeToTarget } from './encode'

export async function compressImage(file, { targetBytes = null, onProgress } = {}) {
  if (targetBytes && file.size <= targetBytes) {
    return {
      blob: file,
      size: file.size,
      originalSize: file.size,
      quality: null,
      scale: 1,
      skipped: true,
      hitTarget: true,
      usedOriginal: true,
      width: null,
      height: null,
    }
  }

  const image = await loadImage(file)
  const { canvas, context } = createCanvas(image.naturalWidth, image.naturalHeight, '#ffffff')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  onProgress?.(0.15)

  const qualityCeiling = 0.88
  let scale = 1
  let best = null
  let workCanvas = null

  const encodeWorkingCanvas = (quality) => encodeCanvas(workCanvas || canvas, 'image/jpeg', quality)

  for (let round = 0; round < 5; round += 1) {
    if (scale < 1) {
      const width = Math.max(1, Math.round(canvas.width * scale))
      const height = Math.max(1, Math.round(canvas.height * scale))
      const scaled = createCanvas(width, height, '#ffffff')
      scaled.context.drawImage(canvas, 0, 0, width, height)
      workCanvas = scaled.canvas
    } else {
      workCanvas = canvas
    }

    if (targetBytes) {
      best = await encodeToTarget(encodeWorkingCanvas, targetBytes, { max: qualityCeiling })
      onProgress?.(0.3 + round * 0.12)
      if (best.blob.size <= targetBytes) break
      const ratio = Math.sqrt(targetBytes / best.blob.size) * 0.96
      scale = Math.max(0.3, scale * Math.min(0.92, ratio))
    } else {
      const blob = await encodeWorkingCanvas(0.82)
      best = { blob, quality: 0.82 }
      break
    }

    if (scale <= 0.3) break
  }

  if (workCanvas && workCanvas !== canvas) releaseCanvas(workCanvas)

  const usedOriginal = best.blob.size >= file.size
  const result = usedOriginal
    ? { blob: file, size: file.size, quality: null, scale: 1 }
    : {
        blob: best.blob,
        size: best.blob.size,
        quality: best.quality,
        scale,
      }

  releaseCanvas(canvas)
  onProgress?.(1)

  return {
    ...result,
    originalSize: file.size,
    skipped: false,
    usedOriginal,
    hitTarget: targetBytes ? result.size <= targetBytes : true,
    width: Math.round(image.naturalWidth * (usedOriginal ? 1 : scale)),
    height: Math.round(image.naturalHeight * (usedOriginal ? 1 : scale)),
  }
}
