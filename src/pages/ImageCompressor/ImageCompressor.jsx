import { useEffect, useRef, useState } from 'react'
import SEO from '../../components/SEO/SEO'
import ToolPageShell from '../../components/ToolPageShell/ToolPageShell'
import FileUpload from '../../components/FileUpload/FileUpload'
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
import { trackToolRun } from '../../services/usage'

const TOOL = TOOL_BY_ID['image-compressor']
const MAX_BATCH = 50
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
    title: 'Add your images',
    text: 'Drop one image or a whole folder of JPG, PNG and WebP files — up to 50 in one run. Each file keeps its own thumbnail, original size and pixel dimensions.',
  },
  {
    title: 'Set one target size',
    text: 'Pick a common limit such as 100 KB or 200 KB, or enter any custom value. The same target is applied to every image in the queue.',
  },
  {
    title: 'Download files or the ZIP',
    text: 'Every finished image shows its real before-and-after size. Download them one by one, or export the whole batch as a single ZIP archive.',
  },
]

const FORMATS = [
  { label: 'Input formats', value: 'JPG, JPEG, PNG, WebP' },
  { label: 'Batch size', value: 'Up to 50 images per run' },
  { label: 'Maximum input size', value: '30 MB per image' },
  { label: 'Output format', value: 'JPEG (.jpg) for every image' },
  { label: 'Target size', value: 'Any value from 5 KB upwards' },
  { label: 'Batch download', value: 'One ZIP with every finished image' },
  { label: 'Processing', value: 'Inside this browser tab, on your device' },
  { label: 'Offline use', value: 'Works after the first successful visit' },
]

const LIMITS = [
  'An exact number of kilobytes cannot be guaranteed. JPEG encoders work in quality steps, and each browser produces slightly different bytes.',
  'Transparent areas are placed on a white background because JPEG does not support transparency.',
  'Animated WebP images are reduced to a single still frame.',
  'Extremely small targets for detailed photos require dropping the resolution, which softens fine detail.',
  'If re-encoding would make a file larger, the original is kept — inside the ZIP as well — and the row is labelled “original kept”.',
  'Images are compressed one after another in this tab. Closing or reloading the page clears the queue.',
]

const FAQS = [
  {
    question: 'Is my image uploaded to a server?',
    answer:
      'No. Every file is read with the browser’s image APIs and re-encoded on a canvas in this tab. No request containing an image is sent anywhere, and nothing is stored after the page is closed.',
  },
  {
    question: 'Can I compress several images at once?',
    answer:
      'Yes. Add up to 50 images in one run. They are compressed one after another so memory stays predictable, and each image gets its own result row with the original size, the new size and the saving.',
  },
  {
    question: 'What is inside the ZIP download?',
    answer:
      'One entry per finished image, named compressed-<original-name>.jpg. Images that were already under the target keep their original file and name, so the archive never contains a worse copy than your input.',
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
      'Yes, once the site has been visited successfully and cached. The compressor, the ZIP builder and the downloaded images never need a network connection.',
  },
]

function outputName(item) {
  if (item.result?.usedOriginal) return item.file.name
  return `compressed-${replaceExtension(item.file.name, 'jpg')}`
}

function uniqueName(name, used) {
  if (!used.has(name)) {
    used.add(name)
    return name
  }
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const extension = dot > 0 ? name.slice(dot) : ''
  let counter = 2
  while (used.has(`${base}-${counter}${extension}`)) counter += 1
  used.add(`${base}-${counter}${extension}`)
  return `${base}-${counter}${extension}`
}

