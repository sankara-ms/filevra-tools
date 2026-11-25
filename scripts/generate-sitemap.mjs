import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAGES } from '../src/config/pages.js'
import { SITE_URL as CONFIGURED_SITE_URL } from '../src/config/site.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const siteUrl = (process.env.SITE_URL || CONFIGURED_SITE_URL).replace(/\/+$/, '')
const today = new Date().toISOString().slice(0, 10)

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const urls = PAGES.map((page) => {
  const loc = page.path === '/' ? `${siteUrl}/` : `${siteUrl}${page.path}`
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>${page.changefreq}</changefreq>`,
    `    <priority>${page.priority}</priority>`,
    '  </url>',
  ].join('\n')
}).join('\n')

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urls,
  '</urlset>',
  '',
].join('\n')

const output = resolve(__dirname, '../public/sitemap.xml')
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, xml, 'utf8')
console.log(`sitemap.xml written for ${PAGES.length} pages at ${siteUrl}`)
