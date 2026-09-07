import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', workers: 1, forbidOnly: true,
  use: { baseURL: 'http://127.0.0.1:4176', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } }],
  webServer: { command: 'npx vite --host 127.0.0.1 --port 4176 --strictPort', url: 'http://127.0.0.1:4176', reuseExistingServer: !(globalThis as { process?: { env?: { CI?: string } } }).process?.env?.CI },
})
