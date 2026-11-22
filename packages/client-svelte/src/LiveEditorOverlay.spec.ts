import { createLocalive, type I18nAdapter, type MessageReference } from '@localive/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import LiveEditorOverlay from './LiveEditorOverlay.svelte';
import LocaliveEditor from './LocaliveEditor.svelte';

const DICTIONARIES: Record<string, Record<string, string | Record<string, string>>> = {
  en: { title: 'Title', subtitle: 'Subtitle', count: { 'plural=one': '1 item', 'plural=other': 'items' } },
  pl: { title: 'Tytuł' },
};

function createAdapter(overrides: Partial<I18nAdapter> = {}): I18nAdapter {
  let isEditing = true;
  return {
    name: 'test',
    getLocale: () => 'en',
    getTranslations: (locale) => DICTIONARIES[locale] ?? {},
    onLocaleChange: () => () => {},
    getMessagesFromElement: (element) =>
      [element, ...element.querySelectorAll('[data-messages]')]
        .flatMap((node) => (node.getAttribute('data-messages') ?? '').split('|'))
        .filter(Boolean)
        .map((reference): MessageReference => {
          const [locale, key] = reference.split(':');
          return { locale, key };
        }),
    isEditMode: () => isEditing,
    setEditMode: vi.fn((active: boolean) => {
      isEditing = active;
    }),
    preview: vi.fn(),
    ...overrides,
  };
}

function setup(adapter = createAdapter()) {
  const instance = createLocalive({ translationsPath: '', adapter, locales: ['en', 'pl'], defaultLocale: 'en' });
  render(LiveEditorOverlay, { props: { instance, locales: ['en', 'pl'] } });
  return { instance, adapter };
}

function fieldFor(name: RegExp) {
  return screen.getByRole('textbox', { name });
}

describe('LiveEditorOverlay', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <a id="link" href="/elsewhere" data-messages="pl:title"><span id="inside">Tytuł</span></a>
        <p id="both" data-messages="en:title|en:subtitle">Title Subtitle</p>
        <p id="plain">Unmarked</p>
        <p id="count" data-messages="en:count">2 items</p>
      </main>`;
    fetchMock.mockReset().mockImplementation(async () => new Response('{"ok":true}'));
    vi.stubGlobal('fetch', fetchMock);
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('offers the toggle while edit mode is off, and switches it on', async () => {
    const { adapter, instance } = setup(createAdapter({ isEditMode: () => false }));

    await fireEvent.click(screen.getByRole('button', { name: 'Edit translations' }));

    expect(instance.isActive()).toBe(true);
    expect(adapter.setEditMode).toHaveBeenCalledWith(true);
    expect(await screen.findByRole('button', { name: 'Done editing' })).toBeTruthy();
  });

  it('opens the clicked message instead of following the link, with the clicked locale first', async () => {
    setup();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    document.getElementById('inside')!.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    const fields = await screen.findAllByRole('textbox');
    expect(fields.map((field) => (field as HTMLTextAreaElement).value)).toEqual(['Tytuł', 'Title']);
    expect(document.activeElement).toBe(fields[0]);
  });

  it.each([
    ['an unmarked element', 'plain', {}],
    ['an Alt+click', 'both', { altKey: true }],
    ['a Ctrl+click, which opens links in a new tab', 'both', { ctrlKey: true }],
    ['a Cmd+click, which opens links in a new tab', 'both', { metaKey: true }],
  ])('lets %s through', async (_description, id, modifiers) => {
    setup();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, ...modifiers });

    document.getElementById(id)!.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks which message to edit when an element holds several', async () => {
    setup();

    await fireEvent.click(document.getElementById('both')!);
    await fireEvent.click(screen.getByRole('button', { name: /subtitle/ }));

    expect((fieldFor(/en/) as HTMLTextAreaElement).value).toBe('Subtitle');
  });

  it('previews whole messages while typing, not single variants', async () => {
    const { adapter } = setup();

    await fireEvent.click(document.getElementById('link')!);
    await fireEvent.input(fieldFor(/pl/), { target: { value: 'Nowy' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await fireEvent.click(document.getElementById('count')!);
    await fireEvent.input(fieldFor(/en plural=one/), { target: { value: 'One' } });

    expect(vi.mocked(adapter.preview!).mock.calls).toEqual([
      [{ key: 'title', value: 'Nowy', locale: 'pl' }],
      [null],
    ]);
  });

  it('saves on Enter against the value it started from, then against the saved value', async () => {
    setup();
    await fireEvent.click(document.getElementById('count')!);
    const field = fieldFor(/en plural=other/);

    await fireEvent.input(field, { target: { value: 'things' } });
    await fireEvent.keyDown(field, { key: 'Enter' });
    await screen.findByText('Saved');
    await fireEvent.input(field, { target: { value: 'stuff' } });
    await fireEvent.keyDown(field, { key: 'Enter' });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body))).toEqual([
      { key: 'count', value: 'things', locale: 'en', variant: 'plural=other', expected: 'items' },
      { key: 'count', value: 'stuff', locale: 'en', variant: 'plural=other', expected: 'things' },
    ]);
  });

  it('keeps Shift+Enter for new lines', async () => {
    setup();
    await fireEvent.click(document.getElementById('link')!);

    await fireEvent.keyDown(fieldFor(/pl/), { key: 'Enter', shiftKey: true });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('adds a missing translation and shows why a save failed', async () => {
    fetchMock.mockResolvedValue(new Response('{"error":"{user} is not an input of this message"}', { status: 400 }));
    setup();
    await fireEvent.click(document.getElementById('count')!);

    await fireEvent.input(fieldFor(/pl plural=one/), { target: { value: '{user}' } });
    await fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[2]);

    expect(await screen.findByText('HTTP 400: {user} is not an input of this message')).toBeTruthy();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ locale: 'pl', variant: 'plural=one', expected: null });
  });

  it('closes on Escape, clears drafts and returns focus', async () => {
    const { adapter } = setup();
    const before = document.createElement('button');
    document.body.append(before);
    before.focus();

    await fireEvent.click(document.getElementById('link')!);
    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(adapter.preview).toHaveBeenLastCalledWith(null);
    expect(document.activeElement).toBe(before);
  });

  it('lists the messages on the page', async () => {
    setup();

    await fireEvent.click(screen.getByRole('button', { name: 'Messages on this page' }));

    const items = screen.getAllByRole('button').filter((button) => button.closest('li'));
    expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['title pl', 'title en', 'subtitle en', 'count en']);
  });

  it('reopens the message that was open before the page reloaded', async () => {
    sessionStorage.setItem('localive:open-message', '{"key":"title","locale":"pl"}');

    setup();

    expect(await screen.findByRole('dialog', { name: 'Edit title' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(sessionStorage.getItem('localive:open-message')).toBeNull();
  });
});

describe('LocaliveEditor', () => {
  it('creates the instance from an async adapter after mounting', async () => {
    const adapter = createAdapter({ destroy: vi.fn() });

    const { unmount } = render(LocaliveEditor, { props: { createAdapter: async () => adapter, locales: ['en', 'pl'] } });

    expect(await screen.findByRole('button', { name: 'Done editing' })).toBeTruthy();
    unmount();
    expect(adapter.destroy).toHaveBeenCalled();
  });

  it('explains an adapter that cannot be created', async () => {
    render(LocaliveEditor, {
      props: {
        createAdapter: async () => {
          throw new Error('HTTP 403 Host is not allowed');
        },
        locales: ['en'],
      },
    });

    expect((await screen.findByRole('alert')).textContent).toContain('HTTP 403 Host is not allowed');
  });
});
