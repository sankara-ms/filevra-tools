import { useEffect, useMemo, useState } from 'react'
import SEO from '../../components/SEO/SEO'
import ToolPageShell from '../../components/ToolPageShell/ToolPageShell'
import FileUpload from '../../components/FileUpload/FileUpload'
import FileQueue from '../../components/FileQueue/FileQueue'
import ProgressBar from '../../components/ProgressBar/ProgressBar'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import ResultCard from '../../components/ResultCard/ResultCard'
import Icon from '../../components/Icon/Icon'
import { TOOL_BY_ID } from '../../config/tools'
import { resizeImage } from '../../tools/photoResizer'
import { loadImage } from '../../tools/canvas'
import { computeTargetSize } from '../../tools/dimensions'
import { formatBytes, parseKilobytes } from '../../utils/format'
import { downloadBlob, readError, validateImageFile } from '../../utils/files'
import { faqJsonLd, webAppJsonLd } from '../../utils/schema'

const TOOL = TOOL_BY_ID['photo-signature-resizer']

const STEPS = [
  {
    title: 'Upload the photo or signature',
    text: 'Use a JPG, PNG or WebP image. The original pixel size appears immediately, before you change anything.',
  },
  {
    title: 'Enter the required pixels',
    text: 'Type the width and height your form asks for. Keep the aspect ratio locked to avoid stretching, or unlock it deliberately.',
  },
  {
    title: 'Resize and download',
    text: 'The resized image is produced locally. Add an optional kilobyte limit if the same form caps the file size as well.',
  },
]

const FORMATS = [
  { label: 'Input formats', value: 'JPG, JPEG, PNG, WebP' },
  { label: 'Maximum input size', value: '30 MB per image' },
  { label: 'Output format', value: 'JPEG (.jpg)' },
  { label: 'Output dimensions', value: '1 to 12,000 pixels per side' },
  { label: 'Optional size cap', value: 'Any target from 5 KB upwards' },
  { label: 'Processing', value: 'Inside this browser tab, on your device' },
]

const LIMITS = [
  'Enlarging an image cannot add detail. A small signature stretched to a large size will look soft.',
  'This tool does not crop, rotate, straighten or remove backgrounds. Prepare the framing in a photo editor first.',
  'When a kilobyte limit cannot be met at the exact pixels you entered, the tool keeps those pixels and tells you the target was missed. It does not silently change your dimensions.',
  'Transparent pixels become white because the output is JPEG, which matches most form requirements.',
  'Requirements differ between organisations. Filevra does not guess exam or application presets; use the numbers on your own instructions.',
]

const FAQS = [
  {
    question: 'What pixel size should I enter for a photo or signature?',
    answer:
      'Use the exact numbers in the instructions you were given. There is no universal photo or signature size; a portal may ask for something like 200 × 230 pixels while another asks for a maximum width of 1000 pixels. Enter what your form states rather than copying a size from another website.',
  },
  {
    question: 'What does keeping the aspect ratio locked do?',
    answer:
      'It keeps the original width-to-height proportion. When you type a width, the height is recalculated, and the other way round. Unlocking lets you set both values independently, which will stretch or squash the image.',
  },
  {
    question: 'Why does my signature look blurry after resizing?',
    answer:
      'Most blur comes from the source image, not the resize. A photo taken at a low resolution, or one that was already compressed heavily, cannot become sharper. Start from a clean, well-lit photo of the signature on plain paper, then scale down to the required size.',
  },
  {
    question: 'Can the tool keep my image under 20 KB as well as at the right pixels?',
    answer:
      'It tries. At your fixed dimensions the tool lowers JPEG quality until the file fits. If it cannot fit without an unusable result, it stops at the lowest sensible quality, keeps your dimensions and reports that the size target was missed.',
  },
  {
    question: 'Does a DPI value matter here?',
    answer:
      'The tool sets pixels, which is what most online forms check. DPI is metadata used when printing: it describes how densely those pixels are placed on paper. Changing DPI alone does not change the pixel dimensions of a file.',
  },
  {
    question: 'Does it work on a phone?',
    answer:
      'Yes. Photos taken on a phone are often very large, so reducing them to a form’s pixel size is exactly the case this tool is built for. Very large originals use more memory on older phones.',
  },
]

