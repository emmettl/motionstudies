import { defineConfig, devices } from '@playwright/test'
const port = Number(process.env.MOTION_LOADERS_PORT ?? 4176)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid MOTION_LOADERS_PORT')
const baseURL = `http://127.0.0.1:${port}`
export default defineConfig({
  testDir: './e2e', workers: 1, forbidOnly: true,
  use: { baseURL, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } }],
  webServer: { command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`, url: baseURL, reuseExistingServer: process.env.MOTION_LOADERS_REUSE === '1' },
})
