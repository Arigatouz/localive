import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Connect, ViteDevServer } from 'vite';
import { localiveVite } from './plugin';

describe('localiveVite', () => {
  let translationsPath: string;
  let server: Server;
  let baseUrl: string;
  const send = vi.fn();

  beforeEach(async () => {
    translationsPath = mkdtempSync(join(tmpdir(), 'localive-plugin-'));
    writeFileSync(join(translationsPath, 'en.json'), '{"title":"Original"}');
    send.mockReset();

    const handlers: Connect.NextHandleFunction[] = [];
    const viteServer = {
      middlewares: { use: (handler: Connect.NextHandleFunction) => handlers.push(handler) },
      ws: { send, on: vi.fn() },
    } as unknown as ViteDevServer;
    const { configureServer } = localiveVite({ translationsPath, locales: ['en'] });
    (configureServer as (devServer: ViteDevServer) => void)(viteServer);

    server = createServer((req, res) => {
      const runFrom = (index: number): void => {
        const handler = handlers[index];
        if (handler) handler(req, res, () => runFrom(index + 1));
        else res.end('page');
      };
      runFrom(0);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    rmSync(translationsPath, { recursive: true, force: true });
  });

  async function save(body: object): Promise<void> {
    await fetch(`${baseUrl}/__localive-update`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('broadcasts once after a save', async () => {
    await save({ key: 'title', value: 'Updated', locale: 'en' });

    expect(send).toHaveBeenCalledExactlyOnceWith('localive:update', { path: '/__localive-update' });
  });

  it('does not broadcast a rejected save', async () => {
    await save({ key: 'title' });

    expect(send).not.toHaveBeenCalled();
  });

  it('does not broadcast other successful requests', async () => {
    await fetch(`${baseUrl}/any-page`);

    expect(send).not.toHaveBeenCalled();
  });
});
