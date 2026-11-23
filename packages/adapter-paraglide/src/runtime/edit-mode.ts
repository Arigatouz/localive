export const EDIT_COOKIE = 'localive_edit';

/** Global key of the server's AsyncLocalStorage, which holds whether the current request is in edit mode. */
export const REQUEST_SCOPE = Symbol.for('localive.paraglide.request');

interface RequestScope {
  getStore(): unknown;
}

export function hasEditCookie(cookieHeader: string | undefined): boolean {
  return new RegExp(`(?:^|;\\s*)${EDIT_COOKIE}=1(?:;|$)`).test(cookieHeader ?? '');
}

export function isEditing(): boolean {
  if (typeof document !== 'undefined') return hasEditCookie(document.cookie);

  const scope = (globalThis as { [REQUEST_SCOPE]?: RequestScope })[REQUEST_SCOPE];
  return scope?.getStore() === true;
}
