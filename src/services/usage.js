const ENDPOINT = '/api/track'

function isTrackableHost() {
  const { protocol, hostname } = window.location
  if (protocol !== 'http:' && protocol !== 'https:') return false
  const host = hostname.toLowerCase()
  return (
    host !== 'localhost' &&
    host !== '127.0.0.1' &&
    host !== '0.0.0.0' &&
    host !== '::1' &&
    host !== '[::1]' &&
    !host.endsWith('.local')
  )
}

function send(payload) {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return
  if (!isTrackableHost()) return
  const body = JSON.stringify(payload)
  try {
    if (navigator.sendBeacon) {
      const queued = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
      if (queued) return
    }
  } catch {
    // Fall through to fetch.
  }
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function trackPageView(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return
  send({ type: 'page', path })
}

export function trackToolRun(tool) {
  if (typeof tool !== 'string' || !tool) return
  send({ type: 'tool', tool })
}
