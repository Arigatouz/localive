import { markerFor } from '../runtime/index.js';
import { stripMarkersFromCopiesAndForms } from './strip-markers.js';

const MARKED = `Title${markerFor('en', 'title')}`;

describe('stripMarkersFromCopiesAndForms', () => {
  let stop: () => void;

  beforeEach(() => {
    document.body.innerHTML = `<p id="text">${MARKED}</p><input id="field" value="${MARKED}">`;
    stop = stripMarkersFromCopiesAndForms();
  });

  afterEach(() => {
    stop();
  });

  function copy(target: Element): { event: Event; copied: string | undefined } {
    let copied: string | undefined;
    const event = new Event('copy', { bubbles: true, cancelable: true });
    Object.assign(event, { clipboardData: { setData: (_type: string, text: string) => (copied = text) } });
    target.dispatchEvent(event);
    return { event, copied };
  }

  it('copies selected page text without markers', () => {
    document.getSelection()!.selectAllChildren(document.getElementById('text')!);

    const { event, copied } = copy(document.getElementById('text')!);

    expect(copied).toBe('Title');
    expect(event.defaultPrevented).toBe(true);
  });

  it('copies the selected part of a form field without markers', () => {
    const field = document.getElementById('field') as HTMLInputElement;
    field.setSelectionRange(0, field.value.length);

    expect(copy(field).copied).toBe('Title');
  });

  it('leaves copies of unmarked text to the browser', () => {
    document.body.innerHTML = '<p id="plain">Plain</p>';
    document.getSelection()!.selectAllChildren(document.getElementById('plain')!);

    const { event, copied } = copy(document.getElementById('plain')!);

    expect(copied).toBeUndefined();
    expect(event.defaultPrevented).toBe(false);
  });

  it('submits form values without markers, keeping order, repeated names and files', () => {
    const file = new File(['x'], 'photo.png');
    const formData = new FormData();
    formData.append('title', MARKED);
    formData.append('tag', `a${markerFor('en', 'a')}`);
    formData.append('photo', file);
    formData.append('tag', 'b');
    const event = Object.assign(new Event('formdata'), { formData });

    document.getElementById('field')!.dispatchEvent(event);

    expect([...formData].map(([name, value]) => [name, typeof value === 'string' ? value : value.name])).toEqual([
      ['title', 'Title'],
      ['tag', 'a'],
      ['photo', 'photo.png'],
      ['tag', 'b'],
    ]);
  });

  it('stops when asked', () => {
    stop();
    document.getSelection()!.selectAllChildren(document.getElementById('text')!);

    expect(copy(document.getElementById('text')!).copied).toBeUndefined();
  });
});
