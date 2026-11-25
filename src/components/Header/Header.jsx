import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { GUIDES, TOOLS } from '../../config/tools'
import { BrandMark } from '../Icon/Icon'
import Icon from '../Icon/Icon'

function NavDropdown({ label, items, active }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="fr-nav-dropdown" ref={containerRef}>
      <button
        type="button"
        className="fr-nav-link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        style={active ? { color: 'var(--fr-primary)', background: 'var(--fr-primary-soft)' } : undefined}
      >
        {label}
        <Icon name="ChevronDown" size={15} />
      </button>
      <div className={`fr-nav-menu${open ? ' is-open' : ''}`}>
        {items.map((item) => (
          <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
            {item.name}
            <small>{item.description}</small>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Header() {
  const [menuPath, setMenuPath] = useState(null)
  const location = useLocation()
  const mobileOpen = menuPath === location.pathname
  const toggleMobile = () => setMenuPath((value) => (value === location.pathname ? null : location.pathname))
  const closeMobile = () => setMenuPath(null)

  const toolActive = TOOLS.some((tool) => tool.path === location.pathname)

  return (
    <header className="fr-header">
      <div className="fr-container fr-header-inner">
        <Link to="/" className="fr-brand" aria-label="Filevra home">
          <BrandMark size={36} />
          <span>Filevra</span>
        </Link>

        <nav className="fr-nav" aria-label="Main navigation">
          <NavLink to="/" className="fr-nav-link" end>
            Home
          </NavLink>
          <NavDropdown label="Image tools" items={TOOLS.slice(0, 3)} active={toolActive && location.pathname !== '/merge-pdf' && location.pathname !== '/compress-pdf'} />
          <NavDropdown label="PDF tools" items={TOOLS.slice(3)} active={location.pathname === '/merge-pdf' || location.pathname === '/compress-pdf'} />
          <NavDropdown label="Guides" items={GUIDES} active={GUIDES.some((guide) => guide.path === location.pathname)} />
          <NavLink to="/about" className="fr-nav-link">
            About
          </NavLink>
        </nav>

        <div className="fr-header-actions">
          <Link to="/#tools" className="fr-btn fr-btn-primary fr-btn-sm">
            Browse tools
          </Link>
        </div>

        <button
          type="button"
          className="fr-menu-toggle"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={toggleMobile}
        >
          <Icon name={mobileOpen ? 'X' : 'Menu'} size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fr-mobile-menu"
          id="mobile-menu"
          onClick={(event) => {
            if (event.target.closest('a')) closeMobile()
          }}
        >
          <div className="fr-mobile-group">
            <Link to="/">Home</Link>
          </div>
          <div className="fr-mobile-group">
            <p className="fr-mobile-group-title">Image tools</p>
            {TOOLS.slice(0, 3).map((tool) => (
              <Link key={tool.path} to={tool.path}>
                {tool.name}
              </Link>
            ))}
          </div>
          <div className="fr-mobile-group">
            <p className="fr-mobile-group-title">PDF tools</p>
            {TOOLS.slice(3).map((tool) => (
              <Link key={tool.path} to={tool.path}>
                {tool.name}
              </Link>
            ))}
          </div>
          <div className="fr-mobile-group">
            <p className="fr-mobile-group-title">Guides</p>
            {GUIDES.map((guide) => (
              <Link key={guide.path} to={guide.path}>
                {guide.name}
              </Link>
            ))}
          </div>
          <div className="fr-mobile-group">
            <p className="fr-mobile-group-title">Site</p>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      )}
    </header>
  )
}
