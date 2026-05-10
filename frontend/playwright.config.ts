import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './e2e',
  outputDir: '../test-reports/e2e-shopping/test-results',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: '../test-reports/e2e-shopping/playwright-results.json' }],
    ['html', { open: 'never', outputFolder: '../test-reports/e2e-shopping/playwright-report' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: ['--disable-gpu']
    }
  },
  projects: [
    {
      name: 'chromium-pc',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'firefox-pc',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'webkit-pc',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 13'] }
    }
  ]
})
