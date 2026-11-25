export async function mergePdfs(files, { onProgress } = {}) {
  const { PDFDocument } = await import('pdf-lib')
  const merged = await PDFDocument.create()

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    let document
    try {
      const bytes = await file.arrayBuffer()
      document = await PDFDocument.load(bytes, { updateMetadata: false })
    } catch {
      throw new Error(
        `"${file.name}" could not be read. The file may be damaged, encrypted or password-protected. Remove it and try again.`,
      )
    }
    const pages = await merged.copyPages(document, document.getPageIndices())
    pages.forEach((page) => merged.addPage(page))
    onProgress?.((index + 1) / files.length)
  }

  merged.setTitle('Merged document')
  merged.setProducer('FormReady')
  const bytes = await merged.save()
  return {
    blob: new Blob([bytes], { type: 'application/pdf' }),
    pageCount: merged.getPageCount(),
  }
}
