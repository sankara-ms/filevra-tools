import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { fixture } from './helpers/fixtures'
import { makeDocx, makePptx, makeXlsx, makeZip } from './helpers/office'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function bufferFile(name, mimeType, buffer) {
  return { name, mimeType, buffer }
}

async function runTool(page) {
  await page.getByTestId('run-tool').click()
  const card = page.getByTestId('result-card')
  await expect(card).toBeVisible({ timeout: 40_000 })
  return card
}

async function downloadFrom(page, card, name = 'Download') {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    card.getByRole('button', { name, exact: true }).first().click(),
  ])
  return download
}

test.describe('image tools', () => {
  test('converts PNG to WebP and downloads a real WebP file', async ({ page }) => {
    await page.goto('/image-converter')
    await page.setInputFiles('[data-testid="image-converter-dropzone-input"]', fixture('gradient.png'))
    await page.selectOption('#image-converter-format-0', 'webp')
    const card = await runTool(page)

    const download = await downloadFrom(page, card)
    expect(download.suggestedFilename()).toMatch(/\.webp$/)
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('RIFF')
    expect(bytes.subarray(8, 12).toString('latin1')).toBe('WEBP')
  })

  test('resizes an image and keeps a working PNG', async ({ page }) => {
    await page.goto('/image-resizer')
    await page.setInputFiles('[data-testid="image-resizer-dropzone-input"]', fixture('gradient.png'))
    await page.fill('#image-resizer-maxWidth-1', '120')
    const card = await runTool(page)

    const download = await downloadFrom(page, card)
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG')
  })
})

test.describe('PDF tools', () => {
  test('splits a PDF into a smaller PDF', async ({ page }) => {
    await page.goto('/split-pdf')
    await page.setInputFiles('[data-testid="split-pdf-dropzone-input"]', fixture('doc-a.pdf'))
    const card = await runTool(page)

    await expect(card.locator('.fr-output-item')).toHaveCount(1)
    const download = await downloadFrom(page, card)
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })

  test('renders a PDF page as a JPG', async ({ page }) => {
    await page.goto('/pdf-to-jpg')
    await page.setInputFiles('[data-testid="pdf-to-jpg-dropzone-input"]', fixture('doc-a.pdf'))
    const card = await runTool(page)

    const download = await downloadFrom(page, card)
    expect(download.suggestedFilename()).toMatch(/\.jpg$/)
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 2).toString('hex')).toBe('ffd8')
  })

  test('stamps a watermark and page numbers without breaking the PDF', async ({ page }) => {
    await page.goto('/pdf-watermark')
    await page.setInputFiles('[data-testid="pdf-watermark-dropzone-input"]', fixture('doc-a.pdf'))
    const card = await runTool(page)
    const download = await downloadFrom(page, card)
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')

    await page.goto('/pdf-page-numbers')
    await page.setInputFiles('[data-testid="pdf-page-numbers-dropzone-input"]', fixture('doc-a.pdf'))
    const numbered = await runTool(page)
    const numberedDownload = await downloadFrom(page, numbered)
    const numberedBytes = fs.readFileSync(await numberedDownload.path())
    expect(numberedBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })
})

test.describe('document tools', () => {
  test('turns pasted text into a PDF', async ({ page }) => {
    await page.goto('/txt-to-pdf')
    await page.setInputFiles(
      '[data-testid="txt-to-pdf-dropzone-input"]',
      bufferFile('note.txt', 'text/plain', Buffer.from('Hello from Filevra.\nSecond line.')),
    )
    const card = await runTool(page)
    const download = await downloadFrom(page, card)
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })

  test('converts Markdown into a sanitised HTML page', async ({ page }) => {
    await page.goto('/markdown-to-html')
    await page.setInputFiles(
      '[data-testid="markdown-to-html-dropzone-input"]',
      bufferFile('readme.md', 'text/markdown', Buffer.from('# Heading\n\nSome **bold** text.')),
    )
    const card = await runTool(page)
    await expect(card.locator('.fr-preview-html h1')).toHaveText('Heading')

    const download = await downloadFrom(page, card)
    expect(download.suggestedFilename()).toMatch(/\.html$/)
    const html = fs.readFileSync(await download.path(), 'utf8')
    expect(html).toContain('<strong>bold</strong>')
  })

  test('extracts text from a DOCX file', async ({ page }) => {
    await page.goto('/docx-to-text')
    await page.setInputFiles(
      '[data-testid="docx-to-text-dropzone-input"]',
      bufferFile('letter.docx', DOCX_MIME, await makeDocx('Filevra docx fixture')),
    )
    const card = await runTool(page)
    await expect(card.getByTestId('tool-text-output')).toContainText('Filevra docx fixture')
  })

  test('extracts slide text from a PPTX file', async ({ page }) => {
    await page.goto('/pptx-to-text')
    await page.setInputFiles(
      '[data-testid="pptx-to-text-dropzone-input"]',
      bufferFile('deck.pptx', PPTX_MIME, await makePptx('Slide title')),
    )
    const card = await runTool(page)
    await expect(card.getByTestId('tool-text-output')).toContainText('Slide title')
  })
})

