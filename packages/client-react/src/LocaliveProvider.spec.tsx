import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LocaliveProvider } from './LocaliveProvider';
import { useLocaliveEditor } from './useLocaliveEditor';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

function createTestAdapter(overrides?: Partial<I18nAdapter>): I18nAdapter {
  const translations: Record<Locale, TranslationDictionary> = {
    en: {
      'common.greeting': 'Hello',
      'common.farewell': 'Goodbye',
      'home.title': 'Welcome Home',
    },
    fr: {
      'common.greeting': 'Bonjour',
      'common.farewell': 'Au revoir',
      'home.title': 'Bienvenue',
    },
  };

  let currentLocale: Locale = 'en';
  const callbacks: Array<(locale: Locale) => void> = [];

  return {
    name: overrides?.name ?? 'test-adapter',
    getLocale: () => currentLocale,
    getTranslations: (locale: Locale) => translations[locale] ?? {},
    onLocaleChange: (cb: (locale: Locale) => void) => {
      callbacks.push(cb);
      return () => {
        const idx = callbacks.indexOf(cb);
        if (idx > -1) callbacks.splice(idx, 1);
      };
    },
    destroy: () => {
      callbacks.length = 0;
    },
    ...overrides,
  };
}

function TestChild() {
  const { isActive, activate, deactivate } = useLocaliveEditor();
  return (
    <div data-testid="test-child">
      <span data-testid="is-active">{isActive ? 'active' : 'inactive'}</span>
      <button data-testid="activate-btn" onClick={activate}>Activate</button>
      <button data-testid="deactivate-btn" onClick={deactivate}>Deactivate</button>
    </div>
  );
}

describe('LocaliveProvider', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders children inside provider', () => {
    const adapter = createTestAdapter();
    render(
      <LocaliveProvider
        adapter={adapter}
        locales={['en', 'fr']}
        defaultLocale="en"
      >
        <div data-testid="child">Hello</div>
      </LocaliveProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child').textContent).toBe('Hello');
  });

  it('creates a localive instance on mount', () => {
    const adapter = createTestAdapter();
    render(
      <LocaliveProvider
        adapter={adapter}
        locales={['en', 'fr']}
        defaultLocale="en"
      >
        <TestChild />
      </LocaliveProvider>
    );

    expect(screen.getByTestId('is-active').textContent).toBe('inactive');
  });

  it('activates localive when calling activate()', () => {
    const adapter = createTestAdapter();
    render(
      <LocaliveProvider
        adapter={adapter}
        locales={['en', 'fr']}
        defaultLocale="en"
      >
        <TestChild />
      </LocaliveProvider>
    );

    expect(screen.getByTestId('is-active').textContent).toBe('inactive');

    act(() => {
      screen.getByTestId('activate-btn').click();
    });

    expect(screen.getByTestId('is-active').textContent).toBe('active');
  });

  it('deactivates localive when calling deactivate()', () => {
    const adapter = createTestAdapter();
    render(
      <LocaliveProvider
        adapter={adapter}
        locales={['en', 'fr']}
        defaultLocale="en"
      >
        <TestChild />
      </LocaliveProvider>
    );

    act(() => {
      screen.getByTestId('activate-btn').click();
    });
    expect(screen.getByTestId('is-active').textContent).toBe('active');

    act(() => {
      screen.getByTestId('deactivate-btn').click();
    });
    expect(screen.getByTestId('is-active').textContent).toBe('inactive');
  });

  it('passes adapter to core', () => {
    const adapter = createTestAdapter();
    const { rerender } = render(
      <LocaliveProvider
        adapter={adapter}
        locales={['en', 'fr']}
        defaultLocale="en"
      >
        <div>Test</div>
      </LocaliveProvider>
    );

    // Provider should not throw when mounting
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('throws if locales is empty', () => {
    const adapter = createTestAdapter();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <LocaliveProvider
          adapter={adapter}
          locales={[]}
          defaultLocale="en"
        >
          <div>Test</div>
        </LocaliveProvider>
      );
    }).toThrow();

    consoleError.mockRestore();
  });

  it('cleans up on unmount', () => {
    const adapter = createTestAdapter();
    const destroySpy = vi.spyOn(adapter, 'destroy');

    const { unmount } = render(
      <LocaliveProvider
        adapter={adapter}
        locales={['en', 'fr']}
        defaultLocale="en"
      >
        <div>Test</div>
      </LocaliveProvider>
    );

    unmount();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('supports activeByDefault option', () => {
    const adapter = createTestAdapter();
    render(
      <LocaliveProvider
        adapter={adapter}
        locales={['en', 'fr']}
        defaultLocale="en"
        activeByDefault
      >
        <TestChild />
      </LocaliveProvider>
    );

    expect(screen.getByTestId('is-active').textContent).toBe('active');
  });

  it('registers plugins via plugins prop', () => {
    const adapter = createTestAdapter();
    const mockPlugin = {
      name: 'test-plugin',
      beforeSave: vi.fn((entry: any) => entry),
    };

    render(
      <LocaliveProvider
        adapter={adapter}
        locales={['en', 'fr']}
        defaultLocale="en"
        plugins={[mockPlugin]}
      >
        <TestChild />
      </LocaliveProvider>
    );

    // Provider should mount without error
    expect(screen.getByTestId('is-active')).toBeInTheDocument();
  });
});