const KEY = 'filevra-recent-tools'
const LIMIT = 8

export function readRecentTools() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string').slice(0, LIMIT) : []
  } catch {
    return []
  }
}

export function rememberTool(id) {
  if (typeof window === 'undefined' || !id) return
  try {
    const next = [id, ...readRecentTools().filter((item) => item !== id)].slice(0, LIMIT)
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage can be unavailable in private windows; recency is optional.
  }
}
