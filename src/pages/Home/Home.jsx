import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import ToolCard from '../../components/ToolCard/ToolCard'
import Faq from '../../components/Faq/Faq'
import AdSlot from '../../components/AdSlot/AdSlot'
import Icon from '../../components/Icon/Icon'
import { TOOLS, GUIDES } from '../../config/tools'
import { faqJsonLd, websiteJsonLd } from '../../utils/schema'

const HOME_FACTS = [
  'Files are processed in your browser',
  'No account and no watermark',
  'Works offline after the first visit',
]

const HOME_FAQS = [
  {
    question: 'Are my files uploaded to a server?',
    answer:
      'No. Each tool reads the file with JavaScript in your browser and creates the result in the same tab. There is no upload step and no server-side copy of your document.',
  },
  {
    question: 'Can FormReady compress an image to exactly 100 KB?',
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
    question: 'Is FormReady free?',
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
  const normalized = query.trim().toLowerCase()
  const results = normalized
    ? TOOLS.filter((tool) =>
        [tool.name, tool.description, ...tool.keywords].join(' ').toLowerCase().includes(normalized),
      )
    : TOOLS

  return (
    <>
      <SEO
        title="FormReady - Free Image and PDF Tools That Run in Your Browser"
        description="Compress images to a target size, resize photos and signatures, convert images to PDF, merge PDFs and compress PDFs. Free, private and browser-based."
        path="/"
        jsonLd={[websiteJsonLd(), faqJsonLd(HOME_FAQS)]}
      />

      <section className="fr-hero">
        <div className="fr-container fr-two-col">
          <div>
            <span className="fr-eyebrow">Free browser tools</span>
            <h1>Prepare Your Images and Documents in Seconds</h1>
            <p className="fr-hero-lede">
              Free, simple tools to resize, compress and convert your files. No installation required — and your
              files never leave your device.
            </p>
            <div className="fr-hero-actions">
              <a className="fr-btn fr-btn-primary fr-btn-lg" href="#tools">
                Explore tools
              </a>
              <Link className="fr-btn fr-btn-secondary fr-btn-lg" to="/image-compressor">
                Start now
              </Link>
            </div>
            <ul className="fr-chips">
              {HOME_FACTS.map((fact) => (
                <li className="fr-chip" key={fact}>
                  <Icon name="Check" size={14} />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
          <div className="fr-hero-panel">
            <h2>What happens to your files</h2>
            <ul className="fr-hero-list">
              <li>
                <Icon name="ShieldCheck" size={18} />
                <span>
                  The file is opened by JavaScript on your device. There is no upload queue and no FormReady storage
                  bucket.
                </span>
              </li>
              <li>
                <Icon name="Lock" size={18} />
                <span>Nothing about the document is written to a database, analytics tool or advertising service.</span>
              </li>
              <li>
                <Icon name="WifiOff" size={18} />
                <span>Already cached tools keep working when the connection drops, because processing stays local.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="fr-section" id="tools">
        <div className="fr-container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div className="fr-section-head mb-0">
              <h2>Popular tools</h2>
              <p>Five focused tools for the file jobs that come up most often.</p>
            </div>
            <div className="fr-search">
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
                  className="fr-icon-btn"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                  style={{ width: 28, height: 28, border: 0 }}
                >
                  <Icon name="X" size={15} />
                </button>
              ) : null}
            </div>
          </div>

          {results.length > 0 ? (
            <div className="fr-grid" data-testid="tool-grid">
              {results.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="fr-empty" data-testid="search-empty">
              <p className="mb-2">
                No tools match “{query.trim()}”. Try “compressor”, “signature”, “PDF” or “convert”.
              </p>
              <button type="button" className="fr-btn fr-btn-secondary fr-btn-sm" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          )}

          <p className="fr-small fr-muted mt-4 mb-0">
            Not sure which tool you need? The{' '}
            <Link to="/image-preparation-guide">image preparation guide</Link> and{' '}
            <Link to="/pdf-preparation-guide">PDF preparation guide</Link> explain how file size, resolution and
            quality fit together.
          </p>
        </div>
      </section>

      <section className="fr-section fr-section--tint">
        <div className="fr-container">
          <div className="fr-two-col">
            <div>
              <span className="fr-eyebrow">Privacy</span>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.75rem' }}>
                Your files stay where they belong
              </h2>
              <p className="fr-muted mb-3">
                Most online converters ask you to upload a document and wait for a server to send it back. FormReady
                takes a different route: the browser downloads the tool once, then does the work itself.
              </p>
              <p className="fr-muted mb-4">
                That means no account, no upload progress bar and no copy of your ID photo, signature or invoice sitting
                on a server. It also means the result appears without a round trip, even on a slow connection.
              </p>
              <Link to="/privacy-policy" className="fr-btn fr-btn-secondary">
                Read the privacy policy
              </Link>
            </div>
            <div className="d-grid gap-3">
              <div className="fr-card">
                <div className="fr-card-icon">
                  <Icon name="ShieldCheck" size={22} />
                </div>
                <h3>Local processing</h3>
                <p>Image and PDF work happens in your browser tab using open JavaScript libraries.</p>
              </div>
              <div className="fr-card">
                <div className="fr-card-icon">
                  <Icon name="Trash2" size={22} />
                </div>
                <h3>Nothing kept</h3>
                <p>Reloading or closing the page clears the working file. There is no document history to delete.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fr-section">
        <div className="fr-container">
          <div className="fr-section-head">
            <span className="fr-eyebrow">How it works</span>
            <h2>Three steps, no manual</h2>
            <p>Every tool follows the same simple flow.</p>
          </div>
          <ol className="fr-steps">
            <li className="fr-step">
              <h3>Select your file</h3>
              <p>Drop it on the page or browse your device. Files are checked for format and size first.</p>
            </li>
            <li className="fr-step">
              <h3>Choose your settings</h3>
              <p>Enter a target size, pixel dimensions or quality level — whatever the tool needs.</p>
            </li>
            <li className="fr-step">
              <h3>Download the result</h3>
              <p>The result is created locally and offered as a download with a clear before-and-after size.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="fr-section fr-section--tint" id="offline">
        <div className="fr-container fr-two-col">
          <div>
            <span className="fr-eyebrow">Offline support</span>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.75rem' }}>
              Use the tools when the connection drops
            </h2>
            <p className="fr-muted mb-3">
              After your first successful visit, a service worker stores the application shell — the pages, styles and
              scripts needed to run the tools. Open FormReady again without a connection and the cached tools still
              work, because the files were always processed locally.
            </p>
            <p className="fr-muted mb-0">
              You can also install FormReady as an app. Use the install icon in the address bar of Chrome or Edge, or
              choose “Add to Home screen” in your browser menu. On iPhone and iPad, use Share → Add to Home Screen.
            </p>
          </div>
          <div className="fr-card">
            <h3>What works offline</h3>
            <table className="w-100 fr-small" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td className="py-2" style={{ borderBottom: '1px solid var(--fr-border)' }}>
                    Cached tool pages
                  </td>
                  <td className="py-2 text-end" style={{ borderBottom: '1px solid var(--fr-border)' }}>
                    Yes
                  </td>
                </tr>
                <tr>
                  <td className="py-2" style={{ borderBottom: '1px solid var(--fr-border)' }}>
                    Local file processing
                  </td>
                  <td className="py-2 text-end" style={{ borderBottom: '1px solid var(--fr-border)' }}>
                    Yes
                  </td>
                </tr>
                <tr>
                  <td className="py-2" style={{ borderBottom: '1px solid var(--fr-border)' }}>
                    Pages never opened before
                  </td>
                  <td className="py-2 text-end" style={{ borderBottom: '1px solid var(--fr-border)' }}>
                    Offline fallback
                  </td>
                </tr>
                <tr>
                  <td className="py-2">Advertising</td>
                  <td className="py-2 text-end">Not cached</td>
                </tr>
              </tbody>
            </table>
            <p className="fr-small fr-muted mt-3 mb-0">
              The very first visit must be online. Private browsing windows may discard the cache when closed.
            </p>
          </div>
        </div>
      </section>

      <section className="fr-section">
        <div className="fr-container">
          <div className="fr-section-head">
            <span className="fr-eyebrow">Guides</span>
            <h2>Understand the result before you send it</h2>
            <p>Two plain-language guides, written for people preparing real documents — not for search engines.</p>
          </div>
          <div className="fr-grid">
            {GUIDES.map((guide) => (
              <Link key={guide.id} to={guide.path} className="fr-tool-card">
                <span className="fr-tool-icon">
                  <Icon name={guide.icon} size={24} />
                </span>
                <h3>{guide.name}</h3>
                <p>{guide.description}</p>
                <span className="fr-tool-open">
                  Read guide
                  <Icon name="ArrowRight" size={15} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="fr-section fr-section--tint">
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

      <section className="fr-section">
        <div className="fr-container text-center">
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.75rem' }}>
            Pick a tool and get the file ready
          </h2>
          <p className="fr-muted mb-4">No sign-up. No upload. No waiting for a server.</p>
          <Link to="/image-compressor" className="fr-btn fr-btn-primary fr-btn-lg">
            Compress an image
          </Link>
        </div>
      </section>
    </>
  )
}
