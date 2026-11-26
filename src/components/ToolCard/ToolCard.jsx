import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon'

export default function ToolCard({ tool }) {
  return (
    <Link to={tool.path} className="fr-tool-card" data-testid={`tool-card-${tool.id}`}>
      <span className="fr-tool-card__head">
        <span className="fr-tool-card__icon">
          <Icon name={tool.icon} size={17} />
        </span>
        <h3 className="fr-tool-card__title">{tool.name}</h3>
      </span>
      <p className="fr-tool-card__desc">{tool.description}</p>
      <span className="fr-tool-card__cta">
        Open tool
        <Icon name="ArrowRight" size={13} />
      </span>
    </Link>
  )
}
