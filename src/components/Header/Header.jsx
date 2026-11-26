import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CATEGORIES, POPULAR_TOOLS } from '../../config/toolRegistry'
import { GUIDES } from '../../config/tools'
import { BrandMark } from '../Icon/Icon'
import Icon from '../Icon/Icon'
import HeaderSearch from './HeaderSearch'

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
        className={`fr-nav-link${active ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <Icon name="ChevronDown" size={14} />
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

const CATEGORY_LINKS = CATEGORIES.map((category) => ({
  path: `/tools?category=${category.id}`,
  name: category.name,
  description: category.blurb,
}))

export default function Header() {
  const [menuPath, setMenuPath] = useState(null)
  const location = useLocation()
  const mobileOpen = menuPath === location.pathname
  const toggleMobile = () => setMenuPath((value) => (value === location.pathname ? null : location.pathname))
  const closeMobile = () => setMenuPath(null)

  return (
    <header className="fr-header">
      <div className="fr-container fr-header-inner">
        <Link to="/" className="fr-brand" aria-label="Filevra home">
          <span className="fr-brand-mark">
            <BrandMark size={32} />
          </span>
          <span>Filevra</span>
        </Link>

        <nav className="fr-nav" aria-label="Main navigation">
          <NavLink to="/" className="fr-nav-link" end>
            Home
          </NavLink>
          <NavLink to="/tools" className="fr-nav-link">
            All tools
          </NavLink>
          <NavDropdown label="Categories" items={CATEGORY_LINKS} />
          <NavLink to="/workflow" className="fr-nav-link">
            Workflow
          </NavLink>
          <NavDropdown label="Guides" items={GUIDES} active={GUIDES.some((guide) => guide.path === location.pathname)} />
          <NavLink to="/about" className="fr-nav-link">
            About
          </NavLink>
        </nav>

        <HeaderSearch />

        <div className="fr-header-actions">
          <Link to="/tools" className="fr-btn fr-btn-primary fr-btn-sm">
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
          <Icon name={mobileOpen ? 'X' : 'Menu'} size={20} />
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
          <div className="fr-mobile-search">
            <HeaderSearch variant="menu" />
          </div>
          <div className="fr-mobile-group">
            <Link to="/">Home</Link>
            <Link to="/tools">All tools</Link>
            <Link to="/workflow">Workflow builder</Link>
          </div>
          <div className="fr-mobile-group">
            <p className="fr-mobile-group-title">Popular tools</p>
            {POPULAR_TOOLS.slice(0, 6).map((tool) => (
              <Link key={tool.path} to={tool.path}>
                {tool.name}
              </Link>
            ))}
          </div>
          <div className="fr-mobile-group">
            <p className="fr-mobile-group-title">Categories</p>
            {CATEGORIES.map((category) => (
              <Link key={category.id} to={`/tools?category=${category.id}`}>
                {category.name}
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
