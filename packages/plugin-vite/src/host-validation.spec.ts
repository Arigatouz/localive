import type { ServerOptions } from 'vite';
import { createHostValidator } from './host-validation';

describe('createHostValidator', () => {
  it.each([
    'localhost:5173',
    'app.localhost',
    '127.0.0.1:5173',
    '192.168.1.20',
    '[::1]:5173',
  ])('allows %s, which cannot be rebound', (host) => {
    expect(createHostValidator({})(host)).toBe(true);
  });

  it.each([
    'evil.example',
    'evil.example:5173',
    'localhost.evil.example',
    '127.0.0.1.evil.example',
    '[evil.example]',
    '[::1',
    '',
    undefined,
  ])('refuses %s', (host) => {
    expect(createHostValidator({})(host)).toBe(false);
  });

  it.each<[string, ServerOptions, string]>([
    ['an allowed host', { allowedHosts: ['dev.test'] }, 'dev.test:5173'],
    ['an allowed parent domain', { allowedHosts: ['.dev.test'] }, 'app.dev.test'],
    ['the domain of an allowed parent', { allowedHosts: ['.dev.test'] }, 'dev.test'],
    ['the server host', { host: 'dev.test' }, 'dev.test'],
    ['the HMR host', { hmr: { host: 'dev.test' } }, 'dev.test'],
    ['the server origin', { origin: 'https://dev.test:8443' }, 'dev.test'],
    ['any host when all are allowed', { allowedHosts: true }, 'evil.example'],
    ['any host over HTTPS, where certificates prevent rebinding', { https: {} }, 'evil.example'],
  ])('allows %s', (_description, options, host) => {
    expect(createHostValidator(options)(host)).toBe(true);
  });

  it('refuses a lookalike of an allowed parent domain', () => {
    expect(createHostValidator({ allowedHosts: ['.dev.test'] })('evildev.test')).toBe(false);
  });
});
