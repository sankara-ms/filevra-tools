import { useState } from 'react'
import SEO from '../../components/SEO/SEO'
import ToolPageShell from '../../components/ToolPageShell/ToolPageShell'
import FileUpload from '../../components/FileUpload/FileUpload'
import FileQueue from '../../components/FileQueue/FileQueue'
import ProgressBar from '../../components/ProgressBar/ProgressBar'
import ErrorMessage, { Alert } from '../../components/ErrorMessage/ErrorMessage'
import ResultCard from '../../components/ResultCard/ResultCard'
import Icon from '../../components/Icon/Icon'
import { TOOL_BY_ID } from '../../config/tools'
import { compressPdf } from '../../tools/pdfCompressor'
import { formatBytes, reductionPercent, replaceExtension } from '../../utils/format'
import { downloadBlob, readError, validatePdfFile } from '../../utils/files'
import { faqJsonLd, webAppJsonLd } from '../../utils/schema'

const TOOL = TOOL_BY_ID['compress-pdf']

const DPI_OPTIONS = [
  { value: 96, label: '96 DPI — smallest file, softest detail' },
  { value: 120, label: '120 DPI — balanced (recommended)' },
  { value: 150, label: '150 DPI — sharper, larger file' },
]

const STEPS = [
  {
    title: 'Add a scanned PDF',
    text: 'Choose a PDF up to 50 MB and 100 pages. The original size is shown so the final comparison is clear.',
  },
  {
    title: 'Choose quality and resolution',
    text: 'Lower JPEG quality and lower DPI produce a smaller file. 120 DPI is a reasonable starting point for documents that will be read on screen.',
  },
  {
    title: 'Compare honestly',
    text: 'The tool reports the real before-and-after sizes. If the result is not smaller, it says so and you keep the original.',
  },
]

const FORMATS = [
  { label: 'Input format', value: 'PDF, up to 50 MB and 100 pages' },
  { label: 'Output format', value: 'PDF with one JPEG image per page' },
  { label: 'Resolution options', value: '96, 120 or 150 DPI' },
  { label: 'JPEG quality', value: '40% to 85%' },
  { label: 'Text layer', value: 'Removed — the result is not searchable' },
  { label: 'Processing', value: 'Inside this browser tab, on your device' },
]

const LIMITS = [
  'This is not a lossless optimiser. Pages are re-rendered, so selectable text becomes part of an image and cannot be searched, copied or read by screen readers.',
  'Text-heavy PDFs can grow instead of shrinking. Re-rendering a small, efficient text PDF adds image data that was never there.',
  'There is no OCR. The result does not regain a text layer.',
  'Pages with complex transparency, annotations or form fields are flattened into the rendered image.',
  'The compressor handles up to 100 pages. Larger documents may exhaust the memory of a phone or older computer.',
  'Password-protected PDFs must be unlocked before compression.',
]

const FAQS = [
  {
    question: 'Why did my PDF get bigger?',
    answer:
      'A PDF made mostly of text and vector lines is already compact. Turning each page into a JPEG can add more data than the original contained. When that happens, FormReady reports the increase, does not offer the re-encoded file, and suggests keeping the original.',
  },
  {
    question: 'Will the text still be selectable after compression?',
    answer:
      'No. The compressor rebuilds the PDF from images of each page, so the text layer is gone. Use it for scans and photographed documents, not for contracts or reports you may need to search or copy.',
  },
  {
    question: 'Which quality setting should I choose?',
    answer:
      'Start with 120 DPI and 65% quality for documents that will be read on a screen or submitted through a portal. Use 150 DPI when small print must stay legible, and 96 DPI only when the size limit matters more than sharpness.',
  },
  {
    question: 'Can FormReady compress a password-protected PDF?',
    answer:
      'No. The document cannot be opened without the password, and the tool never asks you to transmit one. Open the PDF in a reader, remove the password, save a copy, and compress that copy.',
  },
  {
    question: 'Does this work on a phone?',
    answer:
      'It can, but phones have less memory. A 100-page scan may fail on an older device. If the progress stops or the tab reloads, try again on a computer or split the document first.',
  },
  {
    question: 'Is my PDF uploaded anywhere?',
    answer:
      'No. The file is read and re-rendered entirely in this browser tab. FormReady does not receive the document, and closing the page discards the working data.',
  },
]

