export function formatBytes(bytes, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(decimals)} ${units[unit]}`
}

export function parseKilobytes(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return null
  const normalized = String(input).trim().replace(',', '.')
  if (normalized === '') return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 1024)
}

export function reductionPercent(before, after) {
  if (!before || !after || after >= before) return 0
  return Math.round(((before - after) / before) * 1000) / 10
}

export function stripExtension(filename) {
  const clean = String(filename || 'file')
  const dot = clean.lastIndexOf('.')
  return dot > 0 ? clean.slice(0, dot) : clean
}

export function replaceExtension(filename, extension) {
  return `${stripExtension(filename)}.${extension.replace(/^\./, '')}`
}
