import { expect, test } from '@playwright/test'

test.describe('PWA assets', () => {
  test('serves a valid manifest with installable icons', async ({ request }) => {
    const response = await request.get('/manifest.json')
    expect(response.status()).toBe(200)

    const manifest = await response.json()
    expect(manifest.name).toContain('FormReady')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')

    const sizes = manifest.icons.map((icon) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(manifest.icons.some((icon) => String(icon.purpose).includes('maskable'))).toBe(true)

    for (const icon of manifest.icons) {
      const iconResponse = await request.get(icon.src)
      expect(iconResponse.status(), icon.src).toBe(200)
    }
  })

  test('serves the service worker and offline page', async ({ request }) => {
    const sw = await request.get('/sw.js')
    expect(sw.status()).toBe(200)
    expect(await sw.text()).toContain('formready-pages-v1')

    const offline = await request.get('/offline.html')
    expect(offline.status()).toBe(200)
    expect(await offline.text()).toContain('FormReady')
  })

  test('registers the service worker in the browser', async ({ page }) => {
    await page.goto('/')
    const registered = await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      const registrations = await navigator.serviceWorker.getRegistrations()
      return registrations.length > 0
    })
    expect(registered).toBe(true)
  })
})
