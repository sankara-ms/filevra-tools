# Cloudflare Pages deployment

The site is a prerendered static bundle: `npm run build` writes everything to `dist/`. Pages also deploys the `functions/` directory for first-party usage counting (`/api/track`, `/api/usage`, `/api/report`); those functions need a D1 binding and secrets, described in `docs/usage-analytics.md`. Without them the site and all tools still work and only counting is disabled. This document describes the intended deployment and how to verify it. It is written as a checklist; **do not mark a deployment complete until the live checks below actually pass.**

## Current project

| Setting | Value |
| --- | --- |
| Platform | Cloudflare Pages |
| Project name | `filevra-tools` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Site URL | `https://filevra-tools.pages.dev` |
| Functions | `functions/` (uploaded with the deployment) |
| Database binding | `USAGE_DB` → D1 `filevra-usage` (see `wrangler.toml`) |
| Required secrets | `USAGE_ADMIN_TOKEN`, `USAGE_SALT`, `USAGE_REPORT_TOKEN`, plus `RESEND_API_KEY` for the daily email |

`src/config/site.js` defaults to the Pages host, so a plain `npm run build` produces canonical tags, Open Graph URLs, `sitemap.xml` and `robots.txt` for the live address. Override with `VITE_SITE_URL` (bundle) and `SITE_URL` (sitemap script) when a custom domain replaces it. Deployments are direct uploads; there is no Git build on Cloudflare, so pushing to GitHub does not publish the site.

## Option A: Git integration (recommended)

1. Push the repository to GitHub (`sankara-ms/filevra-tools`).
2. In the Cloudflare dashboard open **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorise GitHub and select the repository.
4. Set:
   - Production branch: `main`
   - Framework preset: `Vite` (or `None` with the manual settings below)
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Add environment variables (Production, and Preview if desired):
   - `NODE_VERSION=22` (the project requires Node 20 or newer)
   - `VITE_SITE_URL=https://<final-host>`
   - `VITE_CONTACT_EMAIL=` (leave empty until a public address exists)
   - AdSense variables only after approval; leave empty otherwise
6. Deploy. Wait for the build log to finish successfully.

## Direct upload with Wrangler (the method in use)

```bash
npm run build
npx wrangler pages deploy dist --project-name filevra-tools
```

`wrangler.toml` pins the output directory and the `USAGE_DB` binding so the same command works from any machine. This requires an authenticated Wrangler session (`npx wrangler login`) or a `CLOUDFLARE_API_TOKEN` with Pages permissions. No credentials are stored in this repository.

One-time backend setup:

```bash
npx wrangler d1 create filevra-usage            # copy the id into wrangler.toml
npx wrangler d1 execute filevra-usage --remote --file migrations/0001_usage.sql
npx wrangler pages secret put USAGE_ADMIN_TOKEN --project-name filevra-tools
npx wrangler pages secret put USAGE_SALT        --project-name filevra-tools
npx wrangler pages secret put USAGE_REPORT_TOKEN --project-name filevra-tools
npx wrangler pages secret put RESEND_API_KEY    --project-name filevra-tools   # for the daily email
```

Secrets are typed at the prompt (or piped on stdin); never put them in `wrangler.toml`, `.env` files or commits.

## What Cloudflare Pages handles automatically

- **Clean URLs**: the build prerenders `about.html`, `image-compressor.html`, and so on. Pages maps `/about` to `about.html` without a redirect. There is no SPA fallback serving `index.html` for unknown routes, which keeps 404 responses honest.
- **404 page**: `public/404.html` is served with a 404 status for unmatched paths.
- **Headers**: `public/_headers` sets security headers (nosniff, frame denial, referrer policy, permissions policy, HSTS), long-lived immutable caching for `/assets/*`, `no-cache` for `/sw.js`, and the manifest content type.
- **Compression**: Pages compresses text assets at the edge.

## Environment variables and rebuilds

`VITE_*` values are baked in at build time. Changing one requires a new deployment, not just a dashboard edit:

```bash
# after changing variables in the Pages dashboard
# Deployments → Retry deployment (or push an empty commit)
```

If a custom domain is added later:

1. Add the domain in Pages → Custom domains and complete DNS.
2. Set `VITE_SITE_URL=https://<custom-domain>` and redeploy.
3. Re-check canonical tags, Open Graph URLs and `sitemap.xml`.
4. Add the new property in Search Console and submit the sitemap again.

## Verification after deployment

Run these in order and record the results. Replace `<host>` with the real deployed origin.

1. **HTTP checks** — every public route returns 200:
   `/`, `/image-compressor`, `/photo-signature-resizer`, `/image-to-pdf`, `/merge-pdf`, `/compress-pdf`, `/image-preparation-guide`, `/pdf-preparation-guide`, `/about`, `/contact`, `/privacy-policy`, `/terms`, `/usage`.
2. **Error page** — `/this-page-does-not-exist` returns **404** and shows the Filevra not-found page.
3. **Assets** — `/manifest.json`, `/sw.js`, `/sitemap.xml`, `/robots.txt` return 200; the manifest is served as `application/manifest+json`.
4. **Metadata** — view source on two pages: unique `<title>`, description, canonical matching the deployed host, and valid JSON-LD.
5. **PWA** — install on desktop and on an Android device; confirm the icon and name. Disable the network and reload a visited page; it must render from the shell and the offline notice must appear where applicable.
6. **Tools** — run each of the five tools once with a harmless test file: compress, resize, image→PDF, merge, PDF compress. Confirm downloads open and the reported sizes are truthful.
7. **Mobile** — open the site on a phone; the menu works and no horizontal scrolling appears.
8. **Automated live smoke test**:
   ```bash
   LIVE_URL=https://<host> npm run test:live
   ```
   On Windows Git Bash use `LIVE_URL=https://<host> npx playwright test --project=live`.
9. **GitHub Actions** — set the repository variable `LIVE_URL=https://<host>` so the weekly live smoke workflow runs. Actions → Live smoke test → Run workflow to confirm.
10. **Usage counting** — complete `docs/usage-analytics.md`, then confirm `POST /api/track` returns 204, `/usage` accepts `USAGE_ADMIN_TOKEN`, and `/api/report` returns `{"sent":true}`. Until the D1 binding and secrets exist, these endpoints return 503 by design and the tools are unaffected.

### Last verified: 2026-11-26 against `https://filevra-tools.pages.dev`

- Routes `/`, `/tools`, `/image-compressor`, `/usage`, `/robots.txt`, `/sitemap.xml` → 200; canonical and sitemap use the Pages host.
- `POST /api/track` with a same-origin `Origin` → 204 and the row appears in the report; with a foreign origin → 403.
- `/api/usage` without or with a wrong passcode → 401; with `USAGE_ADMIN_TOKEN` → JSON totals.
- `/api/report` → 503 until `RESEND_API_KEY` exists; the daily email is therefore not active yet.
- `/usage` in a browser: prerendered with `noindex`, passcode gate opens the report, live counts visible.

## Rollback

Pages keeps previous deployments. To roll back, open **Deployments** and choose **Rollback** on the last known-good deployment. This does not rewrite Git history.

## Honesty notes

- A green local build is not a deployment.
- Do not report a live URL until the verification above has been run against it.
- Do not store Cloudflare tokens in the repository, in `.env`, or in commit messages.
