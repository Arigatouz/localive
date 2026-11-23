import MagicString from 'magic-string';
import { RUNTIME_BRIDGE_ID } from './runtime-bridge.js';

export interface TransformedModule {
  code: string;
  map: string | null;
}

export interface InstrumentOptions {
  isExcluded(key: string): boolean;
}

interface Node {
  type: string;
  start: number;
  end: number;
}

interface Identifier extends Node {
  name: string;
}

interface ModuleName extends Node {
  name?: string;
  value?: string;
}

interface Statement extends Node {
  source?: { value: unknown };
  specifiers?: { imported?: ModuleName; local: ModuleName; exported?: ModuleName }[];
  declaration?: Statement | null;
  declarations?: { id: Node; init: Node | null }[];
}

const MESSAGE_FILE = /(?:^\0virtual:paraglide\/[0-9a-f]+|[\\/])messages[\\/][^\\/]+\.js$/;

/**
 * Wraps every exported message of a compiled Paraglide module with `tag`, using its export name, which is the key.
 * Message modules are recognised by importing `getLocale` from the generated runtime; per-locale modules do not.
 */
export function instrumentMessageModule(
  code: string,
  id: string,
  parse: (code: string) => unknown,
  { isExcluded }: InstrumentOptions,
): TransformedModule | null {
  if (!MESSAGE_FILE.test(id.split('?')[0]) || !code.includes('getLocale')) return null;

  const statements = (parse(code) as { body: Statement[] }).body;
  const getLocale = findGetLocaleImport(statements);
  if (!getLocale) return null;

  const keysByBinding = findExportedKeys(statements);
  const source = new MagicString(code);
  for (const statement of statements) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type !== 'VariableDeclaration') continue;

    for (const { id: binding, init } of declaration.declarations ?? []) {
      const key = binding.type === 'Identifier' ? keysByBinding.get((binding as Identifier).name) : undefined;
      if (!init || key === undefined || isExcluded(key)) continue;
      source.appendLeft(init.start, `__localiveTag(${JSON.stringify(key)}, (`);
      source.appendRight(init.end, `), ${getLocale})`);
    }
  }
  if (!source.hasChanged()) return null;

  source.prepend(`import { tag as __localiveTag } from ${JSON.stringify(RUNTIME_BRIDGE_ID)};\n`);
  return { code: source.toString(), map: source.generateMap({ hires: true }).toString() };
}

function findGetLocaleImport(statements: Statement[]): string | undefined {
  for (const statement of statements) {
    const source = statement.source?.value;
    if (statement.type !== 'ImportDeclaration' || typeof source !== 'string' || !/(^|\/)runtime\.js$/.test(source)) continue;

    const specifier = statement.specifiers?.find((item) => moduleName(item.imported) === 'getLocale');
    if (specifier) return moduleName(specifier.local);
  }
  return undefined;
}

function findExportedKeys(statements: Statement[]): Map<string, string> {
  const keysByBinding = new Map<string, string>();
  for (const statement of statements) {
    if (statement.type !== 'ExportNamedDeclaration' || statement.source) continue;

    for (const { id } of statement.declaration?.declarations ?? []) {
      if (id.type === 'Identifier') keysByBinding.set((id as Identifier).name, (id as Identifier).name);
    }
    for (const specifier of statement.specifiers ?? []) {
      const local = moduleName(specifier.local);
      const exported = moduleName(specifier.exported);
      if (local !== undefined && exported !== undefined) keysByBinding.set(local, exported);
    }
  }
  return keysByBinding;
}

function moduleName(node: ModuleName | undefined): string | undefined {
  return node?.name ?? node?.value;
}
