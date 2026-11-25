# Monthly SEO report template

Copy this file to `docs/reports/YYYY-MM.md` each month and fill it from real data. Leave a field blank rather than estimating. Every number must name its source (Search Console report, Keyword Planner export with date, or a named analytics tool).

## Header

| Field | Value |
| --- | --- |
| Month | YYYY-MM |
| Site URL | |
| Reporting period | YYYY-MM-01 to YYYY-MM-DD |
| Data sources | Google Search Console (Performance, Page indexing, Core Web Vitals); other: |

## 1. Search performance

| Metric | This month | Previous month | Change | Source |
| --- | --- | --- | --- | --- |
| Total impressions | | | | Search Console |
| Total clicks | | | | Search Console |
| Average CTR | | | | Search Console |
| Average position | | | | Search Console |
| Queries with impressions | | | | Search Console |

## 2. Page-level performance

Only include pages with impressions > 0 this month.

| Page | Impressions | Clicks | CTR | Avg. position | Notes |
| --- | --- | --- | --- | --- | --- |
| / | | | | | |
| /image-compressor | | | | | |
| /photo-signature-resizer | | | | | |
| /image-to-pdf | | | | | |
| /merge-pdf | | | | | |
| /compress-pdf | | | | | |
| /image-preparation-guide | | | | | |
| /pdf-preparation-guide | | | | | |

## 3. Top queries

| Query | Impressions | Clicks | CTR | Landing page | Intent match (yes/no/partly) |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## 4. Indexing health

| Item | Count | Notes |
| --- | --- | --- |
| Pages indexed | | Search Console → Page indexing |
| Pages excluded | | List the main reasons |
| Sitemap submitted / last read | | Search Console → Sitemaps |
| New 404s discovered | | From server logs or Cloudflare analytics, if available |

## 5. Core Web Vitals (field data)

| Metric | Mobile | Desktop | Status |
| --- | --- | --- | --- |
| LCP | | | |
| INP | | | |
| CLS | | | |

If Search Console shows no field data yet, write "no field data yet" instead of a number.

## 6. Work completed this month

- Changes made (titles, descriptions, content, internal links, fixes):
- Evidence for each change (which report or query motivated it):
- Tests run (unit / e2e / live smoke) and results:

## 7. Issues and risks

| Issue | Impact | Action | Owner | Due |
| --- | --- | --- | --- | --- |
| | | | | |

## 8. Next month's plan

- Highest-leverage pages to improve, with the data that justifies them:
- Content or structural work planned:
- Anything blocked (for example missing contact email, host access, AdSense approval):

## 9. Honesty check

- [ ] No invented volumes, rankings or traffic numbers.
- [ ] Every metric has a source and a date.
- [ ] No claims of guaranteed rankings or improvement.
- [ ] AdSense status reported only as verified in the AdSense dashboard.
