const MAX_LINES = 1500

export function diffLines(left, right) {
  const a = String(left ?? '').split(/\r?\n/)
  const b = String(right ?? '').split(/\r?\n/)
  if (a.length > MAX_LINES || b.length > MAX_LINES) {
    throw new Error(`Each side can be at most ${MAX_LINES} lines. Split the text into smaller parts.`)
  }
  const cols = b.length + 1
  const table = []
  for (let i = 0; i <= a.length; i += 1) table.push(new Uint32Array(cols))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    const row = table[i]
    const below = table[i + 1]
    for (let j = b.length - 1; j >= 0; j -= 1) {
      row[j] = a[i] === b[j] ? below[j + 1] + 1 : Math.max(below[j], row[j + 1])
    }
  }
  const output = []
  let added = 0
  let removed = 0
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      output.push(`  ${a[i]}`)
      i += 1
      j += 1
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      output.push(`- ${a[i]}`)
      removed += 1
      i += 1
    } else {
      output.push(`+ ${b[j]}`)
      added += 1
      j += 1
    }
  }
  while (i < a.length) {
    output.push(`- ${a[i]}`)
    removed += 1
    i += 1
  }
  while (j < b.length) {
    output.push(`+ ${b[j]}`)
    added += 1
    j += 1
  }
  return {
    text: output.join('\n'),
    added,
    removed,
    identical: added === 0 && removed === 0,
  }
}
