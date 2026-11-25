# AdSense application guide

This guide describes how the site is prepared for Google AdSense and what must happen before an application is made. **No publisher ID exists yet, no ad code is loaded, and approval is not guaranteed.** Google decides independently whether a site is accepted.

## Current state in the code

- `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT_CONTENT` and `VITE_ADSENSE_SLOT_RESULT` are empty by default.
- While they are empty, `AdSlot` renders nothing and the consent notice is not shown.
- The AdSense script loads only after both a publisher ID **and** an explicit "Allow advertising" choice.
- The consent choice is stored under `formready-ad-consent-v1` in `localStorage`; documents are never stored.
- Placements sit away from upload, compress and download controls. There is no ad above a tool's primary action and no ad between a result and its download button.

## Prerequisites before applying

- [ ] The site is deployed on its final production URL and all 12 pages return 200.
- [ ] The privacy policy is live and describes advertising cookies, third-party vendors and how to opt out.
- [ ] The contact page offers a real route to reach you (email configured, or the public issue tracker acknowledged).
- [ ] The About page explains who runs the site and why it is free.
- [ ] Each tool page has original explanatory content, not just a widget.
- [ ] Navigation works on mobile, and there are no broken links.
- [ ] Google Search Console is set up and the sitemap is submitted (ownership verification must match the AdSense applicant).
- [ ] The site is stable: the CI suite is green and no console errors appear on public pages.

## Application steps

1. Go to `https://adsense.google.com` and sign in with the Google account that should own the site.
2. Add the site URL (the exact production origin, for example `https://formready-tools.pages.dev`).
3. Choose the payment country and accept the terms. These are legal declarations about the applicant, not settings to guess.
4. Add the AdSense verification snippet only through the supported mechanism in this codebase:
   - Prefer the **site ownership** verification in AdSense using the same method as Search Console (HTML file or meta tag), rather than a raw script tag.
   - Do **not** hard-code the AdSense loader in `index.html`. The implementation must remain gated behind consent and the environment variables.
5. Wait for review. Review can take days to weeks and may be rejected for reasons unrelated to code (content depth, traffic, policy).
6. Only after approval, copy the publisher ID (`ca-pub-…`) and create two ad units (in-content, post-result).

## Configuration after approval

Set these in the Cloudflare Pages project (Production environment) and rebuild:

```
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_SLOT_CONTENT=XXXXXXXXXX
VITE_ADSENSE_SLOT_RESULT=XXXXXXXXXX
```

Then verify:

- The consent notice appears on first visit and no AdSense request is made before "Allow advertising".
- After consent, `/adsbygoogle.js` loads once and ad slots render in their reserved space.
- Choosing "Continue without ads" leaves the site unchanged and stores the denied choice.
- Tool flows still work with the ad script blocked (ad-blocker test).
- No ad appears within a tool's upload, action or download area.

## Placement rules used by this site

| Placement | Where | Rule |
| --- | --- | --- |
| `content` | Home page lower section, guide pages | Separated from tool controls by headings and body text |
| `result` | Reserved for after a result card | Never between a result and its download button |

No pop-ups, interstitials, sticky overlays or ads that mimic navigation. No ads inside the dropzone or next to "Download".

## Testing rules

- Never click your own ads or ask others to click them.
- Do not run automated browsers through ad units.
- Do not hide ad labels or place ads so they look like content or controls.
- Check the Ads.txt requirement: AdSense provides an `ads.txt` line for the approved account; add it to `public/ads.txt` only after approval, using the exact line from AdSense.

## If the application is rejected

Read the stated reason. Common causes are insufficient original content, unclear navigation, or policy pages that do not match the site. Improve those areas, keep the site live, and reapply only when something material has changed. Repeated applications without changes do not help.

## Honesty notes

- Approval is not guaranteed by having a privacy policy or a consent banner.
- This repository does not invent a publisher ID, slot ID or approval status.
- Revenue estimates are not provided.
