export const TIME_ZONE = 'Asia/Kolkata'
export const DEFAULT_REPORT_TO = 'sankarnaece@gmail.com'
export const VISITOR_RETENTION_DAYS = 35

const TOOL_RE = /^[a-z0-9][a-z0-9-]{0,59}$/
const PATH_RE = /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/?#]{0,199}$/
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export function dayInTimeZone(date = new Date(), timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function isoDaysAgo(day, count) {
  const [year, month, date] = day.split('-').map(Number)
  const value = new Date(Date.UTC(year, month - 1, date - count))
  return value.toISOString().slice(0, 10)
}

export function isDay(value) {
  if (!DAY_RE.test(String(value || ''))) return false
  const [year, month, date] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, date))
  return parsed.toISOString().slice(0, 10) === value
}

export function validateEvent(body) {
  if (!body || typeof body !== 'object') return null
  if (body.type === 'page') {
    const path = typeof body.path === 'string' ? body.path : ''
    if (!PATH_RE.test(path)) return null
    if (path === '/usage' || path.startsWith('/usage/')) return null
    if (path === '/api' || path.startsWith('/api/')) return null
    return { type: 'page', path }
  }
  if (body.type === 'tool') {
    const tool = typeof body.tool === 'string' ? body.tool : ''
    if (!TOOL_RE.test(tool)) return null
    return { type: 'tool', tool }
  }
  return null
}

export async function visitorHash({ day, ip, userAgent, salt }) {
  const input = `${day}|${ip || ''}|${userAgent || ''}|${salt || ''}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function sameOrigin(request) {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export function tokenFrom(request) {
  const header = request.headers.get('X-Usage-Token') || ''
  if (header) return header
  const authorization = request.headers.get('Authorization') || ''
  if (authorization.startsWith('Bearer ')) return authorization.slice(7)
  return new URL(request.url).searchParams.get('token') || ''
}

export function safeEqual(left, right) {
  const a = String(left || '')
  const b = String(right || '')
  if (!a || !b || a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return difference === 0
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function number(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0)
}

export function reportEmail({ day, stats, tools = [], pages = [], siteName = 'Filevra' }) {
  const visitors = Number(stats?.visitors) || 0
  const pageViews = Number(stats?.page_views) || 0
  const toolRuns = Number(stats?.tool_runs) || 0
  const topTools = tools.slice(0, 12)
  const topPages = pages.slice(0, 12)
  const hasData = visitors + pageViews + toolRuns > 0

  const subject = `${siteName} daily usage - ${day}`
  const lines = [
    `${siteName} usage for ${day} (${TIME_ZONE})`,
    '',
    `Unique visitors: ${number(visitors)}`,
    `Page views: ${number(pageViews)}`,
    `Tool runs: ${number(toolRuns)}`,
    '',
  ]
  if (hasData && topTools.length) {
    lines.push('Most used tools')
    for (const row of topTools) lines.push(`- ${row.tool}: ${number(row.runs)}`)
    lines.push('')
  }
  if (hasData && topPages.length) {
    lines.push('Most viewed pages')
    for (const row of topPages) lines.push(`- ${row.path}: ${number(row.views)}`)
    lines.push('')
  }
  if (!hasData) lines.push('No visits were recorded for this day.', '')
  lines.push('First-party counts only. No file names or document contents are recorded.')

  const toolRows = topTools
    .map((row) => `<tr><td>${escapeHtml(row.tool)}</td><td align="right">${number(row.runs)}</td></tr>`)
    .join('')
  const pageRows = topPages
    .map((row) => `<tr><td>${escapeHtml(row.path)}</td><td align="right">${number(row.views)}</td></tr>`)
    .join('')

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1b2433">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dde4ee;border-radius:12px;padding:24px">
      <h1 style="margin:0 0 4px;font-size:20px">${escapeHtml(siteName)} daily usage</h1>
      <p style="margin:0 0 20px;color:#5b6b82">${escapeHtml(day)} · ${escapeHtml(TIME_ZONE)}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:20px">
        <tr>
          <td style="padding:12px;border:1px solid #dde4ee;border-radius:8px"><strong style="font-size:20px">${number(visitors)}</strong><br><span style="color:#5b6b82;font-size:12px">UNIQUE VISITORS</span></td>
          <td style="width:8px"></td>
          <td style="padding:12px;border:1px solid #dde4ee;border-radius:8px"><strong style="font-size:20px">${number(pageViews)}</strong><br><span style="color:#5b6b82;font-size:12px">PAGE VIEWS</span></td>
          <td style="width:8px"></td>
          <td style="padding:12px;border:1px solid #dde4ee;border-radius:8px"><strong style="font-size:20px">${number(toolRuns)}</strong><br><span style="color:#5b6b82;font-size:12px">TOOL RUNS</span></td>
        </tr>
      </table>
      ${
        topTools.length
          ? `<h2 style="font-size:15px;margin:0 0 8px">Most used tools</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="6" style="border-collapse:collapse;margin-bottom:20px;font-size:14px">${toolRows}</table>`
          : ''
      }
      ${
        topPages.length
          ? `<h2 style="font-size:15px;margin:0 0 8px">Most viewed pages</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:14px">${pageRows}</table>`
          : ''
      }
      ${hasData ? '' : '<p style="color:#5b6b82">No visits were recorded for this day.</p>'}
      <p style="margin:20px 0 0;color:#5b6b82;font-size:12px">First-party counts only. No file names or document contents are recorded.</p>
    </div>
  </body>
</html>`

  return { subject, text: lines.join('\n'), html }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
