import { diffLines } from '../diff'

function checkAbort(signal) {
  if (signal?.aborted) throw new DOMException('Processing cancelled.', 'AbortError')
}

export async function readText({ texts, files }) {
  if (texts && typeof texts.input === 'string') return texts.input
  if (files?.length) {
    if (files[0].size > 5 * 1024 * 1024) throw new Error('Text input is limited to 5 MB.')
    return files[0].text()
  }
  return ''
}

function requireText(value) {
  if (!value || !value.trim()) throw new Error('Enter or paste some text first.')
  return value
}

export async function jsonFormat({ texts, options = {}, onProgress }) {
  const source = requireText(await readText({ texts }))
  let parsed
  try {
    parsed = JSON.parse(source)
  } catch (error) {
    throw new Error(`Invalid JSON: ${String(error.message).replace(/^JSON\.parse: /, '')}`, { cause: error })
  }
  const indent = options.indent === 'tab' ? '\t' : Number(options.indent) || 2
  onProgress?.(1)
  return {
    text: JSON.stringify(parsed, null, indent),
    outputExt: 'json',
    outputName: 'filevra-formatted.json',
    info: [{ heading: 'Result', rows: [{ label: 'Status', value: 'Valid JSON, reformatted.' }] }],
  }
}

export async function jsonValidate({ texts, onProgress }) {
  const source = requireText(await readText({ texts }))
  try {
    const parsed = JSON.parse(source)
    const rows = [{ label: 'Status', value: 'Valid JSON' }]
    rows.push({ label: 'Top-level type', value: Array.isArray(parsed) ? 'array' : typeof parsed })
    if (Array.isArray(parsed)) rows.push({ label: 'Items', value: String(parsed.length) })
    else if (parsed && typeof parsed === 'object') rows.push({ label: 'Keys', value: String(Object.keys(parsed).length) })
    onProgress?.(1)
    return { info: [{ heading: 'Validation', rows }] }
  } catch (error) {
    throw new Error(`Invalid JSON: ${String(error.message).replace(/^JSON\.parse: /, '')}`, { cause: error })
  }
}

function formatXmlNode(node, depth = 0) {
  const indent = '  '.repeat(depth)
  if (node.nodeType === Node.TEXT_NODE) {
    const value = node.nodeValue.trim()
    return value ? `${indent}${value}` : ''
  }
  if (node.nodeType === Node.COMMENT_NODE) return `${indent}<!--${node.nodeValue}-->`
  if (node.nodeType === Node.CDATA_SECTION_NODE) return `${indent}<![CDATA[${node.nodeValue}]]>`
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const attributes = [...node.attributes].map((attribute) => ` ${attribute.name}="${attribute.value}"`).join('')
  const children = [...node.childNodes]
  if (!children.length) return `${indent}<${node.nodeName}${attributes}/>`
  const onlyText = children.length === 1 && children[0].nodeType === Node.TEXT_NODE
  if (onlyText) return `${indent}<${node.nodeName}${attributes}>${children[0].nodeValue.trim()}</${node.nodeName}>`
  const inner = children.map((child) => formatXmlNode(child, depth + 1)).filter(Boolean).join('\n')
  return `${indent}<${node.nodeName}${attributes}>\n${inner}\n${indent}</${node.nodeName}>`
}

function parseXml(source) {
  const document = new DOMParser().parseFromString(source, 'application/xml')
  const error = document.querySelector('parsererror')
  if (error) {
    const message = error.textContent.replace(/\s+/g, ' ').trim()
    throw new Error(`Invalid XML: ${message.slice(0, 300)}`)
  }
  return document
}

export async function xmlFormat({ texts, onProgress }) {
  const source = requireText(await readText({ texts }))
  const document = parseXml(source)
  onProgress?.(1)
  return {
    text: formatXmlNode(document.documentElement),
    outputExt: 'xml',
    outputName: 'filevra-formatted.xml',
    info: [{ heading: 'Result', rows: [{ label: 'Root element', value: document.documentElement.nodeName }] }],
  }
}

export async function xmlValidate({ texts, onProgress }) {
  const source = requireText(await readText({ texts }))
  const document = parseXml(source)
  onProgress?.(1)
  return {
    info: [
      {
        heading: 'Validation',
        rows: [
          { label: 'Status', value: 'Well-formed XML' },
          { label: 'Root element', value: document.documentElement.nodeName },
          { label: 'Elements', value: String(document.getElementsByTagName('*').length) },
        ],
      },
    ],
    warning: 'This checks that the XML is well-formed. It does not validate against a DTD or schema.',
  }
}

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

