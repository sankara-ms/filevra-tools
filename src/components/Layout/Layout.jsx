import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import ConsentNotice from '../ConsentNotice/ConsentNotice'
import useOnlineStatus from '../../hooks/useOnlineStatus'
import Icon from '../Icon/Icon'

function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView({ block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}

export default function Layout() {
  const online = useOnlineStatus()

  return (
    <>
      <a className="fr-skip-link" href="#main-content">
        Skip to content
      </a>
      <ScrollManager />
      {!online && (
        <div className="fr-offline-banner" role="status">
          <div className="fr-container">
            <Icon name="WifiOff" size={16} />
            <span>
              You are offline. Pages you have already opened stay available, and files are still processed on this
              device. If a page will not load, open the{' '}
              <a href="/offline.html">basic offline page</a>.
            </span>
          </div>
        </div>
      )}
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
      <ConsentNotice />
    </>
  )
}
