import { useRef, useState } from 'react'

import Icon from '../Icon/Icon'

export default function FileUpload({
  id,
  title = 'Choose a file',
  hint,
  accept,
  multiple = false,
  onFiles,
  disabled = false,
  testId = 'dropzone',
  compact = false,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const dragDepth = useRef(0)

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleFiles = (fileList) => {
    if (disabled) return
    const files = Array.from(fileList || [])
    if (files.length) onFiles(files)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      className={`fr-dropzone${compact ? ' fr-dropzone--compact' : ''}${dragging ? ' is-dragging' : ''}${
        disabled ? ' is-disabled' : ''
      }`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${title}. ${hint || ''}`}
      aria-disabled={disabled}
      data-testid={testId}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openPicker()
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        if (disabled) return
        dragDepth.current += 1
        setDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        dragDepth.current = Math.max(0, dragDepth.current - 1)
        if (dragDepth.current === 0) setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        dragDepth.current = 0
        setDragging(false)
        handleFiles(event.dataTransfer.files)
      }}
    >
      <span className="fr-dropzone__icon">
        <Icon name="Upload" size={compact ? 18 : 21} />
      </span>
      <span className="fr-dropzone__text">
        <span className="fr-dropzone__title">{title}</span>
        <span className="fr-dropzone__hint">{hint}</span>
      </span>
      <span className="fr-btn fr-btn-secondary fr-btn-sm fr-dropzone__cta" aria-hidden="true">
        Browse files
      </span>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        data-testid={`${testId}-input`}
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  )
}
