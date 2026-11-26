import { expect, test } from '@playwright/test'
import { collectErrors } from './helpers/fixtures'

test.describe('usage counting', () => {
  test('local previews do not send counts', async ({ page }) => {
    const tracked = []
    page.on('request', (request) => {
      if (request.url().includes('/api/track')) tracked.push(request.method())
    })
    await page.goto('/tools')
    await page.waitForTimeout(700)
    expect(tracked).toEqual([])
  })

  test('the usage page stays private and asks for the passcode', async ({ page }) => {
    const errors = collectErrors(page)
    const beacons = []
    page.on('request', (request) => {
      if (request.url().includes('/api/track')) beacons.push(request.url())
    })

    const response = await page.goto('/usage')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Usage')
    await expect(page).toHaveTitle(/Usage/)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.getByTestId('usage-passcode')).toBeVisible()
    await expect(page.getByTestId('usage-submit')).toBeVisible()

    await page.waitForTimeout(500)
    expect(beacons).toEqual([])
    expect(errors).toEqual([])
  })

  test('explains that local previews have no usage API', async ({ page }) => {
    await page.goto('/usage')
    await page.getByTestId('usage-passcode').fill('preview-only')
    await page.getByTestId('usage-submit').click()
    await expect(page.getByTestId('usage-message')).toContainText('not running on this address')
  })
})
