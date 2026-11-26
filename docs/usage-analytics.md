# Usage counting and the daily email report

The site counts page visits and tool runs on its own domain. Counts are stored in a Cloudflare D1 database, shown on a
passcode-protected page at `/usage`, and emailed once a day with a GitHub Actions workflow.

Nothing here is deployed by this repository alone. The counts only start after the D1 database, the Pages binding and
the secrets below exist on the Cloudflare project. Until then the site works normally and the tracking calls fail
silently.

## What is counted

| Event | When it is sent | Stored as |
| --- | --- | --- |
| Page view | Every public route change | IST day, path, one row per visitor per day |
| Tool run | After a tool finishes successfully | IST day, tool id, run count |

Deliberately **not** collected: file names, file types, file sizes, document contents, downloaded results, search
terms, referrers, screen size, cookies, or a persistent device identifier.

## How visitor counting works

1. The page sends `{ type: 'page', path }` or `{ type: 'tool', tool }` to `POST /api/track`.
2. A Cloudflare Pages Function (`functions/api/track.js`) rejects cross-origin requests and payloads over 2 KB.
3. For page views the function hashes `day | IP address | user agent | secret salt` with SHA-256 and keeps the first
   16 bytes. The raw IP address and user agent are only used to compute that hash and are never written to the
   database.
4. `INSERT ... ON CONFLICT DO NOTHING` into `day_visitors` tells the function whether this visitor is new for the day.
5. Aggregates go to `day_stats`, `page_stats` and `tool_stats`.
6. The report function deletes `day_visitors` rows older than 35 days. Daily aggregates remain; they contain no
   identifier.

The day boundary is `Asia/Kolkata` (IST), so "today" changes at midnight in India, not UTC.

## Database schema

`migrations/0001_usage.sql` creates four tables:

- `day_visitors (day, visitor_hash)` — one row per visitor per day, deleted after 35 days.
- `day_stats (day, page_views, visitors, tool_runs)` — one row per day.
- `page_stats (day, path, views)` — page views per day.
- `tool_stats (day, tool, runs)` — tool runs per day.

## Setup

Run these from the project directory. Commands that need Cloudflare credentials must be run by the account owner; no
credentials belong in this repository.

### 1. Create the D1 database

```bash
npx wrangler d1 create filevra-usage
```

Copy the returned `database_id` if you later configure the binding in `wrangler.toml` instead of the dashboard.

### 2. Apply the schema

```bash
npx wrangler d1 execute filevra-usage --remote --file migrations/0001_usage.sql
```

Re-run the command after changing the migration; the statements use `IF NOT EXISTS`.

### 3. Bind the database to Pages

Cloudflare dashboard → **Workers & Pages → filevra-tools → Settings → Functions → D1 database bindings**:

| Variable name | Database |
| --- | --- |
| `USAGE_DB` | `filevra-usage` |

Add the binding to the **Production** environment (and Preview if you want counts from preview deployments).

### 4. Add the Pages secrets

Dashboard → **Settings → Variables and Secrets**, or with Wrangler:

```bash
npx wrangler pages secret put USAGE_ADMIN_TOKEN --project-name filevra-tools
npx wrangler pages secret put USAGE_REPORT_TOKEN --project-name filevra-tools
npx wrangler pages secret put USAGE_SALT --project-name filevra-tools
npx wrangler pages secret put RESEND_API_KEY --project-name filevra-tools
```

| Secret | Purpose |
| --- | --- |
| `USAGE_ADMIN_TOKEN` | The passcode typed on `/usage`. Use a long random value, for example `openssl rand -base64 24`. |
| `USAGE_REPORT_TOKEN` | Authenticates `GET /api/report`. Use a different random value from the admin token. |
| `USAGE_SALT` | Secret salt for the visitor hash. Changing it only affects deduplication for future days. |
| `RESEND_API_KEY` | Resend API key used to send the daily email. |

Optional variables:

| Variable | Default |
| --- | --- |
| `USAGE_EMAIL_TO` | `sankarnaece@gmail.com` (compiled into `functions/_lib.js`) |
| `USAGE_MAIL_FROM` | `Filevra Usage <onboarding@resend.dev>` |

