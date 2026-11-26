import { useEffect, useMemo, useRef, useState } from 'react'
import FileUpload from '../FileUpload/FileUpload'
import FileQueue from '../FileQueue/FileQueue'
import ProgressBar from '../ProgressBar/ProgressBar'
import ErrorMessage, { Alert } from '../ErrorMessage/ErrorMessage'
import ToolResult from '../ToolResult/ToolResult'
import Icon from '../Icon/Icon'
import FieldControl from './FieldControl'
import { buildOptions as buildOptionsFrom, fieldKey, initialValues } from './fields'
import { runTool } from '../../engine/runTool'
import { detectFile, readError, validateFile, validateSignature } from '../../engine/shared'
import { formatBytes } from '../../utils/format'
import { rememberTool } from '../../utils/recentTools'
import { trackToolRun } from '../../services/usage'

export default function ToolRunner({ tool }) {
  const isTextTool = Boolean(tool.input)
  const fields = useMemo(() => tool.fields || [], [tool.fields])
  const multiple = Boolean(tool.multiple)
  const maxFiles = tool.maxFiles || (multiple ? 20 : 1)
  const minFiles = tool.minFiles || 1
  const maxMb = Math.round((tool.maxBytes || 100 * 1024 * 1024) / (1024 * 1024))

  const [items, setItems] = useState([])
  const [options, setOptions] = useState(() => initialValues(tool.fields || []))
  const [text, setText] = useState('')
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState(null)
  const abortRef = useRef(null)
  const urlsRef = useRef(new Set())

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const byName = useMemo(() => {
    const map = {}
    fields.forEach((field, index) => {
      if (!(field.name in map)) map[field.name] = options[fieldKey(field, index)]
    })
    return map
  }, [fields, options])

  const visibleFields = fields.filter(
    (field) => !field.when || Object.entries(field.when).every(([name, value]) => String(byName[name]) === String(value)),
  )

  const revoke = (url) => {
    if (!url) return
    URL.revokeObjectURL(url)
    urlsRef.current.delete(url)
  }

  const resetFiles = () => {
    items.forEach((item) => revoke(item.url))
    setItems([])
  }

  const reset = () => {
    resetFiles()
    setOptions(initialValues(tool.fields || []))
    setText('')
    setLeft('')
    setRight('')
    setError('')
    setNotice('')
    setProgress(0)
    setResult(null)
  }

  const addFiles = async (incoming) => {
    setError('')
    setNotice('')
    setResult(null)
    const accepted = []
    const skipped = []

    for (const file of incoming) {
      if (accepted.length + (multiple ? items.length : 0) >= maxFiles && multiple) {
        skipped.push(`"${file.name}" was skipped: this tool accepts up to ${maxFiles} files.`)
        continue
      }
      const problem = validateFile(file, { kinds: tool.kinds || [], maxBytes: tool.maxBytes })
      if (problem) {
        skipped.push(problem)
        continue
      }
      if (tool.kinds?.length) {
        const detected = await detectFile(file)
        const signatureProblem = validateSignature(file, detected, tool.kinds)
        if (signatureProblem) {
          skipped.push(signatureProblem)
          continue
        }
      }
      accepted.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        url: /^image\//.test(file.type) && (tool.kinds || []).includes('image') ? URL.createObjectURL(file) : undefined,
      })
    }

    if (!accepted.length) {
      if (skipped.length) setNotice(skipped.join(' '))
      return
    }

    if (multiple) {
      setItems((current) => [...current, ...accepted])
    } else {
      resetFiles()
      setItems(accepted.slice(0, 1))
    }
    const ignored = skipped.length ? `${skipped.length} file(s) were skipped. ${skipped.join(' ')}` : ''
    setNotice(ignored)
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
  }

  const changeOption = (key, value) => {
    setResult(null)
    setOptions((current) => ({ ...current, [key]: value }))
  }

  const buildOptions = () => {
    const visible = fields.filter((field) =>
      !field.when || Object.entries(field.when).every(([name, value]) => String(byName[name]) === String(value)),
    )
    return buildOptionsFrom(visible, options, tool.preset)
  }

  const hasContent = isTextTool
    ? tool.input === 'text2'
      ? Boolean(left.trim() || right.trim())
      : Boolean(text.trim())
    : items.length >= minFiles

  const execute = async () => {
    if (!hasContent || busy) return
    setError('')
    setNotice('')
    setResult(null)
    setProgress(0)
    setBusy(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const payload = { options: buildOptions(), signal: controller.signal, onProgress: setProgress }
      if (tool.input === 'text') payload.texts = { input: text }
      else if (tool.input === 'text2') payload.texts = { left, right }
      else payload.files = items.map((item) => item.file)
      const output = await runTool(tool, payload)
      if (controller.signal.aborted) return
      setResult(output)
      setProgress(1)
      rememberTool(tool.id)
      trackToolRun(tool.id)
    } catch (processingError) {
      if (controller.signal.aborted || processingError?.name === 'AbortError') {
        setNotice('Processing cancelled. Your input is still here.')
      } else {
        setError(readError(processingError))
      }
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  }

  const cancel = () => {
    abortRef.current?.abort()
  }

  const totalSize = items.reduce((sum, item) => sum + item.file.size, 0)
  const inputSummary = isTextTool
    ? tool.input === 'text2'
      ? 'Two text blocks'
      : 'Typed or pasted text'
    : tool.formats?.input || 'Any file type'

  // A settings rail only balances the layout when the input area can grow with it.
  // Single-input tools keep the settings inline beneath the file so the workbench
  // never shows an empty column.
  const hasPanel = visibleFields.length > 0 && multiple
  const hasSettings = visibleFields.length > 0
  const runLabel = busy ? 'Working…' : `Run ${tool.name}`

  return (
    <div className="fr-tool-shell">
      <div className="fr-workspace-head">
        <div>
          <h2>{tool.name}</h2>
          <p>
            {isTextTool
              ? tool.description
              : items.length
                ? `${items.length} of ${maxFiles} file(s) · ${formatBytes(totalSize)} total`
                : `${inputSummary} · up to ${maxMb} MB per file`}
          </p>
        </div>
        {items.length || text || left || right || result ? (
          <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={reset} data-testid="reset-tool">
            <Icon name="RotateCcw" size={14} />
            Reset
          </button>
        ) : null}
      </div>

      {tool.warning ? <Alert tone="warning">{tool.warning}</Alert> : null}

      <div className={`fr-workbench${hasPanel ? '' : ' fr-workbench--full'}`}>
        <div className="fr-workbench__main">
          {isTextTool ? (
            tool.input === 'text2' ? (
              <div className="fr-input-row">
                <div className="fr-field">
                  <label className="fr-field-label" htmlFor="tool-text-left">
                    Original text
                  </label>
                  <textarea
                    id="tool-text-left"
                    className="fr-input fr-textarea"
                    rows={10}
                    value={left}
                    placeholder="Paste the first version here"
                    onChange={(event) => {
                      setLeft(event.target.value)
                      setResult(null)
                    }}
                    data-testid="tool-text-left"
                  />
                </div>
                <div className="fr-field">
                  <label className="fr-field-label" htmlFor="tool-text-right">
                    Changed text
                  </label>
                  <textarea
                    id="tool-text-right"
                    className="fr-input fr-textarea"
                    rows={10}
                    value={right}
                    placeholder="Paste the second version here"
                    onChange={(event) => {
                      setRight(event.target.value)
                      setResult(null)
                    }}
                    data-testid="tool-text-right"
                  />
                </div>
              </div>
            ) : (
              <div className="fr-field">
                <label className="fr-field-label" htmlFor="tool-text-input">
                  {tool.textLabel || 'Text'}
                </label>
                <textarea
                  id="tool-text-input"
                  className="fr-input fr-textarea"
                  rows={tool.textRows || 10}
                  value={text}
                  placeholder={tool.textPlaceholder || ''}
                  onChange={(event) => {
                    setText(event.target.value)
                    setResult(null)
                  }}
                  data-testid="tool-text-input"
                />
              </div>
            )
          ) : items.length === 0 ? (
            <FileUpload
              id={`${tool.id}-input`}
              title={multiple ? 'Drop files here' : 'Drop a file here'}
              hint={`or browse your device · ${inputSummary}${multiple ? ` · up to ${maxFiles} files` : ''}`}
              accept={tool.accept || undefined}
              multiple={multiple}
              onFiles={addFiles}
              disabled={busy}
              testId={`${tool.id}-dropzone`}
            />
          ) : (
            <>
              <FileQueue
                items={items.map(({ key, file, url }) => ({ key, name: file.name, size: file.size, url }))}
                onMove={move}
                onRemove={remove}
                reorderable={multiple}
              />
              {multiple && items.length < maxFiles ? (
                <FileUpload
                  id={`${tool.id}-more`}
                  title="Add more files"
                  hint={`${maxFiles - items.length} place(s) left`}
                  accept={tool.accept || undefined}
                  multiple
                  compact
                  onFiles={addFiles}
                  disabled={busy}
                  testId={`${tool.id}-more-dropzone`}
                />
              ) : null}
            </>
          )}
        </div>

        <div className="fr-workbench__side">
          {hasSettings ? (
            <>
              <h3 className="fr-workbench__side-head">Settings</h3>
              <div className="fr-option-grid">
                {visibleFields.map((field) => {
                  const index = fields.indexOf(field)
                  const id = `${tool.id}-${field.name}-${index}`
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
                        value={options[fieldKey(field, index)]}
                        onChange={(value) => changeOption(fieldKey(field, index), value)}
                      />
                      {field.help ? <p className="fr-field-hint">{field.help}</p> : null}
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}

          <div className="fr-workbench__action">
            <button
              type="button"
              className="fr-btn fr-btn-primary"
              onClick={execute}
              disabled={busy || !hasContent}
              data-testid="run-tool"
            >
              <Icon name="Play" size={16} />
              {runLabel}
            </button>
            {!hasContent ? (
              <p className="fr-workbench__hint">
                {isTextTool
                  ? tool.input === 'text2'
                    ? 'Paste text into at least one box to continue.'
                    : 'Type or paste some text to continue.'
                  : minFiles > 1
                    ? `Add ${minFiles} files to continue.`
                    : 'Add a file to continue.'}
              </p>
            ) : null}
            {busy ? (
              <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={cancel}>
                <Icon name="X" size={14} />
                Cancel
              </button>
            ) : null}
          </div>

          {busy ? <ProgressBar value={progress} label={`Running ${tool.name}`} /> : null}
        </div>
      </div>

      {notice ? <Alert tone="warning">{notice}</Alert> : null}
      <ErrorMessage>{error}</ErrorMessage>

      {result ? <ToolResult result={result} tool={tool} onReset={reset} /> : null}
    </div>
  )
}
