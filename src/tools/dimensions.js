export function computeTargetSize({ sourceWidth, sourceHeight, width, height, lockAspect }) {
  const sourceRatio = sourceWidth / sourceHeight
  let targetWidth = Number(width)
  let targetHeight = Number(height)
  const hasWidth = Number.isFinite(targetWidth) && targetWidth > 0
  const hasHeight = Number.isFinite(targetHeight) && targetHeight > 0

  if (lockAspect) {
    if (hasWidth) {
      targetHeight = Math.max(1, Math.round(targetWidth / sourceRatio))
    } else if (hasHeight) {
      targetWidth = Math.max(1, Math.round(targetHeight * sourceRatio))
    }
  }

  if (!hasWidth && !hasHeight) return null
  if (!Number.isFinite(targetWidth) || !Number.isFinite(targetHeight)) return null

  return {
    width: Math.min(12000, Math.max(1, Math.round(targetWidth))),
    height: Math.min(12000, Math.max(1, Math.round(targetHeight))),
  }
}
