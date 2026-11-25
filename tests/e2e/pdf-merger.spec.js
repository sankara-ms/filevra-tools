import fs from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { expect, test } from '@playwright/test'
import { fixture } from './helpers/fixtures'

test.describe('PDF merger', () => {
  test('merges PDFs in the chosen order and downloads the result', async ({ page }) => {
    await page.goto('/merge-pdf')

    await page.setInputFiles('[data-testid="merge-dropzone-input"]', [
      fixture('doc-a.pdf'),
      fixture('doc-b.pdf'),
    ])
    const queue = page.getByTestId('file-queue').locator('.fr-file-item')
    await expect(queue).toHaveCount(2)
    await expect(queue.nth(0)).toContainText('doc-a.pdf')

    await page.getByRole('button', { name: 'Move doc-b.pdf up' }).click()
    await expect(queue.nth(0)).toContainText('doc-b.pdf')

    await page.getByTestId('merge-button').click()
    const card = page.getByTestId('result-card')
    await expect(card).toBeVisible({ timeout: 40_000 })
    await expect(card).toContainText('Merged PDF ready')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-result').click(),
    ])
    expect(download.suggestedFilename()).toBe('merged-document.pdf')

    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')

    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(3)
    const firstPage = pdf.getPage(0)
    expect(firstPage.getWidth()).toBeCloseTo(595.28, 1)
  })

  test('reset clears the queue', async ({ page }) => {
    await page.goto('/merge-pdf')

    await page.setInputFiles('[data-testid="merge-dropzone-input"]', [fixture('doc-a.pdf')])
    await expect(page.getByTestId('file-queue').locator('.fr-file-item')).toHaveCount(1)
    await page.getByTestId('reset-tool').first().click()
    await expect(page.getByTestId('file-queue')).toHaveCount(0)
    await expect(page.getByTestId('merge-dropzone')).toBeVisible()
  })
})
