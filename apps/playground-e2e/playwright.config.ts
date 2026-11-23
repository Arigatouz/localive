import { defineConfig, devices } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '../..');
const SVELTEKIT_URL = 'http://localhost:5176';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'react',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
      testDir: './tests/react',
    },
    {
      name: 'vue',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5174' },
      testDir: './tests/vue',
    },
    {
      name: 'angular',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4201' },
      testDir: './tests/angular',
    },
    // The SvelteKit projects share one dev server and its message files, so they run one after another.
    {
      name: 'sveltekit-chromium',
      use: { ...devices['Desktop Chrome'], baseURL: SVELTEKIT_URL },
      testDir: './tests/sveltekit',
      fullyParallel: false,
    },
    {
      name: 'sveltekit-firefox',
      use: { ...devices['Desktop Firefox'], baseURL: SVELTEKIT_URL },
      testDir: './tests/sveltekit',
      fullyParallel: false,
      dependencies: ['sveltekit-chromium'],
    },
    {
      name: 'sveltekit-webkit',
      use: { ...devices['Desktop Safari'], baseURL: SVELTEKIT_URL },
      testDir: './tests/sveltekit',
      fullyParallel: false,
      dependencies: ['sveltekit-firefox'],
    },
  ],
  webServer: [
    {
      command: 'npm run dev --workspace=playground-react -- --port=5173',
      port: 5173,
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
    {
      command: 'npm run dev --workspace=playground-vue -- --port=5174',
      port: 5174,
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
    {
      command: 'npx ng serve --port=4201',
      port: 4201,
      cwd: resolve(workspaceRoot, 'apps/playground-angular'),
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      // Runs on a temporary copy of the messages, which a server already running on the real files would bypass.
      command: 'npm run dev:e2e -- --port=5176 --strictPort',
      port: 5176,
      cwd: resolve(workspaceRoot, 'examples/sveltekit-paraglide'),
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
