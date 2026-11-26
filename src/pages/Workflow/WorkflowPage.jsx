import { useEffect, useMemo, useRef, useState } from 'react'
import SEO from '../../components/SEO/SEO'
import FileUpload from '../../components/FileUpload/FileUpload'
import FileQueue from '../../components/FileQueue/FileQueue'
import ProgressBar from '../../components/ProgressBar/ProgressBar'
import ErrorMessage, { Alert } from '../../components/ErrorMessage/ErrorMessage'
import ToolResult from '../../components/ToolResult/ToolResult'
import FieldControl from '../../components/ToolRunner/FieldControl'
import Icon from '../../components/Icon/Icon'
import { buildOptions, fieldKey, initialValues } from '../../components/ToolRunner/fields'
import { WORKFLOW_OPS, WORKFLOW_OP_BY_ID, outputKindOf } from '../../config/workflowOps'
import { runTool } from '../../engine/runTool'
import { detectFile, extensionOf, kindFromName, mimeForExtension, readError } from '../../engine/shared'
import { formatBytes } from '../../utils/format'
import { webAppJsonLd } from '../../utils/schema'
import { trackToolRun } from '../../services/usage'

const MAX_FILES = 30
const MAX_BYTES = 100 * 1024 * 1024
const KIND_LABEL = { image: 'images', pdf: 'PDFs' }
const RESULT_TOOL = { id: 'filevra-workflow', name: 'Workflow' }

function analyseSteps(steps, startKind) {
  let kind = startKind
  const mismatches = []
  steps.forEach((step, index) => {
    const op = WORKFLOW_OP_BY_ID[step.opId]
    if (!op) return
    if (!op.kinds.includes(kind)) mismatches.push(index)
    kind = outputKindOf(op)
  })
  return { mismatches, finalKind: kind }
}

