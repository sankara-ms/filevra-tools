import { Link } from 'react-router-dom'
import { breadcrumbJsonLd } from '../../utils/schema'

export default function Breadcrumbs({ items }) {
  if (!items?.length) return null

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="fr-breadcrumbs">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(items)).replace(/</g, '\\u003c'),
        }}
      />
    </>
  )
}
