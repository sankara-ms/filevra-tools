import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import Icon from '../../components/Icon/Icon'
import { Alert } from '../../components/ErrorMessage/ErrorMessage'
import { CONTACT_EMAIL, SITE_NAME } from '../../config/site'

const REPO_ISSUES = 'https://github.com/sankara-ms/formready-tools/issues'

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact FormReady - Report a Problem or Ask a Question"
        description="How to contact FormReady about a bug, a correction or a privacy question, and what to include in a useful report. Please do not send personal documents."
        path="/contact"
      />

      <div className="fr-page-head">
        <div className="fr-container">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} />
          <h1>Contact {SITE_NAME}</h1>
          <p>
            Bug reports, corrections to a guide, accessibility problems and privacy questions are all welcome. This page
            explains the best route and what information makes a report actionable.
          </p>
        </div>
      </div>

      <section className="fr-section">
        <div className="fr-container fr-tool-layout">
          <div className="fr-tool-main">
            {CONTACT_EMAIL ? (
              <div className="fr-tool-shell mb-3">
                <h2 style={{ fontSize: '1.2rem' }}>Email</h2>
                <p className="fr-muted">
                  Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A plain message is fine; there is no
                  form to fill in.
                </p>
                <a className="fr-btn fr-btn-primary" href={`mailto:${CONTACT_EMAIL}`}>
                  <Icon name="Mail" size={17} />
                  Send an email
                </a>
              </div>
            ) : (
              <Alert tone="info" testId="contact-unconfigured">
                No public email address is configured for this deployment yet. The public issue tracker below reaches
                the project and is the recommended route in the meantime.
              </Alert>
            )}

            <div className="fr-tool-shell mb-3">
              <h2 style={{ fontSize: '1.2rem' }}>Public issue tracker</h2>
              <p className="fr-muted">
                For bugs and documentation corrections, opening an issue keeps the conversation public and makes it
                searchable for other people with the same problem. The source repository is public.
              </p>
              <a className="fr-btn fr-btn-secondary" href={REPO_ISSUES} target="_blank" rel="noreferrer noopener">
                Open the issue tracker
              </a>
            </div>

            <div className="fr-tool-card" style={{ cursor: 'default' }}>
              <h2 style={{ fontSize: '1.2rem' }}>What to include</h2>
              <ul className="fr-muted fr-small mb-0" style={{ paddingLeft: '1.1rem' }}>
                <li>Which tool you used and the URL of the page.</li>
                <li>Your browser and version, and the device type (phone, tablet, desktop).</li>
                <li>What you expected and what happened instead, including any error text.</li>
                <li>The file’s format, approximate size and dimensions — not the file itself.</li>
                <li>Whether the problem happens every time or only with one file.</li>
              </ul>
            </div>

            <div className="fr-tool-shell mt-3">
              <h2 style={{ fontSize: '1.2rem' }}>Please do not send documents</h2>
              <p className="fr-muted mb-0">
                Never attach an identity photo, signature, bank statement or any other personal document to a support
                message. The description above is enough to investigate. If a sample is essential, create a harmless
                test file with the same format and size instead.
              </p>
            </div>
          </div>

          <aside className="fr-aside">
            <div className="fr-aside-card">
              <h3>Before you write</h3>
              <p className="fr-aside-note">
                Check the tool page’s “When this tool has limits” section. Many reports are answered there — for
                example, a PDF compressing to a larger file, or a target size that cannot be met exactly.
              </p>
            </div>
            <div className="fr-aside-card">
              <h3>Privacy questions</h3>
              <p className="fr-aside-note">
                The <Link to="/privacy-policy">privacy policy</Link> explains what is stored locally, what the hosting
                provider may log, and how advertising consent works.
              </p>
            </div>
            <div className="fr-aside-card">
              <h3>No response guarantee</h3>
              <p className="fr-aside-note">
                This is an independent project, not a staffed support desk. Reports are read, but a reply is not
                guaranteed and no response time is promised.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
