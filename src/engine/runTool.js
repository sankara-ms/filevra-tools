const GROUPS = {
  image: () => import('./runners/image'),
  pdf: () => import('./runners/pdf'),
  document: () => import('./runners/document'),
  sheet: () => import('./runners/sheet'),
  presentation: () => import('./runners/presentation'),
  text: () => import('./runners/text'),
  file: () => import('./runners/file'),
}

const RUNNERS = {
  'image-convert': ['image', 'convert'],
  'image-resize': ['image', 'resize'],
  'image-compress': ['image', 'compress'],
  'image-crop': ['image', 'crop'],
  'image-rotate': ['image', 'rotate'],
  'image-watermark': ['image', 'watermark'],
  'image-thumbnail': ['image', 'thumbnail'],
  'image-metadata': ['image', 'metadata'],
  'image-strip': ['image', 'strip'],
  'image-palette': ['image', 'palette'],
  'image-background': ['image', 'background'],
  'image-compare': ['image', 'compare'],
  'image-dimensions': ['image', 'dimensions'],
  'image-to-ico': ['image', 'toIco'],
  'pdf-split': ['pdf', 'split'],
  'pdf-extract': ['pdf', 'extract'],
  'pdf-delete': ['pdf', 'removePages'],
  'pdf-rotate': ['pdf', 'rotate'],
  'pdf-organize': ['pdf', 'organize'],
  'pdf-page-numbers': ['pdf', 'pageNumbers'],
  'pdf-watermark': ['pdf', 'watermark'],
  'pdf-to-images': ['pdf', 'toImages'],
  'pdf-metadata': ['pdf', 'metadata'],
  'pdf-to-text': ['pdf', 'toText'],
  'pdf-protect': ['pdf', 'protect'],
  'pdf-unlock': ['pdf', 'unlock'],
  'pdf-crop': ['pdf', 'crop'],
  'pdf-preview': ['pdf', 'preview'],
  'pdf-grayscale': ['pdf', 'grayscale'],
  'pdf-compress': ['pdf', 'compress'],
  'pdf-compare': ['pdf', 'compare'],
  'doc-images-to-pdf': ['document', 'imagesToPdf'],
  'doc-txt-to-pdf': ['document', 'txtToPdf'],
  'doc-txt-to-docx': ['document', 'txtToDocx'],
  'doc-docx-to-text': ['document', 'docxToText'],
  'doc-docx-to-html': ['document', 'docxToHtml'],
  'doc-docx-to-markdown': ['document', 'docxToMarkdown'],
  'doc-docx-to-pdf': ['document', 'docxToPdf'],
  'doc-markdown-to-html': ['document', 'markdownToHtml'],
  'doc-markdown-to-pdf': ['document', 'markdownToPdf'],
  'doc-html-to-markdown': ['document', 'htmlToMarkdown'],
  'doc-html-to-pdf': ['document', 'htmlToPdf'],
  'sheet-csv-to-json': ['sheet', 'csvToJson'],
  'sheet-json-to-csv': ['sheet', 'jsonToCsv'],
  'sheet-csv-to-xlsx': ['sheet', 'csvToXlsx'],
  'sheet-xlsx-to-csv': ['sheet', 'xlsxToCsv'],
  'sheet-xlsx-to-json': ['sheet', 'xlsxToJson'],
  'sheet-json-to-xlsx': ['sheet', 'jsonToXlsx'],
  'sheet-excel-to-pdf': ['sheet', 'excelToPdf'],
  'sheet-preview': ['sheet', 'preview'],
  'sheet-xls-to-xlsx': ['sheet', 'xlsToXlsx'],
  'presentation-text': ['presentation', 'extractText'],
  'text-json-format': ['text', 'jsonFormat'],
  'text-json-validate': ['text', 'jsonValidate'],
  'text-xml-format': ['text', 'xmlFormat'],
  'text-xml-validate': ['text', 'xmlValidate'],
  'text-base64-encode': ['text', 'base64Encode'],
  'text-base64-decode': ['text', 'base64Decode'],
  'text-url-encode': ['text', 'urlEncode'],
  'text-url-decode': ['text', 'urlDecode'],
  'text-code-format': ['text', 'codeFormat'],
  'text-code-minify': ['text', 'codeMinify'],
  'text-word-count': ['text', 'wordCount'],
  'text-case': ['text', 'changeCase'],
  'text-compare': ['text', 'compare'],
  'text-sha256': ['text', 'sha256'],
  'text-md5': ['text', 'md5'],
  'text-qr': ['text', 'qr'],
  'text-barcode': ['text', 'barcode'],
  'text-markdown-preview': ['text', 'markdownPreview'],
  'file-zip': ['file', 'zip'],
  'file-unzip': ['file', 'unzip'],
  'file-rename': ['file', 'rename'],
  'file-sizes': ['file', 'sizes'],
  'file-type': ['file', 'type'],
}

const cache = new Map()

export async function runTool(tool, payload) {
  const entry = RUNNERS[tool.runner]
  if (!entry) throw new Error('This tool is not wired to a processing function.')
  const [group, fnName] = entry
  let module = cache.get(group)
  if (!module) {
    module = await GROUPS[group]()
    cache.set(group, module)
  }
  const runners = module.default || module
  const fn = runners[fnName]
  if (typeof fn !== 'function') throw new Error('This tool has no processing function yet.')
  return fn(payload)
}

export function runnerGroupOf(tool) {
  return RUNNERS[tool.runner]?.[0] || null
}
