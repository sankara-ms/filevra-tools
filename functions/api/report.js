import {
  DEFAULT_REPORT_TO,
  VISITOR_RETENTION_DAYS,
  dayInTimeZone,
  isDay,
  isoDaysAgo,
  json,
  reportEmail,
  safeEqual,
  tokenFrom,
} from '../_lib.js'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export async function onRequestGet({ request, env }) {
  if (!env.USAGE_REPORT_TOKEN) {
    return json({ error: 'Set USAGE_REPORT_TOKEN to enable the daily report.' }, 503)
  }
  if (!safeEqual(tokenFrom(request), env.USAGE_REPORT_TOKEN)) {
    return json({ error: 'The report token is not correct.' }, 401)
  }
  if (!env.USAGE_DB) {
    return json({ error: 'Bind a D1 database as USAGE_DB to enable the daily report.' }, 503)
  }
  if (!env.RESEND_API_KEY) {
    return json({ error: 'Set RESEND_API_KEY so the report can be emailed.' }, 503)
  }

  const url = new URL(request.url)
  const requestedDay = url.searchParams.get('day') || ''
  const day = isDay(requestedDay) ? requestedDay : dayInTimeZone(new Date())

  let rows
  try {
    rows = await env.USAGE_DB.batch([
      env.USAGE_DB.prepare(
        'SELECT page_views, visitors, tool_runs FROM day_stats WHERE day = ?1',
      ).bind(day),
      env.USAGE_DB.prepare('SELECT tool, runs FROM tool_stats WHERE day = ?1 ORDER BY runs DESC').bind(day),
      env.USAGE_DB.prepare('SELECT path, views FROM page_stats WHERE day = ?1 ORDER BY views DESC').bind(day),
    ])
  } catch {
    return json({ error: 'The usage tables are missing. Apply migrations/0001_usage.sql first.' }, 503)
  }

  const email = reportEmail({
    day,
    stats: rows[0]?.results?.[0],
    tools: rows[1]?.results || [],
    pages: rows[2]?.results || [],
  })

  const recipient = env.USAGE_EMAIL_TO || DEFAULT_REPORT_TO
  const sender = env.USAGE_MAIL_FROM || 'Filevra Usage <onboarding@resend.dev>'

  let response
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    })
  } catch {
    return json({ error: 'The email provider could not be reached.' }, 502)
  }

  if (!response.ok) {
    return json({ error: `The email provider rejected the message (HTTP ${response.status}).` }, 502)
  }

  await env.USAGE_DB.prepare('DELETE FROM day_visitors WHERE day < ?1')
    .bind(isoDaysAgo(dayInTimeZone(new Date()), VISITOR_RETENTION_DAYS))
    .run()
    .catch(() => {})

  return json({ sent: true, day })
}
