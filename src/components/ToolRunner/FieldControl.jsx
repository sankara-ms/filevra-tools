export default function FieldControl({ field, id, value, onChange }) {
  if (field.type === 'select') {
    return (
      <select className="fr-input" id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }
  if (field.type === 'checkbox') {
    return (
      <label className="fr-toggle-row" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{field.label}</span>
      </label>
    )
  }
  if (field.type === 'color') {
    return (
      <span className="fr-color-row">
        <input
          className="fr-color-input"
          id={id}
          type="color"
          value={value || '#000000'}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="fr-mono">{value}</span>
      </span>
    )
  }
  if (field.type === 'password') {
    return (
      <input
        className="fr-input"
        id={id}
        type="password"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }
  if (field.type === 'number') {
    return (
      <input
        className="fr-input"
        id={id}
        type="number"
        inputMode="numeric"
        min={field.min}
        max={field.max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }
  return (
    <input
      className="fr-input"
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