export async function base64Encode({ texts, options = {} }) {
  const source = await readText({ texts })
  const bytes = new TextEncoder().encode(source)
  let result = bytesToBase64(bytes)
  if (options.variant === 'url') result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  if (options.wrap) result = result.replace(/(.{76})/g, '$1\n')
  return {
    text: result,
    outputExt: 'txt',
    outputName: 'filevra-base64.txt',
    info: [{ heading: 'Result', rows: [{ label: 'Input bytes', value: String(bytes.length) }] }],
  }
}

export async function base64Decode({ texts, options = {} }) {
  let source = (await readText({ texts })).replace(/\s+/g, '')
  if (options.variant === 'url') source = source.replace(/-/g, '+').replace(/_/g, '/')
  source = source.replace(/=+$/, '')
  if (!/^[A-Za-z0-9+/]*$/.test(source)) throw new Error('That is not valid Base64. Check for missing characters or stray punctuation.')
  const bytes = base64ToBytes(source.padEnd(Math.ceil(source.length / 4) * 4, '='))
  let text
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error('The Base64 decodes to binary data, not UTF-8 text. Use a file-level decoder for binary content.')
  }
  return {
    text,
    outputExt: 'txt',
    outputName: 'filevra-decoded.txt',
    info: [{ heading: 'Result', rows: [{ label: 'Decoded bytes', value: String(bytes.length) }] }],
  }
}

export async function urlEncode({ texts, options = {} }) {
  const source = await readText({ texts })
  const encoded = options.style === 'uri' ? encodeURI(source) : encodeURIComponent(source)
  return { text: encoded, outputExt: 'txt', outputName: 'filevra-url-encoded.txt' }
}

export async function urlDecode({ texts }) {
  const source = await readText({ texts })
  try {
    return { text: decodeURIComponent(source), outputExt: 'txt', outputName: 'filevra-url-decoded.txt' }
  } catch {
    throw new Error('That text contains an invalid percent escape, for example a lone % or %ZZ.')
  }
}

async function prettierFormat(code, language) {
  const prettier = await import('prettier/standalone')
  const parsers =
    language === 'html'
      ? [await import('prettier/plugins/html')]
      : language === 'css'
        ? [await import('prettier/plugins/postcss')]
        : [await import('prettier/plugins/babel'), await import('prettier/plugins/estree')]
  const parser = language === 'html' ? 'html' : language === 'css' ? 'css' : 'babel'
  return prettier.format(code, { parser, plugins: parsers, printWidth: 100, semi: false })
}

export async function codeFormat({ texts, options = {} }) {
  const source = requireText(await readText({ texts }))
  const language = options.language || 'js'
  if (language === 'json') return jsonFormat({ texts, options: { indent: 2 } })
  if (language === 'xml') return xmlFormat({ texts })
  const formatted = await prettierFormat(source, language)
  return {
    text: formatted,
    outputExt: language === 'html' ? 'html' : language === 'css' ? 'css' : 'js',
    outputName: `filevra-formatted.${language === 'html' ? 'html' : language === 'css' ? 'css' : 'js'}`,
  }
}

function minifyCss(source) {
  let output = ''
  let index = 0
  let quote = null
  while (index < source.length) {
    const character = source[index]
    if (quote) {
      output += character
      if (character === '\\') {
        output += source[index + 1] || ''
        index += 2
        continue
      }
      if (character === quote) quote = null
      index += 1
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      output += character
      index += 1
      continue
    }
    if (character === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2)
      index = end === -1 ? source.length : end + 2
      continue
    }
    if (/\s/.test(character)) {
      while (index < source.length && /\s/.test(source[index])) index += 1
      output += ' '
      continue
    }
    output += character
    index += 1
  }
  return output.replace(/\s*([{};:,>])\s*/g, '$1').replace(/;}/g, '}').trim()
}

const RAW_BLOCKS = /(<(pre|textarea|script|style)\b[\s\S]*?<\/\2>)/gi

function minifyHtml(source) {
  const parts = source.split(RAW_BLOCKS)
  let output = ''
  for (let index = 0; index < parts.length; index += 2) {
    const plain = parts[index] || ''
    output += plain
      .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*/g, '\n')
      .trim()
    if (parts[index + 1]) output += parts[index + 1]
  }
  return output.replace(/>\n</g, '><').trim()
}

