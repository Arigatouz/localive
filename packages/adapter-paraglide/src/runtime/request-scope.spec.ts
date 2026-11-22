// @vitest-environment node
import { AsyncLocalStorage } from 'node:async_hooks';
import { markerFor, REQUEST_SCOPE, tag } from './index';

describe('tag on the server', () => {
  const message = () => 'Title';
  const scope = new AsyncLocalStorage<boolean>();

  beforeAll(() => {
    Object.assign(globalThis, { [REQUEST_SCOPE]: scope });
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, REQUEST_SCOPE);
  });

  it('marks only inside a request that is in edit mode', async () => {
    const tagged = tag('title', message, () => 'en');

    const [editing, viewing] = await Promise.all([
      scope.run(true, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return tagged();
      }),
      scope.run(false, async () => tagged()),
    ]);

    expect([editing, viewing, tagged()]).toEqual([`Title${markerFor('en', 'title')}`, 'Title', 'Title']);
  });
});
