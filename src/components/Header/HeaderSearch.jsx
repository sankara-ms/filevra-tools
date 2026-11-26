import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../Icon/Icon'
import { searchTools } from '../../config/toolRegistry'

const MAX_RESULTS = 6

/**
 * Instant tool search used in the header (desktop) and at the top of the
 * mobile menu. It only queries the existing tool registry, so it never
 * introduces a new source of truth for the catalogue.
 */
export default function HeaderSearch({ variant = 'header' }) {
  const [query, setQuery] = useState('')
  const [openedPath, setOpenedPath] = useState(null)
  const [active, setActive] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const matches = useMemo(() => {
    const normalized = query.trim()
    return normalized ? searchTools(normalized) : []
  }, [query])

  const results = matches.slice(0, MAX_RESULTS)
  // The panel is tied to the route it was opened on, so navigating away closes it
  // without an effect that would trigger a second render.
  const visible = openedPath === pathname && query.trim().length > 0
  const inputId = variant === 'menu' ? 'menu-tool-search' : 'header-tool-search'

  useEffect(() => {
    if (!visible) return undefined
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpenedPath(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [visible])

  const reset = () => {
    setQuery('')
    setOpenedPath(null)
    setActive(-1)
  }

  const go = (path) => {
    reset()
    inputRef.current?.blur()
    navigate(path)
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpenedPath(null)
      inputRef.current?.blur()
      return
    }
    if (!visible) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => (results.length ? (current + 1) % results.length : -1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => (results.length ? (current <= 0 ? results.length - 1 : current - 1) : -1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      go(results[active]?.path || '/tools')
    }
  }

  return (
    <div
      className={`fr-header-search${variant === 'menu' ? ' fr-header-search--menu' : ''}`}
      role="search"
      ref={containerRef}
    >
      <div className="fr-header-search__field">
        <span className="fr-header-search__icon">
          <Icon name="Search" size={15} />
        </span>
        <label className="fr-visually-hidden" htmlFor={inputId}>
          Search tools
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          className="fr-header-search__input"
          placeholder="Search tools"
          value={query}
          autoComplete="off"
          aria-controls={`${inputId}-results`}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(-1)
            setOpenedPath(pathname)
          }}
          onFocus={() => setOpenedPath(pathname)}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="fr-header-search__clear"
            aria-label="Clear tool search"
            onClick={() => {
              reset()
              inputRef.current?.focus()
            }}
          >
            <Icon name="X" size={13} />
          </button>
        ) : null}
      </div>

      {visible ? (
        <div className="fr-header-search__panel" id={`${inputId}-results`} role="region" aria-label="Tool search results">
          {results.length ? (
            results.map((tool, index) => (
              <Link
                key={tool.id}
                to={tool.path}
                className={`fr-header-search__item${index === active ? ' is-active' : ''}`}
                onClick={reset}
                onMouseEnter={() => setActive(index)}
              >
                <span className="fr-header-search__item-icon">
                  <Icon name={tool.icon} size={14} />
                </span>
                <span className="fr-header-search__item-text">
                  <span className="fr-header-search__item-name">{tool.name}</span>
                  <span className="fr-header-search__item-desc">{tool.description}</span>
                </span>
              </Link>
            ))
          ) : (
            <p className="fr-header-search__empty">No tools match “{query.trim()}”.</p>
          )}

          <div className="fr-header-search__foot">
            <span>
              {matches.length} tool{matches.length === 1 ? '' : 's'}
            </span>
            <Link to="/tools" onClick={reset}>
              All tools
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