function minifyXml(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function codeMinify({ texts, options = {} }) {
  const source = requireText(await readText({ texts }))
  const language = options.language || 'js'
  let result
  if (language === 'json') {
    try {
      result = JSON.stringify(JSON.parse(source))
    } catch (error) {
      throw new Error(`Invalid JSON: ${String(error.message).replace(/^JSON\.parse: /, '')}`, { cause: error })
    }
  } else if (language === 'css') {
    result = minifyCss(source)
  } else if (language === 'html') {
    result = minifyHtml(source)
  } else if (language === 'xml') {
    result = minifyXml(source)
  } else {
    const module = await import('terser-browser')
    const minify = module.minify || module.default?.minify
    if (typeof minify !== 'function') throw new Error('The JavaScript minifier could not be loaded in this browser.')
    const output = await minify(source, { compress: true, mangle: true })
    if (output.error) throw new Error(String(output.error.message || output.error))
    result = output.code
  }
  return {
    text: result,
    outputExt: language === 'html' ? 'html' : language === 'css' ? 'css' : language === 'xml' ? 'xml' : language === 'json' ? 'json' : 'js',
    outputName: `filevra-minified.${language === 'html' ? 'html' : language === 'css' ? 'css' : language === 'xml' ? 'xml' : language === 'json' ? 'json' : 'js'}`,
    info: [
      {
        heading: 'Result',
        rows: [
          { label: 'Before', value: `${source.length} characters` },
          { label: 'After', value: `${result.length} characters` },
        ],
      },
    ],
    warning: language === 'html' ? 'HTML and CSS minification here is conservative: comments and extra whitespace are removed, but inline spacing is preserved.' : undefined,
  }
}

export async function wordCount({ texts }) {
  const source = await readText({ texts })
  const words = source.trim() ? source.trim().split(/\s+/u) : []
  const sentences = source.trim() ? source.trim().split(/[.!?。！？]+(?:\s|$)/u).filter((part) => part.trim()) : []
  const paragraphs = source.split(/\n\s*\n/).filter((part) => part.trim()).length
  const characters = [...source].length
  const noSpaces = [...source.replace(/\s/gu, '')].length
  const readingMinutes = Math.max(0, Math.ceil(words.length / 200))
  return {
    info: [
      {
        heading: 'Text statistics',
        rows: [
          { label: 'Words', value: words.length.toLocaleString('en-US') },
          { label: 'Characters', value: characters.toLocaleString('en-US') },
          { label: 'Characters (no spaces)', value: noSpaces.toLocaleString('en-US') },
          { label: 'Sentences', value: sentences.length.toLocaleString('en-US') },
          { label: 'Paragraphs', value: String(paragraphs) },
          { label: 'Lines', value: String(source.split(/\r?\n/).length) },
          { label: 'Reading time', value: readingMinutes <= 1 ? 'About 1 minute' : `About ${readingMinutes} minutes` },
        ],
      },
    ],
  }
}

export async function changeCase({ texts, options = {} }) {
  const source = await readText({ texts })
  const mode = options.mode || 'upper'
  let result
  switch (mode) {
    case 'lower':
      result = source.toLocaleLowerCase()
      break
    case 'sentence':
      result = source.toLocaleLowerCase().replace(/(^\s*[a-z\u00c0-\u024f])|([.!?]\s+[a-z\u00c0-\u024f])/gu, (match) => match.toLocaleUpperCase())
      break
    case 'title':
      result = source.toLocaleLowerCase().replace(/\b\p{L}[\p{L}'’-]*/gu, (word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
      break
    case 'camel':
    case 'pascal':
    case 'snake':
    case 'kebab': {
      const parts = source
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[^A-Za-z0-9\u00c0-\u024f]+/)
        .filter(Boolean)
        .map((word) => word.toLocaleLowerCase())
      if (mode === 'camel') result = parts.map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))).join('')
      else if (mode === 'pascal') result = parts.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('')
      else if (mode === 'snake') result = parts.join('_')
      else result = parts.join('-')
      break
    }
    default:
      result = source.toLocaleUpperCase()
  }
  return { text: result, outputExt: 'txt', outputName: 'filevra-text.txt' }
}

