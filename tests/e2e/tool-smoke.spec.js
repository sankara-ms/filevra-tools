import { expect, test } from '@playwright/test'
import { GENERIC_TOOLS } from '../../src/config/toolRegistry.js'

const CATEGORIES = [...new Set(GENERIC_TOOLS.map((tool) => tool.category))]

for (const category of CATEGORIES) {
  const tools = GENERIC_TOOLS.filter((tool) => tool.category === category)

  test(`every ${category} tool page renders its workspace cleanly`, async ({ page }) => {
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    for (const tool of tools) {
      const response = await page.goto(tool.path)
      expect(response?.status(), tool.path).toBe(200)
      await expect(page.getByRole('heading', { level: 1 }), tool.path).toHaveText(tool.name)
      await expect(page.locator('link[rel="canonical"]'), tool.path).toHaveAttribute(
        'href',
        `https://filevra-tools.pages.dev${tool.path}`,
      )
      await expect(page.getByTestId('run-tool'), tool.path).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(errors.splice(0), `${tool.path} logged console errors`).toEqual([])
    }
  })
}
