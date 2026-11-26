# Google Search Console setup

Do this only after the site is actually deployed and the production URL is verified. Search Console verifies that you control the host, so it cannot be completed against a local build.

## 1. Choose the property type

Two options exist:

- **URL prefix property** — enter the exact origin, for example `https://filevra-tools.pages.dev`. Easier to verify for a `pages.dev` host and enough for sitemap submission.
- **Domain property** — covers every subdomain and protocol. Requires a DNS TXT record, so it only makes sense once a custom domain is delegated to Cloudflare.

Start with a URL prefix property. Add a domain property later if a custom domain is introduced.

## 2. Verify ownership

### Option A: HTML file (recommended for `pages.dev`)

1. In Search Console, download the verification file (it looks like `google1a2b3c….html`).
2. Place it in `public/` so Vite copies it to the root of `dist/`.
3. Commit and deploy. Confirm `https://<host>/google1a2b3c….html` returns 200.
4. Click **Verify** in Search Console.

Do not rename the file and do not add it to `.gitignore`; Search Console re-checks it periodically and removes the property if it disappears.

### Option B: HTML meta tag

1. Copy the `<meta name="google-site-verification" …>` tag.
2. Add it to the document head. With prerendering, adding it to `index.html` alone is not reliable because Helmet controls the head at build time. Add it to the shared head source instead (for example `SEO.jsx` or a small dedicated component) so every prerendered page includes it.
3. Deploy and verify.

### Option C: DNS record

Only for a custom domain with DNS on Cloudflare. Add the provided TXT record in the Cloudflare dashboard and wait for propagation before verifying.

## 3. Submit the sitemap

1. Open **Indexing → Sitemaps**.
2. Enter `sitemap.xml` (the property already supplies the host).
3. Submit. Confirm `https://<host>/sitemap.xml` loads and lists 12 URLs.

The sitemap is regenerated on every build from `src/config/pages.js`, so it stays in sync with the routes.

## 4. Post-setup checks

- **URL Inspection**: check all 12 public pages; request indexing once per page. Do not repeat requests for the same URL in a loop.
- **Robots.txt report**: confirm `robots.txt` is fetched successfully and the sitemap line is recognised.
- **Page indexing report**: after 7–14 days, review why any page is excluded. Expected exclusions: `/404.html` may appear as a soft 404 or not indexed; that is acceptable for a static error page.
- **Core Web Vitals**: initially empty; field data takes weeks to accumulate.
- **Links report**: mostly empty for a new site; ignore it early.

## 5. What not to do

- Do not submit individual URLs instead of the sitemap on a recurring basis.
- Do not expect instant indexing; new domains can take days to weeks.
- Do not add verification meta tags to a deploy that also contains unapproved ad code or analytics.
- Do not create multiple properties for the same host (`http`, `https`, `www`) — pick the canonical origin and redirect the rest at the host.
