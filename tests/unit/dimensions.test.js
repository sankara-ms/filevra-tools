import { describe, expect, it } from 'vitest'
import { computeTargetSize } from '../../src/tools/dimensions'

const source = { sourceWidth: 1200, sourceHeight: 800 }

describe('computeTargetSize', () => {
  it('derives height from width when the aspect ratio is locked', () => {
    expect(computeTargetSize({ ...source, width: 600, height: '', lockAspect: true })).toEqual({
      width: 600,
      height: 400,
    })
  })

  it('derives width from height when the aspect ratio is locked', () => {
    expect(computeTargetSize({ ...source, width: '', height: 200, lockAspect: true })).toEqual({
      width: 300,
      height: 200,
    })
  })

  it('keeps both values when the aspect ratio is unlocked', () => {
    expect(computeTargetSize({ ...source, width: 500, height: 500, lockAspect: false })).toEqual({
      width: 500,
      height: 500,
    })
  })

  it('returns null when no usable value was entered', () => {
    expect(computeTargetSize({ ...source, width: '', height: '', lockAspect: true })).toBeNull()
    expect(computeTargetSize({ ...source, width: 'abc', height: '0', lockAspect: true })).toBeNull()
  })

  it('clamps values to the supported pixel range', () => {
    expect(computeTargetSize({ ...source, width: 50000, height: 1, lockAspect: false })).toEqual({
      width: 12000,
      height: 1,
    })
    expect(computeTargetSize({ ...source, width: 0.2, height: 0.2, lockAspect: false })).toEqual({
      width: 1,
      height: 1,
    })
  })
})
