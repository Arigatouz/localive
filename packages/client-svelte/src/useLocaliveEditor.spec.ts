import { createLocalive } from '@localive/core';
import { flushSync } from 'svelte';
import { createMockAdapter } from '../../../tools/testing';
import { useLocaliveEditor } from './useLocaliveEditor.svelte.js';

describe('useLocaliveEditor', () => {
  it('follows the instance state with runes', () => {
    const instance = createLocalive({ translationsPath: '', adapter: createMockAdapter(), locales: ['en'], defaultLocale: 'en' });
    const editor = useLocaliveEditor(instance);

    editor.activate();
    flushSync();

    expect(editor.isActive).toBe(true);
    expect(editor.currentLocale).toBe('en');
  });
});
