// @vitest-environment node
import { compile, paraglideVitePlugin } from '@inlang/paraglide-js';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type Plugin, type ViteDevServer } from 'vite';
import { findMarkedMessages, indexMarkers, untag } from '../runtime/index.js';
import { instrumentMessageModule } from './instrument-messages.js';
import { handleRequestInScope } from './request-scope.js';
import { loadRuntimeBridge, resolveRuntimeBridge, RUNTIME_BRIDGE_ID } from './runtime-bridge.js';

const require = createRequire(import.meta.url);
const RUNTIME_FILE = fileURLToPath(new URL('../runtime/index.ts', import.meta.url));
const KEYS = ['plain', 'greet', 'nav.home', 'helloWorld', 'count', 'rich', 'only_en'];
const MESSAGES = {
  en: {
    plain: 'Plain',
    greet: 'Hello {name}',
    nav: { home: 'Home' },
    helloWorld: 'Camel',
    count: [{ declarations: ['input count', 'local plural = count: plural'], selectors: ['plural'], match: { 'plural=one': '{count} item', 'plural=other': '{count} items' } }],
    rich: 'Read {#strong}this{/strong}',
    only_en: 'Only English',
  },
  pl: {
    plain: 'Zwykły',
    greet: 'Cześć {name}',
    nav: { home: 'Start' },
    helloWorld: 'Wielbłąd',
    count: [{ declarations: ['input count', 'local plural = count: plural'], selectors: ['plural'], match: { 'plural=one': '{count} rzecz', 'plural=other': '{count} rzeczy' } }],
    rich: 'Przeczytaj {#strong}to{/strong}',
  },
};
const markerIndex = indexMarkers(['en', 'pl'].flatMap((locale) => KEYS.map((key) => ({ locale, key }))));

type Layout = 'message-modules' | 'locale-modules' | 'virtual-modules';
type Messages = Record<string, (inputs?: object, options?: { locale?: string }) => string> & {
  rich: { parts(inputs?: object): { type: string; value?: string }[] };
};

describe.each<Layout>(['message-modules', 'locale-modules', 'virtual-modules'])('instrumenting %s', (layout) => {
  let root: string;
  let vite: ViteDevServer;
  let m: Messages;

  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), 'localive-paraglide-'));
    const project = join(root, 'project.inlang');
    const outdir = join(root, 'src/paraglide');
    mkdirSync(project);
    mkdirSync(join(root, 'messages'));
    copyFileSync(require.resolve('@inlang/plugin-message-format'), join(root, 'message-format.js'));
    writeFileSync(
      join(project, 'settings.json'),
      JSON.stringify({ baseLocale: 'en', locales: ['en', 'pl'], modules: ['./message-format.js'], 'plugin.inlang.messageFormat': { pathPattern: './messages/{locale}.json' } }),
    );
    for (const [locale, messages] of Object.entries(MESSAGES)) writeFileSync(join(root, `messages/${locale}.json`), JSON.stringify(messages));

    const paraglide: Plugin[] = [];
    if (layout === 'virtual-modules') paraglide.push(...(paraglideVitePlugin({ project, outdir, strategy: ['baseLocale'] }) as Plugin[]));
    else await compile({ project, outdir, outputStructure: layout, strategy: ['baseLocale'] });

    vite = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      appType: 'custom',
      cacheDir: join(root, '.vite'),
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, hmr: false, ws: false, watch: null },
      plugins: [
        ...paraglide,
        {
          name: 'localive-paraglide-test',
          enforce: 'post',
          resolveId: { order: 'pre', handler: resolveRuntimeBridge },
          load: (id) => loadRuntimeBridge(id, { searchFolders: [root], runtimeFile: RUNTIME_FILE }),
          transform(code, id) {
            return instrumentMessageModule(code, id, (source) => this.parse(source), { isExcluded: () => false });
          },
        },
      ],
    });
    m = (await vite.ssrLoadModule(join(outdir, 'messages.js'))).m as Messages;
  });

  afterAll(async () => {
    await vite?.close();
    rmSync(root, { recursive: true, force: true });
  });

  function inEditMode<T>(read: () => T): T {
    const request = { method: 'GET', url: '/', headers: { 'sec-fetch-dest': 'document', cookie: 'localive_edit=1' } };
    return handleRequestInScope(request as IncomingMessage, read);
  }

  it.each([
    ['plain', () => m.plain(), 'en', 'plain', 'Plain'],
    ['an input', () => m.greet({ name: 'Ola' }), 'en', 'greet', 'Hello Ola'],
    ['a nested key', () => m['nav.home'](), 'en', 'nav.home', 'Home'],
    ['a camel case key', () => m.helloWorld(), 'en', 'helloWorld', 'Camel'],
    ['a plural', () => m.count({ count: 2 }), 'en', 'count', '2 items'],
    ['a locale option', () => m.plain({}, { locale: 'pl' }), 'pl', 'plain', 'Zwykły'],
    ['a fallback to the base locale', () => m.only_en({}, { locale: 'pl' }), 'pl', 'only_en', 'Only English'],
  ])('marks %s exactly once', (_description, read, locale, key, text) => {
    const output = inEditMode(read);

    expect(findMarkedMessages(output, markerIndex)).toEqual([{ locale, key }]);
    expect(untag(output)).toBe(text);
  });

  it('marks the text parts of rich messages', () => {
    const parts = inEditMode(() => m.rich.parts());

    expect(parts.map((part) => part.value && findMarkedMessages(part.value, markerIndex).length)).toEqual([1, undefined, 1, undefined]);
  });

  it('leaves output untouched outside edit mode', () => {
    expect(m.plain()).toBe('Plain');
    expect(handleRequestInScope({ method: 'GET', url: '/', headers: {} } as IncomingMessage, () => m.plain())).toBe('Plain');
  });
});

