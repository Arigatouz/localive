import type { Locale, TranslationDictionary, I18nLiveStoreState } from './types';

export interface I18nLiveStoreConfig {
  locale: Locale;
  dictionaries: Map<Locale, TranslationDictionary>;
  active?: boolean;
}

type Subscriber = (state: I18nLiveStoreState) => void;

export class I18nLiveStore implements I18nLiveStoreState {
  private _locale: Locale;
  private _dictionaries: Map<Locale, TranslationDictionary>;
  private _active: boolean;
  private _subscribers: Set<Subscriber>;

  constructor(config: I18nLiveStoreConfig) {
    this._locale = config.locale;
    this._dictionaries = config.dictionaries;
    this._active = config.active ?? false;
    this._subscribers = new Set();
  }

  get locale(): Locale {
    return this._locale;
  }

  set locale(value: Locale) {
    if (this._locale === value) return;
    this._locale = value;
    this._notify();
  }

  get dictionaries(): Map<Locale, TranslationDictionary> {
    return this._dictionaries;
  }

  set dictionaries(value: Map<Locale, TranslationDictionary>) {
    this._dictionaries = value;
    this._notify();
  }

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    if (this._active === value) return;
    this._active = value;
    this._notify();
  }

  subscribe(callback: Subscriber): () => void {
    this._subscribers.add(callback);
    return () => {
      this._subscribers.delete(callback);
    };
  }

  getTranslation(key: string, locale: Locale): string | undefined {
    const dict = this._dictionaries.get(locale);
    if (!dict) return undefined;
    return dict[key] as string | undefined;
  }

  private _notify(): void {
    const state: I18nLiveStoreState = {
      locale: this._locale,
      active: this._active,
      dictionaries: this._dictionaries,
    };
    for (const cb of this._subscribers) {
      cb(state);
    }
  }
}