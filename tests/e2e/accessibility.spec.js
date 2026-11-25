import { expect, test } from '@playwright/test'

const PAGES = ['/', '/image-compressor', '/merge-pdf', '/compress-pdf', '/about', '/privacy-policy', '/terms']

test.describe('accessibility basics', () => {
  for (const path of PAGES) {
    test(`${path} exposes one h1, a main landmark and the skip link`, async ({ page }) => {
      await page.goto(path)

      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBe(1)

      await expect(page.locator('main#main-content')).toBeVisible()
      await expect(page.locator('a.fr-skip-link[href="#main-content"]')).toHaveCount(1)

      const unnamedImages = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img')).filter((img) => !img.hasAttribute('alt')).length,
      )
      expect(unnamedImages).toBe(0)
    })
  }

  test('interactive controls expose accessible names', async ({ page }) => {
    await page.goto('/image-compressor')
    const unnamed = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button'))
        .filter((button) => !button.textContent.trim() && !button.getAttribute('aria-label'))
        .map((button) => button.outerHTML.slice(0, 120)),
    )
    expect(unnamed).toEqual([])
  })

  test('the skip link moves focus into the page', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.className)
    expect(focused).toContain('fr-skip-link')
  })
})
