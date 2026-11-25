# 90-day SEO plan

An honest, low-risk plan for the first three months after the site is deployed and verified in Google Search Console. It assumes no paid promotion and no link-building beyond normal directory and community mentions. It cannot promise rankings or traffic; it sequences work that gives the site the best chance and produces real data to guide the next quarter.

## Before day 1 (blocking)

- [ ] Deploy to Cloudflare Pages and verify the production URL.
- [ ] Set `VITE_SITE_URL` to the final production origin and rebuild.
- [ ] Confirm every route returns 200 and the canonical tag matches the deployed host.
- [ ] Add the site to Google Search Console and submit `/sitemap.xml` (see `search-console-setup.md`).
- [ ] Set the `LIVE_URL` repository variable so the live smoke workflow can run.
- [ ] Decide whether a public contact email is configured; the contact page currently falls back to the issue tracker.

## Days 1–14: technical baseline

Goals: clean indexing, no surprises in the index, working PWA install.

- Verify `robots.txt` allows crawling and points at the sitemap.
- Use the URL Inspection tool on all 12 public pages; request indexing once each.
- Check the Page indexing report after 7 and 14 days for "Crawled – currently not indexed" or soft 404s.
- Confirm the prerendered HTML contains the title, description, canonical and structured data without JavaScript.
- Run Lighthouse on `/`, `/image-compressor` and `/compress-pdf`; record the scores.
- Test installation on one desktop browser and one Android phone.
- Fix anything the reports surface before producing more content.

Success signals: all 12 pages known to Google, no server errors, PWA install completes.

## Days 15–45: content depth and intent match

Goals: make each tool page the best answer for its job, without adding thin pages.

- Review the first Search Console queries. Identify pages with impressions but few clicks.
- Improve titles and meta descriptions only where evidence supports the change (high impressions, low CTR, wrong intent).
- Expand the two guides with concrete worked examples (for example: a 4 MB phone photo reduced to 180 KB, and what happens to sharpness).
- Add short "why this happens" explanations where visitors may be confused: PDF compression growing a file, target sizes that cannot be reached exactly, signature photos losing quality.
- Improve internal linking: every guide links to at least two relevant tools, and tools link back to the relevant guide.
- Check mobile usability and Core Web Vitals in Search Console; address any real field data problems.

Success signals: improving CTR on the pages with the most impressions; no new indexing errors; stable or better Core Web Vitals.

## Days 46–75: authority within reason

Goals: earn a small number of genuine references, not bulk links.

- Publish one genuinely useful addition: for example a short page section on converting a required size in centimetres to pixels, instead of a new thin page.
- Share the guides where they honestly answer a question (relevant community threads, developer forums). Do not spam, and disclose that it is your site.
- Ensure the GitHub repository README and profile link to the live site.
- Check Search Console for unexpected queries that could justify a *section* on an existing page (not a new page).
- Review the AdSense decision (see `adsense-application.md`). Do not apply until the site is stable and the privacy and contact requirements are met.

Success signals: a handful of real referring domains; growing long-tail query count; no manual actions.

## Days 76–90: review and next quarter

- Produce the first monthly report using `monthly-seo-report-template.md`, with real Search Console data.
- Compare the three months of impressions and clicks; identify the two pages with the best potential.
- Decide next quarter's focus: deepen the two strongest tool pages, or improve conversion (fewer abandoned uploads, clearer errors).
- Re-run the full test suite and the live smoke test.
- Review whether the site's title/description conventions still match the queries people actually use.

## Metrics to track (all from real data)

| Metric | Source | Cadence |
| --- | --- | --- |
| Indexed pages | Search Console → Page indexing | Weekly |
| Impressions and clicks per page | Search Console → Performance | Weekly |
| Average position for tracked themes | Search Console → Performance | Monthly |
| Core Web Vitals (field) | Search Console → Core Web Vitals | Monthly |
| Install events | Browser analytics (only if analytics is added later) | Monthly |
| Error-free test runs | GitHub Actions | Per change |

## Explicit non-goals

- No paid campaigns without explicit approval.
- No purchased links, link exchanges, hidden text, cloaking or mass-generated pages.
- No promise of rankings, traffic or AdSense approval.
- No analytics or advertising scripts beyond what the privacy policy describes and the visitor consents to.
