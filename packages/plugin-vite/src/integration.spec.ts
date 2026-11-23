import { AsyncLocalStorage } from 'node:async_hooks';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer as createViteServer, resolveConfig, type ViteDevServer } from 'vite';
import type { LocaliveIntegration } from './integration';
import { localiveVite } from './plugin';

const CATALOG = { en: { title: 'Title' } };
const ENDPOINT = '/__localive-update';
const VIRTUAL_MODULE = '\0virtual:messages';

describe('localiveVite with an integration', () => {
  const requestScope = new AsyncLocalStorage<string>();
  let root: string;
  let vite: ViteDevServer;
  let server: Server;
  let port: number;
  let integration: LocaliveIntegration;

  beforeEach(async () => {
    root = mkdtempSync(join(tmpdir(), 'localive-integration-'));
    integration = {
      write: vi.fn(async () => ({ success: true })),
      readCatalog: vi.fn(async () => CATALOG),
      resolveId: (source) => (source === 'virtual:messages' ? VIRTUAL_MODULE : null),
      load(id) {
        // Reading `this.write` fails unless the plugin calls the hook on the integration.
        return id === VIRTUAL_MODULE && typeof this.write === 'function' ? "export const title = 'original'" : null;
      },
      transform(code, id) {
        if (id !== VIRTUAL_MODULE) return null;
        this.parse(code);
        return { code: code.replace('original', 'instrumented'), map: null };
      },
      handleRequest: (req, next) => requestScope.run(req.url ?? '', next),
    };

    vite = await createViteServer({
      root,
      configFile: false,
      logLevel: 'silent',
      appType: 'custom',
      cacheDir: join(root, '.vite'),
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, hmr: false, ws: false, watch: null },
      plugins: [localiveVite({ integration })],
    });
    vi.spyOn(vite.ws, 'send');

    server = createServer((req, res) => {
      vite.middlewares(req, res, async () => {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
        res.end(requestScope.getStore());
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    await vite.close();
    rmSync(root, { recursive: true, force: true });
  });

  function send(method: string, path: string, { body, headers }: { body?: object; headers?: object } = {}) {
    return new Promise<{ status?: number; text: string; cacheControl?: string }>((resolve, reject) => {
      const outgoing = request(
        {
          host: '127.0.0.1',
          port,
          method,
          path,
          agent: false,
          headers: { host: `127.0.0.1:${port}`, 'content-type': 'application/json', ...headers },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf-8');
            resolve({ status: res.statusCode, text, cacheControl: res.headers['cache-control'] });
          });
        },
      );
      outgoing.on('error', reject);
      outgoing.end(body && JSON.stringify(body));
    });
  }

  describe('saving', () => {
    const entry = { key: 'count', value: 'One', locale: 'en', variant: 'plural=one', expected: null };

    it('hands the entry to the integration and broadcasts', async () => {
      expect((await send('POST', ENDPOINT, { body: entry })).status).toBe(200);
      expect(integration.write).toHaveBeenCalledExactlyOnceWith(entry);
      expect(vite.ws.send).toHaveBeenCalledExactlyOnceWith('localive:update', { path: ENDPOINT });
    });

    it.each([
      [{ success: false, conflict: true, error: 'changed' }, 409],
      [{ success: false, error: 'unknown placeholder' }, 400],
    ])('answers %j with %i', async (result, status) => {
      vi.mocked(integration.write).mockResolvedValue(result);

      const response = await send('POST', ENDPOINT, { body: entry });

      expect(response.status).toBe(status);
      expect(JSON.parse(response.text).error).toBe(result.error);
      expect(vite.ws.send).not.toHaveBeenCalled();
    });

    it('answers 500 when the integration fails', async () => {
      vi.mocked(integration.write).mockRejectedValue(new Error('disk full'));

      expect(await send('POST', ENDPOINT, { body: entry })).toMatchObject({ status: 500, text: '{"error":"disk full"}' });
    });

    it('keeps refusing cross-origin writes', async () => {
      const response = await send('POST', ENDPOINT, { body: entry, headers: { 'sec-fetch-site': 'cross-site' } });

      expect(response.status).toBe(403);
      expect(integration.write).not.toHaveBeenCalled();
    });
  });

  describe('catalog', () => {
    it('serves the catalog without caching', async () => {
      expect(await send('GET', `${ENDPOINT}/catalog?fresh`)).toMatchObject({
        status: 200,
        text: JSON.stringify(CATALOG),
        cacheControl: 'no-store',
      });
    });

    it.each([
      ['another site', { 'sec-fetch-site': 'cross-site' }],
      ['another origin', { origin: 'https://evil.example' }],
      ['a rebound host', { host: 'evil.example' }],
    ])('refuses %s', async (_description, headers) => {
      expect((await send('GET', `${ENDPOINT}/catalog`, { headers })).status).toBe(403);
      expect(integration.readCatalog).not.toHaveBeenCalled();
    });

    it('refuses other methods', async () => {
      expect((await send('POST', `${ENDPOINT}/catalog`)).status).toBe(405);
    });

    it('reports why the catalog cannot be read', async () => {
      vi.mocked(integration.readCatalog).mockRejectedValue(new Error('unsupported plugin'));

      expect(await send('GET', `${ENDPOINT}/catalog`)).toMatchObject({
        status: 500,
        text: '{"error":"unsupported plugin"}',
      });
    });
  });

  it('runs each request in the scope the integration creates', async () => {
    const paths = Array.from({ length: 30 }, (_, index) => `/page-${index}`);

    const responses = await Promise.all(paths.map((path) => send('GET', path)));

    expect(responses.map((response) => response.text)).toEqual(paths);
  });

  it('lets the integration resolve, load and transform virtual modules', async () => {
    expect((await vite.ssrLoadModule('virtual:messages')).title).toBe('instrumented');
    expect((await vite.transformRequest('virtual:messages'))?.code).toContain('instrumented');
  });

  it('stays out of production builds', async () => {
    const config = await resolveConfig({ root, configFile: false, plugins: [localiveVite({ integration })] }, 'build');

    expect(config.plugins.map((plugin) => plugin.name)).not.toContain('@localive/vite');
  });
});
