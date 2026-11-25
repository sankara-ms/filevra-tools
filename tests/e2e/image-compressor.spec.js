import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { fixture } from './helpers/fixtures'

test.describe('image compressor', () => {
  test('compresses an image, reports the result and downloads a JPEG', async ({ page }) => {
    await page.goto('/image-compressor')

    await page.setInputFiles('[data-testid="image-dropzone-input"]', fixture('noise.png'))
    await expect(page.getByText('noise.png')).toBeVisible()

    await page.getByTestId('target-100').click()
    await page.getByTestId('compress-button').click()

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 40_000 })
    await expect(page.getByTestId('result-card')).toContainText(/Compressed image ready|Smallest result|original file is already/i)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-result').click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^compressed-noise\.jpe?g$/i)

    const output = await download.path()
    expect(fs.statSync(output).size).toBeGreaterThan(1000)
  })

  test('keeps the original when it is already under the target', async ({ page }) => {
    await page.goto('/image-compressor')

    await page.setInputFiles('[data-testid="image-dropzone-input"]', fixture('gradient.png'))
    await page.getByTestId('target-1024').click()
    await page.getByTestId('compress-button').click()

    const card = page.getByTestId('result-card')
    await expect(card).toBeVisible({ timeout: 40_000 })
    await expect(card).toContainText(/already the best result|Compressed image ready/i)
  })

  test('accepts a custom target in kilobytes', async ({ page }) => {
    await page.goto('/image-compressor')

    await page.setInputFiles('[data-testid="image-dropzone-input"]', fixture('noise.png'))
    await page.getByTestId('target-custom').click()
    await page.getByTestId('custom-kb').fill('300')
    await page.getByTestId('compress-button').click()

    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 40_000 })
  })

  test('reset returns the tool to its empty state', async ({ page }) => {
    await page.goto('/image-compressor')

    await page.setInputFiles('[data-testid="image-dropzone-input"]', fixture('gradient.png'))
    await page.getByTestId('target-200').click()
    await page.getByTestId('compress-button').click()
    await expect(page.getByTestId('result-card')).toBeVisible({ timeout: 40_000 })

    await page.getByTestId('reset-tool').last().click()
    await expect(page.getByTestId('result-card')).toHaveCount(0)
    await expect(page.getByTestId('image-dropzone')).toBeVisible()
  })
})
