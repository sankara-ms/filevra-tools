import { expect, test } from '@playwright/test'
import { collectErrors } from './helpers/fixtures'

const ROUTES = [
  { path: '/', title: /Free Image and PDF Tools/, heading: 'Prepare Your Images and Documents in Seconds' },
  { path: '/tools', title: /All Tools/, heading: 'Every Filevra tool in one place' },
  { path: '/workflow', title: /Workflow Builder/, heading: 'Chain several file steps into one run' },
  { path: '/jpg-to-pdf', title: /JPG to PDF/, heading: 'JPG to PDF' },
  { path: '/case-converter', title: /Case Converter/, heading: 'Case Converter' },
  { path: '/image-compressor', title: /Image Compressor/, heading: 'Compress images to a target file size' },
  { path: '/photo-signature-resizer', title: /Photo and Signature Resizer/, heading: 'Resize a photo or signature to exact pixel dimensions' },
  { path: '/image-to-pdf', title: /Image to PDF/, heading: 'Convert images to a single PDF' },
  { path: '/merge-pdf', title: /Merge PDF Files Online/, heading: 'Merge PDF files into one document' },
  { path: '/compress-pdf', title: /Compress PDF Online/, heading: 'Compress a PDF file' },
  { path: '/image-preparation-guide', title: /Image Preparation Guide/, heading: 'Image preparation guide' },
  { path: '/pdf-preparation-guide', title: /PDF Preparation Guide/, heading: 'PDF preparation guide' },
  { path: '/about', title: /About Filevra/, heading: 'About Filevra' },
  { path: '/contact', title: /Contact Filevra/, heading: 'Contact Filevra' },
  { path: '/privacy-policy', title: /Privacy Policy/, heading: 'Privacy Policy' },
  { path: '/terms', title: /Terms and Conditions/, heading: 'Terms and Conditions' },
]

test.describe('navigation and page metadata', () => {
  for (const route of ROUTES) {
    test(`${route.path} renders a unique heading, title and canonical URL`, async ({ page }) => {
      const errors = collectErrors(page)
      const response = await page.goto(route.path)
      expect(response?.status()).toBe(200)

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.heading)
      await expect(page).toHaveTitle(route.title)

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical).toBe(`https://filevra.app${route.path === '/' ? '/' : route.path}`)

      const description = await page.locator('meta[name="description"]').getAttribute('content')
      expect(description?.length ?? 0).toBeGreaterThan(40)

      expect(errors).toEqual([])
    })
  }

  test('every public page is reachable from the footer', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    for (const name of ['Image Compressor', 'Photo and Signature Resizer', 'Image to PDF', 'PDF Merger', 'PDF Compressor']) {
      await expect(footer.getByRole('link', { name, exact: true })).toBeVisible()
    }
    for (const name of ['About', 'Contact', 'Privacy Policy', 'Terms and Conditions']) {
      await expect(footer.getByRole('link', { name, exact: true })).toBeVisible()
    }
  })

  test('unknown routes render the not-found page', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/')
    // The router only listens after hydration, so nudge it until it reacts.
    await expect
      .poll(
        async () => {
          await page.evaluate(() => {
            if (window.location.pathname !== '/this-page-does-not-exist') {
              window.history.pushState({}, '', '/this-page-does-not-exist')
            }
            window.dispatchEvent(new PopStateEvent('popstate'))
          })
          return page
            .getByRole('heading', { level: 1 })
            .innerText()
            .catch(() => '')
        },
        { timeout: 15000 },
      )
      .toBe('We could not find that page')
    await expect(page.getByRole('link', { name: 'Go to the homepage' })).toBeVisible()
    expect(errors).toEqual([])

    const staticFallback = await page.request.get('/404.html')
    expect(staticFallback.status()).toBe(200)
    expect(await staticFallback.text()).toContain('Page not found')
  })

  test('sitemap and robots are served', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    const xml = await sitemap.text()
    expect(xml).toContain('<urlset')
    expect(xml).toContain('https://filevra.app/image-compressor')

    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    const robotsText = await robots.text()
    expect(robotsText).toContain('Sitemap: https://filevra.app/sitemap.xml')
    expect(robotsText).toContain('Disallow: /usage')
    expect(robotsText).toContain('Disallow: /api/')
  })
})
