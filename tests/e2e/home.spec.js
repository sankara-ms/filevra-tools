import { expect, test } from '@playwright/test'

test.describe('homepage', () => {
  test('renders the hero, popular tools and the static facts', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Filevra/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Prepare Your Images and Documents in Seconds',
    )
    await expect(page.locator('[data-testid^="tool-card-"]')).toHaveCount(8)
    await expect(page.getByRole('heading', { name: 'Popular tools' })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://filevra.app/',
    )
  })

  test('filters tools by name, description and keywords', async ({ page }) => {
    await page.goto('/')
    const search = page.getByTestId('tool-search')
    const cards = page.locator('[data-testid^="tool-card-"]')

    await search.fill('signature')
    await expect(page.getByTestId('tool-card-photo-signature-resizer')).toBeVisible()
    expect(await cards.count()).toBeLessThan(8)

    await search.fill('pdf')
    expect(await cards.count()).toBeGreaterThan(8)

    await search.fill('nothing-matches-this')
    await expect(page.getByTestId('search-empty')).toBeVisible()
    await page.getByTestId('search-empty').getByRole('button', { name: 'Clear search' }).click()
    await expect(cards).toHaveCount(8)
  })

  test('opens a tool card and returns home through the brand link', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('tool-card-image-compressor').click()
    await expect(page).toHaveURL(/\/image-compressor$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Compress/i)

    await page.getByRole('link', { name: 'Filevra home' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('navigates to About and Contact through the header', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/About Filevra/i)

    await page.getByRole('contentinfo').getByRole('link', { name: 'Contact' }).click()
    await expect(page).toHaveURL(/\/contact$/)
  })
})
