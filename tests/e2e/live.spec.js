import { expect, test } from '@playwright/test'

const LIVE_URL = process.env.LIVE_URL

test.describe('live deployment smoke test', () => {
  test.skip(!LIVE_URL, 'Set LIVE_URL to run the live smoke test.')

  test('important pages respond and render', async ({ page, request }) => {
    const paths = ['/', '/image-compressor', '/photo-signature-resizer', '/image-to-pdf', '/merge-pdf', '/compress-pdf']

    for (const path of paths) {
      const response = await request.get(`${LIVE_URL}${path}`)
      expect(response.status(), path).toBe(200)
    }

    const manifest = await request.get(`${LIVE_URL}/manifest.json`)
    expect(manifest.status()).toBe(200)
    const sw = await request.get(`${LIVE_URL}/sw.js`)
    expect(sw.status()).toBe(200)

    await page.goto(`${LIVE_URL}/`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Prepare Your Images and Documents in Seconds',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${LIVE_URL}/`)
  })

  test('records a first-party page view', async ({ page }) => {
    test.skip(!LIVE_URL, 'Set LIVE_URL to run the live smoke test.')
    const endpoint = `${LIVE_URL.replace(/\/$/, '')}/api/track`
    const tracked = page.waitForRequest(
      (request) => request.url() === endpoint && request.method() === 'POST',
      { timeout: 15000 },
    )
    await page.goto(`${LIVE_URL}/tools`)
    const request = await tracked
    const body = request.postData() || ''
    expect(body).toContain('"type":"page"')
    expect(body).toContain('"/tools"')
  })

  test('serves the custom 404 page for unknown paths', async ({ request }) => {
    test.skip(!LIVE_URL, 'Set LIVE_URL to run the live smoke test.')
    const response = await request.get(`${LIVE_URL}/this-page-does-not-exist`, { failOnStatusCode: false })
    expect(response.status()).toBe(404)
    expect(await response.text()).toContain('Filevra')
  })
})
