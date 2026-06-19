import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LocaliveProvider } from '@localive/react';
import { withI18next } from '@localive/adapter-i18next';
import { useLocaliveEditor } from '@localive/react';
import { useLocaliveTag } from '@localive/react';
import { LiveEditorOverlay } from '@localive/react';
import i18n from './i18n';

function LanguageSwitcher() {
  const { i18n: i18nInstance } = useTranslation();
  const [current, setCurrent] = useState(i18nInstance.language);

  const switchTo = (lng: string) => {
    i18nInstance.changeLanguage(lng);
    setCurrent(lng);
  };

  return (
    <nav>
      <button className={current === 'en' ? 'active' : ''} onClick={() => switchTo('en')}>English</button>
      <button className={current === 'fr' ? 'active' : ''} onClick={() => switchTo('fr')}>Français</button>
    </nav>
  );
}

function EditorToggle() {
  const { isActive, toggle } = useLocaliveEditor();
  return (
    <button onClick={toggle} style={{ marginLeft: '8px', backgroundColor: isActive ? '#ef4444' : '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}>
      {isActive ? '✕ Close Editor' : '✎ Open Editor'}
    </button>
  );
}

function TaggedText({ tKey, children }: { tKey: string; children: string }) {
  const { getTagProps } = useLocaliveTag();
  return <span {...getTagProps(tKey)}>{children}</span>;
}

function AppContent() {
  const { t } = useTranslation();

  return (
    <div>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1>{t('app.title')}</h1>
        <EditorToggle />
      </header>

      <p style={{ color: '#64748b', marginBottom: '16px' }}>
        <TaggedText tKey="app.subtitle">{t('app.subtitle')}</TaggedText>
      </p>

      <LanguageSwitcher />

      <div className="card" style={{ marginTop: '16px' }}>
        <h2>
          <TaggedText tKey="card.welcome">{t('card.welcome')}</TaggedText>
        </h2>
        <p>
          <TaggedText tKey="card.description">{t('card.description')}</TaggedText>
        </p>
      </div>

      <footer style={{ marginTop: '24px', color: '#94a3b8', fontSize: '14px' }}>
        <TaggedText tKey="footer.rights">{t('footer.rights')}</TaggedText>
      </footer>
    </div>
  );
}

export default function App() {
  const adapter = useMemo(() => withI18next(i18n), [i18n]);
  const locales = useMemo(() => ['en', 'fr'], []);

  return (
    <LocaliveProvider
      adapter={adapter}
      locales={locales}
      defaultLocale="en"
    >
      <AppContent />
      <LiveEditorOverlay />
    </LocaliveProvider>
  );
}
