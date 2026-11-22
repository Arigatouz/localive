import type { IncomingMessage, ServerResponse } from 'node:http';
import { parse as parseUrl } from 'node:url';
import { writeTranslationToFile } from './file-writer';
import { isJsonRequest, isSameOriginRequest, sanitizeRequestBody } from './security';
import type { DevServerConfig } from './types';

const DEFAULT_ENDPOINT = '/__localive-update';
const MAX_BODY_BYTES = 1024 * 1024;

class BodyTooLargeError extends Error {}

/** @param onSaved Called with the endpoint path after each successful write, before the response is sent. */
export function createMiddleware(config: DevServerConfig, onSaved?: (path: string) => void) {
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

    if (!isSameOriginRequest(req.headers)) {
      respondWithError(res, 403, 'Cross-origin requests are not allowed');
      return;
    }

    if (!isJsonRequest(req.headers)) {
      respondWithError(res, 415, 'Content-Type must be application/json');
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
        onSaved?.(endpoint);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, filePath: result.filePath }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: result.error }));
      }
    } catch (error) {
      if (error instanceof BodyTooLargeError) {
        respondWithError(res, 413, `Request body exceeds ${MAX_BODY_BYTES} bytes`);
        return;
      }
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }));
    }
  };
}

function respondWithError(res: ServerResponse, status: number, error: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error }));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    req.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_BODY_BYTES) {
        chunks.length = 0;
        reject(new BodyTooLargeError());
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    req.on('error', reject);
  });
}