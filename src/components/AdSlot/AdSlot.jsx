import { useEffect, useRef, useState } from 'react'
import { adsConfig } from '../../config/site'
import { loadAdSenseScript } from '../../services/ads'
import { getStoredConsent, subscribeConsent } from '../../services/consent'

export default function AdSlot({ placement = 'content', format = 'auto' }) {
  const slotId = adsConfig.slots[placement]
  const [consent, setConsent] = useState(() => getStoredConsent())
  const adRef = useRef(null)

  useEffect(() => subscribeConsent(setConsent), [])

  useEffect(() => {
    if (!adsConfig.client || !slotId || consent !== 'granted') return undefined
    let cancelled = false

    loadAdSenseScript(adsConfig.client)
      .then(() => {
        if (cancelled || !adRef.current) return
        try {
          window.adsbygoogle = window.adsbygoogle || []
          window.adsbygoogle.push({})
        } catch {
          // A blocked or delayed ad script must never affect the tools.
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [slotId, consent])

  if (!adsConfig.client || !slotId || consent !== 'granted') return null

  return (
    <aside className="fr-adslot" aria-label="Advertisement" data-testid="ad-slot">
      <span className="fr-adslot-label">Advertisement</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsConfig.client}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  )
}
