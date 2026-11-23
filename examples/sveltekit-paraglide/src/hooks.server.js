import { paraglideMiddleware } from '#lib/paraglide/server.js';

export const handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ locale }) =>
    resolve(event, { transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale) }),
  );
