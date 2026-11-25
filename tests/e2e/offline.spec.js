import { expect, test } from '@playwright/test'

test.describe('offline support', () => {
  test('loads a visited page and the app shell with no network', async ({ page, context }) => {
    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
    await page.reload()
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About FormReady')

    await context.setOffline(true)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About FormReady')

    await page.goto('/terms')
    await expect(page.getByRole('link', { name: 'FormReady home' })).toBeVisible()

    await context.setOffline(false)
  })

  test('shows the offline notice when the connection drops', async ({ page, context }) => {
    await page.goto('/')
    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await expect(page.getByRole('status').filter({ hasText: 'You are offline' })).toBeVisible()
    await context.setOffline(false)
  })
})
