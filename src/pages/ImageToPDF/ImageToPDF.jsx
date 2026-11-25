import { useEffect, useRef, useState } from 'react'
import SEO from '../../components/SEO/SEO'
import ToolPageShell from '../../components/ToolPageShell/ToolPageShell'
import FileUpload from '../../components/FileUpload/FileUpload'
import FileQueue from '../../components/FileQueue/FileQueue'
import ProgressBar from '../../components/ProgressBar/ProgressBar'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import ResultCard from '../../components/ResultCard/ResultCard'
import Icon from '../../components/Icon/Icon'
import { TOOL_BY_ID } from '../../config/tools'
import { imagesToPdf } from '../../tools/imageToPdf'
import { formatBytes } from '../../utils/format'
import { downloadBlob, readError, validateImageFile } from '../../utils/files'
import { faqJsonLd, webAppJsonLd } from '../../utils/schema'

const TOOL = TOOL_BY_ID['image-to-pdf']
const MAX_IMAGES = 20

const STEPS = [
  {
    title: 'Add your images',
    text: 'Select up to 20 JPG, PNG or WebP files. Each image becomes one A4 page, and thumbnails confirm what was added.',
  },
  {
    title: 'Put them in order',
    text: 'Use the arrow buttons to move an image up or down. The PDF follows this list from top to bottom.',
  },
  {
    title: 'Create and download',
    text: 'The PDF is assembled locally, one page per image. Download it and open it once to confirm the order before sending it anywhere.',
  },
]

const FORMATS = [
  { label: 'Input formats', value: 'JPG, JPEG, PNG, WebP' },
  { label: 'Images per PDF', value: 'Up to 20' },
  { label: 'Maximum input size', value: '30 MB per image' },
  { label: 'Output pages', value: 'A4 portrait, one image per page' },
  { label: 'Page margin', value: 'About 12.7 mm (36 points) on every side' },
  { label: 'Processing', value: 'Inside this browser tab, on your device' },
]

const LIMITS = [
  'The page size is fixed to A4 portrait. Landscape photos are centred with space above and below rather than rotated.',
  'Images are not enlarged beyond their natural size, so a small photo will not fill the page.',
  'The PDF contains images only. There is no OCR and no text layer, so the result is not searchable or selectable.',
  'Images larger than the printable area are scaled down to fit; the original file is not changed.',
  'Transparent PNG areas are flattened onto white.',
]

const FAQS = [
  {
    question: 'What order will the pages be in?',
    answer:
      'Exactly the order shown in the list. Use the up and down buttons to change it before converting. Files are not sorted by name or date automatically.',
  },
  {
    question: 'Can I choose Letter, A4 landscape or a custom page size?',
    answer:
      'Not in this version. Every page is A4 portrait with a 36-point margin. Landscape images are fitted within that page instead of receiving their own orientation.',
  },
  {
    question: 'Will the PDF text be searchable?',
    answer:
      'No. The tool embeds each image as a picture on a page. If you need searchable text, the source document must be converted with an OCR tool, which is outside this site’s scope.',
  },
  {
    question: 'How large will the PDF be?',
    answer:
      'Roughly the total size of the processed images, plus a small amount of PDF structure. Each image is re-encoded as high-quality JPEG before embedding, so the PDF is often smaller than the sum of the original files.',
  },
  {
    question: 'Are my images uploaded?',
    answer:
      'No. The images are read from your device and embedded in a PDF built in this tab. Nothing is sent to a server, and closing the page discards the working data.',
  },
  {
    question: 'Why was one of my files skipped?',
    answer:
      'Only JPG, PNG and WebP images up to 30 MB are accepted, and the list is capped at 20 images. A skipped file is reported above the list; remove or convert it first, then add it again.',
  },
]

