import { expect, test } from '@playwright/test'
import { collectErrors } from './helpers/fixtures'

const ROUTES = [
  { path: '/', title: /Free Image and PDF Tools/, heading: 'Prepare Your Images and Documents in Seconds' },
  { path: '/image-compressor', title: /Image Compressor/, heading: 'Compress an image to a target file size' },
  { path: '/photo-signature-resizer', title: /Photo and Signature Resizer/, heading: 'Resize a photo or signature to exact pixel dimensions' },
  { path: '/image-to-pdf', title: /Image to PDF/, heading: 'Convert images to a single PDF' },
  { path: '/merge-pdf', title: /Merge PDF Files Online/, heading: 'Merge PDF files into one document' },
  { path: '/compress-pdf', title: /Compress PDF Online/, heading: 'Compress a PDF file' },
  { path: '/image-preparation-guide', title: /Image Preparation Guide/, heading: 'Image preparation guide' },
  { path: '/pdf-preparation-guide', title: /PDF Preparation Guide/, heading: 'PDF preparation guide' },
  { path: '/about', title: /About FormReady/, heading: 'About FormReady' },
  { path: '/contact', title: /Contact FormReady/, heading: 'Contact FormReady' },
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
      expect(canonical).toBe(`https://formready-tools.pages.dev${route.path === '/' ? '/' : route.path}`)

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
    await page.evaluate(() => {
      window.history.pushState({}, '', '/this-page-does-not-exist')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('We could not find that page')
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
    expect(xml).toContain('https://formready-tools.pages.dev/image-compressor')

    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain('Sitemap: https://formready-tools.pages.dev/sitemap.xml')
  })
})
