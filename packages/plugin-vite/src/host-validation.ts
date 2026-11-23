import { isIP } from 'node:net';
import type { ServerOptions } from 'vite';

/**
 * Applies the rule of Vite's own host check, which cannot be relied on: Vite 5 and 6 run it after
 * plugin middlewares, and versions before 5.4.12 and 6.0.9 have none.
 */
export function createHostValidator(options: ServerOptions): (host: string | undefined) => boolean {
  const { allowedHosts, https } = options;
  if (allowedHosts === true || https) return () => true;

  const allowedNames = [...(allowedHosts ?? []), ...configuredHostNames(options)];

  return (host) => {
    if (!host) return false;
    if (host.startsWith('[')) {
      const end = host.indexOf(']');
      return end > 0 && isIP(host.slice(1, end)) === 6;
    }

    const hostname = host.split(':')[0];
    if (isIP(hostname) === 4 || hostname === 'localhost' || hostname.endsWith('.localhost')) return true;

    return allowedNames.some(
      (allowed) =>
        allowed === hostname ||
        (allowed.startsWith('.') && (allowed.slice(1) === hostname || hostname.endsWith(allowed))),
    );
  };
}

function configuredHostNames({ host, hmr, origin }: ServerOptions): string[] {
  const names: string[] = [];
  if (typeof host === 'string' && host) names.push(host);
  if (typeof hmr === 'object' && hmr.host) names.push(hmr.host);
  if (origin && URL.canParse(origin)) names.push(new URL(origin).hostname);
  return names;
}
