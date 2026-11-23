import { AsyncLocalStorage } from 'node:async_hooks';
import type { IncomingMessage } from 'node:http';
import { hasEditCookie, REQUEST_SCOPE } from '../runtime/index.js';

const PAGE_DATA = /(?:\/|\.html)__data\.json$/;

function requestScope(): AsyncLocalStorage<boolean> {
  const holder = globalThis as { [REQUEST_SCOPE]?: AsyncLocalStorage<boolean> };
  return (holder[REQUEST_SCOPE] ??= new AsyncLocalStorage<boolean>());
}

/** Runs the rest of the request in edit mode when it renders a page or its data for someone with the edit cookie. */
export function handleRequestInScope<Result>(req: IncomingMessage, next: () => Result): Result {
  const path = (req.url ?? '').split('?')[0];
  const rendersPage = req.headers['sec-fetch-dest'] === 'document' || PAGE_DATA.test(path);
  const isEditing = req.method === 'GET' && rendersPage && hasEditCookie(req.headers.cookie);
  return requestScope().run(isEditing, next);
}
