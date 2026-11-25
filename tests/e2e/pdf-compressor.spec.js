import fs from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { expect, test } from '@playwright/test'
import { fixture } from './helpers/fixtures'

test.describe('PDF compressor', () => {
  test('re-renders an image-heavy PDF and reports the real size change', async ({ page }) => {
    await page.goto('/compress-pdf')

    await page.setInputFiles('[data-testid="compress-dropzone-input"]', fixture('heavy.pdf'))
    await expect(page.getByText('heavy.pdf')).toBeVisible()

    await page.getByTestId('compress-pdf-button').click()
    const card = page.getByTestId('result-card')
    await expect(card).toBeVisible({ timeout: 40_000 })
    await expect(card).toContainText(/Compressed PDF ready|not smaller/i)

    const originalBytes = fs.statSync(fixture('heavy.pdf')).size
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-result').click(),
    ])

    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')

    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(1)

    if ((await card.textContent()).includes('Compressed PDF ready')) {
      expect(bytes.length).toBeLessThan(originalBytes)
    } else {
      expect(download.suggestedFilename()).toBe('heavy.pdf')
    }
  })

  test('exposes quality and resolution controls after a file is chosen', async ({ page }) => {
    await page.goto('/compress-pdf')
    await page.setInputFiles('[data-testid="compress-dropzone-input"]', fixture('doc-a.pdf'))
    await expect(page.getByTestId('dpi-select')).toBeVisible()
    await expect(page.getByTestId('quality-range')).toBeVisible()
  })
})
