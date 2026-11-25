import { expect, test } from '@playwright/test'

test.describe('invalid file handling', () => {
  test('rejects a text file in the image compressor', async ({ page }) => {
    await page.goto('/image-compressor')
    await page.setInputFiles('[data-testid="image-dropzone-input"]', {
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is not an image.'),
    })
    await expect(page.getByTestId('error-message')).toContainText(/not supported/i)
    await expect(page.getByTestId('image-dropzone')).toBeVisible()
  })

  test('rejects an image in the PDF merger', async ({ page }) => {
    await page.goto('/merge-pdf')
    await page.setInputFiles('[data-testid="merge-dropzone-input"]', {
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('not really a png'),
    })
    await expect(page.getByText(/Skipped 1 file/)).toBeVisible()
    await expect(page.getByTestId('file-queue')).toHaveCount(0)
  })

  test('reports a corrupt PDF safely instead of crashing', async ({ page }) => {
    await page.goto('/compress-pdf')
    await page.setInputFiles('[data-testid="compress-dropzone-input"]', {
      name: 'broken.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 this file has no valid structure'),
    })

    await page.getByTestId('compress-pdf-button').click()
    await expect(page.getByTestId('error-message')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('result-card')).toHaveCount(0)
  })

  test('rejects an oversized image before reading it', async ({ page }) => {
    await page.goto('/image-compressor')
    await page.setInputFiles('[data-testid="image-dropzone-input"]', {
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(31 * 1024 * 1024),
    })
    await expect(page.getByTestId('error-message')).toContainText(/larger than 30 MB/)
  })
})
