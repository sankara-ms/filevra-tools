import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

self.skipWaiting()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

const pageStrategy = new NetworkFirst({
  cacheName: 'filevra-pages-v1',
  networkTimeoutSeconds: 4,
})

async function handleNavigation(options) {
  try {
    return await pageStrategy.handle(options)
  } catch {
    const shell = await matchPrecache('/index.html')
    if (shell) return shell
    const offline = await matchPrecache('/offline.html')
    if (offline) return offline
    return Response.error()
  }
}

// Navigations only. Documents are never cached; the app shell is.
registerRoute(
  new NavigationRoute(handleNavigation, {
    denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
  }),
)
