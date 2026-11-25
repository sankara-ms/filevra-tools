import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './app/routes'
import './styles/main.css'

if (typeof window !== 'undefined') {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {})
}

export const createRoot = ViteReactSSG({ routes })
