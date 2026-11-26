import { outputName, sanitizeFilename } from '../shared'

function checkAbort(signal) {
  if (signal?.aborted) throw new DOMException('Processing cancelled.', 'AbortError')
}

async function xlsxLib() {
  return import('xlsx')
}

async function readWorkbook(file) {
  const XLSX = await xlsxLib()
  const data = new Uint8Array(await file.arrayBuffer())
  try {
    return XLSX.read(data, { type: 'array', cellDates: true })
  } catch {
    throw new Error(`"${file.name}" could not be read as a spreadsheet. Damaged files and password-protected workbooks are not supported.`)
  }
}

function pickSheet(workbook, requested) {
  const name = requested && requested !== 'first' ? requested : workbook.SheetNames[0]
  if (!name || !workbook.Sheets[name]) {
    throw new Error(`That sheet was not found. Available sheets: ${workbook.SheetNames.join(', ')}.`)
  }
  return { name, sheet: workbook.Sheets[name] }
}

async function sheetToObjects(sheet) {
  const XLSX = await xlsxLib()
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true })
}

async function sheetToTable(sheet) {
  const XLSX = await xlsxLib()
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
}

export async function csvToJson({ files, onProgress, signal }) {
  const XLSX = await xlsxLib()
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const text = await file.text()
    if (!text.trim()) throw new Error(`"${file.name}" is empty.`)
    let workbook
    try {
      workbook = XLSX.read(text, { type: 'string', cellDates: false })
    } catch {
      throw new Error(`"${file.name}" could not be parsed as CSV. Check the commas, quotes and line breaks.`)
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = await sheetToObjects(sheet)
    outputs.push({
      name: outputName(file.name, 'json'),
      blob: new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
      note: `${rows.length} row(s)`,
    })
    onProgress?.((index + 1) / files.length)
  }
  return { outputs }
}

function parseJsonInput(text, name) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`"${name}" is not valid JSON: ${String(error.message).replace(/^JSON\.parse: /, '')}`, { cause: error })
  }
}

function normaliseRows(value) {
  if (!Array.isArray(value)) {
    if (value && typeof value === 'object') return Object.entries(value).map(([key, entry]) => ({ key, value: typeof entry === 'object' ? JSON.stringify(entry) : entry }))
    throw new Error('The JSON must be an array of objects, an array of arrays, or an object.')
  }
  if (!value.length) throw new Error('The JSON array is empty.')
  const allObjects = value.every((row) => row && typeof row === 'object' && !Array.isArray(row))
  if (allObjects) return { objects: value }
  const allArrays = value.every((row) => Array.isArray(row))
  if (allArrays) return { arrays: value }
  throw new Error('Mix of objects and arrays. Use one consistent shape for every row.')
}

export async function jsonToCsv({ files, onProgress, signal }) {
  const XLSX = await xlsxLib()
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const parsed = parseJsonInput(await file.text(), file.name)
    const shape = normaliseRows(parsed)
    const sheet = shape.objects
      ? XLSX.utils.json_to_sheet(shape.objects)
      : XLSX.utils.aoa_to_sheet(shape.arrays)
    const csv = XLSX.utils.sheet_to_csv(sheet)
    outputs.push({
      name: outputName(file.name, 'csv'),
      blob: new Blob([csv], { type: 'text/csv' }),
      note: `${(shape.objects || shape.arrays).length} row(s)`,
    })
    onProgress?.((index + 1) / files.length)
  }
  return { outputs }
}

export async function csvToXlsx({ files, options = {}, onProgress, signal }) {
  const XLSX = await xlsxLib()
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const workbook = XLSX.read(await file.text(), { type: 'string', cellDates: false })
    const name = sanitizeFilename(options.sheetName || outputName(file.name, 'xlsx').replace(/\.xlsx$/, ''))
    workbook.SheetNames = [name]
    workbook.Sheets[name] = workbook.Sheets[Object.keys(workbook.Sheets)[0]]
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    outputs.push({
      name: outputName(file.name, 'xlsx'),
      blob: new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      note: `Sheet “${name}”`,
    })
    onProgress?.((index + 1) / files.length)
  }
  return { outputs }
}

export async function xlsxToCsv({ files, options = {}, onProgress, signal }) {
  const XLSX = await xlsxLib()
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const workbook = await readWorkbook(file)
    const { name, sheet } = pickSheet(workbook, options.sheet)
    const csv = XLSX.utils.sheet_to_csv(sheet)
    outputs.push({
      name: outputName(file.name, 'csv', workbook.SheetNames.length > 1 ? `-${sanitizeFilename(name)}` : ''),
      blob: new Blob([csv], { type: 'text/csv' }),
      note: `Sheet “${name}”`,
    })
    onProgress?.((index + 1) / files.length)
  }
  return { outputs }
}

export async function xlsxToJson({ files, options = {}, onProgress, signal }) {
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const workbook = await readWorkbook(file)
    const { name, sheet } = pickSheet(workbook, options.sheet)
    const rows = await sheetToObjects(sheet)
    outputs.push({
      name: outputName(file.name, 'json', workbook.SheetNames.length > 1 ? `-${sanitizeFilename(name)}` : ''),
      blob: new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
      note: `${rows.length} row(s)`,
    })
    onProgress?.((index + 1) / files.length)
  }
  return { outputs }
}

