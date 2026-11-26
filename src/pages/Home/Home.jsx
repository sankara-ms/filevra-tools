import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import ToolCard from '../../components/ToolCard/ToolCard'
import Faq from '../../components/Faq/Faq'
import AdSlot from '../../components/AdSlot/AdSlot'
import Icon from '../../components/Icon/Icon'
import { GUIDES } from '../../config/tools'
import { CATEGORIES, POPULAR_TOOLS, TOOLS, searchTools } from '../../config/toolRegistry'
import { faqJsonLd, websiteJsonLd } from '../../utils/schema'

const HOME_FACTS = [
  'Files are processed in your browser',
  'No account and no watermark',
  'Works offline after the first visit',
]

const CATEGORY_TILES = CATEGORIES.map((category) => ({
  ...category,
  count: TOOLS.filter((tool) => tool.category === category.id).length,
}))

const OFFLINE_ROWS = [
  { label: 'Cached tool pages', value: 'Yes' },
  { label: 'Local file processing', value: 'Yes' },
  { label: 'Pages never opened before', value: 'Offline fallback' },
  { label: 'Advertising', value: 'Not cached' },
]

const HOME_FAQS = [
  {
    question: 'Are my files uploaded to a server?',
    answer:
      'No. Each tool reads the file with JavaScript in your browser and creates the result in the same tab. There is no upload step and no server-side copy of your document.',
  },
  {
    question: 'Can Filevra compress an image to exactly 100 KB?',
    answer:
      'The compressor aims for the target you enter and reports the real result. Reaching an exact kilobyte value is not always possible because JPEG encoding works in discrete quality steps. If the target cannot be reached without severe quality loss, the tool tells you and keeps the smallest result it could produce.',
  },
  {
    question: 'Do the tools work offline?',
    answer:
      'After one successful visit, the application shell and tool pages are cached by a service worker. You can open and use the tools again without a connection, and files still stay on your device. The first visit must be online.',
  },
  {
    question: 'What are the file size limits?',
    answer:
      'Images can be up to 30 MB each and PDFs up to 50 MB each. Browser memory is the real limit: very large scans and documents with hundreds of pages may be slow or fail on low-memory devices.',
  },
  {
    question: 'Do I need an account or an email address?',
    answer:
      'No account is needed for any tool. There is no sign-up, no login and no newsletter requirement.',
  },
  {
    question: 'Is Filevra free?',
    answer:
      'Yes. The tools are free to use and add no watermark. Advertising may be added later to cover hosting costs; it is loaded only after you agree, and it never receives your files.',
  },
  {
    question: 'Does it work on a phone?',
    answer:
      'Yes. The layout is responsive and the tools run in modern mobile browsers. Very large PDFs are easier to handle on a computer because phones have less working memory.',
  },
  {
    question: 'Which browsers are supported?',
    answer:
      'Recent versions of Chrome, Edge, Firefox and Safari on desktop and mobile. Older browsers may lack the canvas and PDF features the tools rely on.',
  },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const normalized = query.trim()
  const results = normalized ? searchTools(normalized) : POPULAR_TOOLS.slice(0, 8)

  return (
    <>
      <SEO
        title="Filevra - Free Image and PDF Tools That Run in Your Browser"
        description="Compress and resize images, convert images and documents to PDF, merge and split PDFs, edit pages and convert between file formats. Free, private and browser-based."
        path="/"
        jsonLd={[websiteJsonLd(), faqJsonLd(HOME_FAQS)]}
      />

      <section className="fr-hero">
        <div className="fr-container">
          <h1>Prepare Your Images and Documents in Seconds</h1>
          <p className="fr-hero-lede">
            {TOOLS.length} free tools to resize, compress, convert and edit your files. No installation required — and
            your files never leave your device.
          </p>

          <div className="fr-search fr-search--hero">
            <Icon name="Search" size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools, for example “signature” or “PDF”"
              aria-label="Search tools by name or description"
              data-testid="tool-search"
            />
            {query ? (
              <button
                type="button"
                className="fr-search__clear"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                <Icon name="X" size={15} />
              </button>
            ) : null}
          </div>

          <ul className="fr-cat-tiles">
            {CATEGORY_TILES.map((category) => (
              <li key={category.id}>
                <Link className="fr-cat-tile" to={`/tools?category=${category.id}`}>
                  <Icon name={category.icon} size={17} />
                  <span className="fr-cat-tile__text">
                    <span className="fr-cat-tile__name">{category.name}</span>
                    <span className="fr-cat-tile__count">{category.count} tools</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <ul className="fr-facts-row">
            {HOME_FACTS.map((fact) => (
              <li className="fr-fact" key={fact}>
                <Icon name="Check" size={14} />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="fr-section" id="tools">
        <div className="fr-container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div className="fr-section-head mb-0">
              <h2>{normalized ? 'Search results' : 'Popular tools'}</h2>
              <p>
                {normalized
                  ? `${results.length} tool${results.length === 1 ? '' : 's'} match your search.`
                  : `A quick start — ${TOOLS.length} tools are available in total.`}
              </p>
            </div>
            <Link to="/tools" className="fr-btn fr-btn-secondary fr-btn-sm">
              See all {TOOLS.length} tools
              <Icon name="ArrowRight" size={14} />
            </Link>
          </div>

          {results.length > 0 ? (
            <div className="fr-grid" data-testid="tool-grid">
              {results.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="fr-empty" data-testid="search-empty">
              <p>No tools match “{query.trim()}”. Try “compressor”, “signature”, “PDF” or “convert”.</p>
              <button type="button" className="fr-btn fr-btn-secondary fr-btn-sm" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          )}

          <p className="fr-small fr-muted mt-4 mb-0">
            Not sure which tool you need? The <Link to="/image-preparation-guide">image preparation guide</Link> and{' '}
            <Link to="/pdf-preparation-guide">PDF preparation guide</Link> explain how file size, resolution and quality
            fit together.
          </p>
        </div>
      </section>

      <section className="fr-section fr-section--tint">
        <div className="fr-container fr-two-col fr-two-col--top">
          <div>
            <h2 className="fr-heading-sm">Your files stay where they belong</h2>
            <p className="fr-muted">
              Most online converters ask you to upload a document and wait for a server to send it back. Filevra takes a
              different route: the browser downloads the tool once, then does the work itself.
            </p>
            <p className="fr-muted mb-4">
              That means no account, no upload progress bar and no copy of your ID photo, signature or invoice sitting on
              a server. It also means the result appears without a round trip, even on a slow connection.
            </p>
            <Link to="/privacy-policy" className="fr-btn fr-btn-secondary">
              Read the privacy policy
            </Link>
          </div>
          <ul className="fr-claim-list">
            <li className="fr-claim">
              <Icon name="ShieldCheck" size={18} />
              <div>
                <strong>Local processing</strong>
                <p>
                  The file is opened by JavaScript on your device. There is no upload queue and no Filevra storage
                  bucket.
                </p>
              </div>
            </li>
            <li className="fr-claim">
              <Icon name="Trash2" size={18} />
              <div>
                <strong>Nothing kept</strong>
                <p>Reloading or closing the page clears the working file. There is no document history to delete.</p>
              </div>
            </li>
            <li className="fr-claim">
              <Icon name="WifiOff" size={18} />
              <div>
                <strong>Works offline</strong>
                <p>Already cached tools keep working when the connection drops, because processing stays local.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className="fr-section">
        <div className="fr-container">
          <div className="fr-section-head">
            <h2>What happens to a file</h2>
            <p>Every tool follows the same three moves.</p>
          </div>
          <ol className="fr-flow">
            <li className="fr-flow-step">
              <span className="fr-flow-num" aria-hidden="true">
                1
              </span>
              <h3>Select your file</h3>
              <p>Drop it on the page or browse your device. Files are checked for format and size first.</p>
            </li>
            <li className="fr-flow-step">
              <span className="fr-flow-num" aria-hidden="true">
                2
              </span>
              <h3>Choose your settings</h3>
              <p>Enter a target size, pixel dimensions or quality level — whatever the tool needs.</p>
            </li>
            <li className="fr-flow-step">
              <span className="fr-flow-num" aria-hidden="true">
                3
              </span>
              <h3>Download the result</h3>
              <p>The result is created locally and offered as a download with a clear before-and-after size.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="fr-section fr-section--tint">
        <div className="fr-container fr-two-col fr-two-col--top">
          <div>
            <h2 className="fr-heading-sm">Several steps in one run</h2>
            <p className="fr-muted">
              Some jobs need more than one pass: convert a scan to JPG, rotate it, then compress it before it fits an
              upload form. The workflow builder chains those operations and produces every result from one upload.
            </p>
            <ul className="fr-facts-row mt-4 mb-4">
              <li className="fr-fact">
                <Icon name="Check" size={14} />
                <span>Up to 30 source files</span>
              </li>
              <li className="fr-fact">
                <Icon name="Check" size={14} />
                <span>Steps run in order</span>
              </li>
              <li className="fr-fact">
                <Icon name="Check" size={14} />
                <span>One ZIP for all results</span>
              </li>
            </ul>
            <Link to="/workflow" className="fr-btn fr-btn-primary">
              <Icon name="Workflow" size={16} />
              Open the workflow builder
            </Link>
          </div>
          <ol className="fr-flow">
            <li className="fr-flow-step">
              <span className="fr-flow-num" aria-hidden="true">
                1
              </span>
              <h3>Add images or a PDF</h3>
              <p>Images and PDFs up to 100 MB each. The operation list adapts to the type you added.</p>
            </li>
            <li className="fr-flow-step">
              <span className="fr-flow-num" aria-hidden="true">
                2
              </span>
              <h3>Add the operations</h3>
              <p>Convert, resize, compress, rotate, watermark or combine. Drag the steps to reorder them.</p>
            </li>
            <li className="fr-flow-step">
              <span className="fr-flow-num" aria-hidden="true">
                3
              </span>
              <h3>Download the final result</h3>
              <p>Each step feeds the next. The last step's output is what you download.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="fr-section" id="offline">
        <div className="fr-container fr-two-col fr-two-col--top">
          <div>
            <h2 className="fr-heading-sm">Use the tools when the connection drops</h2>
            <p className="fr-muted">
              After your first successful visit, a service worker stores the application shell — the pages, styles and
              scripts needed to run the tools. Open Filevra again without a connection and the cached tools still work,
              because the files were always processed locally.
            </p>
            <p className="fr-muted mb-0">
              You can also install Filevra as an app. Use the install icon in the address bar of Chrome or Edge, or
              choose “Add to Home screen” in your browser menu. On iPhone and iPad, use Share → Add to Home Screen.
            </p>
          </div>
          <div>
            <div className="fr-table-wrap">
              <table className="fr-data-table">
                <caption>What works offline</caption>
                <tbody>
                  {OFFLINE_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className="text-end">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="fr-small fr-muted mb-0">
              The very first visit must be online. Private browsing windows may discard the cache when closed.
            </p>
          </div>
        </div>
      </section>

      <section className="fr-section fr-section--tint">
        <div className="fr-container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div className="fr-section-head mb-0">
              <h2>Understand the result before you send it</h2>
              <p>Two plain-language guides, written for people preparing real documents.</p>
            </div>
          </div>
          <div className="fr-grid">
            {GUIDES.map((guide) => (
              <Link key={guide.id} to={guide.path} className="fr-tool-card">
                <span className="fr-tool-card__head">
                  <span className="fr-tool-card__icon">
                    <Icon name={guide.icon} size={17} />
                  </span>
                  <h3 className="fr-tool-card__title">{guide.name}</h3>
                </span>
                <p className="fr-tool-card__desc">{guide.description}</p>
                <span className="fr-tool-card__cta">
                  Read guide
                  <Icon name="ArrowRight" size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="fr-section">
        <div className="fr-container">
          <div className="fr-section-head">
            <h2>Frequently asked questions</h2>
            <p>Privacy, limits, offline use and the things these tools cannot do.</p>
          </div>
          <Faq items={HOME_FAQS} />
        </div>
      </section>

      <div className="fr-container">
        <AdSlot placement="content" />
      </div>

      <section className="fr-section fr-section--tight">
        <div className="fr-container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="fr-heading-xs">Pick a tool and get the file ready</h2>
              <p className="fr-muted mb-0 fr-small">No sign-up. No upload. No waiting for a server.</p>
            </div>
            <Link to="/tools" className="fr-btn fr-btn-primary">
              Find the right tool
              <Icon name="ArrowRight" size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