describe('instrumentMessageModule', () => {
  const parse = (source: string) => require('vite').parseAst(source);
  const options = { isExcluded: (key: string) => key === 'secret' };

  it.each([
    ['application code', '/src/routes/page.js', "import { getLocale } from '../runtime.js'; export const a = () => '';"],
    ['a module without getLocale', '/src/paraglide/messages/en.js', "export const a = () => 'en';"],
    ['an excluded key', '/src/paraglide/messages/secret.js', "import { getLocale } from '../runtime.js'; export const secret = () => '';"],
    ['a runtime import from elsewhere', '/src/paraglide/messages/a.js', "import { getLocale } from './other.js'; export const a = () => '';"],
  ])('leaves %s alone', (_description, id, code) => {
    expect(instrumentMessageModule(code, id, parse, options)).toBeNull();
  });

  it('follows a renamed getLocale import', () => {
    const code = "import { getLocale as locale } from '../runtime.js'; const a_b = () => ''; export { a_b as \"a.b\" };";

    expect(instrumentMessageModule(code, '/out/messages/a_b.js?v=1', parse, options)?.code).toContain(
      `__localiveTag("a.b", (() => ''), locale)`,
    );
  });
});

describe('request scope', () => {
  it.each([
    ['a page', 'GET', '/about', { 'sec-fetch-dest': 'document' }, true],
    ['page data', 'GET', '/about/__data.json?x-sveltekit-invalidated=1', {}, true],
    ['prerendered page data', 'GET', '/about.html__data.json', {}, true],
    ['a form action', 'POST', '/about', { 'sec-fetch-dest': 'document' }, false],
    ['an API call', 'GET', '/api/items', { 'sec-fetch-dest': 'empty' }, false],
  ])('puts %s in edit mode only with the cookie', (_description, method, url, headers, isMarked) => {
    const markerOf = (cookie?: string) =>
      handleRequestInScope({ method, url, headers: { ...headers, cookie } } as IncomingMessage, () =>
        (globalThis as Record<symbol, { getStore(): unknown }>)[Symbol.for('localive.paraglide.request')].getStore(),
      );

    expect(markerOf('localive_edit=1')).toBe(isMarked);
    expect(markerOf('other=1')).toBe(false);
  });

  it('exposes the bridge only under its own id', () => {
    expect(resolveRuntimeBridge(RUNTIME_BRIDGE_ID)).toMatch(/^\0/);
    expect(resolveRuntimeBridge('svelte')).toBeNull();
  });

  it('makes drafts reactive when Svelte resolves from any of the folders, such as the app beside a shared project', () => {
    const bridgeId = resolveRuntimeBridge(RUNTIME_BRIDGE_ID)!;

    expect(loadRuntimeBridge(bridgeId, { searchFolders: [tmpdir(), process.cwd()], runtimeFile: RUNTIME_FILE })).toContain('useSubscriber(createSubscriber)');
    expect(loadRuntimeBridge(bridgeId, { searchFolders: [tmpdir()], runtimeFile: RUNTIME_FILE })).not.toContain('svelte');
  });

  it('imports the runtime by file path, which Vite does not pre-bundle', () => {
    const runtimeFile = String.raw`C:\app\runtime.js`;
    const bridge = loadRuntimeBridge(resolveRuntimeBridge(RUNTIME_BRIDGE_ID)!, { searchFolders: [tmpdir()], runtimeFile });

    expect(bridge?.trim()).toBe('export { tag } from "C:/app/runtime.js";');
  });
});
