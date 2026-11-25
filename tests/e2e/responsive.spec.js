import { expect, test } from '@playwright/test'

test.describe('responsive layout', () => {
  test.use({ viewport: { width: 412, height: 915 } })

  test('opens the mobile menu and reaches a tool', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden()
    const toggle = page.getByRole('button', { name: 'Open menu' })
    await expect(toggle).toBeVisible()
    await toggle.click()

    const menu = page.locator('#mobile-menu')
    await expect(menu).toBeVisible()
    await menu.getByRole('link', { name: 'Photo and Signature Resizer' }).click()

    await expect(page).toHaveURL(/\/photo-signature-resizer$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Resize a photo or signature to exact pixel dimensions',
    )
    await expect(page.locator('#mobile-menu')).toHaveCount(0)
  })

  test('has no horizontal overflow on home or tool pages', async ({ page }) => {
    for (const path of ['/', '/image-compressor', '/merge-pdf', '/privacy-policy']) {
      await page.goto(path)
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflows, path).toBeLessThanOrEqual(1)
    }
  })

  test('keeps the upload control usable on a phone', async ({ page }) => {
    await page.goto('/image-compressor')
    const dropzone = page.getByTestId('image-dropzone')
    await expect(dropzone).toBeVisible()
    const box = await dropzone.boundingBox()
    expect(box.width).toBeGreaterThan(200)
    expect(box.height).toBeGreaterThan(100)
  })
})
