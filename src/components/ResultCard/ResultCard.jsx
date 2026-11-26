import Icon from '../Icon/Icon'

export default function ResultCard({
  title = 'Your result is ready',
  tone = 'success',
  stats = [],
  warning,
  onDownload,
  downloadLabel = 'Download',
  onReset,
  resetLabel = 'Start over',
  downloadTestId = 'download-result',
  children,
}) {
  return (
    <div className={`fr-result${tone === 'warning' ? ' is-warning' : ''}`} data-testid="result-card">
      <h3>
        <Icon name={tone === 'warning' ? 'AlertCircle' : 'CheckCircle2'} size={19} />
        {title}
      </h3>
      {stats.length > 0 && (
        <div className="fr-result-stats">
          {stats.map((stat) => (
            <span key={stat.label}>
              <span className="fr-stat-value">{stat.value}</span>
              <span className="fr-stat-label">{stat.label}</span>
            </span>
          ))}
        </div>
      )}
      {warning ? <p className="fr-small fr-runner-warning mb-3">{warning}</p> : null}
      {children}
      <div className="fr-result-actions">
        {onDownload ? (
          <button type="button" className="fr-btn fr-btn-primary" onClick={onDownload} data-testid={downloadTestId}>
            <Icon name="Download" size={17} />
            {downloadLabel}
          </button>
        ) : null}
        {onReset ? (
          <button type="button" className="fr-btn fr-btn-secondary" onClick={onReset} data-testid="reset-tool">
            <Icon name="RotateCcw" size={16} />
            {resetLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
