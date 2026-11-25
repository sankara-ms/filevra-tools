# Keyword research and page mapping

This document lists the search themes Filevra is built to answer and the page responsible for each one. It deliberately contains **no search volume numbers**: no keyword tool data was available while building the site, and inventing plausible-looking volumes would be misleading. The "how to fill in the numbers" section explains how to collect real data once the site is live.

## Method

1. Start from the job a visitor needs done ("get this photo under 200 KB for a form"), not from a single keyword.
2. Map each job to one canonical page so two pages never compete for the same intent.
3. Write titles and headings around the natural phrasing of the job.
4. Validate assumptions with Search Console impressions after launch instead of guessing.

## Primary themes and page mapping

| Theme | Typical queries people use | Owning page | Notes |
| --- | --- | --- | --- |
| Compress an image to a size limit | compress image to 100kb, reduce photo size to 200 kb, make image smaller for upload | `/image-compressor` | Kept different from the resizer: this page changes quality to hit a target size. |
| Exact photo and signature dimensions | passport photo size, signature image size in pixels, resize photo to 3.5 cm x 4.5 cm | `/photo-signature-resizer` | The title avoids country-specific sizes in the UI; the guide explains how to convert a required size into pixels. |
| Images to PDF | jpg to pdf, combine photos into one pdf, images to pdf online | `/image-to-pdf` | Strong transactional intent; page order matters because form portals often care about page order. |
| Merge PDFs | merge pdf files, combine pdf, join two pdfs | `/merge-pdf` | User chooses file order before merging. |
| Compress a PDF | compress pdf to 200kb, reduce pdf size, shrink pdf for upload | `/compress-pdf` | Honest limitation is stated up front: text PDFs may not shrink, and the tool reports when output is not smaller. |
| Preparation guidance | image size for online form, what size should a signature be, pdf file size limit | `/image-preparation-guide`, `/pdf-preparation-guide` | Informational intent; supports the tool pages through internal links. |
| Privacy and trust | is this pdf tool safe, do my files get uploaded | `/privacy-policy`, `/about` | Local-processing message is repeated on tool pages and in the footer. |

## Secondary long-tail ideas

These are phrasing variants worth watching in Search Console. Do not create separate pages for them; improve the existing page if a variant shows real impressions.

- "reduce jpg size without losing quality"
- "resize image to exact width and height"
- "signature photo resize for online application"
- "combine images into pdf on phone"
- "merge pdf without uploading"
- "why is my compressed pdf bigger"
- "pdf too large to upload what to do"

## Content already on the site that supports these themes

- Each tool page explains what the tool does, the steps, limitations and the privacy stance.
- The two guides explain pixels vs. centimetres, target file sizes, and why quality drops when compressing heavily.
- The FAQ blocks answer recurring practical questions (limits, offline use, local processing).
- The footer links every public page, giving crawlers and visitors a complete path through the site.

## How to fill in real numbers after launch

1. Connect Google Search Console (see `search-console-setup.md`) and let it collect 4–6 weeks of data.
2. Export the **Queries** report filtered to the tool pages. Record impressions, clicks, average position and CTR.
3. Use the free Google Ads Keyword Planner for rough volume bands. Note the date of collection and the geographic filter alongside every number.
4. Log every keyword with its source and date in the monthly report template. Never copy a number without its source.
5. Review quarterly. Rename titles only when there is evidence: high impressions with low CTR, or a query where the page does not match intent.

## Rules

- No keyword stuffing, hidden text or doorway pages.
- One page per intent; no near-duplicate pages for phrasing variants.
- No claims about ranking positions or guaranteed traffic.
- Volume data is only reported with a named source and date.
