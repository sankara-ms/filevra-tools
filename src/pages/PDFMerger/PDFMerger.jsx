import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import ToolPageShell from '../../components/ToolPageShell/ToolPageShell'
import FileUpload from '../../components/FileUpload/FileUpload'
import FileQueue from '../../components/FileQueue/FileQueue'
import ProgressBar from '../../components/ProgressBar/ProgressBar'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import ResultCard from '../../components/ResultCard/ResultCard'
import Icon from '../../components/Icon/Icon'
import { TOOL_BY_ID } from '../../config/tools'
import { mergePdfs } from '../../tools/pdfMerger'
import { formatBytes } from '../../utils/format'
import { downloadBlob, readError, validatePdfFile } from '../../utils/files'
import { faqJsonLd, webAppJsonLd } from '../../utils/schema'

const TOOL = TOOL_BY_ID['merge-pdf']
const MAX_FILES = 30

const STEPS = [
  {
    title: 'Add the PDF files',
    text: 'Choose up to 30 PDFs. Each file is checked for format and size before it is added to the list.',
  },
  {
    title: 'Set the order',
    text: 'Move files up or down until the sequence matches the document you want. All pages of a file stay together.',
  },
  {
    title: 'Merge and download',
    text: 'The pages are copied into a new PDF in this tab. The result shows the page count and final file size.',
  },
]

const FORMATS = [
  { label: 'Input format', value: 'PDF only' },
  { label: 'Files per merge', value: 'Up to 30' },
  { label: 'Maximum input size', value: '50 MB per PDF' },
  { label: 'Output format', value: 'PDF' },
  { label: 'Page quality', value: 'Pages are copied, not re-rendered' },
  { label: 'Processing', value: 'Inside this browser tab, on your device' },
]

const LIMITS = [
  'Password-protected or encrypted PDFs cannot be merged. Remove the password first; FormReady does not ask for one.',
  'Bookmarks, outlines, links and form fields may not survive the merge because pages are copied into a new document.',
  'Pages keep their original size and orientation. Mixed A4 and Letter pages stay mixed.',
  'The merged file is roughly the sum of the inputs, plus a small PDF overhead. Merging does not compress images.',
  'Pages inside a single PDF cannot be reordered here; only the order of whole files can be changed.',
]

const FAQS = [
  {
    question: 'Does merging reduce PDF quality?',
    answer:
      'No. The tool copies the existing pages into a new document instead of re-rendering them, so images and text are not re-compressed. The downside is that the merged file is about as large as the inputs combined.',
  },
  {
    question: 'Why does one of my PDFs fail to load?',
    answer:
      'The most common causes are a password or encryption, a damaged download, or a file that is not really a PDF despite its extension. Remove password protection in a PDF reader, download the file again, and retry.',
  },
  {
    question: 'Can I reorder pages inside one PDF here?',
    answer:
      'Not in this tool. The arrows change the order of whole files; every page of a file stays together. Page-level editing requires a dedicated PDF editor.',
  },
  {
    question: 'Will links and bookmarks still work?',
    answer:
      'They may not. Page content is preserved, but document-level navigation such as bookmarks and some link annotations can be lost when pages are assembled into a new file. Text and images remain intact.',
  },
  {
    question: 'Is there a page or size limit?',
    answer:
      'Each input can be up to 50 MB and the list is capped at 30 files. Browser memory is the practical limit: hundreds of pages with heavy scans may be slow on phones.',
  },
  {
    question: 'Are the files uploaded to FormReady?',
    answer:
      'No. Each file is read from your device, merged in this tab and offered as a download. There is no server copy and no document history.',
  },
]

