import { createLocalive } from '@localive/core';
import { markerFor, tag, untag } from '../runtime/index.js';
import { createParaglideAdapter } from './paraglide-adapter.js';

const CATALOG = {
  baseLocale: 'en',
  locales: ['en', 'pl'],
  messages: {
    en: { title: 'Title', count: { 'plural=one': '1 item' }, only_en: 'English' },
    pl: { title: 'Tytuł' },
  },
  readOnly: ['legacy'],
};

describe('createParaglideAdapter', () => {
  const fetchMock = vi.fn();
  const reloadPage = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockImplementation(async () => new Response(JSON.stringify(CATALOG)));
    reloadPage.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    document.cookie = 'localive_edit=; path=/; max-age=0';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function create(endpoint?: string) {
    return createParaglideAdapter({ getLocale: () => 'en', endpoint, reloadPage });
  }

  it('loads the catalog from the endpoint', async () => {
    const adapter = await create('/custom');

    expect(fetchMock.mock.calls[0][0]).toBe('/custom/catalog');
    expect(adapter.getTranslations('pl')).toEqual({ title: 'Tytuł' });
    expect(adapter.isReadOnly('legacy')).toBe(true);
  });

  it('explains a catalog that cannot be loaded', async () => {
    fetchMock.mockResolvedValue(new Response('Host is not allowed', { status: 403 }));

    await expect(create()).rejects.toThrow(/HTTP 403 Host is not allowed/);
  });

  it('finds every marked message in an element and its attributes, once each', async () => {
    const adapter = await create();
    document.body.innerHTML = `
      <section>
        <h1>Title${markerFor('en', 'title')}</h1>
        <p>Tytuł${markerFor('pl', 'title')} <b>English${markerFor('pl', 'only_en')}</b></p>
        <input placeholder="Title${markerFor('en', 'title')}" aria-label="Items${markerFor('en', 'count')}">
        <span>Unmarked text${markerFor('en', 'unknown')}</span>
      </section>`;

    expect(adapter.getMessagesFromElement!(document.querySelector('section')!)).toEqual([
      { locale: 'en', key: 'title' },
      { locale: 'pl', key: 'title' },
      { locale: 'pl', key: 'only_en' },
      { locale: 'en', key: 'count' },
    ]);
  });

  it('reads the value of form fields', async () => {
    const adapter = await create();
    document.body.innerHTML = '<input>';
    const input = document.querySelector('input')!;
    input.value = `Typed${markerFor('en', 'title')}`;

    expect(adapter.getMessagesFromElement!(input)).toEqual([{ locale: 'en', key: 'title' }]);
  });

  it('switches edit mode with a cookie and a reload', async () => {
    const adapter = await create();

    adapter.setEditMode!(true);
    expect(adapter.isEditMode!()).toBe(true);
    adapter.setEditMode!(false);

    expect(adapter.isEditMode!()).toBe(false);
    expect(reloadPage).toHaveBeenCalledTimes(2);
  });

  it('previews whole messages but not single variants', async () => {
    const adapter = await create();
    document.cookie = 'localive_edit=1; path=/';
    const title = tag('title', () => 'Title', () => 'en');
    const count = tag('count', () => '1 item', () => 'en');

    adapter.preview!({ key: 'title', value: 'Draft', locale: 'en' });
    adapter.preview!({ key: 'count', value: 'Draft', locale: 'en', variant: 'plural=one' });
    const shown = [untag(title()), untag(count())];
    adapter.preview!(null);

    expect(shown).toEqual(['Draft', '1 item']);
    expect(untag(title())).toBe('Title');
  });

  it('works with createLocalive', async () => {
    const adapter = await create();
    document.cookie = 'localive_edit=1; path=/';
    document.body.innerHTML = `<h1>Title${markerFor('en', 'title')}</h1>`;
    fetchMock.mockResolvedValue(new Response('{"ok":true}'));

    const instance = createLocalive({ locales: ['en', 'pl'], adapter });
    await instance.saveTranslation({ key: 'count', value: 'One', locale: 'en', variant: 'plural=one' });

    expect(instance.isActive()).toBe(true);
    expect(instance.resolveMessages(document.querySelector('h1')!)).toEqual([{ locale: 'en', key: 'title' }]);
    expect(instance.getTranslations('en').count).toEqual({ 'plural=one': 'One' });
  });
});
