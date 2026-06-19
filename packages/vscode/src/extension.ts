import * as vscode from 'vscode';
import { getConfig, onConfigChange } from './services/configService';
import { LocaleScanner } from './services/localeScannerVscode';
import { TranslationStore } from './services/translationStore';
import { registerHoverProvider } from './features/hoverProvider';
import { registerCompletionProvider } from './features/completionProvider';
import { registerDefinitionProvider } from './features/definitionProvider';
import { registerReferenceProvider } from './features/referenceProvider';
import { DiagnosticsManager } from './features/diagnostics';
import { registerCreateKeyCommand } from './features/commands/createKey';
import { registerRenameKeyCommand } from './features/commands/renameKey';

const LANG_SELECTOR: vscode.DocumentSelector = [
  { scheme: 'file', language: 'typescript' },
  { scheme: 'file', language: 'typescriptreact' },
  { scheme: 'file', language: 'javascript' },
  { scheme: 'file', language: 'javascriptreact' },
  { scheme: 'file', language: 'vue' },
  { scheme: 'file', language: 'svelte' },
  { scheme: 'file', language: 'html' },
];

const JSON_SELECTOR: vscode.DocumentSelector = [
  { scheme: 'file', language: 'json' },
];

let store: TranslationStore;
let scanner: LocaleScanner;
let diagnostics: DiagnosticsManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const config = getConfig();
  store = new TranslationStore();
  scanner = new LocaleScanner(config, (files) => {
    store.update(files);
    diagnostics.refresh();
  });

  // Initial scan
  const files = await scanner.scan();
  store.update(files);

  // Start watching for changes
  scanner.startWatching();

  // Register providers
  registerHoverProvider(context, store, LANG_SELECTOR);
  registerCompletionProvider(context, store, LANG_SELECTOR);
  registerDefinitionProvider(context, store, LANG_SELECTOR);
  registerDefinitionProvider(context, store, JSON_SELECTOR);
  registerReferenceProvider(context, store, LANG_SELECTOR, config);

  // Diagnostics
  diagnostics = new DiagnosticsManager(store, config);
  diagnostics.refresh();

  // Commands
  await registerCreateKeyCommand(context, store);
  await registerRenameKeyCommand(context, store, config);

  // Watch for config changes
  context.subscriptions.push(
    onConfigChange((newConfig) => {
      scanner.updateConfig(newConfig);
      diagnostics = new DiagnosticsManager(store, newConfig);
      diagnostics.refresh();
    }),
  );

  // Dispose on deactivation
  context.subscriptions.push(store);
  context.subscriptions.push(scanner);
  context.subscriptions.push(diagnostics);
}

export function deactivate(): void {}