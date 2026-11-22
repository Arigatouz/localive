import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import { localiveVite } from './plugin';

const ORIGINAL_CONTENT = '{"title":"Original"}';

describe('localiveVite', () => {
  let root: string;
  let localeFile: string;
  let vite: ViteDevServer;
  let server: Server;
  let port: number;

  beforeEach(async () => {
    root = mkdtempSync(join(tmpdir(), 'localive-plugin-'));
    localeFile = join(root, 'en.json');
    writeFileSync(localeFile, ORIGINAL_CONTENT);

    vite = await createViteServer({
      root,
      configFile: false,
      logLevel: 'silent',
      appType: 'custom',
      cacheDir: join(root, '.vite'),
      optimizeDeps: { noDiscovery: true },
      server: { middlewareMode: true, hmr: false, ws: false, watch: null, allowedHosts: ['dev.test'] },
      plugins: [localiveVite({ translationsPath: root, locales: ['en'] })],
    });
    vi.spyOn(vite.ws, 'send');

    server = createServer((req, res) => vite.middlewares(req, res, () => res.end('page')));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    await vite.close();
    rmSync(root, { recursive: true, force: true });
  });

  function send(method: string, path: string, body?: object, host = `127.0.0.1:${port}`): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      const headers = { host, origin: `http://${host}`, 'content-type': 'application/json' };
      const outgoing = request({ host: '127.0.0.1', port, method, path, headers, agent: false }, (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      });
      outgoing.on('error', reject);
      outgoing.end(body && JSON.stringify(body));
    });
  }

  const entry = { key: 'title', value: 'Updated', locale: 'en' };

  it('refuses a rebound host, even though Vite 5 and 6 validate hosts after plugin middlewares', async () => {
    expect(await send('POST', '/__localive-update', entry, 'evil.example')).toBe(403);
    expect(readFileSync(localeFile, 'utf-8')).toBe(ORIGINAL_CONTENT);
  });

  it('saves from a host in server.allowedHosts', async () => {
    expect(await send('POST', '/__localive-update', entry, 'dev.test')).toBe(200);
  });

  it('broadcasts once after a save', async () => {
    await send('POST', '/__localive-update', entry);

    expect(vite.ws.send).toHaveBeenCalledExactlyOnceWith('localive:update', { path: '/__localive-update' });
  });

  it('does not broadcast a rejected save', async () => {
    await send('POST', '/__localive-update', { key: 'title' });

    expect(vite.ws.send).not.toHaveBeenCalled();
  });

  it('does not broadcast other successful requests', async () => {
    expect(await send('GET', '/any-page')).toBe(200);

    expect(vite.ws.send).not.toHaveBeenCalled();
  });
});
