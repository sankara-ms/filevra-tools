// Route metadata shared by the router, sitemap generator and tests.
import { TOOLS } from './toolRegistry.js'

const STATIC_PAGES = [
  { path: '/', title: 'Filevra - Free Image and PDF Tools', changefreq: 'weekly', priority: '1.0' },
  { path: '/tools', title: 'All Filevra Tools', changefreq: 'weekly', priority: '0.9' },
  { path: '/workflow', title: 'File Workflow Builder', changefreq: 'monthly', priority: '0.8' },
  {
    path: '/image-preparation-guide',
    title: 'Image Preparation Guide - Size, Pixels and Compression',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/pdf-preparation-guide',
    title: 'PDF Preparation Guide - Merging and Compression',
    changefreq: 'monthly',
    priority: '0.7',
  },
  { path: '/about', title: 'About Filevra', changefreq: 'yearly', priority: '0.5' },
  { path: '/contact', title: 'Contact Filevra', changefreq: 'yearly', priority: '0.5' },
  { path: '/privacy-policy', title: 'Privacy Policy', changefreq: 'yearly', priority: '0.4' },
  { path: '/terms', title: 'Terms and Conditions', changefreq: 'yearly', priority: '0.4' },
]

const TOOL_PAGES = TOOLS.map((tool) => ({
  path: tool.path,
  title: tool.seoTitle || `${tool.name} - Free Browser Tool`,
  changefreq: 'monthly',
  priority: tool.popular ? '0.8' : '0.7',
}))

export const PAGES = [
  STATIC_PAGES[0],
  STATIC_PAGES[1],
  ...TOOL_PAGES,
  STATIC_PAGES[2],
  ...STATIC_PAGES.slice(3),
]
