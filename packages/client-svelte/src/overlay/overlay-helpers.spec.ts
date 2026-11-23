import { buildMessageFields } from './message-fields.js';
import { findMarkedElement } from './find-marked-element.js';
import { recallOpenMessage, rememberOpenMessage } from './panel-memory.js';

describe('buildMessageFields', () => {
  const dictionaries: Record<string, Record<string, string | Record<string, string>>> = {
    en: { title: 'Title', count: { 'plural=one': '1 item', 'plural=other': 'items' } },
    pl: { title: 'Tytuł', count: { 'plural=one': '1 rzecz', 'plural=few': 'rzeczy' } },
    de: {},
  };
  const build = (key: string, firstLocale: string) => buildMessageFields(key, ['en', 'pl', 'de'], firstLocale, (locale) => dictionaries[locale]);

  it('puts the clicked locale first and marks missing translations', () => {
    expect(build('title', 'pl')).toEqual([
      { id: 'pl', locale: 'pl', original: 'Tytuł' },
      { id: 'en', locale: 'en', original: 'Title' },
      { id: 'de', locale: 'de', original: null },
    ]);
  });

  it('gives every locale every variant used anywhere', () => {
    const fields = build('count', 'en').map(({ locale, variant, original }) => `${locale} ${variant} ${original}`);

    expect(fields).toEqual([
      'en plural=one 1 item',
      'en plural=other items',
      'en plural=few null',
      'pl plural=one 1 rzecz',
      'pl plural=other null',
      'pl plural=few rzeczy',
      'de plural=one null',
      'de plural=other null',
      'de plural=few null',
    ]);
  });
});

describe('findMarkedElement', () => {
  // Like real adapters, an element renders the messages of its own attributes and of every descendant.
  const resolve = (element: Element) =>
    [element, ...element.querySelectorAll('[data-message]')]
      .map((node) => node.getAttribute('data-message'))
      .filter((key): key is string => Boolean(key))
      .map((key) => ({ key, locale: 'en' }));

  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <button data-message="save"><svg><path id="icon"></path></svg></button>
        <p id="both"><span data-message="a">A</span><span data-message="b">B</span></p>
        <section><p id="plain">Unmarked</p><p data-message="neighbour">Neighbour</p></section>
        <div data-localive-ui data-message="ui"><span id="ui">Panel</span></div>
      </main>`;
  });

  it('climbs from an unmarked child to the label of its parent', () => {
    expect(findMarkedElement(document.getElementById('icon'), resolve)).toMatchObject({
      element: { tagName: 'BUTTON' },
      messages: [{ key: 'save' }],
    });
  });

  it('returns every message of the element under the pointer', () => {
    expect(findMarkedElement(document.getElementById('both'), resolve)?.messages.map(({ key }) => key)).toEqual(['a', 'b']);
  });

  it.each([
    ['unmarked text whose neighbours are marked', 'plain'],
    ['Localive itself', 'ui'],
  ])('ignores %s', (_description, id) => {
    expect(findMarkedElement(document.getElementById(id), resolve)).toBeNull();
  });
});

describe('panel memory', () => {
  afterEach(() => sessionStorage.clear());

  it('remembers and forgets the open message', () => {
    rememberOpenMessage({ key: 'title', locale: 'pl' });
    expect(recallOpenMessage()).toEqual({ key: 'title', locale: 'pl' });

    rememberOpenMessage(null);
    expect(recallOpenMessage()).toBeNull();
  });

  it.each(['not json', '{"key":1}', 'null'])('ignores stored %s', (stored) => {
    sessionStorage.setItem('localive:open-message', stored);

    expect(recallOpenMessage()).toBeNull();
  });
});
