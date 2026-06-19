import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupDir, createTempDir } from '../../../tools/testing';
import { extractKeys } from './extract';

describe('extractKeys', () => {
  let tempDir = '';

  afterEach(() => {
    if (tempDir) {
      cleanupDir(tempDir);
      tempDir = '';
    }
  });

  it('extracts keys from real framework patterns', () => {
    tempDir = createTempDir('localive-cli-extract-');
    const srcDir = join(tempDir, 'src');
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(srcDir, 'App.tsx'), `
      export function App() {
        return <div>{t('app.title')}</div>;
      }
    `, 'utf-8');

    writeFileSync(join(srcDir, 'App.vue'), `
      <template>
        <span v-localive-tag="'card.description'">{{ t('card.description') }}</span>
      </template>
    `, 'utf-8');

    writeFileSync(join(srcDir, 'app.component.ts'), `
      export class AppComponent {
        template = \`<span [attr.data-i18n-key]="'footer.rights'">{{ translations()[currentLocale()].footerRights }}</span>\`;
      }
    `, 'utf-8');

    writeFileSync(join(srcDir, 'App.svelte'), `
      <h1 data-i18n-key="app.title">{t('app.title')}</h1>
      <span data-i18n-key="app.subtitle">{t('app.subtitle')}</span>
    `, 'utf-8');

    const result = extractKeys({ cwd: tempDir });

    expect(result.keys).toEqual([
      'app.subtitle',
      'app.title',
      'card.description',
      'footer.rights',
    ]);
  });
});
