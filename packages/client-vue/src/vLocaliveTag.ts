import type { Directive, DirectiveBinding } from 'vue';

export const vLocaliveTag: Directive<HTMLElement> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    el.setAttribute('data-i18n-key', binding.value);
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string>) {
    el.setAttribute('data-i18n-key', binding.value);
  },
  unmounted(el: HTMLElement) {
    el.removeAttribute('data-i18n-key');
  },
};