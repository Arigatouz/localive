import type { IncomingHttpHeaders } from 'node:http';
import type { TranslationEntry, SanitizationResult } from './types';

const LOCALE_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

const DANGEROUS_KEY_SEGMENTS = ['__proto__', 'prototype', 'constructor'];

export function validateLocale(locale: string): { valid: boolean; error?: string } {
  if (!locale || locale.length === 0) {
    return { valid: false, error: 'Locale cannot be empty' };
  }
  if (!LOCALE_REGEX.test(locale)) {
    return { valid: false, error: `Invalid locale format: "${locale}"` };
  }
  return { valid: true };
}

export function validateKey(key: string): { valid: boolean; error?: string } {
  if (!key || key.length === 0) {
    return { valid: false, error: 'Key cannot be empty' };
  }
  const segments = key.split('.');
  for (const segment of segments) {
    if (DANGEROUS_KEY_SEGMENTS.includes(segment)) {
      return { valid: false, error: `Key contains dangerous segment "${segment}": "${key}"` };
    }
  }
  return { valid: true };
}

export function validatePath(filePath: string, allowedRoots: string[]): { valid: boolean; error?: string } {
  const resolved = resolvePath(filePath);

  for (const root of allowedRoots) {
    const normalizedRoot = resolvePath(root);
    if (resolved.startsWith(normalizedRoot + '/') || resolved === normalizedRoot) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    error: `Path "${filePath}" is outside allowed roots: ${allowedRoots.join(', ')}`,
  };
}

function resolvePath(p: string): string {
  let resolved = p.replace(/\\/g, '/');
  try {
    resolved = decodeURIComponent(resolved);
  } catch {
    // If decoding fails, use as-is
  }
  resolved = resolved.replace(/\/+/g, '/');
  const parts = resolved.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else if (part !== '.' && part !== '') {
      stack.push(part);
    }
  }
  return '/' + stack.join('/');
}

/**
 * Whether the request comes from the dev server's own pages or from a non-browser client.
 * Relies on the dev server having validated the Host header, which is what stops DNS rebinding.
 */
export function isSameOriginRequest(headers: IncomingHttpHeaders): boolean {
  const fetchSite = headers['sec-fetch-site'];
  if (fetchSite) return fetchSite === 'same-origin';

  const { origin } = headers;
  if (!origin) return true;

  const host = headers.host ?? headers[':authority'];
  return URL.canParse(origin) && new URL(origin).host === host;
}

export function isJsonRequest(headers: IncomingHttpHeaders): boolean {
  const mediaType = headers['content-type']?.split(';')[0].trim().toLowerCase();
  return mediaType === 'application/json';
}

export function sanitizeRequestBody(body: unknown): SanitizationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const record = body as Record<string, unknown>;

  if (typeof record.key !== 'string' || typeof record.value !== 'string' || typeof record.locale !== 'string') {
    return { valid: false, error: 'Missing required fields: key, value, locale (must be strings)' };
  }

  const localeValidation = validateLocale(record.locale);
  if (!localeValidation.valid) {
    return { valid: false, error: localeValidation.error! };
  }

  const keyValidation = validateKey(record.key);
  if (!keyValidation.valid) {
    return { valid: false, error: keyValidation.error! };
  }

  const entry: TranslationEntry = {
    key: record.key,
    value: record.value,
    locale: record.locale,
  };

  if (record.namespace && typeof record.namespace === 'string') {
    entry.namespace = record.namespace;
  }

  return { valid: true, entry };
}