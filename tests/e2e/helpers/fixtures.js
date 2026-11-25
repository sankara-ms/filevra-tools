import { fileURLToPath } from 'node:url'

export function fixture(name) {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

export function collectErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}
