import { describe, expect, it, vi } from 'vitest'
import { encodeToTarget, MAX_QUALITY, MIN_QUALITY } from '../../src/tools/encode'

const fakeEncoder = () =>
  vi.fn((quality) => {
    const size = Math.round(1000 + (1 - quality) * 10000)
    return Promise.resolve({ size, quality })
  })

describe('encodeToTarget', () => {
  it('returns the highest quality that fits the target', async () => {
    const encode = fakeEncoder()
    const target = 6000
    const result = await encodeToTarget(encode, target)

    expect(result.blob.size).toBeLessThanOrEqual(target)
    expect(result.quality).toBeGreaterThanOrEqual(MIN_QUALITY)
    expect(result.quality).toBeLessThanOrEqual(MAX_QUALITY)
    expect(encode).toHaveBeenCalledTimes(7)
  })

  it('falls back to minimum quality when nothing fits', async () => {
    const encode = vi.fn(() => Promise.resolve({ size: 50_000 }))
    const result = await encodeToTarget(encode, 1000)

    expect(result.quality).toBe(MIN_QUALITY)
    expect(result.blob.size).toBe(50_000)
  })

  it('accepts an unreachable high target at maximum quality', async () => {
    const encode = vi.fn(() => Promise.resolve({ size: 100 }))
    const result = await encodeToTarget(encode, 10_000)

    expect(result.blob.size).toBe(100)
    expect(result.quality).toBeGreaterThan(MIN_QUALITY)
    expect(result.quality).toBeLessThanOrEqual(MAX_QUALITY)
  })
})
