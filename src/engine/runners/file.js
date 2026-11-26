import {
  detectFile,
  extensionOf,
  mimeForExtension,
  sanitizeFilename,
  uniqueName,
} from '../shared'
import { formatBytes, stripExtension } from '../../utils/format'

const MAX_ENTRIES = 200
const MAX_UNPACKED = 200 * 1024 * 1024

function checkAbort(signal) {
  if (signal?.aborted) throw new DOMException('Processing cancelled.', 'AbortError')
}

export async function zip({ files, options = {}, onProgress, signal }) {
  const JSZip = (await import('jszip')).default
  const archive = new JSZip()
  const used = new Set()
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    const name = uniqueName(sanitizeFilename(file.name || `file-${index + 1}`), used)
    archive.file(name, file)
    onProgress?.((index + 1) / (files.length + 1))
  }
  const level = Math.min(9, Math.max(1, Number(options.level) || 6))
  const blob = await archive.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level } }, (metadata) => {
    onProgress?.(0.85 + (metadata.percent || 0) / 700)
  })
  onProgress?.(1)
  const name = sanitizeFilename(options.name || 'filevra-files.zip')
  return {
    outputs: [{ name: name.endsWith('.zip') ? name : `${name}.zip`, blob, note: `${files.length} file(s)` }],
    stats: [
      { label: 'Files', value: String(files.length) },
      { label: 'Archive size', value: formatBytes(blob.size) },
    ],
  }
}

export async function unzip({ files, onProgress, signal }) {
  const JSZip = (await import('jszip')).default
  const file = files[0]
  let archive
  try {
    archive = await JSZip.loadAsync(await file.arrayBuffer())
  } catch {
    throw new Error('This ZIP could not be opened. Encrypted archives and damaged downloads are not supported.')
  }
  const entries = Object.values(archive.files).filter((entry) => !entry.dir)
  if (!entries.length) throw new Error('This archive does not contain any files.')
  if (entries.length > MAX_ENTRIES) throw new Error(`This archive contains ${entries.length} files. The extractor is limited to ${MAX_ENTRIES}.`)
  let total = 0
  for (const entry of entries) {
    total += entry._data?.uncompressedSize || 0
  }
  if (total > MAX_UNPACKED) throw new Error('The unpacked archive would be larger than 200 MB. Extract it in smaller parts.')
  const used = new Set()
  const outputs = []
  for (let index = 0; index < entries.length; index += 1) {
    checkAbort(signal)
    const entry = entries[index]
    const blob = await entry.async('blob')
    const path = entry.name.replace(/\\/g, '/')
    const base = sanitizeFilename(path.split('/').filter(Boolean).pop() || `file-${index + 1}`)
    const name = uniqueName(base, used)
    outputs.push({
      name,
      blob: new Blob([blob], { type: mimeForExtension(extensionOf(name)) }),
      note: path,
    })
    onProgress?.((index + 1) / entries.length)
  }
  return {
    outputs,
    stats: [
      { label: 'Files extracted', value: String(outputs.length) },
      { label: 'Unpacked size', value: formatBytes(outputs.reduce((sum, item) => sum + item.blob.size, 0)) },
    ],
    warning: 'Folder structure is flattened and file names are cleaned up. Nothing is written to disk until you download it.',
  }
}

function applyRename(template, file, index, date) {
  const base = stripExtension(file.name)
  const ext = extensionOf(file.name)
  const renamed = template
    .replace(/\{name\}/g, base)
    .replace(/\{ext\}/g, ext)
    .replace(/\{index\}/g, String(index + 1).padStart(2, '0'))
    .replace(/\{date\}/g, date)
  return ext && !template.includes('{ext}') ? `${renamed}.${ext}` : renamed
}

export async function rename({ files, options = {}, onProgress, signal }) {
  const template = String(options.template || '{name}-{index}').slice(0, 80)
  const find = String(options.find || '')
  const replace = String(options.replace || '')
  const date = new Date().toISOString().slice(0, 10)
  const used = new Set()
  const outputs = []
  for (let index = 0; index < files.length; index += 1) {
    checkAbort(signal)
    const file = files[index]
    let name = applyRename(template, file, index, date)
    if (find) name = name.split(find).join(replace)
    name = uniqueName(sanitizeFilename(name || `file-${index + 1}`), used)
    outputs.push({ name, blob: file, note: `Original: ${file.name}` })
    onProgress?.((index + 1) / files.length)
  }
  return {
    outputs,
    warning: 'The files are renamed copies. The download name changes; the contents are untouched.',
  }
}

export async function sizes({ files }) {
  const rows = files.map((file) => ({
    label: file.name,
    value: `${formatBytes(file.size)} · ${formatBytes(file.size, 3)}`,
  }))
  const total = files.reduce((sum, file) => sum + file.size, 0)
  return {
    info: [
      {
        heading: 'File sizes',
        rows: [{ label: 'Total', value: formatBytes(total) }, ...rows],
      },
    ],
  }
}

export async function type({ files }) {
  const info = []
  for (const file of files) {
    const detected = await detectFile(file)
    info.push({
      heading: file.name,
      rows: [
        { label: 'Detected kind', value: detected.label },
        { label: 'Signature extension', value: detected.ext },
        { label: 'Name extension', value: extensionOf(file.name) || 'none' },
        { label: 'Browser MIME type', value: file.type || 'unknown' },
        { label: 'Size', value: formatBytes(file.size) },
        { label: 'Match', value: detected.ext && extensionOf(file.name) && detected.ext !== extensionOf(file.name) ? 'Extension and signature disagree' : 'Consistent' },
      ],
    })
  }
  return { info, warning: 'Detection uses the first bytes of the file. It is a practical check, not a full malware scan.' }
}

export default { zip, unzip, rename, sizes, type }
