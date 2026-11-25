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
import { compressImage } from '../../tools/imageCompressor'
import { loadImage } from '../../tools/canvas'
import { formatBytes, parseKilobytes, reductionPercent, replaceExtension } from '../../utils/format'
import { downloadBlob, readError, validateImageFile } from '../../utils/files'
import { faqJsonLd, webAppJsonLd } from '../../utils/schema'

const TOOL = TOOL_BY_ID['image-compressor']
const PRESETS = [
  { value: '50', label: '50 KB' },
  { value: '100', label: '100 KB' },
  { value: '200', label: '200 KB' },
  { value: '500', label: '500 KB' },
  { value: '1024', label: '1 MB' },
  { value: 'custom', label: 'Custom' },
]

const STEPS = [
  {
    title: 'Choose an image',
    text: 'Drop a JPG, PNG or WebP file on the page, or browse your device. The original size and pixel dimensions are shown before you compress.',
  },
  {
    title: 'Set the target size',
    text: 'Pick a common limit such as 100 KB or 200 KB, or enter any custom value. Leave the target in kilobytes, as forms usually state it.',
  },
  {
    title: 'Download and check',
    text: 'Compare the original and final size, then download the image. If the target could not be reached, the tool says so instead of pretending it worked.',
  },
]

const FORMATS = [
  { label: 'Input formats', value: 'JPG, JPEG, PNG, WebP' },
  { label: 'Maximum input size', value: '30 MB per image' },
  { label: 'Output format', value: 'JPEG (.jpg)' },
  { label: 'Target size', value: 'Any value from 5 KB upwards' },
  { label: 'Processing', value: 'Inside this browser tab, on your device' },
  { label: 'Offline use', value: 'Works after the first successful visit' },
]

const LIMITS = [
  'An exact number of kilobytes cannot be guaranteed. JPEG encoders work in quality steps, and each browser produces slightly different bytes.',
  'Transparent areas are placed on a white background because JPEG does not support transparency.',
  'Animated WebP images are reduced to a single still frame.',
  'Extremely small targets for detailed photos require dropping the resolution, which softens fine detail.',
  'If re-encoding would make the file larger, the original is kept and the result is labelled as unchanged.',
]

const FAQS = [
  {
    question: 'Is my image uploaded to a server?',
    answer:
      'No. The file is read with the browser’s image APIs and re-encoded on a canvas in this tab. No request containing the image is sent anywhere.',
  },
  {
    question: 'Why is the result 103 KB when I asked for 100 KB?',
    answer:
      'JPEG quality is a continuous setting but the resulting size changes in uneven steps. The compressor searches for the highest quality that fits, using up to seven passes. If no setting lands below the target, it reduces the resolution and tries again. It never labels a larger file as a success.',
  },
  {
    question: 'Does compression change the width and height?',
    answer:
      'Only when necessary. The first attempts keep the original dimensions and lower the JPEG quality. If the target still cannot be met, the image is scaled down in small steps, and the final dimensions are shown in the result.',
  },
  {
    question: 'Will a transparent PNG stay transparent?',
    answer:
      'No. The output is JPEG, so transparent pixels become white. This is usually what forms expect for photos and signatures, but it is a real limitation for logos.',
  },
  {
    question: 'What if my image is already smaller than the target?',
    answer:
      'The tool keeps the original file untouched and tells you it is already within the limit. Re-encoding a small file often makes it bigger, so leaving it alone is the safer result.',
  },
  {
    question: 'Does the compressor work offline?',
    answer:
      'Yes, once the site has been visited successfully and cached. The compressor and the downloaded image never need a network connection.',
  },
]

