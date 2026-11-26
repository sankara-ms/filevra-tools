import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import ToolCard from '../../components/ToolCard/ToolCard'
import Icon from '../../components/Icon/Icon'
import { CATEGORIES, TOOL_BY_ID, TOOLS, searchTools } from '../../config/toolRegistry'
import { readRecentTools } from '../../utils/recentTools'
import { breadcrumbJsonLd } from '../../utils/schema'

const PAGE_SIZE = 12
const EMPTY_LIST = []

let recentKey = ''
let recentCache = EMPTY_LIST

function recentSnapshot() {
  const ids = readRecentTools()
  const key = ids.join('|')
  if (key !== recentKey) {
    recentKey = key
    recentCache = ids.map((id) => TOOL_BY_ID[id]).filter(Boolean)
  }
  return recentCache
}

function categorySnapshot() {
  const requested = new URLSearchParams(window.location.search).get('category')
  return requested && CATEGORIES.some((item) => item.id === requested) ? requested : 'all'
}

const noSubscribe = () => () => {}

export default function ToolsPage() {
  const [query, setQuery] = useState('')
  const [pickedCategory, setPickedCategory] = useState(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const urlCategory = useSyncExternalStore(noSubscribe, categorySnapshot, () => 'all')
  const category = pickedCategory ?? urlCategory
  const recent = useSyncExternalStore(noSubscribe, recentSnapshot, () => EMPTY_LIST)

  const filtered = useMemo(() => {
    const base = searchTools(query)
    return category === 'all' ? base : base.filter((tool) => tool.category === category)
  }, [query, category])

  const shown = filtered.slice(0, visible)
  const remaining = filtered.length - shown.length
  const filtersActive = Boolean(query.trim()) || category !== 'all'
  const activeCategory = CATEGORIES.find((item) => item.id === category)

  const chooseCategory = (id) => {
    setPickedCategory(id)
    setVisible(PAGE_SIZE)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (id === 'all') url.searchParams.delete('category')
      else url.searchParams.set('category', id)
      window.history.replaceState(null, '', url)
    }
  }

  return (
    <>
      <SEO
        title={`All Tools - ${TOOLS.length} Free File Tools | Filevra`}
        description={`Browse ${TOOLS.length} free browser tools for PDF, images, documents, spreadsheets, presentations, text and files. Search by task, pick a tool and process files on your device.`}
        path="/tools"
        jsonLd={[
          breadcrumbJsonLd([
            { label: 'Home', to: '/' },
            { label: 'All tools', to: '/tools' },
          ]),
        ]}
      />

      <div className="fr-page-head">
        <div className="fr-container">
          <h1>Every Filevra tool in one place</h1>
          <p>
            {TOOLS.length} tools for PDFs, images, documents, spreadsheets, presentations, text and everyday file
            jobs. Everything runs in your browser, with no upload and no account.
          </p>
        </div>
      </div>

      <section className="fr-section">
        <div className="fr-container">
          <div className="fr-tools-toolbar">
            <div className="fr-search fr-search--toolbar">
              <Icon name="Search" size={17} />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setVisible(PAGE_SIZE)
                }}
                placeholder="Search by task, format or keyword"
                aria-label="Search all tools"
                data-testid="catalogue-search"
              />
              {query ? (
                <button
                  type="button"
                  className="fr-search__clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery('')
                    setVisible(PAGE_SIZE)
                  }}
                >
                  <Icon name="X" size={14} />
                </button>
              ) : null}
            </div>
            <Link to="/workflow" className="fr-btn fr-btn-secondary fr-btn-sm">
              <Icon name="Workflow" size={15} />
              Build a workflow
            </Link>
          </div>

          <div className="fr-category-bar" role="group" aria-label="Filter by category">
            <button
              type="button"
              className="fr-filter"
              aria-pressed={category === 'all'}
              onClick={() => chooseCategory('all')}
            >
              All tools ({TOOLS.length})
            </button>
            {CATEGORIES.map((item) => {
              const count = TOOLS.filter((tool) => tool.category === item.id).length
              return (
                <button
                  key={item.id}
                  type="button"
                  className="fr-filter"
                  aria-pressed={category === item.id}
                  onClick={() => chooseCategory(item.id)}
                >
                  {item.name} ({count})
                </button>
              )
            })}
          </div>

          {recent.length > 0 && !filtersActive ? (
            <div className="fr-recent" data-testid="recent-tools">
              <span className="fr-recent__label">Recently used</span>
              {recent.slice(0, 4).map((tool) => (
                <Link key={`recent-${tool.id}`} to={tool.path} className="fr-recent__link">
                  <Icon name={tool.icon} size={14} />
                  {tool.name}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-3">
            <p className="fr-small fr-muted mb-0" role="status">
              {filtered.length === 0
                ? 'No tools match this search.'
                : `Showing ${shown.length} of ${filtered.length} tool${filtered.length === 1 ? '' : 's'}${
                    activeCategory ? ` in ${activeCategory.name}` : ''
                  }.`}
            </p>
            {filtersActive && filtered.length > 0 ? (
              <button
                type="button"
                className="fr-btn fr-btn-ghost fr-btn-sm"
                onClick={() => {
                  setQuery('')
                  chooseCategory('all')
                }}
              >
                Clear filters
              </button>
            ) : null}
          </div>

          {shown.length > 0 ? (
            <div className="fr-grid" data-testid="tool-grid">
              {shown.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="fr-empty">
              <p className="mb-2">Nothing matched “{query.trim()}” in this category.</p>
              <button
                type="button"
                className="fr-btn fr-btn-secondary fr-btn-sm"
                onClick={() => {
                  setQuery('')
                  chooseCategory('all')
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {remaining > 0 ? (
            <div className="fr-load-more">
              <button
                type="button"
                className="fr-btn fr-btn-secondary"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, remaining)} more
              </button>
            </div>
          ) : null}

          <div className="fr-note mt-5">
            <strong>Need several steps in a row?</strong> The <Link to="/workflow">workflow builder</Link> chains
            image and PDF operations — for example convert to JPG, resize, then compress — and produces all results in
            one run.
          </div>
        </div>
      </section>
    </>
  )
}
