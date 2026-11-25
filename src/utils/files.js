export const MAX_IMAGE_BYTES = 30 * 1024 * 1024
export const MAX_PDF_BYTES = 50 * 1024 * 1024

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i

export function isImageFile(file) {
  if (!file) return false
  return /^image\/(jpeg|jpg|png|webp)$/i.test(file.type) || IMAGE_EXTENSIONS.test(file.name || '')
}

export function isPdfFile(file) {
  if (!file) return false
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '')
}

export function validateImageFile(file, maxBytes = MAX_IMAGE_BYTES) {
  if (!file) return 'Choose an image to continue.'
  if (!isImageFile(file)) return 'That file type is not supported. Use a JPG, PNG or WebP image.'
  if (file.size === 0) return 'That file is empty. Choose a different image.'
  if (file.size > maxBytes) return `That image is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`
  return null
}

export function validatePdfFile(file, maxBytes = MAX_PDF_BYTES) {
  if (!file) return 'Choose a PDF to continue.'
  if (!isPdfFile(file)) return 'That file type is not supported. Use a PDF file.'
  if (file.size === 0) return 'That file is empty. Choose a different PDF.'
  if (file.size > maxBytes) return `That PDF is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`
  return null
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function readError(error, fallback = 'Something went wrong while processing the file.') {
  if (error && typeof error.message === 'string' && error.message.trim()) return error.message
  return fallback
}