export default function ImageToPDF() {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState(null)
  const urlsRef = useRef(new Set())

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const releaseItems = (list) => {
    list.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url)
        urlsRef.current.delete(item.url)
      }
    })
  }

  const reset = () => {
    releaseItems(items)
    setItems([])
    setResult(null)
    setError('')
    setNotice('')
    setProgress(0)
  }

  const addFiles = (files) => {
    setError('')
    setResult(null)
    const skipped = []
    const accepted = []

    files.forEach((file) => {
      if (items.length + accepted.length >= MAX_IMAGES) {
        skipped.push(`${file.name} (limit of ${MAX_IMAGES} images)`)
        return
      }
      const problem = validateImageFile(file)
      if (problem) {
        skipped.push(`${file.name} (${problem})`)
        return
      }
      accepted.push(file)
    })

    if (accepted.length) {
      const nextItems = accepted.map((file) => {
        const url = URL.createObjectURL(file)
        urlsRef.current.add(url)
        return { key: `${file.name}-${file.size}-${url}`, file, url }
      })
      setItems((current) => [...current, ...nextItems])
    }

    setNotice(skipped.length ? `Skipped ${skipped.length} file(s): ${skipped.join('; ')}` : '')
  }

  const move = (index, direction) => {
    setResult(null)
    setItems((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const remove = (index) => {
    setResult(null)
    setItems((current) => {
      const item = current[index]
      if (item?.url) {
        URL.revokeObjectURL(item.url)
        urlsRef.current.delete(item.url)
      }
      return current.filter((_, position) => position !== index)
    })
  }

  const convert = async () => {
    if (!items.length || busy) return
    setError('')
    setResult(null)
    setBusy(true)
    setProgress(0)
    try {
      const output = await imagesToPdf(
        items.map((item) => item.file),
        { onProgress: setProgress },
      )
      setResult(output)
    } catch (processingError) {
      setError(readError(processingError))
    } finally {
      setBusy(false)
    }
  }

  const totalSize = items.reduce((sum, item) => sum + item.file.size, 0)

  return (
    <>
      <SEO
        title="Image to PDF - Combine JPG and PNG Images into One PDF | FormReady"
        description="Convert up to 20 JPG, PNG or WebP images into a single A4 PDF in the order you choose. The conversion happens in your browser, with no upload."
        path="/image-to-pdf"
        jsonLd={[
          webAppJsonLd({
            name: 'FormReady Image to PDF Converter',
            description: 'Combine images into a single A4 PDF in the browser, with reordering and no uploads.',
            path: '/image-to-pdf',
          }),
          faqJsonLd(FAQS),
        ]}
      />
      <ToolPageShell
        tool={TOOL}
        title="Convert images to a single PDF"
        intro="Add photos or scans, arrange them in the right order and download one A4 PDF. The PDF is built in this tab, so the images are never uploaded."
        facts={[
          'Up to 20 images per PDF',
          'Reorder before converting',
          'A4 pages with a clean margin',
          'No watermark and no account',
        ]}
        steps={STEPS}
        formats={FORMATS}
        limits={LIMITS}
        faqs={FAQS}
        about={
          <>
            <h2>How images are placed on each page</h2>
            <p>
              Every image becomes its own A4 portrait page. The image is scaled to fit inside a printable area with a
              36-point margin, centred horizontally and vertically, and drawn on a white background. FormReady does not
              enlarge an image beyond its original size, so a small picture stays small instead of turning blurry.
            </p>
            <p>
              Before embedding, images are re-encoded as high-quality JPEG at roughly 144 DPI for an A4 page. That
              keeps the PDF portable and reasonably small, and it also means transparent areas become white. The source
              files on your device are not modified.
            </p>
            <h2>When this is the right conversion</h2>
            <p>
              Image to PDF is designed for photographed documents, receipts, sketches and ID copies that need to
              become one file. It is not a scan-to-text tool: the result has pictures on pages, not a text layer. If a
              portal asks for a searchable PDF, the document must first pass through OCR software, which this tool does
              not provide.
            </p>
            <h2>Keeping the page order correct</h2>
            <p>
              Portals that accept multiple pages usually expect them in a logical sequence — front then back, or page
              one through five. Check the list order before converting; the arrows move one item at a time and the
              first item becomes page one. Opening the finished PDF before submitting it is a quick way to catch a
              reversed page.
            </p>
          </>
        }
      >
        <div className="fr-tool-shell">
          <div className="fr-workspace-head">
            <div>
              <h2>Images to PDF</h2>
              <p>{items.length ? `${items.length} of ${MAX_IMAGES} images · ${formatBytes(totalSize)} total` : `Up to ${MAX_IMAGES} images`}</p>
            </div>
            {items.length ? (
              <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={reset} data-testid="reset-tool">
                <Icon name="RotateCcw" size={15} />
                Reset
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <FileUpload
              id="pdf-images-input"
              title="Drop images here"
              hint={`or browse your device · JPG, PNG, WebP · up to ${MAX_IMAGES} images`}
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              onFiles={addFiles}
              disabled={busy}
              testId="images-dropzone"
            />
          ) : (
            <>
              <FileQueue items={items.map(({ key, file, url }) => ({ key, file, name: file.name, size: file.size, url }))} onMove={move} onRemove={remove} reorderable />
              {items.length < MAX_IMAGES ? (
                <div className="mt-3">
                  <FileUpload
                    id="pdf-images-more"
                    title="Add more images"
                    hint={`${MAX_IMAGES - items.length} place(s) left`}
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    multiple
                    onFiles={addFiles}
                    disabled={busy}
                    testId="images-more-dropzone"
                  />
                </div>
              ) : null}
              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="fr-btn fr-btn-primary"
                  onClick={convert}
                  disabled={busy}
                  data-testid="convert-button"
                >
                  <Icon name="FileImage" size={17} />
                  {busy ? 'Building PDF…' : 'Convert to PDF'}
                </button>
              </div>
              {busy ? <ProgressBar value={progress} label="Building PDF" /> : null}
            </>
          )}

          {notice ? (
            <div className="fr-alert fr-alert--warning mt-3" role="status">
              <Icon name="AlertCircle" size={17} />
              <span>{notice}</span>
            </div>
          ) : null}
          <ErrorMessage>{error}</ErrorMessage>

          {result ? (
            <ResultCard
              title="PDF created"
              stats={[
                { label: 'Images', value: String(items.length) },
                { label: 'Pages', value: String(result.pageCount) },
                { label: 'PDF size', value: formatBytes(result.blob.size) },
              ]}
              onDownload={() => downloadBlob(result.blob, 'formready-images.pdf')}
              downloadLabel="Download PDF"
              onReset={reset}
            >
              <p className="fr-small mb-0">A4 portrait · one image per page · page order follows the list above.</p>
            </ResultCard>
          ) : null}
        </div>
      </ToolPageShell>
    </>
  )
}
