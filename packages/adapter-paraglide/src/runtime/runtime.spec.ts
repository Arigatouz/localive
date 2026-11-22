import { clearDrafts, findMarkedMessages, indexMarkers, markerFor, setDraft, tag, untag, useSubscriber } from './index.js';

const EDIT_COOKIE = 'localive_edit=1';

function plain(text: string) {
  return (_inputs?: Record<string, unknown>, _options?: { locale?: string }) => text;
}

function greeting(inputs: { name: string }, options?: { locale?: string }) {
  return options?.locale === 'pl' ? `Cześć ${inputs.name}` : `Hello ${inputs.name}`;
}

function setEditCookie(isEditing: boolean) {
  document.cookie = isEditing ? `${EDIT_COOKIE}; path=/` : 'localive_edit=; path=/; max-age=0';
}

describe('message markers', () => {
  it.each([
    ['en', 'title'],
    ['pl', 'nav.home'],
    ['zh-Hant-HK', '🍌 key'],
  ])('round-trips %s / %s through text', (locale, key) => {
    const text = `Before ${markerFor(locale, key)} after`;

    expect(findMarkedMessages(text, indexMarkers([{ locale, key }]))).toEqual([{ locale, key }]);
  });

  it('uses nine invisible characters outside the astral planes', () => {
    const marker = markerFor('en', 'title');

    expect(marker).toHaveLength(9);
    expect(marker).toMatch(/^͏[︀-️]{8}$/);
  });

  it('removes every marker with untag', () => {
    expect(untag(`Save${markerFor('en', 'a')}, ${markerFor('en', 'b')}now`)).toBe('Save, now');
  });

  it('ignores markers of unknown messages', () => {
    expect(findMarkedMessages(`x${markerFor('en', 'other')}`, indexMarkers([{ locale: 'en', key: 'title' }]))).toEqual([]);
  });
});

describe('tag', () => {
  afterEach(() => {
    setEditCookie(false);
    clearDrafts();
  });

  it('returns the message unchanged when edit mode is off', () => {
    expect(tag('title', plain('Title'), () => 'en')()).toBe('Title');
  });

  it('appends the marker of the key and current locale in edit mode', () => {
    setEditCookie(true);

    expect(tag('title', plain('Title'), () => 'pl')()).toBe(`Title${markerFor('pl', 'title')}`);
  });

  it('marks the locale passed in options', () => {
    setEditCookie(true);

    const text = tag('greet', greeting, () => 'en')({ name: 'Ola' }, { locale: 'pl' });

    expect(text).toBe(`Cześć Ola${markerFor('pl', 'greet')}`);
  });

  it.each([
    ['trailing spaces', 'Label: ', `Label:${markerFor('en', 'k')} `],
    ['a trailing newline', 'Line\n', `Line${markerFor('en', 'k')}\n`],
    ['an empty string', '', ''],
    ['only whitespace', '  ', '  '],
  ])('places the marker before %s', (_description, text, expected) => {
    setEditCookie(true);

    expect(tag('k', plain(text), () => 'en')()).toBe(expected);
  });

  it('marks each text part of a rich message', () => {
    setEditCookie(true);
    const parts = [
      { type: 'text', value: 'Read ' },
      { type: 'markup-start', name: 'strong' },
      { type: 'text', value: 'this' },
      { type: 'markup-end', name: 'strong' },
      { type: 'text', value: ' ' },
    ];
    const message = Object.assign(plain('Read this '), { parts: () => parts });
    const marker = markerFor('en', 'rich');

    expect(tag('rich', message, () => 'en').parts()).toEqual([
      { type: 'text', value: `Read${marker} ` },
      parts[1],
      { type: 'text', value: `this${marker}` },
      parts[3],
      { type: 'text', value: ' ' },
    ]);
  });

  it('keeps the properties Paraglide attaches to message functions', () => {
    const message = Object.assign(plain('Title'), { metadata: { inputs: [] } });

    expect(tag('title', message, () => 'en').metadata).toBe(message.metadata);
  });

  describe('drafts', () => {
    it('shows a draft with the inputs filled in, in edit mode only', () => {
      setDraft('en', 'greet', 'Hi {name}, \\{literal\\}');

      expect(tag('greet', greeting, () => 'en')({ name: 'Ola' })).toBe('Hello Ola');
      setEditCookie(true);
      expect(untag(tag('greet', greeting, () => 'en')({ name: 'Ola' }))).toBe('Hi Ola, {literal}');
    });

    it('leaves other locales and keys alone', () => {
      setEditCookie(true);
      setDraft('pl', 'greet', 'Draft');

      expect(untag(tag('greet', greeting, () => 'en')({ name: 'Ola' }))).toBe('Hello Ola');
    });

    it('notifies subscribers when drafts change', () => {
      setEditCookie(true);
      const update = vi.fn();
      useSubscriber((start) => {
        start(update);
        return () => {};
      });

      tag('title', plain('Title'), () => 'en')();
      setDraft('en', 'title', 'Draft');
      setDraft('en', 'title', null);
      clearDrafts();

      expect(update).toHaveBeenCalledTimes(3);
    });
  });
});
