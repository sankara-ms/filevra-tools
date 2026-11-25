import Icon from '../Icon/Icon'

export function Alert({ tone = 'info', children, testId }) {
  const icon = tone === 'error' ? 'AlertCircle' : tone === 'success' ? 'CheckCircle2' : 'Info'
  return (
    <div className={`fr-alert fr-alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'} data-testid={testId}>
      <Icon name={icon} size={17} />
      <span>{children}</span>
    </div>
  )
}

export default function ErrorMessage({ children }) {
  if (!children) return null
  return (
    <Alert tone="error" testId="error-message">
      {children}
    </Alert>
  )
}
