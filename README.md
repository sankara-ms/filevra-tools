# FormReady

**Prepare Your Files. Ready to Go.**

FormReady is a free, browser-based utility site for preparing images and PDFs for online forms, applications and document uploads. Every tool runs entirely in the visitor's browser: files are never uploaded to a server, stored in a database, or sent to an analytics service.

## Tools

| Tool | Route | What it does |
| --- | --- | --- |
| Image Compressor | `/image-compressor` | Reduces a JPEG or PNG toward a target kilobyte size |
| Photo and Signature Resizer | `/photo-signature-resizer` | Resizes to exact pixel dimensions with an optional aspect lock and KB cap |
| Image to PDF | `/image-to-pdf` | Combines images into a single PDF with reorder and remove |
| PDF Merger | `/merge-pdf` | Joins several PDFs in the chosen order |
| PDF Compressor | `/compress-pdf` | Rasterises pages with quality and resolution control and reports the real size change |

Two original guides explain how to prepare images and PDFs for upload:

- `/image-preparation-guide`
- `/pdf-preparation-guide`

## Stack

- React 18 with React Router 6
- Vite 8 plus `vite-react-ssg` for static prerendering (one HTML file per route)
- Bootstrap 5 with a small custom design-token layer
- `pdf-lib` for PDF writing and `pdfjs-dist` for PDF rasterising
- `vite-plugin-pwa` with a hand-written Workbox service worker
- Playwright end-to-end tests and Vitest unit tests

All processing happens with browser APIs (Canvas, `createImageBitmap`, object URLs), so the site can be hosted as static files and works offline after the first visit.

## Local development

Requires Node 20 or newer.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # prerendered production build in dist/
npm run preview      # serves the build on http://127.0.0.1:4173
```

The build runs `scripts/generate-sitemap.mjs` first, which writes `public/sitemap.xml` from the shared route metadata in `src/config/pages.js`.

## Tests

```bash
npm run lint         # ESLint
npm run test         # Vitest unit tests for the pure helpers
npm run test:e2e     # Playwright; builds and previews the site automatically
npm run test:live    # Playwright smoke test against a deployed URL (set LIVE_URL)
```

The Playwright suite generates its own image and PDF fixtures at run time (`tests/e2e/global-setup.js`), so no binary test files are committed. The `chromium` project covers all specs, the `mobile` project re-runs the responsive spec on a Pixel 7 viewport, and the `live` project only runs when `LIVE_URL` is set.

## Environment variables

Copy `.env.example` to `.env` for local work. All values are public build-time values; never put secrets in `VITE_*` variables.

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical origin used for canonical tags, Open Graph and the sitemap. Defaults to `https://formready-tools.pages.dev`. |
| `VITE_CONTACT_EMAIL` | Address shown on `/contact`. When empty, the page hides the address and points to the public issue tracker. |
| `VITE_ADSENSE_CLIENT` | AdSense publisher ID (`ca-pub-…`). Ads and the consent notice stay disabled while empty. |
| `VITE_ADSENSE_SLOT_CONTENT` | Ad slot ID for in-content placements. |
| `VITE_ADSENSE_SLOT_RESULT` | Ad slot ID reserved for post-result placements. |

## Deployment

The site is a static bundle. Cloudflare Pages settings:

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- Node version: 20 or newer (set `NODE_VERSION` if the default differs)

See `docs/deployment.md` for the full checklist, environment variables and verification steps. Clean URLs work because each route is prerendered as a flat `route.html` file and Cloudflare Pages maps `/route` to it automatically. `public/404.html` is served for unknown paths and `public/_headers` sets security and cache headers.

## Project structure

```
src/
  app/            router and route table
  components/     layout, upload, queue, result, SEO, ad slot, consent
  config/         site constants, page metadata, tool catalogue
  hooks/          online status and shared hooks
  pages/          one folder per route
  services/       consent storage and ad script loader
  styles/         design tokens and component styles
  sw.js           Workbox service worker
  tools/          pure browser tools (compress, resize, PDF merge, PDF compress, encode)
public/           manifest, icons, robots.txt, sitemap.xml, 404.html, _headers
scripts/          sitemap and icon generators
tests/            unit and end-to-end tests
docs/             SEO, Search Console, AdSense, deployment and reporting docs
```

## Privacy

- Files are processed locally and never uploaded.
- Documents are never written to `localStorage`, `IndexedDB` or the cache.
- Object URLs are revoked when a file is removed or a tool is reset.
- Uploaded files are treated as data only; their contents are never executed.
- The service worker caches only the application shell. Documents and advertising scripts are never cached.
- AdSense is opt-in and loads only after an explicit consent choice.

The full policy is at `/privacy-policy`.

## License

MIT. See [`LICENSE`](LICENSE).
