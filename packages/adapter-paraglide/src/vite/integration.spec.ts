// @vitest-environment node
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { parseAst } from 'vite';
import { paraglideIntegration } from './index.js';

const require = createRequire(import.meta.url);

describe('paraglideIntegration', () => {
  let root: string;
  let project: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'localive-integration-'));
    project = join(root, 'project.inlang');
    mkdirSync(project);
    mkdirSync(join(root, 'messages'));
    copyFileSync(require.resolve('@inlang/plugin-message-format'), join(root, 'message-format.js'));
    writeFileSync(
      join(project, 'settings.json'),
      JSON.stringify({ baseLocale: 'en', locales: ['en'], modules: ['./message-format.js'], 'plugin.inlang.messageFormat': { pathPattern: './messages/{locale}.json' } }),
    );
    writeFileSync(join(root, 'messages/en.json'), '{"title":"Title","slug":"about"}');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('resolves the project from the working directory, like Paraglide', () => {
    const integration = paraglideIntegration({ project: relative(process.cwd(), project) });

    expect(integration.readCatalog().messages.en).toEqual({ title: 'Title', slug: 'about' });
    expect(integration.write({ key: 'title', value: 'New', locale: 'en' })).toMatchObject({ success: true });
    expect(readFileSync(join(root, 'messages/en.json'), 'utf-8')).toBe('{"title":"New","slug":"about"}');
  });

  it('leaves excluded keys unmarked', () => {
    const integration = paraglideIntegration({ project, exclude: ['slug', /^internal\./] });
    const code = [
      "import { getLocale } from '../runtime.js';",
      "export const title = () => 'Title';",
      "export const slug = () => 'about';",
      "const internal_x = () => '';",
      'export { internal_x as "internal.x" };',
    ].join('\n');

    const output = integration.transform.call({ parse: parseAst }, code, '/app/src/paraglide/messages/_index.js')?.code;

    expect(output).toContain('__localiveTag("title"');
    expect(output).not.toContain('__localiveTag("slug"');
    expect(output).not.toContain('__localiveTag("internal.x"');
  });

  it('warns once about messages that share a marker', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const integration = paraglideIntegration({ project });
    integration.readCatalog();
    expect(warn).not.toHaveBeenCalled();

    writeFileSync(join(root, 'messages/en.json'), '{"key_229599":"A","key_432382":"B"}');
    integration.readCatalog();
    integration.readCatalog();

    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('"key_229599" (en) and "key_432382" (en)'));
    warn.mockRestore();
  });
});
