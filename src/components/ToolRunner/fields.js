export const fieldKey = (field, index) => `${index}:${field.name}`

export function defaultValue(field) {
  if (field.default !== undefined) return field.default
  if (field.type === 'checkbox') return false
  if (field.type === 'number') return ''
  if (field.type === 'select') return field.options?.[0]?.value ?? ''
  return ''
}

export function initialValues(fields = []) {
  const values = {}
  fields.forEach((field, index) => {
    values[fieldKey(field, index)] = defaultValue(field)
  })
  return values
}

export function buildOptions(fields, values, preset = {}) {
  const output = { ...preset }
  fields.forEach((field, index) => {
    const raw = values[fieldKey(field, index)]
    if (field.type === 'number') output[field.name] = raw === '' ? undefined : Number(raw)
    else if (field.type === 'checkbox') output[field.name] = Boolean(raw)
    else output[field.name] = raw
  })
  return output
}