export async function jsonToXlsx({ files, onProgress, signal }) {
  const XLSX = await xlsxLib()
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const parsed = parseJsonInput(await file.text(), file.name)
    const shape = normaliseRows(parsed)
    const workbook = XLSX.utils.book_new()
    const sheet = shape.objects
      ? XLSX.utils.json_to_sheet(shape.objects)
      : XLSX.utils.aoa_to_sheet(shape.arrays)
    XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    outputs.push({
      name: outputName(file.name, 'xlsx'),
      blob: new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      note: `${(shape.objects || shape.arrays).length} row(s)`,
    })
    onProgress?.((index + 1) / files.length)
  }
  return { outputs }
}

export async function xlsToXlsx({ files, onProgress, signal }) {
  const XLSX = await xlsxLib()
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const workbook = await readWorkbook(file)
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    outputs.push({
      name: outputName(file.name, 'xlsx'),
      blob: new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      note: `${workbook.SheetNames.length} sheet(s)`,
    })
    onProgress?.((index + 1) / files.length)
  }
  return { outputs }
}

export async function preview({ files, options = {}, signal }) {
  const workbook = await readWorkbook(files[0])
  const { name, sheet } = pickSheet(workbook, options.sheet)
  checkAbort(signal)
  const table = await sheetToTable(sheet)
  const maxCols = Math.min(12, Math.max(1, ...table.map((row) => row.length)))
  const rows = table.slice(0, 14).map((row) => Array.from({ length: maxCols }, (_, index) => String(row[index] ?? '')))
  return {
    info: [
      {
        heading: 'Workbook',
        rows: [
          { label: 'Sheets', value: workbook.SheetNames.join(', ') },
          { label: 'Showing', value: `“${name}”` },
          { label: 'Rows', value: String(Math.max(0, table.length - 1)) },
          { label: 'Columns', value: String(maxCols) },
        ],
      },
    ],
    table: rows.length ? { rows, caption: `First ${rows.length} row(s) of “${name}”` } : null,
    warning: table.length > 14 ? 'Only the first 14 rows are shown. The file itself is not changed.' : undefined,
  }
}

function cellText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

export async function excelToPdf({ files, options = {}, onProgress, signal }) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const workbook = await readWorkbook(files[0])
  const { name, sheet } = pickSheet(workbook, options.sheet)
  const table = (await sheetToTable(sheet)).map((row) => row.map(cellText)).filter((row) => row.some(Boolean))
  if (!table.length) throw new Error('The selected sheet has no data to place on a page.')
  const width = 900
  const height = 595.28
  const margin = 28
  const rowHeight = 15
  const fontSize = 7.5
  const columns = Math.min(30, Math.max(1, ...table.map((row) => row.length)))
  const usableWidth = width - margin * 2
  const columnWidths = Array.from({ length: columns }, (_, index) => {
    const longest = Math.min(40, Math.max(...table.slice(0, 400).map((row) => (row[index] || '').length), 4))
    return longest
  })
  const totalWeight = columnWidths.reduce((sum, value) => sum + value, 0)
  const widths = columnWidths.map((value) => (value / totalWeight) * usableWidth)
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const rowsPerPage = Math.floor((height - margin * 2 - 34) / rowHeight)
  const pages = Math.ceil(table.length / rowsPerPage)
  if (pages > 60) throw new Error('This sheet needs more than 60 PDF pages. Use a smaller sheet or split the data.')
  for (let pageIndex = 0; pageIndex < pages; pageIndex += 1) {
    checkAbort(signal)
    const page = pdf.addPage([width, height])
    let y = height - margin - 6
    page.drawText(`${name} — page ${pageIndex + 1} of ${pages}`, { x: margin, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.1) })
    y -= 22
    table.slice(pageIndex * rowsPerPage, pageIndex * rowsPerPage + rowsPerPage).forEach((row, rowIndex) => {
      let x = margin
      const isHeader = pageIndex === 0 && rowIndex === 0
      row.slice(0, columns).forEach((text, columnIndex) => {
        const available = widths[columnIndex] - 4
        let label = text
        while (label && font.widthOfTextAtSize(label, fontSize) > available) label = label.slice(0, -1)
        if (label !== text && label.length > 1) label = `${label.slice(0, -1)}…`
        page.drawText(label, {
          x: x + 2,
          y,
          size: fontSize,
          font: isHeader ? bold : font,
          color: rgb(0.12, 0.12, 0.12),
        })
        x += widths[columnIndex]
      })
      y -= rowHeight
      page.drawLine({
        start: { x: margin, y: y + 4 },
        end: { x: width - margin, y: y + 4 },
        thickness: 0.3,
        color: rgb(0.85, 0.85, 0.85),
      })
    })
    onProgress?.((pageIndex + 1) / pages)
  }
  pdf.setProducer('Filevra')
  pdf.setTitle(`${name} spreadsheet`)
  const bytes = await pdf.save()
  return {
    outputs: [
      {
        name: outputName(files[0].name, 'pdf'),
        blob: new Blob([bytes], { type: 'application/pdf' }),
        note: `${table.length} row(s), ${pages} page(s)`,
      },
    ],
    warning: 'The PDF is a plain table render. Colours, formulas, charts, merged cells and column widths from the spreadsheet are not reproduced.',
  }
}

export default {
  csvToJson,
  jsonToCsv,
  csvToXlsx,
  xlsxToCsv,
  xlsxToJson,
  jsonToXlsx,
  xlsToXlsx,
  preview,
  excelToPdf,
}