test.describe('spreadsheet tools', () => {
  test('converts CSV to JSON', async ({ page }) => {
    await page.goto('/csv-to-json')
    await page.setInputFiles(
      '[data-testid="csv-to-json-dropzone-input"]',
      bufferFile('people.csv', 'text/csv', Buffer.from('name,count\nalpha,1\nbeta,2')),
    )
    const card = await runTool(page)
    const download = await downloadFrom(page, card)
    const json = JSON.parse(fs.readFileSync(await download.path(), 'utf8'))
    expect(json).toEqual([
      { name: 'alpha', count: 1 },
      { name: 'beta', count: 2 },
    ])
  })

  test('converts XLSX to CSV', async ({ page }) => {
    await page.goto('/xlsx-to-csv')
    await page.setInputFiles(
      '[data-testid="xlsx-to-csv-dropzone-input"]',
      bufferFile('sheet.xlsx', XLSX_MIME, makeXlsx()),
    )
    const card = await runTool(page)
    const download = await downloadFrom(page, card)
    expect(download.suggestedFilename()).toMatch(/\.csv$/)
    const csv = fs.readFileSync(await download.path(), 'utf8')
    expect(csv).toContain('alpha,1')
  })
})

test.describe('text and file tools', () => {
  test('formats JSON', async ({ page }) => {
    await page.goto('/json-formatter')
    await page.getByTestId('tool-text-input').fill('{"a":1,"b":[2,3]}')
    const card = await runTool(page)
    await expect(card.getByTestId('tool-text-output')).toContainText('"a": 1')
  })

  test('encodes and decodes Base64', async ({ page }) => {
    await page.goto('/base64-encoder')
    await page.getByTestId('tool-text-input').fill('Filevra test')
    const encoded = await runTool(page)
    await expect(encoded.getByTestId('tool-text-output')).toHaveText('RmlsZXZyYSB0ZXN0')

    await page.goto('/base64-decoder')
    await page.getByTestId('tool-text-input').fill('RmlsZXZyYSB0ZXN0')
    const decoded = await runTool(page)
    await expect(decoded.getByTestId('tool-text-output')).toHaveText('Filevra test')
  })

  test('minifies JavaScript in the browser', async ({ page }) => {
    await page.goto('/code-minifier')
    const source = 'function add(a, b) {\n  return a + b;\n}\nconsole.log(add(1, 2));\n'
    await page.getByTestId('tool-text-input').fill(source)
    const card = await runTool(page)
    const output = await card.getByTestId('tool-text-output').textContent()
    expect(output.length).toBeLessThan(source.length)
    expect(output).toContain('console.log')
  })

  test('counts words and characters', async ({ page }) => {
    await page.goto('/word-counter')
    await page.getByTestId('tool-text-input').fill('one two three four five.')
    const card = await runTool(page)
    await expect(card.locator('.fr-info-row', { hasText: 'Words' })).toContainText('5')
  })

  test('compares two texts and reports the differences', async ({ page }) => {
    await page.goto('/text-compare')
    await page.getByTestId('tool-text-left').fill('alpha\nbeta')
    await page.getByTestId('tool-text-right').fill('alpha\ngamma')
    const card = await runTool(page)
    await expect(card).toContainText('The texts differ.')
    await expect(card.getByTestId('tool-text-output')).toContainText('gamma')
  })

  test('hashes a file with SHA-256', async ({ page }) => {
    await page.goto('/sha256-hash')
    await page.setInputFiles('[data-testid="sha256-hash-dropzone-input"]', fixture('gradient.png'))
    const card = await runTool(page)
    await expect(card.getByTestId('tool-text-output')).toHaveText(/^[0-9a-f]{64}\s+gradient\.png$/)
  })

  test('generates a QR code PNG', async ({ page }) => {
    await page.goto('/qr-code-generator')
    await page.getByTestId('tool-text-input').fill('https://filevra.app')
    const card = await runTool(page)
    await expect(card.locator('.fr-preview img')).toBeVisible()
    const download = await downloadFrom(page, card)
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 4).toString('hex')).toBe('89504e47')
  })

  test('generates a barcode PNG', async ({ page }) => {
    await page.goto('/barcode-generator')
    await page.getByTestId('tool-text-input').fill('Filevra123')
    const card = await runTool(page)
    const download = await downloadFrom(page, card)
    const bytes = fs.readFileSync(await download.path())
    expect(bytes.subarray(0, 4).toString('hex')).toBe('89504e47')
  })

  test('renames files and extracts ZIP contents', async ({ page }) => {
    await page.goto('/file-renamer')
    await page.setInputFiles('[data-testid="file-renamer-dropzone-input"]', [
      fixture('gradient.png'),
      fixture('noise.png'),
    ])
    const renamed = await runTool(page)
    await expect(renamed.locator('.fr-output-item')).toHaveCount(2)
    await expect(renamed.locator('.fr-output-list')).toContainText('gradient-01.png')
    await expect(renamed.locator('.fr-output-list')).toContainText('noise-02.png')

    await page.goto('/zip-extractor')
    await page.setInputFiles(
      '[data-testid="zip-extractor-dropzone-input"]',
      bufferFile('bundle.zip', 'application/zip', await makeZip()),
    )
    const extracted = await runTool(page)
    await expect(extracted.locator('.fr-output-item')).toHaveCount(2)
    await expect(extracted.locator('.fr-output-list')).toContainText('notes.txt')
    await expect(extracted.locator('.fr-output-list')).toContainText('data.json')
  })
})
