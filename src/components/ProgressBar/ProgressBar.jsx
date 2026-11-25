export default function ProgressBar({ value = 0, label = 'Processing' }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)

  return (
    <div
      className="fr-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={percent}
      data-testid="progress"
    >
      <div className="fr-progress-bar" style={{ width: `${percent}%` }} />
    </div>
  )
}
