# Filevra

**Every file, ready to upload.**

Filevra is a free, browser-based utility site for preparing images and PDFs for online forms, applications and document uploads. Every tool runs entirely in the visitor's browser: files are never uploaded to a server, stored in a database, or sent to an analytics service.

## Tools

Filevra ships 92 tools, all driven by one data registry (`src/config/toolRegistry.js`). The catalogue at `/tools` is generated from that registry, and every tool gets its own prerendered page.

| Category | Tools | Examples |
| --- | --- | --- |
| PDF | 22 | Split, merge, compress, rotate, watermark, page numbers, protect, unlock, PDF to JPG/PNG/text, metadata |
| Image | 27 | Compressor, resizer, crop, rotate, format converter (PNG/JPG/WebP/BMP/GIF/SVG/ICO), watermark, palette, metadata |
| Document | 11 | TXT/DOCX/Markdown/HTML to PDF, DOCX to HTML/Markdown/text, HTML to Markdown |
| Spreadsheet | 9 | CSV/JSON/XLSX conversion, Excel to PDF, spreadsheet viewer |
| Presentation | 1 | PPTX to text |
| Text and developer | 17 | JSON/XML formatters, Base64, URL encoding, case converter, text compare, hashes, QR and barcode |
| File utilities | 5 | ZIP creator and extractor, file renamer, size checker, type detector |

The five original tools keep their own routes and pages (`/image-compressor`, `/photo-signature-resizer`, `/image-to-pdf`, `/merge-pdf`, `/compress-pdf`). The image compressor accepts a queue of up to 50 files, shows each file's before-and-after size, and can export every finished image as one ZIP.

`/workflow` chains several operations in one run: images or a PDF are uploaded once, steps such as convert → resize → compress are added in order, and the last result is downloaded (multiple files can be saved as one ZIP).

Two original guides explain how to prepare images and PDFs for upload:

- `/image-preparation-guide`
- `/pdf-preparation-guide`

## Stack

- React 18 with React Router 6
- Vite 8 plus `vite-react-ssg` for static prerendering (one HTML file per route)
- Bootstrap 5 with a small custom design-token layer
- `pdf-lib` and `@cantoo/pdf-lib` for PDF writing and encryption, `pdfjs-dist` for PDF rasterising
- `jszip`, `mammoth`, `marked`, `turndown`, `xlsx`, `jspdf`, `html2canvas` for the document, sheet and archive tools
- `qrcode`, `jsbarcode`, `exifr`, `spark-md5`, `terser` (loaded only when their tool runs)
- `vite-plugin-pwa` with a hand-written Workbox service worker
- Playwright end-to-end tests and Vitest unit tests

All processing happens with browser APIs (Canvas, `createImageBitmap`, Web Crypto, object URLs), so the site can be hosted as static files and works offline after the first visit. Heavy libraries are imported lazily when a tool runs, not at startup.

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

The Playwright suite generates its own image, PDF and Office fixtures at run time (`tests/e2e/global-setup.js`), so no binary test files are committed. It includes a smoke test that opens every one of the 92 tool pages and checks the heading, canonical URL, workspace and console output, plus functional runs of representative tools in each category and the workflow builder. The `chromium` project covers all specs, the `mobile` project re-runs the responsive spec on a Pixel 7 viewport, and the `live` project only runs when `LIVE_URL` is set.

## Environment variables

Copy `.env.example` to `.env` for local work. All values are public build-time values; never put secrets in `VITE_*` variables.

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical origin used for canonical tags, Open Graph and the sitemap. Defaults to `https://filevra-tools.pages.dev`. |
| `VITE_CONTACT_EMAIL` | Address shown on `/contact`. When empty, the page hides the address and points to the public issue tracker. |
| `VITE_ADSENSE_CLIENT` | AdSense publisher ID (`ca-pub-…`). Ads and the consent notice stay disabled while empty. |
| `VITE_ADSENSE_SLOT_CONTENT` | Ad slot ID for in-content placements. |
| `VITE_ADSENSE_SLOT_RESULT` | Ad slot ID reserved for post-result placements. |

Server-side values for the usage counter are Pages secrets and variables, not `VITE_*` build values: `USAGE_DB`
(D1 binding), `USAGE_ADMIN_TOKEN`, `USAGE_REPORT_TOKEN`, `USAGE_SALT`, `RESEND_API_KEY`, and optional `USAGE_EMAIL_TO`
and `USAGE_MAIL_FROM`. See `docs/usage-analytics.md`. The site works without them; only counting and the report are
disabled.

## Deployment

The site is a prerendered static bundle, plus Pages Functions for usage counting. It is live at `https://filevra-tools.pages.dev` and deployed by direct upload:

```bash
npm run build
npx wrangler pages deploy dist --project-name filevra-tools
```

`wrangler.toml` pins the output directory and the `USAGE_DB` D1 binding. Node version: 20 or newer.

See `docs/deployment.md` for the full checklist, environment variables and verification steps. Clean URLs work because each route is prerendered as a flat `route.html` file and Cloudflare Pages maps `/route` to it automatically. `public/404.html` is served for unknown paths and `public/_headers` sets security and cache headers.

Pages also deploys the `functions/` directory: `/api/track` records first-party visit and tool-run counts, `/api/usage` serves the passcode-protected `/usage` report, and `/api/report` emails the daily summary. Setup, secrets and verification are in `docs/usage-analytics.md`.

## Project structure

```
src/
  app/            router and route table (custom tools, catalogue, generic tool pages, workflow)
  components/     layout, upload, queue, result, tool runner, SEO, ad slot, consent
  config/         site constants, page metadata, tool registry, workflow operations
  engine/         shared validation, lazy runner groups and per-format runners
  hooks/          online status and shared hooks
  pages/          home, tools catalogue, generic tool page, workflow and static pages
  services/       consent storage and ad script loader
  styles/         design tokens and component styles
  sw.js           Workbox service worker
  tools/          pure browser tools (compress, resize, PDF merge, canvas, ICO encoder)
public/           manifest, icons, robots.txt, sitemap.xml, 404.html, _headers
functions/        Pages Functions: /api/track, /api/usage, /api/report
migrations/       D1 schema for the usage counter
scripts/          sitemap and icon generators
tests/            unit and end-to-end tests
docs/             SEO, Search Console, AdSense, deployment, usage and reporting docs
```

## Privacy

- Files are processed locally and never uploaded.
- Documents are never written to `localStorage`, `IndexedDB` or the cache.
- Object URLs are revoked when a file is removed or a tool is reset.
- Uploaded files are treated as data only; their contents are never executed.
- The service worker caches only the application shell. Documents and advertising scripts are never cached.
- AdSense is opt-in and loads only after an explicit consent choice.
- Visit counting is first-party: page paths and tool names only, no cookies, a salted per-day hash deleted after 35
  days, and never file names or contents.

The full policy is at `/privacy-policy`.

## License

MIT. See [`LICENSE`](LICENSE).
