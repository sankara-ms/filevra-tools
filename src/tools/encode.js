const MIN_QUALITY = 0.35
const MAX_QUALITY = 0.92

export async function encodeToTarget(encode, targetBytes, { min = MIN_QUALITY, max = MAX_QUALITY } = {}) {
  let low = min
  let high = max
  let best = null
  for (let step = 0; step < 7; step += 1) {
    const quality = (low + high) / 2
    const blob = await encode(quality)
    if (blob.size <= targetBytes) {
      best = { blob, quality }
      low = quality
    } else {
      high = quality
    }
  }
  if (best) return best
  const blob = await encode(min)
  return { blob, quality: min }
}

export { MIN_QUALITY, MAX_QUALITY }
