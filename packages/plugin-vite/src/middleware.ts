import type { IncomingMessage, ServerResponse } from 'node:http';
import { parse as parseUrl } from 'node:url';
import { writeTranslationToFile } from './file-writer';
import { sanitizeRequestBody } from './security';
import type { DevServerConfig } from './types';

const DEFAULT_ENDPOINT = '/__localive-update';

export function createMiddleware(config: DevServerConfig) {
  const endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
  const searchRoots = config.searchRoots ?? [config.translationsPath];
  const allRoots = [config.translationsPath, ...searchRoots.filter((r) => r !== config.translationsPath)];

  return async function localiveMiddleware(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const parsedUrl = parseUrl(req.url ?? '', true);

    if (parsedUrl.pathname !== endpoint) {
      return;
    }

    if (req.method === 'GET') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    // POST
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);

      const sanitized = sanitizeRequestBody(parsed);
      if (!sanitized.valid) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: sanitized.error }));
        return;
      }

      const entry = sanitized.entry;

      const result = writeTranslationToFile(entry, allRoots, config.translationsPath);

      if (result.success) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, filePath: result.filePath }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: result.error }));
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }));
    }
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}