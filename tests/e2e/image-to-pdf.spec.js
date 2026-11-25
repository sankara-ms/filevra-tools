import fs from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { expect, test } from '@playwright/test'
import { fixture } from './helpers/fixtures'

test.describe('image to PDF', () => {
  test('converts several images into one PDF and downloads it', async ({ page }) => {
    await page.goto('/image-to-pdf')

    await page.setInputFiles('[data-testid="images-dropzone-input"]', [
      fixture('gradient.png'),
      fixture('noise.png'),
    ])
    await expect(page.getByTestId('file-queue').locator('.fr-file-item')).toHaveCount(2)

    await page.getByTestId('convert-button').click()
    const card = page.getByTestId('result-card')
    await expect(card).toBeVisible({ timeout: 40_000 })
    await expect(card).toContainText('PDF created')
    await expect(card).toContainText('Pages')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-result').click(),
    ])
    expect(download.suggestedFilename()).toBe('filevra-images.pdf')

    const output = await download.path()
    const bytes = fs.readFileSync(output)
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')

    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(2)
  })

  test('removes an image from the queue before converting', async ({ page }) => {
    await page.goto('/image-to-pdf')

    await page.setInputFiles('[data-testid="images-dropzone-input"]', [
      fixture('gradient.png'),
      fixture('noise.png'),
    ])
    await page.getByRole('button', { name: 'Remove noise.png' }).click()
    await expect(page.getByTestId('file-queue').locator('.fr-file-item')).toHaveCount(1)

    await page.getByTestId('convert-button').click()
    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 40_000 })
  })
})
