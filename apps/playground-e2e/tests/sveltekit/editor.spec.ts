import { test as base, expect, type Locator, type Page } from '@playwright/test';

const MARKER = /͏[︀-️]{8}/;

const test = base.extend({
  page: async ({ page }, use) => {
    const uncaught: string[] = [];
    page.on('pageerror', (error) => uncaught.push(error.message));
    await use(page);
    expect(uncaught).toEqual([]);
  },
});

test.describe.configure({ mode: 'serial' });

async function saveAndWaitForReload(page: Page, field: Locator) {
  await Promise.all([page.waitForEvent('load'), field.press('Enter')]);
  // The editor mounts after hydration, so its toggle shows the page is interactive again.
  await expect(page.getByRole('button', { name: 'Done editing' })).toBeVisible();
}

// The toggle relabels itself at once, then reloads the page so the server renders the new mode.
async function toggleEditMode(page: Page, from: string, to: string) {
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: from }).click()]);
  await expect(page.getByRole('button', { name: to })).toBeVisible();
}

async function openInEditMode(page: Page, path = '/') {
  await page.goto('/');
  await toggleEditMode(page, 'Edit translations', 'Done editing');
  if (path !== '/') await page.goto(path);
  await expect(page.getByRole('button', { name: 'Done editing' })).toBeVisible();
}

test('marks messages only while edit mode is on', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Edit translations' })).toBeVisible();
  expect(await page.content()).not.toMatch(MARKER);

  await openInEditMode(page);
  expect(await page.content()).toMatch(MARKER);

  await toggleEditMode(page, 'Done editing', 'Edit translations');
  expect(await page.content()).not.toMatch(MARKER);
});

test('opens the clicked message with one field per locale', async ({ page }) => {
  await openInEditMode(page);

  await page.locator('#intro').click();

  const panel = page.getByRole('dialog', { name: 'Edit intro' });
  await expect(panel.getByRole('textbox')).toHaveCount(2);
  await expect(panel.getByRole('textbox').first()).toBeFocused();
  await expect(panel.getByRole('textbox').first()).toHaveValue('Click Edit translations, then click any text to edit it in place.');
});

test('previews while typing and drops the draft on Escape', async ({ page }) => {
  await openInEditMode(page);
  await page.locator('#intro').click();

  await page.getByRole('dialog', { name: 'Edit intro' }).getByRole('textbox').first().fill('A draft nobody saved');
  await expect(page.locator('#intro')).toContainText('A draft nobody saved');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#intro')).toContainText('Click Edit translations');
});

test('asks which message to edit when one element holds several', async ({ page }) => {
  await openInEditMode(page);

  await page.locator('article').click({ position: { x: 4, y: 4 } });
  const picker = page.getByRole('dialog', { name: 'Several messages are here' });
  await expect(picker.getByRole('button')).toHaveCount(2);

  await picker.getByRole('button', { name: /card_title/ }).click();
  await expect(page.getByRole('dialog', { name: 'Edit card_title' })).toBeVisible();
});

test('offers one field per locale and plural branch', async ({ page }) => {
  await openInEditMode(page);

  await page.locator('#cart').click();

  const labels = await page.getByRole('dialog', { name: 'Edit cart_count' }).locator('label').allTextContents();
  expect(labels.map((label) => label.replace(/\s+/g, ' ').trim())).toEqual(
    expect.arrayContaining(['en plural=one', 'en plural=other', 'fr plural=one', 'fr plural=other']),
  );
});

test('lists the messages on the page, including the title', async ({ page }) => {
  await openInEditMode(page);

  await page.getByRole('button', { name: 'Messages on this page' }).click();

  const list = page.getByRole('dialog', { name: 'Messages on this page' });
  await expect(list.getByRole('button', { name: /app_title/ })).toBeVisible();
  await list.getByRole('button', { name: /search_placeholder/ }).click();
  await expect(page.getByRole('dialog', { name: 'Edit search_placeholder' })).toBeVisible();
});

test('edits messages rendered by server and universal load functions', async ({ page }) => {
  await openInEditMode(page, '/loads');

  await page.locator('#server-message').click();
  await expect(page.getByRole('dialog', { name: 'Edit server_message' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#universal-message').click();
  await expect(page.getByRole('dialog', { name: 'Edit universal_message' })).toBeVisible();
});

test('still opens links in a new tab with Ctrl or Cmd', async ({ page, context }) => {
  await openInEditMode(page);

  const [opened] = await Promise.all([context.waitForEvent('page'), page.locator('#nav-loads').click({ modifiers: ['ControlOrMeta'] })]);

  await opened.waitForURL('**/loads');
  expect(new URL(page.url()).pathname).toBe('/');
});

test('submits forms without markers', async ({ page }) => {
  await openInEditMode(page, '/form');
  await expect(page.locator('#product')).toHaveValue(MARKER);

  // The button's label is a message, so a plain click would open the editor.
  await page.locator('#submit').click({ modifiers: ['Alt'] });

  await expect(page.locator('#received-raw')).toHaveText('"Shared component"');
});

test.describe('saving', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'The browsers share one copy of the messages, so only one saves.');

  test('saves on Enter, reloads with the new text and reopens the editor', async ({ page }) => {
    await openInEditMode(page);
    await page.locator('#save-target').click();
    const field = page.getByRole('dialog', { name: 'Edit save_target' }).getByRole('textbox').first();

    await field.fill('Saved from the editor');
    await saveAndWaitForReload(page, field);

    await expect(page.locator('#save-target')).toContainText('Saved from the editor');
    await expect(page.getByRole('dialog', { name: 'Edit save_target' }).getByRole('textbox').first()).toHaveValue('Saved from the editor');
  });

  test('saves one plural branch', async ({ page }) => {
    await openInEditMode(page);
    await page.locator('#add').click();
    await page.locator('#cart').click();
    const field = page.getByRole('dialog', { name: 'Edit cart_count' }).getByRole('textbox', { name: /en plural=other/ });

    await field.fill('{count} things in your cart');
    await saveAndWaitForReload(page, field);

    await page.keyboard.press('Escape');
    await page.locator('#add').click();
    await expect(page.locator('#cart')).toContainText('2 things in your cart');
  });

  test('adds a missing translation', async ({ page }) => {
    await openInEditMode(page);
    await page.locator('#missing').click();
    const panel = page.getByRole('dialog', { name: 'Edit only_english' });
    await expect(panel.getByText('missing')).toBeVisible();

    const field = panel.getByRole('textbox', { name: /fr/ });
    await field.fill("Cette phrase n'avait pas de traduction.");
    await saveAndWaitForReload(page, field);

    await expect(page.getByRole('dialog', { name: 'Edit only_english' }).getByText('missing')).toHaveCount(0);
  });

  test('explains why an edit was refused', async ({ page }) => {
    await openInEditMode(page);
    await page.locator('#greeting').click();
    const panel = page.getByRole('dialog', { name: 'Edit greeting' });

    await panel.getByRole('textbox').first().fill('Hello {user}');
    await panel.getByRole('button', { name: 'Save' }).first().click();

    await expect(panel.getByRole('status').first()).toContainText('{user} is not an input of this message');
  });
});
