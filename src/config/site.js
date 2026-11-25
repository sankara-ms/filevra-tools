const rawSiteUrl = typeof import.meta.env?.VITE_SITE_URL === 'string' ? import.meta.env.VITE_SITE_URL : ''

export const SITE_NAME = 'Filevra'
export const SITE_TAGLINE = 'Every file, ready to upload.'
export const SITE_URL = (rawSiteUrl || 'https://filevra.app').replace(/\/+$/, '')
export const CONTACT_EMAIL =
  typeof import.meta.env?.VITE_CONTACT_EMAIL === 'string' ? import.meta.env.VITE_CONTACT_EMAIL.trim() : ''
export const OG_IMAGE = `${SITE_URL}/icons/og-image.png`

export const adsConfig = {
  client: (import.meta.env?.VITE_ADSENSE_CLIENT || '').trim(),
  slots: {
    content: (import.meta.env?.VITE_ADSENSE_SLOT_CONTENT || '').trim(),
    result: (import.meta.env?.VITE_ADSENSE_SLOT_RESULT || '').trim(),
  },
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized === '/' ? '/' : normalized.replace(/\/+$/, '')}`
}
