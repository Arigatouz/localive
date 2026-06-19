import type { ValidationResult } from './types';

const LOCALE_REGEX = /^[a-zA-Z][a-zA-Z0-9-]*$/;

const DANGEROUS_KEY_SEGMENTS = ['__proto__', 'prototype', 'constructor'];

export function validateLocale(locale: string): ValidationResult {
  if (!locale || locale.length === 0) {
    return { valid: false, error: 'Locale cannot be empty' };
  }
  if (!LOCALE_REGEX.test(locale)) {
    return { valid: false, error: `Invalid locale format: "${locale}". Must match ${LOCALE_REGEX.source}` };
  }
  return { valid: true };
}

export function validateKey(key: string): ValidationResult {
  if (!key || key.length === 0) {
    return { valid: false, error: 'Key cannot be empty' };
  }

  const segments = key.split('.');
  for (const segment of segments) {
    if (DANGEROUS_KEY_SEGMENTS.includes(segment)) {
      return {
        valid: false,
        error: `Key contains dangerous segment "${segment}": "${key}"`,
      };
    }
  }

  return { valid: true };
}

export function validatePath(filePath: string, allowedRoots: string[]): ValidationResult {
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
    // If decoding fails, use as-is (might be a malicious input)
  }

  resolved = resolved.replace(/\/+/g, '/');

  const parts = resolved.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      if (stack.length > 0) {
        stack.pop();
      }
    } else if (part !== '.' && part !== '') {
      stack.push(part);
    }
  }

  return '/' + stack.join('/');
}

export function sanitizeValue(value: string): string {
  return value;
}