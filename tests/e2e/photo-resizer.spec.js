import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { fixture } from './helpers/fixtures'

test.describe('photo and signature resizer', () => {
  test('resizes to exact pixels with a locked aspect ratio', async ({ page }) => {
    await page.goto('/photo-signature-resizer')

    await page.setInputFiles('[data-testid="resize-dropzone-input"]', fixture('gradient.png'))
    await expect(page.getByTestId('width-input')).toHaveValue('1200')
    await expect(page.getByTestId('height-input')).toHaveValue('800')

    await page.getByTestId('width-input').fill('400')
    await expect(page.getByTestId('height-input')).toHaveValue('267')

    await page.getByTestId('resize-button').click()
    const card = page.getByTestId('result-card')
    await expect(card).toBeVisible({ timeout: 40_000 })
    await expect(card).toContainText('400 × 267')
    await expect(card).toContainText('Resized image ready')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-result').click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.jpg$/i)

    const output = await download.path()
    expect(fs.statSync(output).size).toBeGreaterThan(500)
  })

  test('honours an optional kilobyte limit', async ({ page }) => {
    await page.goto('/photo-signature-resizer')

    await page.setInputFiles('[data-testid="resize-dropzone-input"]', fixture('gradient.png'))
    await page.getByTestId('width-input').fill('800')
    await page.getByTestId('max-kb').fill('30')
    await page.getByTestId('resize-button').click()

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 40_000 })
    await expect(page.getByTestId('result-card')).toContainText(/size target met|size limit was missed/i)
  })

  test('explains invalid dimensions instead of starting', async ({ page }) => {
    await page.goto('/photo-signature-resizer')

    await page.setInputFiles('[data-testid="resize-dropzone-input"]', fixture('gradient.png'))
    await page.getByTestId('lock-aspect').uncheck()
    await page.getByTestId('width-input').fill('0')
    await page.getByTestId('resize-button').click()

    await expect(page.getByTestId('error-message')).toContainText(/width and height/i)
  })
})