export default function WorkflowPage() {
  const [items, setItems] = useState([])
  const [steps, setSteps] = useState([])
  const [pendingOp, setPendingOp] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)
  const abortRef = useRef(null)
  const urlsRef = useRef(new Set())
  const uidRef = useRef(0)

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const uploadKind = items.length ? kindFromName(items[0].file.name, items[0].file.type) : null
  const availableOps = useMemo(
    () => (uploadKind ? WORKFLOW_OPS.filter((op) => op.kinds.includes(steps.length ? outputKindOf(WORKFLOW_OP_BY_ID[steps[steps.length - 1].opId]) : uploadKind)) : []),
    [uploadKind, steps],
  )
  const predictedKind = steps.length ? outputKindOf(WORKFLOW_OP_BY_ID[steps[steps.length - 1].opId]) : uploadKind
  const { mismatches } = uploadKind ? analyseSteps(steps, uploadKind) : { mismatches: [] }
  const activeOpId = availableOps.some((op) => op.id === pendingOp) ? pendingOp : availableOps[0]?.id || ''

  const revoke = (url) => {
    if (!url) return
    URL.revokeObjectURL(url)
    urlsRef.current.delete(url)
  }

  const addFiles = async (incoming) => {
    setError('')
    setNotice('')
    setResult(null)
    const accepted = []
    const skipped = []
    for (const file of incoming) {
      if (items.length + accepted.length >= MAX_FILES) {
        skipped.push(`"${file.name}" was skipped: the workflow accepts up to ${MAX_FILES} files.`)
        continue
      }
      if (file.size === 0) {
        skipped.push(`"${file.name}" is empty.`)
        continue
      }
      if (file.size > MAX_BYTES) {
        skipped.push(`"${file.name}" is larger than 100 MB.`)
        continue
      }
      const detected = await detectFile(file)
      if (!['image', 'pdf'].includes(detected.kind)) {
        skipped.push(`"${file.name}" is not an image or a PDF.`)
        continue
      }
      const fileKind = kindFromName(file.name, file.type)
      if (!['image', 'pdf'].includes(fileKind)) {
        skipped.push(`"${file.name}" needs a PNG, JPG, WebP, GIF, BMP, SVG, AVIF or PDF file name.`)
        continue
      }
      accepted.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        url: fileKind === 'image' && /^image\//.test(file.type) ? URL.createObjectURL(file) : undefined,
      })
    }
    if (accepted.length) setItems((current) => [...current, ...accepted])
    setNotice(skipped.join(' '))
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
      if (item) revoke(item.url)
      return current.filter((_, position) => position !== index)
    })
    setSteps([])
  }

  const addStep = () => {
    const op = WORKFLOW_OP_BY_ID[activeOpId]
    if (!op) return
    uidRef.current += 1
    setSteps((current) => [
      ...current,
      { uid: `step-${uidRef.current}`, opId: op.id, values: initialValues(op.fields) },
    ])
    setResult(null)
    setError('')
  }

  const removeStep = (uid) => {
    setSteps((current) => current.filter((step) => step.uid !== uid))
    setResult(null)
  }

  const moveStep = (from, to) => {
    if (from == null || to == null || from === to) return
    setSteps((current) => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setResult(null)
  }

  const updateStepValue = (uid, field, index, value) => {
    setSteps((current) =>
      current.map((step) =>
        step.uid === uid
          ? { ...step, values: { ...step.values, [fieldKey(field, index)]: value } }
          : step,
      ),
    )
    setResult(null)
  }

  const reset = () => {
    items.forEach((item) => revoke(item.url))
    setItems([])
    setSteps([])
    setResult(null)
    setError('')
    setNotice('')
    setProgress(0)
  }

  const execute = async () => {
    if (!items.length || !steps.length || busy) return
    setError('')
    setNotice('')
    setResult(null)
    setProgress(0)
    setBusy(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      let currentFiles = items.map((item) => item.file)
      let lastOutputs = []
      for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index]
        const op = WORKFLOW_OP_BY_ID[step.opId]
        for (const file of currentFiles) {
          const kind = kindFromName(file.name, file.type)
          if (!op.kinds.includes(kind)) {
            throw new Error(
              `Step ${index + 1} (${op.name}) expects ${op.kinds.map((entry) => KIND_LABEL[entry] || entry).join(' or ')}, but the previous step produced "${file.name}". Reorder or remove that step.`,
            )
          }
        }
        if (controller.signal.aborted) throw new DOMException('Processing cancelled.', 'AbortError')
        const stepResult = await runTool(
          { runner: op.runner },
          {
            files: currentFiles,
            options: buildOptions(op.fields, step.values, op.preset),
            signal: controller.signal,
            onProgress: (value) => setProgress((index + value) / steps.length),
          },
        )
        const outputs = stepResult.outputs || []
        if (!outputs.length) {
          throw new Error(`Step ${index + 1} (${op.name}) did not produce any files to pass on.`)
        }
        if (outputs.length > 60) {
          throw new Error(`Step ${index + 1} (${op.name}) produced ${outputs.length} files, which is too many to chain reliably.`)
        }
        lastOutputs = outputs
        currentFiles = outputs.map(
          (output) => new File([output.blob], output.name, { type: output.blob.type || mimeForExtension(extensionOf(output.name)) }),
        )
        setProgress((index + 1) / steps.length)
      }
      if (controller.signal.aborted) return
      setResult({
        outputs: lastOutputs,
        stats: [
          { label: 'Operations', value: String(steps.length) },
          { label: 'Input files', value: String(items.length) },
          { label: 'Output files', value: String(lastOutputs.length) },
        ],
        warning:
          steps.length > 1
            ? 'Steps run in order and each result feeds the next. Lossy steps such as compression or page rendering cannot be undone.'
            : undefined,
      })
      trackToolRun('workflow')
    } catch (processingError) {
      if (controller.signal.aborted || processingError?.name === 'AbortError') {
        setNotice('Processing cancelled. Your files and steps are still here.')
      } else {
        setError(readError(processingError))
      }
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  }

  const totalSize = items.reduce((sum, item) => sum + item.file.size, 0)
  const canRun = items.length > 0 && steps.length > 0 && mismatches.length === 0 && !busy

  return (
    <>
      <SEO
        title="Workflow Builder - Chain Image and PDF Steps | Filevra"
        description="Upload images or a PDF, add several operations in order, and download the final result. Convert, resize, compress, rotate, watermark and combine files in one chain, all in your browser."
        path="/workflow"
        jsonLd={[
          webAppJsonLd({
            name: 'Filevra Workflow Builder',
            description: 'Chain image and PDF operations in the browser and download the final result.',
            path: '/workflow',
          }),
        ]}
      />

      <div className="fr-page-head">
        <div className="fr-container">
          <h1>Chain several file steps into one run</h1>
          <p>
            Upload your files, add the operations in the order you need them, and run the whole chain. Each step feeds
            the next, and everything stays in this browser tab.
          </p>
        </div>
      </div>

      <section className="fr-section fr-section--tight">
        <div className="fr-container">
          <div className="fr-tool-shell">
            <div className="fr-workspace-head">
              <div>
                <h2>Your workflow</h2>
                <p>
                  {items.length
                    ? `${items.length} file(s) · ${formatBytes(totalSize)} · ${steps.length} step(s)`
                    : 'Step 1: add images or a PDF. Then add operations.'}
                </p>
              </div>
              {items.length || steps.length || result ? (
                <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={reset} data-testid="reset-workflow">
                  <Icon name="RotateCcw" size={15} />
                  Start over
                </button>
              ) : null}
            </div>

            <div className="fr-workflow-source">
              <div className="fr-workflow-source-head">
                <h3>Source files</h3>
                <span>
                  {items.length
                    ? `${items.length} of ${MAX_FILES} · ${formatBytes(totalSize)}`
                    : `Images or PDF · up to ${MAX_FILES} files · 100 MB each`}
                </span>
              </div>

              {items.length === 0 ? (
                <FileUpload
                  id="workflow-input"
                  title="Drop images or a PDF here"
                  hint="or browse your device"
                  accept="image/*,application/pdf,.pdf"
                  multiple
                  onFiles={addFiles}
                  disabled={busy}
                  testId="workflow-dropzone"
                />
              ) : (
                <>
                  <FileQueue
                    items={items.map(({ key, file, url }) => ({ key, name: file.name, size: file.size, url }))}
                    onMove={move}
                    onRemove={remove}
                    reorderable
                  />
                  {items.length < MAX_FILES ? (
                    <FileUpload
                      id="workflow-more"
                      title="Add more files"
                      hint={`${MAX_FILES - items.length} place(s) left`}
                      accept="image/*,application/pdf,.pdf"
                      multiple
                      compact
                      onFiles={addFiles}
                      disabled={busy}
                      testId="workflow-more-dropzone"
                    />
                  ) : null}
                </>
              )}
            </div>

            {uploadKind ? (
              <p className="fr-small fr-muted mt-3 mb-0">
                Current input: {KIND_LABEL[uploadKind] || uploadKind}. Operations are suggested for that type; a step
                can change the type, for example images to PDF.
              </p>
            ) : null}

            {items.length > 0 ? (
              <div className="fr-workflow-add mt-4">
                <label className="fr-field-label" htmlFor="workflow-op">
                  Add an operation
                </label>
                <div className="fr-workflow-add-row">
                  <select
                    id="workflow-op"
                    className="fr-input"
                    value={activeOpId}
                    onChange={(event) => setPendingOp(event.target.value)}
                    disabled={busy || !availableOps.length}
                  >
                    {availableOps.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="fr-btn fr-btn-secondary" onClick={addStep} disabled={busy || !activeOpId}>
                    <Icon name="Play" size={16} />
                    Add step
                  </button>
                </div>
                {availableOps.length === 0 ? (
                  <p className="fr-field-hint">No operations are available for this type.</p>
                ) : null}
              </div>
            ) : null}

            {steps.length > 0 ? (
              <ol className="fr-workflow-steps">
                {steps.map((step, index) => {
                  const op = WORKFLOW_OP_BY_ID[step.opId]
                  return (
                    <li
                      className={`fr-workflow-step${dragIndex === index ? ' is-dragging' : ''}`}
                      key={step.uid}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        moveStep(dragIndex, index)
                        setDragIndex(null)
                      }}
                    >
                      <div
                        className="fr-workflow-step-head"
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragEnd={() => setDragIndex(null)}
                      >
                        <span className="fr-workflow-handle" aria-hidden="true">
                          <Icon name="GripVertical" size={18} />
                        </span>
                        <span className="fr-workflow-number">{index + 1}</span>
                        <span className="fr-workflow-title">
                          <strong>{op.name}</strong>
                          <span className="fr-small fr-muted">{op.summary}</span>
                        </span>
                        <span className="fr-file-actions">
                          <button
                            type="button"
                            className="fr-icon-btn"
                            aria-label={`Move ${op.name} up`}
                            disabled={index === 0}
                            onClick={() => moveStep(index, index - 1)}
                          >
                            <Icon name="ArrowUp" size={16} />
                          </button>
                          <button
                            type="button"
                            className="fr-icon-btn"
                            aria-label={`Move ${op.name} down`}
                            disabled={index === steps.length - 1}
                            onClick={() => moveStep(index, index + 1)}
                          >
                            <Icon name="ArrowDown" size={16} />
                          </button>
                          <button
                            type="button"
                            className="fr-icon-btn"
                            aria-label={`Remove ${op.name}`}
                            onClick={() => removeStep(step.uid)}
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </span>
                      </div>
                      {op.fields.length ? (
                        <div className="fr-option-grid">
                          {op.fields.map((field, fieldIndex) => {
                            const id = `workflow-${step.uid}-${field.name}-${fieldIndex}`
                            return (
                              <div className={`fr-field${field.type === 'checkbox' ? ' fr-field--wide' : ''}`} key={id}>
                                {field.type !== 'checkbox' ? (
                                  <label className="fr-field-label" htmlFor={id}>
                                    {field.label}
                                  </label>
                                ) : null}
                                <FieldControl
                                  field={field}
                                  id={id}
                                  value={step.values[fieldKey(field, fieldIndex)]}
                                  onChange={(value) => updateStepValue(step.uid, field, fieldIndex, value)}
                                />
                                {field.help ? <p className="fr-field-hint">{field.help}</p> : null}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="fr-small fr-muted mb-0 mt-2">This step has no settings.</p>
                      )}
                    </li>
                  )
                })}
              </ol>
            ) : null}

            {mismatches.length > 0 ? (
              <Alert tone="warning">
                Step {mismatches[0] + 1} does not match the file type produced before it. Reorder or remove that step
                before running the workflow.
              </Alert>
            ) : null}

            <div className="fr-run-row mt-4">
              <button type="button" className="fr-btn fr-btn-primary" onClick={execute} disabled={!canRun} data-testid="run-workflow">
                <Icon name="Workflow" size={17} />
                {busy ? 'Running workflow…' : 'Run workflow'}
              </button>
              {!items.length ? <span className="fr-small fr-muted">Add at least one file to start.</span> : null}
              {items.length && !steps.length ? <span className="fr-small fr-muted">Add at least one operation.</span> : null}
              {busy ? (
                <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={() => abortRef.current?.abort()}>
                  <Icon name="X" size={15} />
                  Cancel
                </button>
              ) : null}
            </div>

            {busy ? <ProgressBar value={progress} label="Running workflow" /> : null}

            {notice ? <Alert tone="warning">{notice}</Alert> : null}
            <ErrorMessage>{error}</ErrorMessage>

            {result ? <ToolResult result={result} tool={RESULT_TOOL} onReset={reset} /> : null}

            {!result && predictedKind && steps.length > 0 ? (
              <p className="fr-small fr-muted mt-3 mb-0">
                Expected result after the last step: {KIND_LABEL[predictedKind] || predictedKind}.
              </p>
            ) : null}
          </div>

          <div className="fr-prose mt-5">
            <h2>What a workflow is good for</h2>
            <p>
              Some jobs need more than one pass. A scan may need to be converted to JPG, rotated and then compressed
              before it fits an upload form. A PDF may need page numbers and a watermark before it is sent. Instead of
              downloading each intermediate file and uploading it again, add the steps here and run them in order.
            </p>
            <h2>How chaining works</h2>
            <p>
              Every step receives the files produced by the previous step. The operation list adapts to the current
              file type: image operations are offered for images, PDF operations for PDFs, and a step such as
              “Combine images into a PDF” changes the type for the steps after it. If a step expects a different type,
              the workflow stops and says which step does not fit.
            </p>
            <p>
              Results are produced in this tab and offered as downloads. When the last step creates several files,
              they can be saved together as one ZIP. Nothing is uploaded at any point.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
