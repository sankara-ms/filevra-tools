import { TIME_ZONE, dayInTimeZone, isoDaysAgo, json, safeEqual, tokenFrom } from '../_lib.js'

export async function onRequestGet({ request, env }) {
  if (!env.USAGE_ADMIN_TOKEN) {
    return json({ error: 'Set USAGE_ADMIN_TOKEN to enable the usage dashboard.' }, 503)
  }
  if (!safeEqual(tokenFrom(request), env.USAGE_ADMIN_TOKEN)) {
    return json({ error: 'The passcode is not correct.' }, 401)
  }
  if (!env.USAGE_DB) {
    return json({ error: 'Bind a D1 database as USAGE_DB to enable usage counting.' }, 503)
  }

  const url = new URL(request.url)
  const requested = Number(url.searchParams.get('days'))
  const days = Math.min(31, Math.max(1, Number.isFinite(requested) && requested > 0 ? requested : 14))
  const today = dayInTimeZone(new Date())
  const from = isoDaysAgo(today, days - 1)

  let rows
  try {
    rows = await env.USAGE_DB.batch([
      env.USAGE_DB.prepare(
        'SELECT day, page_views, visitors, tool_runs FROM day_stats WHERE day >= ?1 ORDER BY day DESC',
      ).bind(from),
      env.USAGE_DB.prepare(
        'SELECT tool, SUM(runs) AS runs FROM tool_stats WHERE day >= ?1 GROUP BY tool ORDER BY runs DESC LIMIT 100',
      ).bind(from),
      env.USAGE_DB.prepare(
        'SELECT path, SUM(views) AS views FROM page_stats WHERE day >= ?1 GROUP BY path ORDER BY views DESC LIMIT 100',
      ).bind(from),
    ])
  } catch {
    return json({ error: 'The usage tables are missing. Apply migrations/0001_usage.sql first.' }, 503)
  }

  return json({
    timeZone: TIME_ZONE,
    today,
    days: rows[0]?.results || [],
    tools: rows[1]?.results || [],
    pages: rows[2]?.results || [],
  })
}
