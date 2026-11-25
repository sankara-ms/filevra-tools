import { createCanvas, encodeCanvas, loadImage, releaseCanvas } from './canvas'
import { encodeToTarget } from './encode'

export async function resizeImage(file, { width, height, targetBytes = null, onProgress } = {}) {
  const image = await loadImage(file)
  const { canvas, context } = createCanvas(width, height, '#ffffff')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  onProgress?.(0.4)

  let result
  if (targetBytes) {
    const encoded = await encodeToTarget((quality) => encodeCanvas(canvas, 'image/jpeg', quality), targetBytes, {
      max: 0.9,
    })
    result = { blob: encoded.blob, quality: encoded.quality, hitTarget: encoded.blob.size <= targetBytes }
  } else {
    const blob = await encodeCanvas(canvas, 'image/jpeg', 0.9)
    result = { blob, quality: 0.9, hitTarget: null }
  }

  const { naturalWidth, naturalHeight } = image
  releaseCanvas(canvas)
  onProgress?.(1)

  return {
    ...result,
    width,
    height,
    sourceWidth: naturalWidth,
    sourceHeight: naturalHeight,
    originalSize: file.size,
    size: result.blob.size,
    usedOriginal: false,
  }
}
