import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon'

export default function ToolCard({ tool }) {
  return (
    <Link to={tool.path} className="fr-tool-card" data-testid={`tool-card-${tool.id}`}>
      <span className="fr-tool-icon">
        <Icon name={tool.icon} size={24} />
      </span>
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      <span className="fr-tool-open">
        Open tool
        <Icon name="ArrowRight" size={15} />
      </span>
    </Link>
  )
}
