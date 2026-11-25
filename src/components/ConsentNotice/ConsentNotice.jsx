import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adsConfig } from '../../config/site'
import { getStoredConsent, setStoredConsent } from '../../services/consent'

export default function ConsentNotice() {
  const [consent, setConsent] = useState(() => getStoredConsent())

  if (!adsConfig.client || consent) return null

  const choose = (value) => {
    setStoredConsent(value)
    setConsent(value)
  }

  return (
    <div className="fr-consent" role="dialog" aria-label="Advertising cookie choice">
      <p>
        This site can show advertising to keep the tools free. Advertising uses cookies set by Google and is only
        loaded if you agree. Your files are never shared with advertisers.{' '}
        <Link to="/privacy-policy">Read the privacy policy</Link>.
      </p>
      <div className="fr-consent-actions">
        <button type="button" className="fr-btn fr-btn-primary fr-btn-sm" onClick={() => choose('granted')}>
          Allow advertising
        </button>
        <button type="button" className="fr-btn fr-btn-secondary fr-btn-sm" onClick={() => choose('denied')}>
          Continue without ads
        </button>
      </div>
    </div>
  )
}