export default function PDFCompressor() {
  const [file, setFile] = useState(null)
  const [quality, setQuality] = useState(65)
  const [dpi, setDpi] = useState(120)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const reset = () => {
    setFile(null)
    setResult(null)
    setError('')
    setProgress(0)
    setQuality(65)
    setDpi(120)
  }

  const acceptFile = (files) => {
    const next = files[0]
    const problem = validatePdfFile(next)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setResult(null)
    setProgress(0)
    setFile(next)
  }

  const runCompression = async () => {
    if (!file || busy) return
    setError('')
    setResult(null)
    setBusy(true)
    setProgress(0)
    try {
      const output = await compressPdf(file, {
        dpi: Number(dpi),
        quality: quality / 100,
        onProgress: setProgress,
      })
      setResult(output)
    } catch (processingError) {
      setError(readError(processingError))
    } finally {
      setBusy(false)
    }
  }

  const outputName = file ? `compressed-${replaceExtension(file.name, 'pdf')}` : 'compressed.pdf'
  const improved = result?.smaller
  const increase = result && !result.smaller ? Math.round(((result.size - result.originalSize) / result.originalSize) * 1000) / 10 : 0

  return (
    <>
      <SEO
        title="Compress PDF Online - Reduce Scanned PDF Size | FormReady"
        description="Reduce the size of scanned or image-heavy PDFs by re-rendering pages at a lower resolution. Choose quality and DPI and see an honest comparison with the original."
        path="/compress-pdf"
        jsonLd={[
          webAppJsonLd({
            name: 'FormReady PDF Compressor',
            description:
              'Compress scanned or image-heavy PDF files in the browser by re-rendering pages at a lower resolution.',
            path: '/compress-pdf',
          }),
          faqJsonLd(FAQS),
        ]}
      />
      <ToolPageShell
        tool={TOOL}
        title="Compress a PDF file"
        intro="Built for scanned and image-heavy PDFs. Pages are re-rendered at the resolution and quality you choose, and the result is compared honestly with the original file."
        facts={[
          'Up to 50 MB and 100 pages',
          'Choose 96, 120 or 150 DPI',
          'Real size comparison',
          'No upload and no OCR',
        ]}
        steps={STEPS}
        formats={FORMATS}
        limits={LIMITS}
        faqs={FAQS}
        about={
          <>
            <h2>Two very different meanings of “compress PDF”</h2>
            <p>
              A text PDF stores instructions such as “draw this character in this font at this position”. It is already
              compact, and stripping metadata or rewriting the structure saves very little. A scanned PDF stores a
              large picture of each page, which is where real savings exist. This tool targets the second kind: it
              renders every page to an image, encodes that image as JPEG at your chosen quality, and builds a new PDF
              from those images.
            </p>
            <p>
              That is why the tool refuses to call a larger file a success. If your PDF is mostly text, re-rendering may
              add data rather than remove it. In that case the original is the better file, and the result panel tells
              you so instead of handing you a worse document.
            </p>
            <h2>Choosing DPI and quality</h2>
            <p>
              DPI controls how many pixels are used to represent each page. At 96 DPI an A4 page is roughly 794 × 1123
              pixels; at 150 DPI it is about 1240 × 1754. More pixels preserve small print but increase size quickly.
              JPEG quality then controls how much detail is discarded within those pixels. For screen reading and
              portal uploads, 120 DPI and 65% quality is a good starting point. For archival or print use, the tool is
              the wrong choice: keep the original instead.
            </p>
            <h2>What you lose</h2>
            <p>
              Re-rendering flattens the page. Selectable text, links, form fields, annotations and accessibility
              information are replaced by a picture. If the document must remain searchable, do not use raster
              compression; the trade-off is unavoidable. There is no OCR in this tool, so the text does not come back.
            </p>
            <h2>Privacy and memory</h2>
            <p>
              The PDF never leaves the device. Browser memory is the practical limit: each page is rendered, encoded
              and released in sequence, but a long scanned document still needs room to work. If a very large file
              fails, split it into smaller parts and compress them separately.
            </p>
          </>
        }
      >
        <div className="fr-tool-shell">
          <div className="fr-workspace-head">
            <div>
              <h2>Compress a PDF</h2>
              <p>PDF · up to 50 MB · up to 100 pages</p>
            </div>
            {file ? (
              <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={reset} data-testid="reset-tool">
                <Icon name="RotateCcw" size={15} />
                Reset
              </button>
            ) : null}
          </div>

          <Alert tone="warning" testId="raster-warning">
            Pages are converted to images. Selectable text and links will be removed, and a text-based PDF may not
            shrink.
          </Alert>

          {!file ? (
            <FileUpload
              id="pdf-compress-input"
              title="Drop a PDF here"
              hint="or browse your device · PDF · up to 50 MB"
              accept="application/pdf,.pdf"
              onFiles={acceptFile}
              testId="compress-dropzone"
            />
          ) : (
            <>
              <FileQueue
                items={[{ key: `${file.name}-${file.size}`, name: file.name, size: file.size }]}
                onRemove={reset}
              />
              <hr className="fr-divider" />
              <div className="fr-field" style={{ maxWidth: 420 }}>
                <label htmlFor="pdf-dpi">Page resolution</label>
                <select
                  id="pdf-dpi"
                  className="fr-input"
                  value={dpi}
                  onChange={(event) => setDpi(Number(event.target.value))}
                  disabled={busy}
                  data-testid="dpi-select"
                >
                  {DPI_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fr-field" style={{ maxWidth: 420 }}>
                <label htmlFor="pdf-quality">JPEG quality: {quality}%</label>
                <input
                  id="pdf-quality"
                  type="range"
                  min="40"
                  max="85"
                  step="5"
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  disabled={busy}
                  className="w-100"
                  style={{ accentColor: 'var(--fr-primary)' }}
                  data-testid="quality-range"
                />
                <p className="fr-field-hint">Lower quality means a smaller file and softer small text.</p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="fr-btn fr-btn-primary"
                  onClick={runCompression}
                  disabled={busy}
                  data-testid="compress-pdf-button"
                >
                  <Icon name="Archive" size={17} />
                  {busy ? 'Compressing…' : 'Compress PDF'}
                </button>
                <button type="button" className="fr-btn fr-btn-secondary" onClick={reset} disabled={busy}>
                  Choose another file
                </button>
              </div>
              {busy ? (
                <>
                  <ProgressBar value={progress} label="Compressing PDF" />
                  <p className="fr-small fr-muted mb-0">Rendering pages one at a time. Keep this tab open.</p>
                </>
              ) : null}
            </>
          )}

          <ErrorMessage>{error}</ErrorMessage>

          {result ? (
            <ResultCard
              title={improved ? 'Compressed PDF ready' : 'The re-rendered PDF was not smaller'}
              tone={improved ? 'success' : 'warning'}
              stats={[
                { label: 'Original', value: formatBytes(result.originalSize) },
                { label: 'Re-rendered', value: formatBytes(result.size) },
                {
                  label: improved ? 'Saved' : 'Increase',
                  value: improved ? `${reductionPercent(result.originalSize, result.size)}%` : `+${increase}%`,
                },
              ]}
              warning={
                improved
                  ? null
                  : 'Re-encoding this PDF produced a larger file, so it was discarded. Your original is still the best copy. This usually means the PDF is mostly text rather than a scan.'
              }
              onDownload={() =>
                improved ? downloadBlob(result.blob, outputName) : downloadBlob(file, file.name)
              }
              downloadLabel={improved ? 'Download compressed PDF' : 'Download original PDF'}
              onReset={reset}
            >
              <p className="fr-small mb-0">
                {result.pageCount} page(s) · {result.dpi} DPI · JPEG quality {Math.round(result.quality * 100)}%
                {improved ? ' · text is now part of the page image' : ''}
              </p>
            </ResultCard>
          ) : null}
        </div>
      </ToolPageShell>
    </>
  )
}
