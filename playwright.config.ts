import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!(process.env as any).CI,
  retries: (process.env as any).CI ? 2 : 0,
  workers: (process.env as any).CI ? 1 : 4,
  timeout: (process.env as any).CI ? 30000 : 15000,
  expect: {
    timeout: 5000,
  },
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'],
    ['github'],
  ],
  use: {
    baseURL: (process.env as any).BASE_URL || 'http://localhost:3002',
    trace: (process.env as any).CI ? 'on-first-retry' : 'on',
    screenshot: 'only-on-failure',
    video: (process.env as any).CI ? 'retain-on-failure' : 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'performance',
      testMatch: /.*performance.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'accessibility',
      testMatch: /.*accessibility.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !(process.env as any).CI,
    timeout: 120 * 1000,
    stderr: 'pipe',
    stdout: 'pipe',
  },
  snapshotDir: 'tests/__screenshots__',
  outputDir: 'test-results/',
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
  metadata: {
    project: 'Bondidi 3D Room Editor',
    version: (process.env as any).npm_package_version || '1.0.0',
    environment: (process.env as any).NODE_ENV || 'development',
  },
  preserveOutput: 'failures-only',
  maxFailures: (process.env as any).CI ? 10 : 0,
  // 환경변수가 없을 때는 undefined로 두어 전체 테스트가 매칭되도록
  grep: (process.env as any).TEST_GREP ? new RegExp((process.env as any).TEST_GREP) : undefined,
  grepInvert: (process.env as any).TEST_GREP_INVERT ? new RegExp((process.env as any).TEST_GREP_INVERT) : undefined,
});