export default function PDFMerger() {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState(null)

  const reset = () => {
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
      if (items.length + accepted.length >= MAX_FILES) {
        skipped.push(`${file.name} (limit of ${MAX_FILES} files)`)
        return
      }
      const problem = validatePdfFile(file)
      if (problem) {
        skipped.push(`${file.name} (${problem})`)
        return
      }
      accepted.push(file)
    })

    if (accepted.length) {
      setItems((current) => [
        ...current,
        ...accepted.map((file) => ({ key: `${file.name}-${file.size}-${file.lastModified}`, file })),
      ])
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
    setItems((current) => current.filter((_, position) => position !== index))
  }

  const merge = async () => {
    if (items.length < 2 || busy) return
    setError('')
    setNotice('')
    setResult(null)
    setBusy(true)
    setProgress(0)
    try {
      const output = await mergePdfs(
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
        title="Merge PDF Files Online - Combine PDFs in Your Browser | FormReady"
        description="Merge up to 30 PDF files into one document, reorder them and download the result. Pages are copied without re-compression and files never leave your device."
        path="/merge-pdf"
        jsonLd={[
          webAppJsonLd({
            name: 'FormReady PDF Merger',
            description: 'Combine PDF files into one document in the browser, with no uploads.',
            path: '/merge-pdf',
          }),
          faqJsonLd(FAQS),
        ]}
      />
      <ToolPageShell
        tool={TOOL}
        title="Merge PDF files into one document"
        intro="Join several PDFs into a single file, choose the order, and download the result. Pages are copied rather than re-rendered, so the content is not re-compressed."
        facts={[
          'Up to 30 PDFs per merge',
          'Reorder whole files',
          'Original page quality kept',
          'No upload and no account',
        ]}
        steps={STEPS}
        formats={FORMATS}
        limits={LIMITS}
        faqs={FAQS}
        about={
          <>
            <h2>What merging actually does</h2>
            <p>
              A PDF is a container of page objects, fonts and images. The merger opens each input, copies its pages
              into a new document and saves that document. Because the pages themselves are copied, the visible content
              is not re-compressed and does not lose quality — unlike converting pages to images and back.
            </p>
            <p>
              The trade-off is size: the merged file is roughly the sum of the inputs. If a 4 MB scan is joined with a
              6 MB scan, expect something close to 10 MB. To reduce that, compress the merged file afterwards with the{' '}
              <Link to="/compress-pdf">PDF compressor</Link>.
            </p>
            <h2>What survives and what may not</h2>
            <p>
              Page content, annotations drawn on the page and the visual layout are preserved. Document-level features
              such as bookmarks, named destinations and interactive form fields are not guaranteed to survive because
              they live outside the individual pages. If a portal depends on those features, check the merged result
              before submitting it.
            </p>
            <h2>Encrypted and damaged files</h2>
            <p>
              A password-protected PDF cannot be read without the password, and FormReady never asks you to send one.
              Remove the protection in a PDF reader first. Damaged downloads usually fail the same way; fetch the file
              again from the sender before assuming the merger is at fault.
            </p>
          </>
        }
      >
        <div className="fr-tool-shell">
          <div className="fr-workspace-head">
            <div>
              <h2>Merge PDFs</h2>
              <p>
                {items.length
                  ? `${items.length} of ${MAX_FILES} files · ${formatBytes(totalSize)} total`
                  : `Up to ${MAX_FILES} PDFs · 50 MB each`}
              </p>
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
              id="pdf-merge-input"
              title="Drop PDF files here"
              hint={`or browse your device · PDF only · up to ${MAX_FILES} files`}
              accept="application/pdf,.pdf"
              multiple
              onFiles={addFiles}
              disabled={busy}
              testId="merge-dropzone"
            />
          ) : (
            <>
              <FileQueue
                items={items.map(({ key, file }) => ({ key, name: file.name, size: file.size }))}
                onMove={move}
                onRemove={remove}
                reorderable
              />
              {items.length < MAX_FILES ? (
                <div className="mt-3">
                  <FileUpload
                    id="pdf-merge-more"
                    title="Add more PDFs"
                    hint={`${MAX_FILES - items.length} place(s) left`}
                    accept="application/pdf,.pdf"
                    multiple
                    onFiles={addFiles}
                    disabled={busy}
                    testId="merge-more-dropzone"
                  />
                </div>
              ) : null}
              <div className="d-flex flex-wrap gap-2 mt-3 align-items-center">
                <button
                  type="button"
                  className="fr-btn fr-btn-primary"
                  onClick={merge}
                  disabled={busy || items.length < 2}
                  data-testid="merge-button"
                >
                  <Icon name="Layers" size={17} />
                  {busy ? 'Merging…' : 'Merge PDFs'}
                </button>
                {items.length < 2 ? <span className="fr-small fr-muted">Add at least two files to merge.</span> : null}
              </div>
              {busy ? <ProgressBar value={progress} label="Merging PDFs" /> : null}
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
              title="Merged PDF ready"
              stats={[
                { label: 'Files', value: String(items.length) },
                { label: 'Pages', value: String(result.pageCount) },
                { label: 'PDF size', value: formatBytes(result.blob.size) },
              ]}
              onDownload={() => downloadBlob(result.blob, 'merged-document.pdf')}
              downloadLabel="Download merged PDF"
              onReset={reset}
            >
              <p className="fr-small mb-0">Pages copied in the order shown above. Open the file once to confirm it.</p>
            </ResultCard>
          ) : null}
        </div>
      </ToolPageShell>
    </>
  )
}
