import { Link } from 'react-router-dom'
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs'
import AdSlot from '../AdSlot/AdSlot'
import Faq from '../Faq/Faq'
import Icon from '../Icon/Icon'
import ToolCard from '../ToolCard/ToolCard'
import { getRelatedTools } from '../../config/tools'

export default function ToolPageShell({
  tool,
  title,
  intro,
  facts = [],
  steps = [],
  about,
  formats = [],
  limits = [],
  faqs = [],
  children,
}) {
  const related = getRelatedTools(tool.id)

  return (
    <>
      <div className="fr-page-head">
        <div className="fr-container">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Tools', to: '/#tools' },
              { label: tool.name },
            ]}
          />
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </div>

      <section className="fr-section" style={{ paddingBottom: '2.5rem' }}>
        <div className="fr-container fr-tool-layout">
          <div className="fr-tool-main">{children}</div>
          <aside className="fr-aside">
            <div className="fr-aside-card">
              <h3>Quick facts</h3>
              <ul>
                {facts.map((fact) => (
                  <li key={fact}>
                    <span className="d-inline-flex align-items-start gap-2 fr-small" style={{ color: 'var(--fr-text)' }}>
                      <Icon name="Check" size={15} className="mt-1" style={{ color: 'var(--fr-success)' }} />
                      <span>{fact}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fr-aside-card">
              <h3>Related tools</h3>
              <ul>
                {related.map((item) => (
                  <li key={item.id}>
                    <Link to={item.path}>
                      <Icon name={item.icon} size={16} />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fr-aside-card">
              <h3 className="d-flex align-items-center gap-2">
                <Icon name="ShieldCheck" size={17} />
                Private by design
              </h3>
              <p className="fr-aside-note">
                Your file is handled in this browser tab. It is not uploaded to a FormReady server, stored in a
                database or sent to analytics.{' '}
                <Link to="/privacy-policy">How this works</Link>.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {steps.length > 0 && (
        <section className="fr-section fr-section--tint">
          <div className="fr-container">
            <div className="fr-section-head">
              <h2>How to use the {tool.name.toLowerCase()}</h2>
              <p>Three steps, no account and no installation.</p>
            </div>
            <ol className="fr-steps">
              {steps.map((step) => (
                <li className="fr-step" key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="fr-section">
        <div className="fr-container">
          <div className="fr-prose">
            {about}
            {formats.length > 0 && (
              <>
                <h2>Supported formats and limits</h2>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formats.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {limits.length > 0 && (
              <>
                <h2>When this tool has limits</h2>
                <ul>
                  {limits.map((limit) => (
                    <li key={limit}>{limit}</li>
                  ))}
                </ul>
              </>
            )}
            <h2>Privacy and your files</h2>
            <p>
              The file is read by JavaScript running in this tab and the result is created in the same tab. Nothing is
              uploaded, and FormReady does not keep a copy. Closing or reloading the page discards the working data.
              The only thing stored in your browser is your advertising choice, and only when advertising is enabled.
            </p>
          </div>
          <AdSlot placement="content" />
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="fr-section fr-section--tint">
          <div className="fr-container">
            <div className="fr-section-head">
              <h2>Frequently asked questions</h2>
              <p>Short answers to the questions people ask most about this tool.</p>
            </div>
            <Faq items={faqs} />
            <h2 className="mt-5 mb-3" style={{ fontSize: '1.4rem' }}>
              Related tools
            </h2>
            <div className="fr-grid">
              {related.map((item) => (
                <ToolCard key={item.id} tool={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
