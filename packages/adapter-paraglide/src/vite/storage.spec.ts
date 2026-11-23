// @vitest-environment node
import { compile } from '@inlang/paraglide-js';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readCatalog } from './catalog.js';
import { writeEntry } from './write-entry.js';

const require = createRequire(import.meta.url);
const PLURAL = { declarations: ['input count', 'local plural = count: plural'], selectors: ['plural'] };
const EN = `{\r\n\t"$schema": "https://inlang.com/schema/inlang-message-format",\r\n\t"title": "Title",\r\n\t"greet": "Hello {name}",\r\n\t"nav": {\r\n\t\t"home": "Home"\r\n\t},\r\n\t"flat.key": "Flat",\r\n\t"count": [{ "declarations": ["input count", "local plural = count: plural"], "selectors": ["plural"], "match": { "plural=one": "{count} item", "plural=other": "{count} items" } }],\r\n\t"rich": "Read {#strong}this{/strong}",\r\n\t"legacy": [{ "unknown": true }, "second"]\r\n}\r\n`;
const PL = '{\n  "title": "Tytuł",\n  "greet": "Cześć {name}",\n  "count": [{ "declarations": ["input count", "local plural = count: plural"], "selectors": ["plural"], "match": { "plural=one": "{count} rzecz" } }]\n}\n';
const SHOP_EN = '{\n  "title": "Shop title",\n  "cart": "Cart"\n}\n';