export default function ImageCompressor() {
  const [file, setFile] = useState(null)
  const [dimensions, setDimensions] = useState(null)
  const [targetMode, setTargetMode] = useState('200')
  const [customKb, setCustomKb] = useState('')
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
        if (!cancelled) setDimensions({ width: image.naturalWidth, height: image.naturalHeight })
      })
      .catch(() => {
        if (!cancelled) setDimensions(null)
      })
    return () => {
      cancelled = true
    }
  }, [file])

  const reset = () => {
    setFile(null)
    setDimensions(null)
    setResult(null)
    setError('')
    setProgress(0)
    setTargetMode('200')
    setCustomKb('')
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

  const targetBytes = targetMode === 'custom' ? parseKilobytes(customKb) : Number(targetMode) * 1024

  const runCompression = async () => {
    if (!file || busy) return
    if (targetMode === 'custom' && !targetBytes) {
      setError('Enter a target size in kilobytes, for example 150. The number must be greater than zero.')
      return
    }
    setError('')
    setResult(null)
    setBusy(true)
    setProgress(0)
    try {
      const compressed = await compressImage(file, { targetBytes, onProgress: setProgress })
      setResult(compressed)
    } catch (processingError) {
      setError(readError(processingError))
    } finally {
      setBusy(false)
    }
  }

  const fileName = file ? replaceExtension(file.name, 'jpg') : 'image.jpg'
  const outputName = result?.usedOriginal ? `original-${file?.name ?? 'image'}` : `compressed-${fileName}`

  return (
    <>
      <SEO
        title="Image Compressor - Reduce Image Size to 100 KB or More | FormReady"
        description="Compress a JPG, PNG or WebP image to a target size such as 100 KB, 200 KB or 1 MB. Browser-based, no upload, with the real before-and-after file size."
        path="/image-compressor"
        jsonLd={[
          webAppJsonLd({
            name: 'FormReady Image Compressor',
            description:
              'Compress images to a target file size in the browser. Supports JPG, PNG and WebP with no uploads.',
            path: '/image-compressor',
          }),
          faqJsonLd(FAQS),
        ]}
      />
      <ToolPageShell
        tool={TOOL}
        title="Compress an image to a target file size"
        intro="Choose an image, set the limit your form or inbox requires, and download a smaller copy. The compressor adjusts quality first and resolution only when it must — then reports the real result."
        facts={[
          'JPG, PNG and WebP input',
          'Target in KB or MB',
          'Original and result sizes shown',
          'No upload and no account',
        ]}
        steps={STEPS}
        formats={FORMATS}
        limits={LIMITS}
        faqs={FAQS}
        about={
          <>
            <h2>How the compressor reaches a target size</h2>
            <p>
              The image is drawn onto a canvas at its original dimensions and encoded as JPEG. Instead of guessing a
              quality value, the tool runs a short binary search between low and high JPEG quality, keeping the best
              result that fits under your target. That is why a 100 KB request often produces 96 KB or 99 KB rather
              than exactly 100 KB.
            </p>
            <p>
              If even the lowest sensible quality stays above the target, the canvas is scaled down slightly and the
              search repeats. The result panel always shows the dimensions that were used, so you can see when
              resolution was traded for file size. A photo that needs to stay at 3000 pixels wide may not fit into
              50 KB without looking rough.
            </p>
            <h2>Choosing a sensible target</h2>
            <p>
              Forms usually state a maximum in kilobytes, and email attachments often have a total size limit. Start
              with the number the destination gives you, not with the smallest possible file. A portrait or scanned
              signature generally stays readable between 100 KB and 500 KB. Product photos and detailed documents need
              more. Going far below the requirement mainly reduces sharpness.
            </p>
            <h2>Why the output is always JPEG</h2>
            <p>
              JPEG is the format most forms accept and it responds predictably to quality changes. PNG files are
              converted, which also means transparency is flattened onto white. If you need a transparent logo, use
              the photo and signature resizer only when the destination accepts an opaque image, or keep the original
              PNG.
            </p>
            <p>
              Everything happens on this device. The tool does not send the image to a FormReady server, does not keep
              a copy, and does not send file details to analytics.
            </p>
          </>
        }
      >
        <div className="fr-tool-shell">
          <div className="fr-workspace-head">
            <div>
              <h2>Compress an image</h2>
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
              id="image-input"
              title="Drop an image here"
              hint="or browse your device · JPG, PNG, WebP · up to 30 MB"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onFiles={acceptFile}
              testId="image-dropzone"
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
                    detail: dimensions ? `${dimensions.width} × ${dimensions.height} px` : undefined,
                  },
                ]}
                onRemove={reset}
              />
              <div className="text-center mt-3">
                <img
                  src={previewUrl}
                  alt={`Preview of ${file.name}`}
                  style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 10, border: '1px solid var(--fr-border)' }}
                />
              </div>
              <hr className="fr-divider" />
              <div className="fr-field">
                <span className="fr-field-label" id="target-label">
                  Target file size
                </span>
                <div className="fr-presets" role="group" aria-labelledby="target-label">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className="fr-preset"
                      aria-pressed={targetMode === preset.value}
                      onClick={() => setTargetMode(preset.value)}
                      data-testid={`target-${preset.value}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {targetMode === 'custom' ? (
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <label htmlFor="custom-kb" className="fr-visually-hidden">
                      Custom target in kilobytes
                    </label>
                    <input
                      id="custom-kb"
                      className="fr-input"
                      style={{ maxWidth: 150 }}
                      inputMode="decimal"
                      value={customKb}
                      onChange={(event) => setCustomKb(event.target.value)}
                      placeholder="e.g. 150"
                      data-testid="custom-kb"
                    />
                    <span className="fr-small fr-muted">KB</span>
                  </div>
                ) : null}
                <p className="fr-field-hint">
                  Aim for the limit you were given. The compressor reports the actual result, which may differ by a few
                  kilobytes.
                </p>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="fr-btn fr-btn-primary"
                  onClick={runCompression}
                  disabled={busy}
                  data-testid="compress-button"
                >
                  <Icon name="ImageDown" size={17} />
                  {busy ? 'Compressing…' : 'Compress image'}
                </button>
                <button type="button" className="fr-btn fr-btn-secondary" onClick={reset} disabled={busy}>
                  Choose another file
                </button>
              </div>

              {busy ? (
                <>
                  <ProgressBar value={progress} label="Compressing image" />
                  <p className="fr-small fr-muted mb-0">Searching for the best quality under your target…</p>
                </>
              ) : null}
            </>
          )}

          <ErrorMessage>{error}</ErrorMessage>

          {result ? (
            <ResultCard
              title={
                result.usedOriginal
                  ? 'The original file is already the best result'
                  : result.hitTarget
                    ? 'Compressed image ready'
                    : 'Smallest result is still above the target'
              }
              tone={result.usedOriginal || !result.hitTarget ? 'warning' : 'success'}
              stats={[
                { label: 'Original', value: formatBytes(result.originalSize) },
                { label: 'Result', value: formatBytes(result.size) },
                {
                  label: result.usedOriginal ? 'Change' : 'Saved',
                  value: result.usedOriginal ? 'None' : `${reductionPercent(result.originalSize, result.size)}%`,
                },
              ]}
              warning={
                result.usedOriginal
                  ? 'Re-encoding did not make the file smaller, so FormReady kept your original. Converting it again would only lose quality.'
                  : !result.hitTarget
                    ? 'The target could not be reached without destroying the image. Download this result or choose a larger target.'
                    : null
              }
              onDownload={() => downloadBlob(result.blob, outputName)}
              downloadLabel={result.usedOriginal ? 'Download original' : 'Download image'}
              onReset={reset}
            >
              <p className="fr-small mb-0">
                {result.width && result.height ? `${result.width} × ${result.height} px` : null}
                {result.quality ? ` · JPEG quality ${Math.round(result.quality * 100)}%` : null}
                {result.scale && result.scale < 1 ? ` · scaled to ${Math.round(result.scale * 100)}%` : null}
                {result.skipped ? ' · already within the target' : null}
              </p>
            </ResultCard>
          ) : null}
        </div>
      </ToolPageShell>
    </>
  )
}
