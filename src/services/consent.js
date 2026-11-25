const STORAGE_KEY = 'filevra-ad-consent-v1'
const listeners = new Set()

export function getStoredConsent() {
  try {
    if (typeof localStorage === 'undefined') return null
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function setStoredConsent(value) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage can be blocked; the choice then lasts for this page view only.
  }
  listeners.forEach((listener) => listener(value))
}

export function subscribeConsent(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