describe('Paraglide message storage', () => {
  let root: string;
  let project: string;

  function file(path: string): string {
    return readFileSync(join(root, path), 'utf-8');
  }

  function save(entry: Record<string, unknown>) {
    return writeEntry(project, { key: 'title', value: 'New', locale: 'en', ...entry });
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'localive-storage-'));
    project = join(root, 'project.inlang');
    mkdirSync(project);
    mkdirSync(join(root, 'messages'));
    mkdirSync(join(root, 'shop'));
    copyFileSync(require.resolve('@inlang/plugin-message-format'), join(root, 'message-format.js'));
    writeFileSync(
      join(project, 'settings.json'),
      JSON.stringify({
        baseLocale: 'en',
        locales: ['en', 'pl', 'de'],
        modules: ['./message-format.js'],
        'plugin.inlang.messageFormat': { pathPattern: ['./messages/{locale}.json', './shop/{languageTag}.json'] },
      }),
    );
    writeFileSync(join(root, 'messages/en.json'), EN);
    writeFileSync(join(root, 'messages/pl.json'), PL);
    writeFileSync(join(root, 'shop/en.json'), SHOP_EN);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  describe('readCatalog', () => {
    it('reads every locale the way Paraglide merges them', () => {
      const catalog = readCatalog(project);

      expect(catalog.baseLocale).toBe('en');
      expect(catalog.locales).toEqual(['en', 'pl', 'de']);
      expect(catalog.messages.en).toMatchObject({
        title: 'Shop title',
        'nav.home': 'Home',
        'flat.key': 'Flat',
        cart: 'Cart',
        count: { 'plural=one': '{count} item', 'plural=other': '{count} items' },
      });
      expect(catalog.messages.en).not.toHaveProperty('$schema');
      expect(catalog.messages.pl).toEqual({ title: 'Tytuł', greet: 'Cześć {name}', count: { 'plural=one': '{count} rzecz' } });
      expect(catalog.messages.de).toEqual({});
      expect(catalog.readOnly).toEqual(['legacy']);
    });

    it.each([
      ['another storage plugin', { modules: ['./i18next.js'], 'plugin.inlang.i18next': { pathPattern: './{locale}.json' } }, /plugin-message-format/],
      ['no path pattern', { modules: ['./message-format.js'], 'plugin.inlang.messageFormat': {} }, /pathPattern/],
    ])('explains a project with %s', (_description, settings, message) => {
      writeFileSync(join(project, 'settings.json'), JSON.stringify({ baseLocale: 'en', locales: ['en'], ...settings }));

      expect(() => readCatalog(project)).toThrow(message);
    });
  });

  describe('writeEntry', () => {
    it('changes only the value, keeping tabs, CRLF and every other byte', () => {
      expect(save({ key: 'greet', value: 'Hi {name}' })).toMatchObject({ success: true });
      expect(file('messages/en.json')).toBe(EN.replace('"Hello {name}"', '"Hi {name}"'));
    });

    it.each([
      ['a nested key', 'nav.home', '"home": "Home"', '"home": "Start"'],
      ['a flat dotted key', 'flat.key', '"flat.key": "Flat"', '"flat.key": "Start"'],
    ])('writes %s where it is stored', (_description, key, before, after) => {
      expect(save({ key, value: 'Start' }).success).toBe(true);
      expect(file('messages/en.json')).toBe(EN.replace(before, after));
    });

    it('writes to the last file with the key, which is the one Paraglide uses', () => {
      expect(save({ value: 'Store' }).success).toBe(true);
      expect(file('shop/en.json')).toBe(SHOP_EN.replace('Shop title', 'Store'));
      expect(file('messages/en.json')).toBe(EN);
    });

    it('edits one variant in place', () => {
      expect(save({ key: 'count', variant: 'plural=other', value: '{count} things' }).success).toBe(true);
      expect(file('messages/en.json')).toBe(EN.replace('"{count} items"', '"{count} things"'));
    });

    it('adds a variant a locale needs', () => {
      expect(save({ key: 'count', locale: 'pl', variant: 'plural=few', value: '{count} rzeczy' }).success).toBe(true);
      expect(JSON.parse(file('messages/pl.json')).count[0].match).toEqual({ 'plural=one': '{count} rzecz', 'plural=few': '{count} rzeczy' });
    });

    it('adds a missing translation in the base locale nesting, creating the file with its formatting', () => {
      expect(save({ key: 'nav.home', locale: 'de', value: 'Startseite', expected: null }).success).toBe(true);
      expect(file('messages/de.json')).toBe('{\r\n\t"nav": {\r\n\t\t"home": "Startseite"\r\n\t}\r\n}\r\n');
    });

    it('adds a missing variant with the declarations of the base locale', () => {
      expect(save({ key: 'count', locale: 'de', variant: 'plural=one', value: '{count} Ding' }).success).toBe(true);
      expect(JSON.parse(file('messages/de.json')).count).toEqual([{ ...PLURAL, match: { 'plural=one': '{count} Ding' } }]);
    });

    it.each([
      ['a changed value', { expected: 'Old title' }],
      ['a translation added meanwhile', { locale: 'pl', expected: null }],
      ['a value removed meanwhile', { locale: 'de', key: 'greet', expected: 'Hallo {name}' }],
      ['a changed variant', { key: 'count', variant: 'plural=one', expected: '1 item' }],
    ])('reports a conflict for %s', (_description, entry) => {
      expect(save(entry)).toMatchObject({ success: false, conflict: true });
    });

    it.each([
      ['a new placeholder', { key: 'greet', value: 'Hello {user}' }, /user/],
      ['a new markup tag', { key: 'rich', value: 'Read {#em}this{/em}' }, /em/],
      ['unbalanced markup', { key: 'rich', value: 'Read {#strong}this' }, /strong/],
      ['crossed markup', { key: 'rich', value: '{#strong}a{#strong}b{/strong}' }, /strong/],
      ['a variant on a plain message', { variant: 'plural=one' }, /variants/],
      ['plain text over variants', { key: 'count' }, /variant/],
      ['a selector the message does not declare', { key: 'count', variant: 'gender=male' }, /gender/],
      ['an unreadable message shape', { key: 'legacy' }, /legacy/],
      ['an unknown key', { key: 'missing' }, /missing/],
      ['an unknown locale', { locale: 'fr' }, /fr/],
    ])('refuses %s', (_description, entry, reason) => {
      const before = [file('messages/en.json'), file('messages/pl.json'), file('shop/en.json')];

      const result = save(entry);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(reason);
      expect([file('messages/en.json'), file('messages/pl.json'), file('shop/en.json')]).toEqual(before);
    });

    it.each([
      ['a placeholder removed', { key: 'greet', value: 'Hello' }],
      ['escaped braces', { key: 'greet', value: 'Hello \\{name\\} {name}' }],
      ['a local variable', { key: 'count', variant: 'plural=one', value: '{plural} {count}' }],
      ['an unclosed brace, which is literal text', { key: 'greet', value: 'Hello {name} :{' }],
    ])('accepts %s', (_description, entry) => {
      expect(save(entry).success).toBe(true);
    });

    it('refuses a file with duplicate keys, where it cannot tell which one Paraglide uses', () => {
      writeFileSync(join(root, 'messages/pl.json'), '{"title": "A", "title": "B"}');

      expect(save({ locale: 'pl' })).toMatchObject({ success: false, error: expect.stringMatching(/duplicate/i) });
    });

    it('refuses to nest under a value that is text', () => {
      writeFileSync(join(root, 'messages/pl.json'), '{"nav": "Text"}');

      expect(save({ key: 'nav.home', locale: 'pl' })).toMatchObject({ success: false, error: expect.stringMatching(/nav/) });
      expect(file('messages/pl.json')).toBe('{"nav": "Text"}');
    });

    it('writes files that Paraglide compiles into the new messages', async () => {
      writeFileSync(join(root, 'messages/en.json'), EN.replace(',\r\n\t"legacy": [{ "unknown": true }, "second"]', ''));
      save({ key: 'greet', value: 'Hi {name}' });
      save({ key: 'count', locale: 'de', variant: 'plural=other', value: '{count} Dinge' });
      save({ key: 'nav.home', locale: 'de', value: 'Startseite' });
      const outdir = join(root, 'paraglide');

      await compile({ project, outdir, outputStructure: 'locale-modules', strategy: ['baseLocale'] });
      const script = `
        const { m } = await import(${JSON.stringify(pathToFileURL(join(outdir, 'messages.js')).href)});
        console.log(JSON.stringify([m.greet({ name: 'Ola' }), m.count({ count: 3 }, { locale: 'de' }), m['nav.home']({}, { locale: 'de' })]));
      `;
      const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });

      expect(existsSync(join(outdir, 'messages/de.js'))).toBe(true);
      expect(JSON.parse(output)).toEqual([
        'Hi Ola',
        '3 Dinge',
        'Startseite',
      ]);
    });
  });
});
