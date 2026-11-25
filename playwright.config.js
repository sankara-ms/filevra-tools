import { defineConfig, devices } from '@playwright/test'

const liveURL = process.env.LIVE_URL || ''

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.js',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: liveURL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /live\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      testMatch: /responsive\.spec\.js/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'live',
      testMatch: /live\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: liveURL
    ? undefined
    : {
        command: 'npm run build && npm run preview',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})
