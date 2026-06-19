import { describe, it, expect } from 'vitest';
import { createApp, nextTick } from 'vue';
import { vLocaliveTag } from './vLocaliveTag';

describe('vLocaliveTag', () => {
  it('sets data-i18n-key attribute on mounted element', async () => {
    const app = createApp({
      template: '<span v-localive-tag="\'common.greeting\'">Hello</span>',
    });
    app.directive('localive-tag', vLocaliveTag);

    const div = document.createElement('div');
    document.body.appendChild(div);
    app.mount(div);

    await nextTick();

    const span = div.querySelector('span');
    expect(span?.getAttribute('data-i18n-key')).toBe('common.greeting');

    app.unmount();
    div.remove();
  });

  it('updates data-i18n-key when binding value changes', async () => {
    const app = createApp({
      data() {
        return { key: 'common.greeting' };
      },
      template: '<span v-localive-tag="key">Hello</span>',
    });
    app.directive('localive-tag', vLocaliveTag);

    const div = document.createElement('div');
    document.body.appendChild(div);
    app.mount(div);

    await nextTick();

    const span = div.querySelector('span');
    expect(span?.getAttribute('data-i18n-key')).toBe('common.greeting');

    app.unmount();
    div.remove();
  });

  it('removes data-i18n-key attribute on unmount', async () => {
    const app = createApp({
      template: '<span v-localive-tag="\'common.greeting\'">Hello</span>',
    });
    app.directive('localive-tag', vLocaliveTag);

    const div = document.createElement('div');
    document.body.appendChild(div);
    app.mount(div);

    await nextTick();

    const span = div.querySelector('span');
    expect(span?.getAttribute('data-i18n-key')).toBe('common.greeting');

    app.unmount();
    expect(div.querySelector('span')).toBeNull();

    div.remove();
  });

  it('sets different keys correctly', async () => {
    const app = createApp({
      template: '<span v-localive-tag="\'home.title\'">Welcome</span>',
    });
    app.directive('localive-tag', vLocaliveTag);

    const div = document.createElement('div');
    document.body.appendChild(div);
    app.mount(div);

    await nextTick();

    const span = div.querySelector('span');
    expect(span?.getAttribute('data-i18n-key')).toBe('home.title');

    app.unmount();
    div.remove();
  });
});