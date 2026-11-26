import { dayInTimeZone, json, sameOrigin, validateEvent, visitorHash } from '../_lib.js'

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'Cross-origin requests are not accepted.' }, 403)
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > 2000) return json({ error: 'Payload too large.' }, 413)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Expected a JSON body.' }, 400)
  }
  const event = validateEvent(body)
  if (!event) return json({ error: 'Unknown event.' }, 400)
  if (!env.USAGE_DB) return json({ error: 'Usage counting is not configured on this deployment.' }, 503)

  const day = dayInTimeZone(new Date())
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 300)
  const ip = request.headers.get('CF-Connecting-IP') || ''
  const hash = await visitorHash({ day, ip, userAgent, salt: env.USAGE_SALT || '' })

  try {
    if (event.type === 'page') {
      const inserted = await env.USAGE_DB.prepare(
        'INSERT INTO day_visitors (day, visitor_hash) VALUES (?1, ?2) ON CONFLICT(day, visitor_hash) DO NOTHING',
      )
        .bind(day, hash)
        .run()
      const newVisitor = inserted?.meta?.changes > 0 ? 1 : 0
      await env.USAGE_DB.batch([
        env.USAGE_DB.prepare(
          `INSERT INTO day_stats (day, page_views, visitors, tool_runs) VALUES (?1, 1, ?2, 0)
           ON CONFLICT(day) DO UPDATE SET page_views = page_views + 1, visitors = visitors + ?2`,
        ).bind(day, newVisitor),
        env.USAGE_DB.prepare(
          `INSERT INTO page_stats (day, path, views) VALUES (?1, ?2, 1)
           ON CONFLICT(day, path) DO UPDATE SET views = views + 1`,
        ).bind(day, event.path),
      ])
    } else {
      await env.USAGE_DB.batch([
        env.USAGE_DB.prepare(
          `INSERT INTO day_stats (day, page_views, visitors, tool_runs) VALUES (?1, 0, 0, 1)
           ON CONFLICT(day) DO UPDATE SET tool_runs = tool_runs + 1`,
        ).bind(day),
        env.USAGE_DB.prepare(
          `INSERT INTO tool_stats (day, tool, runs) VALUES (?1, ?2, 1)
           ON CONFLICT(day, tool) DO UPDATE SET runs = runs + 1`,
        ).bind(day, event.tool),
      ])
    }
  } catch {
    return json({ error: 'The counter could not record this event.' }, 500)
  }

  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
