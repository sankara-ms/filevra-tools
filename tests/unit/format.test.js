import { describe, expect, it } from 'vitest'
import {
  formatBytes,
  parseKilobytes,
  reductionPercent,
  replaceExtension,
  stripExtension,
} from '../../src/utils/format'

describe('formatBytes', () => {
  it('keeps small values in bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(999)).toBe('999 B')
  })

  it('formats kilobytes and megabytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('degrades gracefully for invalid input', () => {
    expect(formatBytes(-5)).toBe('—')
    expect(formatBytes(Number.NaN)).toBe('—')
  })
})

describe('parseKilobytes', () => {
  it('converts kilobytes to bytes', () => {
    expect(parseKilobytes('200')).toBe(204800)
    expect(parseKilobytes(' 12.5 ')).toBe(12800)
    expect(parseKilobytes('2,5')).toBe(2560)
  })

  it('rejects empty and non-positive input', () => {
    expect(parseKilobytes('')).toBeNull()
    expect(parseKilobytes('0')).toBeNull()
    expect(parseKilobytes('-30')).toBeNull()
    expect(parseKilobytes('abc')).toBeNull()
    expect(parseKilobytes(null)).toBeNull()
  })
})

describe('reductionPercent', () => {
  it('reports the percentage saved', () => {
    expect(reductionPercent(1000, 750)).toBe(25)
    expect(reductionPercent(1000, 1001)).toBe(0)
    expect(reductionPercent(0, 10)).toBe(0)
  })
})

describe('file name helpers', () => {
  it('strips and replaces extensions', () => {
    expect(stripExtension('photo.final.jpeg')).toBe('photo.final')
    expect(stripExtension('no-extension')).toBe('no-extension')
    expect(replaceExtension('photo.png', 'jpg')).toBe('photo.jpg')
    expect(replaceExtension('archive.tar.gz', '.pdf')).toBe('archive.tar.pdf')
  })
})
