import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { collectErrors, fixture } from './helpers/fixtures'

test.describe('tool catalogue', () => {
  test('lists every registered tool and filters by search and category', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/tools')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Every Filevra tool in one place')
    const cards = page.locator('[data-testid="tool-grid"] [data-testid^="tool-card-"]')
    await expect(cards).toHaveCount(12)

    await page.getByTestId('catalogue-search').fill('signature')
    await expect(page.getByTestId('tool-card-photo-signature-resizer')).toBeVisible()

    await page.getByTestId('catalogue-search').fill('')
    await page.getByRole('button', { name: /^PDF/ }).first().click()
    await expect(page).toHaveURL(/category=pdf/)
    await expect(page.getByRole('button', { name: /^PDF/ }).first()).toHaveAttribute('aria-pressed', 'true')
    await expect(cards).toHaveCount(12)

    await page.getByRole('button', { name: /Show \d+ more/ }).click()
    await expect(cards).toHaveCount(22)

    expect(errors).toEqual([])
  })

  test('runs a text tool from the catalogue entry', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/case-converter')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Case Converter')
    await page.getByTestId('tool-text-input').fill('hello from filevra')
    await page.getByTestId('run-tool').click()

    await expect(page.getByTestId('result-card')).toBeVisible()
    await expect(page.getByTestId('tool-text-output')).toHaveText('HELLO FROM FILEVRA')
    expect(errors).toEqual([])
  })

  test('runs a file tool from the catalogue entry', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/zip-creator')

    await page.setInputFiles('[data-testid="zip-creator-dropzone-input"]', [fixture('gradient.png'), fixture('noise.png')])
    await expect(page.getByTestId('file-queue').locator('.fr-file-item')).toHaveCount(2)

    await page.getByTestId('run-tool').click()
    const card = page.getByTestId('result-card')
    await expect(card).toBeVisible({ timeout: 40_000 })
    await expect(card.locator('.fr-output-item')).toHaveCount(1)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      card.getByRole('button', { name: 'Download' }).first().click(),
    ])
    expect(download.suggestedFilename()).toBe('filevra-files.zip')
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK')
    expect(errors).toEqual([])
  })
})

test.describe('workflow builder', () => {
  test('chains an image step into a PDF and downloads the result', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/workflow')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chain several file steps into one run')
    await page.setInputFiles('[data-testid="workflow-dropzone-input"]', [fixture('gradient.png')])
    await expect(page.getByTestId('file-queue').locator('.fr-file-item')).toHaveCount(1)

    await page.locator('#workflow-op').selectOption('images-to-pdf')
    await page.getByRole('button', { name: 'Add step' }).click()
    await expect(page.locator('.fr-workflow-step')).toHaveCount(1)

    await page.getByTestId('run-workflow').click()
    const card = page.getByTestId('result-card')
    await expect(card).toBeVisible({ timeout: 40_000 })
    await expect(card).toContainText('Operations')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      card.getByRole('button', { name: 'Download' }).first().click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')
    expect(errors).toEqual([])
  })
})