The repository is public, so the default recipient address is visible in source. Set `USAGE_EMAIL_TO` as a Pages
variable if you would rather keep the address out of the code, and change the default in `functions/_lib.js` if needed.

### 5. Create the Resend account

1. Create a Resend account that owns the recipient address.
2. Create an API key with sending permission and store it as `RESEND_API_KEY`.
3. Without a verified sending domain, Resend's shared `onboarding@resend.dev` sender can only deliver to the address
   that owns the Resend account. To send to any other address, verify a domain and set `USAGE_MAIL_FROM` to an address
   on that domain, for example `Filevra Usage <usage@your-domain>`.

If the provider rejects the message, `/api/report` returns HTTP 502 with the provider status and the workflow fails
visibly instead of pretending the email was sent.

### 6. Configure the GitHub workflow

Repository → **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `SITE_URL` | The deployed origin, for example `https://filevra-tools.pages.dev` |
| Secret | `USAGE_REPORT_TOKEN` | The same value as the Pages secret |

`.github/workflows/daily-usage-report.yml` runs at **00:15 IST** (cron `45 18 * * *` UTC) and requests the IST day that
just ended. It passes `?day=YYYY-MM-DD`, so a delayed run still reports the completed day rather than a mostly empty new
one. Use **Actions → Daily usage report → Run workflow** to test it.

Scheduled workflows only run from the default branch, and GitHub may delay them by several minutes.

### 7. Deploy

Pages deploys the `functions/` directory together with the site. After the binding and secrets are in place, push to
`main` or retry the deployment, then run the verification below against the deployed origin.

## Verification

Replace `<host>` with the deployed origin.

```bash
# Page view (no Origin header, so the same-origin check passes)
curl -i -X POST "https://<host>/api/track" \
  -H 'Content-Type: application/json' \
  -d '{"type":"page","path":"/"}'
# expect HTTP 204

# Tool run
curl -i -X POST "https://<host>/api/track" \
  -H 'Content-Type: application/json' \
  -d '{"type":"tool","tool":"image-compressor"}'
# expect HTTP 204

# Totals, using the passcode
curl -s "https://<host>/api/usage?days=7" \
  -H "X-Usage-Token: $USAGE_ADMIN_TOKEN"
# expect JSON with timeZone, today, days, tools and pages

# Wrong passcode
curl -i "https://<host>/api/usage" -H "X-Usage-Token: wrong"
# expect HTTP 401

# Daily email for the completed IST day
curl -s "https://<host>/api/report?day=$(TZ=Asia/Kolkata date -d yesterday +%F)" \
  -H "Authorization: Bearer $USAGE_REPORT_TOKEN"
# expect {"sent":true,"day":"YYYY-MM-DD"} and an email in the inbox
```

Then open `https://<host>/usage`, enter `USAGE_ADMIN_TOKEN`, and confirm the cards, daily table, tools and pages match.

A page the browser fetched from the service worker cache can run an older bundle that does not send tracking. Hard
reload or clear site data when checking a fresh deployment.

### Local testing

Functions do not run under `npm run preview`; the Usage page reports that the API is not available, which is expected.
To run the real Functions locally:

```bash
npm run build
npx wrangler pages dev dist --d1=USAGE_DB=filevra-usage
```

Put local-only secrets in `.dev.vars` (ignored by Git). Local D1 is separate from the remote database unless you bind
the remote one explicitly.

## Failure behaviour

- Without `USAGE_DB`, `/api/track` returns 503 and nothing is counted.
- Without `USAGE_ADMIN_TOKEN`, `/usage` returns 503.
- Without `USAGE_REPORT_TOKEN`, `RESEND_API_KEY` or `USAGE_DB`, `/api/report` returns 503 and does not send.
- Without the tables, `/api/usage` and `/api/report` return 503 with a hint to apply the migration.
- Client tracking is skipped outside production builds and on local hosts (`localhost`, `127.0.0.1`, `[::1]`, `*.local`),
  so `npm run dev` and `npm run preview` never write counts or log failed requests.
- A blocked or failed tracking request never affects a tool result.

## Privacy summary

The privacy policy describes this counter in the **Usage counting** section. Keep the two in sync if the schema or
retention changes. `/usage` and `/api/` are disallowed in `robots.txt`, and the Usage page carries `noindex`.
