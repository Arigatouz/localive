import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMiddleware } from './middleware';

const ORIGINAL_CONTENT = '{\n  "title": "Original"\n}\n';
const JSON_HEADERS = { 'content-type': 'application/json' };

describe('createMiddleware', () => {
  let translationsPath: string;
  let localeFile: string;
  let server: Server;
  let host: string;

  beforeEach(async () => {
    translationsPath = mkdtempSync(join(tmpdir(), 'localive-middleware-'));
    localeFile = join(translationsPath, 'en.json');
    writeFileSync(localeFile, ORIGINAL_CONTENT);

    const middleware = createMiddleware({ translationsPath, locales: ['en'] });
    server = createServer((req, res) => void middleware(req, res));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    host = `127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    rmSync(translationsPath, { recursive: true, force: true });
  });

  function post(headers: Record<string, string>, chunks: Buffer[] = [saveBody('Updated')]): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      const outgoing = request(`http://${host}/__localive-update`, { method: 'POST', headers, agent: false }, (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      });
      outgoing.on('error', reject);

      const [first, ...rest] = chunks;
      outgoing.write(first);
      // The pause makes the server receive the chunks in separate data events.
      setTimeout(() => outgoing.end(Buffer.concat(rest)), 20);
    });
  }

  function saveBody(value: string): Buffer {
    return Buffer.from(JSON.stringify({ key: 'title', value, locale: 'en' }));
  }

  function savedTitle(): string {
    return JSON.parse(readFileSync(localeFile, 'utf-8')).title;
  }

  describe('request origin', () => {
    it.each([
      ['a cross-site request', { 'sec-fetch-site': 'cross-site', origin: 'https://evil.example' }],
      ['a same-site request from another port', { 'sec-fetch-site': 'same-site' }],
      ['a foreign origin without fetch metadata', { origin: 'https://evil.example' }],
      ['an opaque origin', { origin: 'null' }],
    ])('rejects %s', async (_description, headers) => {
      expect(await post({ ...JSON_HEADERS, ...headers })).toBe(403);
      expect(savedTitle()).toBe('Original');
    });

    it.each([
      ['fetch metadata marks it same-origin', () => ({ 'sec-fetch-site': 'same-origin' })],
      ['its origin matches the host', () => ({ origin: `http://${host}` })],
      ['a proxy rewrote the host', () => ({ 'sec-fetch-site': 'same-origin', origin: 'https://tunnel.example' })],
      ['it does not come from a browser', () => ({})],
    ])('saves when %s', async (_description, headers) => {
      expect(await post({ ...JSON_HEADERS, ...headers() })).toBe(200);
      expect(savedTitle()).toBe('Updated');
    });
  });

  describe('request body', () => {
    it('keeps a character that is split across chunks', async () => {
      const body = saveBody('żółw');
      const splitInsideFirstLetter = body.indexOf(Buffer.from('ż')) + 1;

      const status = await post(JSON_HEADERS, [body.subarray(0, splitInsideFirstLetter), body.subarray(splitInsideFirstLetter)]);

      expect(status).toBe(200);
      expect(savedTitle()).toBe('żółw');
    });

    it('rejects a body over 1 MB', async () => {
      expect(await post(JSON_HEADERS, [saveBody('x'.repeat(1024 * 1024))])).toBe(413);
      expect(savedTitle()).toBe('Original');
    });
  });

  describe('content type', () => {
    it.each(['text/plain', 'application/x-www-form-urlencoded', 'text/plain; application/json', ''])(
      'rejects "%s"',
      async (contentType) => {
        expect(await post({ 'content-type': contentType })).toBe(415);
        expect(savedTitle()).toBe('Original');
      },
    );

    it('accepts JSON with a charset', async () => {
      expect(await post({ 'content-type': 'Application/JSON; charset=utf-8' })).toBe(200);
    });
  });
});
