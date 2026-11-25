import { chromium } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const targets = [
  { source: 'public/icons/icon.svg', output: 'public/icons/icon-192.png', size: 192, transparent: true },
  { source: 'public/icons/icon.svg', output: 'public/icons/icon-512.png', size: 512, transparent: true },
  { source: 'public/icons/maskable.svg', output: 'public/icons/maskable-512.png', size: 512, transparent: false },
  { source: 'public/icons/maskable.svg', output: 'public/icons/apple-touch-icon.png', size: 180, transparent: false },
  { source: 'public/icons/icon.svg', output: 'public/icons/favicon-32.png', size: 32, transparent: true },
]

await mkdir(resolve(root, 'public/icons'), { recursive: true })

const browser = await chromium.launch()

for (const target of targets) {
  const page = await browser.newPage({
    viewport: { width: target.size, height: target.size },
    deviceScaleFactor: 1,
  })
  const svg = await readFile(resolve(root, target.source), 'utf8')
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:${target.size}px;height:${target.size}px}</style>${svg}`,
  )
  await page.screenshot({
    path: resolve(root, target.output),
    omitBackground: target.transparent,
  })
  await page.close()
  console.log(`wrote ${target.output} (${target.size}x${target.size})`)
}

const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await ogPage.setContent(`<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body {
    margin: 0; width: 1200px; height: 630px; padding: 72px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #101a2a; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between;
  }
  .brand { display: flex; align-items: center; gap: 18px; font-size: 34px; font-weight: 700; letter-spacing: -0.02em; }
  h1 { font-size: 62px; line-height: 1.08; letter-spacing: -0.035em; margin: 0; max-width: 900px; }
  p { color: #b9c7d8; font-size: 26px; margin: 0; }
  .chips { display: flex; gap: 14px; }
  .chip { border: 1px solid #2c3e55; border-radius: 999px; padding: 10px 20px; font-size: 22px; color: #cfe0f7; }
  .accent { color: #6fa8ff; }
</style></head>
<body>
  <div class="brand">
    <svg width="56" height="56" viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#1f5fbf"/>
      <path d="M150 120h150l76 76v180a28 28 0 0 1-28 28H150a28 28 0 0 1-28-28V148a28 28 0 0 1 28-28z" fill="#fff"/>
      <path d="M186 250h124M186 300h92" stroke="#1f5fbf" stroke-width="22" stroke-linecap="round"/>
      <circle cx="352" cy="352" r="74" fill="#1c7d54"/>
      <path d="M316 352l25 25 46-50" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Filevra</span>
  </div>
  <h1>Prepare your images and documents <span class="accent">in seconds</span></h1>
  <div>
    <p style="margin-bottom: 26px">Free browser tools. Nothing uploaded. Works offline.</p>
    <div class="chips">
      <span class="chip">Compress images</span>
      <span class="chip">Resize photos</span>
      <span class="chip">Image to PDF</span>
      <span class="chip">Merge PDFs</span>
    </div>
  </div>
</body></html>`)
await ogPage.screenshot({ path: resolve(root, 'public/icons/og-image.png') })
await ogPage.close()

await browser.close()
console.log('wrote public/icons/og-image.png (1200x630)')
