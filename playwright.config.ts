import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30000,
  expect: { timeout: 5000 },
  outputDir: '.cache/playwright-results',
  reporter: [['list'], ['html', { outputFolder: '.cache/playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4349/SongDynastyHAHADemo/',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [...['light', 'dark'].flatMap(colorScheme => [320, 390, 768, 1440].map(width => ({
    name: `${colorScheme}-${width}`,
    testMatch: 'site.spec.ts',
    use: { viewport: { width, height: 1000 }, colorScheme: colorScheme as 'light' | 'dark' },
  }))), {
    name: 'performance', testMatch: 'performance.spec.ts', timeout: 45000,
    use: { viewport: { width: 1440, height: 1000 }, colorScheme: 'light' },
    dependencies: ['light', 'dark'].flatMap(theme => [320, 390, 768, 1440].map(width => `${theme}-${width}`)),
  }],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4349',
    url: 'http://127.0.0.1:4349/SongDynastyHAHADemo/',
    reuseExistingServer: false,
    timeout: 30000,
  },
})
