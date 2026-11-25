let scriptPromise = null

export function loadAdSenseScript(client) {
  if (!client) return Promise.reject(new Error('AdSense is not configured.'))
  if (typeof document === 'undefined') return Promise.reject(new Error('AdSense can only load in a browser.'))
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-filevra-adsense]')
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve()
      else {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('The advertising script could not be loaded.')), {
          once: true,
        })
      }
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`
    script.dataset.filevraAdsense = 'true'
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    })
    script.addEventListener('error', () => reject(new Error('The advertising script could not be loaded.')))
    document.head.appendChild(script)
  })

  return scriptPromise
}
