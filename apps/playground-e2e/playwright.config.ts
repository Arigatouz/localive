import { defineConfig, devices } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '../..');

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
  ],
});
