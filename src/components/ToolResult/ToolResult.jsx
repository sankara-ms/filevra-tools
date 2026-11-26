import { useState } from 'react'
import Icon from '../Icon/Icon'
import { downloadBlob } from '../../utils/files'
import { formatBytes } from '../../utils/format'

const TEXT_MIME = {
  json: 'application/json',
  xml: 'application/xml',
  html: 'text/html',
  md: 'text/markdown',
  csv: 'text/csv',
  txt: 'text/plain',
}

function mimeFor(name) {
  const dot = String(name || '').lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : 'txt'
  return TEXT_MIME[ext] || 'text/plain'
}

export default function ToolResult({ result, tool, onReset }) {
  const [copied, setCopied] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [zipError, setZipError] = useState('')

  const outputs = result.outputs || []
  const stats = result.stats || []
  const info = result.info || []
  const previews = result.previews || []
  const palette = result.palette || []
  const text = typeof result.text === 'string' ? result.text : ''

  const title =
    outputs.length > 1
      ? `${outputs.length} files are ready`
      : outputs.length === 1
        ? 'Your result is ready'
        : 'Result ready'

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const downloadText = () => {
    const name = result.outputName || `${tool.id}.txt`
    downloadBlob(new Blob([text], { type: mimeFor(name) }), name)
  }

  const downloadAll = async () => {
    setZipError('')
    setZipping(true)
    try {
      const JSZip = (await import('jszip')).default
      const archive = new JSZip()
      outputs.forEach((output) => archive.file(output.name, output.blob))
      const blob = await archive.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      downloadBlob(blob, `${tool.id}-results.zip`)
    } catch {
      setZipError('The ZIP file could not be created. Download the files one by one instead.')
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className={`fr-result${result.warning ? ' is-warning' : ''}`} data-testid="result-card">
      <h3>
        <Icon name={result.warning ? 'AlertCircle' : 'CheckCircle2'} size={19} />
        {title}
      </h3>

      {stats.length > 0 && (
        <div className="fr-result-stats">
          {stats.map((stat) => (
            <span key={stat.label}>
              <span className="fr-stat-value">{stat.value}</span>
              <span className="fr-stat-label">{stat.label}</span>
            </span>
          ))}
        </div>
      )}

      {result.warning ? <p className="fr-small fr-runner-warning">{result.warning}</p> : null}

      {info.length > 0 && (
        <div className="fr-info-list">
          {info.map((block) => (
            <div className="fr-info-block" key={block.heading}>
              <h4>{block.heading}</h4>
              <dl>
                {block.rows.map((row, index) => (
                  <div className="fr-info-row" key={`${row.label}-${index}`}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="fr-preview-grid">
          {previews.map((preview, index) => (
            <figure className="fr-preview" key={`${preview.name}-${index}`}>
              <img src={preview.src} alt={preview.name} loading="lazy" />
              <figcaption>{preview.name}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {palette.length > 0 && (
        <div className="fr-palette">
          {palette.map((entry) => (
            <div className="fr-palette-group" key={entry.file}>
              <h4>{entry.file}</h4>
              <div className="fr-swatches">
                {entry.colors.map((color) => (
                  <span className="fr-swatch" key={`${entry.file}-${color.hex}`} title={`${color.hex} · ${color.count} pixels`}>
                    <span className="fr-swatch-color" style={{ background: color.hex }} />
                    <span className="fr-mono">{color.hex}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {result.table?.rows?.length ? (
        <div className="fr-table-wrap">
          <table className="fr-data-table">
            {result.table.caption ? <caption>{result.table.caption}</caption> : null}
            <tbody>
              {result.table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {result.html ? (
        <div className="fr-preview-html" dangerouslySetInnerHTML={{ __html: result.html }} />
      ) : null}

      {text ? (
        <>
          <div className="fr-output-toolbar">
            <span className="fr-small fr-muted">{text.length.toLocaleString('en-US')} characters</span>
            <div className="d-flex gap-2">
              <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={copyText}>
                <Icon name="Copy" size={15} />
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className="fr-btn fr-btn-quiet fr-btn-sm" onClick={downloadText}>
                <Icon name="Download" size={15} />
                Save as file
              </button>
            </div>
          </div>
          <pre className="fr-output-text" data-testid="tool-text-output">
            {text}
          </pre>
        </>
      ) : null}

      {outputs.length > 0 && (
        <ul className="fr-output-list">
          {outputs.map((output, index) => (
            <li className="fr-output-item" key={`${output.name}-${index}`}>
              <span className="fr-file-thumb fr-file-thumb--icon">
                <Icon name="Download" size={20} />
              </span>
              <span className="fr-file-meta">
                <span className="fr-file-name" title={output.name}>
                  {output.name}
                </span>
                <span className="fr-file-sub">
                  {formatBytes(output.blob.size)}
                  {output.note ? ` · ${output.note}` : ''}
                </span>
              </span>
              <button
                type="button"
                className="fr-btn fr-btn-secondary fr-btn-sm"
                onClick={() => downloadBlob(output.blob, output.name)}
              >
                <Icon name="Download" size={15} />
                Download
              </button>
            </li>
          ))}
        </ul>
      )}

      {zipError ? <p className="fr-small fr-error-text">{zipError}</p> : null}

      <div className="fr-result-actions">
        {outputs.length > 1 ? (
          <button type="button" className="fr-btn fr-btn-primary" onClick={downloadAll} disabled={zipping}>
            <Icon name="FileArchive" size={17} />
            {zipping ? 'Building ZIP…' : 'Download all as ZIP'}
          </button>
        ) : null}
        <button type="button" className="fr-btn fr-btn-secondary" onClick={onReset} data-testid="reset-tool">
          <Icon name="RotateCcw" size={16} />
          Start a new file
        </button>
      </div>
    </div>
  )
}
