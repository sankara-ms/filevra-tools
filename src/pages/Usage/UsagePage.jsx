import { useState } from 'react'
import SEO from '../../components/SEO/SEO'
import Icon from '../../components/Icon/Icon'
import { TOOL_BY_ID } from '../../config/tools'

const EXTRA_TOOL_LABELS = { workflow: 'Workflow builder' }
const DAY_OPTIONS = [7, 14, 30]

function formatDay(day) {
  const parsed = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return day
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0)
}

function toolLabel(id) {
  return TOOL_BY_ID[id]?.name || EXTRA_TOOL_LABELS[id] || id
}

export default function UsagePage() {
  const [passcode, setPasscode] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [days, setDays] = useState(14)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = async (token, range) => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/usage?days=${range}`, {
        headers: { 'X-Usage-Token': token },
      })
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        setData(null)
        setMessage(
          'The usage API is not running on this address. Counts work on the Cloudflare Pages deployment once the D1 database and secrets are configured.',
        )
        return
      }
      const payload = await response.json()
      if (!response.ok) {
        setData(null)
        setMessage(payload.error || 'The usage data could not be loaded.')
        if (response.status === 401) setSessionToken('')
        return
      }
      setData(payload)
      setSessionToken(token)
      setPasscode('')
    } catch {
      setData(null)
      setMessage('The usage API could not be reached. Check the connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    const token = passcode.trim()
    if (!token) {
      setMessage('Enter the usage passcode.')
      return
    }
    load(token, days)
  }

  const lock = () => {
    setData(null)
    setSessionToken('')
    setPasscode('')
    setMessage('')
  }

  const todayRow = data?.days?.find((row) => row.day === data.today)

  return (
    <>
      <SEO
        title="Usage - Filevra"
        description="Private first-party usage counts for Filevra."
        path="/usage"
        noindex
      />
      <div className="fr-page-head">
        <div className="fr-container">
          <h1>Usage</h1>
          <p>Private counts for this site. Not linked from public pages and not indexed by search engines.</p>
        </div>
      </div>

      <section className="fr-section">
        <div className="fr-container">
          <div className="fr-usage">
            {!sessionToken || !data ? (
              <form className="fr-usage-gate" onSubmit={submit}>
                <h2 className="fr-heading-sm">Open the usage report</h2>
                <p className="fr-muted">
                  Enter the usage passcode set as <span className="fr-mono">USAGE_ADMIN_TOKEN</span> on the Cloudflare
                  Pages project. The passcode is not stored in the browser.
                </p>
                <label htmlFor="usage-passcode" className="fr-field-label">
                  Usage passcode
                </label>
                <div className="fr-input-row">
                  <input
                    id="usage-passcode"
                    className="fr-input"
                    type="password"
                    autoComplete="off"
                    value={passcode}
                    onChange={(event) => setPasscode(event.target.value)}
                    placeholder="Passcode"
                    data-testid="usage-passcode"
                  />
                  <button type="submit" className="fr-btn fr-btn-primary" disabled={busy} data-testid="usage-submit">
                    <Icon name="KeyRound" size={16} />
                    {busy ? 'Loading…' : 'Open report'}
                  </button>
                </div>
                <p className="fr-field-hint">
                  Daily totals use the Asia/Kolkata (IST) day boundary. No cookies and no file data are involved.
                </p>
              </form>
            ) : (
              <>
                <div className="fr-usage-bar">
                  <div>
                    <h2 className="fr-heading-sm mb-1">Last {days} days</h2>
                    <p className="fr-small fr-muted mb-0">
                      Day boundary: Asia/Kolkata (IST) · today is {formatDay(data.today)}
                    </p>
                  </div>
                  <div className="fr-usage-bar-actions">
                    <label htmlFor="usage-range" className="fr-visually-hidden">
                      Report range
                    </label>
                    <select
                      id="usage-range"
                      className="fr-input"
                      value={days}
                      onChange={(event) => {
                        const range = Number(event.target.value)
                        setDays(range)
                        load(sessionToken, range)
                      }}
                      data-testid="usage-range"
                    >
                      {DAY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          Last {option} days
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="fr-btn fr-btn-secondary fr-btn-sm"
                      onClick={() => load(sessionToken, days)}
                      disabled={busy}
                    >
                      <Icon name="RefreshCw" size={15} />
                      {busy ? 'Refreshing…' : 'Refresh'}
                    </button>
                    <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={lock}>
                      <Icon name="Lock" size={15} />
                      Lock
                    </button>
                  </div>
                </div>

                <div className="fr-usage-cards">
                  {[
                    { label: 'Unique visitors today', value: todayRow?.visitors, icon: 'Eye' },
                    { label: 'Page views today', value: todayRow?.page_views, icon: 'FileText' },
                    { label: 'Tool runs today', value: todayRow?.tool_runs, icon: 'Play' },
                  ].map((card) => (
                    <div className="fr-usage-card" key={card.label}>
                      <Icon name={card.icon} size={18} />
                      <strong>{formatNumber(card.value)}</strong>
                      <span>{card.label}</span>
                    </div>
                  ))}
                </div>

                <h3 className="fr-heading-sm">Daily totals</h3>
                {data.days.length ? (
                  <div className="fr-table-wrap">
                    <table className="fr-usage-table">
                      <thead>
                        <tr>
                          <th scope="col">Day</th>
                          <th scope="col" className="text-end">
                            Visitors
                          </th>
                          <th scope="col" className="text-end">
                            Page views
                          </th>
                          <th scope="col" className="text-end">
                            Tool runs
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.days.map((row) => (
                          <tr key={row.day}>
                            <td>{formatDay(row.day)}</td>
                            <td className="text-end">{formatNumber(row.visitors)}</td>
                            <td className="text-end">{formatNumber(row.page_views)}</td>
                            <td className="text-end">{formatNumber(row.tool_runs)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="fr-note">
                    No counts yet. The first page view is recorded when the deployed site is opened. Local previews
                    do not have the usage API.
                  </p>
                )}

                <div className="fr-usage-columns">
                  <div>
                    <h3 className="fr-heading-sm">Tools used</h3>
                    {data.tools.length ? (
                      <ul className="fr-usage-list">
                        {data.tools.map((row) => (
                          <li key={row.tool}>
                            <span>{toolLabel(row.tool)}</span>
                            <strong>{formatNumber(row.runs)}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="fr-small fr-muted">No tool runs in this period.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="fr-heading-sm">Pages viewed</h3>
                    {data.pages.length ? (
                      <ul className="fr-usage-list">
                        {data.pages.map((row) => (
                          <li key={row.path}>
                            <span className="fr-mono fr-small">{row.path}</span>
                            <strong>{formatNumber(row.views)}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="fr-small fr-muted">No page views in this period.</p>
                    )}
                  </div>
                </div>

                <p className="fr-small fr-muted">
                  Counts are first-party and aggregated by day. Visitor identifiers are salted hashes that are deleted
                  after 35 days; file names and document contents are never recorded.
                </p>
              </>
            )}

            {message ? (
              <p className="fr-alert mt-3" role="alert" data-testid="usage-message">
                <Icon name="AlertCircle" size={17} />
                <span>{message}</span>
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}
