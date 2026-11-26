import { outputName } from '../shared'

function checkAbort(signal) {
  if (signal?.aborted) throw new DOMException('Processing cancelled.', 'AbortError')
}

function slideNumber(path) {
  const match = path.match(/slide(\d+)\.xml$/)
  return match ? Number(match[1]) : 0
}

function textFromXml(xml) {
  const parser = new DOMParser()
  const document = parser.parseFromString(xml, 'application/xml')
  if (document.querySelector('parsererror')) return ''
  const paragraphs = [...document.getElementsByTagName('a:p')]
  return paragraphs
    .map((paragraph) =>
      [...paragraph.getElementsByTagName('a:t')]
        .map((node) => node.textContent || '')
        .join('')
        .trim(),
    )
    .filter(Boolean)
    .join('\n')
}

export async function extractText({ files, options = {}, onProgress, signal }) {
  const JSZip = (await import('jszip')).default
  const includeNotes = Boolean(options.includeNotes)
  const file = files[0]
  if (!/\.pptx$/i.test(file.name)) {
    throw new Error('This tool reads modern .pptx presentations. Legacy .ppt files must be saved as .pptx first.')
  }
  let zip
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer())
  } catch {
    throw new Error('This presentation could not be opened. Damaged files and password-protected presentations are not supported.')
  }
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => slideNumber(a) - slideNumber(b))
  if (!slidePaths.length) throw new Error('No slides were found inside this file. It may not be a PowerPoint presentation.')

  const sections = []
  let characters = 0
  for (let index = 0; index < slidePaths.length; index += 1) {
    checkAbort(signal)
    const slideText = textFromXml(await zip.file(slidePaths[index]).async('text'))
    characters += slideText.length
    let section = `## Slide ${slideNumber(slidePaths[index])}\n${slideText || '(no text on this slide)'}`
    if (includeNotes) {
      const notesPath = `ppt/notesSlides/notesSlide${slideNumber(slidePaths[index])}.xml`
      const notesFile = zip.file(notesPath)
      if (notesFile) {
        const notes = textFromXml(await notesFile.async('text'))
        if (notes) section += `\n\nSpeaker notes:\n${notes}`
      }
    }
    sections.push(section)
    onProgress?.((index + 1) / slidePaths.length)
  }

  return {
    text: sections.join('\n\n'),
    outputExt: 'txt',
    outputName: outputName(file.name, 'txt'),
    info: [
      {
        heading: 'Presentation',
        rows: [
          { label: 'Slides', value: String(slidePaths.length) },
          { label: 'Text characters', value: String(characters) },
          { label: 'Speaker notes', value: includeNotes ? 'Included' : 'Not included' },
        ],
      },
    ],
    warning: 'Only text is extracted. Images, charts, shapes, slide design and animations are not reproduced.',
  }
}

export default { extractText }
