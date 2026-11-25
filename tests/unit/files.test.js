import { describe, expect, it } from 'vitest'
import {
  isImageFile,
  isPdfFile,
  readError,
  validateImageFile,
  validatePdfFile,
} from '../../src/utils/files'

const file = (name, type, size = 1024) => ({ name, type, size })

describe('file type detection', () => {
  it('accepts supported image types', () => {
    expect(isImageFile(file('photo.jpg', 'image/jpeg'))).toBe(true)
    expect(isImageFile(file('photo.PNG', ''))).toBe(true)
    expect(isImageFile(file('photo.webp', 'image/webp'))).toBe(true)
  })

  it('rejects unsupported image types', () => {
    expect(isImageFile(file('scan.pdf', 'application/pdf'))).toBe(false)
    expect(isImageFile(file('notes.gif', 'image/gif'))).toBe(false)
    expect(isImageFile(null)).toBe(false)
  })

  it('detects PDFs by MIME type or name', () => {
    expect(isPdfFile(file('doc.pdf', 'application/pdf'))).toBe(true)
    expect(isPdfFile(file('DOC.PDF', ''))).toBe(true)
    expect(isPdfFile(file('doc.pdf', 'text/plain'))).toBe(true)
    expect(isPdfFile(file('doc.png', 'image/png'))).toBe(false)
  })
})

describe('validation messages', () => {
  it('passes valid files', () => {
    expect(validateImageFile(file('photo.png', 'image/png'))).toBeNull()
    expect(validatePdfFile(file('doc.pdf', 'application/pdf'))).toBeNull()
  })

  it('rejects missing, empty, wrong-type and oversized files', () => {
    expect(validateImageFile(null)).toMatch(/Choose an image/)
    expect(validateImageFile(file('empty.png', 'image/png', 0))).toMatch(/empty/)
    expect(validateImageFile(file('doc.pdf', 'application/pdf'))).toMatch(/not supported/)
    expect(validateImageFile(file('big.png', 'image/png', 31 * 1024 * 1024))).toMatch(/larger than 30 MB/)
    expect(validatePdfFile(file('big.pdf', 'application/pdf', 51 * 1024 * 1024))).toMatch(/larger than 50 MB/)
    expect(validatePdfFile(file('photo.png', 'image/png'))).toMatch(/not supported/)
  })
})

describe('readError', () => {
  it('uses the error message when available', () => {
    expect(readError(new Error('PDF is encrypted'))).toBe('PDF is encrypted')
    expect(readError(null, 'fallback')).toBe('fallback')
    expect(readError({ message: '   ' }, 'fallback')).toBe('fallback')
  })
})
