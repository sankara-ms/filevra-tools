import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import Icon from '../../components/Icon/Icon'
import { TOOLS } from '../../config/tools'

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page Not Found | FormReady"
        description="The page you tried to open does not exist. Use the links to return to the FormReady tools."
        path="/404"
        noindex
      />

      <section className="fr-section">
        <div className="fr-container" style={{ maxWidth: 760 }}>
          <span className="fr-eyebrow">404</span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: '1rem' }}>We could not find that page</h1>
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
          <div className="fr-card">
            <h2 style={{ fontSize: '1rem' }}>Popular tools</h2>
            <ul className="fr-file-list" style={{ marginTop: '0.85rem' }}>
              {TOOLS.map((tool) => (
                <li className="fr-file-item" key={tool.id}>
                  <span className="fr-file-thumb fr-file-thumb--icon">
                    <Icon name={tool.icon} size={20} />
                  </span>
                  <span className="fr-file-meta">
                    <Link to={tool.path} className="fr-file-name" style={{ textDecoration: 'none' }}>
                      {tool.name}
                    </Link>
                    <span className="fr-file-sub">{tool.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