export default function PhotoSignatureResizer() {
  const [file, setFile] = useState(null)
  const [source, setSource] = useState(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lockAspect, setLockAspect] = useState(true)
  const [maxKb, setMaxKb] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    let cancelled = false
    if (!file) return undefined
    loadImage(file)
      .then((image) => {
        if (cancelled) return
        const dimensions = { width: image.naturalWidth, height: image.naturalHeight }
        setSource(dimensions)
        setWidth(String(dimensions.width))
        setHeight(String(dimensions.height))
      })
      .catch(() => {
        if (!cancelled) setError('This image could not be read. Try a different file.')
      })
    return () => {
      cancelled = true
    }
  }, [file])

  const reset = () => {
    setFile(null)
    setSource(null)
    setWidth('')
    setHeight('')
    setLockAspect(true)
    setMaxKb('')
    setResult(null)
    setError('')
    setProgress(0)
  }

  const acceptFile = (files) => {
    const next = files[0]
    const problem = validateImageFile(next)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setResult(null)
    setProgress(0)
    setFile(next)
  }

  const ratio = source ? source.width / source.height : 1

  const updateWidth = (value) => {
    setWidth(value)
    if (lockAspect && source) {
      const numeric = Number(value)
      if (Number.isFinite(numeric) && numeric > 0) {
        setHeight(String(Math.max(1, Math.round(numeric / ratio))))
      }
    }
  }

  const updateHeight = (value) => {
    setHeight(value)
    if (lockAspect && source) {
      const numeric = Number(value)
      if (Number.isFinite(numeric) && numeric > 0) {
        setWidth(String(Math.max(1, Math.round(numeric * ratio))))
      }
    }
  }

  const toggleLock = (checked) => {
    setLockAspect(checked)
    if (checked && source) {
      const numeric = Number(width)
      if (Number.isFinite(numeric) && numeric > 0) {
        setHeight(String(Math.max(1, Math.round(numeric / ratio))))
      }
    }
  }

  const runResize = async () => {
    if (!file || busy) return
    const numericWidth = Number(width)
    const numericHeight = Number(height)
    if (!Number.isFinite(numericWidth) || !Number.isFinite(numericHeight) || numericWidth < 1 || numericHeight < 1) {
      setError('Enter a width and height in pixels. Both values must be whole numbers greater than zero.')
      return
    }
    if (numericWidth > 12000 || numericHeight > 12000) {
      setError('The maximum supported dimension is 12,000 pixels per side.')
      return
    }
    const targetBytes = maxKb.trim() ? parseKilobytes(maxKb) : null
    if (maxKb.trim() && !targetBytes) {
      setError('Enter a valid maximum file size in kilobytes, for example 20, or leave the field empty.')
      return
    }

    const dimensions = computeTargetSize({
      sourceWidth: source.width,
      sourceHeight: source.height,
      width: numericWidth,
      height: numericHeight,
      lockAspect,
    })

    setError('')
    setResult(null)
    setBusy(true)
    setProgress(0)
    try {
      const resized = await resizeImage(file, {
        width: dimensions.width,
        height: dimensions.height,
        targetBytes,
        onProgress: setProgress,
      })
      setResult(resized)
    } catch (processingError) {
      setError(readError(processingError))
    } finally {
      setBusy(false)
    }
  }

  const outputName = file ? `resized-${file.name.replace(/\.[^.]+$/, '')}.jpg` : 'resized-image.jpg'
  const missedTarget = result?.hitTarget === false

  return (
    <>
      <SEO
        title="Photo and Signature Resizer - Exact Pixel Width and Height | Filevra"
        description="Resize a photo or signature to exact pixel dimensions, lock the aspect ratio and cap the file size. The image is resized locally in your browser with no upload."
        path="/photo-signature-resizer"
        jsonLd={[
          webAppJsonLd({
            name: 'Filevra Photo and Signature Resizer',
            description:
              'Resize photos and signatures to exact pixel dimensions in the browser, with an optional file size limit.',
            path: '/photo-signature-resizer',
          }),
          faqJsonLd(FAQS),
        ]}
      />
      <ToolPageShell
        tool={TOOL}
        title="Resize a photo or signature to exact pixel dimensions"
        intro="Enter the width and height your form requires, keep the aspect ratio correct, and optionally cap the file size. No upload, no account and no guessed presets."
        facts={[
          'Exact width and height in pixels',
          'Aspect ratio lock',
          'Optional kilobyte limit',
          'No cropping or hidden changes',
        ]}
        steps={STEPS}
        formats={FORMATS}
        limits={LIMITS}
        faqs={FAQS}
        about={
          <>
            <h2>Pixels are the number most forms check</h2>
            <p>
              When a form says a photo must be 200 × 230 pixels, it is describing the pixel grid of the image, not its
              physical print size. This tool changes that grid directly: you type the two numbers, and the image is
              drawn onto a canvas at exactly that size. Most online portals validate these numbers when you upload.
            </p>
            <p>
              DPI is a separate idea. It tells a printer how tightly to pack those pixels on paper, but it does not add
              or remove pixels. If your instructions only mention DPI, look for a pixel or centimetre size as well;
              changing a DPI tag alone will not satisfy a pixel check.
            </p>
            <h2>Stretching versus scaling</h2>
            <p>
              With the aspect ratio locked, Filevra recalculates one side as you edit the other, so the picture keeps
              its natural proportions. Unlocking allows two independent numbers, which is occasionally useful for
              squeezing a signature into a narrow box, but faces and lettering will look stretched if the change is
              large. The result panel always states the final dimensions that were produced.
            </p>
            <h2>Preparing signatures that survive resizing</h2>
            <p>
              Start with a sharp, evenly lit photo of the signature on plain white paper. Fill the frame with the
              signature, avoid shadows and keep the camera parallel to the page. Reducing a clean 2000-pixel photo to
              200 pixels usually looks good; enlarging a 150-pixel crop rarely does. If the signature needs to be
              cropped or straightened, do that in a photo editor before resizing here.
            </p>
            <h2>Hitting a kilobyte limit at the same time</h2>
            <p>
              Some forms specify both pixels and a maximum size in KB. Enter both. The tool keeps your dimensions and
              searches for a JPEG quality that fits. If the requested size is impossible at that resolution, it reports
              the smallest file it could produce rather than quietly changing your width and height.
            </p>
          </>
        }
      >
        <div className="fr-tool-shell">
          <div className="fr-workspace-head">
            <div>
              <h2>Resize a photo or signature</h2>
              <p>JPG, PNG or WebP · up to 30 MB</p>
            </div>
            {file ? (
              <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={reset} data-testid="reset-tool">
                <Icon name="RotateCcw" size={15} />
                Reset
              </button>
            ) : null}
          </div>

          {!file ? (
            <FileUpload
              id="resize-input"
              title="Drop a photo or signature here"
              hint="or browse your device · JPG, PNG, WebP · up to 30 MB"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onFiles={acceptFile}
              testId="resize-dropzone"
            />
          ) : (
            <>
              <FileQueue
                items={[
                  {
                    key: `${file.name}-${file.size}`,
                    name: file.name,
                    size: file.size,
                    url: previewUrl,
                    detail: source ? `${source.width} × ${source.height} px` : undefined,
                  },
                ]}
                onRemove={reset}
              />
              <div className="text-center mt-3">
                <img
                  src={previewUrl}
                  alt={`Preview of ${file.name}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    borderRadius: 10,
                    border: '1px solid var(--fr-border)',
                    background: '#fff',
                  }}
                />
              </div>
              <hr className="fr-divider" />

              <div className="fr-input-row">
                <div className="fr-field">
                  <label htmlFor="resize-width">Width (pixels)</label>
                  <input
                    id="resize-width"
                    className="fr-input"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="12000"
                    value={width}
                    onChange={(event) => updateWidth(event.target.value)}
                    data-testid="width-input"
                  />
                </div>
                <div className="fr-field">
                  <label htmlFor="resize-height">Height (pixels)</label>
                  <input
                    id="resize-height"
                    className="fr-input"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="12000"
                    value={height}
                    onChange={(event) => updateHeight(event.target.value)}
                    data-testid="height-input"
                  />
                </div>
              </div>

              <label className="fr-toggle-row mb-3">
                <input
                  type="checkbox"
                  checked={lockAspect}
                  onChange={(event) => toggleLock(event.target.checked)}
                  data-testid="lock-aspect"
                />
                Keep the original aspect ratio
              </label>

              <div className="fr-field" style={{ maxWidth: 280 }}>
                <label htmlFor="max-kb">Maximum file size (optional)</label>
                <div className="d-flex align-items-center gap-2">
                  <input
                    id="max-kb"
                    className="fr-input"
                    inputMode="decimal"
                    value={maxKb}
                    onChange={(event) => setMaxKb(event.target.value)}
                    placeholder="e.g. 20"
                    data-testid="max-kb"
                  />
                  <span className="fr-small fr-muted">KB</span>
                </div>
                <p className="fr-field-hint">Leave empty if the form only checks pixels.</p>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="fr-btn fr-btn-primary"
                  onClick={runResize}
                  disabled={busy || !source}
                  data-testid="resize-button"
                >
                  <Icon name="Scaling" size={17} />
                  {busy ? 'Resizing…' : 'Resize image'}
                </button>
                <button type="button" className="fr-btn fr-btn-secondary" onClick={reset} disabled={busy}>
                  Choose another file
                </button>
              </div>

              {busy ? <ProgressBar value={progress} label="Resizing image" /> : null}
              <p className="fr-small fr-muted mt-3 mb-0">
                Output is JPEG. Transparent pixels are placed on a white background.
              </p>
            </>
          )}

          <ErrorMessage>{error}</ErrorMessage>

          {result ? (
            <ResultCard
              title={missedTarget ? 'Image resized, but the size limit was missed' : 'Resized image ready'}
              tone={missedTarget ? 'warning' : 'success'}
              stats={[
                { label: 'Original', value: formatBytes(result.originalSize) },
                { label: 'Result', value: formatBytes(result.size) },
                { label: 'Dimensions', value: `${result.width} × ${result.height}` },
              ]}
              warning={
                missedTarget
                  ? 'At these exact dimensions the smallest file is still above your limit. Enlarge the limit, or reduce the dimensions and check that the form accepts the smaller size.'
                  : null
              }
              onDownload={() => downloadBlob(result.blob, outputName)}
              downloadLabel="Download resized image"
              onReset={reset}
            >
              <p className="fr-small mb-0">
                From {result.sourceWidth} × {result.sourceHeight} px
                {result.quality ? ` · JPEG quality ${Math.round(result.quality * 100)}%` : null}
                {result.hitTarget === true ? ' · size target met' : null}
              </p>
            </ResultCard>
          ) : null}
        </div>
      </ToolPageShell>
    </>
  )
}
