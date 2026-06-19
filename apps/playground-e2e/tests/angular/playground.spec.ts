import { test, expect } from '@playwright/test';

test.describe('Angular Playground', () => {
  test('loads the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('LocaLive');
  });

  test('displays translated content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome to LocaLive!')).toBeVisible();
  });

  test('switches language to French', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Français' }).click();
    await expect(page.locator('h1')).toContainText('Bac à sable');
  });

  test('opens and closes the live editor', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Open Editor/ }).click();
    await expect(page.locator('[title="Close Localive editor"]')).toBeVisible({ timeout: 10000 });
    await page.locator('[title="Close Localive editor"]').click();
    await expect(page.locator('[title="Close Localive editor"]')).not.toBeVisible({ timeout: 5000 });
  });
});
