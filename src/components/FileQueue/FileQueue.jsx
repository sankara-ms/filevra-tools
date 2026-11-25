import Icon from '../Icon/Icon'
import { formatBytes } from '../../utils/format'

export default function FileQueue({ items, onMove, onRemove, reorderable = false }) {
  if (!items.length) return null

  return (
    <ul className="fr-file-list" data-testid="file-queue">
      {items.map((item, index) => (
        <li className="fr-file-item" key={item.key}>
          {item.url ? (
            <img className="fr-file-thumb" src={item.url} alt={`Preview of ${item.name}`} />
          ) : (
            <span className="fr-file-thumb fr-file-thumb--icon">
              <Icon name="FileText" size={22} />
            </span>
          )}
          <span className="fr-file-meta">
            <span className="fr-file-name" title={item.name}>
              {item.name}
            </span>
            <span className="fr-file-sub">
              {formatBytes(item.size)}
              {item.detail ? ` · ${item.detail}` : ''}
            </span>
          </span>
          <span className="fr-file-actions">
            {reorderable && (
              <>
                <button
                  type="button"
                  className="fr-icon-btn"
                  aria-label={`Move ${item.name} up`}
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                >
                  <Icon name="ArrowUp" size={16} />
                </button>
                <button
                  type="button"
                  className="fr-icon-btn"
                  aria-label={`Move ${item.name} down`}
                  disabled={index === items.length - 1}
                  onClick={() => onMove(index, 1)}
                >
                  <Icon name="ArrowDown" size={16} />
                </button>
              </>
            )}
            <button
              type="button"
              className="fr-icon-btn"
              aria-label={`Remove ${item.name}`}
              onClick={() => onRemove(index)}
            >
              <Icon name="Trash2" size={16} />
            </button>
          </span>
        </li>
      ))}
    </ul>
  )
}
