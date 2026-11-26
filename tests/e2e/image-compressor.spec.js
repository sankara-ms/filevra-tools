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

  test('compresses a batch and exports every result as a ZIP', async ({ page }) => {
    await page.goto('/image-compressor')

    await page.setInputFiles('[data-testid="image-dropzone-input"]', fixture('noise.png'))
    await expect(page.getByTestId('batch-item')).toHaveCount(1)

    await page.setInputFiles('[data-testid="add-more-input"]', fixture('gradient.png'))
    await expect(page.getByTestId('batch-item')).toHaveCount(2)
    await expect(page.getByTestId('batch-summary')).toContainText('2 images')

    await page.getByTestId('target-200').click()
    await page.getByTestId('compress-button').click()
    await expect(page.getByTestId('batch-progress-text')).toBeVisible()

    const card = page.getByTestId('result-card')
    await expect(card).toBeVisible({ timeout: 90_000 })
    await expect(card).toContainText('2 of 2')
    await expect(page.getByTestId('download-item')).toHaveCount(2)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-zip').click(),
    ])
    expect(download.suggestedFilename()).toBe('filevra-compressed-images.zip')
    const zipBuffer = fs.readFileSync(await download.path())
    expect(zipBuffer.subarray(0, 2).toString()).toBe('PK')

    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(zipBuffer)
    const names = Object.keys(zip.files)
      .filter((name) => !zip.files[name].dir)
      .sort()
    expect(names).toEqual(['compressed-gradient.jpg', 'compressed-noise.jpg'])

    await page.getByTestId('clear-all').click()
    await expect(page.getByTestId('batch-item')).toHaveCount(0)
    await expect(page.getByTestId('result-card')).toHaveCount(0)
    await expect(page.getByTestId('image-dropzone')).toBeVisible()
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