export async function compare({ texts, onProgress }) {
  const left = texts?.left ?? ''
  const right = texts?.right ?? ''
  if (!left.trim() && !right.trim()) throw new Error('Paste text into both boxes first.')
  const diff = diffLines(left, right)
  onProgress?.(1)
  return {
    text: diff.text,
    outputExt: 'txt',
    outputName: 'filevra-text-diff.txt',
    info: [
      {
        heading: 'Comparison',
        rows: [
          { label: 'Lines added', value: String(diff.added) },
          { label: 'Lines removed', value: String(diff.removed) },
          { label: 'Result', value: diff.identical ? 'The two texts are identical.' : 'The texts differ.' },
        ],
      },
    ],
  }
}

export async function sha256({ files, signal }) {
  const lines = []
  for (const file of files) {
    checkAbort(signal)
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    lines.push(`${hex}  ${file.name}`)
  }
  return {
    text: lines.join('\n'),
    outputExt: 'txt',
    outputName: 'filevra-sha256.txt',
    info: [{ heading: 'Files hashed', rows: [{ label: 'Count', value: String(files.length) }] }],
  }
}

export async function md5({ files, signal }) {
  const SparkMD5 = (await import('spark-md5')).default
  const lines = []
  for (const file of files) {
    checkAbort(signal)
    const buffer = await file.arrayBuffer()
    const hash = SparkMD5.ArrayBuffer.hash(buffer)
    lines.push(`${hash}  ${file.name}`)
  }
  return {
    text: lines.join('\n'),
    outputExt: 'txt',
    outputName: 'filevra-md5.txt',
    warning: 'MD5 is fast but no longer secure against deliberate collision attacks. Use SHA-256 when integrity matters.',
  }
}

function dataUrlToBlob(dataUrl) {
  const [head, base64] = dataUrl.split(',')
  const mime = head.match(/data:([^;]+)/)?.[1] || 'image/png'
  return new Blob([base64ToBytes(base64)], { type: mime })
}

export async function qr({ texts, options = {} }) {
  const source = requireText(await readText({ texts }))
  if (source.length > 2900) throw new Error('QR content is limited to about 2,900 characters.')
  const QRCode = (await import('qrcode')).default
  const size = Math.min(2048, Math.max(64, Number(options.size) || 512))
  const dataUrl = await QRCode.toDataURL(source, {
    width: size,
    margin: Math.min(8, Math.max(0, Number(options.margin) || 2)),
    errorCorrectionLevel: options.level || 'M',
    color: { dark: options.dark || '#111111', light: options.light || '#ffffff' },
  })
  return {
    outputs: [
      {
        name: 'filevra-qr.png',
        blob: dataUrlToBlob(dataUrl),
        note: `${size} × ${size} PNG`,
      },
    ],
    previews: [{ name: 'QR code', src: dataUrl }],
  }
}

export async function barcode({ texts, options = {} }) {
  const source = requireText(await readText({ texts })).trim()
  const JsBarcode = (await import('jsbarcode')).default
  const format = options.format || 'CODE128'
  const canvas = document.createElement('canvas')
  try {
    JsBarcode(canvas, source, {
      format,
      width: Math.min(6, Math.max(1, Number(options.width) || 2)),
      height: Math.min(200, Math.max(30, Number(options.height) || 100)),
      displayValue: options.showText !== false,
      background: '#ffffff',
      lineColor: '#111111',
      margin: 12,
    })
  } catch (error) {
    throw new Error(`This text does not fit the ${format} format. ${String(error?.message || '').slice(0, 120)}`, { cause: error })
  }
  const dataUrl = canvas.toDataURL('image/png')
  return {
    outputs: [{ name: `filevra-${format.toLowerCase()}.png`, blob: dataUrlToBlob(dataUrl), note: `${canvas.width} × ${canvas.height} PNG` }],
    previews: [{ name: 'Barcode', src: dataUrl }],
  }
}

export async function markdownPreview({ texts, onProgress }) {
  const source = requireText(await readText({ texts }))
  const { marked } = await import('marked')
  const DOMPurify = (await import('dompurify')).default
  const html = DOMPurify.sanitize(marked.parse(source, { gfm: true, breaks: false }))
  onProgress?.(1)
  return {
    html,
    outputs: [{ name: 'filevra-markdown.html', blob: new Blob([html], { type: 'text/html' }), note: 'HTML fragment' }],
  }
}

export default {
  jsonFormat,
  jsonValidate,
  xmlFormat,
  xmlValidate,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  codeFormat,
  codeMinify,
  wordCount,
  changeCase,
  compare,
  sha256,
  md5,
  qr,
  barcode,
  markdownPreview,
}
