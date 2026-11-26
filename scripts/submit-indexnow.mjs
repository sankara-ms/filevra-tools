import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL as CONFIGURED_SITE_URL } from '../src/config/site.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const siteUrl = (process.env.SITE_URL || CONFIGURED_SITE_URL).replace(/\/+$/, '')
const host = new URL(siteUrl).host

const keyFile = readdirSync(resolve(__dirname, '../public')).find((name) => /^[a-f0-9]{32}\.txt$/.test(name))
if (!keyFile) {
  console.error('No IndexNow key file found in public/. Expected a 32-character hex name such as <key>.txt.')
  process.exit(1)
}
const key = keyFile.replace(/\.txt$/, '')

const sitemap = await fetch(`${siteUrl}/sitemap.xml`)
if (!sitemap.ok) {
  console.error(`Could not read ${siteUrl}/sitemap.xml (HTTP ${sitemap.status}).`)
  process.exit(1)
}
const urlList = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `${siteUrl}/${keyFile}`, urlList }),
})

console.log(`Submitted ${urlList.length} URLs for ${host}: HTTP ${response.status}`)
if (response.status >= 300) {
  console.error(await response.text())
  process.exit(1)
}
