import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import Icon from '../../components/Icon/Icon'
import { CONTACT_EMAIL, SITE_NAME } from '../../config/site'

export default function About() {
  return (
    <>
      <SEO
        title="About Filevra - Private Browser-Based File Tools"
        description="Filevra is an independent project building small, honest tools for images and PDFs. Files are processed in your browser, and every tool states its real limits."
        path="/about"
      />

      <div className="fr-page-head">
        <div className="fr-container">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
          <h1>About {SITE_NAME}</h1>
          <p>
            {SITE_NAME} is a small set of free tools for the file tasks that appear again and again: shrinking a photo
            to a form’s limit, resizing a signature, turning scans into one PDF, joining documents and reducing a
            scanned PDF.
          </p>
        </div>
      </div>

      <section className="fr-section">
        <div className="fr-container fr-tool-layout">
          <article className="fr-prose">
            <h2>Why this site exists</h2>
            <p>
              Most “free online converter” pages work the same way: you upload a personal document to an unknown server,
              wait, and download the result. That model is convenient for the operator and uncomfortable for the person
              holding an identity photo or a signed contract. It also stops working the moment the connection drops.
            </p>
            <p>
              {SITE_NAME} takes the slower-to-build but simpler-to-trust route. Each tool is a page that runs entirely
              in your browser. The file is opened locally, processed locally and saved locally. There is no upload
              endpoint and no document storage to secure, because the document never leaves the device.
            </p>

            <h2>What the tools do — and what they do not do</h2>
            <p>
              The site deliberately covers a short list of jobs rather than dozens of shallow ones. Each tool page
              explains its output format, its limits and the cases where it is the wrong choice. The PDF compressor, for
              example, tells you plainly that it removes selectable text and may make a text PDF larger. That is less
              flattering than a green “success” badge, but it is more useful.
            </p>
            <ul>
              <li>No account, no email requirement and no watermark.</li>
              <li>No file uploads and no document history.</li>
              <li>No invented statistics, testimonials or download counts.</li>
              <li>No promise of an exact file size when the format cannot guarantee one.</li>
              <li>No silent changes to your dimensions or quality settings.</li>
            </ul>

            <h2>Privacy as a design decision</h2>
            <p>
              Because processing happens in the tab, privacy is not a policy bolted on afterwards — it is the
              architecture. Images are drawn to a canvas; PDFs are read with a bundled PDF library; results are created
              as in-memory blobs. Temporary object URLs are released when you reset the tool or leave the page.
            </p>
            <p>
              A service worker caches the application itself so the tools keep working offline. It never caches your
              documents. The only preference stored in your browser is an advertising consent choice, and only if
              advertising is enabled. The <Link to="/privacy-policy">privacy policy</Link> describes this in detail.
            </p>

            <h2>Built for a worldwide audience</h2>
            <p>
              {SITE_NAME} is not tied to a country, an examination board or a particular portal. File requirements vary
              enormously between organisations, so the tools accept the numbers you supply instead of guessing presets.
              The interface is in English, uses no regional symbols or currencies, and works the same way on a phone, a
              tablet and a desktop.
            </p>

            <h2>Technology</h2>
            <p>
              The site is a static React application built with Vite and styled with Bootstrap 5 plus a small design
              system. PDF page rendering uses PDF.js, PDF assembly uses pdf-lib, and image work uses the browser’s
              canvas API. It is hosted as static files, which keeps the site fast and removes a server-side document
              path entirely. The source is public, so the processing claims can be checked rather than taken on trust.
            </p>

            <h2>Accessibility and honest limits</h2>
            <p>
              The interface uses semantic headings, labelled form controls, visible focus styles and sufficient colour
              contrast. Tool status messages are announced to assistive technology. That said, no website is perfect,
              and very large files can still be limited by the memory of the device. If something does not work, a clear
              report is genuinely useful.
            </p>

            <h2>Independence</h2>
            <p>
              {SITE_NAME} is an independent project. It is not affiliated with any government body, examination
              authority, employer or file-hosting service. Guides describe general practice, not the rules of a specific
              organisation; always follow the instructions you were given.
            </p>

            <h2>Contact</h2>
            <p>
              Questions, corrections and bug reports are welcome. Use the <Link to="/contact">contact page</Link>
              {CONTACT_EMAIL ? (
                <>
                  {' '}
                  or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </>
              ) : null}
              . Please do not send personal documents.
            </p>
          </article>

          <aside className="fr-aside">
            <div className="fr-aside-card">
              <h3>At a glance</h3>
              <ul>
                <li>
                  <span className="fr-small d-flex gap-2">
                    <Icon name="ShieldCheck" size={16} />
                    Files processed on your device
                  </span>
                </li>
                <li>
                  <span className="fr-small d-flex gap-2">
                    <Icon name="Lock" size={16} />
                    No uploads, accounts or watermarks
                  </span>
                </li>
                <li>
                  <span className="fr-small d-flex gap-2">
                    <Icon name="WifiOff" size={16} />
                    Works offline after the first visit
                  </span>
                </li>
                <li>
                  <span className="fr-small d-flex gap-2">
                    <Icon name="Smartphone" size={16} />
                    Responsive on phones and desktops
                  </span>
                </li>
              </ul>
            </div>
            <div className="fr-aside-card">
              <h3>Start with a tool</h3>
              <ul>
                <li>
                  <Link to="/image-compressor">Image Compressor</Link>
                </li>
                <li>
                  <Link to="/photo-signature-resizer">Photo and Signature Resizer</Link>
                </li>
                <li>
                  <Link to="/merge-pdf">PDF Merger</Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
