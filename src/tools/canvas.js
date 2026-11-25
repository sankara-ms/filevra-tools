export async function encodeCanvas(canvas, type = 'image/jpeg', quality = 0.85) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('The browser could not encode this image.'))
      },
      type,
      quality,
    )
  })
}

export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source)
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url)
      reject(new Error('This image could not be opened. It may be damaged or in an unsupported format.'))
    }
    image.src = url
  })
}

export function createCanvas(width, height, background = '#ffffff') {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser does not support canvas image processing.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  if (background) {
    context.fillStyle = background
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  return { canvas, context }
}

export function drawImageCovering(context, image, width, height) {
  context.drawImage(image, 0, 0, width, height)
}

export function fitWithin(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1)
  return {
    width: Math.max(1, Math.round(sourceWidth * ratio)),
    height: Math.max(1, Math.round(sourceHeight * ratio)),
  }
}

export function releaseCanvas(canvas) {
  canvas.width = 0
  canvas.height = 0
}
