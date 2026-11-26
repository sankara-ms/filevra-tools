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
              { label: 'Tools', to: '/tools' },
              { label: tool.name },
            ]}
          />
          <h1>{title}</h1>
          <p>{intro}</p>
          {facts.length > 0 ? (
            <ul className="fr-facts-row">
              {facts.map((fact) => (
                <li className="fr-fact" key={fact}>
                  <Icon name="Check" size={14} />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <section className="fr-section fr-section--tight">
        <div className="fr-container">
          {children}

          <div className="fr-tool-details">
            <div>
              <h2 className="fr-details-heading">Related tools</h2>
              <div className="fr-related-row">
                {related.map((item) => (
                  <Link to={item.path} className="fr-related-link" key={item.id}>
                    <Icon name={item.icon} size={15} />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <p className="fr-tool-details__note">
              <Icon name="ShieldCheck" size={15} /> Your file is handled in this browser tab. It is not uploaded to a
              Filevra server, stored in a database or sent to analytics. <Link to="/privacy-policy">How this works</Link>
              .
            </p>
          </div>
        </div>
      </section>

      {steps.length > 0 && (
        <section className="fr-section fr-section--tint">
          <div className="fr-container">
            <div className="fr-section-head">
              <h2>How to use the {tool.name.toLowerCase()}</h2>
              <p>No account and no installation.</p>
            </div>
            <ol className="fr-flow">
              {steps.map((step, index) => (
                <li className="fr-flow-step" key={step.title}>
                  <span className="fr-flow-num" aria-hidden="true">
                    {index + 1}
                  </span>
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
              uploaded, and Filevra does not keep a copy. Closing or reloading the page discards the working data. The
              only thing stored in your browser is your advertising choice, and only when advertising is enabled.
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
            <h2 className="fr-details-heading mt-5">More tools like this</h2>
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