export default function ImageCompressor() {
  const [items, setItems] = useState([])
  const [targetMode, setTargetMode] = useState('200')
  const [customKb, setCustomKb] = useState('')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [zipBusy, setZipBusy] = useState(false)
  const idRef = useRef(0)
  const cancelRef = useRef(false)
  const urlsRef = useRef(new Set())
  const addInputRef = useRef(null)

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const addFiles = (selected) => {
    if (running) return
    setNotice('')
    const accepted = []
    const problems = []
    const room = MAX_BATCH - items.length
    for (const file of selected) {
      if (accepted.length >= room) {
        problems.push(`Only ${MAX_BATCH} images can be processed in one run. Remove a few files and try again.`)
        break
      }
      const problem = validateImageFile(file)
      if (problem) {
        problems.push(`${file.name}: ${problem}`)
        continue
      }
      idRef.current += 1
      const url = URL.createObjectURL(file)
      urlsRef.current.add(url)
      accepted.push({
        id: idRef.current,
        file,
        url,
        width: null,
        height: null,
        status: 'pending',
        result: null,
        error: '',
      })
    }
    if (accepted.length) {
      setItems((previous) => [...previous, ...accepted])
      for (const item of accepted) {
        loadImage(item.file)
          .then((image) => {
            setItems((previous) =>
              previous.map((entry) =>
                entry.id === item.id
                  ? { ...entry, width: image.naturalWidth, height: image.naturalHeight }
                  : entry,
              ),
            )
          })
          .catch(() => {})
      }
    }
    setError(problems.join(' '))
  }

  const releaseUrl = (url) => {
    URL.revokeObjectURL(url)
    urlsRef.current.delete(url)
  }

  const removeItem = (id) => {
    if (running) return
    const target = items.find((entry) => entry.id === id)
    if (target) releaseUrl(target.url)
    setItems((previous) => previous.filter((entry) => entry.id !== id))
    setNotice('')
  }

  const reset = () => {
    if (running) return
    items.forEach((entry) => releaseUrl(entry.url))
    setItems([])
    setTargetMode('200')
    setCustomKb('')
    setError('')
    setNotice('')
    setProgress(0)
    setCurrentIndex(0)
    cancelRef.current = false
  }

  const targetBytes = targetMode === 'custom' ? parseKilobytes(customKb) : Number(targetMode) * 1024

  const runAll = async () => {
    if (!items.length || running) return
    if (targetMode === 'custom' && !targetBytes) {
      setError('Enter a target size in kilobytes, for example 150. The number must be greater than zero.')
      return
    }
    setError('')
    setNotice('')
    setRunning(true)
    setProgress(0)
    setCurrentIndex(1)
    cancelRef.current = false
    setItems((previous) =>
      previous.map((entry) => ({ ...entry, status: 'pending', result: null, error: '' })),
    )

    const queue = items
    let stopped = false
    let completed = 0

    for (let index = 0; index < queue.length; index += 1) {
      if (cancelRef.current) {
        stopped = true
        break
      }
      setCurrentIndex(index + 1)
      setItems((previous) =>
        previous.map((entry) => (entry.id === queue[index].id ? { ...entry, status: 'working' } : entry)),
      )
      try {
        const result = await compressImage(queue[index].file, {
          targetBytes,
          onProgress: (value) => setProgress((index + value) / queue.length),
        })
        completed += 1
        setItems((previous) =>
          previous.map((entry) =>
            entry.id === queue[index].id ? { ...entry, status: 'done', result } : entry,
          ),
        )
      } catch (processingError) {
        setItems((previous) =>
          previous.map((entry) =>
            entry.id === queue[index].id
              ? { ...entry, status: 'error', error: readError(processingError) }
              : entry,
          ),
        )
      }
      setProgress((index + 1) / queue.length)
    }

    setRunning(false)
    if (stopped) setNotice('Stopped. Images that already finished keep their results.')
    if (completed > 0) trackToolRun('image-compressor')
  }

  const downloadItem = (item) => {
    if (!item.result) return
    const blob = item.result.usedOriginal ? item.file : item.result.blob
    downloadBlob(blob, outputName(item))
  }

  const downloadZip = async (readyItems) => {
    if (!readyItems.length || zipBusy) return
    setZipBusy(true)
    setError('')
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const used = new Set()
      for (const item of readyItems) {
        const blob = item.result.usedOriginal ? item.file : item.result.blob
        zip.file(uniqueName(outputName(item), used), blob)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, 'filevra-compressed-images.zip')
    } catch (zipError) {
      setError(readError(zipError, 'The ZIP archive could not be created.'))
    } finally {
      setZipBusy(false)
    }
  }

  const readyItems = items.filter((item) => item.result)
  const totalInput = items.reduce((sum, item) => sum + item.file.size, 0)
  const totalOriginal = readyItems.reduce((sum, item) => sum + item.result.originalSize, 0)
  const totalResult = readyItems.reduce((sum, item) => sum + item.result.size, 0)
  const totalSaved = reductionPercent(totalOriginal, totalResult)
  const failures = items.filter((item) => item.status === 'error').length
  const misses = readyItems.filter((item) => !item.result.hitTarget).length
  const keptOriginals = readyItems.filter((item) => item.result.usedOriginal).length
  const single = items.length === 1 && readyItems.length === 1
  const allDone = items.length > 0 && readyItems.length === items.length && !running

  let resultTitle = 'Your result is ready'
  let resultTone = 'success'
  if (readyItems.length) {
    if (single) {
      const only = readyItems[0].result
      resultTitle = only.usedOriginal
        ? 'The original file is already the best result'
        : only.hitTarget
          ? 'Compressed image ready'
          : 'Smallest result is still above the target'
      resultTone = only.usedOriginal || !only.hitTarget ? 'warning' : 'success'
    } else {
      resultTitle = `${readyItems.length} of ${items.length} image${items.length === 1 ? '' : 's'} compressed`
      resultTone = failures || misses ? 'warning' : 'success'
    }
  }

  const warnings = []
  if (failures) warnings.push(`${failures} image${failures === 1 ? '' : 's'} could not be processed.`)
  if (misses) {
    warnings.push(
      `${misses} image${misses === 1 ? '' : 's'} could not reach the target and use${misses === 1 ? 's' : ''} the smallest result found.`,
    )
  }
  if (keptOriginals && !misses && !failures) {
    warnings.push(
      `${keptOriginals} image${keptOriginals === 1 ? '' : 's'} were already at or below the target, so the original was kept.`,
    )
  }

  return (
    <>
      <SEO
        title="Image Compressor - Compress Multiple Images to a Target Size | Filevra"
        description="Compress one image or a batch of up to 50 JPG, PNG and WebP files to a target size such as 100 KB or 200 KB. See every before-and-after size and download all results as a ZIP. No uploads."
        path="/image-compressor"
        jsonLd={[
          webAppJsonLd({
            name: 'Filevra Image Compressor',
            description:
              'Compress one image or a whole batch of JPG, PNG and WebP files to a target file size in the browser, with per-file downloads and a ZIP export. No uploads.',
            path: '/image-compressor',
          }),
          faqJsonLd(FAQS),
        ]}
      />
      <ToolPageShell
        tool={TOOL}
        title="Compress images to a target file size"
        intro="Add one image or a whole set, set the limit your form or inbox requires, and download each smaller copy or the entire batch as a ZIP. The compressor adjusts quality first and resolution only when it must — then reports the real result for every file."
        facts={[
          'Batch compress up to 50 images',
          'JPG, PNG and WebP input',
          'Per-file sizes and savings',
          'One ZIP with every result',
        ]}
        steps={STEPS}
        formats={FORMATS}
        limits={LIMITS}
        faqs={FAQS}
        about={
          <>
            <h2>How the compressor reaches a target size</h2>
            <p>
              Each image is drawn onto a canvas at its original dimensions and encoded as JPEG. Instead of guessing a
              quality value, the tool runs a short binary search between low and high JPEG quality, keeping the best
              result that fits under your target. That is why a 100 KB request often produces 96 KB or 99 KB rather
              than exactly 100 KB.
            </p>
            <p>
              If even the lowest sensible quality stays above the target, the canvas is scaled down slightly and the
              search repeats. The result row always shows the dimensions that were used, so you can see when
              resolution was traded for file size. A photo that needs to stay at 3000 pixels wide may not fit into
              50 KB without looking rough.
            </p>
            <h2>Compressing a whole batch</h2>
            <p>
              A batch runs through the queue one image at a time in this tab. That keeps memory use predictable and
              lets the progress bar show exactly which file is being processed. Every row reports its own original
              size, result size and percentage saved; rows that were already under the target keep the original file
              instead of a re-encoded copy.
            </p>
            <p>
              The ZIP download is built in the browser with the same finished results. It contains one entry per
              image, using the original name for files that were kept and a compressed- name for files that were
              re-encoded. Duplicate names get a numbered suffix, so nothing is overwritten inside the archive.
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
              Everything happens on this device. The tool does not send the images to a Filevra server, does not keep
              a copy after the tab is closed, and does not send file details to analytics.
            </p>
          </>
        }
      >
        <div className="fr-tool-shell">
          <div className="fr-workspace-head">
            <div>
              <h2>Compress images</h2>
              <p>JPG, PNG or WebP · up to 50 at once · 30 MB each</p>
            </div>
            {items.length ? (
              <button
                type="button"
                className="fr-btn fr-btn-quiet fr-btn-sm"
                onClick={reset}
                disabled={running}
                data-testid="reset-tool"
              >
                <Icon name="RotateCcw" size={15} />
                Reset
              </button>
            ) : null}
          </div>

          {!items.length ? (
            <FileUpload
              id="image-input"
              title="Drop your images here"
              hint="or browse your device · JPG, PNG, WebP · up to 50 images · 30 MB each"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              onFiles={addFiles}
              testId="image-dropzone"
            />
          ) : (
            <div className="fr-workbench">
              <div className="fr-workbench__main">
                <div className="fr-batch-bar">
                  <span className="fr-small fr-muted" data-testid="batch-summary">
                  {items.length} image{items.length === 1 ? '' : 's'} · {formatBytes(totalInput)} total
                  {readyItems.length && !running ? ` · ${readyItems.length} finished` : ''}
                </span>
                <div className="fr-batch-actions">
                  <input
                    ref={addInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    multiple
                    hidden
                    data-testid="add-more-input"
                    onChange={(event) => {
                      addFiles(Array.from(event.target.files || []))
                      event.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    className="fr-btn fr-btn-secondary fr-btn-sm"
                    onClick={() => addInputRef.current?.click()}
                    disabled={running || items.length >= MAX_BATCH}
                    data-testid="add-more"
                  >
                    <Icon name="Images" size={15} />
                    Add more images
                  </button>
                  {readyItems.length ? (
                    <button
                      type="button"
                      className="fr-btn fr-btn-secondary fr-btn-sm"
                      onClick={() => downloadZip(readyItems)}
                      disabled={running || zipBusy}
                      data-testid="download-zip"
                    >
                      <Icon name="Archive" size={15} />
                      {zipBusy ? 'Building ZIP…' : 'Download ZIP'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="fr-btn fr-btn-quiet fr-btn-sm"
                    onClick={reset}
                    disabled={running}
                    data-testid="clear-all"
                  >
                    <Icon name="Trash2" size={15} />
                    Clear all
                  </button>
                </div>
              </div>

              <ul className="fr-file-list fr-batch-list" data-testid="batch-list">
                {items.map((item) => {
                  const done = item.result
                  const saving = done ? reductionPercent(done.originalSize, done.size) : 0
                  return (
                    <li
                      className={`fr-file-item fr-batch-item is-${item.status}`}
                      key={item.id}
                      data-testid="batch-item"
                    >
                      <span className="fr-batch-status" aria-hidden="true">
                        {item.status === 'done' ? (
                          <Icon name="CheckCircle2" size={17} />
                        ) : item.status === 'working' ? (
                          <span className="fr-spinner" />
                        ) : item.status === 'error' ? (
                          <Icon name="AlertCircle" size={17} />
                        ) : (
                          <span className="fr-batch-dot" />
                        )}
                      </span>
                      <img className="fr-file-thumb" src={item.url} alt="" />
                      <span className="fr-file-meta">
                        <span className="fr-file-name" title={item.file.name}>
                          {item.file.name}
                        </span>
                        <span className="fr-file-sub">
                          {done ? (
                            <>
                              {formatBytes(done.originalSize)} → <strong>{formatBytes(done.size)}</strong>
                              {done.usedOriginal ? ' · original kept' : ''}
                              {!done.hitTarget ? ' · above target' : ''}
                            </>
                          ) : item.status === 'error' ? (
                            <span className="fr-batch-error">{item.error}</span>
                          ) : (
                            <>
                              {formatBytes(item.file.size)}
                              {item.width ? ` · ${item.width} × ${item.height} px` : ''}
                              {item.status === 'working' ? ' · compressing…' : ''}
                            </>
                          )}
                        </span>
                      </span>
                      {done ? (
                        <span
                          className={`fr-batch-saved${saving > 0 ? '' : ' is-flat'}`}
                          aria-label={saving > 0 ? `Saved ${saving} percent` : 'No saving'}
                        >
                          {saving > 0 ? `−${saving}%` : '0%'}
                        </span>
                      ) : null}
                      <span className="fr-file-actions">
                        {done ? (
                          <button
                            type="button"
                            className="fr-icon-btn"
                            onClick={() => downloadItem(item)}
                            aria-label={`Download ${outputName(item)}`}
                            data-testid="download-item"
                          >
                            <Icon name="Download" size={16} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="fr-icon-btn"
                          onClick={() => removeItem(item.id)}
                          disabled={running}
                          aria-label={`Remove ${item.file.name}`}
                          data-testid="remove-item"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </span>
                    </li>
                  )
                })}
              </ul>

              </div>

              <div className="fr-workbench__side">
                <h3 className="fr-workbench__side-head">Target size</h3>
                <div className="fr-option-grid">
                  <div className="fr-field">
                    <span className="fr-field-label" id="target-label">
                      Target file size for every image
                    </span>
                <div className="fr-presets" role="group" aria-labelledby="target-label">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className="fr-preset"
                      aria-pressed={targetMode === preset.value}
                      onClick={() => setTargetMode(preset.value)}
                      disabled={running}
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
                      className="fr-input fr-input--xs"
                      inputMode="decimal"
                      value={customKb}
                      onChange={(event) => setCustomKb(event.target.value)}
                      placeholder="e.g. 150"
                      disabled={running}
                      data-testid="custom-kb"
                    />
                    <span className="fr-suffix">KB</span>
                  </div>
                ) : null}
                <p className="fr-field-hint">
                  The same limit is applied to every image. Aim for the limit you were given — the compressor reports
                  the actual result, which may differ by a few kilobytes.
                </p>
              </div>

                </div>

                <div className="fr-workbench__action">
                  <button
                    type="button"
                    className="fr-btn fr-btn-primary"
                    onClick={runAll}
                    disabled={running}
                    data-testid="compress-button"
                  >
                    <Icon name="ImageDown" size={16} />
                    {running
                      ? 'Compressing…'
                      : allDone
                        ? `Compress ${items.length === 1 ? 'again' : `all ${items.length} again`}`
                        : `Compress ${items.length === 1 ? 'image' : `all ${items.length} images`}`}
                  </button>
                  {running ? (
                    <button
                      type="button"
                      className="fr-btn fr-btn-secondary"
                      onClick={() => {
                        cancelRef.current = true
                      }}
                      data-testid="stop-compressing"
                    >
                      Stop
                    </button>
                  ) : (
                    <button type="button" className="fr-btn fr-btn-secondary" onClick={reset} disabled={running}>
                      Choose different images
                    </button>
                  )}
                </div>

                {running ? (
                  <>
                    <ProgressBar value={progress} label={`Compressing image ${currentIndex} of ${items.length}`} />
                    <p className="fr-small fr-muted mb-0" data-testid="batch-progress-text">
                      Compressing {currentIndex} of {items.length} image{items.length === 1 ? '' : 's'}…{' '}
                      {Math.round(Math.min(1, progress) * 100)}%
                    </p>
                  </>
                ) : null}

                {notice ? (
                  <p className="fr-small fr-muted mb-0" role="status">
                    {notice}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          <ErrorMessage>{error}</ErrorMessage>

          {readyItems.length && !running ? (
            <ResultCard
              title={resultTitle}
              tone={resultTone}
              stats={[
                { label: 'Images', value: `${readyItems.length} of ${items.length}` },
                { label: 'Original', value: formatBytes(totalOriginal) },
                { label: 'Result', value: formatBytes(totalResult) },
                {
                  label: totalSaved > 0 ? 'Total saved' : 'Change',
                  value: totalSaved > 0 ? `${totalSaved}%` : 'None',
                },
              ]}
              warning={warnings.length ? warnings.join(' ') : null}
              onDownload={() => {
                if (readyItems.length > 1) downloadZip(readyItems)
                else downloadItem(readyItems[0])
              }}
              downloadLabel={
                readyItems.length > 1
                  ? zipBusy
                    ? 'Building ZIP…'
                    : `Download ZIP (${readyItems.length} images)`
                  : readyItems[0].result.usedOriginal
                    ? 'Download original'
                    : 'Download image'
              }
            >
              <p className="fr-small mb-0">
                {readyItems.length > 1
                  ? 'Each row above has its own download button, and the ZIP contains one file per finished image.'
                  : single && readyItems[0].result.width && readyItems[0].result.height
                    ? `${readyItems[0].result.width} × ${readyItems[0].result.height} px`
                    : null}
                {single && readyItems[0].result.quality
                  ? ` · JPEG quality ${Math.round(readyItems[0].result.quality * 100)}%`
                  : ''}
                {single && readyItems[0].result.scale && readyItems[0].result.scale < 1
                  ? ` · scaled to ${Math.round(readyItems[0].result.scale * 100)}%`
                  : ''}
              </p>
            </ResultCard>
          ) : null}
        </div>
      </ToolPageShell>
    </>
  )
}
