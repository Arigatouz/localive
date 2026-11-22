import type { IncomingMessage, ServerResponse } from 'node:http';
import { parse as parseUrl } from 'node:url';
import { writeTranslationToFile } from './file-writer';
import type { IntegrationServerConfig, LocaliveIntegration } from './integration';
import { isJsonRequest, isSameOriginRequest, requestHost, sanitizeRequestBody } from './security';
import type { DevServerConfig, SaveResult, TranslationEntry } from './types';

export type LocaliveServerConfig = (DevServerConfig & { integration?: undefined }) | IntegrationServerConfig;

const DEFAULT_ENDPOINT = '/__localive-update';
const MAX_BODY_BYTES = 1024 * 1024;

class BodyTooLargeError extends Error {}

export interface MiddlewareHooks {
  /** Required unless the dev server validates the Host header before running this middleware. */
  isAllowedHost?: (host: string | undefined) => boolean;
  /** Called with the endpoint path after each successful write, before the response is sent. */
  onSaved?: (path: string) => void;
}

export function createMiddleware(config: LocaliveServerConfig, { isAllowedHost, onSaved }: MiddlewareHooks = {}) {
  const endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
  const { integration } = config;
  const writeEntry = createEntryWriter(config);

  return async function localiveMiddleware(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const parsedUrl = parseUrl(req.url ?? '', true);

    const catalogIntegration = parsedUrl.pathname === `${endpoint}/catalog` ? integration : undefined;
    if (parsedUrl.pathname !== endpoint && !catalogIntegration) {
      return;
    }

    if (isAllowedHost && !isAllowedHost(requestHost(req.headers))) {
      respondWithError(res, 403, 'Host is not allowed; add it to server.allowedHosts');
      return;
    }

    if (catalogIntegration) {
      await respondWithCatalog(req, res, catalogIntegration);
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

      const result = await writeEntry(entry);

      if (result.success) {
        onSaved?.(endpoint);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, filePath: result.filePath }));
      } else {
        res.writeHead(result.conflict ? 409 : 400, { 'Content-Type': 'application/json' });
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

function createEntryWriter(config: LocaliveServerConfig): (entry: TranslationEntry) => SaveResult | Promise<SaveResult> {
  if (config.integration) {
    const { integration } = config;
    return (entry) => integration.write(entry);
  }

  const { translationsPath, searchRoots = [] } = config;
  const roots = [translationsPath, ...searchRoots.filter((root) => root !== translationsPath)];
  return (entry) => writeTranslationToFile(entry, roots, translationsPath);
}

async function respondWithCatalog(req: IncomingMessage, res: ServerResponse, integration: LocaliveIntegration): Promise<void> {
  if (req.method !== 'GET') {
    respondWithError(res, 405, 'Method not allowed. Use GET.');
    return;
  }
  if (!isSameOriginRequest(req.headers)) {
    respondWithError(res, 403, 'Cross-origin requests are not allowed');
    return;
  }

  try {
    const catalog = JSON.stringify(await integration.readCatalog());
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(catalog);
  } catch (error) {
    respondWithError(res, 500, error instanceof Error ? error.message : 'Cannot read the catalog');
  }
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