import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import Icon from '../../components/Icon/Icon'
import { TOOLS } from '../../config/tools'

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page Not Found | Filevra"
        description="The page you tried to open does not exist. Use the links to return to the Filevra tools."
        path="/404"
        noindex
      />

      <section className="fr-section">
        <div className="fr-container fr-container--narrow">
          <h1>We could not find that page</h1>
          <p className="fr-lede mb-4">
            The address may be mistyped, or the page may have moved. No file was processed or uploaded while looking for
            it. These links will get you back to something useful.
          </p>
          <div className="d-flex flex-wrap gap-2 mb-4">
            <Link to="/" className="fr-btn fr-btn-primary">
              Go to the homepage
            </Link>
            <Link to="/#tools" className="fr-btn fr-btn-secondary">
              Browse all tools
            </Link>
          </div>

          <h2 className="fr-details-heading">Popular tools</h2>
          <ul className="fr-file-list">
            {TOOLS.map((tool) => (
              <li className="fr-file-item" key={tool.id}>
                <span className="fr-file-thumb fr-file-thumb--icon">
                  <Icon name={tool.icon} size={18} />
                </span>
                <span className="fr-file-meta">
                  <Link to={tool.path} className="fr-file-name">
                    {tool.name}
                  </Link>
                  <span className="fr-file-sub">{tool.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
